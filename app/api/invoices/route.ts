import { NextRequest, NextResponse } from 'next/server'
import { invoicesService } from '@/lib/neon-db'
import { Invoice } from '@/types/invoice'
import { InvoiceCalculator } from '@/lib/invoice-calculations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const invoices = await invoicesService.getAll()

    // Calculate payment status for each invoice
    const invoicesWithCalculations = invoices.map(invoice => {
      // Transform database record to Invoice type for calculation
      const invoiceData = {
        ...invoice,
        total: invoice.total || 0,
        payments: invoice.payments || [],
        dueDate: invoice.due_date || invoice.dueDate,
        status: invoice.status
      } as Invoice

      const paymentStatus = InvoiceCalculator.calculatePaymentStatus(invoiceData)
      return {
        ...invoice,
        amountPaid: paymentStatus.amountPaid,
        amountDue: paymentStatus.amountDue,
        status: paymentStatus.status
      }
    })

    return NextResponse.json({
      ...invoices,
      invoices: invoicesWithCalculations
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const invoiceData = await request.json()

    // Validate required fields
    if (!invoiceData.clientId || !invoiceData.lineItems || invoiceData.lineItems.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and lineItems are required' },
        { status: 400 }
      )
    }

    // Calculate invoice totals
    const calculations = InvoiceCalculator.calculateInvoice(invoiceData)

    // Enhance invoice data with calculations
    const enhancedInvoiceData = {
      ...invoiceData,
      subtotal: calculations.subtotal,
      taxAmount: calculations.totalTax,
      total: calculations.total,
      amountPaid: 0,
      amountDue: calculations.total,
      payments: [],
      emailHistory: [],
      remindersSent: 0,
      currency: invoiceData.currency || 'USD',
      currencySymbol: invoiceData.currencySymbol || '$',
      status: invoiceData.status || 'draft',
      createdBy: 'current_user' // This should come from authentication
    }

    // Generate invoice number if not provided
    if (!enhancedInvoiceData.invoiceNumber) {
      enhancedInvoiceData.invoiceNumber = InvoiceCalculator.generateInvoiceNumber()
    }

    // Calculate due date if not provided
    if (!enhancedInvoiceData.dueDate && enhancedInvoiceData.issueDate) {
      const dueDays = enhancedInvoiceData.dueDays || 30
      enhancedInvoiceData.dueDate = InvoiceCalculator.calculateDueDate(
        enhancedInvoiceData.issueDate,
        dueDays
      )
    }

    const invoice = await invoicesService.create(enhancedInvoiceData)
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
