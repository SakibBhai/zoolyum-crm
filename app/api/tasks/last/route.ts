import { type NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { extractUserIdFromRequest } from '@/lib/auth'
import { DeleteTaskResponse } from '@/models/task'

export async function DELETE(request: NextRequest) {
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

    // Query for the most recently created task for the user
    const { rows: tasks } = await query<{ id: number }>(
      `SELECT id 
       FROM tasks 
       WHERE owner_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    )

    // Check if user has any tasks
    if (tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks to delete' },
        { status: 404 }
      )
    }

    const taskToDelete = tasks[0]
    const taskId = taskToDelete.id

    // Delete the task
    const { rows: deletedTasks } = await query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [taskId]
    )

    // Verify deletion was successful
    if (deletedTasks.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    // Return success response with deleted task ID
    const response: DeleteTaskResponse = {
      deletedTaskId: taskId
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in DELETE /api/tasks/last:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}