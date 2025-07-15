import { NextRequest, NextResponse } from 'next/server'
import { transactionsService } from '@/lib/neon-db'

// GET /api/transactions/categories - Get transaction categories with statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'income' | 'expense' | undefined
    
    // Get categories from database
    const categories = await transactionsService.getCategories(type)
    
    // Define default categories for reference
    const defaultIncomeCategories = [
      'Salary',
      'Freelance',
      'Business Revenue',
      'Investment Returns',
      'Rental Income',
      'Dividends',
      'Interest',
      'Bonus',
      'Commission',
      'Consulting',
      'Sales',
      'Other Income'
    ]
    
    const defaultExpenseCategories = [
      'Office Supplies',
      'Software & Tools',
      'Marketing & Advertising',
      'Travel & Transportation',
      'Meals & Entertainment',
      'Professional Services',
      'Rent & Utilities',
      'Insurance',
      'Equipment',
      'Training & Education',
      'Taxes',
      'Bank Fees',
      'Maintenance',
      'Other Expenses'
    ]
    
    // Format categories with statistics
    const formattedCategories = categories.map(cat => ({
      category: cat.category,
      type: cat.type,
      transactionCount: parseInt(cat.transaction_count?.toString() || '0'),
      totalAmount: parseFloat(cat.total_amount?.toString() || '0')
    }))
    
    // Group by type
    const incomeCategories = formattedCategories.filter(cat => cat.type === 'income')
    const expenseCategories = formattedCategories.filter(cat => cat.type === 'expense')
    
    // Get unique category names that are actually used
    const usedIncomeCategories = incomeCategories.map(cat => cat.category)
    const usedExpenseCategories = expenseCategories.map(cat => cat.category)
    
    // Combine used categories with defaults (remove duplicates)
    const allIncomeCategories = [
      ...new Set([...usedIncomeCategories, ...defaultIncomeCategories])
    ].sort()
    
    const allExpenseCategories = [
      ...new Set([...usedExpenseCategories, ...defaultExpenseCategories])
    ].sort()
    
    // Calculate totals
    const incomeTotals = {
      totalAmount: incomeCategories.reduce((sum, cat) => sum + cat.totalAmount, 0),
      totalTransactions: incomeCategories.reduce((sum, cat) => sum + cat.transactionCount, 0),
      categoryCount: incomeCategories.length
    }
    
    const expenseTotals = {
      totalAmount: expenseCategories.reduce((sum, cat) => sum + cat.totalAmount, 0),
      totalTransactions: expenseCategories.reduce((sum, cat) => sum + cat.transactionCount, 0),
      categoryCount: expenseCategories.length
    }
    
    const response = {
      success: true,
      data: {
        categories: {
          income: incomeCategories,
          expenses: expenseCategories
        },
        availableCategories: {
          income: allIncomeCategories,
          expenses: allExpenseCategories
        },
        totals: {
          income: incomeTotals,
          expenses: expenseTotals,
          overall: {
            totalAmount: incomeTotals.totalAmount - expenseTotals.totalAmount,
            totalTransactions: incomeTotals.totalTransactions + expenseTotals.totalTransactions,
            categoryCount: incomeTotals.categoryCount + expenseTotals.categoryCount
          }
        }
      }
    }
    
    // Filter by type if specified
    if (type === 'income') {
      return NextResponse.json({
        success: true,
        data: {
          categories: incomeCategories,
          availableCategories: allIncomeCategories,
          totals: incomeTotals
        }
      })
    } else if (type === 'expense') {
      return NextResponse.json({
        success: true,
        data: {
          categories: expenseCategories,
          availableCategories: allExpenseCategories,
          totals: expenseTotals
        }
      })
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching transaction categories:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transaction categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}