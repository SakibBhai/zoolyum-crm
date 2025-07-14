"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, PieChart, Calendar, Target } from "lucide-react"
import { Transaction } from "./finance-overview"

interface FinancialSummaryProps {
  transactions: Transaction[]
}

export function FinancialSummary({ transactions }: FinancialSummaryProps) {
  // Calculate current month data
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear
  })

  // Calculate previous month data for comparison
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  const previousMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date)
    return transactionDate.getMonth() === previousMonth && transactionDate.getFullYear() === previousYear
  })

  // Current month calculations
  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const currentMonthNet = currentMonthIncome - currentMonthExpenses

  // Previous month calculations
  const previousMonthIncome = previousMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const previousMonthExpenses = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const previousMonthNet = previousMonthIncome - previousMonthExpenses

  // Calculate percentage changes
  const incomeChange = previousMonthIncome > 0 
    ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 
    : 0
  
  const expenseChange = previousMonthExpenses > 0 
    ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
    : 0
  
  const netChange = previousMonthNet !== 0 
    ? ((currentMonthNet - previousMonthNet) / Math.abs(previousMonthNet)) * 100 
    : 0

  // Category analysis
  const categoryTotals = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = { income: 0, expense: 0 }
    }
    if (transaction.type === 'income') {
      acc[transaction.category].income += transaction.amount
    } else {
      acc[transaction.category].expense += transaction.amount
    }
    return acc
  }, {} as Record<string, { income: number; expense: number }>)

  const topExpenseCategories = Object.entries(categoryTotals)
    .map(([category, totals]) => ({ category, amount: totals.expense }))
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  const topIncomeCategories = Object.entries(categoryTotals)
    .map(([category, totals]) => ({ category, amount: totals.income }))
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // Savings rate calculation
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatPercentage = (percentage: number) => `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Current Month Summary */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Month Summary
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} financial overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Income</span>
                <Badge variant={incomeChange >= 0 ? "default" : "destructive"}>
                  {formatPercentage(incomeChange)}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(currentMonthIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                vs {formatCurrency(previousMonthIncome)} last month
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expenses</span>
                <Badge variant={expenseChange <= 0 ? "default" : "destructive"}>
                  {formatPercentage(expenseChange)}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(currentMonthExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                vs {formatCurrency(previousMonthExpenses)} last month
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net</span>
                <Badge variant={netChange >= 0 ? "default" : "destructive"}>
                  {formatPercentage(netChange)}
                </Badge>
              </div>
              <div className={`text-2xl font-bold ${
                currentMonthNet >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(currentMonthNet)}
              </div>
              <p className="text-xs text-muted-foreground">
                vs {formatCurrency(previousMonthNet)} last month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Savings Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-3xl font-bold">
              {savingsRate.toFixed(1)}%
            </div>
            <Progress value={Math.max(0, Math.min(100, savingsRate))} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs improvement'} savings rate
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Expense Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Top Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topExpenseCategories.length > 0 ? (
              topExpenseCategories.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(item.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No expense data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Income Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topIncomeCategories.length > 0 ? (
              topIncomeCategories.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(item.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No income data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}