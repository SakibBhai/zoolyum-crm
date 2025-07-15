import { NextRequest, NextResponse } from 'next/server'
import { projectsService } from '@/lib/neon-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeActivities = searchParams.get('includeActivities') === 'true'
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')
    const managerId = searchParams.get('managerId')
    
    let projects = await projectsService.getAll()
    
    // Apply filters
    if (status) {
      projects = projects.filter(p => p.status === status)
    }
    if (priority) {
      projects = projects.filter(p => p.priority === priority)
    }
    if (type) {
      projects = projects.filter(p => p.type === type)
    }
    if (managerId) {
      projects = projects.filter(p => p.manager === managerId)
    }
    
    // Include activities if requested
    if (includeActivities) {
      for (let i = 0; i < projects.length; i++) {
        const activities = await projectsService.getActivities(projects[i].id, 10)
        projects[i] = { ...projects[i], activities } as any
      }
    }
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const projectData = await request.json()
    
    // Validate required fields
    if (!projectData.name || !projectData.type) {
      return NextResponse.json(
        { error: 'Project name and type are required' },
        { status: 400 }
      )
    }
    
    // Set default values
    const enrichedProjectData = {
      ...projectData,
      status: projectData.status || 'planning',
      priority: projectData.priority || 'medium',
      progress: projectData.progress || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: projectData.created_by || 'system'
    }
    
    const newProject = await projectsService.create(enrichedProjectData)
    
    // Log document uploads if any
    if (projectData.documents && projectData.documents.length > 0) {
      for (const doc of projectData.documents) {
        await projectsService.addDocument(newProject.id, doc, projectData.created_by)
      }
    }
    
    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
