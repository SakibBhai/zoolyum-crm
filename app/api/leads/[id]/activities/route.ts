import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for activity creation
const activitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note', 'task', 'follow-up']),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime().optional(),
  duration: z.number().min(0).optional(),
  outcome: z.string().optional(),
  nextAction: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
})

// GET /api/leads/[id]/activities - Get activities for a specific lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    
    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const where: any = { leadId: id }
    if (type && type !== 'all') {
      where.type = type
    }

    const skip = (page - 1) * limit

    // Get activities with pagination
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.activity.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

// POST /api/leads/[id]/activities - Create a new activity for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const validatedData = activitySchema.parse(body)
    
    // Check if lead exists
    const lead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      )
    }
    
    // Create activity
    const activityData: any = {
      ...validatedData,
      leadId: id,
      date: validatedData.date ? new Date(validatedData.date) : new Date()
    }

    const activity = await prisma.activity.create({
      data: activityData
    })

    // Update lead's lastContactDate if this is a contact activity
    if (['call', 'email', 'meeting'].includes(validatedData.type)) {
      await prisma.lead.update({
        where: { id },
        data: {
          lastContactDate: activity.date,
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: activity,
      message: 'Activity created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof z.ZodError ? 'Invalid activity data' : 'Failed to create activity',
        error: error instanceof z.ZodError ? error.errors : undefined
      },
      { status: 400 }
    )
  }
}