import { type NextRequest, NextResponse } from "next/server"
import { teamService } from "@/lib/neon-db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamMember = await teamService.getById(params.id)
    if (!teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }
    return NextResponse.json(teamMember)
  } catch (error) {
    console.error("Error in GET /api/team/[id]:", error)
    return NextResponse.json({ error: "Failed to fetch team member" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate required fields if they are being updated
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }
    
    if (body.name && (!body.name.trim() || body.name.trim().length < 2)) {
      return NextResponse.json({ error: "Name must be at least 2 characters long" }, { status: 400 })
    }
    
    if (body.role && (!body.role.trim() || body.role.trim().length < 2)) {
      return NextResponse.json({ error: "Role must be at least 2 characters long" }, { status: 400 })
    }
    
    console.log(`Updating team member ${params.id} with:`, body)
    
    const updatedTeamMember = await teamService.update(params.id, body)
    
    if (!updatedTeamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }
    
    console.log(`Successfully updated team member ${params.id}`)
    return NextResponse.json(updatedTeamMember)
  } catch (error) {
    console.error("Error in PUT /api/team/[id]:", error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: "Team member not found" }, { status: 404 })
      }
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
    }
    
    return NextResponse.json({ 
      error: "Failed to update team member",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await teamService.delete(params.id)
    return NextResponse.json({ message: "Team member deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/team/[id]:", error)
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 })
  }
}
