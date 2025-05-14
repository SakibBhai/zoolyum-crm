import { PageHeader } from "@/components/page-header"
import { InvoiceList } from "@/components/invoices/invoice-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader heading="Invoices" subheading="Create, manage, and track invoices for your clients and projects." />

      <Tabs defaultValue="invoices" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="recurring" asChild>
              <Link href="/dashboard/invoices/recurring">Recurring</Link>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="invoices" className="space-y-4">
          <InvoiceList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
