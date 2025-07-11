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
