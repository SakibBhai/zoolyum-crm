import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/projects/[id]/budget/expenses
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let whereClause = `WHERE be.project_id = ${projectId}`
    const conditions = []

    if (categoryId) {
      conditions.push(`be.category_id = ${categoryId}`)
    }

    if (startDate) {
      conditions.push(`be.expense_date >= '${startDate}'`)
    }

    if (endDate) {
      conditions.push(`be.expense_date <= '${endDate}'`)
    }

    if (conditions.length > 0) {
      whereClause += ' AND ' + conditions.join(' AND ')
    }

    const expenses = await sql`
      SELECT 
        be.id,
        be.description,
        be.amount,
        be.expense_date,
        be.receipt_url,
        be.notes,
        be.created_at,
        be.updated_at,
        bc.name as category_name,
        bc.color as category_color,
        bc.id as category_id
      FROM budget_expenses be
      LEFT JOIN budget_categories bc ON be.category_id = bc.id
      ${sql.unsafe(whereClause)}
      ORDER BY be.expense_date DESC, be.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count for pagination
    const totalCount = await sql`
      SELECT COUNT(*) as count
      FROM budget_expenses be
      ${sql.unsafe(whereClause)}
    `

    // Get expense summary
    const summary = await sql`
      SELECT 
        COUNT(*) as total_expenses,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount
      FROM budget_expenses be
      ${sql.unsafe(whereClause)}
    `

    return NextResponse.json({
      expenses,
      pagination: {
        total: parseInt(totalCount[0].count),
        limit,
        offset,
        hasMore: parseInt(totalCount[0].count) > offset + limit
      },
      summary: summary[0]
    })
  } catch (error) {
    console.error('Error fetching budget expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget expenses' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/budget/expenses
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    const { 
      description, 
      amount, 
      categoryId, 
      expenseDate, 
      receiptUrl, 
      notes 
    } = body

    // Validation
    if (!description || !amount || !expenseDate) {
      return NextResponse.json(
        { error: 'Description, amount, and expense date are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      )
    }

    // Validate expense date
    const expenseDateObj = new Date(expenseDate)
    if (isNaN(expenseDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid expense date' },
        { status: 400 }
      )
    }

    // Validate category if provided
    if (categoryId) {
      const category = await sql`
        SELECT id, name FROM budget_categories
        WHERE id = ${categoryId} AND project_id = ${projectId}
      `

      if (category.length === 0) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
      }
    }

    // Create the expense
    const newExpense = await sql`
      INSERT INTO budget_expenses (
        project_id,
        category_id,
        description,
        amount,
        expense_date,
        receipt_url,
        notes
      ) VALUES (
        ${projectId},
        ${categoryId || null},
        ${description},
        ${amount},
        ${expenseDate},
        ${receiptUrl || null},
        ${notes || null}
      )
      RETURNING *
    `

    // Get category name for logging
    let categoryName = 'Uncategorized'
    if (categoryId) {
      const category = await sql`
        SELECT name FROM budget_categories WHERE id = ${categoryId}
      `
      if (category.length > 0) {
        categoryName = category[0].name
      }
    }

    // Log the expense creation
    await sql`
      INSERT INTO budget_history (
        project_id,
        change_type,
        new_value,
        field_changed,
        description
      ) VALUES (
        ${projectId},
        'expense_added',
        ${amount},
        'project_expenses',
        ${'Expense added: "' + description + '" ($' + amount + ') in category "' + categoryName + '"'}
      )
    `

    // Get the complete expense with category info
    const completeExpense = await sql`
      SELECT 
        be.*,
        bc.name as category_name,
        bc.color as category_color
      FROM budget_expenses be
      LEFT JOIN budget_categories bc ON be.category_id = bc.id
      WHERE be.id = ${newExpense[0].id}
    `

    return NextResponse.json(completeExpense[0], { status: 201 })
  } catch (error) {
    console.error('Error creating budget expense:', error)
    return NextResponse.json(
      { error: 'Failed to create budget expense' },
      { status: 500 }
    )
  }
}