// Test Projects API GET and POST operations
const API_BASE = 'http://localhost:3000/api';

async function debugProjectsAPI() {
    console.log('🔍 Debugging Projects API Issues...\n');

    try {
        // First, test GET to see current data
        console.log('1️⃣ Testing GET /api/projects');
        const getResponse = await fetch(`${API_BASE}/projects`);
        const getResult = await getResponse.json();

        console.log(`   Status: ${getResponse.status}`);
        console.log(`   Data type: ${typeof getResult}`);
        console.log(`   Is array: ${Array.isArray(getResult)}`);

        if (Array.isArray(getResult)) {
            console.log(`   Projects count: ${getResult.length}`);
            if (getResult.length > 0) {
                console.log('   First project:', JSON.stringify(getResult[0], null, 2));
            }
        } else {
            console.log('   Response:', JSON.stringify(getResult, null, 2));
        }

        // Now test creating a new project
        console.log('\n2️⃣ Testing POST /api/projects');
        const testProject = {
            name: 'Debug Test Project',
            description: 'Testing API data flow',
            status: 'planning',
            priority: 'medium',
            type: 'test',
            budget: 5000,
            estimated_budget: 5000
        };

        const postResponse = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testProject)
        });

        const postResult = await postResponse.json();
        console.log(`   Status: ${postResponse.status}`);
        console.log('   Created project:', JSON.stringify(postResult, null, 2));

        // Test GET again after creation
        console.log('\n3️⃣ Testing GET /api/projects after creation');
        const getResponse2 = await fetch(`${API_BASE}/projects`);
        const getResult2 = await getResponse2.json();

        console.log(`   Status: ${getResponse2.status}`);
        if (Array.isArray(getResult2)) {
            console.log(`   Projects count: ${getResult2.length}`);
            if (getResult2.length > 0) {
                console.log('   Latest project:', JSON.stringify(getResult2[0], null, 2));
            }
        }

    } catch (error) {
        console.error('❌ API Test Error:', error.message);
    }
}

// Wait for server to be ready
setTimeout(debugProjectsAPI, 3000);
