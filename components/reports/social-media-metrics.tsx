"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react"

interface SocialMediaMetricsProps {
  data: any[]
  detailed?: boolean
}

export function SocialMediaMetrics({ data, detailed = false }: SocialMediaMetricsProps) {
  // Process data for charts
  const processedData = data.map((item) => {
    const date = new Date(item.date)
    // Add null checks and default values for all nested properties
    return {
      name: date.toLocaleDateString("en-US", { month: "short" }),
      impressions: item.social?.impressions || 0,
      engagement: item.social?.engagement || 0,
      clicks: item.social?.clicks || 0,
      shares: item.social?.shares || 0,
      likes: item.social?.likes || 0,
      comments: item.social?.comments || 0,
      instagram: item.social?.followers?.instagram || 0,
      facebook: item.social?.followers?.facebook || 0,
      twitter: item.social?.followers?.twitter || 0,
      linkedin: item.social?.followers?.linkedin || 0,
    }
  })

  // Add a check for empty data array
  const latestData =
    processedData.length > 0
      ? processedData[processedData.length - 1]
      : {
          impressions: 0,
          engagement: 0,
          clicks: 0,
          shares: 0,
          instagram: 0,
          facebook: 0,
          twitter: 0,
          linkedin: 0,
        }

  // Update the calculations to handle empty arrays
  const totalImpressions = processedData.reduce((sum, item) => sum + item.impressions, 0)
  const averageEngagement =
    processedData.length > 0 ? processedData.reduce((sum, item) => sum + item.engagement, 0) / processedData.length : 0
  const totalClicks = processedData.reduce((sum, item) => sum + item.clicks, 0)

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num
  }

  return (
    <>
      {!detailed ? (
        <Card>
          <CardHeader>
            <CardTitle>Social Media Performance</CardTitle>
            <CardDescription>Key metrics across all social platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">{formatNumber(totalImpressions)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Avg. Engagement Rate</p>
                <p className="text-2xl font-bold">{averageEngagement.toFixed(1)}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{formatNumber(totalClicks)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Followers</p>
                <p className="text-2xl font-bold">
                  {formatNumber(latestData.instagram + latestData.facebook + latestData.twitter + latestData.linkedin)}
                </p>
              </div>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="impressions" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalImpressions)}</div>
                <p className="text-xs text-muted-foreground">
                  {processedData.length > 1 && processedData[0].impressions > 0 ? (
                    <>
                      {processedData[processedData.length - 1].impressions > processedData[0].impressions ? "+" : ""}
                      {(
                        ((processedData[processedData.length - 1].impressions - processedData[0].impressions) /
                          processedData[0].impressions) *
                        100
                      ).toFixed(1)}
                      % from previous
                    </>
                  ) : (
                    "No previous data"
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageEngagement.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {processedData.length > 1 && processedData[0].engagement > 0 ? (
                    <>
                      {processedData[processedData.length - 1].engagement > processedData[0].engagement ? "+" : ""}
                      {(
                        ((processedData[processedData.length - 1].engagement - processedData[0].engagement) /
                          processedData[0].engagement) *
                        100
                      ).toFixed(1)}
                      % from previous
                    </>
                  ) : (
                    "No previous data"
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalClicks)}</div>
                <p className="text-xs text-muted-foreground">
                  {processedData.length > 1 && processedData[0].clicks > 0 ? (
                    <>
                      {processedData[processedData.length - 1].clicks > processedData[0].clicks ? "+" : ""}
                      {(
                        ((processedData[processedData.length - 1].clicks - processedData[0].clicks) /
                          processedData[0].clicks) *
                        100
                      ).toFixed(1)}
                      % from previous
                    </>
                  ) : (
                    "No previous data"
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Shares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(processedData.reduce((sum, item) => sum + item.shares, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {processedData.length > 1 && processedData[0].shares > 0 ? (
                    <>
                      {processedData[processedData.length - 1].shares > processedData[0].shares ? "+" : ""}
                      {(
                        ((processedData[processedData.length - 1].shares - processedData[0].shares) /
                          processedData[0].shares) *
                        100
                      ).toFixed(1)}
                      % from previous
                    </>
                  ) : (
                    "No previous data"
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Impressions & Engagement</CardTitle>
                <CardDescription>Monthly trend analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#8884d8" name="Impressions" />
                      <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#82ca9d" name="Engagement %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Followers by Platform</CardTitle>
                <CardDescription>Growth across social networks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="instagram" name="Instagram" fill="#E1306C" />
                      <Bar dataKey="facebook" name="Facebook" fill="#4267B2" />
                      <Bar dataKey="twitter" name="Twitter" fill="#1DA1F2" />
                      <Bar dataKey="linkedin" name="LinkedIn" fill="#0077B5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Breakdown</CardTitle>
              <CardDescription>Current follower distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-[#E1306C] p-3 rounded-full">
                    <Instagram className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Instagram</p>
                    <p className="text-2xl font-bold">{formatNumber(latestData.instagram)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-[#4267B2] p-3 rounded-full">
                    <Facebook className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Facebook</p>
                    <p className="text-2xl font-bold">{formatNumber(latestData.facebook)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-[#1DA1F2] p-3 rounded-full">
                    <Twitter className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Twitter</p>
                    <p className="text-2xl font-bold">{formatNumber(latestData.twitter)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-[#0077B5] p-3 rounded-full">
                    <Linkedin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                    <p className="text-2xl font-bold">{formatNumber(latestData.linkedin)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
