import { Invoice, InvoiceEmailHistory } from '@/types/invoice'
import { InvoiceTemplate } from '@/types/invoice-template'

export interface EmailOptions {
  to: string
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  attachments?: {
    filename: string
    content: Blob | Buffer
    contentType: string
  }[]
  trackOpens?: boolean
  trackClicks?: boolean
}

export interface EmailTemplate {
  subject: string
  htmlBody: string
  textBody: string
  variables: Record<string, string>
}

export class InvoiceEmailService {
  private static readonly EMAIL_TEMPLATES = {
    invoice: {
      subject: 'Invoice #{invoiceNumber} from {companyName}',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: {primaryColor}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">{companyName}</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: {primaryColor};">Invoice #{invoiceNumber}</h2>
            
            <p>Dear {clientName},</p>
            
            <p>Please find attached invoice #{invoiceNumber} for the amount of <strong>{total}</strong>.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: {primaryColor};">Invoice Details</h3>
              <p><strong>Invoice Number:</strong> {invoiceNumber}</p>
              <p><strong>Issue Date:</strong> {issueDate}</p>
              <p><strong>Due Date:</strong> {dueDate}</p>
              <p><strong>Amount:</strong> {total}</p>
              {projectInfo}
            </div>
            
            {paymentInstructions}
            
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            
            <p>Thank you for your business!</p>
            
            <p>Best regards,<br>
            {companyName}<br>
            {contactEmail}<br>
            {contactPhone}</p>
          </div>
          
          <div style="background-color: #e5e5e5; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message. Please do not reply to this email.</p>
            {trackingPixel}
          </div>
        </div>
      `,
      textBody: `
Dear {clientName},

Please find attached invoice #{invoiceNumber} for the amount of {total}.

Invoice Details:
- Invoice Number: {invoiceNumber}
- Issue Date: {issueDate}
- Due Date: {dueDate}
- Amount: {total}
{projectInfo}

{paymentInstructions}

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
{companyName}
{contactEmail}
{contactPhone}
      `
    },
    reminder: {
      subject: 'Payment Reminder: Invoice #{invoiceNumber} - {daysPastDue} days overdue',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">{companyName}</h1>
            <h2 style="margin: 10px 0 0 0;">Payment Reminder</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Dear {clientName},</p>
            
            <p>This is a friendly reminder that invoice #{invoiceNumber} is now <strong>{daysPastDue} days overdue</strong>.</p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #92400e;">Outstanding Invoice</h3>
              <p><strong>Invoice Number:</strong> {invoiceNumber}</p>
              <p><strong>Original Due Date:</strong> {dueDate}</p>
              <p><strong>Amount Due:</strong> {amountDue}</p>
              <p><strong>Days Overdue:</strong> {daysPastDue}</p>
            </div>
            
            <p>Please arrange payment at your earliest convenience to avoid any late fees or service interruptions.</p>
            
            {paymentInstructions}
            
            <p>If you have already made this payment, please disregard this notice. If you have any questions or concerns, please contact us immediately.</p>
            
            <p>Thank you for your prompt attention to this matter.</p>
            
            <p>Best regards,<br>
            {companyName}<br>
            {contactEmail}<br>
            {contactPhone}</p>
          </div>
        </div>
      `,
      textBody: `
Dear {clientName},

This is a friendly reminder that invoice #{invoiceNumber} is now {daysPastDue} days overdue.

Outstanding Invoice Details:
- Invoice Number: {invoiceNumber}
- Original Due Date: {dueDate}
- Amount Due: {amountDue}
- Days Overdue: {daysPastDue}

Please arrange payment at your earliest convenience to avoid any late fees or service interruptions.

{paymentInstructions}

If you have already made this payment, please disregard this notice. If you have any questions or concerns, please contact us immediately.

Thank you for your prompt attention to this matter.

Best regards,
{companyName}
{contactEmail}
{contactPhone}
      `
    }
  }

  static generateEmailContent(
    invoice: Invoice,
    template: InvoiceTemplate,
    emailType: 'invoice' | 'reminder' = 'invoice',
    customVariables: Record<string, string> = {}
  ): EmailTemplate {
    const emailTemplate = this.EMAIL_TEMPLATES[emailType]
    
    // Calculate days past due for reminders
    const daysPastDue = emailType === 'reminder' 
      ? Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    // Build variables object
    const variables: Record<string, string> = {
      // Invoice variables
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      issueDate: new Date(invoice.issueDate).toLocaleDateString(),
      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
      total: this.formatCurrency(invoice.total, invoice.currency),
      amountDue: this.formatCurrency(invoice.amountDue || invoice.total, invoice.currency),
      daysPastDue: daysPastDue.toString(),
      
      // Company variables
      companyName: template.branding.companyName,
      contactEmail: template.branding.contact.email,
      contactPhone: template.branding.contact.phone || '',
      
      // Design variables
      primaryColor: template.design.colorScheme.primary,
      
      // Project info
      projectInfo: invoice.projectName 
        ? `<p><strong>Project:</strong> ${invoice.projectName}</p>`
        : '',
      
      // Payment instructions
      paymentInstructions: invoice.terms 
        ? `<div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;"><h3 style="margin-top: 0; color: ${template.design.colorScheme.primary};">Payment Instructions</h3><p>${invoice.terms}</p></div>`
        : '',
      
      // Tracking pixel (for email opens)
      trackingPixel: `<img src="/api/invoices/${invoice.id}/track-email-open" width="1" height="1" style="display: none;" />`,
      
      // Custom variables
      ...customVariables
    }

    // Replace variables in templates
    const subject = this.replaceVariables(emailTemplate.subject, variables)
    const htmlBody = this.replaceVariables(emailTemplate.htmlBody, variables)
    const textBody = this.replaceVariables(emailTemplate.textBody, variables)

    return {
      subject,
      htmlBody,
      textBody,
      variables
    }
  }

  private static replaceVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  private static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  static async sendInvoiceEmail(
    invoice: Invoice,
    template: InvoiceTemplate,
    pdfBlob: Blob,
    options: Partial<EmailOptions> = {}
  ): Promise<InvoiceEmailHistory> {
    const emailContent = this.generateEmailContent(invoice, template, 'invoice')
    
    const emailOptions: EmailOptions = {
      to: options.to || invoice.clientName, // This should be client email
      subject: options.subject || emailContent.subject,
      body: emailContent.htmlBody,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBlob,
          contentType: 'application/pdf'
        }
      ],
      trackOpens: true,
      trackClicks: true,
      ...options
    }

    try {
      // This would integrate with your email service (SendGrid, AWS SES, etc.)
      const response = await this.sendEmail(emailOptions)
      
      const emailHistory: InvoiceEmailHistory = {
        id: this.generateId(),
        sentAt: new Date().toISOString(),
        sentTo: emailOptions.to,
        subject: emailOptions.subject,
        status: 'sent'
      }

      return emailHistory
    } catch (error) {
      console.error('Failed to send invoice email:', error)
      throw new Error('Failed to send invoice email')
    }
  }

  static async sendReminderEmail(
    invoice: Invoice,
    template: InvoiceTemplate,
    options: Partial<EmailOptions> = {}
  ): Promise<InvoiceEmailHistory> {
    const emailContent = this.generateEmailContent(invoice, template, 'reminder')
    
    const emailOptions: EmailOptions = {
      to: options.to || invoice.clientName, // This should be client email
      subject: options.subject || emailContent.subject,
      body: emailContent.htmlBody,
      trackOpens: true,
      trackClicks: true,
      ...options
    }

    try {
      const response = await this.sendEmail(emailOptions)
      
      const emailHistory: InvoiceEmailHistory = {
        id: this.generateId(),
        sentAt: new Date().toISOString(),
        sentTo: emailOptions.to,
        subject: emailOptions.subject,
        status: 'sent'
      }

      return emailHistory
    } catch (error) {
      console.error('Failed to send reminder email:', error)
      throw new Error('Failed to send reminder email')
    }
  }

  private static async sendEmail(options: EmailOptions): Promise<any> {
    // This is a placeholder for actual email service integration
    // You would replace this with your preferred email service:
    // - SendGrid
    // - AWS SES
    // - Nodemailer
    // - Resend
    // etc.
    
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    })

    if (!response.ok) {
      throw new Error(`Email service responded with status: ${response.status}`)
    }

    return response.json()
  }

  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  static scheduleReminders(invoice: Invoice): Date[] {
    const dueDate = new Date(invoice.dueDate)
    const reminderDates: Date[] = []
    
    // Send reminders at: 7 days before due, 1 day before due, 7 days after due, 30 days after due
    const reminderOffsets = [-7, -1, 7, 30] // days relative to due date
    
    reminderOffsets.forEach(offset => {
      const reminderDate = new Date(dueDate)
      reminderDate.setDate(dueDate.getDate() + offset)
      
      // Only schedule future reminders
      if (reminderDate > new Date()) {
        reminderDates.push(reminderDate)
      }
    })
    
    return reminderDates
  }
}

export default InvoiceEmailService