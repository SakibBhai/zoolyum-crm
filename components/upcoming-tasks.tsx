"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface Task {
  id: string
  title: string
  due_date: string | null
  priority: string
  status: string
  project_name?: string
}

export function UpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUpcomingTasks = async () => {
      try {
        const response = await fetch('/api/tasks')
        const allTasks = await response.json()
        
        if (Array.isArray(allTasks)) {
          // Filter tasks that are not completed and have due dates
          const upcomingTasks = allTasks
            .filter(task => 
              task.status !== 'completed' && 
              task.status !== 'done' &&
              task.due_date
            )
            .sort((a, b) => {
              // Sort by due date (earliest first)
              const dateA = new Date(a.due_date)
              const dateB = new Date(b.due_date)
              return dateA.getTime() - dateB.getTime()
            })
            .slice(0, 5) // Get only the first 5 upcoming tasks
          
          setTasks(upcomingTasks)
        }
      } catch (error) {
        console.error('Error fetching upcoming tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingTasks()
  }, [])

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Reset time for comparison
    today.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    if (date.getTime() === today.getTime()) {
      return 'Today'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'backlog':
        return 'To Do'
      case 'todo':
        return 'To Do'
      case 'in_progress':
        return 'In Progress'
      case 'review':
        return 'In Review'
      case 'completed':
        return 'Completed'
      case 'done':
        return 'Done'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-blue-100 text-blue-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>Your tasks due soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
        <CardDescription>Your tasks due soon.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No upcoming tasks with due dates.
            </p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{task.title}</p>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Due: {task.due_date ? formatDueDate(task.due_date) : 'No due date'}</span>
                    <span>•</span>
                    <span>{formatStatus(task.status)}</span>
                    {task.project_name && (
                      <>
                        <span>•</span>
                        <span>{task.project_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge className={cn("ml-2", getPriorityColor(task.priority))}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
