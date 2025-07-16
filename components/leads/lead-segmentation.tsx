"use client"

import { useState, useMemo } from "react"
import {
  Tags,
  Plus,
  X,
  Filter,
  Users,
  Target,
  TrendingUp,
  Edit,
  Trash2,
  Save,
  Download
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Lead } from "@/hooks/use-leads"

interface LeadSegmentationProps {
  leads: Lead[]
  onUpdateLead: (id: string, updates: Partial<Lead>) => void
  onBulkUpdateLeads: (leadIds: string[], updates: Partial<Lead>) => void
}

interface Segment {
  id: string
  name: string
  description: string
  criteria: SegmentCriteria
  color: string
  createdAt: Date
}

interface SegmentCriteria {
  status?: string[]
  source?: string[]
  assignedTo?: string[]
  tags?: string[]
  leadScore?: { min?: number; max?: number }
  value?: { min?: number; max?: number }
  location?: string[]
  industry?: string[]
  createdAfter?: Date
  createdBefore?: Date
}

const PREDEFINED_TAGS = [
  'Hot Lead',
  'Cold Lead',
  'Warm Lead',
  'Enterprise',
  'SMB',
  'Startup',
  'Decision Maker',
  'Influencer',
  'Budget Confirmed',
  'Needs Assessment',
  'Competitor',
  'Referral',
  'Inbound',
  'Outbound',
  'Demo Requested',
  'Proposal Sent',
  'Follow-up Required',
  'High Priority',
  'Low Priority',
  'Technical Evaluation'
]

const SEGMENT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#6366f1', // indigo
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16'  // lime
]

export function LeadSegmentation({
  leads,
  onUpdateLead,
  onBulkUpdateLeads
}: LeadSegmentationProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false)
  const [isCreateSegmentDialogOpen, setIsCreateSegmentDialogOpen] = useState(false)
  const [segments, setSegments] = useState<Segment[]>([])
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  
  // Segment form state
  const [segmentForm, setSegmentForm] = useState({
    name: '',
    description: '',
    color: SEGMENT_COLORS[0],
    criteria: {
      status: [] as string[],
      source: [] as string[],
      assignedTo: [] as string[],
      tags: [] as string[],
      leadScore: { min: undefined as number | undefined, max: undefined as number | undefined },
      value: { min: undefined as number | undefined, max: undefined as number | undefined },
      location: [] as string[],
      industry: [] as string[]
    } as SegmentCriteria
  })

  // Get all unique tags from leads
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    leads.forEach(lead => {
      lead.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [leads])

  // Get tag usage statistics
  const tagStats = useMemo(() => {
    const stats = new Map<string, { count: number; leads: Lead[] }>()
    
    leads.forEach(lead => {
      lead.tags.forEach(tag => {
        if (!stats.has(tag)) {
          stats.set(tag, { count: 0, leads: [] })
        }
        const stat = stats.get(tag)!
        stat.count++
        stat.leads.push(lead)
      })
    })
    
    return Array.from(stats.entries())
      .map(([tag, data]) => ({ tag, ...data }))
      .sort((a, b) => b.count - a.count)
  }, [leads, allTags])

  // Get leads that match segment criteria
  const getSegmentLeads = (criteria: SegmentCriteria): Lead[] => {
    return leads.filter(lead => {
      // Status filter
      if (criteria.status && criteria.status.length > 0) {
        if (!criteria.status.includes(lead.status)) return false
      }
      
      // Source filter
      if (criteria.source && criteria.source.length > 0) {
        if (!criteria.source.includes(lead.source)) return false
      }
      
      // Assigned to filter
      if (criteria.assignedTo && criteria.assignedTo.length > 0) {
        if (!criteria.assignedTo.includes(lead.assignedTo)) return false
      }
      
      // Tags filter (lead must have at least one of the specified tags)
      if (criteria.tags && criteria.tags.length > 0) {
        if (!criteria.tags.some(tag => lead.tags.includes(tag))) return false
      }
      
      // Lead score filter
      if (criteria.leadScore) {
        if (criteria.leadScore.min !== undefined && lead.leadScore < criteria.leadScore.min) return false
        if (criteria.leadScore.max !== undefined && lead.leadScore > criteria.leadScore.max) return false
      }
      
      // Value filter
      if (criteria.value) {
        if (criteria.value.min !== undefined && lead.value < criteria.value.min) return false
        if (criteria.value.max !== undefined && lead.value > criteria.value.max) return false
      }
      
      // Location filter
      if (criteria.location && criteria.location.length > 0) {
        if (!criteria.location.includes(lead.location)) return false
      }
      
      // Industry filter
      if (criteria.industry && criteria.industry.length > 0) {
        if (!criteria.industry.includes(lead.industry)) return false
      }
      
      return true
    })
  }

  // Calculate segment statistics
  const segmentStats = useMemo(() => {
    return segments.map(segment => {
      const segmentLeads = getSegmentLeads(segment.criteria)
      const totalValue = segmentLeads.reduce((sum, lead) => sum + lead.value, 0)
      const avgLeadScore = segmentLeads.length > 0 
        ? segmentLeads.reduce((sum, lead) => sum + lead.leadScore, 0) / segmentLeads.length 
        : 0
      const conversionRate = segmentLeads.length > 0 
        ? (segmentLeads.filter(lead => lead.status === 'closed-won').length / segmentLeads.length) * 100 
        : 0
      
      return {
        ...segment,
        leadCount: segmentLeads.length,
        totalValue,
        avgLeadScore,
        conversionRate,
        leads: segmentLeads
      }
    })
  }, [segments, leads])

  const handleAddTag = (tag: string) => {
    if (!tag.trim() || selectedLeads.length === 0) return
    
    selectedLeads.forEach(leadId => {
      const lead = leads.find(l => l.id === leadId)
      if (lead && !lead.tags.includes(tag)) {
        onUpdateLead(leadId, {
          tags: [...lead.tags, tag]
        })
      }
    })
    
    setNewTag('')
    setIsAddTagDialogOpen(false)
    setSelectedLeads([])
  }

  const handleRemoveTag = (leadId: string, tagToRemove: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (lead) {
      onUpdateLead(leadId, {
        tags: lead.tags.filter(tag => tag !== tagToRemove)
      })
    }
  }

  const handleBulkRemoveTag = (tag: string) => {
    const affectedLeads = leads.filter(lead => lead.tags.includes(tag))
    affectedLeads.forEach(lead => {
      onUpdateLead(lead.id, {
        tags: lead.tags.filter(t => t !== tag)
      })
    })
  }

  const handleCreateSegment = () => {
    if (!segmentForm.name.trim()) return
    
    const newSegment: Segment = {
      id: Date.now().toString(),
      name: segmentForm.name,
      description: segmentForm.description,
      criteria: segmentForm.criteria,
      color: segmentForm.color,
      createdAt: new Date()
    }
    
    setSegments(prev => [...prev, newSegment])
    setIsCreateSegmentDialogOpen(false)
    resetSegmentForm()
  }

  const handleUpdateSegment = () => {
    if (!editingSegment || !segmentForm.name.trim()) return
    
    setSegments(prev => prev.map(segment => 
      segment.id === editingSegment.id 
        ? {
            ...segment,
            name: segmentForm.name,
            description: segmentForm.description,
            criteria: segmentForm.criteria,
            color: segmentForm.color
          }
        : segment
    ))
    
    setEditingSegment(null)
    resetSegmentForm()
  }

  const handleDeleteSegment = (segmentId: string) => {
    setSegments(prev => prev.filter(segment => segment.id !== segmentId))
  }

  const resetSegmentForm = () => {
    setSegmentForm({
      name: '',
      description: '',
      color: SEGMENT_COLORS[0],
      criteria: {
        status: [],
        source: [],
        assignedTo: [],
        tags: [],
        leadScore: { min: undefined, max: undefined },
        value: { min: undefined, max: undefined },
        location: [],
        industry: []
      }
    })
  }

  const openEditSegment = (segment: Segment) => {
    setEditingSegment(segment)
    setSegmentForm({
      name: segment.name,
      description: segment.description,
      color: segment.color,
      criteria: { ...segment.criteria }
    })
  }

  const exportSegmentLeads = (segment: Segment) => {
    const segmentLeads = getSegmentLeads(segment.criteria)
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Value', 'Lead Score', 'Tags'].join(','),
      ...segmentLeads.map(lead => [
        lead.name,
        lead.email,
        lead.phone,
        lead.company,
        lead.status,
        lead.source,
        lead.value,
        lead.leadScore,
        lead.tags.join('; ')
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${segment.name.replace(/\s+/g, '_')}_leads.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get unique values for filters
  const uniqueValues = useMemo(() => {
    return {
      statuses: [...new Set(leads.map(lead => lead.status))],
      sources: [...new Set(leads.map(lead => lead.source))],
      assignedTo: [...new Set(leads.map(lead => lead.assignedTo))],
      locations: [...new Set(leads.map(lead => lead.location))],
      industries: [...new Set(leads.map(lead => lead.industry))]
    }
  }, [leads])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tags" className="w-full">
        <TabsList>
          <TabsTrigger value="tags">Tags Management</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="bulk-actions">Bulk Actions</TabsTrigger>
        </TabsList>
        
        {/* Tags Management */}
        <TabsContent value="tags" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Tag Management</h3>
              <p className="text-sm text-muted-foreground">
                Organize and categorize your leads with tags
              </p>
            </div>
            
            <Dialog open={isAddTagDialogOpen} onOpenChange={setIsAddTagDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={selectedLeads.length === 0}>
                  <Tags className="h-4 w-4 mr-2" />
                  Add Tag to Selected ({selectedLeads.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tag to Selected Leads</DialogTitle>
                  <DialogDescription>
                    Add a tag to {selectedLeads.length} selected leads
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-tag">Tag Name</Label>
                    <Input
                      id="new-tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Enter tag name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quick Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_TAGS.map(tag => (
                        <Button
                          key={tag}
                          variant="outline"
                          size="sm"
                          onClick={() => setNewTag(tag)}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddTagDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleAddTag(newTag)}>
                    Add Tag
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Tag Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allTags.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tagged Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leads.filter(lead => lead.tags.length > 0).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Tags per Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leads.length > 0 
                    ? (leads.reduce((sum, lead) => sum + lead.tags.length, 0) / leads.length).toFixed(1)
                    : '0'
                  }
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tag List */}
          <Card>
            <CardHeader>
              <CardTitle>All Tags</CardTitle>
              <CardDescription>
                Click on tags to view associated leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tagStats.map(({ tag, count, leads: tagLeads }) => (
                  <div key={tag} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary">{tag}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {count} leads
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Leads ({count})
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80">
                          <div className="p-2 max-h-60 overflow-y-auto">
                            {tagLeads.map(lead => (
                              <div key={lead.id} className="p-2 hover:bg-muted rounded">
                                <div className="font-medium">{lead.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {lead.company} • {lead.status}
                                </div>
                              </div>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkRemoveTag(tag)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Leads with Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Leads with Tags</CardTitle>
              <CardDescription>
                Select leads to add or remove tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.filter(lead => lead.tags.length > 0).map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLeads(prev => [...prev, lead.id])
                          } else {
                            setSelectedLeads(prev => prev.filter(id => id !== lead.id))
                          }
                        }}
                      />
                      
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {lead.company} • {lead.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="relative group">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(lead.id, tag)}
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Segments */}
        <TabsContent value="segments" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Lead Segments</h3>
              <p className="text-sm text-muted-foreground">
                Create custom segments based on lead criteria
              </p>
            </div>
            
            <Dialog open={isCreateSegmentDialogOpen} onOpenChange={setIsCreateSegmentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Segment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Segment</DialogTitle>
                  <DialogDescription>
                    Define criteria to automatically group leads
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="segment-name">Segment Name</Label>
                    <Input
                      id="segment-name"
                      value={segmentForm.name}
                      onChange={(e) => setSegmentForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter segment name"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="segment-description">Description</Label>
                    <Textarea
                      id="segment-description"
                      value={segmentForm.description}
                      onChange={(e) => setSegmentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this segment"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      {SEGMENT_COLORS.map(color => (
                        <button
                          key={color}
                          className={`w-6 h-6 rounded-full border-2 ${
                            segmentForm.color === color ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSegmentForm(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Criteria</h4>
                    
                    {/* Status Filter */}
                    <div className="grid gap-2">
                      <Label>Status</Label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueValues.statuses.map(status => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              checked={segmentForm.criteria.status?.includes(status)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSegmentForm(prev => ({
                                    ...prev,
                                    criteria: {
                                      ...prev.criteria,
                                      status: [...(prev.criteria.status || []), status]
                                    }
                                  }))
                                } else {
                                  setSegmentForm(prev => ({
                                    ...prev,
                                    criteria: {
                                      ...prev.criteria,
                                      status: prev.criteria.status?.filter(s => s !== status)
                                    }
                                  }))
                                }
                              }}
                            />
                            <Label className="text-sm">{status}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Tags Filter */}
                    <div className="grid gap-2">
                      <Label>Tags (any of)</Label>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                          <div key={tag} className="flex items-center space-x-2">
                            <Checkbox
                              checked={segmentForm.criteria.tags?.includes(tag)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSegmentForm(prev => ({
                                    ...prev,
                                    criteria: {
                                      ...prev.criteria,
                                      tags: [...(prev.criteria.tags || []), tag]
                                    }
                                  }))
                                } else {
                                  setSegmentForm(prev => ({
                                    ...prev,
                                    criteria: {
                                      ...prev.criteria,
                                      tags: prev.criteria.tags?.filter(t => t !== tag)
                                    }
                                  }))
                                }
                              }}
                            />
                            <Label className="text-sm">{tag}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Lead Score Range */}
                    <div className="grid gap-2">
                      <Label>Lead Score Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min score"
                          value={segmentForm.criteria.leadScore?.min || ''}
                          onChange={(e) => setSegmentForm(prev => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              leadScore: {
                                ...prev.criteria.leadScore,
                                min: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            }
                          }))}
                        />
                        <Input
                          type="number"
                          placeholder="Max score"
                          value={segmentForm.criteria.leadScore?.max || ''}
                          onChange={(e) => setSegmentForm(prev => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              leadScore: {
                                ...prev.criteria.leadScore,
                                max: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                    
                    {/* Value Range */}
                    <div className="grid gap-2">
                      <Label>Lead Value Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min value"
                          value={segmentForm.criteria.value?.min || ''}
                          onChange={(e) => setSegmentForm(prev => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              value: {
                                ...prev.criteria.value,
                                min: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            }
                          }))}
                        />
                        <Input
                          type="number"
                          placeholder="Max value"
                          value={segmentForm.criteria.value?.max || ''}
                          onChange={(e) => setSegmentForm(prev => ({
                            ...prev,
                            criteria: {
                              ...prev.criteria,
                              value: {
                                ...prev.criteria.value,
                                max: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Preview: {getSegmentLeads(segmentForm.criteria).length} leads match these criteria
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateSegmentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSegment}>
                    Create Segment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Segments List */}
          <div className="grid gap-4">
            {segmentStats.map(segment => (
              <Card key={segment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <div>
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                        <CardDescription>{segment.description}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportSegmentLeads(segment)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditSegment(segment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSegment(segment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{segment.leadCount}</div>
                        <div className="text-sm text-muted-foreground">Leads</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{segment.avgLeadScore.toFixed(0)}</div>
                        <div className="text-sm text-muted-foreground">Avg Score</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{segment.conversionRate.toFixed(1)}%</div>
                        <div className="text-sm text-muted-foreground">Conversion</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="font-medium">
                          ${segment.totalValue.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Value</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Bulk Actions */}
        <TabsContent value="bulk-actions" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Bulk Actions</h3>
            <p className="text-sm text-muted-foreground">
              Perform actions on multiple leads at once
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Selected Leads ({selectedLeads.length})</CardTitle>
              <CardDescription>
                Select leads from the tags section to perform bulk actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedLeads.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No leads selected. Go to the Tags tab to select leads.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          onBulkUpdateLeads(selectedLeads, { status: 'qualified' })
                          setSelectedLeads([])
                        }}
                      >
                        Mark as Qualified
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          onBulkUpdateLeads(selectedLeads, { status: 'contacted' })
                          setSelectedLeads([])
                        }}
                      >
                        Mark as Contacted
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          const assignedTo = prompt('Assign to:')
                          if (assignedTo) {
                            onBulkUpdateLeads(selectedLeads, { assignedTo })
                            setSelectedLeads([])
                          }
                        }}
                      >
                        Assign To
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => setIsAddTagDialogOpen(true)}
                      >
                        Add Tag
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Selected leads:
                      <div className="mt-2 space-y-1">
                        {selectedLeads.map(leadId => {
                          const lead = leads.find(l => l.id === leadId)
                          return lead ? (
                            <div key={leadId} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span>{lead.name} - {lead.company}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLeads(prev => prev.filter(id => id !== leadId))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Segment Dialog */}
      {editingSegment && (
        <Dialog open={!!editingSegment} onOpenChange={() => setEditingSegment(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Segment</DialogTitle>
              <DialogDescription>
                Update segment criteria and settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="edit-segment-name">Segment Name</Label>
                <Input
                  id="edit-segment-name"
                  value={segmentForm.name}
                  onChange={(e) => setSegmentForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-segment-description">Description</Label>
                <Textarea
                  id="edit-segment-description"
                  value={segmentForm.description}
                  onChange={(e) => setSegmentForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Preview: {getSegmentLeads(segmentForm.criteria).length} leads match these criteria
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSegment(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSegment}>
                <Save className="h-4 w-4 mr-2" />
                Update Segment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}