"use client"

import { useEffect, useState } from "react"
import { TaskDetails } from "@/components/tasks/task-details"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const [taskId, setTaskId] = useState<string | null>(null)

  useEffect(() => {
    async function initializeParams() {
      const { id } = await params
      setTaskId(id)
    }
    initializeParams()
  }, [params])

  if (!taskId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

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
          <PageHeader heading="Task Details" subheading={`View and manage task information for ID: ${taskId}`} />
        </div>
        <Link href={`/dashboard/tasks/${taskId}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Task
          </Button>
        </Link>
      </div>

      <TaskDetails id={taskId} />
    </div>
  )
}
