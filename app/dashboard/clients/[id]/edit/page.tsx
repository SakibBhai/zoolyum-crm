"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ClientForm } from "@/components/clients/client-form"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function EditClientPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function fetchClient() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/clients/${params.id}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch client")
        }
        
        const data = await response.json()
        setClient(data)
      } catch (error) {
        console.error("Error fetching client:", error)
        toast({
          title: "Error",
          description: "Failed to load client. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchClient()
  }, [params.id, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${params.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <PageHeader heading="Edit Client" subheading="Update client information." />
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : client ? (
        <ClientForm clientData={client} isEditing={true} />
      ) : (
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-medium">Client not found</h3>
          <p className="text-muted-foreground">The requested client could not be found.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/clients")}>
            Return to Clients
          </Button>
        </div>
      )}
    </div>
  )
}