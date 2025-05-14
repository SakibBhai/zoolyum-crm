"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

interface EngagementOverviewProps {
  data: any[]
}

export function EngagementOverview({ data }: EngagementOverviewProps) {
  // Process data for charts
  const processedData = data.map((item) => {
    const date = new Date(item.date)
    return {
      name: date.toLocaleDateString("en-US", { month: "short" }),
      likes: item.social.likes,
      comments: item.social.comments,
      shares: item.social.shares,
      engagement: item.social.engagement,
    }
  })

  // Calculate totals
  const totalLikes = processedData.reduce((sum, item) => sum + item.likes, 0)
  const totalComments = processedData.reduce((sum, item) => sum + item.comments, 0)
  const totalShares = processedData.reduce((sum, item) => sum + item.shares, 0)

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
    <Card>
      <CardHeader>
        <CardTitle>Engagement Overview</CardTitle>
        <CardDescription>Likes, comments, and shares over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Likes</p>
            <p className="text-2xl font-bold">{formatNumber(totalLikes)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Comments</p>
            <p className="text-2xl font-bold">{formatNumber(totalComments)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Shares</p>
            <p className="text-2xl font-bold">{formatNumber(totalShares)}</p>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="likes" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="comments" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              <Area type="monotone" dataKey="shares" stackId="1" stroke="#ffc658" fill="#ffc658" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[200px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="engagement" stroke="#ff7300" name="Engagement Rate %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
