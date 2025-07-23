-- Updated Projects table schema that matches the application requirements
-- This table stores projects with proper relationships and all needed fields

-- Drop and recreate projects table with correct structure
DROP TABLE IF EXISTS projects CASCADE;

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled', 'draft')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    type VARCHAR(100) DEFAULT 'General',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2) DEFAULT 0,
    estimated_budget DECIMAL(12, 2) DEFAULT 0,
    actual_budget DECIMAL(12, 2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    manager VARCHAR(255),
    created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
    team_members JSONB DEFAULT '[]'::jsonb,
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency VARCHAR(50), -- e.g., 'daily', 'weekly', 'monthly', 'yearly'
    recurrence_end DATE, -- When the recurrence should stop
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_is_recurring ON projects(is_recurring);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_client_status ON projects(client_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_status_priority ON projects(status, priority);

-- Add trigger function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_projects_updated_at_column();
