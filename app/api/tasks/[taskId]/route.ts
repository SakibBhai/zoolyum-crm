import { type NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { extractUserIdFromRequest } from '@/lib/auth'
import { Task, TaskUpdatePayload } from '@/models/task'

export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Extract and validate user ID from JWT
    let userId: string
    try {
      userId = extractUserIdFromRequest(request)
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing token' },
        { status: 401 }
      )
    }

    // Validate taskId parameter
    const taskId = parseInt(params.taskId)
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Bad Request: Invalid task ID' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    let body: TaskUpdatePayload
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Bad Request: Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Validate at least one updatable field is present
    const updatableFields = ['title', 'description', 'due_date', 'priority']
    const providedFields = Object.keys(body).filter(key => 
      updatableFields.includes(key) && body[key as keyof TaskUpdatePayload] !== undefined
    )

    if (providedFields.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request: At least one updatable field must be provided' },
        { status: 400 }
      )
    }

    // Validate priority if provided
    if (body.priority && !['low', 'medium', 'high'].includes(body.priority)) {
      return NextResponse.json(
        { error: 'Bad Request: Priority must be low, medium, or high' },
        { status: 400 }
      )
    }

    // Validate due_date format if provided
    if (body.due_date) {
      const date = new Date(body.due_date)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Bad Request: Invalid due_date format. Use ISO 8601 string' },
          { status: 400 }
        )
      }
    }

    // Check if task exists and belongs to user
    const { rows: existingTasks } = await query<Task>(
      'SELECT id, owner_id FROM tasks WHERE id = $1',
      [taskId]
    )

    if (existingTasks.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const existingTask = existingTasks[0]
    if (existingTask.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this task' },
        { status: 403 }
      )
    }

    // Build dynamic UPDATE query
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (body.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`)
      updateValues.push(body.title)
    }
    if (body.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`)
      updateValues.push(body.description)
    }
    if (body.due_date !== undefined) {
      updateFields.push(`due_date = $${paramIndex++}`)
      updateValues.push(body.due_date)
    }
    if (body.priority !== undefined) {
      updateFields.push(`priority = $${paramIndex++}`)
      updateValues.push(body.priority)
    }

    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()')
    updateValues.push(taskId) // Add taskId as the last parameter

    const updateQuery = `
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    // Execute the update
    const { rows: updatedTasks } = await query<Task>(updateQuery, updateValues)
    
    if (updatedTasks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedTasks[0])

  } catch (error) {
    console.error('Error in PUT /api/tasks/[taskId]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Extract and validate user ID from JWT
    let userId: string
    try {
      userId = extractUserIdFromRequest(request)
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing token' },
        { status: 401 }
      )
    }

    // Validate taskId parameter
    const taskId = parseInt(params.taskId)
    if (isNaN(taskId)) {
      return NextResponse.json(
        { error: 'Bad Request: Invalid task ID' },
        { status: 400 }
      )
    }

    // Check if task exists before deletion
    const checkQuery = 'SELECT id FROM tasks WHERE id = $1'
    const { rows: existingTasks } = await query<{ id: number }>(checkQuery, [taskId])
    
    if (existingTasks.length === 0) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete the task from database
    const deleteQuery = 'DELETE FROM tasks WHERE id = $1 RETURNING id'
    const { rows: deletedTasks } = await query<{ id: number }>(deleteQuery, [taskId])
    
    if (deletedTasks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Task deleted successfully', taskId: deletedTasks[0].id },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in DELETE /api/tasks/[taskId]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}