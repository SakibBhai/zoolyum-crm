require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkDatabase() {
    try {
        console.log('Checking current database structure...');

        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

        console.log('Existing tables:', tables.map(t => t.table_name));

        // Check tasks table structure if it exists
        if (tables.some(t => t.table_name === 'tasks')) {
            const tasksCols = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'tasks' AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
            console.log('\nTasks table structure:');
            tasksCols.forEach(col => {
                console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
            });
        }

    } catch (error) {
        console.error('Error checking database:', error.message);
    }
}

checkDatabase();
