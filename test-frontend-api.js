require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function testFrontendAPI() {
  try {
    console.log('🔍 Testing frontend API call to /api/projects...');
    
    const response = await fetch('http://localhost:3002/api/projects');
    const data = await response.json();
    
    console.log(`\n📊 API Response Status: ${response.status}`);
    console.log(`📊 Projects returned: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\n🎯 First project from API:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('\n📋 All project names from API:');
      data.forEach((project, index) => {
        console.log(`${index + 1}. ${project.name} (${project.status}) - Client: ${project.client_name || 'No client'}`);
      });
    } else {
      console.log('\n❌ No projects returned from API');
    }
    
  } catch (error) {
    console.error('❌ Error testing frontend API:', error.message);
  }
}

testFrontendAPI();