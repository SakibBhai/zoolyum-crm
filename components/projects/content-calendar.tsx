"use client"

import { useState, useEffect } from "react"
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
  ImageIcon,
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

// Mock data - in a real app, you would fetch this from your API
const contentItems = [
  {
    id: "1",
    platform: "Instagram",
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
    postDate: "May 17, 2023",
    postTime: "10:00 AM",
    contentType: "Static",
    caption:
      "ABC Apparel is proud to announce our new sustainable summer collection, made with 100% recycled materials. #Sustainability #Fashion",
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
]

export function ContentCalendar({ projectId }: { projectId: string }) {
  // In a real app, you would fetch the content calendar for this project based on the ID
  const [activeTab, setActiveTab] = useState("all")
  const [date, setDate] = useState<Date | undefined>(undefined)

  // Set the date only on the client side
  useEffect(() => {
    setDate(new Date())
  }, [])

  const filteredContent =
    activeTab === "all" ? contentItems : contentItems.filter((item) => item.status.toLowerCase() === activeTab)

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Content Calendar</h3>
        <Link href={`/dashboard/calendar/new?project=${projectId}`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Content</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="posted">Posted</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredContent.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No content found</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {activeTab === "all"
                        ? "This project doesn't have any content yet."
                        : `No content with status "${activeTab}".`}
                    </p>
                    <Link href={`/dashboard/calendar/new?project=${projectId}`}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Content
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredContent.map((item) => (
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
                  <h4 className="font-medium mb-2">Content for {
                    (() => {
                      try {
                        return format(date, "MMMM d, yyyy");
                      } catch (error) {
                        return "this date";
                      }
                    })()
                  }</h4>
                  {contentItems.filter((item) => {
                    try {
                      return item.postDate === format(date, "MMMM d, yyyy");
                    } catch (error) {
                      return false;
                    }
                  }).length > 0 ? (
                    <div className="space-y-2">
                      {contentItems
                        .filter((item) => {
                          try {
                            return item.postDate === format(date, "MMMM d, yyyy");
                          } catch (error) {
                            return false;
                          }
                        })
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
