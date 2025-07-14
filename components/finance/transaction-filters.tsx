"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Transaction, FilterOptions } from "./finance-overview"

interface TransactionFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  transactions: Transaction[]
}

export function TransactionFilters({ filters, onFiltersChange, transactions }: TransactionFiltersProps) {
  const [dateFromOpen, setDateFromOpen] = useState(false)
  const [dateToOpen, setDateToOpen] = useState(false)

  // Get unique categories from transactions
  const allCategories = Array.from(new Set(transactions.map(t => t.category))).sort()

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleDateRangeChange = (type: 'from' | 'to', date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [type]: date || null
      }
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      type: 'all',
      category: 'all',
      dateRange: { from: null, to: null },
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = 
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.dateRange.from !== null ||
    filters.dateRange.to !== null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Transaction Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type-filter">Transaction Type</Label>
          <Select 
            value={filters.type} 
            onValueChange={(value) => handleFilterChange('type', value)}
          >
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income Only</SelectItem>
              <SelectItem value="expense">Expenses Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category-filter">Category</Label>
          <Select 
            value={filters.category} 
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sort-filter">Sort By</Label>
          <Select 
            value={filters.sortBy} 
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger id="sort-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="order-filter">Sort Order</Label>
          <Select 
            value={filters.sortOrder} 
            onValueChange={(value) => handleFilterChange('sortOrder', value)}
          >
            <SelectTrigger id="order-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Date Range Filter */}
      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.from ? (
                    format(filters.dateRange.from, "PPP")
                  ) : (
                    <span>From date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from || undefined}
                  onSelect={(date) => {
                    handleDateRangeChange('from', date)
                    setDateFromOpen(false)
                  }}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex-1">
            <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.to ? (
                    format(filters.dateRange.to, "PPP")
                  ) : (
                    <span>To date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to || undefined}
                  onSelect={(date) => {
                    handleDateRangeChange('to', date)
                    setDateToOpen(false)
                  }}
                  disabled={(date) =>
                    date > new Date() || 
                    date < new Date("1900-01-01") ||
                    (filters.dateRange.from && date < filters.dateRange.from)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={clearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          <p>Active filters:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {filters.type !== 'all' && (
              <li>Type: {filters.type === 'income' ? 'Income' : 'Expenses'}</li>
            )}
            {filters.category !== 'all' && (
              <li>Category: {filters.category}</li>
            )}
            {filters.dateRange.from && (
              <li>From: {format(filters.dateRange.from, "PPP")}</li>
            )}
            {filters.dateRange.to && (
              <li>To: {format(filters.dateRange.to, "PPP")}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}