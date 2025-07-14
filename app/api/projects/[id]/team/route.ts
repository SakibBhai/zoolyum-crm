import { NextRequest, NextResponse } from 'next/server'
import { projectsService } from '@/lib/neon-db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    
    const result = await projectsService.addTeamMember(
      id,
      teamMemberId,
      role || 'member',
      addedBy || 'system'
    )
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to add team member to project' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Team member added successfully', result },
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
  { params }: { params: { id: string } }
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
    
    const result = await projectsService.removeTeamMember(
      id,
      teamMemberId,
      removedBy
    )
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to remove team member from project' },
        { status: 400 }
      )
    }
    
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