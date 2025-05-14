import { PageHeader } from "@/components/page-header"
import { RecurringInvoiceForm } from "@/components/invoices/recurring-invoice-form"

export default function NewRecurringInvoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="New Recurring Invoice Template"
        subheading="Create a template for automatically generating invoices on a schedule."
      />
      <RecurringInvoiceForm />
    </div>
  )
}
