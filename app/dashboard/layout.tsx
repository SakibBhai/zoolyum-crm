import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { TaskProvider } from "@/contexts/task-context"
import { ProjectProvider } from "@/contexts/project-context"
import { InvoiceProvider } from "@/contexts/invoice-context"
import { RecurringInvoiceProvider } from "@/contexts/recurring-invoice-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TaskProvider>
      <ProjectProvider>
        <InvoiceProvider>
          <RecurringInvoiceProvider>
            <div className="flex min-h-screen flex-col md:flex-row">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 md:ml-64">{children}</main>
            </div>
          </RecurringInvoiceProvider>
        </InvoiceProvider>
      </ProjectProvider>
    </TaskProvider>
  )
}
