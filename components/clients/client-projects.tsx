import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FolderKanban, Plus } from "lucide-react"
import Link from "next/link"

// Mock data - in a real app, you would fetch this from your API
const projects = [
  {
    id: "1",
    name: "Summer Collection Campaign",
    type: "Social Media Management",
    startDate: "April 1, 2023",
    deadline: "August 31, 2023",
    manager: "Sarah Johnson",
    status: "In Progress",
    tasksCount: 12,
    tasksCompleted: 5,
  },
  {
    id: "2",
    name: "Website Redesign",
    type: "Website Design",
    startDate: "March 15, 2023",
    deadline: "June 30, 2023",
    manager: "Michael Chen",
    status: "In Progress",
    tasksCount: 8,
    tasksCompleted: 3,
  },
  {
    id: "3",
    name: "Brand Identity Refresh",
    type: "Branding",
    startDate: "February 1, 2023",
    deadline: "May 15, 2023",
    manager: "Emily Rodriguez",
    status: "Completed",
    tasksCount: 10,
    tasksCompleted: 10,
  },
]

export function ClientProjects({ clientId }: { clientId: string }) {
  // In a real app, you would fetch the projects for this client based on the ID

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Client Projects</h3>
        <Link href={`/dashboard/projects/new?client=${clientId}`}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <FolderKanban className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm text-muted-foreground mb-4">This client doesn't have any projects yet.</p>
            <Link href={`/dashboard/projects/new?client=${clientId}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="h-full transition-all hover:border-primary hover:shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <Badge variant={project.status === "Completed" ? "outline" : "default"}>{project.status}</Badge>
                  </div>
                  <CardDescription>{project.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span>{project.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deadline:</span>
                      <span>{project.deadline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manager:</span>
                      <span>{project.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tasks:</span>
                      <span>
                        {project.tasksCompleted}/{project.tasksCount} completed
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
