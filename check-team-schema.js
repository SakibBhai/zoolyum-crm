require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkTeamMembersSchema() {
  const sql = neon(process.env.NEON_NEON_DATABASE_URL);

  try {
    // Check team_members table schema
    const schema = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'team_members'
      ORDER BY ordinal_position;
    `;

    console.log('Team members table schema:');
    console.log(schema);

    // Check if we have any team members
    const count = await sql`SELECT COUNT(*) as count FROM team_members`;
    console.log('\nNumber of team members in database:', count[0].count);

  } catch (error) {
    console.error('Error checking team members schema:', error);
  }
}

checkTeamMembersSchema();
