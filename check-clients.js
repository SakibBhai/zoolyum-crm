const { neon } = require('@neondatabase/serverless');
const connectionString = process.env.NEON_NEON_DATABASE_URL;
const sql = neon(connectionString);

async function checkClients() {
  try {
    const clients = await sql`SELECT * FROM clients LIMIT 5`;
    console.log('Available clients:', clients);
  } catch (error) {
    console.error('Error checking clients:', error);
  }
}

checkClients();
