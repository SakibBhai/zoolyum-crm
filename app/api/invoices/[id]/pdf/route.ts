import { NextRequest, NextResponse } from 'next/server'
import { sql } from "@/lib/neon"
import { Invoice } from '@/types/invoice'
import { InvoiceTemplate } from '@/types/invoice-template'
import { EnhancedInvoicePDFGenerator } from '@/lib/invoice-pdf-enhanced'
import { InvoiceCalculator } from '@/lib/invoice-calculations'

// GET /api/invoices/[id]/pdf
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const download = searchParams.get('download') === 'true'
    const watermark = searchParams.get('watermark')
    const filename = searchParams.get('filename')

    // Fetch invoice with related data
    const invoiceResult = await sql`
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.address as client_address,
        c.phone as client_phone,
        p.name as project_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.id = ${id}
    `

    if (invoiceResult.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const invoiceData = invoiceResult[0]
    
    // Fetch payments
    const paymentsResult = await sql`
      SELECT 
        id,
        amount,
        payment_date as date,
        payment_method as method,
        reference,
        notes
      FROM invoice_payments 
      WHERE invoice_id = ${id}
      ORDER BY payment_date DESC
    `

    // Format payments to match InvoicePayment type
    const formattedPayments = paymentsResult.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes
    }))

    // Convert database format to Invoice type
    const invoice: Invoice = {
      id: invoiceData.id,
      invoiceNumber: invoiceData.invoice_number,
      clientId: invoiceData.client_id,
      clientName: invoiceData.client_name,
      recipientInfo: {
        id: invoiceData.client_id,
        name: invoiceData.client_name,
        email: invoiceData.client_email || '',
        address: {
          street: invoiceData.client_address || '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      },
      projectId: invoiceData.project_id,
      projectName: invoiceData.project_name,
      issueDate: invoiceData.issue_date,
      dueDate: invoiceData.due_date,
      status: invoiceData.status,
      lineItems: invoiceData.line_items || [],
      subtotal: invoiceData.subtotal,
      taxRate: invoiceData.tax_rate,
      taxAmount: invoiceData.tax_amount,
      discountRate: invoiceData.discount_rate,
      discountAmount: invoiceData.discount_amount,
      discountType: invoiceData.discount_type,
      shippingAmount: invoiceData.shipping_amount,
      shippingTaxRate: invoiceData.shipping_tax_rate,
      shippingTaxAmount: invoiceData.shipping_tax_amount,
      total: invoiceData.total,
      notes: invoiceData.notes,
      terms: invoiceData.terms,
      paymentMethod: invoiceData.payment_method,
      templateId: invoiceData.template_id,
      payments: formattedPayments,
      amountPaid: 0,
      amountDue: 0,
      emailHistory: [],
      lastSentAt: invoiceData.last_sent_at,
      viewedAt: invoiceData.viewed_at,
      remindersSent: invoiceData.reminders_sent || 0,
      nextReminderDate: invoiceData.next_reminder_date,
      poNumber: invoiceData.po_number,
      currency: invoiceData.currency || 'USD',
      currencySymbol: invoiceData.currency_symbol || '$',
      exchangeRate: invoiceData.exchange_rate,
      createdAt: invoiceData.created_at,
      updatedAt: invoiceData.updated_at,
      createdBy: invoiceData.created_by
    }

    // Calculate amounts
    const calculations = InvoiceCalculator.calculateInvoice(invoice)
    const paymentStatus = InvoiceCalculator.calculatePaymentStatus(invoice)
    invoice.amountPaid = paymentStatus.amountPaid
    invoice.amountDue = paymentStatus.amountDue

    // Fetch template
    let template: InvoiceTemplate
    const templateIdToUse = templateId || invoice.templateId
    
    if (templateIdToUse) {
      const templateResult = await sql`
        SELECT * FROM invoice_templates 
        WHERE id = ${templateIdToUse} AND is_active = true
      `
      
      if (templateResult.length > 0) {
        const templateData = templateResult[0]
        template = {
          id: templateData.id,
          name: templateData.name,
          description: templateData.description,
          isDefault: templateData.is_default,
          isActive: templateData.is_active,
          design: templateData.design,
          branding: templateData.branding,
          settings: templateData.settings,
          emailSettings: templateData.email_settings,
          createdAt: templateData.created_at,
          updatedAt: templateData.updated_at,
          createdBy: templateData.created_by
        }
      } else {
        // Fallback to default template
        const defaultTemplateResult = await sql`
          SELECT * FROM invoice_templates 
          WHERE is_default = true AND is_active = true
          LIMIT 1
        `
        
        if (defaultTemplateResult.length === 0) {
          return NextResponse.json(
            { error: 'No template found' },
            { status: 400 }
          )
        }
        
        const templateData = defaultTemplateResult[0]
        template = {
          id: templateData.id,
          name: templateData.name,
          description: templateData.description,
          isDefault: templateData.is_default,
          isActive: templateData.is_active,
          design: templateData.design,
          branding: templateData.branding,
          settings: templateData.settings,
          emailSettings: templateData.email_settings,
          createdAt: templateData.created_at,
          updatedAt: templateData.updated_at,
          createdBy: templateData.created_by
        }
      }
    } else {
      return NextResponse.json(
        { error: 'No template specified' },
        { status: 400 }
      )
    }

    // Generate PDF
    try {
      const pdfOptions = {
        filename: filename || `invoice-${invoice.invoiceNumber}.pdf`,
        includeWatermark: watermark === 'true' || invoice.status === 'draft',
        watermarkText: watermark || (invoice.status === 'draft' ? 'DRAFT' : undefined)
      }

      const pdfBlob = await EnhancedInvoicePDFGenerator.generateProgrammatically(
        invoice,
        template,
        pdfOptions
      )

      // Convert blob to buffer
      const buffer = Buffer.from(await pdfBlob.arrayBuffer())

      // Set response headers
      const headers = new Headers()
      headers.set('Content-Type', 'application/pdf')
      headers.set('Content-Length', buffer.length.toString())
      
      if (download) {
        headers.set(
          'Content-Disposition', 
          `attachment; filename="${pdfOptions.filename}"`
        )
      } else {
        headers.set(
          'Content-Disposition', 
          `inline; filename="${pdfOptions.filename}"`
        )
      }

      // Update invoice view tracking
      if (!download) {
        await sql`
          UPDATE invoices 
          SET 
            viewed_at = ${new Date().toISOString()},
            updated_at = ${new Date().toISOString()}
          WHERE id = ${id}
        `
      }

      return new NextResponse(buffer, {
        status: 200,
        headers
      })
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError)
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in PDF generation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}