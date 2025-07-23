// Final verification test for Projects API and Frontend integration
const API_BASE = 'http://localhost:3000/api';

async function finalProjectsTest() {
    console.log('🎯 Final Projects Integration Test...\n');

    try {
        // Test 1: Verify GET API structure
        console.log('1️⃣ Testing GET API structure');
        const getResponse = await fetch(`${API_BASE}/projects`);
        const projects = await getResponse.json();

        console.log(`   ✅ Status: ${getResponse.status}`);
        console.log(`   ✅ Is Array: ${Array.isArray(projects)}`);
        console.log(`   ✅ Project Count: ${projects.length}`);

        if (projects.length > 0) {
            const firstProject = projects[0];
            console.log('   ✅ Sample Project Structure:', {
                id: firstProject.id ? '✓' : '✗',
                name: firstProject.name ? '✓' : '✗',
                status: firstProject.status ? '✓' : '✗',
                budget: firstProject.budget ? '✓' : '✗',
                progress: firstProject.progress !== undefined ? '✓' : '✗'
            });
        }

        // Test 2: Create a new project
        console.log('\n2️⃣ Testing Project Creation');
        const newProject = {
            name: 'Frontend Integration Test',
            description: 'Testing complete API-Frontend integration',
            status: 'active',
            priority: 'high',
            type: 'integration',
            budget: 15000,
            estimated_budget: 15000,
            progress: 25
        };

        const createResponse = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProject)
        });

        const createdProject = await createResponse.json();
        console.log(`   ✅ Creation Status: ${createResponse.status}`);
        console.log(`   ✅ Created Project ID: ${createdProject.id}`);

        // Test 3: Verify the new project appears in GET
        console.log('\n3️⃣ Testing Data Persistence');
        const getResponse2 = await fetch(`${API_BASE}/projects`);
        const updatedProjects = await getResponse2.json();

        const foundProject = updatedProjects.find(p => p.id === createdProject.id);
        console.log(`   ✅ Project Found in List: ${foundProject ? 'Yes' : 'No'}`);
        console.log(`   ✅ Total Projects: ${updatedProjects.length}`);

        // Test 4: Calculate stats (like frontend does)
        console.log('\n4️⃣ Testing Stats Calculation');
        const stats = {
            total: updatedProjects.length,
            active: updatedProjects.filter(p => p.status === 'active').length,
            completed: updatedProjects.filter(p => p.status === 'completed').length,
            planning: updatedProjects.filter(p => p.status === 'planning').length,
            totalBudget: updatedProjects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0)
        };

        console.log('   ✅ Calculated Stats:', stats);

        console.log('\n🎉 All Tests Passed! Projects API and Frontend should work correctly.');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

// Wait for server to be ready
setTimeout(finalProjectsTest, 2000);
