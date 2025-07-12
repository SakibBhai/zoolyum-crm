import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.NEON_NEON_DATABASE_URL;

if (!databaseUrl) {
  console.error("NEON_NEON_DATABASE_URL environment variable is not set");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function testConnection() {
  try {
    console.log("Testing database connection...");
    
    // Test basic connection
    const result = await sql`SELECT version()`;
    console.log("✅ Database connection successful!");
    console.log("PostgreSQL version:", result[0].version);
    
    // Test listing tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log("\n📋 Available tables:");
    if (tables.length === 0) {
      console.log("  No tables found in the public schema");
    } else {
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();
