import { InvoiceDashboard } from '@/components/invoices/invoice-dashboard'
import { InvoiceTemplateProvider } from '@/contexts/invoice-template-context'

export default function InvoicesPage() {
  return (
    <InvoiceTemplateProvider>
      <div className="container mx-auto py-6">
        <InvoiceDashboard />
      </div>
    </InvoiceTemplateProvider>
  )
}

export const metadata = {
  title: 'Invoices - Zoolyum CRM',
  description: 'Manage invoices, track payments, and monitor revenue with advanced invoice generation features.'
}