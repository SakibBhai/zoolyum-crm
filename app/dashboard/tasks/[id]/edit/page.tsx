"use client"

import { useParams, useRouter } from "next/navigation"
import { useTaskContext } from "@/contexts/task-context"
import { TaskForm } from "@/components/tasks/task-form"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import type { Task } from "@/types/task"

export default function EditTaskPage() {
  const params = useParams()
  const router = useRouter()
  const { getTaskById, updateTask } = useTaskContext()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  const taskId = params.id as string

  useEffect(() => {
    if (taskId) {
      const foundTask = getTaskById(taskId)
      if (foundTask) {
        setTask(foundTask)
      } else {
        // Task not found, redirect to tasks list
        router.push("/dashboard/tasks")
      }
      setLoading(false)
    }
  }, [taskId, getTaskById, router])

  const handleUpdateTask = (updates: Partial<Omit<Task, "id" | "statusHistory" | "dependencies">>) => {
    if (task) {
      updateTask(task.id, updates)
      router.push("/dashboard/tasks")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          heading="Edit Task"
          subheading="Update task details"
        />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <PageHeader
          heading="Task Not Found"
          subheading="The requested task could not be found"
        />
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">The task you're looking for doesn't exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading="Edit Task"
        subheading={`Update details for "${task.name}"`}
      />
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm 
            initialData={task}
            onSubmit={handleUpdateTask}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  )
}