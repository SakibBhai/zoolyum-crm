import { sql } from './neon';

/**
 * Test database connection and return connection status
 */
export async function testDatabaseConnection() {
  try {
    const result = await sql`SELECT version()`;
    return {
      success: true,
      version: result[0].version,
      message: 'Database connection successful'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    };
  }
}

/**
 * Get list of tables in the database
 */
export async function getDatabaseTables() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    return tables.map(table => table.table_name);
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
}

/**
 * Get basic database info
 */
export async function getDatabaseInfo() {
  try {
    const connectionTest = await testDatabaseConnection();
    const tables = await getDatabaseTables();
    
    return {
      ...connectionTest,
      tables,
      tableCount: tables.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get database info'
    };
  }
}
