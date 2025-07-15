import { NextRequest, NextResponse } from 'next/server'
import { sql } from "@/lib/neon"
import { Invoice, InvoiceEmailHistory } from '@/types/invoice'
import { InvoiceTemplate } from '@/types/invoice-template'
import { InvoiceEmailService } from '@/lib/invoice-email-service'
import { EnhancedInvoicePDFGenerator } from '@/lib/invoice-pdf-enhanced'

// POST /api/invoices/[id]/send-email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { 
      to, 
      cc, 
      bcc, 
      subject, 
      body, 
      templateId, 
      attachPdf = true,
      emailType = 'invoice'
    } = await request.json()

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email address is required' },
        { status: 400 }
      )
    }

    // Fetch invoice
    const invoiceResult = await sql`
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ${id}
    `

    if (invoiceResult.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const invoiceData = invoiceResult[0]
    
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
          street: '',
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
      payments: [],
      amountPaid: invoiceData.amount_paid || 0,
      amountDue: invoiceData.amount_due || invoiceData.total,
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

    // Fetch template (use provided templateId or invoice's templateId or default)
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

    let pdfBlob: Blob | undefined
    
    // Generate PDF if requested
    if (attachPdf) {
      try {
        pdfBlob = await EnhancedInvoicePDFGenerator.generateProgrammatically(
          invoice,
          template,
          {
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            includeWatermark: invoice.status === 'draft',
            watermarkText: invoice.status === 'draft' ? 'DRAFT' : undefined
          }
        )
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError)
        return NextResponse.json(
          { error: 'Failed to generate PDF attachment' },
          { status: 500 }
        )
      }
    }

    // Send email
    try {
      const emailHistory = await InvoiceEmailService.sendInvoiceEmail(
        invoice,
        template,
        pdfBlob!,
        {
          to,
          cc,
          bcc,
          subject,
          body
        }
      )

      // Save email history to database
      const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()
      
      await sql`
        INSERT INTO invoice_email_history (
          id,
          invoice_id,
          sent_at,
          sent_to,
          subject,
          status,
          email_type,
          created_at
        ) VALUES (
          ${emailId},
          ${id},
          ${now},
          ${to},
          ${subject || emailHistory.subject},
          'sent',
          ${emailType},
          ${now}
        )
      `

      // Update invoice with last sent date
      await sql`
        UPDATE invoices 
        SET 
          last_sent_at = ${now},
          status = CASE 
            WHEN status = 'draft' THEN 'sent'
            ELSE status
          END,
          updated_at = ${now}
        WHERE id = ${id}
      `

      return NextResponse.json({
        success: true,
        emailId,
        sentAt: now,
        sentTo: to
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in send email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}