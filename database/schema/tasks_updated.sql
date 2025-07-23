-- Updated Tasks table schema that matches the application requirements
-- This table stores tasks with proper relationships to projects and team members

-- Drop and recreate tasks table with correct structure
DROP TABLE IF EXISTS tasks CASCADE;

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled', 'backlog')),
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    is_content_related BOOLEAN DEFAULT FALSE,
    dependencies JSONB DEFAULT '[]'::jsonb,
    tags TEXT[],
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_is_content_related ON tasks(is_content_related);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status);

-- Add trigger function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_tasks_updated_at_column();

-- Insert some sample tasks for testing (these should reference existing projects and team members)
-- Note: Make sure you have projects and team_members data before running these inserts

-- Sample tasks (uncomment after ensuring you have project and team member data)
-- INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date, estimated_hours) VALUES
-- ('Setup project structure', 'Initialize the project structure and basic configuration', 
--  (SELECT id FROM projects LIMIT 1), 
--  (SELECT id FROM team_members LIMIT 1), 
--  'high', 'in_progress', NOW() + INTERVAL '7 days', 8.0),
-- ('Design database schema', 'Create comprehensive database schema for the CRM system', 
--  (SELECT id FROM projects LIMIT 1), 
--  (SELECT id FROM team_members LIMIT 1), 
--  'high', 'todo', NOW() + INTERVAL '10 days', 12.0),
-- ('Implement user authentication', 'Set up user authentication and authorization system', 
--  (SELECT id FROM projects LIMIT 1), 
--  (SELECT id FROM team_members LIMIT 1), 
--  'medium', 'todo', NOW() + INTERVAL '14 days', 16.0);
