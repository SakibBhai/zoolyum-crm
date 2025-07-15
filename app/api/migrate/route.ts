import { sql } from '@/lib/neon'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Execute the migration SQL
    const results = []
    
    // Add skills column to team_members if not exists
    const teamMembersResult = await sql`
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
    `
    results.push({ table: 'team_members', result: teamMembersResult })
    
    // Create transactions table if not exists
    const transactionsResult = await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        date DATE NOT NULL,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        invoice_id UUID,
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
    `
    results.push({ table: 'transactions', result: transactionsResult })
    
    // Create indexes for transactions table
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(type, date DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_filter_sort ON transactions(type, category, date DESC)`
    results.push({ table: 'transactions_indexes', result: 'Indexes created successfully' })
    
    // Create update trigger function for transactions
    const triggerFunctionResult = await sql`
      CREATE OR REPLACE FUNCTION update_transactions_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `
    results.push({ table: 'transactions_trigger_function', result: triggerFunctionResult })
    
    // Drop existing trigger if exists
    await sql`DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions`
    
    // Create update trigger for transactions
    const triggerResult = await sql`
      CREATE TRIGGER update_transactions_updated_at 
          BEFORE UPDATE ON transactions 
          FOR EACH ROW 
          EXECUTE FUNCTION update_transactions_updated_at_column()
    `
    results.push({ table: 'transactions_trigger', result: triggerResult })
    
    // Create financial summary view
    const summaryViewResult = await sql`
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
      ORDER BY month DESC, type, category
    `
    results.push({ table: 'financial_summary_view', result: summaryViewResult })
    
    // Create monthly totals view
    const monthlyViewResult = await sql`
      CREATE OR REPLACE VIEW monthly_totals AS
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_amount
      FROM transactions 
      WHERE status = 'completed'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month DESC
    `
    results.push({ table: 'monthly_totals_view', result: monthlyViewResult })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      results 
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}