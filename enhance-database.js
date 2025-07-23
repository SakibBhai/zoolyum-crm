require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function addMissingTables() {
    try {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            console.error('DATABASE_URL not found in environment variables');
            process.exit(1);
        }

        console.log('Connecting to database...');
        const sql = neon(databaseUrl);

        console.log('Adding missing tables for complete CRM functionality...');

        // 1. Create leads table if not exists
        await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        industry VARCHAR(255),
        title VARCHAR(255),
        source VARCHAR(100),
        status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
        assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
        notes TEXT,
        last_contact_date TIMESTAMP WITH TIME ZONE,
        next_follow_up TIMESTAMP WITH TIME ZONE,
        conversion_date TIMESTAMP WITH TIME ZONE,
        estimated_value DECIMAL(12,2),
        tags TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log('✅ Leads table created/verified');

        // 2. Create content_calendar table
        await sql`
      CREATE TABLE IF NOT EXISTS content_calendar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content_type VARCHAR(100) NOT NULL CHECK (content_type IN ('post', 'story', 'video', 'image', 'article', 'carousel', 'reel')),
        platform VARCHAR(100) NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'website', 'blog')),
        scheduled_date DATE NOT NULL,
        scheduled_time TIME,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled')),
        tags TEXT[],
        media_urls TEXT[],
        approval_required BOOLEAN DEFAULT FALSE,
        approved_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
        approved_at TIMESTAMP WITH TIME ZONE,
        published_at TIMESTAMP WITH TIME ZONE,
        engagement_metrics JSONB DEFAULT '{}'::jsonb,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log('✅ Content calendar table created');

        // 3. Create reports table
        await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        modules TEXT[],
        filters JSONB DEFAULT '{}'::jsonb,
        date_range JSONB DEFAULT '{}'::jsonb,
        group_by VARCHAR(100),
        metrics TEXT[],
        data JSONB DEFAULT '{}'::jsonb,
        format VARCHAR(20) DEFAULT 'json',
        created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
        is_scheduled BOOLEAN DEFAULT FALSE,
        schedule_frequency VARCHAR(50),
        last_generated TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log('✅ Reports table created');

        // 4. Update invoices table to include more fields if they don't exist
        await sql`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS amount_due DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255),
      ADD COLUMN IF NOT EXISTS due_date DATE,
      ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS email_history JSONB DEFAULT '[]'::jsonb
    `;
        console.log('✅ Invoices table updated');

        // 5. Create indexes for better performance
        await sql`CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC)`;

        await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_scheduled_date ON content_calendar(scheduled_date)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_platform ON content_calendar(platform)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_project_id ON content_calendar(project_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_content_calendar_client_id ON content_calendar(client_id)`;

        await sql`CREATE INDEX IF NOT EXISTS idx_reports_name ON reports(name)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC)`;

        // 6. Create trigger functions for updating timestamps
        await sql`
      CREATE OR REPLACE FUNCTION update_leads_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

        await sql`
      CREATE OR REPLACE FUNCTION update_content_calendar_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

        await sql`
      CREATE OR REPLACE FUNCTION update_reports_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

        // 7. Create triggers
        await sql`DROP TRIGGER IF EXISTS update_leads_updated_at ON leads`;
        await sql`
      CREATE TRIGGER update_leads_updated_at
          BEFORE UPDATE ON leads FOR EACH ROW 
          EXECUTE FUNCTION update_leads_updated_at_column()
    `;

        await sql`DROP TRIGGER IF EXISTS update_content_calendar_updated_at ON content_calendar`;
        await sql`
      CREATE TRIGGER update_content_calendar_updated_at
          BEFORE UPDATE ON content_calendar FOR EACH ROW 
          EXECUTE FUNCTION update_content_calendar_updated_at_column()
    `;

        await sql`DROP TRIGGER IF EXISTS update_reports_updated_at ON reports`;
        await sql`
      CREATE TRIGGER update_reports_updated_at
          BEFORE UPDATE ON reports FOR EACH ROW 
          EXECUTE FUNCTION update_reports_updated_at_column()
    `;

        console.log('✅ All triggers created');

        // 8. Insert sample data for new tables
        console.log('Inserting sample data for new modules...');

        // Sample leads
        const teamMembers = await sql`SELECT id, name FROM team_members LIMIT 2`;
        if (teamMembers.length > 0) {
            await sql`
        INSERT INTO leads (first_name, last_name, email, phone, company, industry, source, status, assigned_to, estimated_value) VALUES
        ('Alice', 'Johnson', 'alice@techcorp.com', '+1-555-0201', 'TechCorp Solutions', 'Technology', 'website', 'new', ${teamMembers[0].id}, 50000.00),
        ('Bob', 'Williams', 'bob@retailplus.com', '+1-555-0202', 'RetailPlus Inc', 'Retail', 'referral', 'qualified', ${teamMembers[0].id}, 25000.00),
        ('Carol', 'Davis', 'carol@greenfuture.com', '+1-555-0203', 'Green Future', 'Environment', 'social_media', 'contacted', ${teamMembers[1].id}, 75000.00)
        ON CONFLICT (email) DO NOTHING
      `;
            console.log('✅ Sample leads inserted');
        }

        // Sample content calendar entries
        const projects = await sql`SELECT id, name FROM projects LIMIT 2`;
        const clients = await sql`SELECT id, name FROM clients LIMIT 2`;

        if (projects.length > 0 && clients.length > 0 && teamMembers.length > 0) {
            await sql`
        INSERT INTO content_calendar (title, description, content_type, platform, scheduled_date, project_id, client_id, assigned_to, status) VALUES
        ('Summer Collection Launch Post', 'Instagram post announcing the new summer collection', 'post', 'instagram', CURRENT_DATE + INTERVAL '1 day', ${projects[0].id}, ${clients[0].id}, ${teamMembers[1].id}, 'scheduled'),
        ('Behind the Scenes Video', 'TikTok video showing design process', 'video', 'tiktok', CURRENT_DATE + INTERVAL '2 days', ${projects[0].id}, ${clients[0].id}, ${teamMembers[1].id}, 'draft'),
        ('Client Success Story', 'LinkedIn article about project success', 'article', 'linkedin', CURRENT_DATE + INTERVAL '7 days', ${projects[1].id}, ${clients[1].id}, ${teamMembers[0].id}, 'draft')
      `;
            console.log('✅ Sample content calendar entries inserted');
        }

        console.log('\n🎉 Database enhancement completed successfully!');
        console.log('\nNew modules added:');
        console.log('- Leads management');
        console.log('- Content Calendar');
        console.log('- Reports system');
        console.log('- Enhanced Invoices');
        console.log('\nAll modules are now interconnected through proper relationships!');

    } catch (error) {
        console.error('❌ Database enhancement failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

addMissingTables();
