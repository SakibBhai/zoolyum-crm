-- Financial transactions table schema for the CRM system
-- This table stores income and expense transactions with proper indexing and constraints

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  receipt_url TEXT,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  tags TEXT[],
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  recurring_end_date DATE,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_by VARCHAR(255),
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(type, date DESC);

-- Create a composite index for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_transactions_filter_sort ON transactions(type, category, date DESC);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_transactions_updated_at_column();

-- Insert sample transaction categories for reference
COMMENT ON COLUMN transactions.category IS 'Income categories: Salary, Freelance, Business Revenue, Investment Returns, Rental Income, Dividends, Interest, Bonus, Commission, Consulting, Sales, Other Income. Expense categories: Office Supplies, Software & Tools, Marketing & Advertising, Travel & Transportation, Meals & Entertainment, Professional Services, Rent & Utilities, Insurance, Equipment, Training & Education, Taxes, Bank Fees, Maintenance, Other Expenses';

-- Create a view for financial summary
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
  DATE_TRUNC('month', date) as month,
  type,
  category,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count,
  AVG(amount) as average_amount
FROM transactions 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', date), type, category
ORDER BY month DESC, type, category;

-- Create a view for monthly totals
CREATE OR REPLACE VIEW monthly_totals AS
SELECT 
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_amount
FROM transactions 
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;