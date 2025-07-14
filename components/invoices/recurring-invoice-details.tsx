"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRecurringInvoiceContext } from "@/contexts/recurring-invoice-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Calendar, Clock, FileText, Trash2, Edit, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface RecurringInvoiceDetailsProps {
  id: string
}

export function RecurringInvoiceDetails({ id }: RecurringInvoiceDetailsProps) {
  const router = useRouter()
  const { getRecurringInvoice, toggleRecurringInvoiceStatus, deleteRecurringInvoice, generateInvoiceFromTemplate } =
    useRecurringInvoiceContext()
  const [activeTab, setActiveTab] = useState("details")

  const template = getRecurringInvoice(id)

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Recurring invoice template not found.</p>
      </div>
    )
  }

  // Calculate totals
  const subtotal = template.lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = (subtotal * template.taxRate) / 100
  const total = subtotal + taxAmount - template.discount

  // Format recurrence interval for display
  const formatRecurrenceInterval = (interval: string, customDays?: number) => {
    switch (interval) {
      case "weekly":
        return "Weekly"
      case "monthly":
        return "Monthly"
      case "quarterly":
        return "Quarterly"
      case "yearly":
        return "Yearly"
      case "custom":
        return `Every ${customDays} days`
      default:
        return interval
    }
  }

  // Handle toggle active status
  const handleToggleStatus = () => {
    const updatedTemplate = toggleRecurringInvoiceStatus(id)
    if (updatedTemplate) {
      toast({
        title: updatedTemplate.active ? "Template Activated" : "Template Deactivated",
        description: `"${updatedTemplate.name}" has been ${updatedTemplate.active ? "activated" : "deactivated"}.`,
      })
    }
  }

  // Handle delete template
  const handleDelete = () => {
    deleteRecurringInvoice(id)
    toast({
      title: "Template Deleted",
      description: `"${template.name}" has been deleted.`,
    })
    router.push("/dashboard/invoices/recurring")
  }

  // Handle generate invoice
  const handleGenerateInvoice = () => {
    generateInvoiceFromTemplate(id)
    toast({
      title: "Invoice Generated",
      description: `A new invoice has been generated from template "${template.name}".`,
    })
  }

  // Use state to handle date on client side only
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined)
  
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  // Check if next generation date is today or in the past (only if currentDate is available)
  const isOverdue = currentDate ? new Date(template.nextGenerationDate) <= currentDate : false

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{template.name}</h2>
          <p className="text-muted-foreground">{template.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Active</span>
            <Switch checked={template.active} onCheckedChange={handleToggleStatus} />
          </div>
          <Button variant="outline" onClick={handleGenerateInvoice}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Invoice Now
          </Button>
          <Button variant="outline" asChild>
            <a href={`/dashboard/invoices/recurring/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </a>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the recurring invoice template "{template.name}". This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="items">Line Items</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Client</h3>
                  <p>{template.clientName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Project</h3>
                  <p>{template.projectName || "No project"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                  <p>{template.createdAt ? format(new Date(template.createdAt), "MMMM d, yyyy") : "Unknown date"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p>{template.updatedAt ? format(new Date(template.updatedAt), "MMMM d, yyyy") : "Unknown date"}</p>
                </div>
              </div>

              {template.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="whitespace-pre-line">{template.notes}</p>
                </div>
              )}

              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({template.taxRate}%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                {template.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>-${template.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Recurrence Interval</h3>
                  <p>{formatRecurrenceInterval(template.recurrenceInterval, template.customDays)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge className={template.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {template.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Next Invoice Date</h3>
                  <div className="flex items-center">
                    {isOverdue && template.active && <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />}
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{template.nextGenerationDate ? format(new Date(template.nextGenerationDate), "MMMM d, yyyy") : "Not scheduled"}</span>
                    {isOverdue && template.active && (
                      <Badge variant="outline" className="ml-2 text-amber-500 border-amber-200 bg-amber-50">
                        Due now
                      </Badge>
                    )}
                  </div>
                </div>
                {template.lastGeneratedDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Generated</h3>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{template.lastGeneratedDate ? format(new Date(template.lastGeneratedDate), "MMMM d, yyyy") : "Never"}</span>
                    </div>
                  </div>
                )}
                {template.endDate && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{template.endDate ? format(new Date(template.endDate), "MMMM d, yyyy") : "No end date"}</span>
                    </div>
                  </div>
                )}
              </div>

              {template.active && (
                <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm flex items-start mt-4">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Automatic Generation</p>
                    <p>
                      This template is active and will automatically generate invoices according to the schedule. The
                      next invoice will be generated on {template.nextGenerationDate ? format(new Date(template.nextGenerationDate), "MMMM d, yyyy") : "the scheduled date"}.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {template.lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-center border-b pb-4">
                    <div className="col-span-12 md:col-span-6">
                      <h3 className="text-sm font-medium">{item.description}</h3>
                      {item.taskId && <p className="text-xs text-muted-foreground">Linked to task</p>}
                    </div>
                    <div className="col-span-4 md:col-span-2 text-sm">
                      <span className="text-muted-foreground mr-1">Qty:</span>
                      {item.quantity}
                    </div>
                    <div className="col-span-4 md:col-span-2 text-sm">
                      <span className="text-muted-foreground mr-1">Rate:</span>${item.rate.toFixed(2)}
                    </div>
                    <div className="col-span-4 md:col-span-2 text-sm font-medium">
                      <span className="text-muted-foreground mr-1">Amount:</span>${item.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
