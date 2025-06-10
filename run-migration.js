const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function runMigration() {
  try {
    // Get database URL from environment
    const databaseUrl = process.env.NEON_NEON_DATABASE_URL || process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      console.error('Database URL not found in environment variables');
      console.log('Please ensure NEON_NEON_DATABASE_URL or DATABASE_URL is set in .env.local');
      process.exit(1);
    }

    const sql = neon(databaseUrl);
    
    // Read the SQL file
    const sqlFile = 'ALTER TABLE team_members ADD COLUMN IF N.sql';
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('Executing SQL:', sqlContent.trim());
    
    // Execute the SQL
    const result = await sql(sqlContent);
    
    console.log('Migration completed successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();