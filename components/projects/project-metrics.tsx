"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectBudgetChart } from "./project-budget-chart"
import { ProjectProgressChart } from "./project-progress-chart"
import { useProjectContext } from "@/contexts/project-context"
import { differenceInDays, parseISO } from "date-fns"

interface ProjectMetricsProps {
  projectId: string
}

export function ProjectMetrics({ projectId }: ProjectMetricsProps) {
  const { getProjectById } = useProjectContext()
  const project = getProjectById(projectId)

  if (!project) return null

  // Calculate days remaining
  const today = new Date()
  const deadline = parseISO(project.deadline.split(" ")[0])
  const daysRemaining = differenceInDays(deadline, today)

  // Calculate estimated completion date based on current progress
  const totalDuration = differenceInDays(deadline, parseISO(project.startDate.split(" ")[0]))
  const elapsedDuration = totalDuration - daysRemaining

  let estimatedCompletion = "On schedule"
  if (project.progress > 0) {
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
          <p className="text-xs text-muted-foreground">Until deadline: {project.deadline}</p>
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
          <div className="text-2xl font-bold">${(project.budget! - project.actualCost!).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Remaining from ${project.budget?.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tasks Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {project.tasksCompleted} / {project.tasksTotal}
          </div>
          <p className="text-xs text-muted-foreground">Tasks completed</p>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <ProjectProgressChart
          progress={project.progress}
          tasksCompleted={project.tasksCompleted || 0}
          tasksTotal={project.tasksTotal || 0}
        />
      </div>

      <div className="md:col-span-2">
        <ProjectBudgetChart budget={project.budget || 0} actualCost={project.actualCost || 0} />
      </div>
    </div>
  )
}
