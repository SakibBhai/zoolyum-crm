"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileText, Loader2, FileSpreadsheet } from "lucide-react"
import type { Invoice } from "@/types/invoice"
import { toast } from "@/components/ui/use-toast"

interface InvoiceExportProps {
  invoice: Invoice
}

export function InvoiceExport({ invoice }: InvoiceExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | null>(null)

  const handleExport = async (format: "pdf" | "csv") => {
    setIsExporting(true)
    setExportFormat(format)

    try {
      // In a real application, this would call an API to generate the file
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate file generation and download
      if (format === "pdf") {
        generatePdfInvoice(invoice)
      } else if (format === "csv") {
        generateCsvInvoice(invoice)
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

  // Function to generate and download a PDF invoice
  const generatePdfInvoice = (invoice: Invoice) => {
    // In a real implementation, this would use a library like jsPDF or call a server endpoint
    // For this demo, we'll simulate a download by creating a blob and triggering a download

    const fileName = `Invoice_${invoice.invoiceNumber.replace(/\s+/g, "_")}.pdf`

    // Create a dummy blob to simulate file download
    const blob = new Blob(["PDF invoice data would go here"], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Function to generate and download a CSV invoice
  const generateCsvInvoice = (invoice: Invoice) => {
    // Create CSV content
    const headers = ["Description", "Quantity", "Rate", "Amount"]
    const rows = invoice.lineItems.map(
      (item) => `"${item.description}",${item.quantity},${item.rate.toFixed(2)},${item.amount.toFixed(2)}`,
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span className="sr-only">Export</span>
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
  )
}
