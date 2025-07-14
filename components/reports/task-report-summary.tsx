"use client"

import type { Task } from "@/types/task"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useEffect, useState } from "react"

interface TaskReportSummaryProps {
  tasks: Task[]
}

export function TaskReportSummary({ tasks }: TaskReportSummaryProps) {
  const [today, setToday] = useState<Date | undefined>(undefined)

  // Set today's date on the client side only
  useEffect(() => {
    setToday(new Date())
  }, [])

  // Status distribution
  const statusCounts = tasks.reduce((acc: Record<string, number>, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {})

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Priority distribution
  const priorityCounts = tasks.reduce((acc: Record<string, number>, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1
    return acc
  }, {})

  const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }))

  // Assignee distribution
  const assigneeCounts = tasks.reduce((acc: Record<string, number>, task) => {
    acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1
    return acc
  }, {})

  const assigneeData = Object.entries(assigneeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5 assignees

  // Project distribution
  const projectCounts = tasks.reduce((acc: Record<string, number>, task) => {
    acc[task.project] = (acc[task.project] || 0) + 1
    return acc
  }, {})

  const projectData = Object.entries(projectCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5 projects

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

  // Calculate summary statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "Completed").length
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length
  const notStartedTasks = tasks.filter((task) => task.status === "Not Started").length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // High priority tasks
  const highPriorityTasks = tasks.filter((task) => task.priority === "High" || task.priority === "Urgent").length

  // Overdue tasks (only calculate if today is available)
  const overdueTasks = today ? tasks.filter((task) => {
    const dueDate = new Date(task.dueDate)
    return dueDate < today && task.status !== "Completed"
  }).length : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedTasks} completed ({completionRate}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">{notStartedTasks} not started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((highPriorityTasks / totalTasks) * 100) || 0}% of all tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((overdueTasks / totalTasks) * 100) || 0}% of all tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Assignees */}
        <Card>
          <CardHeader>
            <CardTitle>Top Assignees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assigneeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Top Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
