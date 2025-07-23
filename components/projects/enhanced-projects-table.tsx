'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause
} from 'lucide-react'
import { format } from 'date-fns'
import { Project, TeamMember } from '@/types/project'
import { EnhancedProjectForm } from './enhanced-project-form'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EnhancedProjectsTableProps {
  initialProjects?: Project[]
  onProjectUpdate?: () => void
}

type SortField = 'name' | 'status' | 'priority' | 'start_date' | 'end_date' | 'progress' | 'estimated_budget'
type SortDirection = 'asc' | 'desc'

const STATUS_COLORS = {
  planning: 'bg-blue-100 text-blue-800 border-blue-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
}

const STATUS_ICONS = {
  planning: Clock,
  active: CheckCircle,
  on_hold: Pause,
  completed: CheckCircle,
  cancelled: XCircle
}

export function EnhancedProjectsTable({ initialProjects = [], onProjectUpdate }: EnhancedProjectsTableProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchProjects()
    // Set up real-time updates
    const interval = setInterval(fetchProjects, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchProjects = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to fetch projects')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleEdit = (project: Project) => {
    setSelectedProject(project)
    setFormMode('edit')
    setShowProjectForm(true)
  }

  const handleCreate = () => {
    setSelectedProject(null)
    setFormMode('create')
    setShowProjectForm(true)
  }

  const handleDelete = async (project: Project) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== project.id))
        toast.success('Project deleted successfully')
        onProjectUpdate?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setLoading(false)
      setDeleteProject(null)
    }
  }

  const handleFormSuccess = () => {
    fetchProjects()
    onProjectUpdate?.()
  }

  const exportProjects = () => {
    const csvContent = [
      ['Name', 'Status', 'Priority', 'Type', 'Manager', 'Start Date', 'End Date', 'Progress', 'Budget', 'Client'].join(','),
      ...filteredAndSortedProjects.map(project => [
        project.name,
        project.status,
        project.priority || 'medium',
        project.type || '',
        project.manager || '',
        project.start_date || '',
        project.end_date || '',
        `${project.progress || 0}%`,
        project.estimated_budget || 0,
        project.client_name || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `projects-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.manager?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
      const matchesType = typeFilter === 'all' || project.type === typeFilter

      return matchesSearch && matchesStatus && matchesPriority && matchesType
    })

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle different data types
      if (sortField === 'estimated_budget' || sortField === 'progress') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else if (sortField === 'start_date' || sortField === 'end_date') {
        aValue = aValue ? new Date(aValue) : new Date(0)
        bValue = bValue ? new Date(bValue) : new Date(0)
      } else {
        aValue = String(aValue || '').toLowerCase()
        bValue = String(bValue || '').toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [projects, searchTerm, statusFilter, priorityFilter, typeFilter, sortField, sortDirection])

  const projectTypes = useMemo(() => {
    const types = [...new Set(projects.map(p => p.type).filter(Boolean))]
    return types.sort()
  }, [projects])

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const getStatusIcon = (status: string) => {
    const IconComponent = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock
    return <IconComponent className="h-3 w-3" />
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage and track all your projects in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchProjects}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportProjects}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(projects.reduce((sum, p) => sum + (p.estimated_budget || 0), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {projectTypes.map(type => type && (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              Showing {filteredAndSortedProjects.length} of {projects.length} projects
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-semibold"
                    >
                      Project Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('status')}
                      className="h-auto p-0 font-semibold"
                    >
                      Status
                      {getSortIcon('status')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('priority')}
                      className="h-auto p-0 font-semibold"
                    >
                      Priority
                      {getSortIcon('priority')}
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('progress')}
                      className="h-auto p-0 font-semibold"
                    >
                      Progress
                      {getSortIcon('progress')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('start_date')}
                      className="h-auto p-0 font-semibold"
                    >
                      Start Date
                      {getSortIcon('start_date')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('end_date')}
                      className="h-auto p-0 font-semibold"
                    >
                      End Date
                      {getSortIcon('end_date')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('estimated_budget')}
                      className="h-auto p-0 font-semibold"
                    >
                      Budget
                      {getSortIcon('estimated_budget')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {projects.length === 0 ? 'No projects found. Create your first project!' : 'No projects match your filters.'}
                        </p>
                        {projects.length === 0 && (
                          <Button onClick={handleCreate} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Project
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedProjects.map((project) => (
                    <TableRow key={project.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {project.description}
                            </div>
                          )}
                          {project.client_name && (
                            <div className="text-xs text-muted-foreground">
                              Client: {project.client_name}
                            </div>
                          )}
                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {project.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{project.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('flex items-center gap-1 w-fit', STATUS_COLORS[project.status])}>
                          {getStatusIcon(project.status)}
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('w-fit', PRIORITY_COLORS[project.priority || 'medium'])}>
                          {project.priority || 'medium'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{project.type || '-'}</span>
                      </TableCell>
                      <TableCell>
                        {project.manager ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {project.manager.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{project.manager}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {project.team_members?.length || project.assigned_team_ids?.length || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{project.progress || 0}%</span>
                          </div>
                          <Progress
                            value={project.progress || 0}
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {project.start_date ? format(new Date(project.start_date), 'MMM dd, yyyy') : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {project.end_date ? format(new Date(project.end_date), 'MMM dd, yyyy') : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {formatCurrency(project.estimated_budget)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(project)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteProject(project)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Project Form */}
      <EnhancedProjectForm
        open={showProjectForm}
        onOpenChange={setShowProjectForm}
        project={selectedProject || undefined}
        mode={formMode}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              "{deleteProject?.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProject && handleDelete(deleteProject)}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}