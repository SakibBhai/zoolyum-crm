import { Invoice, LineItem } from '@/types/invoice'

export interface InvoiceCalculationResult {
  subtotal: number
  totalDiscount: number
  totalTax: number
  shippingAmount: number
  shippingTax: number
  total: number
  lineItemTotals: {
    [lineItemId: string]: {
      subtotal: number
      discount: number
      taxableAmount: number
      tax: number
      total: number
    }
  }
}

export class InvoiceCalculator {
  static calculateLineItem(lineItem: LineItem): {
    subtotal: number
    discount: number
    taxableAmount: number
    tax: number
    total: number
  } {
    const subtotal = lineItem.quantity * lineItem.rate
    
    // Calculate discount
    let discount = 0
    if (lineItem.discountRate && lineItem.discountRate > 0) {
      if (lineItem.discountType === 'percentage') {
        discount = subtotal * (lineItem.discountRate / 100)
      } else {
        discount = lineItem.discountAmount || 0
      }
    }
    
    const taxableAmount = subtotal - discount
    
    // Calculate tax
    const taxRate = lineItem.taxRate || 0
    const tax = taxableAmount * (taxRate / 100)
    
    const total = taxableAmount + tax
    
    return {
      subtotal,
      discount,
      taxableAmount,
      tax,
      total
    }
  }
  
  static calculateInvoice(invoice: Partial<Invoice>): InvoiceCalculationResult {
    const lineItems = invoice.lineItems || []
    const lineItemTotals: InvoiceCalculationResult['lineItemTotals'] = {}
    
    let subtotal = 0
    let totalLineItemDiscount = 0
    let totalLineItemTax = 0
    
    // Calculate line items
    lineItems.forEach(lineItem => {
      const calculation = this.calculateLineItem(lineItem)
      lineItemTotals[lineItem.id] = calculation
      
      subtotal += calculation.subtotal
      totalLineItemDiscount += calculation.discount
      totalLineItemTax += calculation.tax
    })
    
    // Calculate invoice-level discount
    let invoiceDiscount = 0
    if (invoice.discountRate && invoice.discountRate > 0) {
      if (invoice.discountType === 'percentage') {
        invoiceDiscount = subtotal * (invoice.discountRate / 100)
      } else {
        invoiceDiscount = invoice.discountAmount || 0
      }
    }
    
    const totalDiscount = totalLineItemDiscount + invoiceDiscount
    const taxableSubtotal = subtotal - invoiceDiscount
    
    // Calculate invoice-level tax (applied after invoice discount)
    let invoiceTax = 0
    if (invoice.taxRate && invoice.taxRate > 0) {
      invoiceTax = taxableSubtotal * (invoice.taxRate / 100)
    }
    
    const totalTax = totalLineItemTax + invoiceTax
    
    // Calculate shipping
    const shippingAmount = invoice.shippingAmount || 0
    let shippingTax = 0
    if (invoice.shippingTaxRate && invoice.shippingTaxRate > 0) {
      shippingTax = shippingAmount * (invoice.shippingTaxRate / 100)
    }
    
    const total = subtotal - totalDiscount + totalTax + shippingAmount + shippingTax
    
    return {
      subtotal,
      totalDiscount,
      totalTax,
      shippingAmount,
      shippingTax,
      total,
      lineItemTotals
    }
  }
  
  static formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount)
  }
  
  static formatNumber(amount: number, locale = 'en-US', decimals = 2): string {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount)
  }
  
  static calculatePaymentStatus(invoice: Invoice): {
    amountPaid: number
    amountDue: number
    status: Invoice['status']
  } {
    const amountPaid = invoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    const amountDue = invoice.total - amountPaid
    
    let status: Invoice['status'] = invoice.status
    
    if (amountPaid >= invoice.total) {
      status = 'paid'
    } else if (amountPaid > 0) {
      status = 'partial'
    } else if (new Date(invoice.dueDate) < new Date() && status !== 'cancelled') {
      status = 'overdue'
    }
    
    return {
      amountPaid,
      amountDue,
      status
    }
  }
  
  static generateInvoiceNumber(prefix = 'INV', year?: number, sequence?: number): string {
    const currentYear = year || new Date().getFullYear()
    const sequenceNumber = sequence || 1
    return `${prefix}-${currentYear}-${sequenceNumber.toString().padStart(4, '0')}`
  }
  
  static calculateDueDate(issueDate: string, dueDays: number): string {
    const issue = new Date(issueDate)
    const due = new Date(issue)
    due.setDate(issue.getDate() + dueDays)
    return due.toISOString().split('T')[0]
  }
}

export default InvoiceCalculator