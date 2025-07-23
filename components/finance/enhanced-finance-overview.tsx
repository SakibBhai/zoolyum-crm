"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { TransactionForm } from "./transaction-form"
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
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editingEnhancedTransaction, setEditingEnhancedTransaction] = useState<EnhancedTransaction | null>(null)
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [activeView, setActiveView] = useState<'standard' | 'enterprise'>('enterprise')

  // Load enhanced transactions from localStorage (keeping for backward compatibility)
  useEffect(() => {
    const savedEnhancedTransactions = localStorage.getItem('enhanced-finance-transactions')
    if (savedEnhancedTransactions) {
      try {
        setEnhancedTransactions(JSON.parse(savedEnhancedTransactions))
      } catch (error) {
        console.error('Error loading enhanced transactions:', error)
      }
    }
  }, [])

  // Save enhanced transactions to localStorage
  useEffect(() => {
    localStorage.setItem('enhanced-finance-transactions', JSON.stringify(enhancedTransactions))
  }, [enhancedTransactions])

  // Fetch financial summary and categories on mount
  useEffect(() => {
    fetchFinancialSummary()
    fetchCategories()
  }, [fetchFinancialSummary, fetchCategories])

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const result = await createTransaction({
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    })

    if (result) {
      setShowTransactionForm(false)
      // Refresh financial summary
      fetchFinancialSummary()
    }
  }

  const handleAddEnhancedTransaction = (transaction: Omit<EnhancedTransaction, 'id' | 'createdAt'>) => {
    // Generate a simple UUID-like string for compatibility
    const generateId = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const newTransaction: EnhancedTransaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString()
    }
    setEnhancedTransactions(prev => [newTransaction, ...prev])
    setShowEnhancedForm(false)
    toast({
      title: "✨ Enhanced Transaction Added",
      description: `${transaction.type === 'income' ? 'Income' : 'Expense'} of ${transaction.currency === 'BDT' ? '৳' : '$'}${transaction.amount.toLocaleString()} with enterprise features.`,
    })
  }

  const handleDeleteTransaction = async (id: string) => {
    if (activeView === 'standard') {
      const success = await deleteTransaction(id)
      if (success) {
        // Refresh financial summary
        fetchFinancialSummary()
      }
    } else {
      setEnhancedTransactions(prev => prev.filter(t => t.id !== id))
      toast({
        title: "Transaction Deleted",
        description: "Enhanced transaction has been successfully deleted.",
        variant: "destructive"
      })
    }
  }

  const handleExportData = () => {
    const dataToExport = activeView === 'standard' ? transactions : enhancedTransactions

    // Include financial summary for standard view
    const exportData = activeView === 'standard' ? {
      transactions: dataToExport,
      summary: financialSummary,
      exportDate: new Date().toISOString(),
      totalTransactions: dataToExport.length
    } : {
      transactions: dataToExport,
      exportDate: new Date().toISOString(),
      totalTransactions: dataToExport.length
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeView}-finance-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Data Exported",
      description: `Your ${activeView} financial data has been exported successfully.`,
    })
  }

  // Calculate summary statistics for current view
  const currentTransactions = activeView === 'standard' ? (transactions || []) : (enhancedTransactions || [])

  // Use API financial summary for standard view, calculate for enhanced view
  const totalIncome = activeView === 'standard' && financialSummary
    ? financialSummary.totalIncome
    : currentTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = activeView === 'standard' && financialSummary
    ? financialSummary.totalExpenses
    : currentTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

  const netBalance = activeView === 'standard' && financialSummary
    ? financialSummary.netAmount
    : totalIncome - totalExpenses

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
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'standard' | 'enterprise')}>
          <TabsList>
            <TabsTrigger value="standard">Standard View</TabsTrigger>
            <TabsTrigger value="enterprise" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Enterprise View
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
      {activeView === 'enterprise' && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            You're viewing the enterprise-grade financial management system with advanced features like multi-currency support,
            AI categorization, recurring transactions, and document attachments.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && activeView === 'standard' && (
        <Alert>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Loading financial data...</span>
          </div>
        </Alert>
      )}

      {/* Error State */}
      {error && activeView === 'standard' && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loading && activeView === 'standard' ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">৳{(totalIncome ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">
                  {currentTransactions.filter(t => t.type === 'income').length} transactions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loading && activeView === 'standard' ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">৳{(totalExpenses ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">
                  {currentTransactions.filter(t => t.type === 'expense').length} transactions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading && activeView === 'standard' ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  ৳{(netBalance ?? 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {netBalance >= 0 ? 'Positive' : 'Negative'} balance
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loading && activeView === 'standard' ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600">{currentTransactions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeView === 'enterprise' ? 'Enterprise' : 'Standard'} records
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Stats */}
      {activeView === 'enterprise' && (enhancedTransactions || []).length > 0 && (
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
        {activeView === 'standard' ? (
          <>
            <Button
              onClick={() => setShowTransactionForm(true)}
              disabled={creating}
            >
              {creating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {creating ? 'Creating...' : 'Add Transaction'}
            </Button>
            <Link href="/dashboard/finance/add-transaction">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction (Page)
              </Button>
            </Link>
          </>
        ) : (
          <>
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
          </>
        )}
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
              transactions={activeView === 'standard' ? (transactions || []) : (enhancedTransactions || [])}
            />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && activeView === 'standard' && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

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
            <FinancialSummary transactions={activeView === 'standard' ? transactions : enhancedTransactions} />
            <FinancialCharts transactions={activeView === 'standard' ? transactions : enhancedTransactions} />
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          {loading && activeView === 'standard' ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Loading transactions...</span>
                  </div>
                  {/* Loading skeleton */}
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={`skeleton-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2 flex-1">
                        <div className="animate-pulse h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="animate-pulse h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="animate-pulse h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <TransactionList
              transactions={activeView === 'standard' ? transactions : enhancedTransactions}
              onEdit={activeView === 'standard' ?
                (t) => { setEditingTransaction(t as Transaction); setShowTransactionForm(true); } :
                (t) => { setEditingEnhancedTransaction(t as EnhancedTransaction); setShowEnhancedForm(true); }
              }
              onDelete={handleDeleteTransaction}
              filters={filters}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <FinancialCharts transactions={activeView === 'standard' ? transactions : enhancedTransactions} />
        </TabsContent>

        <TabsContent value="reports">
          <MonthlyAudit transactions={activeView === 'standard' ? transactions : enhancedTransactions} />
        </TabsContent>
      </Tabs>

      {/* Transaction Forms */}
      {showTransactionForm && (
        <TransactionForm
          transaction={editingTransaction}
          onSubmit={editingTransaction ?
            async (updatedTransaction) => {
              const success = await updateTransaction(editingTransaction.id, {
                type: updatedTransaction.type,
                amount: updatedTransaction.amount,
                category: updatedTransaction.category,
                description: updatedTransaction.description,
                date: updatedTransaction.date
              })

              if (success) {
                setEditingTransaction(null)
                setShowTransactionForm(false)
                fetchFinancialSummary() // Refresh summary
                toast({
                  title: "Transaction Updated",
                  description: "Transaction has been successfully updated.",
                })
              }
            } : handleAddTransaction
          }
          onCancel={() => {
            setShowTransactionForm(false)
            setEditingTransaction(null)
          }}
        />
      )}

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