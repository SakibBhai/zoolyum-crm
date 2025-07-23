"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useInvoiceContext } from "@/contexts/invoice-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format as formatDate } from "date-fns"
import {
  FileText,
  User,
  CreditCard,
  Download,
  Send,
  Printer,
  Edit,
  Trash2,
  Loader2,
  FileSpreadsheet,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import type { InvoiceStatus } from "@/types/invoice"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface InvoiceDetailsProps {
  invoiceId: string
}

export function InvoiceDetails({ invoiceId }: InvoiceDetailsProps) {
  const router = useRouter()
  const { getInvoice, updateInvoiceStatus, deleteInvoice } = useInvoiceContext()
  const [activeTab, setActiveTab] = useState("details")

  const invoice = getInvoice(invoiceId)

  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | null>(null)
  const pdfGeneratorRef = useRef<{ generatePdf: () => Promise<Blob> } | null>(null)

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
        <p className="mb-4">The requested invoice could not be found.</p>
        <Button onClick={() => router.push("/dashboard/invoices")}>Return to Invoices</Button>
      </div>
    )
  }

  const handleStatusChange = (status: InvoiceStatus) => {
    updateInvoiceStatus(invoiceId, status)
    toast({
      title: "Status Updated",
      description: `Invoice status changed to ${status}.`,
    })
  }

  const handleDeleteInvoice = () => {
    if (confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      deleteInvoice(invoiceId)
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been deleted successfully.",
      })
      router.push("/dashboard/invoices")
    }
  }

  const handleExport = async (format: "pdf" | "csv") => {
    setIsExporting(true)
    setExportFormat(format)

    try {
      if (format === "pdf") {
        // Create a hidden iframe to render the invoice for PDF export
        const iframe = document.createElement("iframe")
        iframe.style.position = "absolute"
        iframe.style.top = "-9999px"
        iframe.style.left = "-9999px"
        iframe.style.width = "1024px"
        iframe.style.height = "0"
        document.body.appendChild(iframe)

        // Wait for iframe to load
        await new Promise((resolve) => {
          iframe.onload = resolve
          iframe.srcdoc = `
            <html>
              <head>
                <title>Invoice ${invoice.invoiceNumber}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                  table { width: 100%; border-collapse: collapse; }
                  th, td { padding: 8px; text-align: left; }
                  th { border-bottom: 2px solid #ddd; }
                  td { border-bottom: 1px solid #ddd; }
                </style>
              </head>
              <body>
                <div id="invoice-container"></div>
              </body>
            </html>
          `
        })

        // Render the invoice in the iframe
        const iframeDocument = iframe.contentDocument
        if (iframeDocument) {
          const container = iframeDocument.getElementById("invoice-container")
          if (container) {
            // Render a simplified version of the invoice
            const formattedIssueDate = invoice.issueDate ? formatDate(new Date(invoice.issueDate), "MMMM d, yyyy") : "Not set"
            const formattedDueDate = invoice.dueDate ? formatDate(new Date(invoice.dueDate), "MMMM d, yyyy") : "No due date"
            container.innerHTML = `
              <h1>INVOICE: ${invoice.invoiceNumber}</h1>
              <p>Date: ${formattedIssueDate}</p>
              <p>Due Date: ${formattedDueDate}</p>
              <h2>Bill To:</h2>
              <p>${invoice.recipientInfo.name}<br>
              ${invoice.recipientInfo.email}</p>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.lineItems
                .map(
                  (item) => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>$${item.rate.toFixed(2)}</td>
                      <td>$${item.amount.toFixed(2)}</td>
                    </tr>
                  `,
                )
                .join("")}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                    <td>$${invoice.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="text-align: right;"><strong>Tax (${invoice.taxRate}%):</strong></td>
                    <td>$${invoice.taxAmount.toFixed(2)}</td>
                  </tr>
                  ${(invoice.discountAmount || 0) > 0
                ? `
                  <tr>
                    <td colspan="3" style="text-align: right;"><strong>Discount:</strong></td>
                    <td>$${(invoice.discountAmount || 0).toFixed(2)}</td>
                  </tr>
                  `
                : ""
              }
                  <tr>
                    <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                    <td><strong>$${invoice.total.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            `
          }
        }

        // Use html2canvas and jsPDF to generate PDF
        const { jsPDF } = await import("jspdf")
        const html2canvas = await import("html2canvas")

        const canvas = await html2canvas.default(iframe.contentDocument?.body as HTMLElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        })

        const imgData = canvas.toDataURL("image/png")

        // A4 size: 210 x 297 mm
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        })

        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

        // Download the PDF
        pdf.save(`Invoice_${invoice.invoiceNumber.replace(/\s+/g, "_")}.pdf`)

        // Clean up
        document.body.removeChild(iframe)
      } else if (format === "csv") {
        // Generate CSV content
        const headers = ["Description", "Quantity", "Rate", "Amount"]
        const rows = invoice.lineItems.map(
          (item) =>
            `"${item.description.replace(/"/g, '""')}",${item.quantity},${item.rate.toFixed(2)},${item.amount.toFixed(2)}`,
        )

        // Add summary rows
        rows.push(`"Subtotal",,,"${invoice.subtotal.toFixed(2)}"`)
        rows.push(`"Tax (${invoice.taxRate}%)",,,"${invoice.taxAmount.toFixed(2)}"`)
        if ((invoice.discountAmount || 0) > 0) {
          rows.push(`"Discount",,,"${(invoice.discountAmount || 0).toFixed(2)}"`)
        }
        rows.push(`"Total",,,"${invoice.total.toFixed(2)}"`)

        const csvContent = [headers.join(","), ...rows].join("\n")

        // Create and download the CSV file
        const fileName = `Invoice_${invoice.invoiceNumber.replace(/\s+/g, "_")}.csv`
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

      toast({
        title: "Export Successful",
        description: `Invoice ${invoice.invoiceNumber} has been exported as ${format.toUpperCase()}.`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "There was an error exporting the invoice. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setExportFormat(null)
    }
  }

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "draft":
        return "bg-gray-500"
      case "sent":
        return "bg-blue-500"
      case "viewed":
        return "bg-indigo-500"
      case "paid":
        return "bg-green-500"
      case "partial":
        return "bg-orange-500"
      case "overdue":
        return "bg-red-500"
      case "cancelled":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">Created on {invoice.createdAt ? formatDate(new Date(invoice.createdAt), "MMMM d, yyyy") : "unknown date"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={`${getStatusColor(invoice.status)} text-white`}>{invoice.status}</Badge>
          <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/invoices/${invoiceId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDeleteInvoice}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="recipient">
                <User className="h-4 w-4 mr-2" />
                Recipient
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Invoice Information</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Number:</span>
                      <span>{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{invoice.issueDate ? formatDate(new Date(invoice.issueDate), "MMMM d, yyyy") : "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{invoice.dueDate ? formatDate(new Date(invoice.dueDate), "MMMM d, yyyy") : "No due date"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={`${getStatusColor(invoice.status)} text-white`}>{invoice.status}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Project Information</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span>{invoice.clientName}</span>
                    </div>
                    {invoice.projectId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project:</span>
                        <span>{invoice.projectName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Line Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-center">Quantity</th>
                        <th className="px-4 py-2 text-right">Rate</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">${item.rate.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">${item.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-medium">
                          Subtotal:
                        </td>
                        <td className="px-4 py-2 text-right">${invoice.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-medium">
                          Tax ({invoice.taxRate}%):
                        </td>
                        <td className="px-4 py-2 text-right">${invoice.taxAmount.toFixed(2)}</td>
                      </tr>
                      {(invoice.discountAmount || 0) > 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-right font-medium">
                            Discount:
                          </td>
                          <td className="px-4 py-2 text-right">${(invoice.discountAmount || 0).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr className="border-t">
                        <td colSpan={3} className="px-4 py-2 text-right font-bold">
                          Total:
                        </td>
                        <td className="px-4 py-2 text-right font-bold">${invoice.total.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {invoice.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="p-3 bg-muted/20 rounded-md">{invoice.notes}</p>
                </div>
              )}

              {invoice.terms && (
                <div>
                  <h3 className="font-medium mb-2">Terms and Conditions</h3>
                  <p className="p-3 bg-muted/20 rounded-md">{invoice.terms}</p>
                </div>
              )}
            </TabsContent>

            {/* Recipient Tab */}
            <TabsContent value="recipient" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Recipient Information</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{invoice.recipientInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{invoice.recipientInfo.email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Billing Address</h3>
                  <address className="not-italic">
                    {invoice.recipientInfo.address.street && <p>{invoice.recipientInfo.address.street}</p>}
                    {invoice.recipientInfo.address.city && (
                      <p>
                        {invoice.recipientInfo.address.city}
                        {invoice.recipientInfo.address.state && `, ${invoice.recipientInfo.address.state}`}{" "}
                        {invoice.recipientInfo.address.zipCode}
                      </p>
                    )}
                    {invoice.recipientInfo.address.country && <p>{invoice.recipientInfo.address.country}</p>}
                  </address>
                </div>
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Payment Status</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={`${getStatusColor(invoice.status)} text-white`}>{invoice.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{invoice.dueDate ? formatDate(new Date(invoice.dueDate), "MMMM d, yyyy") : "No due date"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Due:</span>
                      <span className="font-bold">${invoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Payment Method</h3>
                  <div className="space-y-1">
                    {invoice.paymentMethod ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Method:</span>
                          <span>
                            {invoice.paymentMethod
                              .split("-")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </span>
                        </div>
                        {invoice.paymentDetails && (
                          <div>
                            <span className="text-muted-foreground block mb-1">Payment Instructions:</span>
                            <p className="p-3 bg-muted/20 rounded-md">{invoice.paymentDetails}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">No payment method specified</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Update Payment Status</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={invoice.status === "draft" ? "default" : "outline"}
                    onClick={() => handleStatusChange("draft")}
                  >
                    Mark as Draft
                  </Button>
                  <Button
                    size="sm"
                    variant={invoice.status === "sent" ? "default" : "outline"}
                    onClick={() => handleStatusChange("sent")}
                  >
                    Mark as Sent
                  </Button>
                  <Button
                    size="sm"
                    variant={invoice.status === "paid" ? "default" : "outline"}
                    onClick={() => handleStatusChange("paid")}
                  >
                    Mark as Paid
                  </Button>
                  <Button
                    size="sm"
                    variant={invoice.status === "overdue" ? "default" : "outline"}
                    onClick={() => handleStatusChange("overdue")}
                  >
                    Mark as Overdue
                  </Button>
                  <Button
                    size="sm"
                    variant={invoice.status === "cancelled" ? "default" : "outline"}
                    onClick={() => handleStatusChange("cancelled")}
                  >
                    Mark as Cancelled
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t pt-6">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("pdf")} disabled={isExporting} className="cursor-pointer">
                {exportFormat === "pdf" && isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")} disabled={isExporting} className="cursor-pointer">
                {exportFormat === "csv" && isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
