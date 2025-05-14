"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Calendar, User, FolderKanban, FileText, Tag } from "lucide-react"
import Link from "next/link"
import { useTaskContext } from "@/contexts/task-context"
import { TaskStatusSelect } from "./task-status-select"
import { TaskStatusHistory } from "./task-status-history"
import { TaskDependencies } from "./task-dependencies"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TaskDetails({ id }: { id: string }) {
  const { getTaskById } = useTaskContext()
  const task = getTaskById(id)

  if (!task) {
    return (
      <div className="p-6 text-center">
        <p>Task not found</p>
      </div>
    )
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Task Information</CardTitle>
            <CardDescription>Basic details about the task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Task Name</p>
                <p>{task.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Project</p>
                <Link href={`/dashboard/projects/${task.projectId}`} className="hover:underline">
                  {task.project}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Category</p>
                <p>{task.category}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Priority</p>
              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
            </div>

            <div>
              <p className="text-sm font-medium">Status</p>
              <div className="mt-1">
                <TaskStatusSelect taskId={task.id} currentStatus={task.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Information about task assignment and deadline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Assigned To</p>
                <p>{task.assignedTo}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p>{task.dueDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Task Description</CardTitle>
            <CardDescription>Detailed information about the task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Brief</p>
                <p className="text-sm text-muted-foreground">{task.brief}</p>
              </div>
            </div>

            {task.details && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Details</p>
                  <p className="text-sm text-muted-foreground">{task.details}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="dependencies" className="md:col-span-2">
          <TabsList>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="history">Status History</TabsTrigger>
          </TabsList>
          <TabsContent value="dependencies" className="mt-4">
            <TaskDependencies taskId={task.id} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <TaskStatusHistory history={task.statusHistory || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
