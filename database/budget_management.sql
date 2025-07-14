-- Project Budget Table
CREATE TABLE IF NOT EXISTS project_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    allocated_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    remaining_budget DECIMAL(12,2) GENERATED ALWAYS AS (total_budget - spent_amount) STORED,
    warning_threshold INTEGER NOT NULL DEFAULT 80, -- percentage
    critical_threshold INTEGER NOT NULL DEFAULT 95, -- percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id)
);

-- Budget Categories Table
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, name)
);

-- Budget Expenses Table
CREATE TABLE IF NOT EXISTS budget_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'adjustment')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    receipt_url TEXT,
    vendor VARCHAR(255),
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budget History Table (for tracking changes)
CREATE TABLE IF NOT EXISTS budget_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'budget_updated', 'expense_added', 'expense_approved', etc.
    description TEXT,
    amount_change DECIMAL(12,2),
    old_value DECIMAL(12,2),
    new_value DECIMAL(12,2),
    changed_by VARCHAR(255),
    metadata JSONB, -- Additional data about the change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_budgets_project_id ON project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_project_id ON budget_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_project_id ON budget_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_category_id ON budget_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_status ON budget_expenses(status);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_date ON budget_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_budget_history_project_id ON budget_history(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_action ON budget_history(action);

-- Function to update category spent amount when expenses change
CREATE OR REPLACE FUNCTION update_category_spent_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the category spent amount
    UPDATE budget_categories 
    SET spent_amount = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM budget_expenses 
        WHERE category_id = COALESCE(NEW.category_id, OLD.category_id)
        AND status = 'approved'
        AND type = 'expense'
    )
    WHERE id = COALESCE(NEW.category_id, OLD.category_id);
    
    -- Update the project total spent amount
    UPDATE project_budgets 
    SET spent_amount = (
        SELECT COALESCE(SUM(bc.spent_amount), 0)
        FROM budget_categories bc
        WHERE bc.project_id = COALESCE(NEW.project_id, OLD.project_id)
    )
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update project allocated budget when categories change
CREATE OR REPLACE FUNCTION update_project_allocated_budget()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE project_budgets 
    SET allocated_budget = (
        SELECT COALESCE(SUM(allocated_amount), 0)
        FROM budget_categories
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    )
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to log budget changes
CREATE OR REPLACE FUNCTION log_budget_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO budget_history (project_id, action, description, amount_change, new_value)
        VALUES (
            NEW.project_id,
            TG_TABLE_NAME || '_created',
            'New ' || TG_TABLE_NAME || ' created: ' || COALESCE(NEW.title, NEW.name, 'Unknown'),
            CASE 
                WHEN TG_TABLE_NAME = 'budget_expenses' THEN NEW.amount
                WHEN TG_TABLE_NAME = 'budget_categories' THEN NEW.allocated_amount
                ELSE NULL
            END,
            CASE 
                WHEN TG_TABLE_NAME = 'budget_expenses' THEN NEW.amount
                WHEN TG_TABLE_NAME = 'budget_categories' THEN NEW.allocated_amount
                ELSE NULL
            END
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log significant changes
        IF TG_TABLE_NAME = 'budget_expenses' AND OLD.status != NEW.status THEN
            INSERT INTO budget_history (project_id, action, description, amount_change)
            VALUES (
                NEW.project_id,
                'expense_status_changed',
                'Expense "' || NEW.title || '" status changed from ' || OLD.status || ' to ' || NEW.status,
                CASE WHEN NEW.status = 'approved' AND OLD.status != 'approved' THEN NEW.amount
                     WHEN OLD.status = 'approved' AND NEW.status != 'approved' THEN -NEW.amount
                     ELSE 0 END
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO budget_history (project_id, action, description, amount_change)
        VALUES (
            OLD.project_id,
            TG_TABLE_NAME || '_deleted',
            'Deleted ' || TG_TABLE_NAME || ': ' || COALESCE(OLD.title, OLD.name, 'Unknown'),
            CASE 
                WHEN TG_TABLE_NAME = 'budget_expenses' THEN -OLD.amount
                WHEN TG_TABLE_NAME = 'budget_categories' THEN -OLD.allocated_amount
                ELSE NULL
            END
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating spent amounts
CREATE TRIGGER update_category_spent_on_expense_change
    AFTER INSERT OR UPDATE OR DELETE ON budget_expenses
    FOR EACH ROW EXECUTE FUNCTION update_category_spent_amount();

CREATE TRIGGER update_project_allocated_on_category_change
    AFTER INSERT OR UPDATE OR DELETE ON budget_categories
    FOR EACH ROW EXECUTE FUNCTION update_project_allocated_budget();

-- Triggers for logging changes
CREATE TRIGGER log_budget_expense_changes
    AFTER INSERT OR UPDATE OR DELETE ON budget_expenses
    FOR EACH ROW EXECUTE FUNCTION log_budget_change();

CREATE TRIGGER log_budget_category_changes
    AFTER INSERT OR UPDATE OR DELETE ON budget_categories
    FOR EACH ROW EXECUTE FUNCTION log_budget_change();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_project_budgets_updated_at BEFORE UPDATE ON project_budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_categories_updated_at BEFORE UPDATE ON budget_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_expenses_updated_at BEFORE UPDATE ON budget_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for budget summary
CREATE OR REPLACE VIEW budget_summary AS
SELECT 
    pb.project_id,
    pb.total_budget,
    pb.allocated_budget,
    pb.spent_amount,
    pb.remaining_budget,
    CASE 
        WHEN pb.total_budget > 0 THEN (pb.spent_amount / pb.total_budget * 100)
        ELSE 0 
    END as utilization_percentage,
    CASE 
        WHEN pb.total_budget > 0 AND (pb.spent_amount / pb.total_budget * 100) >= pb.critical_threshold THEN 'critical'
        WHEN pb.total_budget > 0 AND (pb.spent_amount / pb.total_budget * 100) >= pb.warning_threshold THEN 'warning'
        ELSE 'good'
    END as budget_status,
    COUNT(bc.id) as category_count,
    COUNT(be.id) as expense_count,
    COUNT(CASE WHEN be.status = 'pending' THEN 1 END) as pending_expenses
FROM project_budgets pb
LEFT JOIN budget_categories bc ON pb.project_id = bc.project_id
LEFT JOIN budget_expenses be ON pb.project_id = be.project_id
GROUP BY pb.project_id, pb.total_budget, pb.allocated_budget, pb.spent_amount, 
         pb.remaining_budget, pb.warning_threshold, pb.critical_threshold;