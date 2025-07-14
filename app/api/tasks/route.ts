import { type NextRequest, NextResponse } from "next/server"
import { tasksService } from "@/lib/neon-db"

export async function GET() {
  try {
    const tasks = await tasksService.getAll()
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error in GET /api/tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received task data in API:", body)
    
    const newTask = await tasksService.create(body)
    console.log("Created task in API:", newTask)
    
    return NextResponse.json(newTask, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/tasks:", error)
    return NextResponse.json({ 
      error: "Failed to create task", 
      message: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      )
    }

    // Check if task exists
    const existingTask = await tasksService.getById(id)
    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    const updatedTask = await tasksService.update(id, updates)
    
    if (!updatedTask) {
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Error in PUT /api/tasks:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      )
    }

    // Check if task exists
    const existingTask = await tasksService.getById(id)
    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    await tasksService.delete(id)

    return NextResponse.json(
      { message: "Task deleted successfully", taskId: id },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error in DELETE /api/tasks:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
