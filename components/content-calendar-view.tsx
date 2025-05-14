"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CalendarIcon,
  Plus,
  Instagram,
  Facebook,
  Linkedin,
  MoreHorizontal,
  Film,
  FileText,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, ImageIcon } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Mock data - in a real app, you would fetch this from your API
const contentItems = [
  {
    id: "1",
    platform: "Instagram",
    project: "Summer Collection Campaign",
    projectId: "1",
    postDate: "May 10, 2023",
    postTime: "12:00 PM",
    contentType: "Carousel",
    caption: "Summer just got hotter ☀️ Check out our new collection! #ABCApparel #SummerFashion",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Shop Now",
    status: "Scheduled",
    taskId: "1",
    taskName: "Design Instagram Carousel for Product Launch",
    approved: true,
    approvedBy: "Sarah Johnson",
  },
  {
    id: "2",
    platform: "Facebook",
    project: "Summer Collection Campaign",
    projectId: "1",
    postDate: "May 12, 2023",
    postTime: "3:00 PM",
    contentType: "Static",
    caption:
      "Introducing our new summer collection! Perfect for those hot summer days. Shop now with free shipping on all orders over $50.",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Shop Now",
    status: "Draft",
    taskId: "2",
    taskName: "Write Captions for Instagram Posts",
    approved: false,
    approvedBy: "",
  },
  {
    id: "3",
    platform: "Instagram",
    project: "Summer Collection Campaign",
    projectId: "1",
    postDate: "May 15, 2023",
    postTime: "5:30 PM",
    contentType: "Reel",
    caption: "Behind the scenes of our summer photoshoot! 🎬 #ABCApparel #BehindTheScenes",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Learn More",
    status: "Draft",
    taskId: "3",
    taskName: "Schedule Posts for Week of May 15",
    approved: false,
    approvedBy: "",
  },
  {
    id: "4",
    platform: "LinkedIn",
    project: "Q2 Marketing Campaign",
    projectId: "4",
    postDate: "May 17, 2023",
    postTime: "10:00 AM",
    contentType: "Static",
    caption:
      "XYZ Corp is proud to announce our new sustainable initiative, reducing our carbon footprint by 30% this year. #Sustainability #Innovation",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Read More",
    status: "Draft",
    taskId: "4",
    taskName: "Create TikTok Concept for Summer Collection",
    approved: false,
    approvedBy: "",
  },
  {
    id: "5",
    platform: "Instagram",
    project: "Summer Collection Campaign",
    projectId: "1",
    postDate: "May 5, 2023",
    postTime: "2:00 PM",
    contentType: "Story",
    caption: "24-hour flash sale! Use code SUMMER20 for 20% off all summer items!",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Shop Now",
    status: "Posted",
    taskId: "5",
    taskName: "Design Facebook Ad Creatives",
    approved: true,
    approvedBy: "Sarah Johnson",
  },
  {
    id: "6",
    platform: "Facebook",
    project: "Q2 Marketing Campaign",
    projectId: "4",
    postDate: "May 20, 2023",
    postTime: "1:00 PM",
    contentType: "Static",
    caption: "Introducing our new eco-friendly packaging! #Sustainability #Innovation",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Learn More",
    status: "Scheduled",
    taskId: null,
    taskName: null,
    approved: true,
    approvedBy: "David Kim",
  },
  {
    id: "7",
    platform: "Instagram",
    project: "Brand Identity Refresh",
    projectId: "3",
    postDate: "May 25, 2023",
    postTime: "4:00 PM",
    contentType: "Carousel",
    caption: "Our new brand identity is here! Swipe to see the evolution of our logo. #BrandRefresh #Design",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Learn More",
    status: "Draft",
    taskId: null,
    taskName: null,
    approved: false,
    approvedBy: "",
  },
  {
    id: "8",
    platform: "LinkedIn",
    project: "Brand Identity Refresh",
    projectId: "3",
    postDate: "May 26, 2023",
    postTime: "11:00 AM",
    contentType: "Static",
    caption: "We're excited to unveil our new brand identity! #BrandRefresh #Design",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Learn More",
    status: "Draft",
    taskId: null,
    taskName: null,
    approved: false,
    approvedBy: "",
  },
  {
    id: "9",
    platform: "TikTok",
    project: "Summer Collection Campaign",
    projectId: "1",
    postDate: "May 18, 2023",
    postTime: "6:00 PM",
    contentType: "Video",
    caption: "Check out our new summer collection! #SummerFashion #TikTokFashion",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Shop Now",
    status: "Scheduled",
    taskId: null,
    taskName: null,
    approved: true,
    approvedBy: "Sarah Johnson",
  },
  {
    id: "10",
    platform: "Instagram",
    project: "Q2 Marketing Campaign",
    projectId: "4",
    postDate: "May 22, 2023",
    postTime: "3:30 PM",
    contentType: "Reel",
    caption: "Behind the scenes of our latest photoshoot! #BehindTheScenes #Marketing",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Learn More",
    status: "Draft",
    taskId: null,
    taskName: null,
    approved: false,
    approvedBy: "",
  },
  {
    id: "11",
    platform: "Facebook",
    project: "Website Redesign",
    projectId: "2",
    postDate: "May 30, 2023",
    postTime: "2:00 PM",
    contentType: "Static",
    caption: "Our new website is live! Check it out and let us know what you think. #WebDesign #UX",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Visit Website",
    status: "Draft",
    taskId: null,
    taskName: null,
    approved: false,
    approvedBy: "",
  },
  {
    id: "12",
    platform: "LinkedIn",
    project: "Website Redesign",
    projectId: "2",
    postDate: "May 31, 2023",
    postTime: "10:00 AM",
    contentType: "Static",
    caption: "We're excited to announce the launch of our new website! #WebDesign #DigitalTransformation",
    mediaLink: "/placeholder.svg?height=300&width=300",
    cta: "Visit Website",
    status: "Draft",
    taskId: null,
    taskName: null,
    approved: false,
    approvedBy: "",
  },
]

export function ContentCalendarView() {
  const [activeTab, setActiveTab] = useState("all")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  let filteredContent = contentItems

  // Filter by status
  if (activeTab !== "all") {
    filteredContent = filteredContent.filter((item) => item.status.toLowerCase() === activeTab)
  }

  // Filter by platform
  if (platformFilter !== "all") {
    filteredContent = filteredContent.filter((item) => item.platform.toLowerCase() === platformFilter)
  }

  // Filter by search query
  if (searchQuery) {
    filteredContent = filteredContent.filter(
      (item) =>
        item.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.contentType.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  // Calculate pagination
  const totalItems = filteredContent.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const currentItems = filteredContent.slice(startIndex, endIndex)

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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "Instagram":
        return <Instagram className="h-5 w-5 text-pink-500" />
      case "Facebook":
        return <Facebook className="h-5 w-5 text-blue-600" />
      case "LinkedIn":
        return <Linkedin className="h-5 w-5 text-blue-700" />
      default:
        return <ImageIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case "Carousel":
        return <FileText className="h-4 w-4 text-muted-foreground" />
      case "Reel":
      case "Video":
        return <Film className="h-4 w-4 text-muted-foreground" />
      default:
        return <ImageIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800"
      case "Scheduled":
        return "bg-blue-100 text-blue-800"
      case "Posted":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to first page when searching
            }}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={platformFilter}
            onValueChange={(value) => {
              setPlatformFilter(value)
              setCurrentPage(1) // Reset to first page when filtering
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>

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

          <Link href="/dashboard/calendar/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs
            defaultValue="all"
            onValueChange={(value) => {
              setActiveTab(value)
              setCurrentPage(1) // Reset to first page when changing tabs
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All Content</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="posted">Posted</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {currentItems.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No content found</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {activeTab === "all" && platformFilter === "all" && !searchQuery
                        ? "No content has been created yet."
                        : "No content matches your current filters."}
                    </p>
                    <Link href="/dashboard/calendar/new">
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Content
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {currentItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="flex">
                        <div className="p-4 flex items-center justify-center">{getPlatformIcon(item.platform)}</div>
                        <CardContent className="p-4 pt-4 flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                {getContentTypeIcon(item.contentType)}
                                <h4 className="font-medium">
                                  {item.contentType} • {item.postDate} at {item.postTime}
                                </h4>
                                {item.approved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.caption}</p>
                            </div>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                          </div>

                          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Platform:</span> {item.platform}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Project:</span>{" "}
                              <Link href={`/dashboard/projects/${item.projectId}`} className="hover:underline">
                                {item.project}
                              </Link>
                            </div>
                            <div>
                              <span className="text-muted-foreground">CTA:</span> {item.cta}
                            </div>
                            {item.taskId && (
                              <div>
                                <span className="text-muted-foreground">Linked Task:</span>{" "}
                                <Link href={`/dashboard/tasks/${item.taskId}`} className="hover:underline">
                                  {item.taskName}
                                </Link>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <div className="p-4 flex items-start">
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
                                <Link href={`/dashboard/calendar/${item.id}`}>View details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/calendar/${item.id}/edit`}>Edit content</Link>
                              </DropdownMenuItem>
                              {!item.approved && <DropdownMenuItem>Mark as approved</DropdownMenuItem>}
                              {item.status === "Draft" && <DropdownMenuItem>Schedule post</DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">Delete content</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalItems > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {endIndex} of {totalItems} content items
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
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view content</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />

              {date && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Content for {format(date, "MMMM d, yyyy")}</h4>
                  {contentItems.filter((item) => item.postDate === format(date, "MMMM d, yyyy")).length > 0 ? (
                    <div className="space-y-2">
                      {contentItems
                        .filter((item) => item.postDate === format(date, "MMMM d, yyyy"))
                        .map((item) => (
                          <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border">
                            {getPlatformIcon(item.platform)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {item.contentType} • {item.postTime}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.caption}</p>
                            </div>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No content scheduled for this date.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
