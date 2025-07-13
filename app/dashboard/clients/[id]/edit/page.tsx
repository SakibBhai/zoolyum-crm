"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ClientForm } from "@/components/clients/client-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface Client {
  id: number
  name: string
  email: string
  phone: string
  address?: string
  status: string
  billing_terms?: string
  contract_details?: string
}

export default function EditClientPage() {
  const params = useParams()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch client')
        }
        
        const clientData = await response.json()
        setClient(clientData)
      } catch (err) {
        console.error('Error fetching client:', err)
        setError('Failed to load client data')
        toast({
          title: "Error",
          description: "Failed to load client data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchClient()
    }
  }, [params.id, toast])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error || "Client not found"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Client</h1>
        <p className="text-muted-foreground">
          Update {client.name}'s information
        </p>
      </div>
      
      <ClientForm 
        initialData={client} 
        isEditing={true} 
      />
    </div>
  )
}