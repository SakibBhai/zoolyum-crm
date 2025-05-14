"use client"

import { useState, useEffect } from "react"
import { useTaskContext } from "@/contexts/task-context"
import { useProjectContext } from "@/contexts/project-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskReportPreview } from "@/components/reports/task-report-preview"
import { TaskReportSummary } from "@/components/reports/task-report-summary"
import { TaskReportExport } from "@/components/reports/task-report-export"
import { BarChart3, Calendar, FileText, Filter, ListFilter, RefreshCw, TableIcon, Users } from "lucide-react"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths } from "date-fns"
import type { Task } from "@/types/task"

type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

type ReportFilters = {
  statuses: string[]
  priorities: string[]
  assignees: string[]
  projects: string[]
  dateRange: DateRange
  datePreset: string
}

export function TaskReportBuilder() {
  const { tasks } = useTaskContext()
  const { projects } = useProjectContext()
  const [activeTab, setActiveTab] = useState("filters")
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [reportName, setReportName] = useState("Task Report")

  // Get unique values for filter options
  const allStatuses = Array.from(new Set(tasks.map((task) => task.status)))
  const allPriorities = Array.from(new Set(tasks.map((task) => task.priority)))
  const allAssignees = Array.from(new Set(tasks.map((task) => task.assignedTo)))
  const allProjects = projects.map((project) => ({ id: project.id, name: project.name }))

  // Initialize filters
  const [filters, setFilters] = useState<ReportFilters>({
    statuses: [],
    priorities: [],
    assignees: [],
    projects: [],
    dateRange: { from: undefined, to: undefined },
    datePreset: "all",
  })

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    status: true,
    priority: true,
    assignedTo: true,
    project: true,
    dueDate: true,
    category: false,
    details: false,
  })

  // Apply filters to tasks
  useEffect(() => {
    let result = [...tasks]

    // Filter by status
    if (filters.statuses.length > 0) {
      result = result.filter((task) => filters.statuses.includes(task.status))
    }

    // Filter by priority
    if (filters.priorities.length > 0) {
      result = result.filter((task) => filters.priorities.includes(task.priority))
    }

    // Filter by assignee
    if (filters.assignees.length > 0) {
      result = result.filter((task) => filters.assignees.includes(task.assignedTo))
    }

    // Filter by project
    if (filters.projects.length > 0) {
      result = result.filter((task) => filters.projects.includes(task.projectId))
    }

    // Filter by date range
    if (filters.dateRange.from && filters.dateRange.to) {
      const fromDate = startOfDay(filters.dateRange.from)
      const toDate = endOfDay(filters.dateRange.to)
      result = result.filter((task) => {
        const taskDate = new Date(task.dueDate)
        return taskDate >= fromDate && taskDate <= toDate
      })
    }

    setFilteredTasks(result)
  }, [tasks, filters])

  // Handle date preset changes
  const handleDatePresetChange = (preset: string) => {
    const today = new Date()
    let newRange: DateRange = { from: undefined, to: undefined }

    switch (preset) {
      case "today":
        newRange = { from: today, to: today }
        break
      case "thisWeek":
        newRange = {
          from: startOfWeek(today, { weekStartsOn: 1 }),
          to: endOfWeek(today, { weekStartsOn: 1 }),
        }
        break
      case "thisMonth":
        newRange = { from: startOfMonth(today), to: endOfMonth(today) }
        break
      case "nextMonth":
        const nextMonth = addMonths(today, 1)
        newRange = { from: startOfMonth(nextMonth), to: endOfMonth(nextMonth) }
        break
      case "custom":
        // Keep the current custom range
        newRange = filters.dateRange
        break
      default:
        // "all" - no date filtering
        newRange = { from: undefined, to: undefined }
    }

    setFilters({
      ...filters,
      dateRange: newRange,
      datePreset: preset,
    })
  }

  // Toggle a filter value
  const toggleFilter = (type: keyof ReportFilters, value: string) => {
    if (type === "datePreset") {
      handleDatePresetChange(value)
      return
    }

    setFilters((prev) => {
      const currentValues = prev[type] as string[]
      return {
        ...prev,
        [type]: currentValues.includes(value) ? currentValues.filter((v) => v !== value) : [...currentValues, value],
      }
    })
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      statuses: [],
      priorities: [],
      assignees: [],
      projects: [],
      dateRange: { from: undefined, to: undefined },
      datePreset: "all",
    })
  }

  // Toggle column visibility
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }

  // Generate the report
  const generateReport = () => {
    setActiveTab("preview")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Task Report</CardTitle>
              <CardDescription>Configure and generate task reports</CardDescription>
            </div>
            <Input
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="max-w-xs"
              placeholder="Report Name"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="filters">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </TabsTrigger>
              <TabsTrigger value="preview">
                <TableIcon className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="summary">
                <BarChart3 className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Filter */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Filter by Status</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allStatuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.statuses.includes(status)}
                          onCheckedChange={() => toggleFilter("statuses", status)}
                        />
                        <Label htmlFor={`status-${status}`}>{status}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Filter by Priority</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allPriorities.map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={`priority-${priority}`}
                          checked={filters.priorities.includes(priority)}
                          onCheckedChange={() => toggleFilter("priorities", priority)}
                        />
                        <Label htmlFor={`priority-${priority}`}>{priority}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignee Filter */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Filter by Assignee</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allAssignees.map((assignee) => (
                      <div key={assignee} className="flex items-center space-x-2">
                        <Checkbox
                          id={`assignee-${assignee}`}
                          checked={filters.assignees.includes(assignee)}
                          onCheckedChange={() => toggleFilter("assignees", assignee)}
                        />
                        <Label htmlFor={`assignee-${assignee}`}>{assignee}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Filter */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Filter by Project</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {allProjects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`project-${project.id}`}
                          checked={filters.projects.includes(project.id)}
                          onCheckedChange={() => toggleFilter("projects", project.id)}
                        />
                        <Label htmlFor={`project-${project.id}`}>{project.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-4 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Filter by Due Date</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Select value={filters.datePreset} onValueChange={(value) => toggleFilter("datePreset", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="nextMonth">Next Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>

                    {filters.datePreset === "custom" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="date-from">From</Label>
                          <DatePicker
                            selected={filters.dateRange.from}
                            onSelect={(date) =>
                              setFilters({
                                ...filters,
                                dateRange: { ...filters.dateRange, from: date },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date-to">To</Label>
                          <DatePicker
                            selected={filters.dateRange.to}
                            onSelect={(date) =>
                              setFilters({
                                ...filters,
                                dateRange: { ...filters.dateRange, to: date },
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Column Visibility */}
                <div className="space-y-4 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Select Columns to Display</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(visibleColumns).map(([column, isVisible]) => (
                      <div key={column} className="flex items-center space-x-2">
                        <Checkbox
                          id={`column-${column}`}
                          checked={isVisible}
                          onCheckedChange={() => toggleColumn(column as keyof typeof visibleColumns)}
                        />
                        <Label htmlFor={`column-${column}`} className="capitalize">
                          {column === "assignedTo" ? "Assigned To" : column}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <TaskReportPreview tasks={filteredTasks} visibleColumns={visibleColumns} reportName={reportName} />
            </TabsContent>

            <TabsContent value="summary">
              <TaskReportSummary tasks={filteredTasks} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-between items-center border-t p-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filteredTasks.length} tasks match your filters</span>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          </div>
          <div className="flex gap-2">
            {activeTab === "filters" && <Button onClick={generateReport}>Generate Report</Button>}
            {(activeTab === "preview" || activeTab === "summary") && (
              <TaskReportExport tasks={filteredTasks} visibleColumns={visibleColumns} reportName={reportName} />
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
