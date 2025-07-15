import { NextRequest, NextResponse } from 'next/server'
import { transactionsService } from '@/lib/neon-db'

// GET /api/transactions/[id] - Get a specific transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction ID is required'
        },
        { status: 400 }
      )
    }
    
    const transaction = await transactionsService.getById(id)
    
    if (!transaction) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: transaction
    })
    
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/transactions/[id] - Update a specific transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction ID is required'
        },
        { status: 400 }
      )
    }
    
    // Validate transaction type if provided
    if (body.type && !['income', 'expense'].includes(body.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid transaction type. Must be "income" or "expense"'
        },
        { status: 400 }
      )
    }
    
    // Validate amount if provided
    if (body.amount !== undefined) {
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
      body.amount = amount
    }
    
    // Validate date format if provided
    if (body.date) {
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
    }
    
    // Validate status if provided
    if (body.status && !['pending', 'completed', 'cancelled'].includes(body.status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid status. Must be "pending", "completed", or "cancelled"'
        },
        { status: 400 }
      )
    }
    
    // Validate recurring frequency if provided
    if (body.recurring_frequency && !['weekly', 'monthly', 'quarterly', 'yearly'].includes(body.recurring_frequency)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid recurring frequency. Must be "weekly", "monthly", "quarterly", or "yearly"'
        },
        { status: 400 }
      )
    }
    
    // Prepare update data with proper field mapping
    const updateData: any = {}
    
    // Map frontend field names to database field names
    const fieldMapping = {
      projectId: 'project_id',
      clientId: 'client_id',
      invoiceId: 'invoice_id',
      receiptUrl: 'receipt_url',
      taxAmount: 'tax_amount',
      taxRate: 'tax_rate',
      paymentMethod: 'payment_method',
      referenceNumber: 'reference_number',
      isRecurring: 'is_recurring',
      recurringFrequency: 'recurring_frequency',
      recurringEndDate: 'recurring_end_date',
      createdBy: 'created_by'
    }
    
    // Copy direct fields
    const directFields = ['type', 'amount', 'category', 'description', 'date', 'notes', 'tags', 'status']
    directFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })
    
    // Copy mapped fields
    Object.entries(fieldMapping).forEach(([frontendField, dbField]) => {
      if (body[frontendField] !== undefined) {
        updateData[dbField] = body[frontendField]
      }
      // Also check for direct database field names
      if (body[dbField] !== undefined) {
        updateData[dbField] = body[dbField]
      }
    })
    
    // Handle numeric fields
    if (updateData.tax_amount !== undefined) {
      updateData.tax_amount = parseFloat(updateData.tax_amount || '0')
    }
    if (updateData.tax_rate !== undefined) {
      updateData.tax_rate = parseFloat(updateData.tax_rate || '0')
    }
    
    // Handle boolean fields
    if (updateData.is_recurring !== undefined) {
      updateData.is_recurring = Boolean(updateData.is_recurring)
    }
    
    // Handle array fields
    if (updateData.tags !== undefined && !Array.isArray(updateData.tags)) {
      updateData.tags = []
    }
    
    const updatedTransaction = await transactionsService.update(id, updateData)
    
    return NextResponse.json({
      success: true,
      data: updatedTransaction,
      message: 'Transaction updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating transaction:', error)
    
    if (error instanceof Error && error.message === 'Transaction not found') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/transactions/[id] - Delete a specific transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction ID is required'
        },
        { status: 400 }
      )
    }
    
    // Check if transaction exists before deleting
    const existingTransaction = await transactionsService.getById(id)
    
    if (!existingTransaction) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Transaction not found'
        },
        { status: 404 }
      )
    }
    
    await transactionsService.delete(id)
    
    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete transaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}