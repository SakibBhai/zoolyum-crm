import { PageHeader } from "@/components/page-header"
import { RecurringInvoiceList } from "@/components/invoices/recurring-invoice-list"

export default function RecurringInvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Recurring Invoices"
        subheading="Create templates for automatically generating invoices on a schedule."
      />
      <RecurringInvoiceList />
    </div>
  )
}
