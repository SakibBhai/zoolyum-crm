require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function checkTransactions() {
    try {
        const cols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
        console.log('Transactions table columns:');
        cols.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));

        const invoiceCols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
        console.log('\nInvoices table columns:');
        invoiceCols.forEach(col => console.log(`  ${col.column_name}: ${col.data_type}`));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTransactions();
