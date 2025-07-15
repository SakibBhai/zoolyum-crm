import { NextRequest, NextResponse } from 'next/server'
import { InvoiceTemplate, InvoiceTemplateFormData, DEFAULT_INVOICE_TEMPLATE } from '@/types/invoice-template'
import { sql } from "@/lib/neon"

// GET /api/invoice-templates
export async function GET() {
  try {
    const templates = await sql`
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
      WHERE is_active = true
      ORDER BY is_default DESC, name ASC
    `

    const formattedTemplates: InvoiceTemplate[] = templates.map(template => ({
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
    }))

    // If no templates exist, return default template
    if (formattedTemplates.length === 0) {
      const defaultTemplate: InvoiceTemplate = {
        ...DEFAULT_INVOICE_TEMPLATE,
        id: 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'system'
      }
      return NextResponse.json([defaultTemplate])
    }

    return NextResponse.json(formattedTemplates)
  } catch (error) {
    console.error('Error fetching invoice templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice templates' },
      { status: 500 }
    )
  }
}

// POST /api/invoice-templates
export async function POST(request: NextRequest) {
  try {
    const data: InvoiceTemplateFormData = await request.json()

    // Validate required fields
    if (!data.name || !data.design || !data.branding || !data.settings || !data.emailSettings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate ID
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const createdBy = 'current_user' // This should come from authentication

    // If this is set as default, unset other defaults
    if (data.settings) {
      await sql`
        UPDATE invoice_templates 
        SET is_default = false 
        WHERE is_default = true
      `
    }

    const result = await sql`
      INSERT INTO invoice_templates (
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
      ) VALUES (
        ${id},
        ${data.name},
        ${data.description || null},
        false,
        true,
        ${JSON.stringify(data.design)},
        ${JSON.stringify(data.branding)},
        ${JSON.stringify(data.settings)},
        ${JSON.stringify(data.emailSettings)},
        ${now},
        ${now},
        ${createdBy}
      )
      RETURNING *
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

    return NextResponse.json(formattedTemplate, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice template:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice template' },
      { status: 500 }
    )
  }
}