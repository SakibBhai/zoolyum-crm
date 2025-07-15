import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/projects/[id]/recurring-tasks/[taskId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params

    const result = await sql`
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
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Recurring task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error fetching recurring task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring task' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/recurring-tasks/[taskId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params
    const body = await request.json()

    // Check if task exists
    const existingTask = await sql`
      SELECT id FROM recurring_tasks 
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Recurring task not found' },
        { status: 404 }
      )
    }

    // Handle partial updates
    const updateFields = []

    if (body.title !== undefined) {
      updateFields.push(`title = '${body.title.replace(/'/g, "''")}'`)
    }

    if (body.description !== undefined) {
      updateFields.push(`description = '${body.description ? body.description.replace(/'/g, "''") : ''}'`)
    }

    if (body.frequency !== undefined) {
      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(body.frequency)) {
        return NextResponse.json(
          { error: 'Invalid frequency' },
          { status: 400 }
        )
      }
      updateFields.push(`frequency = '${body.frequency}'`)
    }

    if (body.interval !== undefined) {
      updateFields.push(`interval_value = ${body.interval}`)
    }

    if (body.daysOfWeek !== undefined) {
      updateFields.push(`days_of_week = '${JSON.stringify(body.daysOfWeek)}'`)
    }

    if (body.dayOfMonth !== undefined) {
      updateFields.push(`day_of_month = ${body.dayOfMonth}`)
    }

    if (body.startDate !== undefined) {
      updateFields.push(`start_date = '${body.startDate}'`)
    }

    if (body.endDate !== undefined) {
      updateFields.push(`end_date = ${body.endDate ? `'${body.endDate}'` : 'NULL'}`)
    }

    if (body.isActive !== undefined) {
      updateFields.push(`is_active = ${body.isActive}`)
    }

    if (body.assignedTo !== undefined) {
      updateFields.push(`assigned_to = ${body.assignedTo ? `'${body.assignedTo}'` : 'NULL'}`)
    }

    if (body.priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(body.priority)) {
        return NextResponse.json(
          { error: 'Invalid priority' },
          { status: 400 }
        )
      }
      updateFields.push(`priority = '${body.priority}'`)
    }

    if (body.estimatedHours !== undefined) {
      updateFields.push(`estimated_hours = ${body.estimatedHours}`)
    }

    if (body.tags !== undefined) {
      updateFields.push(`tags = '${JSON.stringify(body.tags)}'`)
    }

    if (body.nextDue !== undefined) {
      updateFields.push(`next_due = '${body.nextDue}'`)
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Add updated_at field
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

    // Build and execute the update query
    const query = `
      UPDATE recurring_tasks 
      SET ${updateFields.join(', ')}
      WHERE id = '${taskId}' AND project_id = '${projectId}'
      RETURNING *
    `

    await sql.unsafe(query)

    // Fetch the updated task
    const result = await sql`
      SELECT * FROM recurring_tasks 
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update recurring task' },
        { status: 500 }
      )
    }

    // Transform the result to match the expected format
    const updatedTask = {
      ...result[0],
      interval: result[0].interval_value,
      daysOfWeek: result[0].days_of_week,
      dayOfMonth: result[0].day_of_month,
      startDate: result[0].start_date,
      endDate: result[0].end_date,
      isActive: result[0].is_active,
      lastGenerated: result[0].last_generated,
      nextDue: result[0].next_due,
      assignedTo: result[0].assigned_to,
      estimatedHours: result[0].estimated_hours,
      createdAt: result[0].created_at,
      updatedAt: result[0].updated_at
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating recurring task:', error)
    return NextResponse.json(
      { error: 'Failed to update recurring task' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/recurring-tasks/[taskId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params

    // Check if task exists
    const existingTask = await sql`
      SELECT id FROM recurring_tasks 
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Recurring task not found' },
        { status: 404 }
      )
    }

    // Delete the recurring task (this will cascade delete generated tasks)
    await sql`
      DELETE FROM recurring_tasks 
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    return NextResponse.json(
      { message: 'Recurring task deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting recurring task:', error)
    return NextResponse.json(
      { error: 'Failed to delete recurring task' },
      { status: 500 }
    )
  }
}