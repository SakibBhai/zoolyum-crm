import { type NextRequest, NextResponse } from "next/server"
import { projectsService } from "@/lib/neon-db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = await projectsService.getById(params.id)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error in GET /api/projects/[id]:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const updatedProject = await projectsService.update(params.id, body)
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error in PUT /api/projects/[id]:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await projectsService.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/projects/[id]:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
