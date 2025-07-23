require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkProjectsData() {
    try {
        console.log('🔍 Checking projects in database...\n');

        // Check raw data in projects table
        const rawProjects = await sql`
      SELECT * FROM projects 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

        console.log(`📊 Raw projects in database: ${rawProjects.length}`);
        if (rawProjects.length > 0) {
            console.log('Latest project:', {
                id: rawProjects[0].id,
                name: rawProjects[0].name,
                status: rawProjects[0].status,
                client_id: rawProjects[0].client_id,
                created_at: rawProjects[0].created_at
            });
        }

        // Check what the GET API query returns
        console.log('\n🔄 Testing GET API query...');
        const apiQuery = await sql`
      SELECT 
        p.*,
        c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      ORDER BY p.created_at DESC
    `;

        console.log(`📈 API query results: ${apiQuery.length}`);
        if (apiQuery.length > 0) {
            console.log('First result from API query:', {
                id: apiQuery[0].id,
                name: apiQuery[0].name,
                client_name: apiQuery[0].client_name,
                status: apiQuery[0].status
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkProjectsData();
