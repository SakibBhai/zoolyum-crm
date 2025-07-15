"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Transaction } from "./finance-overview"
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns"

interface FinancialChartsProps {
  transactions: Transaction[]
}

const COLORS = {
  income: '#10b981',
  expense: '#ef4444',
  net: '#3b82f6'
}

const CATEGORY_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00',
  '#ff00ff', '#00ffff', '#ff0000', '#0000ff', '#ffff00'
]

export function FinancialCharts({ transactions }: FinancialChartsProps) {
  // Prepare monthly data for the last 12 months
  const monthlyData = useMemo(() => {
    const endDate = new Date()
    const startDate = subMonths(endDate, 11)
    const months = eachMonthOfInterval({ start: startDate, end: endDate })

    return months.map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= monthStart && transactionDate <= monthEnd
      })

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        month: format(month, 'MMM yyyy'),
        income,
        expenses,
        net: income - expenses
      }
    })
  }, [transactions])

  // Prepare category data for pie charts
  const categoryData = useMemo(() => {
    const incomeByCategory = new Map<string, number>()
    const expensesByCategory = new Map<string, number>()

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        incomeByCategory.set(
          transaction.category,
          (incomeByCategory.get(transaction.category) || 0) + transaction.amount
        )
      } else {
        expensesByCategory.set(
          transaction.category,
          (expensesByCategory.get(transaction.category) || 0) + transaction.amount
        )
      }
    })

    const incomeData = Array.from(incomeByCategory.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    const expensesData = Array.from(expensesByCategory.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    return { incomeData, expensesData }
  }, [transactions])

  const formatCurrency = (value: number) => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.payload.category}</p>
          <p style={{ color: data.color }}>
            Amount: {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            {((data.value / data.payload.total) * 100).toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income & Expense Trends</CardTitle>
              <CardDescription>
                Monthly income and expense trends over the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke={COLORS.income}
                      strokeWidth={2}
                      name="Income"
                      dot={{ fill: COLORS.income, strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke={COLORS.expense}
                      strokeWidth={2}
                      name="Expenses"
                      dot={{ fill: COLORS.expense, strokeWidth: 2, r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke={COLORS.net}
                      strokeWidth={2}
                      name="Net Balance"
                      dot={{ fill: COLORS.net, strokeWidth: 2, r: 4 }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of income vs expenses by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="income" 
                      fill={COLORS.income} 
                      name="Income"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="expenses" 
                      fill={COLORS.expense} 
                      name="Expenses"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Income by Category</CardTitle>
                <CardDescription>
                  Distribution of income across different categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.incomeData.map((item, index) => ({
                          ...item,
                          total: categoryData.incomeData.reduce((sum, d) => sum + d.amount, 0)
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => 
                          `${category} (${percent ? (percent * 100).toFixed(0) : 0}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryData.incomeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>
                  Distribution of expenses across different categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.expensesData.map((item, index) => ({
                          ...item,
                          total: categoryData.expensesData.reduce((sum, d) => sum + d.amount, 0)
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => 
                          `${category} (${percent ? (percent * 100).toFixed(0) : 0}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryData.expensesData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}