import { Metadata } from "next"
import { AddTransactionForm } from "@/components/finance/add-transaction-form"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Add New Transaction | Finance Management | Zoolyum CRM",
  description: "Add a new financial transaction to track your income and expenses.",
}

export default function AddTransactionPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Finance
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        heading="Add New Transaction"
        text="Record a new financial transaction with detailed information for accurate tracking and reporting."
      />

      {/* Transaction Form */}
      <AddTransactionForm />
    </div>
  )
}