const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function checkTaskSchema() {
  try {
    console.log('Checking task table schema...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      ORDER BY ordinal_position
    `;
    
    console.log('Task table columns:');
    columns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Also check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tasks'
      )
    `;
    
    console.log('\nTable exists:', tableExists[0].exists);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkTaskSchema();