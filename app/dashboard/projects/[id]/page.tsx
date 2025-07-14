import { ProjectDetails } from "@/components/projects/project-details"
import { ProjectTasks } from "@/components/projects/project-tasks"
import { ProjectMetrics } from "@/components/projects/project-metrics"
import { ContentCalendar } from "@/components/projects/content-calendar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"

export default async function ProjectPage({
  params,
  searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  // Default to 'details' tab if none specified
  const defaultTab = resolvedSearchParams.tab || "details"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <PageHeader
            heading="Project Details"
            subheading={`View and manage project information for ID: ${id}`}
          />
        </div>
        <Link href={`/dashboard/projects/${id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </Link>
      </div>

      <ProjectMetrics projectId={id} />

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <ProjectDetails id={id} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <ProjectTasks projectId={id} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <ContentCalendar projectId={id} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-medium">Project Reports</h3>
            <p className="text-muted-foreground">Reports for this project will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
