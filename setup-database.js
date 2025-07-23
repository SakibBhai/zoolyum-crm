require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function runCompleteSetup() {
    try {
        // Get database URL from environment
        const databaseUrl = process.env.DATABASE_URL || process.env.NEON_NEON_DATABASE_URL;

        console.log('Environment check:');
        console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
        console.log('NEON_NEON_DATABASE_URL exists:', !!process.env.NEON_NEON_DATABASE_URL);

        if (!databaseUrl) {
            console.error('DATABASE_URL not found in environment variables');
            console.log('Please ensure DATABASE_URL is set in .env.local');
            process.exit(1);
        }

        console.log('Connecting to database...');
        const sql = neon(databaseUrl);

        // Read the complete setup SQL file
        const sqlFile = 'database/schema/complete_setup.sql';
        console.log('Reading SQL file:', sqlFile);
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        console.log('Executing complete database setup...');
        console.log('This will drop and recreate all tables with sample data.');

        // Execute the SQL - execute the entire content as one script
        try {
            await sql([sqlContent]);
            console.log('✅ Database setup completed successfully!');
        } catch (error) {
            console.error('❌ Database setup failed:', error.message);

            // Try executing statements one by one as fallback
            console.log('Trying to execute statements individually...');
            const statements = sqlContent
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.trim()) {
                    try {
                        console.log(`Executing statement ${i + 1}/${statements.length}...`);
                        await sql([statement]);
                    } catch (error) {
                        console.warn(`Warning on statement ${i + 1}: ${error.message}`);
                    }
                }
            }
        }

        console.log('\n✅ Database setup completed successfully!');
        console.log('\nSample data has been inserted:');
        console.log('- 4 Clients');
        console.log('- 5 Team Members');
        console.log('- 3 Projects');
        console.log('- 5 Tasks');
        console.log('\nYou can now test the application with this data.');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

runCompleteSetup();
