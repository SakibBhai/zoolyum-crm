import { PageHeader } from "@/components/page-header"
import { ProjectReportBuilder } from "@/components/reports/project-report-builder"

export default function ProjectReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Project Reports"
        subheading="Generate detailed reports based on project data and export them in various formats."
      />
      <ProjectReportBuilder />
    </div>
  )
}
 