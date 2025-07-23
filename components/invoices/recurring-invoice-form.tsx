"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRecurringInvoiceContext } from "@/contexts/recurring-invoice-context"
import { useProjectContext } from "@/contexts/project-context"
import { useTaskContext } from "@/contexts/task-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { format, addDays } from "date-fns"
import { Trash2, Plus, AlertCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import type { LineItem } from "@/types/invoice"
import type { RecurringInvoiceFormData } from "@/types/recurring-invoice"
import { toast } from "@/components/ui/use-toast"

interface RecurringInvoiceFormProps {
  clientId?: string
  projectId?: string
}

export function RecurringInvoiceForm({ clientId, projectId }: RecurringInvoiceFormProps) {
  const router = useRouter()
  const { createRecurringInvoice } = useRecurringInvoiceContext()
  const { projects } = useProjectContext()
  const { tasks } = useTaskContext()

  // Get clients from projects (in a real app, you'd have a separate clients context)
  const clients = Array.from(
    new Set(
      projects.map((project) => ({
        id: project.client_id,
        name: project.client_name,
      })),
    ),
    (client) => JSON.stringify(client),
  ).map((client) => JSON.parse(client))

  const [today, setToday] = useState<Date | undefined>(undefined)
  const [defaultStartDate, setDefaultStartDate] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState<RecurringInvoiceFormData>({
    name: "",
    clientId: clientId || "",
    projectId: projectId || "",
    description: "",
    recurrenceInterval: "monthly",
    startDate: "", // Initialize with empty string
    taxRate: 10, // Default tax rate
    discount: 0,
    notes: "",
    lineItems: [],
  })

  // Set dates on the client side only
  useEffect(() => {
    const currentDate = new Date()
    setToday(currentDate)
    const startDate = addDays(currentDate, 1) // Default start date is tomorrow
    setDefaultStartDate(startDate)

    // Update formData with the formatted date
    setFormData(prev => ({
      ...prev,
      startDate: format(startDate, "yyyy-MM-dd")
    }))
  }, [])

  const [showCustomDays, setShowCustomDays] = useState(false)

  // Calculate totals
  const subtotal = formData.lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = (subtotal * formData.taxRate) / 100
  const total = subtotal + taxAmount - formData.discount

  // Filter projects by selected client
  const clientProjects = projects.filter((project) => project.client_id === formData.clientId)

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

  // Handle recurrence interval change
  const handleIntervalChange = (interval: string) => {
    setFormData({
      ...formData,
      recurrenceInterval: interval as any,
      customDays: interval === "custom" ? 30 : undefined, // Default to 30 days for custom interval
    })
    setShowCustomDays(interval === "custom")
  }

  // Handle adding a new line item
  const handleAddLineItem = () => {
    const newLineItem: LineItem = {
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
  const handleLineItemChange = (id: string, field: keyof LineItem, value: any) => {
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
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    // Update the line item with task details
    handleLineItemChange(lineItemId, "description", task.name)
    handleLineItemChange(lineItemId, "taskId", taskId)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name.",
        variant: "destructive",
      })
      return
    }

    if (formData.lineItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one line item to the template.",
        variant: "destructive",
      })
      return
    }

    try {
      const newTemplate = createRecurringInvoice(formData)
      toast({
        title: "Success",
        description: `Recurring invoice template "${newTemplate.name}" created successfully.`,
      })
      router.push(`/dashboard/invoices/recurring/${newTemplate.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create recurring invoice template. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Create Recurring Invoice Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Name and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monthly Maintenance"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this recurring invoice"
                required
              />
            </div>
          </div>

          {/* Client and Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
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

          {/* Recurrence Settings */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-medium">Recurrence Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="interval">Recurrence Interval</Label>
                <Select value={formData.recurrenceInterval} onValueChange={handleIntervalChange} required>
                  <SelectTrigger id="interval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="custom">Custom Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showCustomDays && (
                <div className="space-y-2">
                  <Label htmlFor="customDays">Days Between Invoices</Label>
                  <Input
                    id="customDays"
                    type="number"
                    min="1"
                    value={formData.customDays || 30}
                    onChange={(e) => setFormData({ ...formData, customDays: Number(e.target.value) })}
                    required={showCustomDays}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  selected={formData.startDate ? new Date(formData.startDate) : defaultStartDate}
                  onSelect={(date) => date && setFormData({ ...formData, startDate: format(date, "yyyy-MM-dd") })}
                />
                <p className="text-sm text-muted-foreground">First invoice will be generated on this date</p>
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <DatePicker
                  selected={formData.endDate ? new Date(formData.endDate) : undefined}
                  onSelect={(date) => setFormData({ ...formData, endDate: date ? format(date, "yyyy-MM-dd") : "" })}
                />
                <p className="text-sm text-muted-foreground">Leave blank for indefinite recurrence</p>
              </div>
            </div>

            <div className="flex items-center mt-4 text-sm text-amber-600 bg-amber-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p>Invoices will be automatically generated according to this schedule when you activate the template.</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {formData.lineItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No items added yet. Click "Add Item" to add your first line item.
              </div>
            ) : (
              <div className="space-y-4">
                {formData.lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-end border-b pb-4">
                    <div className="col-span-12 md:col-span-5 space-y-2">
                      <Label htmlFor={`item-desc-${index}`}>Description</Label>
                      <Input
                        id={`item-desc-${index}`}
                        value={item.description}
                        onChange={(e) => handleLineItemChange(item.id, "description", e.target.value)}
                        placeholder="Item description"
                        required
                      />
                    </div>

                    {formData.projectId && (
                      <div className="col-span-12 md:col-span-3 space-y-2">
                        <Label htmlFor={`item-task-${index}`}>Related Task</Label>
                        <Select
                          value={item.taskId || ""}
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

                    <div className="col-span-4 md:col-span-1 space-y-2">
                      <Label htmlFor={`item-qty-${index}`}>Qty</Label>
                      <Input
                        id={`item-qty-${index}`}
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(item.id, "quantity", Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="col-span-4 md:col-span-1 space-y-2">
                      <Label htmlFor={`item-rate-${index}`}>Rate</Label>
                      <Input
                        id={`item-rate-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleLineItemChange(item.id, "rate", Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="col-span-3 md:col-span-1 space-y-2">
                      <Label>Amount</Label>
                      <div className="h-10 px-3 py-2 rounded-md border bg-muted/50">${item.amount.toFixed(2)}</div>
                    </div>

                    <div className="col-span-1 flex justify-end">
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLineItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Remove item</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or payment instructions..."
                  rows={4}
                />
              </div>
            </div>

            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
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
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit">Create Template</Button>
        </CardFooter>
      </Card>
    </form>
  )
}
