const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testClientOperations() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Testing client operations with new schema...');
    
    // Test creating a client with new schema
    const newClient = await sql`
      INSERT INTO clients (name, industry, contact_name, email, phone, status, notes)
      VALUES ('Test Company', 'Technology', 'John Doe', 'john@test.com', '555-1234', 'active', 'Test client notes')
      RETURNING *
    `;
    
    console.log('✅ Created client:', {
      id: newClient[0].id,
      name: newClient[0].name,
      industry: newClient[0].industry,
      contact_name: newClient[0].contact_name,
      email: newClient[0].email,
      status: newClient[0].status,
      notes: newClient[0].notes
    });
    
    // Test reading the client
    const clients = await sql`
      SELECT id, name, industry, contact_name, email, phone, status, notes, created_at, updated_at
      FROM clients
      WHERE id = ${newClient[0].id}
    `;
    
    console.log('✅ Retrieved client:', clients[0]);
    
    // Test updating the client
    const updatedClient = await sql`
      UPDATE clients 
      SET industry = 'Software Development', contact_name = 'Jane Smith', notes = 'Updated notes'
      WHERE id = ${newClient[0].id}
      RETURNING *
    `;
    
    console.log('✅ Updated client:', {
      industry: updatedClient[0].industry,
      contact_name: updatedClient[0].contact_name,
      notes: updatedClient[0].notes
    });
    
    // Test creating a project for this client
    const newProject = await sql`
      INSERT INTO projects (name, description, client_id, status, budget, start_date)
      VALUES ('Test Project', 'A test project', ${newClient[0].id}, 'planning', 5000.00, '2024-01-15')
      RETURNING *
    `;
    
    console.log('✅ Created project:', {
      id: newProject[0].id,
      name: newProject[0].name,
      client_id: newProject[0].client_id,
      status: newProject[0].status,
      budget: newProject[0].budget
    });
    
    // Test querying projects with client data
    const projectsWithClients = await sql`
      SELECT 
        p.id, p.name as project_name, p.status as project_status,
        c.name as client_name, c.industry, c.contact_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ${newProject[0].id}
    `;
    
    console.log('✅ Project with client data:', projectsWithClients[0]);
    
    // Clean up test data
    await sql`DELETE FROM projects WHERE id = ${newProject[0].id}`;
    await sql`DELETE FROM clients WHERE id = ${newClient[0].id}`;
    
    console.log('✅ Test data cleaned up');
    console.log('\n🎉 All client operations working correctly with new schema!');
    
  } catch (error) {
    console.error('❌ Client operations test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testClientOperations();