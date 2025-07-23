import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for lead updates
const updateLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).optional(),
  assignedTo: z.string().optional(),
  value: z.number().min(0).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  leadScore: z.number().min(0).max(100).optional(),
  lastContactDate: z.string().datetime().optional(),
  nextFollowUp: z.string().datetime().optional()
})

// GET /api/leads/[id] - Get a specific lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lead
    })
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

// PUT /api/leads/[id] - Update a specific lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateLeadSchema.parse(body)

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      )
    }

    // Convert date strings to Date objects
    const updateData: any = { ...validatedData }

    if (validatedData.lastContactDate) {
      updateData.lastContactDate = new Date(validatedData.lastContactDate)
    }

    if (validatedData.nextFollowUp) {
      updateData.nextFollowUp = new Date(validatedData.nextFollowUp)
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        activities: {
          orderBy: { date: 'desc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedLead,
      message: 'Lead updated successfully'
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof z.ZodError ? 'Invalid lead data' : 'Failed to update lead',
        error: error instanceof z.ZodError ? error.errors : undefined
      },
      { status: 400 }
    )
  }
}

// DELETE /api/leads/[id] - Delete a specific lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      )
    }

    // Delete the lead (activities will be cascade deleted)
    await prisma.lead.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}