import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/projects/[id]/budget/categories
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
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
        updated_at,
        CASE 
          WHEN allocated_amount > 0 THEN (spent_amount / allocated_amount * 100)
          ELSE 0
        END as utilization_percentage
      FROM budget_categories
      WHERE project_id = ${projectId}
      ORDER BY name
    `

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching budget categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget categories' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/budget/categories
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { 
      name, 
      allocatedAmount, 
      alertThreshold = 80, 
      color = '#3B82F6', 
      description 
    } = body

    // Validation
    if (!name || !allocatedAmount) {
      return NextResponse.json(
        { error: 'Name and allocated amount are required' },
        { status: 400 }
      )
    }

    if (allocatedAmount < 0) {
      return NextResponse.json(
        { error: 'Allocated amount must be positive' },
        { status: 400 }
      )
    }

    if (alertThreshold < 0 || alertThreshold > 100) {
      return NextResponse.json(
        { error: 'Alert threshold must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Check if category name already exists for this project
    const existingCategory = await sql`
      SELECT id FROM budget_categories
      WHERE project_id = ${projectId} AND LOWER(name) = LOWER(${name})
    `

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }

    // Create the category
    const newCategory = await sql`
      INSERT INTO budget_categories (
        project_id,
        name,
        allocated_amount,
        alert_threshold,
        color,
        description
      ) VALUES (
        ${projectId},
        ${name},
        ${allocatedAmount},
        ${alertThreshold},
        ${color},
        ${description || null}
      )
      RETURNING *
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
        'category_created',
        ${allocatedAmount},
        'category_allocation',
        ${'Category "' + name + '" created with allocation of $' + allocatedAmount}
      )
    `

    return NextResponse.json(newCategory[0], { status: 201 })
  } catch (error) {
    console.error('Error creating budget category:', error)
    return NextResponse.json(
      { error: 'Failed to create budget category' },
      { status: 500 }
    )
  }
}