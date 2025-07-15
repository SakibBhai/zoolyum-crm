import { NextRequest, NextResponse } from 'next/server'
import { sql } from "@/lib/neon"
import { InvoicePayment } from '@/types/invoice'
import { InvoiceCalculator } from '@/lib/invoice-calculations'

// GET /api/invoices/[id]/payments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const payments = await sql`
      SELECT 
        id,
        amount,
        payment_date as date,
        payment_method as method,
        reference,
        notes,
        created_at,
        created_by
      FROM invoice_payments 
      WHERE invoice_id = ${id}
      ORDER BY payment_date DESC
    `

    const formattedPayments: InvoicePayment[] = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes
    }))

    return NextResponse.json(formattedPayments)
  } catch (error) {
    console.error('Error fetching invoice payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice payments' },
      { status: 500 }
    )
  }
}

// POST /api/invoices/[id]/payments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const paymentData = await request.json()

    // Validate required fields
    if (!paymentData.amount || !paymentData.date || !paymentData.method) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, date, and method are required' },
        { status: 400 }
      )
    }

    // Validate amount is positive
    if (paymentData.amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than zero' },
        { status: 400 }
      )
    }

    // Check if invoice exists
    const invoice = await sql`
      SELECT id, total, status FROM invoices 
      WHERE id = ${id}
    `

    if (invoice.length === 0) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Check if invoice is cancelled
    if (invoice[0].status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot add payment to cancelled invoice' },
        { status: 400 }
      )
    }

    // Calculate current amount paid
    const existingPayments = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM invoice_payments 
      WHERE invoice_id = ${id}
    `

    const currentAmountPaid = existingPayments[0].total_paid || 0
    const newTotalPaid = currentAmountPaid + paymentData.amount
    const invoiceTotal = invoice[0].total

    // Check if payment would exceed invoice total
    if (newTotalPaid > invoiceTotal) {
      return NextResponse.json(
        { 
          error: `Payment amount would exceed invoice total. Maximum allowed: ${invoiceTotal - currentAmountPaid}` 
        },
        { status: 400 }
      )
    }

    // Generate payment ID
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const createdBy = 'current_user' // This should come from authentication

    // Insert payment
    await sql`
      INSERT INTO invoice_payments (
        id,
        invoice_id,
        amount,
        payment_date,
        payment_method,
        reference,
        notes,
        created_at,
        created_by
      ) VALUES (
        ${paymentId},
        ${id},
        ${paymentData.amount},
        ${paymentData.date},
        ${paymentData.method},
        ${paymentData.reference || null},
        ${paymentData.notes || null},
        ${now},
        ${createdBy}
      )
    `

    // Update invoice status based on payment
    let newStatus = invoice[0].status
    if (newTotalPaid >= invoiceTotal) {
      newStatus = 'paid'
    } else if (newTotalPaid > 0 && invoice[0].status !== 'partial') {
      newStatus = 'partial'
    }

    await sql`
      UPDATE invoices 
      SET 
        status = ${newStatus},
        updated_at = ${now}
      WHERE id = ${id}
    `

    // Fetch the created payment
    const createdPayment = await sql`
      SELECT 
        id,
        amount,
        payment_date as date,
        payment_method as method,
        reference,
        notes
      FROM invoice_payments 
      WHERE id = ${paymentId}
    `

    const formattedPayment: InvoicePayment = {
      id: createdPayment[0].id,
      amount: createdPayment[0].amount,
      date: createdPayment[0].date,
      method: createdPayment[0].method,
      reference: createdPayment[0].reference,
      notes: createdPayment[0].notes
    }

    return NextResponse.json(formattedPayment, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice payment:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice payment' },
      { status: 500 }
    )
  }
}