"use client"

import { useState } from "react"
import type { Task } from "@/types/task"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface TaskReportPreviewProps {
  tasks: Task[]
  visibleColumns: Record<string, boolean>
  reportName: string
}

export function TaskReportPreview({ tasks, visibleColumns, reportName }: TaskReportPreviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Filter tasks by search query
  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calculate pagination
  const totalItems = filteredTasks.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const currentItems = filteredTasks.slice(startIndex, endIndex)

  // Priority badge color mapping
  const priorityColorMap: Record<string, string> = {
    Low: "bg-blue-100 text-blue-800",
    Medium: "bg-green-100 text-green-800",
    High: "bg-orange-100 text-orange-800",
    Urgent: "bg-red-100 text-red-800",
  }

  // Status badge color mapping
  const statusColorMap: Record<string, string> = {
    "Not Started": "bg-gray-100 text-gray-800",
    "In Progress": "bg-blue-100 text-blue-800",
    "In Review": "bg-purple-100 text-purple-800",
    Completed: "bg-green-100 text-green-800",
    "On Hold": "bg-orange-100 text-orange-800",
    Cancelled: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-4">
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
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{endIndex} of {totalItems} tasks
          </span>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.name && <TableHead>Task Name</TableHead>}
              {visibleColumns.status && <TableHead>Status</TableHead>}
              {visibleColumns.priority && <TableHead>Priority</TableHead>}
              {visibleColumns.assignedTo && <TableHead>Assigned To</TableHead>}
              {visibleColumns.project && <TableHead>Project</TableHead>}
              {visibleColumns.dueDate && <TableHead>Due Date</TableHead>}
              {visibleColumns.category && <TableHead>Category</TableHead>}
              {visibleColumns.details && <TableHead>Details</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((task) => (
                <TableRow key={task.id}>
                  {visibleColumns.name && <TableCell className="font-medium">{task.name}</TableCell>}
                  {visibleColumns.status && (
                    <TableCell>
                      <Badge className={statusColorMap[task.status] || "bg-gray-100"}>{task.status}</Badge>
                    </TableCell>
                  )}
                  {visibleColumns.priority && (
                    <TableCell>
                      <Badge className={priorityColorMap[task.priority] || "bg-gray-100"}>{task.priority}</Badge>
                    </TableCell>
                  )}
                  {visibleColumns.assignedTo && <TableCell>{task.assignedTo}</TableCell>}
                  {visibleColumns.project && <TableCell>{task.project}</TableCell>}
                  {visibleColumns.dueDate && <TableCell>{task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}</TableCell>}
                  {visibleColumns.category && <TableCell>{task.category}</TableCell>}
                  {visibleColumns.details && (
                    <TableCell className="max-w-xs truncate">{task.details || "No details provided"}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
