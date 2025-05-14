"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
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

interface AudienceGrowthProps {
  data: any[]
}

export function AudienceGrowth({ data }: AudienceGrowthProps) {
  // Process data for charts
  const processedData = data.map((item) => {
    const date = new Date(item.date)
    return {
      name: date.toLocaleDateString("en-US", { month: "short" }),
      instagram: item.social.followers.instagram,
      facebook: item.social.followers.facebook,
      twitter: item.social.followers.twitter,
      linkedin: item.social.followers.linkedin,
      total:
        item.social.followers.instagram +
        item.social.followers.facebook +
        item.social.followers.twitter +
        item.social.followers.linkedin,
    }
  })

  // Get latest data for pie chart
  const latestData = processedData[processedData.length - 1]
  const pieData = [
    { name: "Instagram", value: latestData.instagram },
    { name: "Facebook", value: latestData.facebook },
    { name: "Twitter", value: latestData.twitter },
    { name: "LinkedIn", value: latestData.linkedin },
  ]

  // Calculate growth
  const firstData = processedData[0]
  const growthRate = ((latestData.total - firstData.total) / firstData.total) * 100

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num
  }

  // Colors for pie chart
  const COLORS = ["#E1306C", "#4267B2", "#1DA1F2", "#0077B5"]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audience Growth</CardTitle>
        <CardDescription>Follower growth across platforms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Followers</p>
            <p className="text-2xl font-bold">{formatNumber(latestData.total)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
            <p className="text-2xl font-bold">{growthRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Followers" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[200px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
