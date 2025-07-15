import { NextRequest, NextResponse } from 'next/server'
import { transactionsService } from '@/lib/neon-db'

// GET /api/transactions/summary - Get financial summary and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      clientId: searchParams.get('clientId') || undefined
    }
    
    // Get financial summary
    const summary = await transactionsService.getFinancialSummary(params)
    
    // Get monthly totals for the current year
    const currentYear = new Date().getFullYear()
    const monthlyTotals = await transactionsService.getMonthlyTotals(currentYear)
    
    // Get categories breakdown
    const incomeCategories = await transactionsService.getCategories('income')
    const expenseCategories = await transactionsService.getCategories('expense')
    
    // Calculate additional metrics
    const totalIncome = parseFloat(summary.total_income?.toString() || '0')
    const totalExpenses = parseFloat(summary.total_expenses?.toString() || '0')
    const netAmount = totalIncome - totalExpenses
    const profitMargin = totalIncome > 0 ? ((netAmount / totalIncome) * 100) : 0
    
    // Calculate monthly averages
    const monthlyIncomeAvg = monthlyTotals.length > 0 
      ? monthlyTotals.reduce((sum, month) => sum + parseFloat(month.total_income?.toString() || '0'), 0) / monthlyTotals.length
      : 0
    
    const monthlyExpensesAvg = monthlyTotals.length > 0
      ? monthlyTotals.reduce((sum, month) => sum + parseFloat(month.total_expenses?.toString() || '0'), 0) / monthlyTotals.length
      : 0
    
    // Format monthly data for charts
    const chartData = monthlyTotals.map(month => ({
      month: new Date(month.month).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      income: parseFloat(month.total_income?.toString() || '0'),
      expenses: parseFloat(month.total_expenses?.toString() || '0'),
      net: parseFloat(month.net_amount?.toString() || '0')
    })).reverse() // Reverse to show chronological order
    
    // Top income and expense categories
    const topIncomeCategories = incomeCategories
      .slice(0, 5)
      .map(cat => ({
        category: cat.category,
        amount: parseFloat(cat.total_amount?.toString() || '0'),
        count: parseInt(cat.transaction_count?.toString() || '0')
      }))
    
    const topExpenseCategories = expenseCategories
      .slice(0, 5)
      .map(cat => ({
        category: cat.category,
        amount: parseFloat(cat.total_amount?.toString() || '0'),
        count: parseInt(cat.transaction_count?.toString() || '0')
      }))
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          netAmount,
          profitMargin: Math.round(profitMargin * 100) / 100,
          incomeCount: parseInt(summary.income_count?.toString() || '0'),
          expenseCount: parseInt(summary.expense_count?.toString() || '0'),
          totalTransactions: parseInt(summary.income_count?.toString() || '0') + parseInt(summary.expense_count?.toString() || '0')
        },
        monthlyAverages: {
          income: Math.round(monthlyIncomeAvg * 100) / 100,
          expenses: Math.round(monthlyExpensesAvg * 100) / 100,
          net: Math.round((monthlyIncomeAvg - monthlyExpensesAvg) * 100) / 100
        },
        chartData,
        categories: {
          income: topIncomeCategories,
          expenses: topExpenseCategories
        },
        trends: {
          monthlyTotals: monthlyTotals.map(month => ({
            month: month.month,
            income: parseFloat(month.total_income?.toString() || '0'),
            expenses: parseFloat(month.total_expenses?.toString() || '0'),
            net: parseFloat(month.net_amount?.toString() || '0')
          }))
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching financial summary:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch financial summary',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}