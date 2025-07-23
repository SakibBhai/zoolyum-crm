require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function createBasicTables() {
    try {
        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            console.error('DATABASE_URL not found in environment variables');
            process.exit(1);
        }

        console.log('Connecting to database...');
        const sql = neon(databaseUrl);

        console.log('Creating basic tables...');

        // 1. Create clients table
        await sql`DROP TABLE IF EXISTS clients CASCADE`;
        await sql`
      CREATE TABLE clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(255),
        contact_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        website VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        contract_value DECIMAL(12,2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log('✅ Clients table created');

        // 2. Create team_members table
        await sql`DROP TABLE IF EXISTS team_members CASCADE`;
        await sql`
      CREATE TABLE team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        bio TEXT DEFAULT '',
        skills JSONB DEFAULT '[]'::jsonb,
        avatar VARCHAR(500) DEFAULT '/placeholder-user.jpg',
        employee_id VARCHAR(50) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log('✅ Team members table created');

        // 3. Create projects table
        await sql`DROP TABLE IF EXISTS projects CASCADE`;
        await sql`
      CREATE TABLE projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'planning',
        priority VARCHAR(20) DEFAULT 'medium',
        type VARCHAR(100) DEFAULT 'General',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(12, 2) DEFAULT 0,
        estimated_budget DECIMAL(12, 2) DEFAULT 0,
        actual_budget DECIMAL(12, 2) DEFAULT 0,
        progress INTEGER DEFAULT 0,
        manager VARCHAR(255),
        created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
        tasks_total INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log('✅ Projects table created');

        // 4. Create tasks table
        await sql`DROP TABLE IF EXISTS tasks CASCADE`;
        await sql`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
        priority VARCHAR(10) NOT NULL DEFAULT 'medium',
        status VARCHAR(20) NOT NULL DEFAULT 'todo',
        due_date TIMESTAMP WITH TIME ZONE,
        estimated_hours DECIMAL(5,2),
        actual_hours DECIMAL(5,2),
        is_content_related BOOLEAN DEFAULT FALSE,
        dependencies JSONB DEFAULT '[]'::jsonb,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log('✅ Tasks table created');

        // 5. Insert sample data
        console.log('Inserting sample data...');

        // Sample clients
        await sql`
      INSERT INTO clients (name, industry, contact_name, email, phone, status) VALUES
      ('ABC Apparel', 'Fashion & Retail', 'Emily Rodriguez', 'emily@abcapparel.com', '+1-555-0123', 'active'),
      ('TechStart Inc.', 'Technology', 'David Kim', 'david@techstart.com', '+1-555-0124', 'active'),
      ('Green Energy Co.', 'Renewable Energy', 'Lisa Chen', 'lisa@greenenergy.com', '+1-555-0125', 'active')
    `;
        console.log('✅ Sample clients inserted');

        // Sample team members
        await sql`
      INSERT INTO team_members (name, email, role, department, employee_id) VALUES
      ('John Doe', 'john.doe@company.com', 'Project Manager', 'Management', 'EMP001'),
      ('Jane Smith', 'jane.smith@company.com', 'Senior Developer', 'Development', 'EMP002'),
      ('Mike Johnson', 'mike.johnson@company.com', 'UI/UX Designer', 'Design', 'EMP003'),
      ('Sarah Wilson', 'sarah.wilson@company.com', 'Marketing Specialist', 'Marketing', 'EMP004')
    `;
        console.log('✅ Sample team members inserted');

        // Sample projects
        const clients = await sql`SELECT id, name FROM clients LIMIT 3`;
        const teamMembers = await sql`SELECT id, name FROM team_members LIMIT 4`;

        const client1 = clients[0];
        const client2 = clients[1];
        const tm1 = teamMembers[0];
        const tm2 = teamMembers[1];

        await sql`
      INSERT INTO projects (name, description, client_id, status, priority, type, start_date, end_date, estimated_budget, manager, created_by) VALUES
      ('Summer Collection Campaign', 'A comprehensive social media campaign for ABC Apparel summer collection', ${client1.id}, 'active', 'high', 'Social Media Management', '2024-04-01', '2024-08-31', 15000.00, 'Sarah Wilson', ${tm1.id}),
      ('Website Redesign', 'Complete redesign of the ABC Apparel website', ${client1.id}, 'active', 'medium', 'Website Design', '2024-03-15', '2024-06-30', 25000.00, 'John Doe', ${tm1.id}),
      ('Mobile App Development', 'Develop a mobile app for TechStart Inc.', ${client2.id}, 'planning', 'high', 'Mobile Development', '2024-05-01', '2024-12-31', 50000.00, 'Jane Smith', ${tm2.id})
    `;
        console.log('✅ Sample projects inserted');

        // Sample tasks
        const projects = await sql`SELECT id, name FROM projects LIMIT 3`;
        const proj1 = projects[0];
        const proj2 = projects[1];

        await sql`
      INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date, estimated_hours) VALUES
      ('Setup project structure', 'Initialize the project structure and basic configuration', ${proj2.id}, ${tm2.id}, 'high', 'in_progress', NOW() + INTERVAL '7 days', 8.0),
      ('Design homepage mockup', 'Create initial homepage design mockup', ${proj2.id}, ${teamMembers[2].id}, 'medium', 'todo', NOW() + INTERVAL '10 days', 12.0),
      ('Content strategy planning', 'Develop content strategy for social media campaign', ${proj1.id}, ${teamMembers[3].id}, 'high', 'in_progress', NOW() + INTERVAL '5 days', 16.0),
      ('App architecture design', 'Design the overall architecture for the mobile app', ${projects[2].id}, ${tm2.id}, 'high', 'todo', NOW() + INTERVAL '14 days', 20.0)
    `;
        console.log('✅ Sample tasks inserted');

        console.log('\n🎉 Database setup completed successfully!');
        console.log('\nSample data inserted:');
        console.log('- 3 Clients');
        console.log('- 4 Team Members');
        console.log('- 3 Projects');
        console.log('- 4 Tasks');
        console.log('\nYou can now test the application!');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

createBasicTables();
