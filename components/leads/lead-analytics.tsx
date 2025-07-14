"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, Users, DollarSign, Target, Calendar } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Lead, Activity } from "./leads-overview"

interface LeadAnalyticsProps {
  leads: Lead[]
  activities: Activity[]
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  pink: '#ec4899',
  teal: '#14b8a6'
}

const STATUS_COLORS = {
  'new': COLORS.primary,
  'contacted': COLORS.accent,
  'qualified': COLORS.purple,
  'proposal': COLORS.indigo,
  'negotiation': COLORS.pink,
  'closed-won': COLORS.secondary,
  'closed-lost': COLORS.danger
}

export function LeadAnalytics({ leads, activities }: LeadAnalyticsProps) {
  // Calculate analytics data
  const analytics = useMemo(() => {
    const now = new Date()
    const sixMonthsAgo = subMonths(now, 6)
    
    // Monthly lead creation data
    const monthlyData = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: now
    }).map(month => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      
      const monthLeads = leads.filter(lead => 
        lead.createdAt >= monthStart && lead.createdAt <= monthEnd
      )
      
      const closedWon = monthLeads.filter(lead => lead.status === 'closed-won')
      const totalValue = monthLeads.reduce((sum, lead) => sum + lead.value, 0)
      const wonValue = closedWon.reduce((sum, lead) => sum + lead.value, 0)
      
      return {
        month: format(month, 'MMM yyyy'),
        leads: monthLeads.length,
        closedWon: closedWon.length,
        totalValue: totalValue,
        wonValue: wonValue,
        conversionRate: monthLeads.length > 0 ? (closedWon.length / monthLeads.length) * 100 : 0
      }
    })

    // Status distribution
    const statusDistribution = Object.entries(
      leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({
      name: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || COLORS.primary
    }))

    // Source performance
    const sourcePerformance = Object.entries(
      leads.reduce((acc, lead) => {
        if (!acc[lead.source]) {
          acc[lead.source] = { total: 0, won: 0, value: 0 }
        }
        acc[lead.source].total += 1
        if (lead.status === 'closed-won') {
          acc[lead.source].won += 1
          acc[lead.source].value += lead.value
        }
        return acc
      }, {} as Record<string, { total: number; won: number; value: number }>)
    ).map(([source, data]) => ({
      source,
      total: data.total,
      won: data.won,
      value: data.value,
      conversionRate: data.total > 0 ? (data.won / data.total) * 100 : 0
    })).sort((a, b) => b.total - a.total)

    // Sales rep performance
    const repPerformance = Object.entries(
      leads.reduce((acc, lead) => {
        if (!acc[lead.assignedTo]) {
          acc[lead.assignedTo] = { total: 0, won: 0, value: 0, avgScore: 0 }
        }
        acc[lead.assignedTo].total += 1
        acc[lead.assignedTo].avgScore += lead.leadScore
        if (lead.status === 'closed-won') {
          acc[lead.assignedTo].won += 1
          acc[lead.assignedTo].value += lead.value
        }
        return acc
      }, {} as Record<string, { total: number; won: number; value: number; avgScore: number }>)
    ).map(([rep, data]) => ({
      rep,
      total: data.total,
      won: data.won,
      value: data.value,
      avgScore: data.total > 0 ? data.avgScore / data.total : 0,
      conversionRate: data.total > 0 ? (data.won / data.total) * 100 : 0
    })).sort((a, b) => b.value - a.value)

    // Lead score distribution
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 }
    ]
    
    const scoreDistribution = scoreRanges.map(({ range, min, max }) => {
      const count = leads.filter(lead => lead.leadScore >= min && lead.leadScore <= max).length
      return { range, count }
    })

    // Pipeline value by stage
    const pipelineValue = Object.entries(
      leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + lead.value
        return acc
      }, {} as Record<string, number>)
    ).map(([status, value]) => ({
      stage: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || COLORS.primary
    }))

    // Key metrics
    const totalLeads = leads.length
    const closedWonLeads = leads.filter(l => l.status === 'closed-won').length
    const qualifiedLeads = leads.filter(l => ['qualified', 'proposal', 'negotiation'].includes(l.status)).length
    const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0)
    const wonValue = leads.filter(l => l.status === 'closed-won').reduce((sum, lead) => sum + lead.value, 0)
    const conversionRate = totalLeads > 0 ? (closedWonLeads / totalLeads) * 100 : 0
    const avgDealSize = closedWonLeads > 0 ? wonValue / closedWonLeads : 0
    const avgLeadScore = totalLeads > 0 ? leads.reduce((sum, lead) => sum + lead.leadScore, 0) / totalLeads : 0

    return {
      monthlyData,
      statusDistribution,
      sourcePerformance,
      repPerformance,
      scoreDistribution,
      pipelineValue,
      metrics: {
        totalLeads,
        closedWonLeads,
        qualifiedLeads,
        totalValue,
        wonValue,
        conversionRate,
        avgDealSize,
        avgLeadScore
      }
    }
  }, [leads])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.metrics.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(analytics.metrics.wonValue)} closed won
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analytics.metrics.conversionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.metrics.closedWonLeads} of {analytics.metrics.totalLeads} leads
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.metrics.avgDealSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per closed deal
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lead Score</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.metrics.avgLeadScore.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Generation Trends</CardTitle>
            <CardDescription>
              Monthly lead creation and conversion over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stackId="1"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.6}
                  name="Total Leads"
                />
                <Area
                  type="monotone"
                  dataKey="closedWon"
                  stackId="2"
                  stroke={COLORS.secondary}
                  fill={COLORS.secondary}
                  fillOpacity={0.8}
                  name="Closed Won"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
            <CardDescription>
              Current distribution of leads across different stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Source Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Source Performance</CardTitle>
            <CardDescription>
              Conversion rates and total leads by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.sourcePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill={COLORS.primary} name="Total Leads" />
                <Bar dataKey="won" fill={COLORS.secondary} name="Closed Won" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Value by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Value by Stage</CardTitle>
            <CardDescription>
              Total potential value at each stage of the pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.pipelineValue} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="value" fill={COLORS.accent} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Rep Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Rep Performance</CardTitle>
            <CardDescription>
              Performance metrics by sales representative
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.repPerformance.map((rep, index) => (
                <div key={rep.rep} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{rep.rep}</div>
                    <div className="text-sm text-muted-foreground">
                      {rep.total} leads • {formatPercentage(rep.conversionRate)} conversion
                    </div>
                    <Progress value={rep.conversionRate} className="mt-2 h-2" />
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-medium text-green-600">
                      {formatCurrency(rep.value)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Score: {rep.avgScore.toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Score Distribution</CardTitle>
            <CardDescription>
              Distribution of leads across different score ranges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.purple} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Source Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Source Analysis</CardTitle>
          <CardDescription>
            Comprehensive breakdown of lead source performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.sourcePerformance.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{source.source}</span>
                    <Badge variant="outline">
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {source.total} total leads • {source.won} closed won
                  </div>
                  <Progress value={source.conversionRate} className="mt-2 h-2" />
                </div>
                <div className="text-right ml-4">
                  <div className="font-medium">
                    {formatPercentage(source.conversionRate)}
                  </div>
                  <div className="text-sm text-green-600">
                    {formatCurrency(source.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}