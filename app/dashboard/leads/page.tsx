import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { LeadsOverview } from "@/components/leads/leads-overview"

export const metadata: Metadata = {
  title: "Leads Management | Zoolyum CRM",
  description: "Manage and track sales leads, follow-ups, and conversion pipeline.",
}

export default function LeadsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        heading="Leads Management"
        subheading="Track, manage, and convert your sales leads efficiently"
      />
      <LeadsOverview />
    </div>
  )
}