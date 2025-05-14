"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, CheckSquare, Calendar, User, FolderKanban, LinkIcon, Filter, X } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskContext } from "@/contexts/task-context"
import { TaskStatusSelect } from "./task-status-select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"

// Define filter types
type FilterState = {
  status: string[]
  priority: string[]
  assignedTo: string[]
  category: string[]
  project: string[]
  dueDateRange: {
    from: Date | undefined
    to: Date | undefined
  }
}

export function TasksTable() {
  const { tasks } = useTaskContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Initialize filter state
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    assignedTo: [],
    category: [],
    project: [],
    dueDateRange: {
      from: undefined,
      to: undefined,
    },
  })

  // Extract unique values for filter options
  const [filterOptions, setFilterOptions] = useState({
    status: [] as string[],
    priority: [] as string[],
    assignedTo: [] as string[],
    category: [] as string[],
    project: [] as string[],
  })

  // Update filter options when tasks change
  useEffect(() => {
    setFilterOptions({
      status: [...new Set(tasks.map((task) => task.status))],
      priority: [...new Set(tasks.map((task) => task.priority))],
      assignedTo: [...new Set(tasks.map((task) => task.assignedTo))],
      category: [...new Set(tasks.map((task) => task.category))],
      project: [...new Set(tasks.map((task) => task.project))],
    })
  }, [tasks])

  // Count active filters
  const activeFilterCount =
    filters.status.length +
    filters.priority.length +
    filters.assignedTo.length +
    filters.category.length +
    filters.project.length +
    (filters.dueDateRange.from || filters.dueDateRange.to ? 1 : 0)

  // Apply filters to tasks
  const filteredTasks = tasks.filter((task) => {
    // Text search filter
    const matchesSearch =
      searchQuery === "" ||
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.category.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = filters.status.length === 0 || filters.status.includes(task.status)

    // Priority filter
    const matchesPriority = filters.priority.length === 0 || filters.priority.includes(task.priority)

    // Assigned To filter
    const matchesAssignedTo = filters.assignedTo.length === 0 || filters.assignedTo.includes(task.assignedTo)

    // Category filter
    const matchesCategory = filters.category.length === 0 || filters.category.includes(task.category)

    // Project filter
    const matchesProject = filters.project.length === 0 || filters.project.includes(task.project)

    // Due Date Range filter
    let matchesDueDate = true
    if (filters.dueDateRange.from || filters.dueDateRange.to) {
      const taskDate = new Date(task.dueDate)

      if (filters.dueDateRange.from && filters.dueDateRange.to) {
        matchesDueDate = taskDate >= filters.dueDateRange.from && taskDate <= filters.dueDateRange.to
      } else if (filters.dueDateRange.from) {
        matchesDueDate = taskDate >= filters.dueDateRange.from
      } else if (filters.dueDateRange.to) {
        matchesDueDate = taskDate <= filters.dueDateRange.to
      }
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesAssignedTo &&
      matchesCategory &&
      matchesProject &&
      matchesDueDate
    )
  })

  // Handle filter changes
  const handleFilterChange = (filterType: keyof Omit<FilterState, "dueDateRange">, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[filterType]

      // If value is already selected, remove it, otherwise add it
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value]

      return {
        ...prev,
        [filterType]: newValues,
      }
    })

    // Reset to first page when filters change
    setCurrentPage(1)
  }

  // Handle date range filter changes
  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setFilters((prev) => ({
      ...prev,
      dueDateRange: range,
    }))

    // Reset to first page when filters change
    setCurrentPage(1)
  }

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      status: [],
      priority: [],
      assignedTo: [],
      category: [],
      project: [],
      dueDateRange: {
        from: undefined,
        to: undefined,
      },
    })
  }

  // Clear a specific filter type
  const clearFilter = (filterType: keyof FilterState) => {
    if (filterType === "dueDateRange") {
      setFilters((prev) => ({
        ...prev,
        dueDateRange: {
          from: undefined,
          to: undefined,
        },
      }))
    } else {
      setFilters((prev) => ({
        ...prev,
        [filterType]: [],
      }))
    }
  }

  // Calculate pagination
  const totalItems = filteredTasks.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const currentItems = filteredTasks.slice(startIndex, endIndex)

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push("ellipsis1")
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis2")
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number.parseInt(value))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-blue-100 text-blue-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Check if a task has dependencies
  const hasDependencies = (task: (typeof tasks)[0]) => {
    // Check if this task has dependencies
    const hasDeps = task.dependencies && task.dependencies.length > 0

    // Check if other tasks depend on this task
    const isDependedOn = tasks.some((t) => t.dependencies?.some((dep) => dep.dependsOnTaskId === task.id))

    return hasDeps || isDependedOn
  }

  // Render active filters
  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {filters.status.length > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            Status: {filters.status.join(", ")}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => clearFilter("status")}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove status filter</span>
            </Button>
          </Badge>
        )}

        {filters.priority.length > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            Priority: {filters.priority.join(", ")}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => clearFilter("priority")}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove priority filter</span>
            </Button>
          </Badge>
        )}

        {filters.assignedTo.length > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            Assigned to: {filters.assignedTo.join(", ")}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => clearFilter("assignedTo")}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove assignee filter</span>
            </Button>
          </Badge>
        )}

        {filters.category.length > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            Category: {filters.category.join(", ")}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => clearFilter("category")}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove category filter</span>
            </Button>
          </Badge>
        )}

        {filters.project.length > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            Project: {filters.project.join(", ")}
            <Button variant="ghost" size="icon" className="h-4 w-4 p-0 ml-1" onClick={() => clearFilter("project")}>
              <X className="h-3 w-3" />
              <span className="sr-only">Remove project filter</span>
            </Button>
          </Badge>
        )}

        {(filters.dueDateRange.from || filters.dueDateRange.to) && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            Due date: {filters.dueDateRange.from ? format(filters.dueDateRange.from, "MMM d, yyyy") : "Any"}
            {" - "}
            {filters.dueDateRange.to ? format(filters.dueDateRange.to, "MMM d, yyyy") : "Any"}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => clearFilter("dueDateRange")}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove date filter</span>
            </Button>
          </Badge>
        )}

        {activeFilterCount > 1 && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAllFilters}>
            Clear all
          </Button>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
                className="max-w-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 pb-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filters</h4>
                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAllFilters}>
                          Clear all
                        </Button>
                      )}
                    </div>
                    <Separator className="my-4" />
                  </div>
                  <div className="max-h-[60vh] overflow-auto">
                    <Accordion type="multiple" className="px-4">
                      <AccordionItem value="status">
                        <AccordionTrigger className="py-2">Status</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {filterOptions.status.map((status) => (
                              <div key={status} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`status-${status}`}
                                  checked={filters.status.includes(status)}
                                  onCheckedChange={() => handleFilterChange("status", status)}
                                />
                                <Label htmlFor={`status-${status}`}>{status}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="priority">
                        <AccordionTrigger className="py-2">Priority</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {filterOptions.priority.map((priority) => (
                              <div key={priority} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`priority-${priority}`}
                                  checked={filters.priority.includes(priority)}
                                  onCheckedChange={() => handleFilterChange("priority", priority)}
                                />
                                <Label htmlFor={`priority-${priority}`}>
                                  <Badge className={`${getPriorityColor(priority)} font-normal`}>{priority}</Badge>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="assignedTo">
                        <AccordionTrigger className="py-2">Assigned To</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {filterOptions.assignedTo.map((assignee) => (
                              <div key={assignee} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`assignee-${assignee}`}
                                  checked={filters.assignedTo.includes(assignee)}
                                  onCheckedChange={() => handleFilterChange("assignedTo", assignee)}
                                />
                                <Label htmlFor={`assignee-${assignee}`}>{assignee}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="category">
                        <AccordionTrigger className="py-2">Category</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {filterOptions.category.map((category) => (
                              <div key={category} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`category-${category}`}
                                  checked={filters.category.includes(category)}
                                  onCheckedChange={() => handleFilterChange("category", category)}
                                />
                                <Label htmlFor={`category-${category}`}>{category}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="project">
                        <AccordionTrigger className="py-2">Project</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {filterOptions.project.map((project) => (
                              <div key={project} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`project-${project}`}
                                  checked={filters.project.includes(project)}
                                  onCheckedChange={() => handleFilterChange("project", project)}
                                />
                                <Label htmlFor={`project-${project}`}>{project}</Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="dueDate">
                        <AccordionTrigger className="py-2">Due Date Range</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>From</Label>
                              <DatePicker
                                selected={filters.dueDateRange.from}
                                onSelect={(date) =>
                                  handleDateRangeChange({
                                    from: date,
                                    to: filters.dueDateRange.to,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>To</Label>
                              <DatePicker
                                selected={filters.dueDateRange.to}
                                onSelect={(date) =>
                                  handleDateRangeChange({
                                    from: filters.dueDateRange.from,
                                    to: date,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                  <div className="p-4 flex justify-end">
                    <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder={itemsPerPage.toString()} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            </div>
          </div>

          {/* Active filters display */}
          {renderActiveFilters()}
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Task Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline">
                          {task.name}
                        </Link>
                        {hasDependencies(task) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <LinkIcon className="h-4 w-4 text-blue-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This task has dependencies</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        <Link href={`/dashboard/projects/${task.projectId}`} className="hover:underline">
                          {task.project}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{task.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {task.dueDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {task.assignedTo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <TaskStatusSelect taskId={task.id} currentStatus={task.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tasks/${task.id}`}>View details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/tasks/${task.id}/edit`}>Edit task</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Delete task</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {endIndex} of {totalItems} tasks
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {getPageNumbers().map((page, index) =>
                typeof page === "number" ? (
                  <PaginationItem key={index}>
                    <PaginationLink isActive={page === currentPage} onClick={() => handlePageChange(page)}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={index}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </TooltipProvider>
  )
}
