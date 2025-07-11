"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Project, ProjectStatusHistoryEntry } from "@/types/project"
import { useTaskContext } from "./task-context"

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

type ProjectContextType = {
  projects: Project[]
  updateProjectStatus: (projectId: string, newStatus: string, userId: string, userName: string) => void
  updateProjectProgress: (projectId: string, newProgress: number) => void
  getProjectById: (projectId: string) => Project | undefined
  refreshProjects: () => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const { tasks } = useTaskContext()

  // Fetch projects from database
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // Calculate project progress based on tasks
  useEffect(() => {
    if (tasks.length > 0 && projects.length > 0) {
      setProjects((prevProjects) => {
        // Create a new array only if there are actual changes
        const updatedProjects = prevProjects.map((project) => {
          const projectTasks = tasks.filter((task) => task.projectId === project.id)

          if (projectTasks.length === 0) return project

          const completedTasks = projectTasks.filter((task) => task.status === "Done").length
          const progress = Math.round((completedTasks / projectTasks.length) * 100)

          // Only update if values have changed
          if (
            project.tasksTotal === projectTasks.length &&
            project.tasksCompleted === completedTasks &&
            project.progress === progress
          ) {
            return project // No change needed
          }

          return {
            ...project,
            progress,
            tasksTotal: projectTasks.length,
            tasksCompleted: completedTasks,
          }
        })

        // Check if any project was actually updated
        const hasChanges = updatedProjects.some((updated, i) => updated !== prevProjects[i])

        return hasChanges ? updatedProjects : prevProjects
      })
    }
  }, [tasks])

  const updateProjectStatus = async (projectId: string, newStatus: string, userId: string, userName: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.map((project) => {
            if (project.id === projectId) {
              // Create a new status history entry
              const historyEntry: ProjectStatusHistoryEntry = {
                id: generateUUID(),
                date: new Date().toISOString(),
                oldStatus: project.status,
                newStatus: newStatus,
                userId: userId,
                userName: userName,
              }

              // Return updated project with new status and history
              return {
                ...project,
                status: newStatus,
                statusHistory: [...(project.statusHistory || []), historyEntry],
              }
            }
            return project
          }),
        )
      }
    } catch (error) {
      console.error('Error updating project status:', error)
    }
  }

  const updateProjectProgress = async (projectId: string, newProgress: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: newProgress }),
      })

      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                progress: newProgress,
              }
            }
            return project
          }),
        )
      }
    } catch (error) {
      console.error('Error updating project progress:', error)
    }
  }

  const getProjectById = (projectId: string) => {
    return projects.find((project) => project.id === projectId)
  }

  return (
    <ProjectContext.Provider value={{ projects, updateProjectStatus, updateProjectProgress, getProjectById, refreshProjects: fetchProjects }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProjectContext must be used within a ProjectProvider")
  }
  return context
}
