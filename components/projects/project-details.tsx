"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, Calendar, User, Building, FileText, DollarSign } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { useProjectContext } from "@/contexts/project-context"
import { ProjectStatusSelect } from "./project-status-select"
import { ProjectStatusHistory } from "./project-status-history"

export function ProjectDetails({ id }: { id: string }) {
  const { getProjectById } = useProjectContext()
  const project = getProjectById(id)

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p>Project not found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Basic details about the project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Project Name</p>
              <p>{project.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Client</p>
              <Link href={`/dashboard/clients/${project.clientId}`} className="hover:underline">
                {project.client}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Project Type</p>
            <p>{project.type}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Status</p>
            <div className="mt-1">
              <ProjectStatusSelect projectId={project.id} currentStatus={project.status} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Progress</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={project.progress} className="h-2 w-full" />
              <span className="text-xs text-muted-foreground w-10">{project.progress}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline & Management</CardTitle>
          <CardDescription>Project timeline and management details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Start Date</p>
              <p>{project.startDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Deadline</p>
              <p>{project.deadline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Project Manager</p>
              <p>{project.manager}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Tasks</p>
            <p>
              {project.tasksCompleted} of {project.tasksTotal} tasks completed
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget & Costs</CardTitle>
          <CardDescription>Financial information about the project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Total Budget</p>
              <p>${project.budget?.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Actual Cost</p>
              <p>${project.actualCost?.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Budget Utilization</p>
            <div className="flex items-center gap-2 mt-1">
              <Progress
                value={project.budget ? (project.actualCost! / project.budget) * 100 : 0}
                className="h-2 w-full"
              />
              <span className="text-xs text-muted-foreground w-10">
                {project.budget ? Math.round((project.actualCost! / project.budget) * 100) : 0}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Project Description</CardTitle>
          <CardDescription>Detailed information about the project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <ProjectStatusHistory history={project.statusHistory || []} />
      </Card>
    </div>
  )
}
