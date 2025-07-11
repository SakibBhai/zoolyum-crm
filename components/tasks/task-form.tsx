"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon, ArrowDown, LinkIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useTaskContext } from "@/contexts/task-context"
import { useProjectContext } from "@/contexts/project-context"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { TaskDependency } from "@/types/task"

// Mock data for team members
const teamMembers = [
  { id: "1", name: "Sarah Johnson" },
  { id: "2", name: "Michael Chen" },
  { id: "3", name: "Emily Rodriguez" },
  { id: "4", name: "David Kim" },
  { id: "5", name: "Jessica Lee" },
]

const taskCategories = [
  "Design",
  "Copywriting",
  "Strategy",
  "Scheduling",
  "Development",
  "Photography",
  "Video",
  "Analytics",
  "Other",
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Task name must be at least 2 characters.",
  }),
  projectId: z.string({
    required_error: "Please select a project.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  assignedById: z.string({
    required_error: "Please select who is assigning this task.",
  }),
  assignedToId: z.string({
    required_error: "Please select who this task is assigned to.",
  }),
  dueDate: z.date({
    required_error: "Please select a due date.",
  }),
  priority: z.string(),
  status: z.string(),
  brief: z.string().min(5, {
    message: "Brief must be at least 5 characters.",
  }),
  details: z.string().optional(),
})

interface TaskFormProps {
  initialData?: any
  onSubmit?: (data: any) => void
  mode?: 'create' | 'edit'
}

export function TaskForm({ initialData, onSubmit, mode = 'create' }: TaskFormProps = {}) {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams ? searchParams.get("project") : null

  const { addTask, tasks, addTaskDependency, updateTask } = useTaskContext()
  const { projects } = useProjectContext()

  const [selectedDependencies, setSelectedDependencies] = useState<
    {
      taskId: string
      type: TaskDependency["type"]
    }[]
  >([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name || "",
      projectId: initialData.projectId || projectId || "",
      category: initialData.category || "",
      assignedById: initialData.assignedById || "1",
      assignedToId: initialData.assignedToId || "",
      priority: initialData.priority || "medium",
      status: initialData.status || "to_do",
      brief: initialData.brief || "",
      details: initialData.details || "",
    } : {
      name: "",
      projectId: projectId || "",
      category: "",
      assignedById: "1", // Default to Sarah Johnson
      assignedToId: "",
      priority: "medium",
      status: "to_do",
      brief: "",
      details: "",
    },
  })

  // Set project ID from URL parameter if available
  useEffect(() => {
    if (projectId) {
      form.setValue("projectId", projectId)
    }
  }, [projectId, form])

  // Filter tasks based on selected project
  const currentProjectId = form.watch("projectId")
  const projectTasks = tasks.filter((task) => task.projectId === currentProjectId)

  function handleSubmit(values: z.infer<typeof formSchema>) {
    // If onSubmit prop is provided (edit mode), use it
    if (onSubmit) {
      // Find the project to get its name
      const project = projects.find((p) => p.id === values.projectId)
      const assignedTo = teamMembers.find((m) => m.id === values.assignedToId)?.name || "Unknown"

      if (!project) {
        toast({
          title: "Error",
          description: "Selected project not found.",
          variant: "destructive",
        })
        return
      }

      // Format the date to string
      const formattedDueDate = format(values.dueDate, "MMMM d, yyyy")

      // Map status values to proper format
      const statusMap: Record<string, string> = {
        to_do: "To Do",
        in_progress: "In Progress",
        review: "Review",
        done: "Done",
      }

      // Map priority values to proper format
      const priorityMap: Record<string, string> = {
        low: "Low",
        medium: "Medium",
        high: "High",
        urgent: "Urgent",
      }

      onSubmit({
        name: values.name,
        project: project.name,
        projectId: values.projectId,
        assignedTo: assignedTo,
        category: values.category,
        dueDate: formattedDueDate,
        priority: priorityMap[values.priority],
        status: statusMap[values.status],
        brief: values.brief,
        details: values.details,
      })

      toast({
        title: "Success",
        description: "Task updated successfully.",
      })
      return
    }

    // Original create logic
    // Find the project to get its name
    const project = projects.find((p) => p.id === values.projectId)
    const assignedTo = teamMembers.find((m) => m.id === values.assignedToId)?.name || "Unknown"

    if (!project) {
      toast({
        title: "Error",
        description: "Selected project not found.",
        variant: "destructive",
      })
      return
    }

    // Format the date to string
    const formattedDueDate = format(values.dueDate, "MMMM d, yyyy")

    // Map status values to proper format
    const statusMap: Record<string, string> = {
      to_do: "To Do",
      in_progress: "In Progress",
      review: "Review",
      done: "Done",
    }

    // Map priority values to proper format
    const priorityMap: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
    }

    // Create the new task
    const newTaskId = addTask({
      name: values.name,
      project: project.name,
      projectId: values.projectId,
      assignedTo: values.assignedToId,
      category: values.category,
      dueDate: formattedDueDate,
      priority: priorityMap[values.priority],
      status: statusMap[values.status],
      brief: values.brief,
      details: values.details,
    })

    // Add dependencies
    selectedDependencies.forEach((dep) => {
      addTaskDependency(newTaskId, dep.taskId, dep.type)
    })

    toast({
      title: "Task created",
      description: `${values.name} has been added to your tasks.`,
    })

    // Redirect to the new task or tasks list
    if (projectId) {
      router.push(`/dashboard/projects/${projectId}?tab=tasks`)
    } else {
      router.push("/dashboard/tasks")
    }
  }

  const toggleDependency = (taskId: string, type: TaskDependency["type"]) => {
    setSelectedDependencies((prev) => {
      const exists = prev.some((dep) => dep.taskId === taskId && dep.type === type)

      if (exists) {
        return prev.filter((dep) => !(dep.taskId === taskId && dep.type === type))
      } else {
        return [...prev, { taskId, type }]
      }
    })
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
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Design Instagram Carousel for Product Launch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {taskCategories.map((category) => (
                          <SelectItem key={category} value={category.toLowerCase()}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="assignedById"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned By</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select who is assigning this task" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select who this task is assigned to" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select task status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="to_do">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="brief"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brief</FormLabel>
                  <FormControl>
                    <Input placeholder="One-line summary of the task" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="In-depth description, reference files/links, etc."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentProjectId && projectTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Task Dependencies</h3>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                          <ArrowDown className="h-4 w-4" />
                          <span>Blocked by (This task depends on these tasks)</span>
                        </h4>
                        <div className="space-y-2">
                          {projectTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No tasks available in this project.</p>
                          ) : (
                            projectTasks.map((task) => (
                              <div key={`blocks-${task.id}`} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`blocks-${task.id}`}
                                  checked={selectedDependencies.some(
                                    (dep) => dep.taskId === task.id && dep.type === "blocks",
                                  )}
                                  onCheckedChange={() => toggleDependency(task.id, "blocks")}
                                />
                                <label
                                  htmlFor={`blocks-${task.id}`}
                                  className="flex items-center gap-2 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                                  <span>{task.name}</span>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                          <LinkIcon className="h-4 w-4" />
                          <span>Related to (Tasks are connected but not dependent)</span>
                        </h4>
                        <div className="space-y-2">
                          {projectTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No tasks available in this project.</p>
                          ) : (
                            projectTasks.map((task) => (
                              <div key={`related-${task.id}`} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`related-${task.id}`}
                                  checked={selectedDependencies.some(
                                    (dep) => dep.taskId === task.id && dep.type === "related_to",
                                  )}
                                  onCheckedChange={() => toggleDependency(task.id, "related_to")}
                                />
                                <label
                                  htmlFor={`related-${task.id}`}
                                  className="flex items-center gap-2 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                                  <span>{task.name}</span>
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">{mode === 'edit' ? 'Update Task' : 'Create Task'}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
