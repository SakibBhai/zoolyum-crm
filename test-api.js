// Simple test to check if the task API is working
const testTaskAPI = async () => {
  const testTask = {
    title: 'API Test Task',
    description: 'Testing the API directly',
    project_id: '44e1f4b6-4a89-4290-a7dd-8732b319fbe0', // Use a valid project ID
    assigned_to: null,
    priority: 'medium',
    status: 'backlog',
    due_date: new Date().toISOString(),
    estimated_hours: null,
    is_content_related: false,
    dependencies: []
  };

  try {
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTask)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Success:', result);
    } else {
      const error = await response.json();
      console.error('Error:', error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

testTaskAPI();
