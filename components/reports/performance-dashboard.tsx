"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Download, RefreshCw } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { SocialMediaMetrics } from "@/components/reports/social-media-metrics"
import { CampaignPerformance } from "@/components/reports/campaign-performance"
import { EngagementOverview } from "@/components/reports/engagement-overview"
import { AudienceGrowth } from "@/components/reports/audience-growth"
import { format, subMonths } from "date-fns"
import { performanceData } from "@/data/performance-data"

export function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [timeframe, setTimeframe] = useState("30days")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Set the date only on the client side
  useEffect(() => {
    setSelectedDate(new Date())
  }, [])

  // Get the month name for display
  const currentMonth = selectedDate ? format(selectedDate, "MMMM yyyy") : ""

  // Filter data based on selected date, with a check for empty data
  const filteredData = selectedDate ? performanceData.filter((item) => {
    if (!item.date) return false
    const itemDate = new Date(item.date)
    const startDate = subMonths(selectedDate, 1)
    return itemDate >= startDate && itemDate <= selectedDate
  }) : []

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1500)
  }

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredData))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `performance-data-${selectedDate ? format(selectedDate, "yyyy-MM") : 'no-date'}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <DatePicker
              selected={selectedDate}
              onSelect={setSelectedDate}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Dashboard - {currentMonth}</CardTitle>
          <CardDescription>Key performance indicators for social media and marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredData.length > 0 ? (
                  <>
                    <SocialMediaMetrics data={filteredData} />
                    <CampaignPerformance data={filteredData} />
                  </>
                ) : (
                  <Card className="col-span-2">
                    <CardContent className="py-10">
                      <div className="text-center">
                        <p className="text-muted-foreground">No data available for the selected period.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="social">
              {filteredData.length > 0 ? (
                <SocialMediaMetrics data={filteredData} detailed />
              ) : (
                <Card>
                  <CardContent className="py-10">
                    <div className="text-center">
                      <p className="text-muted-foreground">No data available for the selected period.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="campaigns">
              {filteredData.length > 0 ? (
                <CampaignPerformance data={filteredData} detailed />
              ) : (
                <Card>
                  <CardContent className="py-10">
                    <div className="text-center">
                      <p className="text-muted-foreground">No data available for the selected period.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="audience">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredData.length > 0 ? (
                  <>
                    <EngagementOverview data={filteredData} />
                    <AudienceGrowth data={filteredData} />
                  </>
                ) : (
                  <Card className="col-span-2">
                    <CardContent className="py-10">
                      <div className="text-center">
                        <p className="text-muted-foreground">No data available for the selected period.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
