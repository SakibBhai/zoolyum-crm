import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/projects/[id]/recurring-tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const recurringTasks = await sql`
      SELECT 
        id,
        project_id,
        title,
        description,
        frequency,
        interval_value as interval,
        days_of_week,
        day_of_month,
        start_date,
        end_date,
        is_active,
        last_generated,
        next_due,
        assigned_to,
        priority,
        estimated_hours,
        tags,
        created_at,
        updated_at
      FROM recurring_tasks 
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
    `

    return NextResponse.json(recurringTasks)
  } catch (error) {
    console.error('Error fetching recurring tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring tasks' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/recurring-tasks
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()

    const {
      title,
      description,
      frequency,
      interval,
      daysOfWeek,
      dayOfMonth,
      startDate,
      endDate,
      assignedTo,
      priority,
      estimatedHours,
      tags,
      isActive,
      nextDue
    } = body

    // Validate required fields
    if (!title || !frequency || !startDate || !nextDue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate frequency
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency' },
        { status: 400 }
      )
    }

    // Validate priority
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO recurring_tasks (
        project_id,
        title,
        description,
        frequency,
        interval_value,
        days_of_week,
        day_of_month,
        start_date,
        end_date,
        assigned_to,
        priority,
        estimated_hours,
        tags,
        is_active,
        next_due
      ) VALUES (
        ${projectId},
        ${title},
        ${description || null},
        ${frequency},
        ${interval || 1},
        ${daysOfWeek || null},
        ${dayOfMonth || null},
        ${startDate},
        ${endDate || null},
        ${assignedTo || null},
        ${priority || 'medium'},
        ${estimatedHours || null},
        ${tags || []},
        ${isActive !== undefined ? isActive : true},
        ${nextDue}
      )
      RETURNING *
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating recurring task:', error)
    return NextResponse.json(
      { error: 'Failed to create recurring task' },
      { status: 500 }
    )
  }
}

// Helper function to calculate next due date
function calculateNextDue(task: any): Date {
  const startDate = new Date(task.startDate)
  const interval = task.interval || 1

  switch (task.frequency) {
    case 'daily':
      return new Date(startDate.getTime() + (interval * 24 * 60 * 60 * 1000))
    case 'weekly':
      return new Date(startDate.getTime() + (interval * 7 * 24 * 60 * 60 * 1000))
    case 'monthly':
      const monthlyDate = new Date(startDate)
      monthlyDate.setMonth(monthlyDate.getMonth() + interval)
      return monthlyDate
    case 'yearly':
      const yearlyDate = new Date(startDate)
      yearlyDate.setFullYear(yearlyDate.getFullYear() + interval)
      return yearlyDate
    default:
      return startDate
  }
}