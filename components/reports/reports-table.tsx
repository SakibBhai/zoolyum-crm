"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, FileText, Building, FolderKanban, Calendar, User } from "lucide-react"
import Link from "next/link"
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

// Mock data
const reports = [
  {
    id: "1",
    title: "ABC Apparel - May Social Media Performance",
    client: "ABC Apparel",
    clientId: "1",
    project: "Summer Collection Campaign",
    projectId: "1",
    period: "May 1-31, 2023",
    createdBy: "Sarah Johnson",
    reviewedBy: "Michael Chen",
    submissionDate: "June 2, 2023",
    pdfLink: "#",
  },
  {
    id: "2",
    title: "XYZ Corp - Q2 Marketing Results",
    client: "XYZ Corporation",
    clientId: "2",
    project: "Q2 Marketing Campaign",
    projectId: "4",
    period: "April 1 - June 30, 2023",
    createdBy: "David Kim",
    reviewedBy: "Sarah Johnson",
    submissionDate: "July 5, 2023",
    pdfLink: "#",
  },
  {
    id: "3",
    title: "123 Industries - Website Traffic Analysis",
    client: "123 Industries",
    clientId: "3",
    project: "Website Redesign",
    projectId: "2",
    period: "Q2 2023",
    createdBy: "Emily Rodriguez",
    reviewedBy: "Michael Chen",
    submissionDate: "July 10, 2023",
    pdfLink: "#",
  },
  {
    id: "4",
    title: "ABC Apparel - April Social Media Performance",
    client: "ABC Apparel",
    clientId: "1",
    project: "Summer Collection Campaign",
    projectId: "1",
    period: "April 1-30, 2023",
    createdBy: "Sarah Johnson",
    reviewedBy: "Michael Chen",
    submissionDate: "May 5, 2023",
    pdfLink: "#",
  },
  {
    id: "5",
    title: "XYZ Corp - Q1 Marketing Results",
    client: "XYZ Corporation",
    clientId: "2",
    project: "Q1 Marketing Campaign",
    projectId: "4",
    period: "January 1 - March 31, 2023",
    createdBy: "David Kim",
    reviewedBy: "Sarah Johnson",
    submissionDate: "April 10, 2023",
    pdfLink: "#",
  },
  {
    id: "6",
    title: "Urban Outfitters - Brand Audit",
    client: "Urban Outfitters",
    clientId: "8",
    project: "Brand Identity Refresh",
    projectId: "3",
    period: "Q1 2023",
    createdBy: "Emily Rodriguez",
    reviewedBy: "Sarah Johnson",
    submissionDate: "April 15, 2023",
    pdfLink: "#",
  },
  {
    id: "7",
    title: "Eco Friendly - Content Strategy Results",
    client: "Eco Friendly",
    clientId: "9",
    project: "Content Strategy",
    projectId: "10",
    period: "Q2 2023",
    createdBy: "David Kim",
    reviewedBy: "Michael Chen",
    submissionDate: "July 20, 2023",
    pdfLink: "#",
  },
  {
    id: "8",
    title: "Tech Innovations - SEO Performance",
    client: "Tech Innovations",
    clientId: "6",
    project: "SEO Optimization",
    projectId: "8",
    period: "May 1-31, 2023",
    createdBy: "David Kim",
    reviewedBy: "Sarah Johnson",
    submissionDate: "June 10, 2023",
    pdfLink: "#",
  },
  {
    id: "9",
    title: "Creative Solutions - Social Media Audit Results",
    client: "Creative Solutions",
    clientId: "7",
    project: "Social Media Audit",
    projectId: "9",
    period: "May 1-20, 2023",
    createdBy: "Jessica Lee",
    reviewedBy: "Sarah Johnson",
    submissionDate: "May 25, 2023",
    pdfLink: "#",
  },
  {
    id: "10",
    title: "ABC Apparel - Influencer Campaign Proposal",
    client: "ABC Apparel",
    clientId: "1",
    project: "Influencer Campaign",
    projectId: "12",
    period: "Q3 2023",
    createdBy: "Sarah Johnson",
    reviewedBy: "Michael Chen",
    submissionDate: "June 15, 2023",
    pdfLink: "#",
  },
  {
    id: "11",
    title: "Global Services - Marketing Strategy",
    client: "Global Services",
    clientId: "5",
    project: "Email Marketing Campaign",
    projectId: "7",
    period: "Q2 2023",
    createdBy: "Sarah Johnson",
    reviewedBy: "David Kim",
    submissionDate: "June 20, 2023",
    pdfLink: "#",
  },
  {
    id: "12",
    title: "XYZ Corp - Annual Report Design Preview",
    client: "XYZ Corporation",
    clientId: "2",
    project: "Annual Report Design",
    projectId: "6",
    period: "2023",
    createdBy: "Michael Chen",
    reviewedBy: "Sarah Johnson",
    submissionDate: "July 15, 2023",
    pdfLink: "#",
  },
]

export function ReportsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const filteredReports = reports.filter(
    (report) =>
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.period.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calculate pagination
  const totalItems = filteredReports.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const currentItems = filteredReports.slice(startIndex, endIndex)

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to first page when searching
            }}
            className="max-w-sm"
          />
        </div>
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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Report Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No reports found.
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/dashboard/reports/${report.id}`} className="hover:underline">
                        {report.title}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/dashboard/clients/${report.clientId}`} className="hover:underline">
                        {report.client}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/dashboard/projects/${report.projectId}`} className="hover:underline">
                        {report.project}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {report.period}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {report.createdBy}
                    </div>
                  </TableCell>
                  <TableCell>{report.submissionDate}</TableCell>
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
                          <Link href={`/dashboard/reports/${report.id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/reports/${report.id}/edit`}>Edit report</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={report.pdfLink} target="_blank">
                            Download PDF
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete report</DropdownMenuItem>
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
          Showing {startIndex + 1} to {endIndex} of {totalItems} reports
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
  )
}
