"use client"

import { useState } from "react"
import { useProjectContext } from "@/contexts/project-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Filter, TableIcon } from "lucide-react"

export function ProjectReportBuilder() {
  const { projects } = useProjectContext()
  const [activeTab, setActiveTab] = useState("filters")
  const [selectedProject, setSelectedProject] = useState<string>("")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Report</CardTitle>
        <CardDescription>Configure and generate project reports</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="filters">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </TabsTrigger>
            <TabsTrigger value="preview">
              <TableIcon className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="summary">
              <BarChart3 className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Select Project</h3>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {selectedProject
                  ? "Project report preview will appear here"
                  : "Please select a project to generate a report"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="summary">
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {selectedProject
                  ? "Project summary charts will appear here"
                  : "Please select a project to view summary"}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
