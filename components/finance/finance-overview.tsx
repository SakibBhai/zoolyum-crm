"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download } from "lucide-react"
import { TransactionForm } from "./transaction-form"
import { TransactionList } from "./transaction-list"
import { FinancialSummary } from "./financial-summary"
import { MonthlyAudit } from "./monthly-audit"
import { TransactionFilters } from "./transaction-filters"
import { FinancialCharts } from "./financial-charts"
import { useToast } from "@/components/ui/use-toast"
import * as XLSX from 'xlsx'

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  createdAt: string
}

export interface FilterOptions {
  type: 'all' | 'income' | 'expense'
  category: string
  dateRange: {
    from: Date | null
    to: Date | null
  }
  sortBy: 'date' | 'amount' | 'category'
  sortOrder: 'asc' | 'desc'
}

const defaultFilters: FilterOptions = {
  type: 'all',
  category: 'all',
  dateRange: { from: null, to: null },
  sortBy: 'date',
  sortOrder: 'desc'
}

export function FinanceOverview() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)

  // Load transactions from localStorage on component mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('finance-transactions')
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions))
      } catch (error) {
        console.error('Error loading transactions:', error)
      }
    }
  }, [])

  // Save transactions to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem('finance-transactions', JSON.stringify(transactions))
  }, [transactions])

  const handleAddTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }
    setTransactions(prev => [newTransaction, ...prev])
    setShowTransactionForm(false)
    toast({
      title: "Transaction Added",
      description: `${transaction.type === 'income' ? 'Income' : 'Expense'} of $${transaction.amount.toFixed(2)} has been recorded.`,
    })
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowTransactionForm(true)
  }

  const handleUpdateTransaction = (updatedTransaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!editingTransaction) return
    
    setTransactions(prev => prev.map(t => 
      t.id === editingTransaction.id 
        ? { ...updatedTransaction, id: editingTransaction.id, createdAt: editingTransaction.createdAt }
        : t
    ))
    setEditingTransaction(null)
    setShowTransactionForm(false)
    toast({
      title: "Transaction Updated",
      description: "Transaction has been successfully updated.",
    })
  }

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    toast({
      title: "Transaction Deleted",
      description: "Transaction has been successfully deleted.",
      variant: "destructive"
    })
  }

  const handleExportData = () => {
    // Prepare data for Excel export
    const excelData = transactions.map(transaction => ({
      'Transaction ID': transaction.id,
      'Date': new Date(transaction.date).toLocaleDateString(),
      'Type': transaction.type,
      'Category': transaction.category,
      'Description': transaction.description,
      'Amount': transaction.amount,
      'Created At': new Date(transaction.createdAt).toLocaleDateString()
    }))

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Transaction ID
      { wch: 12 }, // Date
      { wch: 10 }, // Type
      { wch: 15 }, // Category
      { wch: 25 }, // Description
      { wch: 12 }, // Amount
      { wch: 15 }  // Created At
    ]
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

    // Generate filename with current date
    const filename = `finance-data-${new Date().toISOString().split('T')[0]}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)
    
    toast({
      title: "Data Exported",
      description: "Your financial data has been exported to Excel successfully.",
    })
  }

  // Calculate summary statistics
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const netBalance = totalIncome - totalExpenses

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{totalIncome.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.type === 'income').length} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{totalExpenses.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.type === 'expense').length} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ৳{netBalance.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {netBalance >= 0 ? 'Positive' : 'Negative'} balance
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              All time records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Button onClick={() => setShowTransactionForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportData}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Transactions</CardTitle>
            <CardDescription>
              Use filters to analyze specific transactions and time periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionFilters 
              filters={filters} 
              onFiltersChange={setFilters}
              transactions={transactions}
            />
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audit">Monthly Audit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <FinancialSummary transactions={transactions} />
          <FinancialCharts transactions={transactions} />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <TransactionList 
            transactions={transactions}
            filters={filters}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
          />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <FinancialCharts transactions={transactions} />
        </TabsContent>
        
        <TabsContent value="audit" className="space-y-4">
          <MonthlyAudit transactions={transactions} />
        </TabsContent>
      </Tabs>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          transaction={editingTransaction}
          onSubmit={editingTransaction ? handleUpdateTransaction : handleAddTransaction}
          onCancel={() => {
            setShowTransactionForm(false)
            setEditingTransaction(null)
          }}
        />
      )}
    </div>
  )
}