import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for lead creation/update
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  source: z.string().min(1, 'Source is required'),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).default('new'),
  assignedTo: z.string().optional(),
  value: z.number().min(0).default(0),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  industry: z.string().optional(),
  leadScore: z.number().min(0).max(100).default(0),
  lastContactDate: z.string().datetime().optional(),
  nextFollowUp: z.string().datetime().optional()
})

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  search: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'value', 'leadScore', 'lastName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tags: z.string().optional(), // comma-separated tags
  minValue: z.string().transform(Number).optional(),
  maxValue: z.string().transform(Number).optional(),
  minLeadScore: z.string().transform(Number).optional(),
  maxLeadScore: z.string().transform(Number).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
})

// GET /api/leads - Fetch leads with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))
    
    const {
      page,
      limit,
      search,
      status,
      source,
      assignedTo,
      industry,
      location,
      sortBy,
      sortOrder,
      tags,
      minValue,
      maxValue,
      minLeadScore,
      maxLeadScore,
      dateFrom,
      dateTo
    } = query

    // Build where clause
    const where: any = {}
    
    // Search across multiple fields
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Filter by status
    if (status && status !== 'all') {
      where.status = status
    }
    
    // Filter by source
    if (source && source !== 'all') {
      where.source = source
    }
    
    // Filter by assigned user
    if (assignedTo && assignedTo !== 'all') {
      where.assignedTo = assignedTo
    }
    
    // Filter by industry
    if (industry && industry !== 'all') {
      where.industry = industry
    }
    
    // Filter by location
    if (location && location !== 'all') {
      where.location = location
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',')
      where.tags = {
        path: '$',
        array_contains: tagArray
      }
    }
    
    // Filter by value range
    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {}
      if (minValue !== undefined) where.value.gte = minValue
      if (maxValue !== undefined) where.value.lte = maxValue
    }
    
    // Filter by lead score range
    if (minLeadScore !== undefined || maxLeadScore !== undefined) {
      where.leadScore = {}
      if (minLeadScore !== undefined) where.leadScore.gte = minLeadScore
      if (maxLeadScore !== undefined) where.leadScore.lte = maxLeadScore
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    
    // Build order by clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Execute queries
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          activities: {
            orderBy: { date: 'desc' },
            take: 5 // Include last 5 activities
          }
        }
      }),
      prisma.lead.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof z.ZodError ? 'Invalid query parameters' : 'Failed to fetch leads',
        error: error instanceof z.ZodError ? error.errors : undefined
      },
      { status: 400 }
    )
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = leadSchema.parse(body)
    
    // Convert date strings to Date objects
    const leadData: any = {
      ...validatedData,
      value: validatedData.value,
      leadScore: validatedData.leadScore
    }
    
    if (validatedData.lastContactDate) {
      leadData.lastContactDate = new Date(validatedData.lastContactDate)
    }
    
    if (validatedData.nextFollowUp) {
      leadData.nextFollowUp = new Date(validatedData.nextFollowUp)
    }

    const lead = await prisma.lead.create({
      data: leadData,
      include: {
        activities: true
      }
    })

    return NextResponse.json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof z.ZodError ? 'Invalid lead data' : 'Failed to create lead',
        error: error instanceof z.ZodError ? error.errors : undefined
      },
      { status: 400 }
    )
  }
}

// DELETE /api/leads - Bulk delete leads
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []
    
    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No lead IDs provided' },
        { status: 400 }
      )
    }

    // Delete leads and their activities (cascade delete)
    const deletedCount = await prisma.lead.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    return NextResponse.json({
      success: true,
      data: { deletedCount: deletedCount.count },
      message: `${deletedCount.count} leads deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting leads:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete leads' },
      { status: 500 }
    )
  }
}