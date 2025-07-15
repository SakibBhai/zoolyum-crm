import { NextRequest, NextResponse } from 'next/server'
import { sql } from "@/lib/neon"

// POST /api/invoice-templates/[id]/set-default
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // First, unset all existing defaults
    await sql`
      UPDATE invoice_templates 
      SET is_default = false, updated_at = ${new Date().toISOString()}
      WHERE is_default = true
    `

    // Then set the new default
    await sql`
      UPDATE invoice_templates 
      SET is_default = true, updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting default template:', error)
    return NextResponse.json(
      { error: 'Failed to set default template' },
      { status: 500 }
    )
  }
}