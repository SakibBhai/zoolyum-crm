import { type NextRequest, NextResponse } from "next/server"
import { projectsService } from "@/lib/neon-db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeActivities = searchParams.get('includeActivities') === 'true'
    const includeDocuments = searchParams.get('includeDocuments') === 'true'
    
    const project = await projectsService.getById(id)
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Include activities if requested
    if (includeActivities) {
      project.activities = await projectsService.getActivities(id, 50)
    }
    
    // Include documents if requested
    if (includeDocuments) {
      try {
        const documentsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/upload/project-documents?projectId=${id}`)
        if (documentsResponse.ok) {
          const documentsData = await documentsResponse.json()
          project.documents = documentsData.files
        }
      } catch (error) {
        console.error('Error fetching project documents:', error)
        project.documents = []
      }
    }
    
    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = await request.json()
    const updatedBy = updates.updated_by || 'system'
    
    // Add updated timestamp
    const enrichedUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    const updatedProject = await projectsService.update(id, enrichedUpdates, updatedBy)
    
    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }
    
    // Log document uploads if any
    if (updates.documents && updates.documents.length > 0) {
      for (const doc of updates.documents) {
        await projectsService.addDocument(id, doc, updatedBy)
      }
    }
    
    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await projectsService.delete(id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      const currentProject = await projectsService.getById(id)
      
      if (currentProject) {
        // Create version history entry
        await projectsService.createProjectVersionHistory({
          project_id: id,
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
    const updatedProject = await projectsService.update(id, updatedFields)
    
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
              projectId: id,
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
