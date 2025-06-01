"use client"

import { useState } from "react"
import { ClientsTable } from "@/components/clients/clients-table"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { QuickProjectForm } from "@/components/projects/quick-project-form"
import Link from "next/link"
import { Plus, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ClientsPage() {
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState("clients")

  const handleAddProject = (clientId?: string) => {
    setSelectedClientId(clientId)
    setShowProjectForm(true)
    setActiveTab("add-project")
  }

  const handleProjectSuccess = () => {
    setShowProjectForm(false)
    setActiveTab("clients")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader heading="Clients" subheading="Manage your agency clients and their information." />
        <div className="flex gap-3">
          {!showProjectForm && (
            <Button variant="outline" onClick={() => handleAddProject()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Project
            </Button>
          )}
          <Link href="/dashboard/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          {showProjectForm && <TabsTrigger value="add-project">Add Project</TabsTrigger>}
        </TabsList>
        <TabsContent value="clients" className="mt-4">
          <ClientsTable onAddProject={handleAddProject} />
        </TabsContent>
        {showProjectForm && (
          <TabsContent value="add-project" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Add New Project</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowProjectForm(false)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <QuickProjectForm
              onSuccess={handleProjectSuccess}
              onCancel={() => setShowProjectForm(false)}
              defaultClientId={selectedClientId}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
