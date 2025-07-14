import { ClientDetails } from "@/components/clients/client-details"
import { ClientProjects } from "@/components/clients/client-projects"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"

export default async function ClientPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <PageHeader heading="Client Details" subheading={`View and manage client information for ID: ${params.id}`} />
        </div>
        <Link href={`/dashboard/clients/${params.id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <ClientDetails id={params.id} />
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          <ClientProjects clientId={params.id} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <div className="rounded-lg border p-6">
            <h3 className="text-lg font-medium">Client Reports</h3>
            <p className="text-muted-foreground">Reports for this client will appear here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
