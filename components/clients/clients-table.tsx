"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

type Client = {
  id: string
  name: string
  industry: string
  contact_name: string
  email: string
  phone: string
  status: string
}

interface ClientsTableProps {
  onAddProject?: (clientId: string) => void
}

export function ClientsTable({ onAddProject }: ClientsTableProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      setIsLoading(true)
      const response = await fetch("/api/clients")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: `Failed to load clients: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteClient(id: string) {
    if (confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete client")
        }

        toast({
          title: "Client deleted",
          description: "The client has been successfully deleted.",
        })

        // Refresh the client list
        fetchClients()
      } catch (error) {
        console.error("Error deleting client:", error)
        toast({
          title: "Error",
          description: "Failed to delete client. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  function getStatusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "prospect":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search clients..."
          className="max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  Loading clients...
                </TableCell>
              </TableRow>
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  No clients found. {searchTerm && "Try a different search term."}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{client.industry}</TableCell>
                  <TableCell>{client.contact_name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(client.status)} variant="outline">
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onAddProject && (
                        <Button variant="ghost" size="sm" onClick={() => onAddProject(client.id)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Project
                        </Button>
                      )}
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => deleteClient(client.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
