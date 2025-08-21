require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkProjects() {
  try {
    console.log('🔍 Checking projects in database...');
    
    const projects = await sql`
      SELECT * FROM projects 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    console.log(`Found ${projects.length} projects:`);
    
    if (projects.length > 0) {
      console.log('\nFirst project:');
      console.log(JSON.stringify(projects[0], null, 2));
      
      console.log('\nAll project names and statuses:');
      projects.forEach((p, i) => {
        console.log(`${i + 1}. ${p.name} - Status: ${p.status} - Progress: ${p.progress}%`);
      });
    } else {
      console.log('No projects found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProjects();
