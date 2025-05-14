import { PageHeader } from "@/components/page-header"
import { InvoiceDetails } from "@/components/invoices/invoice-details"

interface InvoicePageProps {
  params: {
    id: string
  }
}

export default function InvoicePage({ params }: InvoicePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader heading="Invoice Details" subheading="View and manage invoice details." />
      <InvoiceDetails invoiceId={params.id} />
    </div>
  )
}
