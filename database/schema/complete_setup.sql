-- Comprehensive Database Setup for Zoolyum CRM
-- This script sets up all tables with proper relationships and sample data

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Departments table first (referenced by team_members)
DROP TABLE IF EXISTS departments CASCADE;
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    head_of_department UUID,
    budget DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Clients table
DROP TABLE IF EXISTS clients CASCADE;
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    website VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'former')),
    contract_value DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Team Members table
DROP TABLE IF EXISTS team_members CASCADE;
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

-- 4. Create Projects table
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
    frequency VARCHAR(50),
    recurrence_end DATE,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Tasks table
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

-- Create all indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id ON team_members(employee_id);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_created_at ON team_members(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Create trigger functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
-- 1. Sample departments
INSERT INTO departments (name, description) VALUES
('Development', 'Software development and engineering'),
('Design', 'UI/UX design and creative services'),
('Marketing', 'Marketing and client outreach'),
('Management', 'Project and team management')
ON CONFLICT (name) DO NOTHING;

-- 2. Sample clients
INSERT INTO clients (name, industry, contact_name, email, phone, status) VALUES
('ABC Apparel', 'Fashion & Retail', 'Emily Rodriguez', 'emily@abcapparel.com', '+1-555-0123', 'active'),
('TechStart Inc.', 'Technology', 'David Kim', 'david@techstart.com', '+1-555-0124', 'active'),
('Green Energy Co.', 'Renewable Energy', 'Lisa Chen', 'lisa@greenenergy.com', '+1-555-0125', 'active'),
('Local Restaurant', 'Food & Beverage', 'Marco Rossi', 'marco@localrestaurant.com', '+1-555-0126', 'prospect');

-- 3. Sample team members
INSERT INTO team_members (name, email, role, department, employee_id) VALUES
('John Doe', 'john.doe@company.com', 'Project Manager', 'Management', 'EMP001'),
('Jane Smith', 'jane.smith@company.com', 'Senior Developer', 'Development', 'EMP002'),
('Mike Johnson', 'mike.johnson@company.com', 'UI/UX Designer', 'Design', 'EMP003'),
('Sarah Wilson', 'sarah.wilson@company.com', 'Marketing Specialist', 'Marketing', 'EMP004'),
('Alex Chen', 'alex.chen@company.com', 'Full Stack Developer', 'Development', 'EMP005')
ON CONFLICT (email) DO NOTHING;

-- 4. Sample projects (insert after we have clients and team members)
INSERT INTO projects (name, description, client_id, status, priority, type, start_date, end_date, estimated_budget, manager, created_by) 
SELECT 
    'Summer Collection Campaign',
    'A comprehensive social media campaign for ABC Apparel summer collection',
    c.id,
    'active',
    'high',
    'Social Media Management',
    '2024-04-01',
    '2024-08-31',
    15000.00,
    'Sarah Wilson',
    tm.id
FROM clients c, team_members tm 
WHERE c.name = 'ABC Apparel' AND tm.name = 'Sarah Wilson'
LIMIT 1;

INSERT INTO projects (name, description, client_id, status, priority, type, start_date, end_date, estimated_budget, manager, created_by)
SELECT 
    'Website Redesign',
    'Complete redesign of the ABC Apparel website',
    c.id,
    'active',
    'medium',
    'Website Design',
    '2024-03-15',
    '2024-06-30',
    25000.00,
    'John Doe',
    tm.id
FROM clients c, team_members tm 
WHERE c.name = 'ABC Apparel' AND tm.name = 'John Doe'
LIMIT 1;

INSERT INTO projects (name, description, client_id, status, priority, type, start_date, end_date, estimated_budget, manager, created_by)
SELECT 
    'Mobile App Development',
    'Develop a mobile app for TechStart Inc.',
    c.id,
    'planning',
    'high',
    'Mobile Development',
    '2024-05-01',
    '2024-12-31',
    50000.00,
    'Jane Smith',
    tm.id
FROM clients c, team_members tm 
WHERE c.name = 'TechStart Inc.' AND tm.name = 'Jane Smith'
LIMIT 1;

-- 5. Sample tasks (insert after we have projects and team members)
INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date, estimated_hours)
SELECT 
    'Setup project structure',
    'Initialize the project structure and basic configuration',
    p.id,
    tm.id,
    'high',
    'in_progress',
    NOW() + INTERVAL '7 days',
    8.0
FROM projects p, team_members tm 
WHERE p.name = 'Website Redesign' AND tm.name = 'Jane Smith'
LIMIT 1;

INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date, estimated_hours)
SELECT 
    'Design homepage mockup',
    'Create initial homepage design mockup',
    p.id,
    tm.id,
    'medium',
    'todo',
    NOW() + INTERVAL '10 days',
    12.0
FROM projects p, team_members tm 
WHERE p.name = 'Website Redesign' AND tm.name = 'Mike Johnson'
LIMIT 1;

INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date, estimated_hours)
SELECT 
    'Content strategy planning',
    'Develop content strategy for social media campaign',
    p.id,
    tm.id,
    'high',
    'in_progress',
    NOW() + INTERVAL '5 days',
    16.0
FROM projects p, team_members tm 
WHERE p.name = 'Summer Collection Campaign' AND tm.name = 'Sarah Wilson'
LIMIT 1;

INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date, estimated_hours)
SELECT 
    'App architecture design',
    'Design the overall architecture for the mobile app',
    p.id,
    tm.id,
    'high',
    'todo',
    NOW() + INTERVAL '14 days',
    20.0
FROM projects p, team_members tm 
WHERE p.name = 'Mobile App Development' AND tm.name = 'Alex Chen'
LIMIT 1;

INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date, estimated_hours)
SELECT 
    'Database schema design',
    'Create comprehensive database schema for the mobile app',
    p.id,
    tm.id,
    'medium',
    'todo',
    NOW() + INTERVAL '21 days',
    10.0
FROM projects p, team_members tm 
WHERE p.name = 'Mobile App Development' AND tm.name = 'Jane Smith'
LIMIT 1;
