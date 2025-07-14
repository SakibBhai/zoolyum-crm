import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/projects/[id]/tasks/[taskId]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = params
    
    const task = await sql`
      SELECT 
        gt.id,
        gt.recurring_task_id,
        gt.title,
        gt.description,
        gt.due_date,
        gt.assigned_to,
        gt.priority,
        gt.status,
        gt.estimated_hours,
        gt.actual_hours,
        gt.tags,
        gt.completed_at,
        gt.created_at,
        gt.updated_at,
        rt.title as recurring_task_title,
        rt.frequency
      FROM generated_tasks gt
      LEFT JOIN recurring_tasks rt ON gt.recurring_task_id = rt.id
      WHERE gt.id = ${taskId} AND gt.project_id = ${projectId}
    `

    if (task.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task[0])
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/tasks/[taskId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = params
    const body = await request.json()
    const { 
      title, 
      description, 
      dueDate, 
      assignedTo, 
      priority, 
      status, 
      estimatedHours, 
      actualHours, 
      tags 
    } = body

    // Get current task data
    const currentTask = await sql`
      SELECT * FROM generated_tasks
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    if (currentTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const current = currentTask[0]
    const updates: any = {}

    // Build update object with validation
    if (title !== undefined && title !== current.title) {
      if (!title.trim()) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        )
      }
      updates.title = title
    }

    if (description !== undefined && description !== current.description) {
      updates.description = description
    }

    if (dueDate !== undefined && dueDate !== current.due_date?.toISOString()) {
      const dueDateObj = new Date(dueDate)
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json(
          { error: 'Invalid due date' },
          { status: 400 }
        )
      }
      updates.due_date = dueDate
    }

    if (assignedTo !== undefined && assignedTo !== current.assigned_to) {
      updates.assigned_to = assignedTo
    }

    if (priority !== undefined && priority !== current.priority) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return NextResponse.json(
          { error: 'Priority must be low, medium, or high' },
          { status: 400 }
        )
      }
      updates.priority = priority
    }

    if (status !== undefined && status !== current.status) {
      if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json(
          { error: 'Status must be pending, in_progress, completed, or cancelled' },
          { status: 400 }
        )
      }
      updates.status = status
      
      // Set completed_at when marking as completed
      if (status === 'completed' && current.status !== 'completed') {
        updates.completed_at = new Date().toISOString()
      } else if (status !== 'completed' && current.status === 'completed') {
        updates.completed_at = null
      }
    }

    if (estimatedHours !== undefined && estimatedHours !== current.estimated_hours) {
      if (estimatedHours !== null && (estimatedHours < 0 || estimatedHours > 1000)) {
        return NextResponse.json(
          { error: 'Estimated hours must be between 0 and 1000' },
          { status: 400 }
        )
      }
      updates.estimated_hours = estimatedHours
    }

    if (actualHours !== undefined && actualHours !== current.actual_hours) {
      if (actualHours !== null && (actualHours < 0 || actualHours > 1000)) {
        return NextResponse.json(
          { error: 'Actual hours must be between 0 and 1000' },
          { status: 400 }
        )
      }
      updates.actual_hours = actualHours
    }

    if (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(current.tags)) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { error: 'Tags must be an array' },
          { status: 400 }
        )
      }
      updates.tags = JSON.stringify(tags)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: 'No changes detected' },
        { status: 200 }
      )
    }

    // Update the task
    updates.updated_at = new Date().toISOString()
    
    const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ')
    const updateValues = Object.values(updates)
    
    await sql`
      UPDATE generated_tasks
      SET ${sql.unsafe(updateFields)}
      WHERE id = ${taskId} AND project_id = ${projectId}
    `.apply(null, [...updateValues])

    return NextResponse.json({ message: 'Task updated successfully' })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/tasks/[taskId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = params

    // Check if task exists
    const task = await sql`
      SELECT title FROM generated_tasks
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    if (task.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete the task
    await sql`
      DELETE FROM generated_tasks
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/tasks/[taskId] - Quick status update
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { id: projectId, taskId } = params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Check if task exists
    const task = await sql`
      SELECT status FROM generated_tasks
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    if (task.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Set completed_at when marking as completed
    if (status === 'completed' && task[0].status !== 'completed') {
      updates.completed_at = new Date().toISOString()
    } else if (status !== 'completed' && task[0].status === 'completed') {
      updates.completed_at = null
    }

    // Update the task status
    await sql`
      UPDATE generated_tasks
      SET 
        status = ${status},
        completed_at = ${updates.completed_at || null},
        updated_at = ${updates.updated_at}
      WHERE id = ${taskId} AND project_id = ${projectId}
    `

    return NextResponse.json({ message: 'Task status updated successfully' })
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    )
  }
}