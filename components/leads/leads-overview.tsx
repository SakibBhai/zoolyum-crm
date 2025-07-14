"use client"

import { useState, useMemo } from "react"
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

export interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  position: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  assignedTo: string
  value: number
  notes: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  lastContactDate?: Date
  nextFollowUp?: Date
  location: string
  industry: string
  leadScore: number
}

export interface Activity {
  id: string
  leadId: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  subject: string
  description: string
  date: Date
  duration?: number
  outcome?: string
  nextAction?: string
  createdBy: string
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
  const [leads, setLeads] = useState<Lead[]>([])
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

  // Sample data initialization
  useState(() => {
    const sampleLeads: Lead[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        company: 'Tech Solutions Inc',
        position: 'CTO',
        source: 'Website',
        status: 'qualified',
        assignedTo: 'Sarah Johnson',
        value: 50000,
        notes: 'Interested in enterprise solution',
        tags: ['enterprise', 'high-value'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        lastContactDate: new Date('2024-01-18'),
        nextFollowUp: new Date('2024-01-25'),
        location: 'New York',
        industry: 'Technology',
        leadScore: 85
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '+1-555-0456',
        company: 'Marketing Pro',
        position: 'Marketing Director',
        source: 'Social Media',
        status: 'contacted',
        assignedTo: 'John Smith',
        value: 25000,
        notes: 'Looking for marketing automation tools',
        tags: ['marketing', 'automation'],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15'),
        lastContactDate: new Date('2024-01-12'),
        nextFollowUp: new Date('2024-01-22'),
        location: 'California',
        industry: 'Marketing',
        leadScore: 72
      }
    ]
    setLeads(sampleLeads)
  })

  // Filter and search leads
  const filteredLeads = useMemo(() => {
    let filtered = leads.filter(lead => {
      const matchesSearch = searchTerm === '' || 
        `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = filters.status === 'all' || lead.status === filters.status
      const matchesSource = filters.source === 'all' || lead.source === filters.source
      const matchesAssignedTo = filters.assignedTo === 'all' || lead.assignedTo === filters.assignedTo
      const matchesLocation = filters.location === 'all' || lead.location === filters.location
      const matchesIndustry = filters.industry === 'all' || lead.industry === filters.industry

      const matchesTags = filters.tags.length === 0 || 
        filters.tags.some(tag => lead.tags.includes(tag))

      const matchesDateRange = !filters.dateRange.from || !filters.dateRange.to ||
        (lead.createdAt >= filters.dateRange.from && lead.createdAt <= filters.dateRange.to)

      const matchesValueRange = 
        (filters.valueRange.min === null || lead.value >= filters.valueRange.min) &&
        (filters.valueRange.max === null || lead.value <= filters.valueRange.max)

      const matchesLeadScore = 
        (filters.leadScore.min === null || lead.leadScore >= filters.leadScore.min) &&
        (filters.leadScore.max === null || lead.leadScore <= filters.leadScore.max)

      return matchesSearch && matchesStatus && matchesSource && matchesAssignedTo &&
             matchesLocation && matchesIndustry && matchesTags && matchesDateRange &&
             matchesValueRange && matchesLeadScore
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'createdAt':
        case 'updatedAt':
          aValue = new Date(a[filters.sortBy]).getTime()
          bValue = new Date(b[filters.sortBy]).getTime()
          break
        case 'lastName':
          aValue = a.lastName.toLowerCase()
          bValue = b.lastName.toLowerCase()
          break
        case 'value':
        case 'leadScore':
          aValue = a[filters.sortBy]
          bValue = b[filters.sortBy]
          break
        default:
          return 0
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [leads, searchTerm, filters])

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalLeads = leads.length
    const qualifiedLeads = leads.filter(l => ['qualified', 'proposal', 'negotiation'].includes(l.status)).length
    const closedWonLeads = leads.filter(l => l.status === 'closed-won').length
    const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0)
    const conversionRate = totalLeads > 0 ? (closedWonLeads / totalLeads) * 100 : 0
    const avgLeadScore = totalLeads > 0 ? leads.reduce((sum, lead) => sum + lead.leadScore, 0) / totalLeads : 0

    return {
      totalLeads,
      qualifiedLeads,
      closedWonLeads,
      totalValue,
      conversionRate,
      avgLeadScore
    }
  }, [leads])

  const handleAddLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setLeads(prev => [newLead, ...prev])
    setShowLeadForm(false)
    toast({
      title: "Lead Added",
      description: `${newLead.firstName} ${newLead.lastName} has been added successfully.`,
    })
  }

  const handleEditLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingLead) return
    
    const updatedLead: Lead = {
      ...leadData,
      id: editingLead.id,
      createdAt: editingLead.createdAt,
      updatedAt: new Date()
    }
    
    setLeads(prev => prev.map(lead => 
      lead.id === editingLead.id ? updatedLead : lead
    ))
    setEditingLead(null)
    toast({
      title: "Lead Updated",
      description: `${updatedLead.firstName} ${updatedLead.lastName} has been updated successfully.`,
    })
  }

  const handleDeleteLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    setLeads(prev => prev.filter(l => l.id !== leadId))
    setActivities(prev => prev.filter(a => a.leadId !== leadId))
    toast({
      title: "Lead Deleted",
      description: lead ? `${lead.firstName} ${lead.lastName} has been deleted.` : "Lead has been deleted.",
    })
  }

  const handleAddActivity = (activity: Omit<Activity, 'id'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString()
    }
    setActivities([...activities, newActivity])
  }

  const handleUpdateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities(activities.map(activity => 
      activity.id === id ? { ...activity, ...updates } : activity
    ))
  }

  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter(activity => activity.id !== id))
  }

  const handleBulkUpdateLeads = (leadIds: string[], updates: Partial<Lead>) => {
    setLeads(leads.map(lead => 
      leadIds.includes(lead.id) ? { ...lead, ...updates } : lead
    ))
  }

  const handleBulkAction = (action: string, leadIds: string[]) => {
    switch (action) {
      case 'delete':
        setLeads(prev => prev.filter(lead => !leadIds.includes(lead.id)))
        setActivities(prev => prev.filter(activity => !leadIds.includes(activity.leadId)))
        setSelectedLeads([])
        toast({
          title: "Leads Deleted",
          description: `${leadIds.length} leads have been deleted.`,
        })
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
        lead.createdAt.toISOString().split('T')[0]
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
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
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
                  {stats.qualifiedLeads}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalLeads > 0 ? ((stats.qualifiedLeads / stats.totalLeads) * 100).toFixed(1) : 0}% of total
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
                  {formatCurrency(stats.totalValue)}
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
                  {stats.conversionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.closedWonLeads} closed won
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