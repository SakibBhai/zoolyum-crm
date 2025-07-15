import { NextRequest, NextResponse } from 'next/server'
import { sql } from "@/lib/neon"
import { Invoice } from '@/types/invoice'
import { InvoiceTemplate } from '@/types/invoice-template'
import { InvoiceEmailService } from '@/lib/invoice-email-service'
import { EnhancedInvoicePDFGenerator } from '@/lib/invoice-pdf-enhanced'

// GET /api/invoices/[id]/reminders
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch reminder history
    const reminders = await sql`
      SELECT 
        id,
        sent_at,
        sent_to,
        subject,
        status,
        reminder_type,
        days_overdue
      FROM invoice_email_history 
      WHERE invoice_id = ${id} 
        AND email_type = 'reminder'
      ORDER BY sent_at DESC
    `

    // Fetch invoice status for next reminder calculation
    const invoice = await sql`
      SELECT 
        status,
        due_date,
        reminders_sent,
        next_reminder_date
      FROM invoices 
      WHERE id = ${id}
    `

    if (invoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const invoiceData = invoice[0]
    const now = new Date()
    const dueDate = new Date(invoiceData.due_date)
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    // Calculate next reminder date if invoice is overdue and not paid
    let nextReminderDate = null
    if (['sent', 'overdue', 'partial'].includes(invoiceData.status) && daysOverdue > 0) {
      const remindersSent = invoiceData.reminders_sent || 0
      
      // Reminder schedule: 1 day, 7 days, 14 days, 30 days, then every 30 days
      const reminderSchedule = [1, 7, 14, 30]
      let nextReminderDays
      
      if (remindersSent < reminderSchedule.length) {
        nextReminderDays = reminderSchedule[remindersSent]
      } else {
        // After initial reminders, send every 30 days
        nextReminderDays = 30
      }
      
      const lastReminderDate = reminders.length > 0 ? new Date(reminders[0].sent_at) : dueDate
      nextReminderDate = new Date(lastReminderDate.getTime() + (nextReminderDays * 24 * 60 * 60 * 1000))
      
      // Only set if it's in the future or today
      if (nextReminderDate <= now) {
        nextReminderDate = now
      }
    }

    return NextResponse.json({
      reminders,
      remindersSent: invoiceData.reminders_sent || 0,
      daysOverdue,
      nextReminderDate: nextReminderDate?.toISOString() || null,
      canSendReminder: ['sent', 'overdue', 'partial'].includes(invoiceData.status)
    })
  } catch (error) {
    console.error('Error fetching invoice reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice reminders' },
      { status: 500 }
    )
  }
}

// POST /api/invoices/[id]/reminders
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
      reminderType = 'overdue',
      attachPdf = true 
    } = await request.json()

    // Fetch invoice with client data
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
    
    // Check if invoice can receive reminders
    if (!['sent', 'overdue', 'partial'].includes(invoiceData.status)) {
      return NextResponse.json(
        { error: 'Cannot send reminder for invoice with current status' },
        { status: 400 }
      )
    }

    // Use client email if no recipient specified
    const recipientEmail = to || invoiceData.client_email
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'No recipient email address available' },
        { status: 400 }
      )
    }

    // Calculate days overdue
    const now = new Date()
    const dueDate = new Date(invoiceData.due_date)
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))

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
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 400 }
        )
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
            includeWatermark: false
          }
        )
      } catch (pdfError) {
        console.error('Error generating PDF for reminder:', pdfError)
        return NextResponse.json(
          { error: 'Failed to generate PDF attachment' },
          { status: 500 }
        )
      }
    }

    // Send reminder email
    try {
      const emailOptions = {
        to: recipientEmail,
        cc,
        bcc,
        subject,
        body,
        ...(pdfBlob && {
          attachments: [{
            filename: `invoice-${invoice.invoiceNumber}.pdf`,
            content: pdfBlob,
            contentType: 'application/pdf'
          }]
        })
      }
      
      const emailHistory = await InvoiceEmailService.sendReminderEmail(
        invoice,
        template,
        emailOptions
      )

      // Save email history to database
      const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const nowIso = now.toISOString()
      
      // Insert email history
      await sql`
        INSERT INTO invoice_email_history (
          id,
          invoice_id,
          sent_at,
          sent_to,
          subject,
          status,
          email_type,
          reminder_type,
          days_overdue,
          created_at
        ) VALUES (
          ${emailId},
          ${id},
          ${nowIso},
          ${recipientEmail},
          ${subject || emailHistory.subject},
          'sent',
          'reminder',
          ${reminderType},
          ${daysOverdue},
          ${nowIso}
        )
      `

      // Update invoice reminder tracking
      const newRemindersSent = (invoiceData.reminders_sent || 0) + 1
      
      // Calculate next reminder date
      const reminderSchedule = [1, 7, 14, 30]
      let nextReminderDays
      
      if (newRemindersSent < reminderSchedule.length) {
        nextReminderDays = reminderSchedule[newRemindersSent]
      } else {
        nextReminderDays = 30 // Every 30 days after initial sequence
      }
      
      const nextReminderDate = new Date(now.getTime() + (nextReminderDays * 24 * 60 * 60 * 1000))
      
      await sql`
        UPDATE invoices 
        SET 
          reminders_sent = ${newRemindersSent},
          next_reminder_date = ${nextReminderDate.toISOString()},
          status = CASE 
            WHEN status = 'sent' AND ${daysOverdue} > 0 THEN 'overdue'
            ELSE status
          END,
          updated_at = ${nowIso}
        WHERE id = ${id}
      `

      return NextResponse.json({
        success: true,
        emailId,
        sentAt: nowIso,
        sentTo: recipientEmail,
        remindersSent: (invoiceData.reminders_sent || 0) + 1,
        daysOverdue
      })
    } catch (emailError) {
      console.error('Error sending reminder email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send reminder email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in send reminder API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}