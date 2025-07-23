import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/reports - Generate cross-module reports
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const reportType = searchParams.get('type')
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const format = searchParams.get('format') || 'json'

        if (!reportType) {
            return NextResponse.json(
                { error: 'Report type is required' },
                { status: 400 }
            )
        }

        let dateFilter = ''
        if (startDate && endDate) {
            dateFilter = `AND created_at BETWEEN '${startDate}' AND '${endDate}'`
        }

        switch (reportType) {
            case 'dashboard_overview':
                // Complete dashboard overview
                const [
                    clientStats,
                    projectStats,
                    taskStats,
                    teamStats,
                    invoiceStats,
                    leadStats
                ] = await Promise.all([
                    // Client statistics
                    sql`
            SELECT 
              COUNT(*) as total_clients,
              COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
              COUNT(CASE WHEN status = 'prospect' THEN 1 END) as prospects,
              SUM(contract_value) as total_contract_value
            FROM clients
          `,

                    // Project statistics
                    sql`
            SELECT 
              COUNT(*) as total_projects,
              COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects,
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
              AVG(progress) as avg_progress,
              SUM(estimated_budget) as total_estimated_budget,
              SUM(actual_budget) as total_actual_budget
            FROM projects
          `,

                    // Task statistics
                    sql`
            SELECT 
              COUNT(*) as total_tasks,
              COUNT(CASE WHEN status = 'todo' THEN 1 END) as pending_tasks,
              COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
              COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_tasks,
              COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'done' THEN 1 END) as overdue_tasks
            FROM tasks
          `,

                    // Team statistics
                    sql`
            SELECT 
              COUNT(*) as total_team_members,
              COUNT(CASE WHEN is_active = true THEN 1 END) as active_members,
              COUNT(DISTINCT department) as departments
            FROM team_members
          `,

                    // Invoice statistics
                    sql`
            SELECT 
              COUNT(*) as total_invoices,
              SUM(total_amount) as total_invoiced,
              SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_paid,
              SUM(CASE WHEN status != 'paid' THEN total_amount ELSE 0 END) as total_outstanding,
              COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices
            FROM invoices
          `,

                    // Lead statistics
                    sql`
            SELECT 
              COUNT(*) as total_leads,
              COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
              COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
              COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads
            FROM leads
          `
                ])

                return NextResponse.json({
                    clients: clientStats[0],
                    projects: projectStats[0],
                    tasks: taskStats[0],
                    team: teamStats[0],
                    invoices: invoiceStats[0],
                    leads: leadStats[0]
                })

            case 'project_performance':
                // Detailed project performance report
                const projectPerformance = await sql`
          SELECT 
            p.id,
            p.name as project_name,
            p.status,
            p.priority,
            p.progress,
            p.estimated_budget,
            p.actual_budget,
            c.name as client_name,
            p.manager,
            COUNT(t.id) as total_tasks,
            COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN 1 END) as overdue_tasks,
            AVG(CASE WHEN t.status = 'done' AND t.estimated_hours > 0 THEN t.actual_hours / t.estimated_hours END) as time_efficiency,
            SUM(t.estimated_hours) as total_estimated_hours,
            SUM(t.actual_hours) as total_actual_hours,
            p.start_date,
            p.end_date,
            CASE 
              WHEN p.end_date < CURRENT_DATE AND p.status != 'completed' THEN 'overdue'
              WHEN p.end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
              ELSE 'on_track'
            END as timeline_status
          FROM projects p
          LEFT JOIN clients c ON p.client_id = c.id
          LEFT JOIN tasks t ON p.id = t.project_id
          GROUP BY p.id, p.name, p.status, p.priority, p.progress, p.estimated_budget, 
                   p.actual_budget, c.name, p.manager, p.start_date, p.end_date
          ORDER BY p.created_at DESC
        `

                return NextResponse.json({ project_performance: projectPerformance })

            case 'team_productivity':
                // Team productivity report
                const teamProductivity = await sql`
          SELECT 
            tm.id,
            tm.name,
            tm.role,
            tm.department,
            COUNT(t.id) as assigned_tasks,
            COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN 1 END) as overdue_tasks,
            AVG(CASE WHEN t.status = 'done' AND t.estimated_hours > 0 THEN t.actual_hours / t.estimated_hours END) as efficiency_ratio,
            SUM(t.estimated_hours) as total_estimated_hours,
            SUM(t.actual_hours) as total_actual_hours,
            COUNT(DISTINCT t.project_id) as projects_involved
          FROM team_members tm
          LEFT JOIN tasks t ON tm.id = t.assigned_to
          WHERE tm.is_active = true
          GROUP BY tm.id, tm.name, tm.role, tm.department
          ORDER BY completed_tasks DESC
        `

                return NextResponse.json({ team_productivity: teamProductivity })

            case 'client_analytics':
                // Client analytics report
                const clientAnalytics = await sql`
          SELECT 
            c.id,
            c.name as client_name,
            c.industry,
            c.status,
            COUNT(DISTINCT p.id) as total_projects,
            COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_projects,
            COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects,
            SUM(p.estimated_budget) as total_project_value,
            COUNT(DISTINCT i.id) as total_invoices,
            SUM(i.total_amount) as total_invoiced,
            SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) as total_paid,
            SUM(CASE WHEN i.status != 'paid' THEN i.total_amount ELSE 0 END) as outstanding_amount,
            COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) as overdue_invoices,
            AVG(p.progress) as avg_project_progress,
            MAX(p.created_at) as last_project_date,
            MAX(i.created_at) as last_invoice_date
          FROM clients c
          LEFT JOIN projects p ON c.id = p.client_id
          LEFT JOIN invoices i ON c.id = i.client_id
          GROUP BY c.id, c.name, c.industry, c.status
          ORDER BY total_project_value DESC NULLS LAST
        `

                return NextResponse.json({ client_analytics: clientAnalytics })

            case 'lead_conversion':
                // Lead conversion funnel report
                const leadConversion = await sql`
          SELECT 
            status,
            COUNT(*) as count,
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
          FROM leads
          GROUP BY status
          ORDER BY 
            CASE status
              WHEN 'new' THEN 1
              WHEN 'contacted' THEN 2
              WHEN 'qualified' THEN 3
              WHEN 'proposal' THEN 4
              WHEN 'negotiation' THEN 5
              WHEN 'converted' THEN 6
              WHEN 'lost' THEN 7
              ELSE 8
            END
        `

                const leadsBySource = await sql`
          SELECT 
            source,
            COUNT(*) as count,
            COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
            COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*) as conversion_rate
          FROM leads
          GROUP BY source
          ORDER BY count DESC
        `

                return NextResponse.json({
                    conversion_funnel: leadConversion,
                    leads_by_source: leadsBySource
                })

            case 'content_calendar_summary':
                // Content calendar performance
                const contentCalendarStats = await sql`
          SELECT 
            platform,
            content_type,
            COUNT(*) as total_posts,
            COUNT(CASE WHEN status = 'published' THEN 1 END) as published_posts,
            COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_posts,
            COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_posts,
            AVG((engagement_metrics->>'likes')::int) as avg_likes,
            AVG((engagement_metrics->>'shares')::int) as avg_shares,
            AVG((engagement_metrics->>'comments')::int) as avg_comments
          FROM content_calendar
          WHERE scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY platform, content_type
          ORDER BY total_posts DESC
        `

                return NextResponse.json({ content_calendar_stats: contentCalendarStats })

            default:
                return NextResponse.json(
                    { error: 'Invalid report type' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('Error generating report:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}

// POST /api/reports - Generate custom reports with specific parameters
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            report_name,
            modules,
            filters,
            date_range,
            group_by,
            metrics,
            format = 'json'
        } = body

        if (!report_name || !modules || modules.length === 0) {
            return NextResponse.json(
                { error: 'Report name and modules are required' },
                { status: 400 }
            )
        }

        // Build dynamic query based on selected modules and filters
        let queries = []

        if (modules.includes('clients')) {
            queries.push(sql`
        SELECT 'clients' as module, id, name, status, created_at
        FROM clients
        WHERE 1=1 ${filters?.client_status ? sql`AND status = ${filters.client_status}` : sql``}
      `)
        }

        if (modules.includes('projects')) {
            queries.push(sql`
        SELECT 'projects' as module, id, name, status, created_at
        FROM projects
        WHERE 1=1 ${filters?.project_status ? sql`AND status = ${filters.project_status}` : sql``}
      `)
        }

        if (modules.includes('tasks')) {
            queries.push(sql`
        SELECT 'tasks' as module, id, title as name, status, created_at
        FROM tasks
        WHERE 1=1 ${filters?.task_status ? sql`AND status = ${filters.task_status}` : sql``}
      `)
        }

        // Execute all queries in parallel
        const results = await Promise.all(queries)

        // Combine results
        const combinedData = results.flat()

        // Save report for future reference
        const [savedReport] = await sql`
      INSERT INTO reports (
        name, modules, filters, date_range, group_by, metrics, 
        data, format, created_at
      )
      VALUES (
        ${report_name}, ${JSON.stringify(modules)}, ${JSON.stringify(filters)},
        ${JSON.stringify(date_range)}, ${group_by}, ${JSON.stringify(metrics)},
        ${JSON.stringify(combinedData)}, ${format}, CURRENT_TIMESTAMP
      )
      RETURNING id, name, created_at
    `

        return NextResponse.json({
            report: savedReport,
            data: combinedData,
            summary: {
                total_records: combinedData.length,
                modules_included: modules,
                generated_at: new Date().toISOString()
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Error generating custom report:', error)
        return NextResponse.json(
            { error: 'Failed to generate custom report' },
            { status: 500 }
        )
    }
}
