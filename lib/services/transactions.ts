import { Transaction } from '@/components/finance/finance-overview'
import { EnhancedTransaction } from '@/components/finance/enhanced-transaction-form'

export interface TransactionFilters {
  type?: 'income' | 'expense'
  category?: string
  dateFrom?: string
  dateTo?: string
  projectId?: string
  clientId?: string
  status?: 'pending' | 'completed' | 'cancelled'
}

export interface TransactionSortOptions {
  sortBy?: 'date' | 'amount' | 'category' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface TransactionResponse {
  transactions: Transaction[]
  total: number
  page: number
  totalPages: number
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netAmount: number
  profitMargin: number
  monthlyAvgIncome: number
  monthlyAvgExpenses: number
  chartData: {
    month: string
    income: number
    expenses: number
    net: number
  }[]
  topIncomeCategories: {
    category: string
    amount: number
    count: number
  }[]
  topExpenseCategories: {
    category: string
    amount: number
    count: number
  }[]
}

export interface TransactionCategory {
  category: string
  type: 'income' | 'expense'
  total: number
  count: number
}

class TransactionsService {
  private baseUrl = '/api/transactions'

  async getTransactions(
    filters?: TransactionFilters,
    sort?: TransactionSortOptions,
    pagination?: PaginationOptions
  ): Promise<TransactionResponse> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }
    
    if (sort) {
      Object.entries(sort).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }
    
    if (pagination) {
      Object.entries(pagination).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`)
    }
    
    return response.json()
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to create transaction: ${response.statusText}`)
    }
    
    return response.json()
  }

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to update transaction: ${response.statusText}`)
    }
    
    return response.json()
  }

  async deleteTransaction(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete transaction: ${response.statusText}`)
    }
  }

  async getFinancialSummary(filters?: TransactionFilters): Promise<FinancialSummary> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }

    const url = params.toString() ? `${this.baseUrl}/summary?${params.toString()}` : `${this.baseUrl}/summary`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch financial summary: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getCategories(type?: 'income' | 'expense'): Promise<TransactionCategory[]> {
    const params = new URLSearchParams()
    if (type) {
      params.append('type', type)
    }

    const url = params.toString() ? `${this.baseUrl}/categories?${params.toString()}` : `${this.baseUrl}/categories`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }
    
    return response.json()
  }
}

export const transactionsService = new TransactionsService()