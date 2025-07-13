"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FolderKanban, CheckSquare, Calendar } from "lucide-react"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalClients: number
  activeProjects: number
  pendingTasks: number
  scheduledPosts: number
}

export function DashboardCards() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeProjects: 0,
    pendingTasks: 0,
    scheduledPosts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        // Fetch clients count
        const clientsResponse = await fetch('/api/clients')
        const clients = await clientsResponse.json()
        
        // Fetch projects count
        const projectsResponse = await fetch('/api/projects')
        const projects = await projectsResponse.json()
        
        // Fetch tasks count
        const tasksResponse = await fetch('/api/tasks')
        const tasks = await tasksResponse.json()
        
        // Calculate stats
        const totalClients = Array.isArray(clients) ? clients.length : 0
        const activeProjects = Array.isArray(projects) ? projects.filter(p => p.status === 'active' || p.status === 'in_progress').length : 0
        const pendingTasks = Array.isArray(tasks) ? tasks.filter(t => t.status === 'backlog' || t.status === 'todo' || t.status === 'in_progress').length : 0
        const scheduledPosts = Array.isArray(tasks) ? tasks.filter(t => t.is_content_related && (t.status === 'backlog' || t.status === 'todo')).length : 0
        
        setStats({
          totalClients,
          activeProjects,
          pendingTasks,
          scheduledPosts,
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '...' : stats.totalClients}</div>
          <p className="text-xs text-muted-foreground">Active client accounts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '...' : stats.activeProjects}</div>
          <p className="text-xs text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '...' : stats.pendingTasks}</div>
          <p className="text-xs text-muted-foreground">Awaiting completion</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Content Tasks</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '...' : stats.scheduledPosts}</div>
          <p className="text-xs text-muted-foreground">Content-related tasks</p>
        </CardContent>
      </Card>
    </div>
  )
}
