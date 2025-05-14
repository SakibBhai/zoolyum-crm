import { PageHeader } from "@/components/page-header"
import { PerformanceDashboard } from "@/components/reports/performance-dashboard"

export default function PerformanceDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Performance Dashboard"
        subheading="Track key performance indicators for social media and marketing campaigns."
      />
      <PerformanceDashboard />
    </div>
  )
}
