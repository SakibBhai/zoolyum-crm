"use client"

import { useState } from "react"
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
import { MoreHorizontal, Search, Building, Briefcase } from "lucide-react"
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

// Mock data
const clients = [
  {
    id: "1",
    name: "ABC Apparel",
    industry: "Fashion",
    contact: "John Smith",
    email: "john@abcapparel.com",
    phone: "(555) 123-4567",
    projectsCount: 3,
    status: "Active",
  },
  {
    id: "2",
    name: "XYZ Corporation",
    industry: "Technology",
    contact: "Sarah Johnson",
    email: "sarah@xyzcorp.com",
    phone: "(555) 987-6543",
    projectsCount: 2,
    status: "Active",
  },
  {
    id: "3",
    name: "123 Industries",
    industry: "Manufacturing",
    contact: "Michael Chen",
    email: "michael@123industries.com",
    phone: "(555) 456-7890",
    projectsCount: 1,
    status: "Active",
  },
  {
    id: "4",
    name: "Acme Co",
    industry: "Retail",
    contact: "Emily Rodriguez",
    email: "emily@acmeco.com",
    phone: "(555) 234-5678",
    projectsCount: 2,
    status: "Active",
  },
  {
    id: "5",
    name: "Global Services",
    industry: "Consulting",
    contact: "David Kim",
    email: "david@globalservices.com",
    phone: "(555) 876-5432",
    projectsCount: 0,
    status: "Inactive",
  },
  {
    id: "6",
    name: "Tech Innovations",
    industry: "Technology",
    contact: "Jessica Lee",
    email: "jessica@techinnovations.com",
    phone: "(555) 345-6789",
    projectsCount: 4,
    status: "Active",
  },
  {
    id: "7",
    name: "Creative Solutions",
    industry: "Marketing",
    contact: "Robert Wilson",
    email: "robert@creativesolutions.com",
    phone: "(555) 567-8901",
    projectsCount: 2,
    status: "Active",
  },
  {
    id: "8",
    name: "Urban Outfitters",
    industry: "Fashion",
    contact: "Amanda Brown",
    email: "amanda@urbanoutfitters.com",
    phone: "(555) 678-9012",
    projectsCount: 1,
    status: "Active",
  },
  {
    id: "9",
    name: "Eco Friendly",
    industry: "Sustainability",
    contact: "Daniel Green",
    email: "daniel@ecofriendly.com",
    phone: "(555) 789-0123",
    projectsCount: 3,
    status: "Active",
  },
  {
    id: "10",
    name: "Food Delivery Co",
    industry: "Food & Beverage",
    contact: "Sophia Martinez",
    email: "sophia@fooddelivery.com",
    phone: "(555) 890-1234",
    projectsCount: 2,
    status: "Inactive",
  },
  {
    id: "11",
    name: "Health & Wellness",
    industry: "Healthcare",
    contact: "James Taylor",
    email: "james@healthwellness.com",
    phone: "(555) 901-2345",
    projectsCount: 1,
    status: "Active",
  },
  {
    id: "12",
    name: "Travel Adventures",
    industry: "Travel",
    contact: "Olivia White",
    email: "olivia@traveladventures.com",
    phone: "(555) 012-3456",
    projectsCount: 0,
    status: "Active",
  },
]

export function ClientsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Calculate pagination
  const totalItems = filteredClients.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const currentItems = filteredClients.slice(startIndex, endIndex)

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
            placeholder="Search clients..."
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
              <TableHead className="w-[250px]">Client Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Projects</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                        {client.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>{client.industry}</TableCell>
                  <TableCell>
                    <div>
                      {client.contact}
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center items-center gap-1">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      {client.projectsCount}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
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
                          <Link href={`/dashboard/clients/${client.id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/clients/${client.id}/edit`}>Edit client</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/projects/new?client=${client.id}`}>Add project</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete client</DropdownMenuItem>
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
          Showing {startIndex + 1} to {endIndex} of {totalItems} clients
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
