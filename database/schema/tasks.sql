-- Tasks table schema for the CRM system
-- This table stores user tasks with proper indexing and constraints

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Create a composite index for owner_id and created_at for the "delete last" query
CREATE INDEX IF NOT EXISTS idx_tasks_owner_created ON tasks(owner_id, created_at DESC);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO tasks (title, description, due_date, priority, owner_id) VALUES
-- ('Sample Task 1', 'This is a sample task for testing', '2024-12-31 23:59:59+00', 'high', '550e8400-e29b-41d4-a716-446655440000'),
-- ('Sample Task 2', 'Another sample task', '2024-12-25 12:00:00+00', 'medium', '550e8400-e29b-41d4-a716-446655440000'),
-- ('Sample Task 3', 'Low priority task', NULL, 'low', '550e8400-e29b-41d4-a716-446655440000');