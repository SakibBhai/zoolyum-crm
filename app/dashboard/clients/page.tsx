"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { ClientsTable } from "@/components/clients/clients-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuickProjectForm } from "@/components/projects/quick-project-form"
import { ClientForm } from "@/components/clients/client-form"
import { Plus, Users, Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ClientsPage() {
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("clients")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleAddProject = (clientId: string) => {
    setSelectedClientId(clientId)
    setShowProjectForm(true)
    setActiveTab("projects")
  }

  const handleProjectCreated = () => {
    setShowProjectForm(false)
    setSelectedClientId(null)
    setActiveTab("clients")
    // Trigger refresh of clients table
    setRefreshTrigger(prev => prev + 1)
  }

  const handleClientCreated = () => {
    setActiveTab("clients")
    // Trigger refresh of clients table
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          heading="Client Management"
          subheading="Manage your clients, track their projects, and grow your business relationships"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab("add-client")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Add Client
          </Button>
          <Button
            onClick={() => setActiveTab("add-client")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:inline-flex">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="add-client" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </TabsTrigger>
          {showProjectForm && (
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Add Project
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="clients" className="space-y-6">
          <ClientsTable
            onAddProject={handleAddProject}
            key={refreshTrigger} // Force re-render when clients are added/updated
          />
        </TabsContent>

        <TabsContent value="add-client" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add New Client
              </CardTitle>
              <CardDescription>
                Create a new client profile to start managing their projects and information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl">
                <ClientForm
                  onSuccess={handleClientCreated}
                  onCancel={() => setActiveTab("clients")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {showProjectForm && (
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Add New Project
                </CardTitle>
                <CardDescription>
                  Create a new project for the selected client.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-2xl">
                  <QuickProjectForm
                    defaultClientId={selectedClientId || undefined}
                    onSuccess={handleProjectCreated}
                    onCancel={() => {
                      setShowProjectForm(false)
                      setSelectedClientId(null)
                      setActiveTab("clients")
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
