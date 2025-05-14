import { TaskDetails } from "@/components/tasks/task-details"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"

export default function TaskPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tasks">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <PageHeader heading="Task Details" subheading={`View and manage task information for ID: ${params.id}`} />
        </div>
        <Link href={`/dashboard/tasks/${params.id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Task
          </Button>
        </Link>
      </div>

      <TaskDetails id={params.id} />
    </div>
  )
}
