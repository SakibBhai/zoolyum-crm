import type { LineItem } from "@/types/invoice"

export type RecurrenceInterval = "weekly" | "monthly" | "quarterly" | "yearly" | "custom"

export interface RecurringInvoiceTemplate {
  id: string
  name: string
  clientId: string
  clientName: string
  projectId?: string
  projectName?: string
  description: string
  active: boolean
  recurrenceInterval: RecurrenceInterval
  customDays?: number // For custom interval in days
  nextGenerationDate: string
  lastGeneratedDate?: string
  endDate?: string // Optional end date
  taxRate: number
  discount: number
  notes?: string
  lineItems: LineItem[]
  createdAt: string
  updatedAt: string
}

export interface RecurringInvoiceFormData {
  name: string
  clientId: string
  projectId?: string
  description: string
  recurrenceInterval: RecurrenceInterval
  customDays?: number
  startDate: string
  endDate?: string
  taxRate: number
  discount: number
  notes?: string
  lineItems: LineItem[]
}
