"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, Download, Filter, Search, Target, TrendingUp, Users, Phone, Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { LeadForm } from "./lead-form"
import { LeadsList } from "./leads-list"
import { LeadFilters } from "./lead-filters"
import { LeadAnalytics } from "./lead-analytics"
import { ActivityTracker } from "./activity-tracker"
import { LeadSegmentation } from "./lead-segmentation"
import { useLeads, Lead, Activity, FilterOptions } from "@/hooks/use-leads"



const LEAD_SOURCES = [
  'Website', 'Social Media', 'Email Campaign', 'Cold Call', 'Referral',
  'Trade Show', 'Advertisement', 'Partner', 'Direct Mail', 'Other'
]

const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
  { value: 'proposal', label: 'Proposal', color: 'bg-orange-500' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-indigo-500' },
  { value: 'closed-won', label: 'Closed Won', color: 'bg-green-500' },
  { value: 'closed-lost', label: 'Closed Lost', color: 'bg-red-500' },
]

const SALES_REPS = [
  'John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown', 'David Wilson'
]

export function LeadsOverview() {
  const { toast } = useToast()
  const {
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
  } = useLeads()
  
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    source: 'all',
    assignedTo: 'all',
    tags: [],
    dateRange: { from: null, to: null },
    valueRange: { min: null, max: null },
    location: 'all',
    industry: 'all',
    leadScore: { min: null, max: null },
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // Load initial data
  useEffect(() => {
    loadLeads()
    fetchStats()
  }, [])

  // Load leads with current filters
  const loadLeads = async () => {
    const leadsFilters = {
      search: searchTerm || undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      source: filters.source !== 'all' ? filters.source : undefined,
      assignedTo: filters.assignedTo !== 'all' ? filters.assignedTo : undefined,
      industry: filters.industry !== 'all' ? filters.industry : undefined,
      location: filters.location !== 'all' ? filters.location : undefined,
      minValue: filters.valueRange.min,
      maxValue: filters.valueRange.max,
      minLeadScore: filters.leadScore.min,
      maxLeadScore: filters.leadScore.max,
      dateFrom: filters.dateRange.from?.toISOString(),
      dateTo: filters.dateRange.to?.toISOString()
    }

    await fetchLeads(leadsFilters, 1, 50, filters.sortBy, filters.sortOrder)
  }

  // Reload leads when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadLeads()
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, filters])

  // Use leads from hook (already filtered by API)
  const filteredLeads = leads

  // Stats are now provided by the hook

  const handleAddLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createLead(leadData)
      setShowLeadForm(false)
      toast({
        title: "Lead Added",
        description: `${leadData.firstName} ${leadData.lastName} has been added successfully.`,
      })
      loadLeads() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add lead. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleEditLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingLead) return
    
    try {
      await updateLead(editingLead.id, leadData)
      setEditingLead(null)
      toast({
        title: "Lead Updated",
        description: `${leadData.firstName} ${leadData.lastName} has been updated successfully.`,
      })
      loadLeads() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    try {
      await deleteLead(leadId)
      toast({
        title: "Lead Deleted",
        description: lead ? `${lead.firstName} ${lead.lastName} has been deleted.` : "Lead has been deleted.",
      })
      loadLeads() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lead. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddActivity = async (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createActivity(activity.leadId, {
        type: activity.type,
        description: activity.description,
        date: activity.date,
        duration: activity.duration,
        outcome: activity.outcome,
        nextAction: activity.nextAction,
        priority: activity.priority
      })
      // Refresh activities for the lead
      const result = await getActivities(activity.leadId)
      if (result) {
        setActivities(result.activities)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add activity. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleUpdateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(activities.map(activity => 
      activity.id === id ? { ...activity, ...updates } : activity
    ))
  }

  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter(activity => activity.id !== id))
  }

  const handleBulkUpdateLeads = async (leadIds: string[], updates: Partial<Lead>) => {
    try {
      // Update each lead individually
      await Promise.all(leadIds.map(id => updateLead(id, updates)))
      loadLeads() // Refresh the list
      toast({
        title: "Leads Updated",
        description: `${leadIds.length} leads have been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update leads. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleBulkAction = async (action: string, leadIds: string[]) => {
    switch (action) {
      case 'delete':
        try {
          await bulkDeleteLeads(leadIds)
          setSelectedLeads([])
          toast({
            title: "Leads Deleted",
            description: `${leadIds.length} leads have been deleted.`,
          })
          loadLeads() // Refresh the list
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to delete leads. Please try again.",
            variant: "destructive"
          })
        }
        break
      case 'export':
        exportLeads(leads.filter(lead => leadIds.includes(lead.id)))
        break
    }
  }

  const exportLeads = (leadsToExport: Lead[]) => {
    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Position', 'Source', 'Status', 'Assigned To', 'Value', 'Lead Score', 'Location', 'Industry', 'Created At'].join(','),
      ...leadsToExport.map(lead => [
        lead.firstName,
        lead.lastName,
        lead.email,
        lead.phone,
        lead.company,
        lead.position,
        lead.source,
        lead.status,
        lead.assignedTo,
        lead.value,
        lead.leadScore,
        lead.location,
        lead.industry,
        new Date(lead.createdAt).toISOString().split('T')[0]
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: `${leadsToExport.length} leads exported successfully.`,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => exportLeads(filteredLeads)}
            disabled={filteredLeads.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowLeadForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">All Leads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredLeads.length} filtered
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.qualifiedLeads || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.totalLeads || 0) > 0 ? (((stats?.qualifiedLeads || 0) / (stats?.totalLeads || 1)) * 100).toFixed(1) : 0}% of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.totalValue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total potential revenue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.conversionRate || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.closedWonLeads || 0} closed won
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>
                Latest leads added to your pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsList
                leads={filteredLeads.slice(0, 5)}
                onEdit={setEditingLead}
                onDelete={handleDeleteLead}
                selectedLeads={selectedLeads}
                onSelectionChange={setSelectedLeads}
                showPagination={false}
                compact={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          {/* Filters */}
          {showFilters && (
            <Card>
              <CardHeader>
                <CardTitle>Filter Leads</CardTitle>
                <CardDescription>
                  Use filters to find specific leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeadFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  leads={leads}
                  sources={LEAD_SOURCES}
                  statuses={LEAD_STATUSES}
                  salesReps={SALES_REPS}
                />
              </CardContent>
            </Card>
          )}

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedLeads.length} lead(s) selected
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('export', selectedLeads)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Selected
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkAction('delete', selectedLeads)}
                    >
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leads List */}
          <LeadsList
            leads={filteredLeads}
            onEdit={setEditingLead}
            onDelete={handleDeleteLead}
            selectedLeads={selectedLeads}
            onSelectionChange={setSelectedLeads}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <LeadAnalytics leads={filteredLeads} activities={activities} />
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <ActivityTracker
            leads={leads}
            activities={activities}
            onAddActivity={handleAddActivity}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={handleDeleteActivity}
          />
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <LeadSegmentation
            leads={leads}
            onUpdateLead={handleEditLead}
            onBulkUpdateLeads={handleBulkUpdateLeads}
          />
        </TabsContent>
      </Tabs>

      {/* Lead Form Dialog */}
      <LeadForm
        open={showLeadForm || !!editingLead}
        onOpenChange={(open) => {
          if (!open) {
            setShowLeadForm(false)
            setEditingLead(null)
          }
        }}
        onSubmit={editingLead ? handleEditLead : handleAddLead}
        initialData={editingLead}
        sources={LEAD_SOURCES}
        statuses={LEAD_STATUSES}
        salesReps={SALES_REPS}
      />
    </div>
  )
}