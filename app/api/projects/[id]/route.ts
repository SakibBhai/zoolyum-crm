import { type NextRequest, NextResponse } from "next/server"
import { projectsService } from "@/lib/neon-db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = await projectsService.getById(params.id)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error in GET /api/projects/[id]:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const updatedProject = await projectsService.update(params.id, body)
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error in PUT /api/projects/[id]:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await projectsService.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/projects/[id]:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}

/**
 * PATCH handler for updating specific fields of a project
 * Supports atomic updates and tracks version history
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Add last_modified timestamp
    const updatedFields = {
      ...body,
      last_modified: new Date().toISOString()
    }
    
    // If recurrence pattern is provided as an object, convert to JSONB string
    if (updatedFields.recurrence_pattern && typeof updatedFields.recurrence_pattern === 'object') {
      updatedFields.recurrence_pattern = JSON.stringify(updatedFields.recurrence_pattern)
    }
    
    // Track which fields were changed for version history
    const changedFields = Object.keys(body)
    
    // Create version history entry if enabled
    if (process.env.ENABLE_VERSION_HISTORY === 'true') {
      // Get current project state
      const currentProject = await projectsService.getById(params.id)
      
      if (currentProject) {
        // Create version history entry
        await projectsService.createVersionHistoryEntry({
          project_id: params.id,
          changed_fields: changedFields,
          previous_values: JSON.stringify(
            changedFields.reduce((acc, field) => {
              // @ts-ignore - Dynamic access
              acc[field] = currentProject[field]
              return acc
            }, {})
          ),
          changed_by: body.changed_by || 'system', // Track who made the change if provided
          timestamp: new Date().toISOString()
        })
      }
    }
    
    // Perform the update with only the changed fields
    const updatedProject = await projectsService.update(params.id, updatedFields)
    
    // Send webhooks for team notifications if configured
    if (process.env.ENABLE_WEBHOOKS === 'true') {
      try {
        // Get webhook URLs from environment or database
        const webhookUrls = process.env.WEBHOOK_URLS ? 
          process.env.WEBHOOK_URLS.split(',') : 
          []
          
        // Send notifications in parallel
        await Promise.all(webhookUrls.map(url => 
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'project.updated',
              projectId: params.id,
              changedFields,
              timestamp: new Date().toISOString()
            })
          })
        ))
      } catch (webhookError) {
        // Log webhook errors but don't fail the request
        console.error('Error sending webhooks:', webhookError)
      }
    }
    
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Error in PATCH /api/projects/[id]:", error)
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    )
  }
}
