// Test the Projects API with a sample project creation
const API_BASE = 'http://localhost:3000/api';

async function testProjectCreation() {
    console.log('🚀 Testing Projects API...\n');

    // Test data for creating a project
    const testProject = {
        name: 'Test Project API',
        description: 'Testing project creation via API',
        client_id: null, // Optional, can be null
        status: 'planning',
        priority: 'medium',
        type: 'development',
        start_date: '2025-01-01',
        end_date: '2025-03-31',
        budget: 10000,
        estimated_budget: 10000,
        progress: 0,
        manager: 'Project Manager',
        created_by: null
    };

    try {
        // Test GET projects first
        console.log('📋 Testing GET /api/projects');
        const getResponse = await fetch(`${API_BASE}/projects`);
        const projects = await getResponse.json();
        console.log(`✅ GET projects: ${getResponse.status} - Found ${Array.isArray(projects) ? projects.length : 'unknown'} projects`);

        // Test POST project creation
        console.log('\n📝 Testing POST /api/projects');
        const postResponse = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testProject)
        });

        const createResult = await postResponse.json();

        if (postResponse.ok) {
            console.log(`✅ POST project: ${postResponse.status} - Project created successfully!`);
            console.log(`   Project ID: ${createResult.id}`);
            console.log(`   Project Name: ${createResult.name}`);
        } else {
            console.log(`❌ POST project: ${postResponse.status} - Failed to create project`);
            console.log(`   Error: ${createResult.error}`);
            if (createResult.details) {
                console.log(`   Details: ${createResult.details}`);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Wait for server to be ready
setTimeout(testProjectCreation, 3000);
