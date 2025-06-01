import { neon } from "@neondatabase/serverless"

// Use the correct environment variable that's available
const sql = neon(process.env.NEON_NEON_DATABASE_URL!)

export { sql }
