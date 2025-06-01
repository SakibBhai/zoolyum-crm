import { NextRequest, NextResponse } from "next/server"
import { teamService } from "@/lib/neon-db"

export async function GET() {
  try {
    const teamMembers = await teamService.getAll()
    return NextResponse.json(teamMembers)
  } catch (error) {
    console.error("Error in GET /api/team:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'role', 'department']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    const newTeamMember = await teamService.create(body)
    return NextResponse.json(newTeamMember, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/team:", error)
    
    // Handle unique constraint violations (duplicate email)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: "Email address already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 })
  }
}