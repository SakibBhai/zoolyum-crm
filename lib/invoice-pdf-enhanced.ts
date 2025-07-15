import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Invoice } from '@/types/invoice'
import { InvoiceTemplate } from '@/types/invoice-template'
import { InvoiceCalculator } from './invoice-calculations'

export interface PDFGenerationOptions {
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  quality?: number
  includeWatermark?: boolean
  watermarkText?: string
  filename?: string
}

export class EnhancedInvoicePDFGenerator {
  private static readonly DEFAULT_OPTIONS: PDFGenerationOptions = {
    format: 'a4',
    orientation: 'portrait',
    quality: 1.0,
    includeWatermark: false,
    watermarkText: 'DRAFT'
  }

  static async generateFromHTML(
    elementId: string,
    invoice: Invoice,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    const element = document.getElementById(elementId)
    
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found`)
    }

    try {
      const canvas = await html2canvas(element, {
        scale: opts.quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: opts.orientation,
        unit: 'mm',
        format: opts.format
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)

      // Add watermark if requested
      if (opts.includeWatermark && opts.watermarkText) {
        this.addWatermark(pdf, opts.watermarkText)
      }

      return pdf.output('blob')
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF')
    }
  }

  static async generateProgrammatically(
    invoice: Invoice,
    template: InvoiceTemplate,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options }
    const pdf = new jsPDF({
      orientation: opts.orientation,
      unit: 'mm',
      format: opts.format
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = margin

    // Set colors from template
    const colors = template.design.colorScheme
    
    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 }
    }

    const primaryColor = hexToRgb(colors.primary)
    const textColor = hexToRgb(colors.text)

    // Header section
    pdf.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b)
    pdf.rect(0, 0, pageWidth, 40, 'F')

    // Company name
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text(template.branding.companyName, margin, 25)

    // Invoice title
    pdf.setFontSize(18)
    pdf.text('INVOICE', pageWidth - margin - 40, 25)

    yPosition = 60

    // Company details
    pdf.setTextColor(textColor.r, textColor.g, textColor.b)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    
    const companyLines = [
      template.branding.address.street,
      `${template.branding.address.city}, ${template.branding.address.state} ${template.branding.address.zipCode}`,
      template.branding.address.country,
      template.branding.contact.email,
      template.branding.contact.phone || ''
    ].filter(line => line.trim())

    companyLines.forEach(line => {
      pdf.text(line, margin, yPosition)
      yPosition += 5
    })

    // Invoice details (right side)
    let rightYPosition = 60
    pdf.setFont('helvetica', 'bold')
    pdf.text('Invoice Number:', pageWidth - 80, rightYPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text(invoice.invoiceNumber, pageWidth - 40, rightYPosition)
    rightYPosition += 8

    pdf.setFont('helvetica', 'bold')
    pdf.text('Issue Date:', pageWidth - 80, rightYPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text(new Date(invoice.issueDate).toLocaleDateString(), pageWidth - 40, rightYPosition)
    rightYPosition += 8

    pdf.setFont('helvetica', 'bold')
    pdf.text('Due Date:', pageWidth - 80, rightYPosition)
    pdf.setFont('helvetica', 'normal')
    pdf.text(new Date(invoice.dueDate).toLocaleDateString(), pageWidth - 40, rightYPosition)

    yPosition = Math.max(yPosition, rightYPosition) + 20

    // Bill to section
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text('Bill To:', margin, yPosition)
    yPosition += 8

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(invoice.clientName, margin, yPosition)
    yPosition += 20

    // Line items table
    const tableStartY = yPosition
    const colWidths = [80, 20, 25, 25, 30]
    const colPositions = [margin]
    for (let i = 1; i < colWidths.length; i++) {
      colPositions.push(colPositions[i - 1] + colWidths[i - 1])
    }

    // Table header
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F')
    
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text('Description', colPositions[0] + 2, yPosition + 5)
    pdf.text('Qty', colPositions[1] + 2, yPosition + 5)
    pdf.text('Rate', colPositions[2] + 2, yPosition + 5)
    pdf.text('Tax', colPositions[3] + 2, yPosition + 5)
    pdf.text('Amount', colPositions[4] + 2, yPosition + 5)
    
    yPosition += 10

    // Line items
    pdf.setFont('helvetica', 'normal')
    const calculations = InvoiceCalculator.calculateInvoice(invoice)
    
    invoice.lineItems.forEach((item, index) => {
      const itemCalc = calculations.lineItemTotals[item.id]
      
      pdf.text(item.description, colPositions[0] + 2, yPosition + 5)
      pdf.text(item.quantity.toString(), colPositions[1] + 2, yPosition + 5)
      pdf.text(InvoiceCalculator.formatCurrency(item.rate, invoice.currency), colPositions[2] + 2, yPosition + 5)
      pdf.text(`${item.taxRate || 0}%`, colPositions[3] + 2, yPosition + 5)
      pdf.text(InvoiceCalculator.formatCurrency(itemCalc.total, invoice.currency), colPositions[4] + 2, yPosition + 5)
      
      yPosition += 8
      
      // Add line separator
      if (index < invoice.lineItems.length - 1) {
        pdf.setDrawColor(200, 200, 200)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 2
      }
    })

    yPosition += 10

    // Totals section
    const totalsX = pageWidth - 80
    
    pdf.setFont('helvetica', 'normal')
    pdf.text('Subtotal:', totalsX, yPosition)
    pdf.text(InvoiceCalculator.formatCurrency(calculations.subtotal, invoice.currency), totalsX + 30, yPosition)
    yPosition += 6

    if (calculations.totalDiscount > 0) {
      pdf.text('Discount:', totalsX, yPosition)
      pdf.text(`-${InvoiceCalculator.formatCurrency(calculations.totalDiscount, invoice.currency)}`, totalsX + 30, yPosition)
      yPosition += 6
    }

    if (calculations.totalTax > 0) {
      pdf.text('Tax:', totalsX, yPosition)
      pdf.text(InvoiceCalculator.formatCurrency(calculations.totalTax, invoice.currency), totalsX + 30, yPosition)
      yPosition += 6
    }

    if (calculations.shippingAmount > 0) {
      pdf.text('Shipping:', totalsX, yPosition)
      pdf.text(InvoiceCalculator.formatCurrency(calculations.shippingAmount, invoice.currency), totalsX + 30, yPosition)
      yPosition += 6
    }

    // Total line
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.text('Total:', totalsX, yPosition)
    pdf.text(InvoiceCalculator.formatCurrency(calculations.total, invoice.currency), totalsX + 30, yPosition)

    // Notes and terms
    if (invoice.notes || invoice.terms) {
      yPosition += 20
      
      if (invoice.terms) {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.text('Payment Terms:', margin, yPosition)
        yPosition += 6
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        const termsLines = pdf.splitTextToSize(invoice.terms, pageWidth - 2 * margin)
        pdf.text(termsLines, margin, yPosition)
        yPosition += termsLines.length * 4 + 10
      }
      
      if (invoice.notes) {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.text('Notes:', margin, yPosition)
        yPosition += 6
        
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        const notesLines = pdf.splitTextToSize(invoice.notes, pageWidth - 2 * margin)
        pdf.text(notesLines, margin, yPosition)
      }
    }

    // Add watermark if requested
    if (opts.includeWatermark && opts.watermarkText) {
      this.addWatermark(pdf, opts.watermarkText)
    }

    return pdf.output('blob')
  }

  private static addWatermark(pdf: jsPDF, text: string): void {
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    pdf.saveGraphicsState()
    pdf.setGState(new pdf.GState({ opacity: 0.1 }))
    pdf.setTextColor(128, 128, 128)
    pdf.setFontSize(60)
    pdf.setFont('helvetica', 'bold')
    
    // Rotate and center the watermark
    pdf.text(text, pageWidth / 2, pageHeight / 2, {
      angle: 45,
      align: 'center'
    })
    
    pdf.restoreGraphicsState()
  }

  static async downloadPDF(
    blob: Blob,
    filename: string = 'invoice.pdf'
  ): Promise<void> {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export default EnhancedInvoicePDFGenerator