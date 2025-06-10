import { sql } from '@/lib/neon'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Execute the migration SQL
    const result = await sql`
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      result 
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}