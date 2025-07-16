"use client"

import { useState } from "react"
import { CalendarIcon, X, Filter, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Lead, FilterOptions } from "@/hooks/use-leads"

interface LeadFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  leads: Lead[]
  sources: string[]
  statuses: Array<{ value: string; label: string; color: string }>
  salesReps: string[]
}

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Consulting', 'Marketing', 'Legal',
  'Non-profit', 'Government', 'Entertainment', 'Transportation', 'Other'
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'value', label: 'Lead Value' },
  { value: 'leadScore', label: 'Lead Score' },
  { value: 'lastName', label: 'Name' },
]

export function LeadFilters({
  filters,
  onFiltersChangeAction,
  leads,
  sources,
  statuses,
  salesReps
}: LeadFiltersProps) {
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Get unique values from leads for dynamic filter options
  const uniqueLocations = Array.from(new Set(leads.map(lead => lead.location))).filter(Boolean)
  const uniqueTags = Array.from(new Set(leads.flatMap(lead => lead.tags))).filter(Boolean)

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...tempFilters, [key]: value }
    setTempFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
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
    }
    setTempFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status !== 'all') count++
    if (filters.source !== 'all') count++
    if (filters.assignedTo !== 'all') count++
    if (filters.location !== 'all') count++
    if (filters.industry !== 'all') count++
    if (filters.tags.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.valueRange.min !== null || filters.valueRange.max !== null) count++
    if (filters.leadScore.min !== null || filters.leadScore.max !== null) count++
    return count
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = filters.tags.filter(tag => tag !== tagToRemove)
    updateFilter('tags', newTags)
  }

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilter('tags', [...filters.tags, tag])
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Source</Label>
          <Select
            value={filters.source}
            onValueChange={(value) => updateFilter('source', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assigned To</Label>
          <Select
            value={filters.assignedTo}
            onValueChange={(value) => updateFilter('assignedTo', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All reps" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Representatives</SelectItem>
              {salesReps.map((rep) => (
                <SelectItem key={rep} value={rep}>
                  {rep}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sort By</Label>
          <div className="flex space-x-2">
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilter('sortBy', value as any)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">↓</SelectItem>
                <SelectItem value="asc">↑</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          {getActiveFiltersCount() > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
        
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="flex items-center space-x-2 text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Filters</span>
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-6 p-4 border rounded-lg bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={filters.location}
                onValueChange={(value) => updateFilter('location', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industry Filter */}
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select
                value={filters.industry}
                onValueChange={(value) => updateFilter('industry', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        format(filters.dateRange.from, "MMM dd")
                      ) : (
                        "From"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from || undefined}
                      onSelect={(date) => 
                        updateFilter('dateRange', { ...filters.dateRange, from: date || null })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? (
                        format(filters.dateRange.to, "MMM dd")
                      ) : (
                        "To"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to || undefined}
                      onSelect={(date) => 
                        updateFilter('dateRange', { ...filters.dateRange, to: date || null })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Value Range */}
            <div className="space-y-2">
              <Label>Lead Value Range ($)</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.valueRange.min || ''}
                  onChange={(e) => 
                    updateFilter('valueRange', {
                      ...filters.valueRange,
                      min: e.target.value ? parseFloat(e.target.value) : null
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.valueRange.max || ''}
                  onChange={(e) => 
                    updateFilter('valueRange', {
                      ...filters.valueRange,
                      max: e.target.value ? parseFloat(e.target.value) : null
                    })
                  }
                />
              </div>
            </div>

            {/* Lead Score Range */}
            <div className="space-y-2">
              <Label>Lead Score Range (0-100)</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="100"
                  value={filters.leadScore.min || ''}
                  onChange={(e) => 
                    updateFilter('leadScore', {
                      ...filters.leadScore,
                      min: e.target.value ? parseInt(e.target.value) : null
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  min="0"
                  max="100"
                  value={filters.leadScore.max || ''}
                  onChange={(e) => 
                    updateFilter('leadScore', {
                      ...filters.leadScore,
                      max: e.target.value ? parseInt(e.target.value) : null
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="space-y-2">
              {/* Selected Tags */}
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Available Tags */}
              <div className="flex flex-wrap gap-1">
                {uniqueTags
                  .filter(tag => !filters.tags.includes(tag))
                  .slice(0, 10)
                  .map((tag) => (
                    <Button
                      key={tag}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => addTag(tag)}
                    >
                      + {tag}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {getActiveFiltersCount() > 0 && (
        <div className="space-y-2">
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {getActiveFiltersCount()} filter(s) active
            </span>
            <div className="flex flex-wrap gap-2">
              {filters.status !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Status: {statuses.find(s => s.value === filters.status)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('status', 'all')}
                  />
                </Badge>
              )}
              {filters.source !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Source: {filters.source}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('source', 'all')}
                  />
                </Badge>
              )}
              {filters.assignedTo !== 'all' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Assigned: {filters.assignedTo}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('assignedTo', 'all')}
                  />
                </Badge>
              )}
              {(filters.dateRange.from || filters.dateRange.to) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Date Range
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => updateFilter('dateRange', { from: null, to: null })}
                  />
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}