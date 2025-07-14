import { Metadata } from "next"
import { EnhancedFinanceOverview } from "@/components/finance/enhanced-finance-overview"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Finance Management | Zoolyum CRM",
  description: "Track income, expenses, and financial performance with comprehensive analytics.",
}

export default function FinancePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader
        title="Finance Management"
        description="Track your income, expenses, and financial performance with detailed analytics and reporting."
      />
      <EnhancedFinanceOverview />
    </div>
  )
}