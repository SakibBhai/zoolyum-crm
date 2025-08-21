require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    await client.release();
    await pool.end();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

testConnection();