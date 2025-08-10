"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import * as XLSX from 'xlsx'
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Sparkles,
  Globe,
  Repeat,
  Shield,
  FileText,
  Eye,
  EyeOff,
  Building,
  CreditCard,
  AlertCircle
} from "lucide-react"
import { EnhancedTransactionForm, EnhancedTransaction } from "./enhanced-transaction-form"

import { Transaction } from "./finance-overview"
import { TransactionList } from "./transaction-list"
import { FinancialSummary } from "./financial-summary"
import { MonthlyAudit } from "./monthly-audit"
import { TransactionFilters } from "./transaction-filters"
import { FinancialCharts } from "./financial-charts"
import { useToast } from "@/components/ui/use-toast"
import { useTransactions } from "@/hooks/use-transactions"
import Link from "next/link"

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

export function EnhancedFinanceOverview() {
  const { toast } = useToast()

  // API-based transaction management
  const {
    transactions,
    loading,
    creating,
    updating,
    deleting,
    error,
    financialSummary,
    categories,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchFinancialSummary,
    fetchCategories,
    refetch,
    setFilters: setApiFilters,
    setSort,
    setPagination
  } = useTransactions({
    pagination: { page: 1, limit: 50 }, // Get more transactions for overview
    sort: { sortBy: 'date', sortOrder: 'desc' }
  })

  // Enhanced transactions (still using localStorage for now)
  const [enhancedTransactions, setEnhancedTransactions] = useState<EnhancedTransaction[]>([])

  // UI state
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)
  const [editingEnhancedTransaction, setEditingEnhancedTransaction] = useState<EnhancedTransaction | null>(null)
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)

  // Load enhanced transactions from database and merge with localStorage enhanced features
  useEffect(() => {
    const loadEnhancedTransactions = async () => {
      try {
        // Get enhanced transaction metadata from localStorage
        const savedEnhancedMeta = localStorage.getItem('enhanced-finance-transactions')
        const enhancedMeta = savedEnhancedMeta ? JSON.parse(savedEnhancedMeta) : []
        
        // Convert standard transactions to enhanced format with additional features
        const enhancedFromDb = transactions.map(transaction => {
          // Find matching enhanced metadata
          const enhancedData = enhancedMeta.find((meta: any) => meta.id === transaction.id)
          
          return {
            id: transaction.id,
            type: transaction.type,
            amount: transaction.amount,
            currency: 'BDT', // Default currency
            category: transaction.category,
            description: transaction.description,
            date: transaction.date,
            paymentMethod: 'Bank Transfer', // Default payment method
            attachments: [],
            isRecurring: false,
            isConfidential: false,
            tags: [],
            createdAt: transaction.createdAt,
            // Merge any enhanced features from localStorage
            ...enhancedData
          } as EnhancedTransaction
        })
        
        setEnhancedTransactions(enhancedFromDb)
      } catch (error) {
        console.error('Error loading enhanced transactions:', error)
      }
    }
    
    if (transactions.length > 0) {
      loadEnhancedTransactions()
    }
  }, [transactions])

  // Save enhanced transaction metadata to localStorage (only enhanced features)
  useEffect(() => {
    const enhancedMeta = enhancedTransactions.map(transaction => ({
      id: transaction.id,
      currency: transaction.currency,
      exchangeRate: transaction.exchangeRate,
      originalAmount: transaction.originalAmount,
      originalCurrency: transaction.originalCurrency,
      customCategory: transaction.customCategory,
      richDescription: transaction.richDescription,
      dueDate: transaction.dueDate,
      paymentMethod: transaction.paymentMethod,
      vendorClient: transaction.vendorClient,
      attachments: transaction.attachments,
      isRecurring: transaction.isRecurring,
      recurringPattern: transaction.recurringPattern,
      isConfidential: transaction.isConfidential,
      tags: transaction.tags
    }))
    localStorage.setItem('enhanced-finance-transactions', JSON.stringify(enhancedMeta))
  }, [enhancedTransactions])

  // Fetch financial summary and categories on mount
  useEffect(() => {
    fetchFinancialSummary()
    fetchCategories()
  }, [fetchFinancialSummary, fetchCategories])



  const handleAddEnhancedTransaction = async (transaction: Omit<EnhancedTransaction, 'id' | 'createdAt'>) => {
    // Generate a simple UUID-like string for compatibility
    const generateId = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Also save to database for persistence first
    const standardTransaction = {
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.customCategory || transaction.category,
      description: transaction.description,
      date: transaction.date,
      createdAt: new Date().toISOString()
    }

    const result = await createTransaction(standardTransaction)
    
    if (result) {
      // Use the database ID for the enhanced transaction
      const newTransaction: EnhancedTransaction = {
        ...transaction,
        id: result.id, // Use database ID instead of generated ID
        createdAt: result.createdAt || new Date().toISOString()
      }

      // Save to localStorage for enhanced features
      setEnhancedTransactions(prev => [newTransaction, ...prev])
      
      setShowEnhancedForm(false)
      // Refresh financial summary
      fetchFinancialSummary()
      toast({
        title: "✨ Enhanced Transaction Added",
        description: `${transaction.type === 'income' ? 'Income' : 'Expense'} of ${transaction.currency === 'BDT' ? '৳' : '$'}${transaction.amount.toLocaleString()} saved to database with enterprise features.`,
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to save transaction to database. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    // For enhanced transactions, delete from both database and localStorage
    const success = await deleteTransaction(id)
    if (success) {
      setEnhancedTransactions(prev => prev.filter(t => t.id !== id))
      // Refresh financial summary
      fetchFinancialSummary()
      toast({
        title: "Transaction Deleted",
        description: "Enhanced transaction has been successfully deleted from database.",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to delete transaction from database. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleExportData = () => {
    // Export enhanced transactions with all fields
    const exportData = (enhancedTransactions || []).map(transaction => ({
      Date: transaction.date,
      Type: transaction.type,
      Category: transaction.category,
      'Sub Type': transaction.subType || '',
      'Custom Category': transaction.customCategory || '',
      Description: transaction.description,
      'Rich Description': transaction.richDescription || '',
      Amount: transaction.amount,
      Currency: transaction.currency,
      'Exchange Rate': transaction.exchangeRate || '',
      'Original Amount': transaction.originalAmount || '',
      'Original Currency': transaction.originalCurrency || '',
      'Payment Method': transaction.paymentMethod,
      'Vendor/Client': transaction.vendorClient || '',
      'Due Date': transaction.dueDate || '',
      'Is Recurring': transaction.isRecurring ? 'Yes' : 'No',
      'Recurring Pattern': transaction.recurringPattern ? JSON.stringify(transaction.recurringPattern) : '',
      'Is Confidential': transaction.isConfidential ? 'Yes' : 'No',
      'Tags': transaction.tags?.join(', ') || '',
      'Attachments': transaction.attachments?.length || 0,
      'Created At': transaction.createdAt,
      'Updated At': transaction.updatedAt || ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Enhanced Transactions')
    XLSX.writeFile(wb, `enhanced-transactions-${new Date().toISOString().split('T')[0]}.xlsx`)

    toast({
      title: "Data Exported",
      description: `Successfully exported ${(enhancedTransactions || []).length} transactions to Excel.`,
    })
  }

  // Calculate summary statistics for enterprise view
  const currentTransactions = enhancedTransactions || []

  // Calculate financial summary for enhanced view
  const totalIncome = currentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = currentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const netBalance = totalIncome - totalExpenses

  // Enhanced transaction statistics
  const enhancedStats = {
    multiCurrency: (enhancedTransactions || []).filter(t => t.currency !== 'BDT').length,
    recurring: (enhancedTransactions || []).filter(t => t.isRecurring).length,
    confidential: (enhancedTransactions || []).filter(t => t.isConfidential).length,
    withAttachments: (enhancedTransactions || []).filter(t => t.attachments?.length > 0).length,
    withVendors: (enhancedTransactions || []).filter(t => t.vendorClient).length
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <h2 className="text-lg font-semibold">Enterprise Finance Management</h2>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Enterprise Features Alert */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          You're viewing the enterprise-grade financial management system with advanced features like multi-currency support,
          AI categorization, recurring transactions, and document attachments.
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <>
              <div className="text-2xl font-bold text-green-600">৳{(totalIncome ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">
                {currentTransactions.filter(t => t.type === 'income').length} transactions
              </p>
            </>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <>
              <div className="text-2xl font-bold text-red-600">৳{(totalExpenses ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">
                {currentTransactions.filter(t => t.type === 'expense').length} transactions
              </p>
            </>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                ৳{(netBalance ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {netBalance >= 0 ? 'Positive' : 'Negative'} balance
              </p>
            </>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <>
              <div className="text-2xl font-bold text-purple-600">{currentTransactions.length}</div>
              <p className="text-xs text-muted-foreground">
                Enterprise records
              </p>
            </>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Stats */}
      {(enhancedTransactions || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Enterprise Features Usage
            </CardTitle>
            <CardDescription>
              Advanced features being utilized in your financial management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-semibold">{enhancedStats.multiCurrency}</div>
                  <div className="text-xs text-muted-foreground">Multi-Currency</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-semibold">{enhancedStats.recurring}</div>
                  <div className="text-xs text-muted-foreground">Recurring</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-red-500" />
                <div>
                  <div className="font-semibold">{enhancedStats.confidential}</div>
                  <div className="text-xs text-muted-foreground">Confidential</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="font-semibold">{enhancedStats.withAttachments}</div>
                  <div className="text-xs text-muted-foreground">With Attachments</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-orange-500" />
                <div>
                  <div className="font-semibold">{enhancedStats.withVendors}</div>
                  <div className="text-xs text-muted-foreground">With Vendors</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={() => setShowEnhancedForm(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Add Enhanced Transaction
        </Button>
        <Link href="/dashboard/finance/add-transaction-enterprise">
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Add Enterprise Transaction (Page)
          </Button>
        </Link>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionFilters
              filters={filters}
              onFiltersChange={setFilters}
              transactions={enhancedTransactions || []}
          />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}


      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <FinancialSummary transactions={enhancedTransactions} />
            <FinancialCharts transactions={enhancedTransactions} />
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionList
            transactions={enhancedTransactions}
            onEdit={(t) => { setEditingEnhancedTransaction(t as EnhancedTransaction); setShowEnhancedForm(true); }}
            onDelete={handleDeleteTransaction}
            filters={filters}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <FinancialCharts transactions={enhancedTransactions} />
        </TabsContent>

        <TabsContent value="reports">
          <MonthlyAudit transactions={enhancedTransactions} />
        </TabsContent>
      </Tabs>

      {/* Enhanced Transaction Form */}
      {showEnhancedForm && (
        <EnhancedTransactionForm
          transaction={editingEnhancedTransaction}
          onSubmit={editingEnhancedTransaction ?
            (updatedTransaction) => {
              setEnhancedTransactions(prev => prev.map(t =>
                t.id === editingEnhancedTransaction.id
                  ? { ...updatedTransaction, id: editingEnhancedTransaction.id, createdAt: editingEnhancedTransaction.createdAt }
                  : t
              ))
              setEditingEnhancedTransaction(null)
              setShowEnhancedForm(false)
              toast({
                title: "✨ Enhanced Transaction Updated",
                description: "Enterprise transaction has been successfully updated.",
              })
            } : handleAddEnhancedTransaction
          }
          onCancel={() => {
            setShowEnhancedForm(false)
            setEditingEnhancedTransaction(null)
          }}
          existingTransactions={enhancedTransactions}
        />
      )}
    </div>
  )
}