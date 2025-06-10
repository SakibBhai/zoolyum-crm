import { Pool } from 'pg'

// Create a connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// Generic query helper function
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return { rows: result.rows }
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  } finally {
    client.release()
  }
}

// Export the pool for direct access if needed
export { pool }