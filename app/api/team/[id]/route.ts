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
    const updatedTeamMember = await teamService.update(params.id, body)
    return NextResponse.json(updatedTeamMember)
  } catch (error) {
    console.error("Error in PUT /api/team/[id]:", error)
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 })
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
