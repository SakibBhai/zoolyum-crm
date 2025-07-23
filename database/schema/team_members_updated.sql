-- Updated Team Members table schema that uses UUID for consistency
-- This table stores information about team members in the CRM system

-- Drop and recreate team_members table with UUID
DROP TABLE IF EXISTS team_members CASCADE;

-- First create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    head_of_department UUID,
    budget DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Now create team_members with UUID
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    phone VARCHAR(50),
    bio TEXT DEFAULT '',
    skills JSONB DEFAULT '[]'::jsonb,
    avatar VARCHAR(500) DEFAULT '/placeholder-user.jpg',
    linkedin VARCHAR(500),
    twitter VARCHAR(100),
    location VARCHAR(255) DEFAULT '',
    salary DECIMAL(10,2),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    manager VARCHAR(255),
    performance_rating DECIMAL(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_team_members_department_id ON team_members(department_id);
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_created_at ON team_members(created_at DESC);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_team_members_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_members_updated_at_column();

-- Insert some sample team members for testing
INSERT INTO team_members (name, email, role, department, employee_id) VALUES
('John Doe', 'john.doe@company.com', 'Project Manager', 'Development', 'EMP001'),
('Jane Smith', 'jane.smith@company.com', 'Senior Developer', 'Development', 'EMP002'),
('Mike Johnson', 'mike.johnson@company.com', 'Designer', 'Design', 'EMP003'),
('Sarah Wilson', 'sarah.wilson@company.com', 'Marketing Specialist', 'Marketing', 'EMP004')
ON CONFLICT (email) DO NOTHING;
