require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function runMigration(filename) {
  try {
    console.log(`Running migration: ${filename}`)
    const migrationPath = path.join(__dirname, '..', 'database', filename)
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement)
      }
    }
    
    console.log(`✅ Migration ${filename} completed successfully`)
  } catch (error) {
    console.error(`❌ Error running migration ${filename}:`, error.message)
    throw error
  }
}

async function main() {
  try {
    console.log('Starting database migrations...')
    
    // Run migrations in order
    await runMigration('recurring_tasks.sql')
    await runMigration('budget_management.sql')
    
    console.log('🎉 All migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()