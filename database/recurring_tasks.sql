-- Recurring Tasks Table
CREATE TABLE IF NOT EXISTS recurring_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    interval_value INTEGER NOT NULL DEFAULT 1,
    days_of_week INTEGER[], -- Array for weekly tasks (0=Sunday, 1=Monday, etc.)
    day_of_month INTEGER, -- For monthly tasks
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_generated TIMESTAMP WITH TIME ZONE,
    next_due TIMESTAMP WITH TIME ZONE NOT NULL,
    assigned_to VARCHAR(255),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    estimated_hours DECIMAL(5,2),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Generated Tasks Table
CREATE TABLE IF NOT EXISTS generated_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recurring_task_id UUID NOT NULL REFERENCES recurring_tasks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to VARCHAR(255),
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_project_id ON recurring_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next_due ON recurring_tasks(next_due);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_is_active ON recurring_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_generated_tasks_project_id ON generated_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_generated_tasks_recurring_task_id ON generated_tasks(recurring_task_id);
CREATE INDEX IF NOT EXISTS idx_generated_tasks_due_date ON generated_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_generated_tasks_status ON generated_tasks(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recurring_tasks_updated_at BEFORE UPDATE ON recurring_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_tasks_updated_at BEFORE UPDATE ON generated_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();