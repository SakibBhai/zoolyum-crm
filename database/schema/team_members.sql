-- Team Members Table Schema for Neon.tech PostgreSQL
-- This table stores information about team members in the CRM system

CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
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
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_created_at ON team_members(created_at);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    manager_id INTEGER REFERENCES team_members(id),
    budget DECIMAL(12,2),
    goals TEXT[],
    responsibilities TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add some sample departments
INSERT INTO departments (name, description, goals, responsibilities) VALUES
('Engineering', 'Software development and technical operations', ARRAY['Deliver high-quality software', 'Maintain system reliability'], ARRAY['Code development', 'System architecture', 'Technical documentation']),
('Marketing', 'Brand promotion and customer acquisition', ARRAY['Increase brand awareness', 'Generate qualified leads'], ARRAY['Campaign management', 'Content creation', 'Market research']),
('Sales', 'Revenue generation and client relationships', ARRAY['Meet sales targets', 'Expand client base'], ARRAY['Lead conversion', 'Client meetings', 'Proposal creation']),
('Design', 'User experience and visual design', ARRAY['Create intuitive designs', 'Maintain design consistency'], ARRAY['UI/UX design', 'Brand guidelines', 'Design systems']),
('Operations', 'Business operations and process optimization', ARRAY['Streamline processes', 'Ensure operational efficiency'], ARRAY['Process management', 'Resource allocation', 'Quality assurance']),
('Human Resources', 'Employee management and organizational development', ARRAY['Attract top talent', 'Maintain employee satisfaction'], ARRAY['Recruitment', 'Employee relations', 'Performance management'])
ON CONFLICT (name) DO NOTHING;