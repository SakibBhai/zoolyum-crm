import { type NextRequest, NextResponse } from "next/server"
import { projectsService } from "@/lib/neon-db"

export async function GET() {
  try {
    const projects = await projectsService.getAll()
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Error in GET /api/projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newProject = await projectsService.create(body)
    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/projects:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
