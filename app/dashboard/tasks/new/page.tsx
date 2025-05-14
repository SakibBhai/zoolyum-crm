import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { TaskForm } from "@/components/tasks/task-form"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton loader for the task form
function TaskFormSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-[100px] mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div>
            <Skeleton className="h-4 w-[100px] mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div>
            <Skeleton className="h-4 w-[100px] mb-2" />
            <Skeleton className="h-32 w-full" />
          </div>

          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function NewTaskPage() {
  return (
    <div className="flex flex-col gap-8 pb-10">
      <PageHeader heading="Create New Task" text="Add a new task to your project" />
      <Suspense fallback={<TaskFormSkeleton />}>
        <TaskForm />
      </Suspense>
    </div>
  )
}
