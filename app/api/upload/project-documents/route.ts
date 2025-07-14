import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const files = data.getAll('documents') as File[]
    const projectId = data.get('projectId') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ]

    const maxFileSize = 25 * 1024 * 1024 // 25MB
    const uploadedFiles = []

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `Invalid file type: ${file.type}. Allowed types: PDF, Word, Excel, PowerPoint, Text, CSV, Images` 
        }, { status: 400 })
      }

      // Validate file size
      if (file.size > maxFileSize) {
        return NextResponse.json({ 
          error: `File ${file.name} is too large. Maximum size is 25MB` 
        }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Generate unique filename
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      const fileExtension = file.name.split('.').pop()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filename = `${timestamp}-${randomSuffix}-${sanitizedName}`
      const filepath = join(uploadsDir, filename)

      // Write file to disk
      await writeFile(filepath, buffer)

      // Store file info
      uploadedFiles.push({
        originalName: file.name,
        filename,
        size: file.size,
        type: file.type,
        url: `/uploads/projects/${projectId}/${filename}`,
        uploadedAt: new Date().toISOString()
      })
    }

    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully` 
    })
  } catch (error) {
    console.error('Error uploading project documents:', error)
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve project documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'projects', projectId)
    
    if (!existsSync(uploadsDir)) {
      return NextResponse.json({ files: [] })
    }

    // This is a simplified version - in a real app, you'd store file metadata in the database
    const fs = require('fs')
    const files = fs.readdirSync(uploadsDir).map((filename: string) => {
      const stats = fs.statSync(join(uploadsDir, filename))
      return {
        filename,
        url: `/uploads/projects/${projectId}/${filename}`,
        size: stats.size,
        uploadedAt: stats.birthtime.toISOString()
      }
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error retrieving project documents:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove project documents
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const filename = searchParams.get('filename')

    if (!projectId || !filename) {
      return NextResponse.json({ error: 'Project ID and filename are required' }, { status: 400 })
    }

    const filepath = join(process.cwd(), 'public', 'uploads', 'projects', projectId, filename)
    
    if (existsSync(filepath)) {
      const fs = require('fs')
      fs.unlinkSync(filepath)
      return NextResponse.json({ success: true, message: 'File deleted successfully' })
    } else {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting project document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}