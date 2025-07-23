export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled" | "viewed" | "partial"

export interface InvoiceRecipient {
  id: string
  name: string
  email: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number

  // Enhanced fields
  unit?: string
  taxRate?: number
  taxAmount?: number
  discountRate?: number
  discountAmount?: number
  discountType?: 'percentage' | 'fixed'

  // Project tracking
  projectId?: string
  taskId?: string

  // Categories
  category?: string

  // Time tracking
  hours?: number
  startDate?: string
  endDate?: string

  // Additional details
  notes?: string
  isRecurring?: boolean
}

export interface InvoicePayment {
  id: string
  amount: number
  date: string
  method: string
  reference?: string
  notes?: string
}

export interface InvoiceEmailHistory {
  id: string
  sentAt: string
  sentTo: string
  subject: string
  status: 'sent' | 'delivered' | 'opened' | 'failed'
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  recipientInfo: InvoiceRecipient
  projectId?: string
  projectName?: string
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'partial'
  lineItems: LineItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discountRate?: number
  discountAmount?: number
  discountType?: 'percentage' | 'fixed'
  shippingAmount?: number
  shippingTaxRate?: number
  shippingTaxAmount?: number
  total: number
  notes?: string
  terms?: string
  paymentMethod?: string
  paymentDetails?: string

  // Template and branding
  templateId?: string

  // Payment tracking
  payments: InvoicePayment[]
  amountPaid: number
  amountDue: number

  // Email tracking
  emailHistory: InvoiceEmailHistory[]
  lastSentAt?: string
  viewedAt?: string

  // Reminders
  remindersSent: number
  nextReminderDate?: string

  // Additional fields
  poNumber?: string
  currency: string
  currencySymbol: string
  exchangeRate?: number

  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface InvoiceFormData {
  clientId: string
  recipientInfo: InvoiceRecipient
  projectId?: string
  issueDate: string
  dueDate: string
  lineItems: LineItem[]
  taxRate: number
  discountAmount: number
  notes?: string
  terms?: string
  paymentMethod?: string
  paymentDetails?: string
}
