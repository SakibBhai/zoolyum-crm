require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testProjectsFetch() {
    console.log('🔍 Testing Projects Database Fetch...\n');

    try {
        // Test 1: Direct database query
        console.log('1️⃣ Testing direct database query');
        const directQuery = await sql`
      SELECT 
        p.*,
        c.name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `;

        console.log(`   ✅ Direct query result count: ${directQuery.length}`);
        if (directQuery.length > 0) {
            console.log('   ✅ Sample project from direct query:', {
                id: directQuery[0].id,
                name: directQuery[0].name,
                status: directQuery[0].status,
                client_name: directQuery[0].client_name
            });
        }

        // Test 2: Raw projects table
        console.log('\n2️⃣ Testing raw projects table');
        const rawProjects = await sql`
      SELECT COUNT(*) as total, 
             MAX(created_at) as latest_created
      FROM projects
    `;

        console.log('   ✅ Projects table stats:', rawProjects[0]);

        // Test 3: Recent projects
        console.log('\n3️⃣ Testing recent projects');
        const recentProjects = await sql`
      SELECT id, name, status, created_at
      FROM projects 
      ORDER BY created_at DESC 
      LIMIT 3
    `;

        console.log('   ✅ Recent projects:');
        recentProjects.forEach((project, index) => {
            console.log(`      ${index + 1}. ${project.name} (${project.status}) - ${project.created_at}`);
        });

        // Test 4: Simulate the projectsService.getAll() transformation
        console.log('\n4️⃣ Testing data transformation');
        const transformedProjects = directQuery.map(project => ({
            id: project.id,
            name: project.name,
            client: project.client_name || 'Unknown Client',
            clientId: project.client_id,
            startDate: project.start_date,
            deadline: project.end_date,
            manager: project.manager || 'Unknown Manager',
            managerId: project.created_by || '',
            type: project.type || 'General',
            progress: project.progress || 0,
            status: project.status || 'draft',
            priority: project.priority || 'medium'
        }));

        console.log(`   ✅ Transformed projects count: ${transformedProjects.length}`);
        if (transformedProjects.length > 0) {
            console.log('   ✅ Sample transformed project:', transformedProjects[0]);
        }

    } catch (error) {
        console.error('❌ Database test error:', error.message);
        console.error('Full error:', error);
    }
}

testProjectsFetch();
