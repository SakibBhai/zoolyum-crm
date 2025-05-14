"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, LinkIcon, Plus, X, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useTaskContext } from "@/contexts/task-context"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TaskDependency } from "@/types/task"

interface TaskDependenciesProps {
  taskId: string
}

export function TaskDependencies({ taskId }: TaskDependenciesProps) {
  const { getTaskById, getTaskDependencies, tasks, addTaskDependency, removeTaskDependency } = useTaskContext()
  const task = getTaskById(taskId)
  const { dependencies, dependents, related } = getTaskDependencies(taskId)

  const [isAddingDependency, setIsAddingDependency] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [dependencyType, setDependencyType] = useState<TaskDependency["type"]>("blocks")

  if (!task) return null

  // Filter out tasks that are already dependencies or the current task
  const availableTasks = tasks.filter(
    (t) =>
      t.id !== taskId &&
      !dependencies.some((d) => d.id === t.id) &&
      !dependents.some((d) => d.id === t.id) &&
      !related.some((r) => r.id === t.id),
  )

  const handleAddDependency = () => {
    if (selectedTaskId) {
      addTaskDependency(taskId, selectedTaskId, dependencyType)
      setIsAddingDependency(false)
      setSelectedTaskId("")
    }
  }

  const getDependencyTypeLabel = (type: TaskDependency["type"]) => {
    switch (type) {
      case "blocks":
        return "Blocked by"
      case "required_by":
        return "Required for"
      case "related_to":
        return "Related to"
    }
  }

  const getDependencyTypeIcon = (type: TaskDependency["type"]) => {
    switch (type) {
      case "blocks":
        return <ArrowDown className="h-4 w-4" />
      case "required_by":
        return <ArrowUp className="h-4 w-4" />
      case "related_to":
        return <LinkIcon className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Review":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Dependencies</CardTitle>
        <Dialog open={isAddingDependency} onOpenChange={setIsAddingDependency}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Dependency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task Dependency</DialogTitle>
              <DialogDescription>Create a relationship between this task and another task.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Dependency Type</h4>
                <Select
                  value={dependencyType}
                  onValueChange={(value) => setDependencyType(value as TaskDependency["type"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dependency type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocks">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-4 w-4" />
                        <span>Blocked by (This task depends on another task)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="required_by">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4" />
                        <span>Required for (Another task depends on this task)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="related_to">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        <span>Related to (Tasks are connected but not dependent)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Select Task</h4>
                {availableTasks.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border rounded-md">
                    <AlertTriangle className="h-4 w-4" />
                    <span>No available tasks to create dependencies with.</span>
                  </div>
                ) : (
                  <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTasks.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(t.status)}>{t.status}</Badge>
                            <span>{t.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingDependency(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDependency} disabled={!selectedTaskId}>
                Add Dependency
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {dependencies.length === 0 && dependents.length === 0 && related.length === 0 ? (
          <div className="text-center py-6">
            <LinkIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No dependencies found for this task.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add dependencies to establish relationships between tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {dependencies.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  <span>Blocked by</span>
                </h3>
                <div className="space-y-2">
                  {dependencies.map((dep) => {
                    const dependency = task.dependencies?.find(
                      (d) => d.dependsOnTaskId === dep.id && d.type === "blocks",
                    )

                    return (
                      <div key={dep.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(dep.status)}>{dep.status}</Badge>
                          <Link href={`/dashboard/tasks/${dep.id}`} className="hover:underline">
                            {dep.name}
                          </Link>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => dependency && removeTaskDependency(taskId, dependency.id)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove dependency</span>
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {dependents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <ArrowUp className="h-4 w-4" />
                  <span>Required for</span>
                </h3>
                <div className="space-y-2">
                  {dependents.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(dep.status)}>{dep.status}</Badge>
                        <Link href={`/dashboard/tasks/${dep.id}`} className="hover:underline">
                          {dep.name}
                        </Link>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        title="This dependency is managed by the dependent task"
                      >
                        <LinkIcon className="h-4 w-4" />
                        <span className="sr-only">View dependency</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span>Related Tasks</span>
                </h3>
                <div className="space-y-2">
                  {related.map((rel) => {
                    const dependency = task.dependencies?.find(
                      (d) => d.dependsOnTaskId === rel.id && d.type === "related_to",
                    )

                    return (
                      <div key={rel.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(rel.status)}>{rel.status}</Badge>
                          <Link href={`/dashboard/tasks/${rel.id}`} className="hover:underline">
                            {rel.name}
                          </Link>
                        </div>
                        {dependency ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTaskDependency(taskId, dependency.id)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove relationship</span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            title="This relationship is managed by the related task"
                          >
                            <LinkIcon className="h-4 w-4" />
                            <span className="sr-only">View relationship</span>
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
