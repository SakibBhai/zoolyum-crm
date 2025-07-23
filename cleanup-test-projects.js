require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function cleanupTestProjects() {
    console.log('🧹 Cleaning up test projects from database...\n');

    try {
        // First, let's see what we have
        const allProjects = await sql`SELECT id, name, type, status FROM projects ORDER BY created_at DESC`;
        console.log(`📊 Total projects before cleanup: ${allProjects.length}\n`);

        // Define test project patterns
        const testPatterns = [
            'test', 'debug', 'api', 'fix', 'clean', 'integration', 'system', 'frontend'
        ];

        const testTypes = [
            'test', 'debug', 'fix-test', 'cleanup', 'system-test', 'integration', 'development'
        ];

        const testNames = [
            'Test Project', 'Debug', 'API', 'Fixed API', 'Clean API', 'Frontend Integration',
            'Test Project API', 'Debug Test Project'
        ];

        // Find test projects
        const testProjects = allProjects.filter(project => {
            const nameCheck = testNames.some(pattern =>
                project.name.toLowerCase().includes(pattern.toLowerCase())
            );
            const typeCheck = testTypes.includes(project.type);
            const patternCheck = testPatterns.some(pattern =>
                project.name.toLowerCase().includes(pattern) ||
                project.type.toLowerCase().includes(pattern)
            );

            return nameCheck || typeCheck || patternCheck;
        });

        console.log('🎯 Test projects identified for deletion:');
        testProjects.forEach((project, index) => {
            console.log(`${index + 1}. ${project.name} (${project.type}) - ${project.status}`);
        });

        if (testProjects.length === 0) {
            console.log('\n✅ No test projects found to delete.');
            return;
        }

        console.log(`\n🗑️  Deleting ${testProjects.length} test projects...`);

        // Delete test projects
        for (const project of testProjects) {
            try {
                // Delete project activities first (foreign key constraint)
                await sql`DELETE FROM project_activities WHERE project_id = ${project.id}`;

                // Delete the project
                await sql`DELETE FROM projects WHERE id = ${project.id}`;

                console.log(`   ✅ Deleted: ${project.name}`);
            } catch (error) {
                console.log(`   ❌ Failed to delete ${project.name}: ${error.message}`);
            }
        }

        // Show remaining projects
        const remainingProjects = await sql`SELECT id, name, type, status FROM projects ORDER BY created_at DESC`;

        console.log(`\n📊 Total projects after cleanup: ${remainingProjects.length}`);
        console.log('\n🎉 Remaining projects:');

        if (remainingProjects.length === 0) {
            console.log('   No projects remaining.');
        } else {
            remainingProjects.forEach((project, index) => {
                console.log(`${index + 1}. ${project.name} (${project.type}) - ${project.status}`);
            });
        }

        console.log('\n✅ Cleanup completed successfully!');

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    }
}

cleanupTestProjects().then(() => {
    console.log('\n🎯 Database cleanup finished!');
    process.exit(0);
});
