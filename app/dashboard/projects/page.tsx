'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, FolderPlus, BarChart3, Users, Calendar, DollarSign } from 'lucide-react'
import { EnhancedProjectForm } from '@/components/projects/enhanced-project-form'
import { EnhancedProjectsTable } from '@/components/projects/enhanced-projects-table'
import { Project } from '@/types/project'
import { toast } from 'sonner'

interface ProjectStats {
  total: number
  active: number
  completed: number
  overdue: number
  totalBudget: number
  averageProgress: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    active: 0,
    completed: 0,
    overdue: 0,
    totalBudget: 0,
    averageProgress: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/projects?includeActivities=true')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()

      // The API returns projects array directly, not wrapped in an object
      setProjects(Array.isArray(data) ? data : [])

      // Calculate stats from the projects data
      if (Array.isArray(data)) {
        const calculatedStats = {
          total: data.length,
          active: data.filter(p => p.status === 'active').length,
          completed: data.filter(p => p.status === 'completed').length,
          overdue: data.filter(p => p.status === 'overdue' || (p.deadline && new Date(p.deadline) < new Date())).length,
          totalBudget: data.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0),
          averageProgress: data.length > 0 ? data.reduce((sum, p) => sum + (p.progress || 0), 0) / data.length : 0
        }
        setStats(calculatedStats)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleProjectCreated = () => {
    setIsCreateModalOpen(false)
    toast.success('Project created successfully!')
    fetchProjects() // Refresh to get updated stats
  }

  const handleProjectUpdated = () => {
    setIsEditModalOpen(false)
    setEditingProject(null)
    toast.success('Project updated successfully!')
    fetchProjects() // Refresh to get updated stats
  }

  const handleEditModalChange = (open: boolean) => {
    setIsEditModalOpen(open)
    if (!open) {
      setEditingProject(null)
    }
  }

  const handleProjectDeleted = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
    toast.success('Project deleted successfully!')
    fetchProjects() // Refresh to get updated stats
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setIsEditModalOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and track your projects with comprehensive tools
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5" />
                Create New Project
              </DialogTitle>
              <DialogDescription>
                Set up a new project with all the necessary details, team assignments, and documentation.
              </DialogDescription>
            </DialogHeader>
            <EnhancedProjectForm
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
              onSuccess={handleProjectCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All projects in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Past deadline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageProgress)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Management
          </CardTitle>
          <CardDescription>
            View, filter, and manage all your projects in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedProjectsTable
            initialProjects={projects}
            onProjectUpdate={fetchProjects}
          />
        </CardContent>
      </Card>

      {/* Edit Project Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={handleEditModalChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Edit Project
            </DialogTitle>
            <DialogDescription>
              Update project details, team assignments, and documentation.
            </DialogDescription>
          </DialogHeader>
          {editingProject && (
            <EnhancedProjectForm
              open={isEditModalOpen}
              onOpenChange={handleEditModalChange}
              project={editingProject}
              onSuccess={handleProjectUpdated}
              mode="edit"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
