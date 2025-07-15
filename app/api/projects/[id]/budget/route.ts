import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/projects/[id]/budget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
    // Get project budget summary
    const budgetSummary = await sql`
      SELECT * FROM budget_summary
      WHERE project_id = ${projectId}
    `

    // Get budget categories
    const categories = await sql`
      SELECT 
        id,
        name,
        allocated_amount,
        spent_amount,
        alert_threshold,
        color,
        description,
        created_at,
        updated_at
      FROM budget_categories
      WHERE project_id = ${projectId}
      ORDER BY name
    `

    // Get recent expenses
    const recentExpenses = await sql`
      SELECT 
        be.id,
        be.description,
        be.amount,
        be.expense_date,
        be.receipt_url,
        be.notes,
        be.created_at,
        bc.name as category_name,
        bc.color as category_color
      FROM budget_expenses be
      LEFT JOIN budget_categories bc ON be.category_id = bc.id
      WHERE be.project_id = ${projectId}
      ORDER BY be.expense_date DESC, be.created_at DESC
      LIMIT 10
    `

    // Get budget history for trends
    const budgetHistory = await sql`
      SELECT 
        change_type,
        old_value,
        new_value,
        field_changed,
        changed_at,
        description
      FROM budget_history
      WHERE project_id = ${projectId}
      ORDER BY changed_at DESC
      LIMIT 20
    `

    return NextResponse.json({
      summary: budgetSummary[0] || {
        project_id: projectId,
        total_budget: 0,
        total_spent: 0,
        remaining_budget: 0,
        budget_utilization: 0
      },
      categories,
      recentExpenses,
      budgetHistory
    })
  } catch (error) {
    console.error('Error fetching budget data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget data' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/budget - Update project budget
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { totalBudget, currency = 'USD' } = body

    if (!totalBudget || totalBudget < 0) {
      return NextResponse.json(
        { error: 'Valid total budget is required' },
        { status: 400 }
      )
    }

    // Check if project budget exists
    const existingBudget = await sql`
      SELECT id, total_budget FROM project_budgets
      WHERE project_id = ${projectId}
    `

    if (existingBudget.length > 0) {
      // Update existing budget
      const oldBudget = existingBudget[0].total_budget
      
      await sql`
        UPDATE project_budgets
        SET 
          total_budget = ${totalBudget},
          currency = ${currency},
          updated_at = NOW()
        WHERE project_id = ${projectId}
      `

      // Log the change
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
          'budget_update',
          ${oldBudget},
          ${totalBudget},
          'total_budget',
          'Project budget updated'
        )
      `
    } else {
      // Create new budget
      await sql`
        INSERT INTO project_budgets (
          project_id,
          total_budget,
          currency
        ) VALUES (
          ${projectId},
          ${totalBudget},
          ${currency}
        )
      `

      // Log the creation
      await sql`
        INSERT INTO budget_history (
          project_id,
          change_type,
          new_value,
          field_changed,
          description
        ) VALUES (
          ${projectId},
          'budget_created',
          ${totalBudget},
          'total_budget',
          'Project budget created'
        )
      `
    }

    return NextResponse.json({ message: 'Budget updated successfully' })
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}