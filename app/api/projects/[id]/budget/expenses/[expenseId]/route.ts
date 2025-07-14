import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/projects/[id]/budget/expenses/[expenseId]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const { id: projectId, expenseId } = params
    
    const expense = await sql`
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
      WHERE be.id = ${expenseId} AND be.project_id = ${projectId}
    `

    if (expense.length === 0) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(expense[0])
  } catch (error) {
    console.error('Error fetching budget expense:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget expense' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/budget/expenses/[expenseId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const { id: projectId, expenseId } = params
    const body = await request.json()
    const { description, amount, categoryId, expenseDate, receiptUrl, notes } = body

    // Get current expense data
    const currentExpense = await sql`
      SELECT * FROM budget_expenses
      WHERE id = ${expenseId} AND project_id = ${projectId}
    `

    if (currentExpense.length === 0) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    const current = currentExpense[0]
    const updates: any = {}
    const changes: string[] = []

    // Build update object and track changes
    if (description !== undefined && description !== current.description) {
      if (!description.trim()) {
        return NextResponse.json(
          { error: 'Description is required' },
          { status: 400 }
        )
      }
      updates.description = description
      changes.push(`Description changed from "${current.description}" to "${description}"`)
    }

    if (amount !== undefined && amount !== current.amount) {
      if (amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be positive' },
          { status: 400 }
        )
      }
      updates.amount = amount
      changes.push(`Amount changed from $${current.amount} to $${amount}`)
    }

    if (categoryId !== undefined && categoryId !== current.category_id) {
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
      updates.category_id = categoryId
      
      // Get category names for logging
      let oldCategoryName = 'Uncategorized'
      let newCategoryName = 'Uncategorized'
      
      if (current.category_id) {
        const oldCategory = await sql`
          SELECT name FROM budget_categories WHERE id = ${current.category_id}
        `
        if (oldCategory.length > 0) {
          oldCategoryName = oldCategory[0].name
        }
      }
      
      if (categoryId) {
        const newCategory = await sql`
          SELECT name FROM budget_categories WHERE id = ${categoryId}
        `
        if (newCategory.length > 0) {
          newCategoryName = newCategory[0].name
        }
      }
      
      changes.push(`Category changed from "${oldCategoryName}" to "${newCategoryName}"`)
    }

    if (expenseDate !== undefined && expenseDate !== current.expense_date.toISOString().split('T')[0]) {
      const expenseDateObj = new Date(expenseDate)
      if (isNaN(expenseDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expense date' },
          { status: 400 }
        )
      }
      updates.expense_date = expenseDate
      changes.push(`Date changed from ${current.expense_date.toISOString().split('T')[0]} to ${expenseDate}`)
    }

    if (receiptUrl !== undefined && receiptUrl !== current.receipt_url) {
      updates.receipt_url = receiptUrl
    }

    if (notes !== undefined && notes !== current.notes) {
      updates.notes = notes
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: 'No changes detected' },
        { status: 200 }
      )
    }

    // Update the expense
    updates.updated_at = new Date().toISOString()
    
    const updateFields = Object.keys(updates).map(key => `${key} = $${key}`).join(', ')
    const updateValues = Object.values(updates)
    
    await sql`
      UPDATE budget_expenses
      SET ${sql.unsafe(updateFields)}
      WHERE id = ${expenseId} AND project_id = ${projectId}
    `.apply(null, updateValues)

    // Log significant changes
    if (changes.length > 0) {
      await sql`
        INSERT INTO budget_history (
          project_id,
          change_type,
          old_value,
          new_value,
          field_changed,
          description
        ) VALUES (
          ${projectId},
          'expense_updated',
          ${current.amount},
          ${updates.amount || current.amount},
          'project_expenses',
          ${'Expense "' + (updates.description || current.description) + '" updated: ' + changes.join(', ')}
        )
      `
    }

    return NextResponse.json({ message: 'Expense updated successfully' })
  } catch (error) {
    console.error('Error updating budget expense:', error)
    return NextResponse.json(
      { error: 'Failed to update budget expense' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/budget/expenses/[expenseId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; expenseId: string } }
) {
  try {
    const { id: projectId, expenseId } = params

    // Get expense info before deletion
    const expense = await sql`
      SELECT 
        be.description,
        be.amount,
        bc.name as category_name
      FROM budget_expenses be
      LEFT JOIN budget_categories bc ON be.category_id = bc.id
      WHERE be.id = ${expenseId} AND be.project_id = ${projectId}
    `

    if (expense.length === 0) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      )
    }

    // Delete the expense
    await sql`
      DELETE FROM budget_expenses
      WHERE id = ${expenseId} AND project_id = ${projectId}
    `

    // Log the deletion
    const categoryName = expense[0].category_name || 'Uncategorized'
    await sql`
      INSERT INTO budget_history (
        project_id,
        change_type,
        old_value,
        field_changed,
        description
      ) VALUES (
        ${projectId},
        'expense_deleted',
        ${expense[0].amount},
        'project_expenses',
        ${'Expense deleted: "' + expense[0].description + '" ($' + expense[0].amount + ') from category "' + categoryName + '"'}
      )
    `

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting budget expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget expense' },
      { status: 500 }
    )
  }
}