require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkTables() {
    try {
        console.log('Clients table columns:');
        const clientCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'clients' ORDER BY ordinal_position`;
        clientCols.forEach(col => console.log('  ' + col.column_name));

        console.log('\nProjects table columns:');
        const projectCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' ORDER BY ordinal_position`;
        projectCols.forEach(col => console.log('  ' + col.column_name));

        console.log('\nTeam_members table columns:');
        const teamCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'team_members' ORDER BY ordinal_position`;
        teamCols.forEach(col => console.log('  ' + col.column_name));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTables();
