CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id),
    status VARCHAR(50) DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10, 2),
    team_members JSONB DEFAULT '[]'::jsonb,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency VARCHAR(50), -- e.g., 'daily', 'weekly', 'monthly', 'yearly'
    recurrence_end DATE, -- When the recurrence should stop
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);