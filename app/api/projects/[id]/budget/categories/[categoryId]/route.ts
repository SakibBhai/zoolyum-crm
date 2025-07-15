import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/projects/[id]/budget/categories/[categoryId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const { id: projectId, categoryId } = await params
    
    const category = await sql`
      SELECT 
        id,
        name,
        allocated_amount,
        spent_amount,
        alert_threshold,
        color,
        description,
        created_at,
        updated_at,
        CASE 
          WHEN allocated_amount > 0 THEN (spent_amount / allocated_amount * 100)
          ELSE 0
        END as utilization_percentage
      FROM budget_categories
      WHERE id = ${categoryId} AND project_id = ${projectId}
    `

    if (category.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get expenses for this category
    const expenses = await sql`
      SELECT 
        id,
        description,
        amount,
        expense_date,
        receipt_url,
        notes,
        created_at
      FROM budget_expenses
      WHERE category_id = ${categoryId} AND project_id = ${projectId}
      ORDER BY expense_date DESC, created_at DESC
    `

    return NextResponse.json({
      ...category[0],
      expenses
    })
  } catch (error) {
    console.error('Error fetching budget category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget category' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/budget/categories/[categoryId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const { id: projectId, categoryId } = await params
    const body = await request.json()
    const { name, allocatedAmount, alertThreshold, color, description } = body

    // Get current category data
    const currentCategory = await sql`
      SELECT * FROM budget_categories
      WHERE id = ${categoryId} AND project_id = ${projectId}
    `

    if (currentCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const current = currentCategory[0]
    const updates: any = {}
    const changes: string[] = []

    // Build update object and track changes
    if (name !== undefined && name !== current.name) {
      // Check if new name already exists
      const existingCategory = await sql`
        SELECT id FROM budget_categories
        WHERE project_id = ${projectId} 
          AND LOWER(name) = LOWER(${name})
          AND id != ${categoryId}
      `

      if (existingCategory.length > 0) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 400 }
        )
      }

      updates.name = name
      changes.push(`Name changed from "${current.name}" to "${name}"`)
    }

    if (allocatedAmount !== undefined && allocatedAmount !== current.allocated_amount) {
      if (allocatedAmount < 0) {
        return NextResponse.json(
          { error: 'Allocated amount must be positive' },
          { status: 400 }
        )
      }
      updates.allocated_amount = allocatedAmount
      changes.push(`Allocation changed from $${current.allocated_amount} to $${allocatedAmount}`)
    }

    if (alertThreshold !== undefined && alertThreshold !== current.alert_threshold) {
      if (alertThreshold < 0 || alertThreshold > 100) {
        return NextResponse.json(
          { error: 'Alert threshold must be between 0 and 100' },
          { status: 400 }
        )
      }
      updates.alert_threshold = alertThreshold
      changes.push(`Alert threshold changed from ${current.alert_threshold}% to ${alertThreshold}%`)
    }

    if (color !== undefined && color !== current.color) {
      updates.color = color
    }

    if (description !== undefined && description !== current.description) {
      updates.description = description
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: 'No changes detected' },
        { status: 200 }
      )
    }

    // Update the category
    updates.updated_at = new Date().toISOString()
    
    // Build individual update queries for each field
    for (const [key, value] of Object.entries(updates)) {
      await sql`
        UPDATE budget_categories
        SET ${sql.unsafe(key)} = ${value}
        WHERE id = ${categoryId} AND project_id = ${projectId}
      `
    }

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
          'category_updated',
          ${current.allocated_amount},
          ${updates.allocated_amount || current.allocated_amount},
          'category_allocation',
          ${'Category "' + (updates.name || current.name) + '" updated: ' + changes.join(', ')}
        )
      `
    }

    return NextResponse.json({ message: 'Category updated successfully' })
  } catch (error) {
    console.error('Error updating budget category:', error)
    return NextResponse.json(
      { error: 'Failed to update budget category' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/budget/categories/[categoryId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const { id: projectId, categoryId } = await params

    // Get category info before deletion
    const category = await sql`
      SELECT name, allocated_amount FROM budget_categories
      WHERE id = ${categoryId} AND project_id = ${projectId}
    `

    if (category.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has expenses
    const expenses = await sql`
      SELECT COUNT(*) as count FROM budget_expenses
      WHERE category_id = ${categoryId}
    `

    if (parseInt(expenses[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing expenses. Please reassign or delete expenses first.' },
        { status: 400 }
      )
    }

    // Delete the category
    await sql`
      DELETE FROM budget_categories
      WHERE id = ${categoryId} AND project_id = ${projectId}
    `

    // Log the deletion
    await sql`
      INSERT INTO budget_history (
        project_id,
        change_type,
        old_value,
        field_changed,
        description
      ) VALUES (
        ${projectId},
        'category_deleted',
        ${category[0].allocated_amount},
        'category_allocation',
        ${'Category "' + category[0].name + '" deleted'}
      )
    `

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting budget category:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget category' },
      { status: 500 }
    )
  }
}