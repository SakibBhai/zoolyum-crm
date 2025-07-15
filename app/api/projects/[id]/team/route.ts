import { NextRequest, NextResponse } from 'next/server'
import { projectsService } from '@/lib/neon-db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { teamMemberId, role, addedBy } = await request.json()
    
    if (!teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }
    
    await projectsService.addTeamMember(
      id,
      teamMemberId,
      addedBy || 'system'
    )
    
    return NextResponse.json(
      { message: 'Team member added successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding team member to project:', error)
    return NextResponse.json(
      { error: 'Failed to add team member to project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const teamMemberId = searchParams.get('teamMemberId')
    const removedBy = searchParams.get('removedBy') || 'system'
    
    if (!teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }
    
    await projectsService.removeTeamMember(
      id,
      teamMemberId,
      removedBy
    )
    
    return NextResponse.json(
      { message: 'Team member removed successfully' }
    )
  } catch (error) {
    console.error('Error removing team member from project:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member from project' },
      { status: 500 }
    )
  }
}