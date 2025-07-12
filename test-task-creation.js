require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function testTaskCreation() {
  const sql = neon(process.env.NEON_NEON_DATABASE_URL);
  
  try {
    // First check if we have any projects to link to
    const projects = await sql`SELECT id, name FROM projects LIMIT 3`;
    console.log('Available projects:', projects);
    
    // Create a test task
    const testTask = {
      title: 'Test Task',
      description: 'This is a test task',
      project_id: projects[0]?.id || null,
      assigned_to: null,
      priority: 'medium',
      status: 'backlog',
      due_date: new Date().toISOString(),
      estimated_hours: 5,
      is_content_related: false,
      dependencies: []
    };
    
    console.log('Creating task with data:', testTask);
    
    const [newTask] = await sql`
      INSERT INTO tasks (
        title, description, project_id, assigned_to, priority, 
        status, due_date, estimated_hours, is_content_related, dependencies
      )
      VALUES (
        ${testTask.title},
        ${testTask.description || ''},
        ${testTask.project_id},
        ${testTask.assigned_to},
        ${testTask.priority || 'medium'},
        ${testTask.status || 'backlog'},
        ${testTask.due_date},
        ${testTask.estimated_hours || null},
        ${testTask.is_content_related || false},
        ${testTask.dependencies || []}
      )
      RETURNING *
    `;
    
    console.log('Successfully created task:', newTask);
    
    // Check total tasks now
    const taskCount = await sql`SELECT COUNT(*) as count FROM tasks`;
    console.log('Total tasks in database:', taskCount[0].count);
    
  } catch (error) {
    console.error('Error testing task creation:', error);
  }
}

testTaskCreation();
