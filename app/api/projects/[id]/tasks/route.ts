import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/projects/[id]/tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeRecurring = searchParams.get('includeRecurring') === 'true'

    let whereClause = `WHERE gt.project_id = ${projectId}`
    const conditions = []

    if (status) {
      conditions.push(`gt.status = '${status}'`)
    }

    if (assignedTo) {
      conditions.push(`gt.assigned_to = '${assignedTo}'`)
    }

    if (priority) {
      conditions.push(`gt.priority = '${priority}'`)
    }

    if (conditions.length > 0) {
      whereClause += ' AND ' + conditions.join(' AND ')
    }

    // Get generated tasks
    const tasks = await sql`
      SELECT 
        gt.id,
        gt.recurring_task_id,
        gt.title,
        gt.description,
        gt.due_date,
        gt.assigned_to,
        gt.priority,
        gt.status,
        gt.estimated_hours,
        gt.actual_hours,
        gt.tags,
        gt.completed_at,
        gt.created_at,
        gt.updated_at,
        rt.title as recurring_task_title,
        rt.frequency
      FROM generated_tasks gt
      LEFT JOIN recurring_tasks rt ON gt.recurring_task_id = rt.id
      ${sql.unsafe(whereClause)}
      ORDER BY 
        CASE gt.priority 
          WHEN 'high' THEN 1 
          WHEN 'medium' THEN 2 
          WHEN 'low' THEN 3 
        END,
        gt.due_date ASC,
        gt.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count for pagination
    const totalCount = await sql`
      SELECT COUNT(*) as count
      FROM generated_tasks gt
      ${sql.unsafe(whereClause)}
    `

    // Get task summary
    const summary = await sql`
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tasks,
        COUNT(CASE WHEN due_date < NOW() AND status NOT IN ('completed', 'cancelled') THEN 1 END) as overdue_tasks
      FROM generated_tasks gt
      WHERE gt.project_id = ${projectId}
    `

    let result: any = {
      tasks,
      pagination: {
        total: parseInt(totalCount[0].count),
        limit,
        offset,
        hasMore: parseInt(totalCount[0].count) > offset + limit
      },
      summary: summary[0]
    }

    // Include recurring tasks if requested
    if (includeRecurring) {
      const recurringTasks = await sql`
        SELECT 
          id,
          title,
          description,
          frequency,
          interval_value as interval,
          days_of_week,
          day_of_month,
          start_date,
          end_date,
          next_due,
          assigned_to,
          priority,
          estimated_hours,
          tags,
          is_active,
          last_generated,
          created_at
        FROM recurring_tasks
        WHERE project_id = ${projectId}
        ORDER BY title
      `
      
      result.recurringTasks = recurringTasks
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/tasks - Create a manual task (not from recurring template)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { 
      title, 
      description, 
      dueDate, 
      assignedTo, 
      priority = 'medium', 
      estimatedHours, 
      tags = [] 
    } = body

    // Validation
    if (!title || !dueDate) {
      return NextResponse.json(
        { error: 'Title and due date are required' },
        { status: 400 }
      )
    }

    if (!['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Priority must be low, medium, or high' },
        { status: 400 }
      )
    }

    // Validate due date
    const dueDateObj = new Date(dueDate)
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid due date' },
        { status: 400 }
      )
    }

    // Create the task
    const newTask = await sql`
      INSERT INTO generated_tasks (
        project_id,
        title,
        description,
        due_date,
        assigned_to,
        priority,
        estimated_hours,
        tags,
        status
      ) VALUES (
        ${projectId},
        ${title},
        ${description || null},
        ${dueDate},
        ${assignedTo || null},
        ${priority},
        ${estimatedHours || null},
        ${JSON.stringify(tags)},
        'pending'
      )
      RETURNING *
    `

    return NextResponse.json(newTask[0], { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}