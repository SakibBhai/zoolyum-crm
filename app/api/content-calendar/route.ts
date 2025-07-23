import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/content-calendar - Get all content calendar entries
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month')
        const year = searchParams.get('year')
        const projectId = searchParams.get('project_id')
        const clientId = searchParams.get('client_id')
        const status = searchParams.get('status')

        let whereConditions = []
        let params = []

        if (month && year) {
            whereConditions.push(`EXTRACT(MONTH FROM scheduled_date) = $${params.length + 1} AND EXTRACT(YEAR FROM scheduled_date) = $${params.length + 2}`)
            params.push(parseInt(month), parseInt(year))
        }

        if (projectId) {
            whereConditions.push(`project_id = $${params.length + 1}`)
            params.push(projectId)
        }

        if (clientId) {
            whereConditions.push(`client_id = $${params.length + 1}`)
            params.push(clientId)
        }

        if (status) {
            whereConditions.push(`status = $${params.length + 1}`)
            params.push(status)
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

        const contentEntries = await sql`
      SELECT 
        cc.*,
        p.name as project_name,
        c.name as client_name,
        tm.name as assigned_to_name
      FROM content_calendar cc
      LEFT JOIN projects p ON cc.project_id = p.id
      LEFT JOIN clients c ON cc.client_id = c.id
      LEFT JOIN team_members tm ON cc.assigned_to = tm.id
      ${sql.unsafe(whereClause)}
      ORDER BY cc.scheduled_date ASC, cc.created_at DESC
    `

        return NextResponse.json(contentEntries)
    } catch (error) {
        console.error('Error fetching content calendar:', error)
        return NextResponse.json(
            { error: 'Failed to fetch content calendar entries' },
            { status: 500 }
        )
    }
}

// POST /api/content-calendar - Create new content calendar entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {
            title,
            description,
            content_type,
            platform,
            scheduled_date,
            scheduled_time,
            project_id,
            client_id,
            assigned_to,
            status = 'draft',
            tags,
            media_urls,
            approval_required = false,
            approved_by,
            approved_at,
            published_at,
            engagement_metrics,
            notes
        } = body

        const [newEntry] = await sql`
      INSERT INTO content_calendar (
        title, description, content_type, platform, scheduled_date, scheduled_time,
        project_id, client_id, assigned_to, status, tags, media_urls,
        approval_required, approved_by, approved_at, published_at,
        engagement_metrics, notes
      )
      VALUES (
        ${title}, ${description}, ${content_type}, ${platform}, 
        ${scheduled_date}, ${scheduled_time}, ${project_id}, ${client_id},
        ${assigned_to}, ${status}, ${JSON.stringify(tags || [])}, 
        ${JSON.stringify(media_urls || [])}, ${approval_required},
        ${approved_by}, ${approved_at}, ${published_at},
        ${JSON.stringify(engagement_metrics || {})}, ${notes}
      )
      RETURNING *
    `

        return NextResponse.json(newEntry, { status: 201 })
    } catch (error) {
        console.error('Error creating content calendar entry:', error)
        return NextResponse.json(
            { error: 'Failed to create content calendar entry' },
            { status: 500 }
        )
    }
}

// PUT /api/content-calendar - Update content calendar entry
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json(
                { error: 'Content calendar entry ID is required' },
                { status: 400 }
            )
        }

        const updateFields = Object.keys(updates)
            .filter(key => updates[key] !== undefined)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ')

        if (updateFields.length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            )
        }

        const values = [id, ...Object.values(updates).filter(val => val !== undefined)]

        const [updatedEntry] = await sql`
      UPDATE content_calendar 
      SET ${sql.unsafe(updateFields)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `.apply(null, values)

        if (!updatedEntry) {
            return NextResponse.json(
                { error: 'Content calendar entry not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(updatedEntry)
    } catch (error) {
        console.error('Error updating content calendar entry:', error)
        return NextResponse.json(
            { error: 'Failed to update content calendar entry' },
            { status: 500 }
        )
    }
}

// DELETE /api/content-calendar - Delete content calendar entry
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Content calendar entry ID is required' },
                { status: 400 }
            )
        }

        const [deletedEntry] = await sql`
      DELETE FROM content_calendar
      WHERE id = ${id}
      RETURNING id
    `

        if (!deletedEntry) {
            return NextResponse.json(
                { error: 'Content calendar entry not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { message: 'Content calendar entry deleted successfully', id },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error deleting content calendar entry:', error)
        return NextResponse.json(
            { error: 'Failed to delete content calendar entry' },
            { status: 500 }
        )
    }
}
