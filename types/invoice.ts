export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled"

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

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
  taskId?: string
  discount?: number
  tax?: number
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
  status: InvoiceStatus
  subtotal: number
  taxRate: number
  taxAmount: number
  discount: number
  total: number
  notes?: string
  terms?: string
  lineItems: InvoiceLineItem[]
  createdAt: string
  updatedAt: string
  paymentMethod?: string
  paymentDetails?: string
}

export interface InvoiceFormData {
  clientId: string
  recipientInfo: InvoiceRecipient
  projectId?: string
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  taxRate: number
  discount: number
  notes?: string
  terms?: string
  paymentMethod?: string
  paymentDetails?: string
}
