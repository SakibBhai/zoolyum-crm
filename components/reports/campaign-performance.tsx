"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Badge } from "@/components/ui/badge"

interface CampaignPerformanceProps {
  data: any[]
  detailed?: boolean
}

export function CampaignPerformance({ data, detailed = false }: CampaignPerformanceProps) {
  // Get the latest data point
  const latestData = data[data.length - 1]

  // Extract campaign data
  const campaignNames = Object.keys(latestData.campaigns)
  const campaignData = campaignNames.map((name) => ({
    name,
    ...latestData.campaigns[name],
  }))

  // Process data for trend chart
  const trendData = data.map((item) => {
    const date = new Date(item.date)
    const month = date.toLocaleDateString("en-US", { month: "short" })

    // Calculate average ROI and CTR across all campaigns for this month
    const campaigns = Object.values(item.campaigns) as any[]
    const avgRoi = campaigns.reduce((sum: number, campaign: any) => sum + campaign.roi, 0) / campaigns.length
    const avgCtr = campaigns.reduce((sum: number, campaign: any) => sum + campaign.ctr, 0) / campaigns.length

    return {
      name: month,
      roi: avgRoi,
      ctr: avgCtr,
    }
  })

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num
  }

  // Calculate total impressions and conversions
  const totalImpressions = campaignData.reduce((sum, campaign) => sum + campaign.impressions, 0)
  const totalConversions = campaignData.reduce((sum, campaign) => sum + campaign.conversions, 0)

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  return (
    <>
      {!detailed ? (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Results from active marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">{formatNumber(totalImpressions)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">{formatNumber(totalConversions)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Avg. CTR</p>
                <p className="text-2xl font-bold">
                  {(campaignData.reduce((sum, campaign) => sum + campaign.ctr, 0) / campaignData.length).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Avg. ROI</p>
                <p className="text-2xl font-bold">
                  {(campaignData.reduce((sum, campaign) => sum + campaign.roi, 0) / campaignData.length).toFixed(1)}x
                </p>
              </div>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversions" fill="#8884d8" />
                </BarChart>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(totalConversions)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. CTR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(campaignData.reduce((sum, campaign) => sum + campaign.ctr, 0) / campaignData.length).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(campaignData.reduce((sum, campaign) => sum + campaign.roi, 0) / campaignData.length).toFixed(1)}x
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Conversions</CardTitle>
                <CardDescription>Comparison across active campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="conversions" fill="#8884d8" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI & CTR Trends</CardTitle>
                <CardDescription>Monthly performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="roi" stroke="#8884d8" name="ROI" />
                      <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#82ca9d" name="CTR %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Distribution</CardTitle>
              <CardDescription>Impressions by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={campaignData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="impressions"
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      >
                        {campaignData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Campaign Performance</h3>
                  <div className="space-y-4">
                    {campaignData.map((campaign, index) => (
                      <div key={campaign.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{campaign.name}</span>
                          </div>
                          <Badge variant={campaign.roi > 3 ? "default" : "outline"}>
                            ROI: {campaign.roi.toFixed(1)}x
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(campaign.impressions)} impressions • {formatNumber(campaign.clicks)} clicks •{" "}
                          {formatNumber(campaign.conversions)} conversions
                        </div>
                      </div>
                    ))}
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
