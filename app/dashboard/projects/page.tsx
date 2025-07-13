import { ProjectsTable } from "@/components/projects/projects-table"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader heading="Projects" subheading="Manage your Zoolyum projects and their details." />
        <Link href="/dashboard/projects/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        </Link>
      </div>
      <ProjectsTable />
    </div>
  )
}
