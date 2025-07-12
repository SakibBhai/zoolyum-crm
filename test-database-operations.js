import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.NEON_NEON_DATABASE_URL);

async function testDatabaseOperations() {
  console.log('🔍 Testing Database Operations...\n');

  try {
    // Test 1: Fetch all clients
    console.log('📋 Testing Clients...');
    const clients = await sql`SELECT * FROM clients ORDER BY created_at DESC LIMIT 3`;
    console.log(`✅ Clients fetched: ${clients.length} records`);
    
    // Test 2: Fetch all projects
    console.log('\n📋 Testing Projects...');
    const projects = await sql`SELECT * FROM projects ORDER BY created_at DESC LIMIT 3`;
    console.log(`✅ Projects fetched: ${projects.length} records`);
    
    // Test 3: Fetch all tasks
    console.log('\n📋 Testing Tasks...');
    const tasks = await sql`SELECT * FROM tasks ORDER BY created_at DESC LIMIT 3`;
    console.log(`✅ Tasks fetched: ${tasks.length} records`);
    
    // Test 4: Fetch all team members
    console.log('\n📋 Testing Team Members...');
    const teamMembers = await sql`SELECT * FROM team_members WHERE is_active = true ORDER BY created_at DESC LIMIT 3`;
    console.log(`✅ Team members fetched: ${teamMembers.length} records`);
    
    // Test 5: Fetch all invoices
    console.log('\n📋 Testing Invoices...');
    const invoices = await sql`SELECT * FROM invoices ORDER BY created_at DESC LIMIT 3`;
    console.log(`✅ Invoices fetched: ${invoices.length} records`);
    
    console.log('\n🎉 All database operations are working correctly!');
    
    // Show some sample data
    if (clients.length > 0) {
      console.log('\n📋 Sample Client:');
      console.log(`  - ${clients[0].name} (${clients[0].email || 'No email'})`);
    }
    
    if (projects.length > 0) {
      console.log('\n📋 Sample Project:');
      console.log(`  - ${projects[0].name} (Status: ${projects[0].status})`);
    }
    
    if (tasks.length > 0) {
      console.log('\n📋 Sample Task:');
      console.log(`  - ${tasks[0].title} (Priority: ${tasks[0].priority})`);
    }

  } catch (error) {
    console.error('❌ Database operation failed:', error);
  }
}

testDatabaseOperations();
