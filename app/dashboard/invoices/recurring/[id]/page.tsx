import { PageHeader } from "@/components/page-header"
import { RecurringInvoiceDetails } from "@/components/invoices/recurring-invoice-details"

interface RecurringInvoicePageProps {
  params: {
    id: string
  }
}

export default function RecurringInvoicePage({ params }: RecurringInvoicePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader heading="Recurring Invoice Template" subheading="View and manage your recurring invoice template." />
      <RecurringInvoiceDetails id={params.id} />
    </div>
  )
}
