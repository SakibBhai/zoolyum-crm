"use client"

import { useState, useEffect } from "react"
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
import { Trash2, Plus, FileText, User, CreditCard } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { InvoiceLineItem, InvoiceFormData, InvoiceRecipient } from "@/types/invoice"
import { toast } from "@/components/ui/use-toast"

// Add these imports at the top of the file
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

// Add this validation schema after the imports
const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
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
}

export function InvoiceForm({ clientId, projectId }: InvoiceFormProps) {
  const router = useRouter()
  const { createInvoice } = useInvoiceContext()
  const { projects } = useProjectContext()
  const { tasks } = useTaskContext()

  // Get clients from projects (in a real app, you'd have a separate clients context)
  const clients = Array.from(
    new Set(
      projects.map((project) => ({
        id: project.clientId,
        name: project.clientName,
      })),
    ),
    (client) => JSON.stringify(client),
  ).map((client) => JSON.parse(client))

  const today = new Date()
  const defaultDueDate = addDays(today, 14) // Default due date is 2 weeks from today

  const [activeTab, setActiveTab] = useState("details")
  const [formData, setFormData] = useState<InvoiceFormData>({
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
  })

  // Update recipient info when client changes
  useEffect(() => {
    if (formData.clientId) {
      const selectedClient = clients.find((client) => client.id === formData.clientId)
      if (selectedClient) {
        setFormData((prev) => ({
          ...prev,
          recipientInfo: {
            ...prev.recipientInfo,
            id: selectedClient.id,
            name: selectedClient.name,
          },
        }))
      }
    }
  }, [formData.clientId, clients])

  // Calculate totals
  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = (subtotal * formData.taxRate) / 100
  const total = subtotal + taxAmount - formData.discount

  // Filter projects by selected client
  const clientProjects = projects.filter((project) => project.clientId === formData.clientId)

  // Filter tasks by selected project
  const projectTasks = tasks.filter((task) => task.projectId === formData.projectId)

  // Handle client change
  const handleClientChange = (clientId: string) => {
    setFormData({
      ...formData,
      clientId,
      projectId: "", // Reset project when client changes
    })
  }

  // Handle recipient info change
  const handleRecipientChange = (field: keyof InvoiceRecipient, value: string) => {
    setFormData({
      ...formData,
      recipientInfo: {
        ...formData.recipientInfo,
        [field]: value,
      },
    })
  }

  // Handle recipient address change
  const handleAddressChange = (field: keyof InvoiceRecipient["address"], value: string) => {
    setFormData({
      ...formData,
      recipientInfo: {
        ...formData.recipientInfo,
        address: {
          ...formData.recipientInfo.address,
          [field]: value,
        },
      },
    })
  }

  // Handle adding a new line item
  const handleAddLineItem = () => {
    const newLineItem: InvoiceLineItem = {
      id: uuidv4(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    }
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, newLineItem],
    })
  }

  // Handle removing a line item
  const handleRemoveLineItem = (id: string) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((item) => item.id !== id),
    })
  }

  // Handle line item changes
  const handleLineItemChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.map((item) => {
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
    })
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
  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault()

  //   if (formData.lineItems.length === 0) {
  //     toast({
  //       title: "Error",
  //       description: "Please add at least one line item to the invoice.",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   if (!formData.recipientInfo.name || !formData.recipientInfo.email) {
  //     toast({
  //       title: "Error",
  //       description: "Please provide recipient name and email.",
  //       variant: "destructive",
  //     })
  //     setActiveTab("recipient")
  //     return
  //   }

  //   try {
  //     const newInvoice = createInvoice(formData)
  //     toast({
  //       title: "Success",
  //       description: `Invoice ${newInvoice.invoiceNumber} created successfully.`,
  //     })
  //     router.push(`/dashboard/invoices/${newInvoice.id}`)
  //   } catch (error) {
  //     toast({
  //       title: "Error",
  //       description: "Failed to create invoice. Please try again.",
  //       variant: "destructive",
  //     })
  //   }
  // }

  // Update the handleSubmit function to use the validation schema
  const handleSubmit = (data: InvoiceFormSchema) => {
    try {
      const newInvoice = createInvoice(data)
      toast({
        title: "Success",
        description: `Invoice ${newInvoice.invoiceNumber} created successfully.`,
      })
      router.push(`/dashboard/invoices/${newInvoice.id}`)
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Replace the existing form submission handler with this
  const form = useForm<InvoiceFormSchema>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
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
      taxRate: 10,
      discount: 0,
      notes: "",
      terms: "Payment due within 14 days of receipt.",
      paymentMethod: "",
      paymentDetails: "",
    },
  })

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Create New Invoice</CardTitle>
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
                  <Label htmlFor="client">Client *</Label>
                  <Select value={formData.clientId} onValueChange={handleClientChange} required>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                    disabled={!formData.clientId}
                  >
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
                </div>
              </div>

              {/* Invoice Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Issue Date *</Label>
                  <DatePicker
                    selected={new Date(formData.issueDate)}
                    onSelect={(date) => setFormData({ ...formData, issueDate: format(date, "yyyy-MM-dd") })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <DatePicker
                    selected={new Date(formData.dueDate)}
                    onSelect={(date) => setFormData({ ...formData, dueDate: format(date, "yyyy-MM-dd") })}
                  />
                </div>
              </div>

              {/* Notes and Terms */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes to display on the invoice..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms and Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Payment terms and conditions..."
                  rows={3}
                />
              </div>

              <div className="pt-2">
                <Button type="button" onClick={() => setActiveTab("recipient")}>
                  Next: Recipient Details
                </Button>
              </div>
            </TabsContent>

            {/* Recipient Tab */}
            <TabsContent value="recipient" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">Recipient Name *</Label>
                  <Input
                    id="recipient-name"
                    value={formData.recipientInfo.name}
                    onChange={(e) => handleRecipientChange("name", e.target.value)}
                    placeholder="Company or individual name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient-email">Recipient Email *</Label>
                  <Input
                    id="recipient-email"
                    type="email"
                    value={formData.recipientInfo.email}
                    onChange={(e) => handleRecipientChange("email", e.target.value)}
                    placeholder="billing@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.recipientInfo.address.street}
                  onChange={(e) => handleAddressChange("street", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.recipientInfo.address.city}
                    onChange={(e) => handleAddressChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.recipientInfo.address.state}
                    onChange={(e) => handleAddressChange("state", e.target.value)}
                    placeholder="State"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip/Postal Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.recipientInfo.address.zipCode}
                    onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                    placeholder="Zip Code"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.recipientInfo.address.country}
                  onChange={(e) => handleAddressChange("country", e.target.value)}
                  placeholder="Country"
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveTab("items")}>
                  Next: Line Items
                </Button>
              </div>
            </TabsContent>

            {/* Line Items Tab */}
            <TabsContent value="items" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Line Items *</h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {formData.lineItems.length === 0 ? (
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
                      {formData.projectId && <div className="col-span-2 font-medium">Task</div>}
                      <div className="col-span-1 font-medium text-center">Qty</div>
                      <div className="col-span-2 font-medium text-center">Rate</div>
                      <div className="col-span-2 font-medium text-center">Amount</div>
                      <div className="col-span-1"></div>
                    </div>

                    {formData.lineItems.map((item, index) => (
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
                        </div>

                        {formData.projectId && (
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
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(item.id, "quantity", Number(e.target.value))}
                            required
                            className="text-center"
                          />
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
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Remove item</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
                      <Input
                        id="tax-rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                        className="w-20"
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
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                        className="w-24"
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
                <Button type="button" variant="outline" onClick={() => setActiveTab("recipient")}>
                  Back
                </Button>
                <Button type="button" onClick={() => setActiveTab("payment")}>
                  Next: Payment Details
                </Button>
              </div>
            </TabsContent>

            {/* Payment Details Tab */}
            <TabsContent value="payment" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod || ""}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-details">Payment Instructions</Label>
                  <Textarea
                    id="payment-details"
                    value={formData.paymentDetails || ""}
                    onChange={(e) => setFormData({ ...formData, paymentDetails: e.target.value })}
                    placeholder="Bank account details, PayPal email, or other payment instructions..."
                    rows={3}
                  />
                </div>

                {/* Invoice Summary */}
                <div className="mt-6 p-4 border rounded-md bg-muted/20">
                  <h3 className="font-medium text-lg mb-4">Invoice Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-medium">{formData.recipientInfo.name || "Not selected"}</span>
                    </div>
                    {formData.projectId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project:</span>
                        <span className="font-medium">
                          {clientProjects.find((p) => p.id === formData.projectId)?.name || "None"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{format(new Date(formData.issueDate), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{format(new Date(formData.dueDate), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items:</span>
                      <span>{formData.lineItems.length}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Total Amount:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab("items")}>
                  Back
                </Button>
                <Button type="submit">Create Invoice</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">Create Invoice</Button>
        </CardFooter>
      </Card>
    </form>
  )
}
