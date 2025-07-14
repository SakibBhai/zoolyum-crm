"use client"

import { useMemo, useState } from "react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Target, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Transaction } from "./finance-overview"

interface MonthlyAuditProps {
  transactions: Transaction[]
}

interface MonthlyStats {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  transactionCount: number
  avgTransactionAmount: number
  topIncomeCategory: { category: string; amount: number }
  topExpenseCategory: { category: string; amount: number }
  incomeByCategory: Record<string, number>
  expensesByCategory: Record<string, number>
}

export function MonthlyAudit({ transactions }: MonthlyAuditProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const monthlyStats = useMemo((): MonthlyStats => {
    const monthStart = startOfMonth(selectedMonth)
    const monthEnd = endOfMonth(selectedMonth)
    
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= monthStart && transactionDate <= monthEnd
    })

    const incomeTransactions = monthTransactions.filter(t => t.type === 'income')
    const expenseTransactions = monthTransactions.filter(t => t.type === 'expense')

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
    const netBalance = totalIncome - totalExpenses

    // Calculate category breakdowns
    const incomeByCategory: Record<string, number> = {}
    const expensesByCategory: Record<string, number> = {}

    incomeTransactions.forEach(t => {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount
    })

    expenseTransactions.forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount
    })

    // Find top categories
    const topIncomeCategory = Object.entries(incomeByCategory)
      .sort(([,a], [,b]) => b - a)[0] || ['N/A', 0]
    
    const topExpenseCategory = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)[0] || ['N/A', 0]

    const avgTransactionAmount = monthTransactions.length > 0 
      ? (totalIncome + totalExpenses) / monthTransactions.length 
      : 0

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      transactionCount: monthTransactions.length,
      avgTransactionAmount,
      topIncomeCategory: { category: topIncomeCategory[0], amount: topIncomeCategory[1] },
      topExpenseCategory: { category: topExpenseCategory[0], amount: topExpenseCategory[1] },
      incomeByCategory,
      expensesByCategory
    }
  }, [transactions, selectedMonth])

  // Calculate previous month for comparison
  const previousMonthStats = useMemo((): MonthlyStats => {
    const prevMonth = subMonths(selectedMonth, 1)
    const monthStart = startOfMonth(prevMonth)
    const monthEnd = endOfMonth(prevMonth)
    
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= monthStart && transactionDate <= monthEnd
    })

    const incomeTransactions = monthTransactions.filter(t => t.type === 'income')
    const expenseTransactions = monthTransactions.filter(t => t.type === 'expense')

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)

    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: monthTransactions.length,
      avgTransactionAmount: 0,
      topIncomeCategory: { category: '', amount: 0 },
      topExpenseCategory: { category: '', amount: 0 },
      incomeByCategory: {},
      expensesByCategory: {}
    }
  }, [transactions, selectedMonth])

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <DollarSign className="h-4 w-4 text-gray-500" />
  }

  const getChangeColor = (change: number, isExpense = false) => {
    if (isExpense) {
      return change > 0 ? 'text-red-500' : 'text-green-500'
    }
    return change > 0 ? 'text-green-500' : 'text-red-500'
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedMonth(subMonths(selectedMonth, 1))
    } else {
      setSelectedMonth(addMonths(selectedMonth, 1))
    }
  }

  const incomeChange = calculatePercentageChange(monthlyStats.totalIncome, previousMonthStats.totalIncome)
  const expenseChange = calculatePercentageChange(monthlyStats.totalExpenses, previousMonthStats.totalExpenses)
  const netChange = calculatePercentageChange(monthlyStats.netBalance, previousMonthStats.netBalance)

  const savingsRate = monthlyStats.totalIncome > 0 
    ? ((monthlyStats.totalIncome - monthlyStats.totalExpenses) / monthlyStats.totalIncome) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {format(selectedMonth, 'MMMM yyyy')} Audit
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigateMonth('next')}
            disabled={selectedMonth >= new Date()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Badge variant={monthlyStats.netBalance >= 0 ? 'default' : 'destructive'}>
          {monthlyStats.netBalance >= 0 ? 'Profitable' : 'Loss'}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            {getChangeIcon(incomeChange)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyStats.totalIncome)}
            </div>
            <p className={`text-xs ${getChangeColor(incomeChange)}`}>
              {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            {getChangeIcon(expenseChange)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyStats.totalExpenses)}
            </div>
            <p className={`text-xs ${getChangeColor(expenseChange, true)}`}>
              {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            {getChangeIcon(netChange)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              monthlyStats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(monthlyStats.netBalance)}
            </div>
            <p className={`text-xs ${getChangeColor(netChange)}`}>
              {netChange > 0 ? '+' : ''}{netChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Income Breakdown</CardTitle>
            <CardDescription>
              Income distribution by category for {format(selectedMonth, 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(monthlyStats.incomeByCategory).length > 0 ? (
              Object.entries(monthlyStats.incomeByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = (amount / monthlyStats.totalIncome) * 100
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No income recorded for this month
              </p>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>
              Expense distribution by category for {format(selectedMonth, 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(monthlyStats.expensesByCategory).length > 0 ? (
              Object.entries(monthlyStats.expensesByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = (amount / monthlyStats.totalExpenses) * 100
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No expenses recorded for this month
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Health Indicators</CardTitle>
          <CardDescription>
            Key metrics to assess your financial performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {savingsRate >= 20 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium">Savings Rate</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Target: 20% or higher. Current: {savingsRate.toFixed(1)}%
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {monthlyStats.transactionCount >= 10 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium">Transaction Activity</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {monthlyStats.transactionCount} transactions this month
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {monthlyStats.netBalance >= 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">Cash Flow</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {monthlyStats.netBalance >= 0 ? 'Positive' : 'Negative'} cash flow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{monthlyStats.transactionCount}</p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(monthlyStats.avgTransactionAmount)}</p>
              <p className="text-sm text-muted-foreground">Avg Transaction</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{monthlyStats.topIncomeCategory.category}</p>
              <p className="text-sm text-muted-foreground">Top Income Source</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{monthlyStats.topExpenseCategory.category}</p>
              <p className="text-sm text-muted-foreground">Top Expense Category</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}