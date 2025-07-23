-- Updated Clients table schema that uses UUID for consistency
-- This table stores client information in the CRM system

-- Drop and recreate clients table with UUID
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_clients_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_updated_at_column();

-- Insert some sample clients for testing
INSERT INTO clients (name, industry, contact_name, email, phone, status) VALUES
('ABC Apparel', 'Fashion & Retail', 'Emily Rodriguez', 'emily@abcapparel.com', '+1-555-0123', 'active'),
('TechStart Inc.', 'Technology', 'David Kim', 'david@techstart.com', '+1-555-0124', 'active'),
('Green Energy Co.', 'Renewable Energy', 'Lisa Chen', 'lisa@greenenergy.com', '+1-555-0125', 'active'),
('Local Restaurant', 'Food & Beverage', 'Marco Rossi', 'marco@localrestaurant.com', '+1-555-0126', 'prospect')
ON CONFLICT (id) DO NOTHING;
