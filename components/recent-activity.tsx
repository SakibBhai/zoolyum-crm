"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"

interface Activity {
  id: string
  user: {
    name: string
    avatar?: string
    initials: string
  }
  action: string
  target: string
  time: string
  timestamp: Date
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // Fetch recent data from multiple endpoints
        const [tasksResponse, projectsResponse, clientsResponse, teamResponse] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/projects'),
          fetch('/api/clients'),
          fetch('/api/team')
        ])

        const [tasks, projects, clients, teamMembers] = await Promise.all([
          tasksResponse.json(),
          projectsResponse.json(),
          clientsResponse.json(),
          teamResponse.json()
        ])

        const recentActivities: Activity[] = []

        // Add recent tasks (completed or recently updated)
        if (Array.isArray(tasks)) {
          tasks
            .filter(task => task.updated_at || task.created_at)
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .slice(0, 3)
            .forEach(task => {
              const assignee = Array.isArray(teamMembers) ? teamMembers.find(member => member.id === task.assigned_to) : null
              const userName = assignee?.name || 'Unknown User'
              const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase()
              
              recentActivities.push({
                id: `task-${task.id}`,
                user: {
                  name: userName,
                  initials: userInitials,
                  avatar: assignee?.avatar_url
                },
                action: task.status === 'completed' || task.status === 'done' ? 'completed task' : 'updated task',
                target: task.title,
                time: formatTimeAgo(new Date(task.updated_at || task.created_at)),
                timestamp: new Date(task.updated_at || task.created_at)
              })
            })
        }

        // Add recent projects
        if (Array.isArray(projects)) {
          projects
            .filter(project => project.created_at)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 2)
            .forEach(project => {
              recentActivities.push({
                id: `project-${project.id}`,
                user: {
                  name: 'System',
                  initials: 'SY'
                },
                action: 'created project',
                target: project.name,
                time: formatTimeAgo(new Date(project.created_at)),
                timestamp: new Date(project.created_at)
              })
            })
        }

        // Add recent clients
        if (Array.isArray(clients)) {
          clients
            .filter(client => client.created_at)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 2)
            .forEach(client => {
              recentActivities.push({
                id: `client-${client.id}`,
                user: {
                  name: 'System',
                  initials: 'SY'
                },
                action: 'added client',
                target: client.name,
                time: formatTimeAgo(new Date(client.created_at)),
                timestamp: new Date(client.created_at)
              })
            })
        }

        // Sort all activities by timestamp and take the most recent 5
        const sortedActivities = recentActivities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 5)

        setActivities(sortedActivities)
      } catch (error) {
        console.error('Error fetching recent activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [])

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest updates from your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          // Loading state with animated placeholders
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity found</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                <AvatarFallback>{activity.user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.user.name} {activity.action}{" "}
                  <span className="font-normal text-muted-foreground">
                    {activity.target}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.time}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
