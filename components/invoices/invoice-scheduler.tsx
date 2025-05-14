"use client"

import { useEffect } from "react"
import { useRecurringInvoiceContext } from "@/contexts/recurring-invoice-context"

export function InvoiceScheduler() {
  const { checkAndGenerateScheduledInvoices } = useRecurringInvoiceContext()

  useEffect(() => {
    // Check for scheduled invoices on component mount
    checkAndGenerateScheduledInvoices()

    // Set up an interval to check every hour (in a real app, this would be a server-side job)
    const intervalId = setInterval(
      () => {
        checkAndGenerateScheduledInvoices()
      },
      60 * 60 * 1000,
    ) // 1 hour

    return () => clearInterval(intervalId)
  }, [checkAndGenerateScheduledInvoices])

  // This component doesn't render anything
  return null
}
