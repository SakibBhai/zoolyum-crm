"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  CreditCard
} from "lucide-react"
import { EnhancedTransactionForm, EnhancedTransaction } from "./enhanced-transaction-form"
import { TransactionForm, Transaction } from "./transaction-form"
import { TransactionList } from "./transaction-list"
import { FinancialSummary } from "./financial-summary"
import { MonthlyAudit } from "./monthly-audit"
import { TransactionFilters } from "./transaction-filters"
import { FinancialCharts } from "./financial-charts"
import { useToast } from "@/components/ui/use-toast"
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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [enhancedTransactions, setEnhancedTransactions] = useState<EnhancedTransaction[]>([])
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editingEnhancedTransaction, setEditingEnhancedTransaction] = useState<EnhancedTransaction | null>(null)
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [activeView, setActiveView] = useState<'standard' | 'enterprise'>('enterprise')

  // Load transactions from localStorage
  useEffect(() => {
    // Load standard transactions
    const savedTransactions = localStorage.getItem('finance-transactions')
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions))
      } catch (error) {
        console.error('Error loading transactions:', error)
      }
    }

    // Load enhanced transactions
    const savedEnhancedTransactions = localStorage.getItem('enhanced-finance-transactions')
    if (savedEnhancedTransactions) {
      try {
        setEnhancedTransactions(JSON.parse(savedEnhancedTransactions))
      } catch (error) {
        console.error('Error loading enhanced transactions:', error)
      }
    }
  }, [])

  // Save transactions to localStorage
  useEffect(() => {
    localStorage.setItem('finance-transactions', JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem('enhanced-finance-transactions', JSON.stringify(enhancedTransactions))
  }, [enhancedTransactions])

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
      description: `${transaction.type === 'income' ? 'Income' : 'Expense'} of ৳${transaction.amount.toFixed(2)} has been recorded.`,
    })
  }

  const handleAddEnhancedTransaction = (transaction: Omit<EnhancedTransaction, 'id' | 'createdAt'>) => {
    const newTransaction: EnhancedTransaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    }
    setEnhancedTransactions(prev => [newTransaction, ...prev])
    setShowEnhancedForm(false)
    toast({
      title: "✨ Enhanced Transaction Added",
      description: `${transaction.type === 'income' ? 'Income' : 'Expense'} of ${transaction.currency === 'BDT' ? '৳' : '$'}${transaction.amount.toLocaleString()} with enterprise features.`,
    })
  }

  const handleDeleteTransaction = (id: string) => {
    if (activeView === 'standard') {
      setTransactions(prev => prev.filter(t => t.id !== id))
    } else {
      setEnhancedTransactions(prev => prev.filter(t => t.id !== id))
    }
    toast({
      title: "Transaction Deleted",
      description: "Transaction has been successfully deleted.",
      variant: "destructive"
    })
  }

  const handleExportData = () => {
    const dataToExport = activeView === 'standard' ? transactions : enhancedTransactions
    const dataStr = JSON.stringify(dataToExport, null, 2)
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
  const currentTransactions = activeView === 'standard' ? transactions : enhancedTransactions
  
  const totalIncome = currentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = currentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const netBalance = totalIncome - totalExpenses

  // Enhanced transaction statistics
  const enhancedStats = {
    multiCurrency: enhancedTransactions.filter(t => t.currency !== 'BDT').length,
    recurring: enhancedTransactions.filter(t => t.isRecurring).length,
    confidential: enhancedTransactions.filter(t => t.isConfidential).length,
    withAttachments: enhancedTransactions.filter(t => t.attachments.length > 0).length,
    withVendors: enhancedTransactions.filter(t => t.vendorClient).length
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
              {currentTransactions.filter(t => t.type === 'income').length} transactions
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
              {currentTransactions.filter(t => t.type === 'expense').length} transactions
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
            <div className="text-2xl font-bold text-purple-600">{currentTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeView === 'enterprise' ? 'Enterprise' : 'Standard'} records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enterprise Stats */}
      {activeView === 'enterprise' && enhancedTransactions.length > 0 && (
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
            <Button onClick={() => setShowTransactionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
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
              transactions={activeView === 'standard' ? transactions : enhancedTransactions}
            />
          </CardContent>
        </Card>
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
          <TransactionList
            transactions={activeView === 'standard' ? transactions : enhancedTransactions}
            onEdit={activeView === 'standard' ? 
              (t) => { setEditingTransaction(t as Transaction); setShowTransactionForm(true); } :
              (t) => { setEditingEnhancedTransaction(t as EnhancedTransaction); setShowEnhancedForm(true); }
            }
            onDelete={handleDeleteTransaction}
            filters={filters}
          />
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
            (updatedTransaction) => {
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