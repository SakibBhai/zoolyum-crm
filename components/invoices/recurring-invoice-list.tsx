"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRecurringInvoiceContext } from "@/contexts/recurring-invoice-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { Eye, Plus, Search, Calendar, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function RecurringInvoiceList() {
  const { recurringInvoices, toggleRecurringInvoiceStatus, generateInvoiceFromTemplate } = useRecurringInvoiceContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [intervalFilter, setIntervalFilter] = useState<string>("all")
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined)
  
  // Set current date on client side only
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])

  // Filter templates based on search query and interval filter
  const filteredTemplates = recurringInvoices.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.projectName && template.projectName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesInterval = intervalFilter === "all" || template.recurrenceInterval === intervalFilter

    return matchesSearch && matchesInterval
  })

  // Handle toggle active status
  const handleToggleStatus = (id: string) => {
    const updatedTemplate = toggleRecurringInvoiceStatus(id)
    if (updatedTemplate) {
      toast({
        title: updatedTemplate.active ? "Template Activated" : "Template Deactivated",
        description: `"${updatedTemplate.name}" has been ${updatedTemplate.active ? "activated" : "deactivated"}.`,
      })
    }
  }

  // Handle manual generation of invoice
  const handleGenerateInvoice = (id: string, templateName: string) => {
    generateInvoiceFromTemplate(id)
    toast({
      title: "Invoice Generated",
      description: `A new invoice has been generated from template "${templateName}".`,
    })
  }

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-4">
          <Select value={intervalFilter} onValueChange={setIntervalFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Intervals</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/dashboard/invoices/recurring/new">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Recurrence</TableHead>
              <TableHead>Next Invoice</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No recurring invoice templates found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => {
                // Calculate total amount
                const subtotal = template.lineItems.reduce((sum, item) => sum + item.amount, 0)
                const taxAmount = (subtotal * template.taxRate) / 100
                const total = subtotal + taxAmount - template.discount

                // Check if next generation date is today or in the past (only if currentDate is available)
                const isOverdue = currentDate ? new Date(template.nextGenerationDate) <= currentDate : false

                return (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.clientName}</TableCell>
                    <TableCell>{template.projectName || "—"}</TableCell>
                    <TableCell>{formatRecurrenceInterval(template.recurrenceInterval, template.customDays)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {isOverdue && template.active && <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />}
                        <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                        {template.nextGenerationDate ? format(new Date(template.nextGenerationDate), "MMM d, yyyy") : "Not scheduled"}
                      </div>
                    </TableCell>
                    <TableCell>${total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Switch checked={template.active} onCheckedChange={() => handleToggleStatus(template.id)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateInvoice(template.id, template.name)}
                        >
                          Generate Now
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/invoices/recurring/${template.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
