"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectBudgetChart } from "./project-budget-chart"
import { ProjectProgressChart } from "./project-progress-chart"
import { useProjectContext } from "@/contexts/project-context"
import { differenceInDays, parseISO } from "date-fns"
import { useEffect, useState } from "react"

interface ProjectMetricsProps {
  projectId: string
}

export function ProjectMetrics({ projectId }: ProjectMetricsProps) {
  const { getProjectById } = useProjectContext()
  const project = getProjectById(projectId)
  const [today, setToday] = useState<Date | undefined>(undefined)

  // Set today's date on the client side only
  useEffect(() => {
    setToday(new Date())
  }, [])

  if (!project || !today) return null

  // Calculate days remaining
  const deadline = parseISO(project.end_date?.split(" ")[0] || new Date().toISOString())
  const daysRemaining = differenceInDays(deadline, today)

  // Calculate estimated completion date based on current progress
  const totalDuration = differenceInDays(deadline, parseISO(project.start_date?.split(" ")[0] || new Date().toISOString()))
  const elapsedDuration = totalDuration - daysRemaining

  let estimatedCompletion = "On schedule"
  if (project.progress && project.progress > 0) {
    const progressPerDay = project.progress / elapsedDuration
    const daysNeeded = 100 / progressPerDay
    const estimatedTotalDays = elapsedDuration + daysNeeded

    if (estimatedTotalDays > totalDuration) {
      const daysOver = Math.round(estimatedTotalDays - totalDuration)
      estimatedCompletion = `${daysOver} days behind schedule`
    } else if (estimatedTotalDays < totalDuration) {
      const daysAhead = Math.round(totalDuration - estimatedTotalDays)
      estimatedCompletion = `${daysAhead} days ahead of schedule`
    }
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{daysRemaining > 0 ? daysRemaining : "Overdue"}</div>
          <p className="text-xs text-muted-foreground">Until deadline: {project.end_date}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Estimated Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estimatedCompletion}</div>
          <p className="text-xs text-muted-foreground">Based on current progress</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${(project.estimated_budget! - project.actual_budget!).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Remaining from ${project.estimated_budget?.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tasks Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(project as any).tasksCompleted || 0} / {(project as any).tasksTotal || 0}
          </div>
          <p className="text-xs text-muted-foreground">Tasks completed</p>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <ProjectProgressChart
          progress={project.progress || 0}
          tasksCompleted={(project as any).tasksCompleted || 0}
          tasksTotal={(project as any).tasksTotal || 0}
        />
      </div>

      <div className="md:col-span-2">
        <ProjectBudgetChart budget={project.estimated_budget || 0} actualCost={project.actual_budget || 0} />
      </div>
    </div>
  )
}
