import { PageHeader } from "@/components/page-header"
import { TaskReportBuilder } from "@/components/reports/task-report-builder"

export default function TaskReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Task Reports"
        subheading="Generate detailed reports based on task data and export them in various formats."
      />
      <TaskReportBuilder />
    </div>
  )
}
