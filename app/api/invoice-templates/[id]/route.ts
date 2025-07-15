import { NextRequest, NextResponse } from 'next/server'
import { InvoiceTemplate, InvoiceTemplateFormData } from '@/types/invoice-template'
import { sql } from "@/lib/neon"

// GET /api/invoice-templates/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await sql`
      SELECT 
        id,
        name,
        description,
        is_default,
        is_active,
        design,
        branding,
        settings,
        email_settings,
        created_at,
        updated_at,
        created_by
      FROM invoice_templates 
      WHERE id = ${id} AND is_active = true
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const template = result[0]
    const formattedTemplate: InvoiceTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      isDefault: template.is_default,
      isActive: template.is_active,
      design: template.design,
      branding: template.branding,
      settings: template.settings,
      emailSettings: template.email_settings,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      createdBy: template.created_by
    }

    return NextResponse.json(formattedTemplate)
  } catch (error) {
    console.error('Error fetching invoice template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice template' },
      { status: 500 }
    )
  }
}

// PUT /api/invoice-templates/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data: Partial<InvoiceTemplateFormData> = await request.json()

    // Check if template exists
    const existing = await sql`
      SELECT id FROM invoice_templates 
      WHERE id = ${id} AND is_active = true
    `

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const updatedBy = 'current_user' // This should come from authentication

    // Build update query dynamically
    const updateFields: string[] = []
    const updateValues: any[] = []
    
    if (data.name !== undefined) {
      updateFields.push('name = $' + (updateValues.length + 1))
      updateValues.push(data.name)
    }
    
    if (data.description !== undefined) {
      updateFields.push('description = $' + (updateValues.length + 1))
      updateValues.push(data.description)
    }
    
    if (data.design !== undefined) {
      updateFields.push('design = $' + (updateValues.length + 1))
      updateValues.push(JSON.stringify(data.design))
    }
    
    if (data.branding !== undefined) {
      updateFields.push('branding = $' + (updateValues.length + 1))
      updateValues.push(JSON.stringify(data.branding))
    }
    
    if (data.settings !== undefined) {
      updateFields.push('settings = $' + (updateValues.length + 1))
      updateValues.push(JSON.stringify(data.settings))
    }
    
    if (data.emailSettings !== undefined) {
      updateFields.push('email_settings = $' + (updateValues.length + 1))
      updateValues.push(JSON.stringify(data.emailSettings))
    }

    updateFields.push('updated_at = $' + (updateValues.length + 1))
    updateValues.push(now)
    
    updateFields.push('updated_by = $' + (updateValues.length + 1))
    updateValues.push(updatedBy)

    if (updateFields.length === 2) { // Only updated_at and updated_by
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE invoice_templates 
      SET ${sql.unsafe(updateFields.join(', '))}
      WHERE id = ${id}
      RETURNING 
        id,
        name,
        description,
        is_default,
        is_active,
        design,
        branding,
        settings,
        email_settings,
        created_at,
        updated_at,
        created_by
    `

    const template = result[0]
    const formattedTemplate: InvoiceTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      isDefault: template.is_default,
      isActive: template.is_active,
      design: template.design,
      branding: template.branding,
      settings: template.settings,
      emailSettings: template.email_settings,
      createdAt: template.created_at,
      updatedAt: template.updated_at,
      createdBy: template.created_by
    }

    return NextResponse.json(formattedTemplate)
  } catch (error) {
    console.error('Error updating invoice template:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice template' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoice-templates/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if template exists and is not default
    const existing = await sql`
      SELECT id, is_default FROM invoice_templates 
      WHERE id = ${id} AND is_active = true
    `

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (existing[0].is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default template' },
        { status: 400 }
      )
    }

    // Soft delete by setting is_active to false
    await sql`
      UPDATE invoice_templates 
      SET is_active = false, updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice template:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice template' },
      { status: 500 }
    )
  }
}