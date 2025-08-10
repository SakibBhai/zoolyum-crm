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
let databaseUrl = process.env.DATABASE_URL || process.env.NEON_NEON_DATABASE_URL || process.env.NEON_DATABASE_URL;

// During build time, if no database URL is found, use a placeholder to prevent build failures
// This allows the build to complete while still requiring proper env vars at runtime
if (!databaseUrl) {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    // In production, we must have a database URL
    throw new Error(
      'Database URL not found. Please set one of the following environment variables in Vercel: ' +
      'DATABASE_URL, NEON_NEON_DATABASE_URL, or NEON_DATABASE_URL'
    );
  } else if (process.env.CI || process.env.VERCEL) {
    // During build time on Vercel, use a placeholder URL to prevent build failures
    console.warn('Warning: No database URL found during build. Using placeholder.');
    databaseUrl = 'postgresql://placeholder:placeholder@placeholder:5432/placeholder';
  } else {
    throw new Error(
      'Database URL not found. Please set one of the following environment variables: ' +
      'DATABASE_URL, NEON_NEON_DATABASE_URL, or NEON_DATABASE_URL'
    );
  }
}

// Remove channel_binding parameter that causes issues with @neondatabase/serverless
databaseUrl = databaseUrl.replace(/[&?]channel_binding=require/g, '');

const sql = neon(databaseUrl);

export { sql }
