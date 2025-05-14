"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, User, Calendar, MoreHorizontal, LinkIcon } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTaskContext } from "@/contexts/task-context"
import { TaskStatusSelect } from "@/components/tasks/task-status-select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ProjectTasks({ projectId }: { projectId: string }) {
  const { tasks } = useTaskContext()
  const [activeTab, setActiveTab] = useState("all")

  // Filter tasks for this project
  const projectTasks = tasks.filter((task) => task.projectId === projectId)

  const filteredTasks =
    activeTab === "all"
      ? projectTasks
      : projectTasks.filter((task) => task.status.toLowerCase().replace(/\s+/g, "_") === activeTab)

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

  // Check if a task has dependencies
  const hasDependencies = (task: (typeof tasks)[0]) => {
    // Check if this task has dependencies
    const hasDeps = task.dependencies && task.dependencies.length > 0

    // Check if other tasks depend on this task
    const isDependedOn = tasks.some((t) => t.dependencies?.some((dep) => dep.dependsOnTaskId === task.id))

    return hasDeps || isDependedOn
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Project Tasks</h3>
          <Link href={`/dashboard/tasks/new?project=${projectId}`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="to_do">To Do</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-muted-foreground mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-lg font-medium">No tasks found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {activeTab === "all"
                      ? "This project doesn't have any tasks yet."
                      : `No tasks with status "${activeTab.replace("_", " ")}".`}
                  </p>
                  <Link href={`/dashboard/tasks/new?project=${projectId}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Task
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="overflow-hidden">
                    <div className="flex border-l-4 border-primary">
                      <CardContent className="p-4 pt-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{task.name}</h4>
                              {hasDependencies(task) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <LinkIcon className="h-4 w-4 text-blue-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>This task has dependencies</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{task.brief}</p>
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{task.assignedTo}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Due: {task.dueDate}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span> {task.category}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Status:</span>
                            <TaskStatusSelect taskId={task.id} currentStatus={task.status} size="sm" />
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-4 flex items-start">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/tasks/${task.id}`}>View details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/tasks/${task.id}/edit`}>Edit task</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Delete task</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
