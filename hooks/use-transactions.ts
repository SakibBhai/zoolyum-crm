import { useState, useEffect, useCallback } from 'react'
import { Transaction } from '@/components/finance/finance-overview'
import {
  transactionsService,
  TransactionFilters,
  TransactionSortOptions,
  PaginationOptions,
  TransactionResponse,
  FinancialSummary,
  TransactionCategory
} from '@/lib/services/transactions'
import { useToast } from '@/components/ui/use-toast'

export interface UseTransactionsOptions {
  filters?: TransactionFilters
  sort?: TransactionSortOptions
  pagination?: PaginationOptions
  autoFetch?: boolean
}

export interface UseTransactionsReturn {
  // Data
  transactions: Transaction[]
  total: number
  page: number
  totalPages: number
  financialSummary: FinancialSummary | null
  categories: TransactionCategory[]
  
  // Loading states
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  
  // Error states
  error: string | null
  
  // Actions
  fetchTransactions: () => Promise<void>
  createTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<Transaction | null>
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<Transaction | null>
  deleteTransaction: (id: string) => Promise<boolean>
  fetchFinancialSummary: () => Promise<void>
  fetchCategories: (type?: 'income' | 'expense') => Promise<void>
  
  // Utilities
  refetch: () => Promise<void>
  setFilters: (filters: TransactionFilters) => void
  setSort: (sort: TransactionSortOptions) => void
  setPagination: (pagination: PaginationOptions) => void
}

export function useTransactions(options: UseTransactionsOptions = {}): UseTransactionsReturn {
  const { toast } = useToast()
  const {
    filters: initialFilters = {},
    sort: initialSort = { sortBy: 'date', sortOrder: 'desc' },
    pagination: initialPagination = { page: 1, limit: 10 },
    autoFetch = true
  } = options

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(initialPagination.page || 1)
  const [totalPages, setTotalPages] = useState(0)
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Error state
  const [error, setError] = useState<string | null>(null)
  
  // Filters and options
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters)
  const [sort, setSort] = useState<TransactionSortOptions>(initialSort)
  const [pagination, setPagination] = useState<PaginationOptions>(initialPagination)

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await transactionsService.getTransactions(filters, sort, pagination)
      
      setTransactions(response.transactions)
      setTotal(response.total)
      setPage(response.page)
      setTotalPages(response.totalPages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [filters, sort, pagination, toast])

  // Create transaction
  const createTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Transaction | null> => {
    try {
      setCreating(true)
      setError(null)
      
      const newTransaction = await transactionsService.createTransaction(transaction)
      
      // Refresh the list
      await fetchTransactions()
      
      toast({
        title: 'Success',
        description: `${transaction.type === 'income' ? 'Income' : 'Expense'} of ৳${transaction.amount.toFixed(2)} has been recorded.`
      })
      
      return newTransaction
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create transaction'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    } finally {
      setCreating(false)
    }
  }, [fetchTransactions, toast])

  // Update transaction
  const updateTransaction = useCallback(async (
    id: string,
    transaction: Partial<Transaction>
  ): Promise<Transaction | null> => {
    try {
      setUpdating(true)
      setError(null)
      
      const updatedTransaction = await transactionsService.updateTransaction(id, transaction)
      
      // Update the local state
      setTransactions(prev => 
        prev.map(t => t.id === id ? updatedTransaction : t)
      )
      
      toast({
        title: 'Success',
        description: 'Transaction has been updated successfully.'
      })
      
      return updatedTransaction
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    } finally {
      setUpdating(false)
    }
  }, [toast])

  // Delete transaction
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    try {
      setDeleting(true)
      setError(null)
      
      await transactionsService.deleteTransaction(id)
      
      // Remove from local state
      setTransactions(prev => prev.filter(t => t.id !== id))
      setTotal(prev => prev - 1)
      
      toast({
        title: 'Success',
        description: 'Transaction has been deleted successfully.',
        variant: 'destructive'
      })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    } finally {
      setDeleting(false)
    }
  }, [toast])

  // Fetch financial summary
  const fetchFinancialSummary = useCallback(async () => {
    try {
      setError(null)
      const summary = await transactionsService.getFinancialSummary(filters)
      setFinancialSummary(summary)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch financial summary'
      setError(errorMessage)
    }
  }, [filters])

  // Fetch categories
  const fetchCategories = useCallback(async (type?: 'income' | 'expense') => {
    try {
      setError(null)
      const categoriesData = await transactionsService.getCategories(type)
      setCategories(categoriesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories'
      setError(errorMessage)
    }
  }, [])

  // Refetch all data
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchTransactions(),
      fetchFinancialSummary(),
      fetchCategories()
    ])
  }, [fetchTransactions, fetchFinancialSummary, fetchCategories])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchTransactions()
    }
  }, [fetchTransactions, autoFetch])

  // Update pagination state when pagination prop changes
  useEffect(() => {
    setPage(pagination.page || 1)
  }, [pagination.page])

  return {
    // Data
    transactions,
    total,
    page,
    totalPages,
    financialSummary,
    categories,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error state
    error,
    
    // Actions
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchFinancialSummary,
    fetchCategories,
    
    // Utilities
    refetch,
    setFilters,
    setSort,
    setPagination
  }
}