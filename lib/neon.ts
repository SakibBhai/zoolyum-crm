import { neon } from "@neondatabase/serverless"

// Load environment variables in non-Next.js environments
if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
  } catch (error) {
    // dotenv not available or not needed
  }
}

const databaseUrl = process.env.NEON_NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("NEON_NEON_DATABASE_URL environment variable is not set");
}

const sql = neon(databaseUrl);

export { sql }
