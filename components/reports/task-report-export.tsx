"use client"

import { useState } from "react"
import type { Task } from "@/types/task"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileText, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface TaskReportExportProps {
  tasks: Task[]
  visibleColumns: Record<string, boolean>
  reportName: string
}

export function TaskReportExport({ tasks, visibleColumns, reportName }: TaskReportExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  // Export to CSV
  const exportToCSV = () => {
    setIsExporting(true)

    try {
      // Create header row based on visible columns
      const headers = Object.entries(visibleColumns)
        .filter(([_, isVisible]) => isVisible)
        .map(([column]) => {
          if (column === "assignedTo") return "Assigned To"
          if (column === "dueDate") return "Due Date"
          return column.charAt(0).toUpperCase() + column.slice(1)
        })

      // Create data rows
      const rows = tasks.map((task) => {
        const row: string[] = []
        if (visibleColumns.name) row.push(task.name)
        if (visibleColumns.status) row.push(task.status)
        if (visibleColumns.priority) row.push(task.priority)
        if (visibleColumns.assignedTo) row.push(task.assignedTo)
        if (visibleColumns.project) row.push(task.project)
        if (visibleColumns.dueDate) row.push(format(new Date(task.dueDate), "yyyy-MM-dd"))
        if (visibleColumns.category) row.push(task.category)
        if (visibleColumns.details) row.push(task.details || "")
        return row
      })

      // Convert to CSV
      const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${reportName.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting to CSV:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // Export to PDF
  const exportToPDF = () => {
    setIsExporting(true)

    try {
      const doc = new jsPDF()

      // Add title
      doc.setFontSize(18)
      doc.text(reportName, 14, 22)

      // Add date
      doc.setFontSize(11)
      doc.text(`Generated on: ${format(new Date(), "MMMM d, yyyy")}`, 14, 30)

      // Add summary
      doc.setFontSize(12)
      doc.text(`Total Tasks: ${tasks.length}`, 14, 40)

      // Create table headers based on visible columns
      const headers = Object.entries(visibleColumns)
        .filter(([_, isVisible]) => isVisible)
        .map(([column]) => {
          if (column === "assignedTo") return "Assigned To"
          if (column === "dueDate") return "Due Date"
          return column.charAt(0).toUpperCase() + column.slice(1)
        })

      // Create table data
      const data = tasks.map((task) => {
        const row: string[] = []
        if (visibleColumns.name) row.push(task.name)
        if (visibleColumns.status) row.push(task.status)
        if (visibleColumns.priority) row.push(task.priority)
        if (visibleColumns.assignedTo) row.push(task.assignedTo)
        if (visibleColumns.project) row.push(task.project)
        if (visibleColumns.dueDate) row.push(format(new Date(task.dueDate), "MMM d, yyyy"))
        if (visibleColumns.category) row.push(task.category)
        if (visibleColumns.details) row.push(task.details || "")
        return row
      })

      // Generate table
      autoTable(doc, {
        head: [headers],
        body: data,
        startY: 50,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 66, 66] },
        columnStyles: {
          // Adjust column widths if needed
          0: { cellWidth: 40 }, // Task name
          7: { cellWidth: "auto" }, // Details (if visible)
        },
        didDrawPage: (data) => {
          // Add page number at the bottom
          doc.setFontSize(8)
          doc.text(`Page ${doc.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10)
        },
      })

      // Save PDF
      doc.save(`${reportName.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`)
    } catch (error) {
      console.error("Error exporting to PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
