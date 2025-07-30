const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function checkTransactionsSchema() {
  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `;
    console.log('Transactions table columns:');
    columns.forEach(col => console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable})`));
    
    // Also check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transactions'
      )
    `;
    console.log('\nTable exists:', tableExists[0].exists);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkTransactionsSchema();
