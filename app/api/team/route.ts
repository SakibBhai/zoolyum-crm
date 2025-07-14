import { NextRequest, NextResponse } from "next/server"
import { teamService } from "@/lib/neon-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    const active = searchParams.get('active')
    
    let teamMembers = await teamService.getAll()
    
    // Apply filters
    if (role) {
      teamMembers = teamMembers.filter(member => 
        member.role?.toLowerCase().includes(role.toLowerCase())
      )
    }
    
    if (department) {
      teamMembers = teamMembers.filter(member => 
        member.department?.toLowerCase().includes(department.toLowerCase())
      )
    }
    
    if (active !== null) {
      const isActive = active === 'true'
      teamMembers = teamMembers.filter(member => member.active === isActive)
    }
    
    return NextResponse.json({
      teamMembers,
      total: teamMembers.length
    })
  } catch (error) {
    console.error("Error in GET /api/team:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received team member data:', body)
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'department']
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
    console.log('Created team member:', newTeamMember)
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
    
    return NextResponse.json({ 
      error: "Failed to create team member",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}