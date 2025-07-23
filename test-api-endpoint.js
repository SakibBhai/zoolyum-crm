// Test the actual Projects API endpoint
const API_BASE = 'http://localhost:3000/api';

async function testProjectsAPI() {
    console.log('🚀 Testing Projects API Endpoint...\n');

    try {
        // Test the GET API endpoint
        console.log('1️⃣ Testing GET /api/projects');
        const response = await fetch(`${API_BASE}/projects`);

        console.log(`   Status: ${response.status}`);
        console.log(`   Status Text: ${response.statusText}`);
        console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Response type: ${typeof data}`);
            console.log(`   ✅ Is array: ${Array.isArray(data)}`);
            console.log(`   ✅ Data length: ${Array.isArray(data) ? data.length : 'N/A'}`);

            if (Array.isArray(data) && data.length > 0) {
                console.log('   ✅ First project:', {
                    id: data[0].id,
                    name: data[0].name,
                    status: data[0].status,
                    type: data[0].type
                });
            }

            // Log the full response for debugging
            console.log('\n   📋 Full API Response:');
            console.log(JSON.stringify(data, null, 2));

        } else {
            const errorText = await response.text();
            console.log(`   ❌ Error response: ${errorText}`);
        }

        // Test with includeActivities parameter
        console.log('\n2️⃣ Testing GET /api/projects?includeActivities=true');
        const response2 = await fetch(`${API_BASE}/projects?includeActivities=true`);
        console.log(`   Status: ${response2.status}`);

        if (response2.ok) {
            const data2 = await response2.json();
            console.log(`   ✅ With activities - Data length: ${Array.isArray(data2) ? data2.length : 'N/A'}`);
        }

    } catch (error) {
        console.error('❌ API Test Error:', error.message);
    }
}

// Wait for server to be ready
setTimeout(testProjectsAPI, 2000);
