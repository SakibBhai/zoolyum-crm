const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function resetDatabaseState() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Resetting database migration state...');
    
    // Drop the _prisma_migrations table to reset migration history
    await sql`DROP TABLE IF EXISTS _prisma_migrations CASCADE`;
    console.log('Dropped _prisma_migrations table');
    
    // Drop existing tables if they exist
    await sql`DROP TABLE IF EXISTS project_version_history CASCADE`;
    await sql`DROP TABLE IF EXISTS projects CASCADE`;
    await sql`DROP TABLE IF EXISTS clients CASCADE`;
    console.log('Dropped all existing tables');
    
    // Drop existing enum types if they exist
    await sql`DROP TYPE IF EXISTS "ClientStatus" CASCADE`;
    await sql`DROP TYPE IF EXISTS "ProjectStatus" CASCADE`;
    
    // Create status enum types
    await sql`CREATE TYPE "ClientStatus" AS ENUM ('active', 'inactive', 'prospect')`;
    await sql`CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled')`;
    console.log('Created enum types');
    
    // Create clients table with new schema
    await sql`
      CREATE TABLE clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        industry TEXT,
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        status "ClientStatus" DEFAULT 'prospect',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID
      )
    `;
    console.log('Created clients table with new schema');
    
    // Create projects table
    await sql`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        status "ProjectStatus" DEFAULT 'planning',
        estimated_budget DECIMAL(10,2),
        actual_budget DECIMAL(10,2),
        performance_points INTEGER,
        start_date DATE,
        end_date DATE,
        team_members TEXT[],
        is_recurring BOOLEAN DEFAULT false,
        recurrence_end DATE,
        recurrence_pattern JSONB,
        version_history_id UUID,
        last_modified TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID
      )
    `;
    console.log('Created projects table');
    
    // Create project version history table
    await sql`
      CREATE TABLE project_version_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        changed_fields JSONB NOT NULL,
        previous_values JSONB NOT NULL,
        changed_by TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log('Created project_version_history table');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_project_version_history_project_id ON project_version_history(project_id)`;
    console.log('Created indexes');
    
    console.log('Database schema created successfully!');
    console.log('You can now run: npx prisma db pull to sync the Prisma schema');
    
  } catch (error) {
    console.error('Database reset failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

resetDatabaseState();