require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function createProjectActivitiesTable() {
    try {
        console.log('🔧 Creating project_activities table...');

        await sql`
      CREATE TABLE IF NOT EXISTS project_activities (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        user_id UUID,
        user_name VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

        console.log('✅ project_activities table created successfully!');

        // Create indexes for better performance
        await sql`
      CREATE INDEX IF NOT EXISTS idx_project_activities_project_id 
      ON project_activities(project_id);
    `;

        await sql`
      CREATE INDEX IF NOT EXISTS idx_project_activities_timestamp 
      ON project_activities(timestamp DESC);
    `;

        console.log('✅ Indexes created successfully!');

        // Test the table
        console.log('🧪 Testing table creation...');
        const testQuery = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'project_activities'
      ORDER BY ordinal_position;
    `;

        console.log('✅ Table structure:', testQuery);

    } catch (error) {
        console.error('❌ Error creating project_activities table:', error);
    }
}

createProjectActivitiesTable().then(() => {
    console.log('🎉 Database setup complete!');
    process.exit(0);
});
