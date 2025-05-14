"use client"

import { useRef } from "react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { InvoicePrintView } from "./invoice-print-view"
import type { Invoice } from "@/types/invoice"

interface InvoicePdfGeneratorProps {
  invoice: Invoice
  onGenerated: (blob: Blob) => void
}

export function InvoicePdfGenerator({ invoice, onGenerated }: InvoicePdfGeneratorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const generatePdf = async () => {
    if (!containerRef.current) return

    try {
      const element = containerRef.current
      const canvas = await html2canvas(element, {
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
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add new pages if the content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const pdfBlob = pdf.output("blob")
      onGenerated(pdfBlob)
    } catch (error) {
      console.error("Error generating PDF:", error)
      throw new Error("Failed to generate PDF")
    }
  }

  return (
    <div className="hidden">
      <div ref={containerRef}>
        <InvoicePrintView invoice={invoice} onRender={generatePdf} />
      </div>
    </div>
  )
}
