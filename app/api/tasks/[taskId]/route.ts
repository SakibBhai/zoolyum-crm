import { type NextRequest, NextResponse } from 'next/server'
import { tasksService } from '@/lib/neon-db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // TODO: Implement proper authentication
    // For now, using a default user ID for development
    const userId = 'dev-user-id'

    // Validate taskId parameter
    const { taskId } = await params
    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request: Invalid task ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Check if task exists
    const existingTask = await tasksService.getById(taskId)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Update the task using tasksService
    const updatedTask = await tasksService.update(taskId, body)
    
    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedTask)

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
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // TODO: Implement proper authentication
    // For now, bypassing authentication for development

    // Validate taskId parameter
    const { taskId } = await params
    if (!taskId || typeof taskId !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request: Invalid task ID' },
        { status: 400 }
      )
    }

    // Check if task exists before deletion
    const existingTask = await tasksService.getById(taskId)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete the task from database
    await tasksService.delete(taskId)

    return NextResponse.json(
      { message: 'Task deleted successfully', taskId },
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