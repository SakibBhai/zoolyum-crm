import { PageHeader } from "@/components/page-header"
import { InvoiceForm } from "@/components/invoices/invoice-form"

export default function NewInvoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader heading="Create Invoice" subheading="Create a new invoice for a client or project." />
      <InvoiceForm />
    </div>
  )
}
