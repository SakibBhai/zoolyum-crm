import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
}

const sql = neon(process.env.DATABASE_URL)

// GET /api/finance - Get financial analytics and reports
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const reportType = searchParams.get('type') || 'overview'
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const clientId = searchParams.get('client_id')
        const projectId = searchParams.get('project_id')

        let dateFilter = ''
        let clientFilter = ''
        let projectFilter = ''

        if (startDate && endDate) {
            dateFilter = `AND transaction_date BETWEEN '${startDate}' AND '${endDate}'`
        }
        if (clientId) {
            clientFilter = `AND client_id = '${clientId}'`
        }
        if (projectId) {
            projectFilter = `AND project_id = '${projectId}'`
        }

        switch (reportType) {
            case 'overview':
                // Financial overview with income, expenses, and profit
                const overview = await sql`
          SELECT 
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
            SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_profit,
            COUNT(CASE WHEN type = 'income' THEN 1 END) as income_transactions,
            COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_transactions,
            COUNT(*) as total_transactions
          FROM transactions
          WHERE status = 'completed' ${sql.unsafe(dateFilter)} ${sql.unsafe(clientFilter)} ${sql.unsafe(projectFilter)}
        `

                const monthlyTrends = await sql`
          SELECT 
            DATE_TRUNC('month', transaction_date) as month,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as monthly_income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as monthly_expenses,
            SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as monthly_profit
          FROM transactions
          WHERE status = 'completed' ${sql.unsafe(dateFilter)} ${sql.unsafe(clientFilter)} ${sql.unsafe(projectFilter)}
          GROUP BY DATE_TRUNC('month', transaction_date)
          ORDER BY month DESC
          LIMIT 12
        `

                return NextResponse.json({
                    overview: overview[0],
                    monthly_trends: monthlyTrends
                })

            case 'client_revenue':
                // Revenue by client
                const clientRevenue = await sql`
          SELECT 
            c.id,
            c.name as client_name,
            SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_revenue,
            COUNT(CASE WHEN t.type = 'income' THEN 1 END) as invoice_count,
            AVG(CASE WHEN t.type = 'income' THEN t.amount END) as avg_invoice_amount,
            MAX(t.transaction_date) as last_payment_date
          FROM clients c
          LEFT JOIN transactions t ON c.id = t.client_id
          WHERE (t.status = 'completed' OR t.status IS NULL) ${sql.unsafe(dateFilter)}
          GROUP BY c.id, c.name
          ORDER BY total_revenue DESC NULLS LAST
        `

                return NextResponse.json({ client_revenue: clientRevenue })

            case 'project_profitability':
                // Profitability by project
                const projectProfitability = await sql`
          SELECT 
            p.id,
            p.name as project_name,
            p.estimated_budget,
            p.actual_budget,
            c.name as client_name,
            SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as project_revenue,
            SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as project_expenses,
            SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as project_profit,
            (SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) / NULLIF(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) * 100) as profit_margin
          FROM projects p
          LEFT JOIN clients c ON p.client_id = c.id
          LEFT JOIN transactions t ON p.id = t.project_id
          WHERE (t.status = 'completed' OR t.status IS NULL) ${sql.unsafe(dateFilter)}
          GROUP BY p.id, p.name, p.estimated_budget, p.actual_budget, c.name
          ORDER BY project_profit DESC NULLS LAST
        `

                return NextResponse.json({ project_profitability: projectProfitability })

            case 'cash_flow':
                // Cash flow analysis
                const cashFlow = await sql`
          SELECT 
            transaction_date as date,
            type,
            amount,
            description,
            category,
            c.name as client_name,
            p.name as project_name,
            SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) OVER (ORDER BY transaction_date, created_at) as running_balance
          FROM transactions t
          LEFT JOIN clients c ON t.client_id = c.id
          LEFT JOIN projects p ON t.project_id = p.id
          WHERE status = 'completed' ${sql.unsafe(dateFilter)} ${sql.unsafe(clientFilter)} ${sql.unsafe(projectFilter)}
          ORDER BY transaction_date DESC, created_at DESC
          LIMIT 100
        `

                return NextResponse.json({ cash_flow: cashFlow })

            case 'expense_categories':
                // Expenses by category
                const expenseCategories = await sql`
          SELECT 
            category,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count,
            AVG(amount) as avg_amount
          FROM transactions
          WHERE type = 'expense' AND status = 'completed' ${sql.unsafe(dateFilter)} ${sql.unsafe(clientFilter)} ${sql.unsafe(projectFilter)}
          GROUP BY category
          ORDER BY total_amount DESC
        `

                return NextResponse.json({ expense_categories: expenseCategories })

            case 'outstanding_invoices':
                // Outstanding invoices analysis
                const outstandingInvoices = await sql`
          SELECT 
            i.id,
            i.invoice_number,
            i.client_name,
            i.total_amount,
            i.amount_due,
            i.due_date,
            i.status,
            CASE 
              WHEN i.due_date < CURRENT_DATE THEN 'overdue'
              WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
              ELSE 'current'
            END as urgency,
            DATE_PART('day', CURRENT_DATE - i.due_date) as days_overdue
          FROM invoices i
          WHERE i.status IN ('sent', 'viewed', 'overdue') 
          AND i.amount_due > 0
          ORDER BY i.due_date ASC
        `

                const outstandingSummary = await sql`
          SELECT 
            SUM(amount_due) as total_outstanding,
            COUNT(*) as total_invoices,
            SUM(CASE WHEN due_date < CURRENT_DATE THEN amount_due ELSE 0 END) as overdue_amount,
            COUNT(CASE WHEN due_date < CURRENT_DATE THEN 1 END) as overdue_count
          FROM invoices
          WHERE status IN ('sent', 'viewed', 'overdue') AND amount_due > 0
        `

                return NextResponse.json({
                    outstanding_invoices: outstandingInvoices,
                    summary: outstandingSummary[0]
                })

            default:
                return NextResponse.json(
                    { error: 'Invalid report type' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('Error generating financial report:', error)
        return NextResponse.json(
            { error: 'Failed to generate financial report' },
            { status: 500 }
        )
    }
}
