"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { InvoiceDetails } from "@/components/invoices/invoice-details"

interface InvoicePageProps {
  params: Promise<{
    id: string
  }>
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const [invoiceId, setInvoiceId] = useState<string | null>(null)

  useEffect(() => {
    async function initializeParams() {
      const { id } = await params
      setInvoiceId(id)
    }
    initializeParams()
  }, [params])

  if (!invoiceId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader heading="Invoice Details" subheading="View and manage invoice details." />
      <InvoiceDetails invoiceId={invoiceId} />
    </div>
  )
}
