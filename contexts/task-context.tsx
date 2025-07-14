"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Task, StatusHistoryEntry, TaskDependency } from "@/types/task"
import type { TeamMember } from "@/types/team"

// UUID generation function
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments where crypto.randomUUID is not available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

type TaskContextType = {
  tasks: Task[]
  teamMembers: TeamMember[] // Add team members to context
  addTask: (task: Omit<Task, "id" | "statusHistory" | "dependencies">) => Promise<string>
  updateTask: (taskId: string, updates: Partial<Omit<Task, "id" | "statusHistory" | "dependencies">>) => Promise<void>
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>
  updateTaskStatus: (taskId: string, newStatus: string, userId: string, userName: string) => void
  getTaskById: (taskId: string) => Task | undefined
  addTaskDependency: (taskId: string, dependsOnTaskId: string, type: TaskDependency["type"]) => void
  removeTaskDependency: (taskId: string, dependencyId: string) => void
  getTaskDependencies: (taskId: string) => {
    dependencies: Task[]
    dependents: Task[]
    related: Task[]
  }
  refreshTasks: () => void
  refreshTeamMembers: () => Promise<void> // Add method to refresh team members
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  // Fetch team members from database
  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team')
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  // Fetch tasks from database
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        // Transform the database data to match the Task type
        const transformedTasks = data.map((dbTask: any) => ({
          id: dbTask.id,
          name: dbTask.title,
          project: dbTask.project_name || 'Unknown Project',
          projectId: dbTask.project_id,
          assignedTo: dbTask.assignee_name || 'Unassigned',
          category: 'General', // Default category
          dueDate: dbTask.due_date,
          priority: dbTask.priority,
          status: dbTask.status,
          brief: dbTask.description,
          details: '',
          statusHistory: [],
          dependencies: [],
        }))
        setTasks(transformedTasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchTeamMembers()
  }, [])

  const addTask = async (task: Omit<Task, "id" | "statusHistory" | "dependencies">) => {
    try {
      // Transform status from display format to database format
      const statusMap: Record<string, string> = {
        'To Do': 'todo',
        'In Progress': 'in_progress',
        'Review': 'review',
        'Done': 'done',
        'Backlog': 'backlog',
      }

      // Transform priority from display format to database format  
      const priorityMap: Record<string, string> = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
        'Urgent': 'urgent',
      }

      // Parse date - handle both formatted strings and ISO strings
      let parsedDate: string
      try {
        // Try to parse as a formatted date first
        parsedDate = new Date(task.dueDate).toISOString()
      } catch (e) {
        // If that fails, assume it's already in a valid format
        parsedDate = task.dueDate
      }

      // Transform the task data to match the database schema
      const dbTask = {
        title: task.name,
        description: task.brief + (task.details ? '\n\n' + task.details : ''),
        project_id: task.projectId,
        assigned_to: task.assignedTo, // This should be the team member ID
        due_date: parsedDate,
        priority: priorityMap[task.priority] || task.priority.toLowerCase(),
        status: statusMap[task.status] || task.status.toLowerCase().replace(' ', '_').replace('to_do', 'todo'),
        estimated_hours: null,
        is_content_related: false,
        dependencies: [],
      }

      console.log('Sending task data to API:', dbTask)

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dbTask),
      })

      if (response.ok) {
        const newTask = await response.json()
        console.log('Received task from API:', newTask)
        // Transform the response back to match the Task type
        const transformedTask = {
          id: newTask.id,
          name: newTask.title,
          project: newTask.project_name || 'Unknown Project',
          projectId: newTask.project_id,
          assignedTo: newTask.assignee_name || 'Unassigned',
          category: 'General', // Default category
          dueDate: newTask.due_date,
          priority: newTask.priority,
          status: newTask.status,
          brief: newTask.description,
          details: '',
          statusHistory: [],
          dependencies: [],
        }
        setTasks(prevTasks => [...prevTasks, transformedTask])
        return newTask.id
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('Error response from API:', errorData)
        throw new Error(errorData.error || `Failed to add task: ${response.status}`)
      }
    } catch (error) {
      console.error('Error adding task:', error)
      throw error // Re-throw the error instead of silently falling back
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Omit<Task, "id" | "statusHistory" | "dependencies">>) => {
    try {
      // Transform status from display format to database format if status is being updated
      const statusMap: Record<string, string> = {
        'To Do': 'todo',
        'In Progress': 'in_progress',
        'Review': 'review',
        'Done': 'done',
        'Backlog': 'backlog',
      }

      // Transform priority from display format to database format if priority is being updated
      const priorityMap: Record<string, string> = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
        'Urgent': 'urgent',
      }

      // Transform the updates to match the database schema
      const dbUpdates: any = {}
      
      if (updates.status) {
        dbUpdates.status = statusMap[updates.status] || updates.status.toLowerCase().replace(' ', '_').replace('to_do', 'todo')
      }
      
      if (updates.priority) {
        dbUpdates.priority = priorityMap[updates.priority] || updates.priority.toLowerCase()
      }
      
      if (updates.name) {
        dbUpdates.title = updates.name
      }
      
      if (updates.brief || updates.details) {
        dbUpdates.description = (updates.brief || '') + (updates.details ? '\n\n' + updates.details : '')
      }
      
      if (updates.projectId) {
        dbUpdates.project_id = updates.projectId
      }
      
      if (updates.assignedTo) {
        dbUpdates.assigned_to = updates.assignedTo
      }
      
      if (updates.dueDate) {
        dbUpdates.due_date = updates.dueDate
      }
      
      // Copy over any other fields that don't need transformation
      Object.keys(updates).forEach(key => {
        if (!['status', 'priority', 'name', 'brief', 'details', 'projectId', 'assignedTo', 'dueDate'].includes(key)) {
          dbUpdates[key] = (updates as any)[key]
        }
      })

      const response = await fetch(`/api/tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: taskId, ...dbUpdates }),
      })

      if (response.ok) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            }
            return task
          })
        )
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('Error updating task:', errorData)
        throw new Error(errorData.error || `Failed to update task: ${response.status}`)
      }
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      // Call API to delete from database
      const response = await fetch(`/api/tasks`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: taskId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(typeof errorData === 'object' && errorData !== null && 'error' in errorData ? (errorData as { error: string }).error : 'Failed to delete task')
      }

      // If API call successful, update local state
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
      
      return { success: true }
    } catch (error) {
      console.error('Error deleting task:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string, userId: string, userName: string) => {
    try {
      // First update the database via API
      await updateTask(taskId, { status: newStatus })
      
      // Then update local state with status history
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.id === taskId) {
            // Create a new status history entry
            const historyEntry: StatusHistoryEntry = {
              id: generateUUID(),
              date: new Date().toISOString(),
              oldStatus: task.status,
              newStatus: newStatus,
              userId: userId,
              userName: userName,
            }

            // Return updated task with new status and history
            return {
              ...task,
              status: newStatus,
              statusHistory: [...(task.statusHistory || []), historyEntry],
            }
          }
          return task
        }),
      )
    } catch (error) {
      console.error('Error updating task status:', error)
      throw error
    }
  }

  const getTaskById = (taskId: string) => {
    return tasks.find((task) => task.id === taskId)
  }

  const addTaskDependency = (taskId: string, dependsOnTaskId: string, type: TaskDependency["type"]) => {
    // Don't allow a task to depend on itself
    if (taskId === dependsOnTaskId) return

    // Don't allow duplicate dependencies
    const task = getTaskById(taskId)
    if (task?.dependencies?.some((dep) => dep.dependsOnTaskId === dependsOnTaskId && dep.type === type)) {
      return
    }

    const newDependency: TaskDependency = {
      id: generateUUID(),
      taskId,
      dependsOnTaskId,
      type,
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            dependencies: [...(task.dependencies || []), newDependency],
          }
        }
        return task
      }),
    )
  }

  const removeTaskDependency = (taskId: string, dependencyId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            dependencies: (task.dependencies || []).filter((dep) => dep.id !== dependencyId),
          }
        }
        return task
      }),
    )
  }

  const getTaskDependencies = (taskId: string) => {
    const task = getTaskById(taskId)

    if (!task || !task.dependencies) {
      return {
        dependencies: [],
        dependents: [],
        related: [],
      }
    }

    // Tasks that this task depends on
    const dependencies = tasks.filter((t) =>
      task.dependencies?.some((dep) => dep.dependsOnTaskId === t.id && dep.type === "blocks"),
    )

    // Tasks that depend on this task
    const dependents = tasks.filter((t) =>
      t.dependencies?.some((dep) => dep.dependsOnTaskId === taskId && dep.type === "blocks"),
    )

    // Tasks that are related to this task
    const related = tasks.filter(
      (t) =>
        task.dependencies?.some((dep) => dep.dependsOnTaskId === t.id && dep.type === "related_to") ||
        t.dependencies?.some((dep) => dep.dependsOnTaskId === taskId && dep.type === "related_to"),
    )

    return {
      dependencies,
      dependents,
      related,
    }
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        teamMembers, // Add teamMembers to context value
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        getTaskById,
        addTaskDependency,
        removeTaskDependency,
        getTaskDependencies,
        refreshTasks: fetchTasks,
        refreshTeamMembers: fetchTeamMembers, // Add refreshTeamMembers method
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider")
  }
  return context
}
