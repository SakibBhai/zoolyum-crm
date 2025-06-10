"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Task, StatusHistoryEntry, TaskDependency } from "@/types/task"

// Initial mock data
import { initialTasks } from "@/data/tasks"

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
  addTask: (task: Omit<Task, "id" | "statusHistory" | "dependencies">) => string
  updateTask: (taskId: string, updates: Partial<Omit<Task, "id" | "statusHistory" | "dependencies">>) => void
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
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  // Initialize tasks from mock data
  useEffect(() => {
    setTasks(initialTasks)
  }, [])

  const addTask = (task: Omit<Task, "id" | "statusHistory" | "dependencies">) => {
    const newTaskId = generateUUID()

    const newTask: Task = {
      id: newTaskId,
      ...task,
      statusHistory: [
        {
          id: generateUUID(),
          date: new Date().toISOString(),
          oldStatus: "",
          newStatus: task.status,
          userId: "user1", // In a real app, this would be the current user's ID
          userName: "Sarah Johnson", // In a real app, this would be the current user's name
        },
      ],
      dependencies: [],
    }

    setTasks((prevTasks) => [...prevTasks, newTask])
    return newTaskId
  }

  const updateTask = (taskId: string, updates: Partial<Omit<Task, "id" | "statusHistory" | "dependencies">>) => {
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
  }

  const deleteTask = async (taskId: string) => {
    try {
      // Call API to delete from database
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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

  const updateTaskStatus = (taskId: string, newStatus: string, userId: string, userName: string) => {
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
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        getTaskById,
        addTaskDependency,
        removeTaskDependency,
        getTaskDependencies,
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
