import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/leads/stats - Get leads statistics and summary data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const assignedTo = searchParams.get('assignedTo')

    // Build date filter
    const dateFilter: any = {}
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {}
      if (dateFrom) dateFilter.createdAt.gte = new Date(dateFrom)
      if (dateTo) dateFilter.createdAt.lte = new Date(dateTo)
    }

    // Build assigned filter
    const assignedFilter: any = {}
    if (assignedTo && assignedTo !== 'all') {
      assignedFilter.assignedTo = assignedTo
    }

    const baseFilter = { ...dateFilter, ...assignedFilter }

    // Get basic counts
    const [totalLeads, qualifiedLeads, closedWonLeads, closedLostLeads] = await Promise.all([
      prisma.lead.count({ where: baseFilter }),
      prisma.lead.count({ where: { ...baseFilter, status: 'qualified' } }),
      prisma.lead.count({ where: { ...baseFilter, status: 'closed-won' } }),
      prisma.lead.count({ where: { ...baseFilter, status: 'closed-lost' } })
    ])

    // Get total value and average lead score
    const valueStats = await prisma.lead.aggregate({
      where: baseFilter,
      _sum: {
        value: true
      },
      _avg: {
        leadScore: true,
        value: true
      }
    })

    // Get leads by status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      where: baseFilter,
      _count: {
        id: true
      },
      _sum: {
        value: true
      }
    })

    // Get leads by source
    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: baseFilter,
      _count: {
        id: true
      },
      _sum: {
        value: true
      }
    })

    // Get leads by assigned user
    const leadsByAssignee = await prisma.lead.groupBy({
      by: ['assignedTo'],
      where: baseFilter,
      _count: {
        id: true
      },
      _sum: {
        value: true
      }
    })

    // Get recent activities count
    const recentActivitiesCount = await prisma.activity.count({
      where: {
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        },
        lead: baseFilter
      }
    })

    // Get conversion metrics
    const conversionRate = totalLeads > 0 ? (closedWonLeads / totalLeads) * 100 : 0
    const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0

    // Get monthly trends (last 12 months)
    let monthlyTrends
    if (assignedTo && assignedTo !== 'all') {
      monthlyTrends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "created_at") as month,
          COUNT(*)::int as count,
          SUM("value")::float as total_value,
          COUNT(CASE WHEN status = 'closed-won' THEN 1 END)::int as won_count
        FROM "leads"
        WHERE "created_at" >= NOW() - INTERVAL '12 months'
          AND "assigned_to" = ${assignedTo}
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY month DESC
        LIMIT 12
      `
    } else {
      monthlyTrends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "created_at") as month,
          COUNT(*)::int as count,
          SUM("value")::float as total_value,
          COUNT(CASE WHEN status = 'closed-won' THEN 1 END)::int as won_count
        FROM "leads"
        WHERE "created_at" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "created_at")
        ORDER BY month DESC
        LIMIT 12
      `
    }

    // Get top performing sources
    const topSources = await prisma.lead.groupBy({
      by: ['source'],
      where: {
        ...baseFilter,
        status: 'closed-won'
      },
      _count: {
        id: true
      },
      _sum: {
        value: true
      },
      orderBy: {
        _sum: {
          value: 'desc'
        }
      },
      take: 5
    })

    // Calculate pipeline value by stage
    const pipelineValue = await prisma.lead.groupBy({
      by: ['status'],
      where: {
        ...baseFilter,
        status: {
          in: ['qualified', 'proposal', 'negotiation']
        }
      },
      _sum: {
        value: true
      },
      _count: {
        id: true
      }
    })

    const stats = {
      overview: {
        totalLeads,
        qualifiedLeads,
        closedWonLeads,
        closedLostLeads,
        totalValue: valueStats._sum.value ? Number(valueStats._sum.value) : 0,
        averageLeadScore: Math.round(valueStats._avg.leadScore ? Number(valueStats._avg.leadScore) : 0),
        averageLeadValue: Math.round(valueStats._avg.value ? Number(valueStats._avg.value) : 0),
        conversionRate: Math.round(conversionRate * 100) / 100,
        qualificationRate: Math.round(qualificationRate * 100) / 100,
        recentActivitiesCount
      },
      distribution: {
        byStatus: leadsByStatus.map(item => ({
          status: item.status,
          count: item._count.id,
          value: item._sum.value ? Number(item._sum.value) : 0
        })),
        bySource: leadsBySource.map(item => ({
          source: item.source,
          count: item._count.id,
          value: item._sum.value ? Number(item._sum.value) : 0
        })),
        byAssignee: leadsByAssignee.map(item => ({
          assignee: item.assignedTo || 'Unassigned',
          count: item._count.id,
          value: item._sum.value ? Number(item._sum.value) : 0
        }))
      },
      trends: {
        monthly: monthlyTrends,
        topSources: topSources.map(item => ({
          source: item.source,
          wonCount: item._count.id,
          totalValue: item._sum.value ? Number(item._sum.value) : 0
        }))
      },
      pipeline: {
        stages: pipelineValue.map(item => ({
          stage: item.status,
          count: item._count.id,
          value: item._sum.value ? Number(item._sum.value) : 0
        })),
        totalPipelineValue: pipelineValue.reduce((sum, item) => sum + (item._sum.value ? Number(item._sum.value) : 0), 0)
      }
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching leads statistics:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch leads statistics' },
      { status: 500 }
    )
  }
}