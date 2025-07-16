'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from './use-toast'

export interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  assignedTo?: string
  value: number
  notes?: string
  tags: string[]
  location?: string
  industry?: string
  leadScore: number
  lastContactDate?: string
  nextFollowUp?: string
  createdAt: string
  updatedAt: string
  activities?: Activity[]
}

export interface Activity {
  id: string
  leadId: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'follow-up'
  description: string
  date: string
  duration?: number
  outcome?: string
  nextAction?: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

export interface LeadsStats {
  overview: {
    totalLeads: number
    qualifiedLeads: number
    closedWonLeads: number
    closedLostLeads: number
    totalValue: number
    averageLeadScore: number
    averageLeadValue: number
    conversionRate: number
    qualificationRate: number
    recentActivitiesCount: number
  }
  distribution: {
    byStatus: Array<{ status: string; count: number; value: number }>
    bySource: Array<{ source: string; count: number; value: number }>
    byAssignee: Array<{ assignee: string; count: number; value: number }>
  }
  trends: {
    monthly: Array<{ month: string; count: number; total_value: number; won_count: number }>
    topSources: Array<{ source: string; wonCount: number; totalValue: number }>
  }
  pipeline: {
    stages: Array<{ stage: string; count: number; value: number }>
    totalPipelineValue: number
  }
}

export interface LeadsFilters {
  search?: string
  status?: string
  source?: string
  assignedTo?: string
  industry?: string
  location?: string
  tags?: string
  minValue?: number
  maxValue?: number
  minLeadScore?: number
  maxLeadScore?: number
  dateFrom?: string
  dateTo?: string
}

export interface LeadsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CreateLeadData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  position?: string
  source: string
  status?: Lead['status']
  assignedTo?: string
  value?: number
  notes?: string
  tags?: string[]
  location?: string
  industry?: string
  leadScore?: number
  lastContactDate?: string
  nextFollowUp?: string
}

export interface UpdateLeadData extends Partial<CreateLeadData> {}

export interface CreateActivityData {
  type: Activity['type']
  description: string
  date?: string
  duration?: number
  outcome?: string
  nextAction?: string
  priority?: Activity['priority']
}

export interface FilterOptions {
  status: string
  source: string
  assignedTo: string
  tags: string[]
  dateRange: { from: Date | null; to: Date | null }
  valueRange: { min: number | null; max: number | null }
  location: string
  industry: string
  leadScore: { min: number | null; max: number | null }
  sortBy: 'createdAt' | 'updatedAt' | 'value' | 'leadScore' | 'lastName'
  sortOrder: 'asc' | 'desc'
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadsStats | null>(null)
  const [pagination, setPagination] = useState<LeadsPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch leads with filters and pagination
  const fetchLeads = useCallback(async (
    filters: LeadsFilters = {},
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      })

      const response = await fetch(`/api/leads?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch leads')
      }

      setLeads(result.data.leads)
      setPagination(result.data.pagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leads'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch leads statistics
  const fetchStats = useCallback(async (filters: { dateFrom?: string; dateTo?: string; assignedTo?: string } = {}) => {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      )

      const response = await fetch(`/api/leads/stats?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch statistics')
      }

      setStats(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }, [])

  // Create a new lead
  const createLead = useCallback(async (data: CreateLeadData): Promise<Lead | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to create lead')
      }

      toast({
        title: 'Success',
        description: 'Lead created successfully'
      })

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lead'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Update a lead
  const updateLead = useCallback(async (id: string, data: UpdateLeadData): Promise<Lead | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to update lead')
      }

      // Update local state
      setLeads(prev => prev.map(lead => lead.id === id ? result.data : lead))

      toast({
        title: 'Success',
        description: 'Lead updated successfully'
      })

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lead'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete a lead
  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete lead')
      }

      // Update local state
      setLeads(prev => prev.filter(lead => lead.id !== id))

      toast({
        title: 'Success',
        description: 'Lead deleted successfully'
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete lead'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Bulk delete leads
  const bulkDeleteLeads = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/leads?ids=${ids.join(',')}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete leads')
      }

      // Update local state
      setLeads(prev => prev.filter(lead => !ids.includes(lead.id)))

      toast({
        title: 'Success',
        description: `${result.data.deletedCount} leads deleted successfully`
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete leads'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Get a specific lead
  const getLead = useCallback(async (id: string): Promise<Lead | null> => {
    try {
      const response = await fetch(`/api/leads/${id}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch lead')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lead'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    }
  }, [])

  // Create an activity for a lead
  const createActivity = useCallback(async (leadId: string, data: CreateActivityData): Promise<Activity | null> => {
    try {
      const response = await fetch(`/api/leads/${leadId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to create activity')
      }

      toast({
        title: 'Success',
        description: 'Activity created successfully'
      })

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create activity'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    }
  }, [])

  // Get activities for a lead
  const getActivities = useCallback(async (leadId: string, page: number = 1, limit: number = 20, type?: string): Promise<{ activities: Activity[]; pagination: LeadsPagination } | null> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(type && type !== 'all' ? { type } : {})
      })

      const response = await fetch(`/api/leads/${leadId}/activities?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch activities')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    }
  }, [])

  return {
    leads,
    stats,
    pagination,
    loading,
    error,
    fetchLeads,
    fetchStats,
    createLead,
    updateLead,
    deleteLead,
    bulkDeleteLeads,
    getLead,
    createActivity,
    getActivities
  }
}