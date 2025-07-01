-- Add new columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS version_history_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ DEFAULT NOW();

-- Create project_version_history table
CREATE TABLE IF NOT EXISTS project_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  changed_fields JSONB NOT NULL,
  previous_values JSONB NOT NULL,
  changed_by VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_version_history_project_id ON project_version_history(project_id);

-- Update existing projects to have default values
UPDATE projects SET 
  recurrence_pattern = '{}', 
  last_modified = NOW() 
  WHERE recurrence_pattern IS NULL;