import { NextRequest, NextResponse } from 'next/server'
import { transactionsService } from '@/lib/neon-db'

// GET /api/transactions - List transactions with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    }
    
    const result = await transactionsService.getAll(params)
    
    return NextResponse.json({
      success: true,
      data: result.transactions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['type', 'amount', 'category', 'description', 'date']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          missingFields
        },
        { status: 400 }
      )
    }
    
    // Validate transaction type
    if (!['income', 'expense'].includes(body.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid transaction type. Must be "income" or "expense"'
        },
        { status: 400 }
      )
    }
    
    // Validate amount
    const amount = parseFloat(body.amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Amount must be a positive number'
        },
        { status: 400 }
      )
    }
    
    // Validate date format
    const date = new Date(body.date)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid date format'
        },
        { status: 400 }
      )
    }
    
    // Prepare transaction data (only using columns that exist in the database)
    const transactionData = {
      type: body.type,
      amount: amount,
      category: body.category.trim(),
      description: body.description.trim(),
      transaction_date: body.date,
      project_id: body.projectId || body.project_id || null,
      client_id: body.clientId || body.client_id || null,
      invoice_id: body.invoiceId || body.invoice_id || null,
      status: body.status || 'completed',
      notes: body.notes || null,
      payment_method: body.paymentMethod || body.payment_method || null,
      reference_number: body.referenceNumber || body.reference_number || null
    }
    
    const newTransaction = await transactionsService.create(transactionData)
    
    return NextResponse.json({
      success: true,
      data: newTransaction,
      message: 'Transaction created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}