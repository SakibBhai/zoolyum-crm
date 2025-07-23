require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkTasksSchema() {
  const sql = neon(process.env.NEON_NEON_DATABASE_URL);

  try {
    // Check tasks table schema
    const tasksSchema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks'
      ORDER BY ordinal_position;
    `;

    console.log('Tasks table schema:');
    console.log(tasksSchema);

    // Check if we have any tasks
    const taskCount = await sql`SELECT COUNT(*) as count FROM tasks`;
    console.log('\nNumber of tasks in database:', taskCount[0].count);

    // Check recent tasks
    const recentTasks = await sql`SELECT * FROM tasks ORDER BY created_at DESC LIMIT 3`;
    console.log('\nRecent tasks:');
    console.log(recentTasks);

    // Check enum values for task_status
    const taskStatusEnum = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'task_status'
      )
      ORDER BY enumsortorder;
    `;

    console.log('\nValid task_status enum values:');
    console.log(taskStatusEnum);

    // Check enum values for task_priority
    const taskPriorityEnum = await sql`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'task_priority'
      )
      ORDER BY enumsortorder;
    `;

    console.log('\nValid task_priority enum values:');
    console.log(taskPriorityEnum);

  } catch (error) {
    console.error('Error checking tasks schema:', error);
  }
}

checkTasksSchema();
