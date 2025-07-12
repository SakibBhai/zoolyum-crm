require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkSchema() {
  const sql = neon(process.env.NEON_NEON_DATABASE_URL);
  
  try {
    // Check projects table schema
    const projectsSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `;
    
    console.log('Projects table schema:');
    console.log(projectsSchema);
    
    // Check clients table schema
    const clientsSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clients'
      ORDER BY ordinal_position;
    `;
    
    console.log('\nClients table schema:');
    console.log(clientsSchema);
    
    // Check what clients exist
    const clients = await sql`SELECT id, name FROM clients LIMIT 5`;
    console.log('\nExisting clients:');
    console.log(clients);
    
    // Check the project_status enum values
    const statusEnum = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'project_status'
      )
      ORDER BY enumsortorder;
    `;
    
    console.log('\nValid project_status enum values:');
    console.log(statusEnum);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
