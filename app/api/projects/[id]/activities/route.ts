import { NextRequest, NextResponse } from 'next/server'
import { projectsService } from '@/lib/neon-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type')
    
    let activities = await projectsService.getActivities(id, limit)
    
    // Filter by activity type if specified
    if (type) {
      activities = activities.filter(activity => activity.type === type)
    }
    
    return NextResponse.json({
      activities,
      total: activities.length,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching project activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project activities' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { type, description, userId, metadata } = await request.json()
    
    if (!type || !description) {
      return NextResponse.json(
        { error: 'Activity type and description are required' },
        { status: 400 }
      )
    }
    
    const activity = await projectsService.logActivity(
      id,
      type,
      description,
      userId || 'system',
      metadata
    )
    
    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error logging project activity:', error)
    return NextResponse.json(
      { error: 'Failed to log project activity' },
      { status: 500 }
    )
  }
}