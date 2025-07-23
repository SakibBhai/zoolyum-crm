require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function setupCompleteCRM() {
    console.log('Setting up complete CRM database...');

    try {
        // 1. Create core tables (clients, team_members, projects, tasks)
        console.log('Creating core tables...');

        await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(50),
        company VARCHAR(255),
        address TEXT,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(100),
        department VARCHAR(100),
        hire_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        hourly_rate DECIMAL(10,2),
        skills TEXT[],
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'planning',
        priority VARCHAR(20) DEFAULT 'medium',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(12,2),
        spent DECIMAL(12,2) DEFAULT 0,
        progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
        project_manager_id UUID REFERENCES team_members(id),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id UUID REFERENCES team_members(id),
        status VARCHAR(50) DEFAULT 'todo',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date TIMESTAMP,
        estimated_hours DECIMAL(5,2),
        actual_hours DECIMAL(5,2),
        completed_at TIMESTAMP,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        // 2. Create leads table
        console.log('Creating leads table...');
        await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'new',
        score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
        notes TEXT,
        assigned_to UUID REFERENCES team_members(id),
        converted_to_client_id UUID REFERENCES clients(id),
        converted_at TIMESTAMP,
        last_contact_date TIMESTAMP,
        next_follow_up TIMESTAMP,
        estimated_value DECIMAL(12,2),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        // 3. Create invoices table
        console.log('Creating invoices table...');
        await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number VARCHAR(100) UNIQUE NOT NULL,
        client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id),
        amount DECIMAL(12,2) NOT NULL,
        tax_amount DECIMAL(12,2) DEFAULT 0,
        total_amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        paid_date DATE,
        notes TEXT,
        items JSONB,
        payment_terms INTEGER DEFAULT 30,
        late_fees DECIMAL(12,2) DEFAULT 0,
        discount_amount DECIMAL(12,2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        created_by UUID REFERENCES team_members(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        // 4. Create recurring_invoices table
        console.log('Creating recurring invoices table...');
        await sql`
      CREATE TABLE IF NOT EXISTS recurring_invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id),
        template_name VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        frequency VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        next_invoice_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        items JSONB,
        payment_terms INTEGER DEFAULT 30,
        auto_send BOOLEAN DEFAULT false,
        created_by UUID REFERENCES team_members(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        // 5. Create content_calendar table
        console.log('Creating content calendar table...');
        await sql`
      CREATE TABLE IF NOT EXISTS content_calendar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content_type VARCHAR(100),
        platform VARCHAR(100),
        scheduled_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'planned',
        priority VARCHAR(20) DEFAULT 'medium',
        project_id UUID REFERENCES projects(id),
        client_id UUID REFERENCES clients(id),
        assigned_to UUID REFERENCES team_members(id),
        content_url TEXT,
        hashtags TEXT[],
        notes TEXT,
        approval_status VARCHAR(50) DEFAULT 'pending',
        approved_by UUID REFERENCES team_members(id),
        approved_at TIMESTAMP,
        published_at TIMESTAMP,
        engagement_metrics JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        // 6. Create reports table
        console.log('Creating reports table...');
        await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        config JSONB NOT NULL,
        created_by UUID REFERENCES team_members(id),
        is_public BOOLEAN DEFAULT false,
        scheduled BOOLEAN DEFAULT false,
        schedule_config JSONB,
        last_run TIMESTAMP,
        tags TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        // 7. Create transactions table for finance tracking
        console.log('Creating transactions table...');
        await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        project_id UUID REFERENCES projects(id),
        client_id UUID REFERENCES clients(id),
        invoice_id UUID REFERENCES invoices(id),
        transaction_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        payment_method VARCHAR(100),
        reference_number VARCHAR(255),
        notes TEXT,
        created_by UUID REFERENCES team_members(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

        // 8. Create indexes for better performance
        console.log('Creating indexes...');
        await sql`CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_project_id ON content_calendar(project_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_date ON content_calendar(scheduled_date)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)`;

        // 9. Insert sample data
        console.log('Inserting sample data...');

        // Sample clients
        const clients = await sql`
      INSERT INTO clients (name, email, phone, company, status) VALUES
      ('John Smith', 'john@company.com', '+1-555-0123', 'Tech Corp', 'active'),
      ('Sarah Johnson', 'sarah@startup.io', '+1-555-0124', 'StartupCo', 'active'),
      ('Mike Brown', 'mike@enterprise.com', '+1-555-0125', 'Enterprise Inc', 'active')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name
    `;

        // Sample team members
        const teamMembers = await sql`
      INSERT INTO team_members (name, email, role, department, hourly_rate, status) VALUES
      ('Alice Wilson', 'alice@company.com', 'Project Manager', 'Operations', 75.00, 'active'),
      ('Bob Chen', 'bob@company.com', 'Developer', 'Engineering', 85.00, 'active'),
      ('Carol Davis', 'carol@company.com', 'Designer', 'Creative', 70.00, 'active'),
      ('David Kim', 'david@company.com', 'Marketing Manager', 'Marketing', 80.00, 'active')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, role
    `;

        if (clients.length > 0 && teamMembers.length > 0) {
            const clientId = clients[0].id;
            const pmId = teamMembers[0].id;
            const devId = teamMembers[1].id;

            // Sample projects
            const projects = await sql`
        INSERT INTO projects (name, description, client_id, status, project_manager_id, budget, progress) VALUES
        ('Website Redesign', 'Complete website overhaul with modern design', ${clientId}, 'active', ${pmId}, 25000.00, 45),
        ('Mobile App Development', 'iOS and Android app development', ${clientId}, 'planning', ${pmId}, 45000.00, 10)
        RETURNING id, name
      `;

            if (projects.length > 0) {
                const projectId = projects[0].id;

                // Sample tasks
                await sql`
          INSERT INTO tasks (title, description, project_id, assignee_id, status, priority, estimated_hours) VALUES
          ('Design Homepage', 'Create new homepage design mockups', ${projectId}, ${teamMembers[2]?.id}, 'in-progress', 'high', 16.0),
          ('Implement Frontend', 'Build responsive frontend components', ${projectId}, ${devId}, 'todo', 'medium', 32.0),
          ('Setup Database', 'Configure production database', ${projectId}, ${devId}, 'completed', 'high', 8.0)
        `;

                // Sample content calendar
                await sql`
          INSERT INTO content_calendar (title, content_type, platform, scheduled_date, project_id, client_id, assigned_to, status) VALUES
          ('Project Launch Announcement', 'Social Media Post', 'LinkedIn', NOW() + interval '7 days', ${projectId}, ${clientId}, ${teamMembers[3]?.id}, 'planned'),
          ('Behind the Scenes Video', 'Video Content', 'YouTube', NOW() + interval '14 days', ${projectId}, ${clientId}, ${teamMembers[3]?.id}, 'in-progress')
        `;

                // Sample invoice
                await sql`
          INSERT INTO invoices (invoice_number, client_id, project_id, amount, tax_amount, total_amount, status, issue_date, due_date, created_by) VALUES
          ('INV-2024-001', ${clientId}, ${projectId}, 5000.00, 500.00, 5500.00, 'sent', CURRENT_DATE, CURRENT_DATE + interval '30 days', ${pmId})
        `;

                // Sample transactions
                await sql`
          INSERT INTO transactions (type, amount, description, category, project_id, client_id, transaction_date, created_by) VALUES
          ('income', 5500.00, 'Payment for Website Redesign - Phase 1', 'Project Payment', ${projectId}, ${clientId}, CURRENT_DATE, ${pmId}),
          ('expense', 1200.00, 'Design Software License', 'Software', ${projectId}, ${clientId}, CURRENT_DATE - interval '5 days', ${pmId})
        `;
            }

            // Sample leads
            await sql`
        INSERT INTO leads (name, email, company, source, status, score, assigned_to, estimated_value) VALUES
        ('Jennifer Lopez', 'jennifer@newcompany.com', 'New Company LLC', 'Website', 'qualified', 75, ${teamMembers[0]?.id}, 15000.00),
        ('Robert Taylor', 'robert@techstart.com', 'TechStart', 'Referral', 'contacted', 60, ${teamMembers[0]?.id}, 8000.00)
      `;
        }

        console.log('✅ Complete CRM database setup successful!');
        console.log('✅ All tables created with proper relationships');
        console.log('✅ Sample data inserted for testing');
        console.log('✅ Indexes created for optimal performance');

        console.log('\nCRM Modules Ready:');
        console.log('- Clients Management');
        console.log('- Leads & Sales Pipeline');
        console.log('- Projects & Tasks');
        console.log('- Content Calendar');
        console.log('- Team Management');
        console.log('- Invoicing & Finance');
        console.log('- Reports & Analytics');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

setupCompleteCRM();
