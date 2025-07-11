"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useInvoiceContext } from "@/contexts/invoice-context"
import { useProjectContext } from "@/contexts/project-context"
import { useTaskContext } from "@/contexts/task-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, addDays } from "date-fns"
import { Trash2, Plus, FileText, User, CreditCard, Save, Eye, ArrowRight, ArrowLeft } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { InvoiceLineItem, Invoice } from "@/types/invoice"
import { toast } from "@/components/ui/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

// Validation schema
const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate must be a positive number"),
  amount: z.number(),
  taskId: z.string().optional(),
  discount: z.number().optional(),
  tax: z.number().optional(),
})

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  recipientInfo: z.object({
    id: z.string(),
    name: z.string().min(1, "Recipient name is required"),
    email: z.string().email("Valid email is required"),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }),
  }),
  projectId: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  taxRate: z.number().min(0).max(100),
  discount: z.number().min(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentDetails: z.string().optional(),
})

type InvoiceFormSchema = z.infer<typeof invoiceFormSchema>

interface InvoiceFormProps {
  clientId?: string
  projectId?: string
  invoice?: Invoice
  isEditing?: boolean
}

export function InvoiceForm({ clientId, projectId, invoice, isEditing = false }: InvoiceFormProps) {
  const router = useRouter()
  const { createInvoice, updateInvoice } = useInvoiceContext()
  const { projects } = useProjectContext()
  const { tasks } = useTaskContext()

  // Get clients from projects (in a real app, you'd have a separate clients context)
  const clients = useMemo(() => {
    return projects
      .filter((project) => project.clientId && project.client) // Filter out projects without client info
      .map((project) => ({
        id: project.clientId,
        name: project.client,
      }))
      .filter((client, index, self) => 
        // Remove duplicates based on ID
        index === self.findIndex(c => c.id === client.id)
      )
      .filter((client) => client.id && client.id.trim() !== "" && client.name && client.name.trim() !== "") // Ensure no empty values
  }, [projects])

  const [today, setToday] = useState<Date>(new Date())
  const [defaultDueDate, setDefaultDueDate] = useState<Date>(addDays(new Date(), 14))
  
  // Set dates on the client side only
  useEffect(() => {
    const currentDate = new Date()
    setToday(currentDate)
    setDefaultDueDate(addDays(currentDate, 14)) // Default due date is 2 weeks from today
  }, [])

  const [activeTab, setActiveTab] = useState("details")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saveAsDraft, setSaveAsDraft] = useState(false)
  const [formProgress, setFormProgress] = useState(0)
  const prevClientIdRef = useRef<string>()

  // Initialize form with default values or existing invoice data
  const defaultValues = invoice
    ? {
        clientId: invoice.clientId,
        recipientInfo: invoice.recipientInfo,
        projectId: invoice.projectId || "",
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        lineItems: invoice.lineItems,
        taxRate: invoice.taxRate,
        discount: invoice.discount,
        notes: invoice.notes || "",
        terms: invoice.terms || "",
        paymentMethod: invoice.paymentMethod || "",
        paymentDetails: invoice.paymentDetails || "",
      }
    : {
        clientId: clientId || "",
        recipientInfo: {
          id: "",
          name: "",
          email: "",
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
        },
        projectId: projectId || "",
        issueDate: format(today, "yyyy-MM-dd"),
        dueDate: format(defaultDueDate, "yyyy-MM-dd"),
        lineItems: [],
        taxRate: 10, // Default tax rate
        discount: 0,
        notes: "",
        terms: "Payment due within 14 days of receipt.",
        paymentMethod: "",
        paymentDetails: "",
      }

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<InvoiceFormSchema>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
    mode: "onChange",
  })

  const formValues = watch()

  // Update form progress based on filled fields
  useEffect(() => {
    const requiredFields = [
      !!formValues.clientId,
      !!formValues.recipientInfo.name,
      !!formValues.recipientInfo.email,
      formValues.lineItems.length > 0,
      formValues.lineItems.every((item) => !!item.description && item.quantity > 0),
    ]

    const completedFields = requiredFields.filter(Boolean).length
    const progress = Math.round((completedFields / requiredFields.length) * 100)
    setFormProgress(progress)
  }, [formValues])

  // Update recipient info when client changes
  useEffect(() => {
    if (formValues.clientId && !isEditing && formValues.clientId !== prevClientIdRef.current) {
      const selectedClient = clients.find((client) => client.id === formValues.clientId)
      if (selectedClient) {
        setValue("recipientInfo", {
          ...formValues.recipientInfo,
          id: selectedClient.id,
          name: selectedClient.name,
        })
      }
      prevClientIdRef.current = formValues.clientId
    }
  }, [formValues.clientId, clients, setValue, isEditing])

  // Calculate totals
  const subtotal = formValues.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const taxAmount = (subtotal * formValues.taxRate) / 100
  const total = subtotal + taxAmount - formValues.discount

  // Filter projects by selected client
  const clientProjects = useMemo(() => {
    return projects.filter((project) => project.clientId === formValues.clientId)
  }, [projects, formValues.clientId])

  // Filter tasks by selected project
  const projectTasks = useMemo(() => {
    return tasks.filter((task) => task.projectId === formValues.projectId)
  }, [tasks, formValues.projectId])

  // Handle adding a new line item
  const handleAddLineItem = () => {
    const newLineItem: InvoiceLineItem = {
      id: uuidv4(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }
    setValue("lineItems", [...formValues.lineItems, newLineItem])
  }

  // Handle removing a line item
  const handleRemoveLineItem = (id: string) => {
    setValue(
      "lineItems",
      formValues.lineItems.filter((item) => item.id !== id),
    )
  }

  // Handle line item changes
  const handleLineItemChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setValue(
      "lineItems",
      formValues.lineItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // Recalculate amount if quantity or rate changes
          if (field === "quantity" || field === "rate") {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  // Handle task selection for a line item
  const handleTaskSelection = (lineItemId: string, taskId: string) => {
    if (taskId === "no-task") {
      handleLineItemChange(lineItemId, "taskId", undefined)
      return
    }

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Update the line item with task details
    handleLineItemChange(lineItemId, "description", task.name)
    handleLineItemChange(lineItemId, "taskId", taskId)
  }

  // Handle form submission
  const onSubmit = (data: InvoiceFormSchema) => {
    try {
      if (isEditing && invoice) {
        const updatedInvoice = updateInvoice(invoice.id, {
          ...data,
          status: saveAsDraft ? "draft" : invoice.status,
        })
        toast({
          title: "Success",
          description: `Invoice ${updatedInvoice?.invoiceNumber} updated successfully.`,
        })
        router.push(`/dashboard/invoices/${invoice.id}`)
      } else {
        const newInvoice = createInvoice({
          ...data,
          status: saveAsDraft ? "draft" : "sent",
        })
        toast({
          title: "Success",
          description: `Invoice ${newInvoice.invoiceNumber} created successfully.`,
        })
        router.push(`/dashboard/invoices/${newInvoice.id}`)
      }
    } catch (error) {
      console.error("Error saving invoice:", error)
      toast({
        title: "Error",
        description: "Failed to save invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle saving as draft
  const handleSaveAsDraft = () => {
    setSaveAsDraft(true)
    handleSubmit(onSubmit)()
  }

  // Handle navigation between tabs
  const handleNextTab = () => {
    if (activeTab === "details") setActiveTab("recipient")
    else if (activeTab === "recipient") setActiveTab("items")
    else if (activeTab === "items") setActiveTab("payment")
  }

  const handlePrevTab = () => {
    if (activeTab === "payment") setActiveTab("items")
    else if (activeTab === "items") setActiveTab("recipient")
    else if (activeTab === "recipient") setActiveTab("details")
  }

  // Invoice preview component
  const InvoicePreview = () => (
    <div className="p-6 bg-white rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold">INVOICE</h2>
          <p className="text-gray-500">{isEditing && invoice ? invoice.invoiceNumber : "Draft Invoice"}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">Your Company Name</p>
          <p>123 Business Street</p>
          <p>City, State ZIP</p>
          <p>contact@yourcompany.com</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold mb-2">Bill To:</h3>
          <p className="font-medium">{formValues.recipientInfo.name}</p>
          <p>{formValues.recipientInfo.email}</p>
          {formValues.recipientInfo.address.street && <p>{formValues.recipientInfo.address.street}</p>}
          {(formValues.recipientInfo.address.city || formValues.recipientInfo.address.state) && (
            <p>
              {formValues.recipientInfo.address.city}
              {formValues.recipientInfo.address.city && formValues.recipientInfo.address.state
                ? `, ${formValues.recipientInfo.address.state}`
                : formValues.recipientInfo.address.state}
              {formValues.recipientInfo.address.zipCode && ` ${formValues.recipientInfo.address.zipCode}`}
            </p>
          )}
          {formValues.recipientInfo.address.country && <p>{formValues.recipientInfo.address.country}</p>}
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="font-bold">Invoice Date:</span> {formValues.issueDate ? format(new Date(formValues.issueDate), "MMMM d, yyyy") : "Not set"}
          </div>
          <div className="mb-2">
            <span className="font-bold">Due Date:</span> {formValues.dueDate ? format(new Date(formValues.dueDate), "MMMM d, yyyy") : "No due date"}
          </div>
          {formValues.projectId && (
            <div className="mb-2">
              <span className="font-bold">Project:</span>{" "}
              {clientProjects.find((p) => p.id === formValues.projectId)?.name || "N/A"}
            </div>
          )}
        </div>
      </div>

      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-left py-2">Description</th>
            <th className="text-center py-2">Quantity</th>
            <th className="text-right py-2">Rate</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {formValues.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-3">{item.description}</td>
              <td className="text-center py-3">{item.quantity}</td>
              <td className="text-right py-3">${item.rate.toFixed(2)}</td>
              <td className="text-right py-3">${item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Tax ({formValues.taxRate}%):</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          {formValues.discount > 0 && (
            <div className="flex justify-between py-2">
              <span>Discount:</span>
              <span>-${formValues.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 font-bold border-t border-gray-300 mt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {formValues.notes && (
        <div className="mb-6">
          <h3 className="font-bold mb-2">Notes:</h3>
          <p className="text-gray-700">{formValues.notes}</p>
        </div>
      )}

      {formValues.terms && (
        <div className="mb-6">
          <h3 className="font-bold mb-2">Terms and Conditions:</h3>
          <p className="text-gray-700">{formValues.terms}</p>
        </div>
      )}

      {formValues.paymentMethod && (
        <div>
          <h3 className="font-bold mb-2">Payment Method:</h3>
          <p className="text-gray-700">
            {formValues.paymentMethod === "bank-transfer"
              ? "Bank Transfer"
              : formValues.paymentMethod === "credit-card"
                ? "Credit Card"
                : formValues.paymentMethod === "paypal"
                  ? "PayPal"
                  : formValues.paymentMethod === "check"
                    ? "Check"
                    : formValues.paymentMethod === "cash"
                      ? "Cash"
                      : formValues.paymentMethod}
          </p>
          {formValues.paymentDetails && <p className="text-gray-700">{formValues.paymentDetails}</p>}
        </div>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{isEditing ? "Edit Invoice" : "Create New Invoice"}</CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <Progress value={formProgress} className="h-2 w-[100px]" />
              <span className="text-xs text-muted-foreground">{formProgress}% complete</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" type="button">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <InvoicePreview />
              </DialogContent>
            </Dialog>
            <Button variant="outline" type="button" onClick={handleSaveAsDraft} disabled={!isValid || !isDirty}>
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Basic Details</span>
                <span className="sm:hidden">Details</span>
              </TabsTrigger>
              <TabsTrigger value="recipient">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Recipient</span>
                <span className="sm:hidden">To</span>
              </TabsTrigger>
              <TabsTrigger value="items">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Line Items</span>
                <span className="sm:hidden">Items</span>
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Payment Details</span>
                <span className="sm:hidden">Payment</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Details Tab */}
            <TabsContent value="details" className="space-y-6">
              {/* Client and Project Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="client">
                    Client <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={isEditing}>
                        <SelectTrigger id="client">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.clientId && <p className="text-sm text-red-500 mt-1">{errors.clientId.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Controller
                    name="projectId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!formValues.clientId}>
                        <SelectTrigger id="project">
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-project">No Project</SelectItem>
                          {clientProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* Invoice Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>
                    Issue Date <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="issueDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                      />
                    )}
                  />
                  {errors.issueDate && <p className="text-sm text-red-500 mt-1">{errors.issueDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        minDate={formValues.issueDate ? new Date(formValues.issueDate) : undefined}
                      />
                    )}
                  />
                  {errors.dueDate && <p className="text-sm text-red-500 mt-1">{errors.dueDate.message}</p>}
                </div>
              </div>

              {/* Notes and Terms */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea {...field} placeholder="Additional notes to display on the invoice..." rows={3} />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms and Conditions</Label>
                <Controller
                  name="terms"
                  control={control}
                  render={({ field }) => <Textarea {...field} placeholder="Payment terms and conditions..." rows={3} />}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="button" onClick={handleNextTab}>
                  Next: Recipient Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Recipient Tab */}
            <TabsContent value="recipient" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">
                    Recipient Name <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="recipientInfo.name"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Company or individual name" />}
                  />
                  {errors.recipientInfo?.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.recipientInfo.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient-email">
                    Recipient Email <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="recipientInfo.email"
                    control={control}
                    render={({ field }) => <Input {...field} type="email" placeholder="billing@example.com" />}
                  />
                  {errors.recipientInfo?.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.recipientInfo.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Controller
                  name="recipientInfo.address.street"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="123 Main St" />}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Controller
                    name="recipientInfo.address.city"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="City" />}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Controller
                    name="recipientInfo.address.state"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="State" />}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip/Postal Code</Label>
                  <Controller
                    name="recipientInfo.address.zipCode"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Zip Code" />}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Controller
                  name="recipientInfo.address.country"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="Country" />}
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={handlePrevTab}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  Next: Line Items
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Line Items Tab */}
            <TabsContent value="items" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Line Items <span className="text-red-500">*</span>
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {formValues.lineItems.length === 0 ? (
                  <div className="text-center py-8 border rounded-md bg-muted/20">
                    <p className="text-muted-foreground">No items added yet.</p>
                    <Button type="button" variant="outline" className="mt-4" onClick={handleAddLineItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header row for desktop */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 bg-muted/30 rounded-md">
                      <div className="col-span-5 font-medium">Description</div>
                      {formValues.projectId && <div className="col-span-2 font-medium">Task</div>}
                      <div className="col-span-1 font-medium text-center">Qty</div>
                      <div className="col-span-2 font-medium text-center">Rate</div>
                      <div className="col-span-2 font-medium text-center">Amount</div>
                      <div className="col-span-1"></div>
                    </div>

                    {formValues.lineItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border rounded-md p-4"
                      >
                        <div className="col-span-1 md:col-span-5 space-y-2">
                          <Label htmlFor={`item-desc-${index}`} className="md:hidden">
                            Description
                          </Label>
                          <Input
                            id={`item-desc-${index}`}
                            value={item.description}
                            onChange={(e) => handleLineItemChange(item.id, "description", e.target.value)}
                            placeholder="Item description"
                            required
                          />
                          {errors.lineItems?.[index]?.description && (
                            <p className="text-sm text-red-500 mt-1">{errors.lineItems[index]?.description?.message}</p>
                          )}
                        </div>

                        {formValues.projectId && (
                          <div className="col-span-1 md:col-span-2 space-y-2">
                            <Label htmlFor={`item-task-${index}`} className="md:hidden">
                              Related Task
                            </Label>
                            <Select
                              value={item.taskId || "no-task"}
                              onValueChange={(value) => handleTaskSelection(item.id, value)}
                            >
                              <SelectTrigger id={`item-task-${index}`}>
                                <SelectValue placeholder="Select a task" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no-task">No Task</SelectItem>
                                {projectTasks.map((task) => (
                                  <SelectItem key={task.id} value={task.id}>
                                    {task.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="col-span-1 md:col-span-1 space-y-2">
                          <Label htmlFor={`item-qty-${index}`} className="md:hidden">
                            Quantity
                          </Label>
                          <Input
                            id={`item-qty-${index}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(item.id, "quantity", Number(e.target.value))}
                            required
                            className="text-center"
                          />
                          {errors.lineItems?.[index]?.quantity && (
                            <p className="text-sm text-red-500 mt-1">{errors.lineItems[index]?.quantity?.message}</p>
                          )}
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                          <Label htmlFor={`item-rate-${index}`} className="md:hidden">
                            Rate
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
                            <Input
                              id={`item-rate-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => handleLineItemChange(item.id, "rate", Number(e.target.value))}
                              required
                              className="pl-6 text-center"
                            />
                          </div>
                          {errors.lineItems?.[index]?.rate && (
                            <p className="text-sm text-red-500 mt-1">{errors.lineItems[index]?.rate?.message}</p>
                          )}
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2">
                          <Label className="md:hidden">Amount</Label>
                          <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 text-center">
                            ${item.amount.toFixed(2)}
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLineItem(item.id)}
                            disabled={formValues.lineItems.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {errors.lineItems && <p className="text-sm text-red-500 mt-1">{errors.lineItems.message}</p>}

                {/* Totals */}
                <div className="mt-6 space-y-4 bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label htmlFor="tax-rate" className="text-muted-foreground">
                      Tax Rate:
                    </Label>
                    <div className="flex items-center">
                      <Controller
                        name="taxRate"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-20"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        )}
                      />
                      <span className="ml-2">%</span>
                    </div>
                    <span className="ml-auto">${taxAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label htmlFor="discount" className="text-muted-foreground">
                      Discount:
                    </Label>
                    <div className="flex items-center">
                      <span className="mr-2">$</span>
                      <Controller
                        name="discount"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-24"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-2 mt-2 flex justify-between items-center font-medium">
                    <span>Total:</span>
                    <span className="text-lg">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={handlePrevTab}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="button" onClick={handleNextTab}>
                  Next: Payment Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Payment Details Tab */}
            <TabsContent value="payment" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                          <SelectItem value="credit-card">Credit Card</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-details">Payment Instructions</Label>
                  <Controller
                    name="paymentDetails"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        placeholder="Bank account details, PayPal email, or other payment instructions..."
                        rows={3}
                      />
                    )}
                  />
                </div>

                {/* Invoice Summary */}
                <div className="mt-6 p-4 border rounded-md bg-muted/20">
                  <h3 className="font-medium text-lg mb-4">Invoice Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-medium">
                        {clients.find((c) => c.id === formValues.clientId)?.name || "Not selected"}
                      </span>
                    </div>
                    {formValues.projectId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project:</span>
                        <span className="font-medium">
                          {clientProjects.find((p) => p.id === formValues.projectId)?.name || "None"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{formValues.issueDate ? format(new Date(formValues.issueDate), "MMM d, yyyy") : "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{formValues.dueDate ? format(new Date(formValues.dueDate), "MMM d, yyyy") : "No due date"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items:</span>
                      <span>{formValues.lineItems.length}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Amount:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Switch id="save-as-draft" checked={saveAsDraft} onCheckedChange={setSaveAsDraft} />
                  <Label htmlFor="save-as-draft">Save as draft</Label>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={handlePrevTab}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={!isValid}>
                  {isEditing ? "Update" : "Create"} Invoice
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleSaveAsDraft} disabled={!isValid || !isDirty}>
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button type="submit" disabled={!isValid}>
              {isEditing ? "Update" : "Create"} Invoice
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}
