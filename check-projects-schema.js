require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkProjectsTable() {
    try {
        const cols = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
        console.log('Projects table columns:');
        cols.forEach(col => console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkProjectsTable();
