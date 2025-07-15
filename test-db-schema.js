const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseSchema() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Testing database connection...');
    
    // Test clients table schema
    const clientsSchema = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'clients'
      ORDER BY ordinal_position;
    `;
    
    console.log('\nClients table schema:');
    clientsSchema.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Test a simple query
    const clientsCount = await sql`SELECT COUNT(*) as count FROM clients`;
    console.log(`\nTotal clients in database: ${clientsCount[0].count}`);
    
    // Test projects table schema
    const projectsSchema = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `;
    
    console.log('\nProjects table schema:');
    projectsSchema.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\nDatabase connection and schema verification successful!');
    
  } catch (error) {
    console.error('Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabaseSchema();