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

// Use DATABASE_URL (Prisma standard) with fallback to legacy variable
const databaseUrl = process.env.DATABASE_URL || process.env.NEON_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Database URL not found. Please set one of the following environment variables: ' +
    'DATABASE_URL, NEON_NEON_DATABASE_URL, or NEON_DATABASE_URL'
  );
}

const sql = neon(databaseUrl);

export { sql }
