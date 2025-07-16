'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CalendarIcon,
  Upload,
  X,
  Plus,
  User,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Download,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Project, TeamMember, ProjectDocument } from '@/types/project'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string
  email?: string
  company?: string
}

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().optional(),
  client_id: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  type: z.string().min(1, 'Project type is required'),
  manager: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  estimated_budget: z.number().min(0, 'Budget must be positive').optional(),
  actual_budget: z.number().min(0, 'Actual budget must be positive').optional(),
  progress: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  team_members: z.array(z.string()).optional(),
  recurrence_pattern: z.object({
    type: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    interval: z.number().min(1).optional(),
    end_date: z.string().optional(),
  }).optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

interface EnhancedProjectFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project
  onSuccess?: () => void
  mode?: 'create' | 'edit'
}

const PROJECT_TYPES = [
  'Web Development',
  'Mobile App',
  'Desktop Application',
  'API Development',
  'Database Design',
  'UI/UX Design',
  'DevOps',
  'Data Analysis',
  'Machine Learning',
  'Consulting',
  'Research',
  'Other'
]

const STATUS_COLORS = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

export function EnhancedProjectForm({ open, onOpenChange, project, onSuccess, mode = 'create' }: EnhancedProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<ProjectDocument[]>([])
  const [uploading, setUploading] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('basic')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'planning',
      priority: 'medium',
      progress: 0,
      tags: [],
      team_members: []
    }
  })

  const watchedStatus = watch('status')
  const watchedPriority = watch('priority')
  const watchedProgress = watch('progress')

  useEffect(() => {
    if (open) {
      fetchClients()
      fetchTeamMembers()
      if (project && mode === 'edit') {
        populateForm(project)
      } else {
        reset()
        setSelectedTeamMembers([])
        setUploadedDocuments([])
        setTags([])
      }
    }
  }, [open, project, mode, reset])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?page=1&limit=100')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team')
      if (response.ok) {
        const data = await response.json()
        // Handle the response structure from the enhanced team API
        setTeamMembers(data.teamMembers || data || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
      setTeamMembers([])
    }
  }

  const populateForm = (projectData: Project) => {
    setValue('name', projectData.name || '')
    setValue('description', projectData.description || '')
    setValue('client_id', projectData.client_id || '')
    setValue('status', projectData.status || 'planning')
    setValue('priority', projectData.priority || 'medium')
    setValue('type', projectData.type || '')
    setValue('manager', projectData.manager || '')
    setValue('start_date', projectData.start_date || '')
    setValue('end_date', projectData.end_date || '')
    setValue('estimated_budget', projectData.estimated_budget || 0)
    setValue('actual_budget', projectData.actual_budget || 0)
    setValue('progress', projectData.progress || 0)
    
    const projectTags = Array.isArray(projectData.tags) ? projectData.tags : []
    const teamMemberIds = Array.isArray(projectData.assigned_team_ids) ? projectData.assigned_team_ids : []
    const projectDocuments = Array.isArray(projectData.documents) ? projectData.documents : []
    
    setTags(projectTags)
    setValue('tags', projectTags)
    
    setSelectedTeamMembers(teamMemberIds)
    setValue('team_members', teamMemberIds)
    
    setUploadedDocuments(projectDocuments)
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    setUploading(true)
    const formData = new FormData()
    
    Array.from(files).forEach(file => {
      formData.append('documents', file)
    })
    
    // Use temporary project ID for new projects
    const projectId = project?.id || `temp-${Date.now()}`
    formData.append('projectId', projectId)

    try {
      const response = await fetch('/api/upload/project-documents', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.files && Array.isArray(data.files)) {
          setUploadedDocuments(prev => [...prev, ...data.files])
          toast.success(`${data.files.length} file(s) uploaded successfully`)
        } else {
          toast.error('Invalid response format from server')
        }
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to upload files' }))
        toast.error(error.error || 'Failed to upload files')
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const removeDocument = async (document: ProjectDocument) => {
    try {
      const projectId = project?.id || `temp-${Date.now()}`
      const response = await fetch(`/api/upload/project-documents?projectId=${encodeURIComponent(projectId)}&filename=${encodeURIComponent(document.filename)}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUploadedDocuments(prev => prev.filter(doc => doc.filename !== document.filename))
        toast.success('Document removed successfully')
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to remove document' }))
        toast.error(error.error || 'Failed to remove document')
      }
    } catch (error) {
      console.error('Error removing document:', error)
      toast.error('Failed to remove document')
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      setValue('tags', updatedTags)
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove)
    setTags(updatedTags)
    setValue('tags', updatedTags)
  }

  const toggleTeamMember = (memberId: string) => {
    const updated = selectedTeamMembers.includes(memberId)
      ? selectedTeamMembers.filter(id => id !== memberId)
      : [...selectedTeamMembers, memberId]
    
    setSelectedTeamMembers(updated)
    setValue('team_members', updated)
  }

  const onSubmit = async (data: ProjectFormData) => {
    setLoading(true)
    
    try {
      // Validate required fields
      if (!data.name?.trim()) {
        toast.error('Project name is required')
        return
      }
      
      if (!data.type?.trim()) {
        toast.error('Project type is required')
        return
      }

      const projectData = {
        ...data,
        tags,
        team_members: selectedTeamMembers,
        documents: uploadedDocuments,
        created_by: 'current-user', // Replace with actual user ID
      }

      const url = mode === 'edit' && project ? `/api/projects/${encodeURIComponent(project.id)}` : '/api/projects'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Project ${mode === 'edit' ? 'updated' : 'created'} successfully`)
        onSuccess?.()
        onOpenChange(false)
        reset()
      } else {
        const error = await response.json().catch(() => ({ error: `Failed to ${mode} project` }))
        toast.error(error.error || error.message || `Failed to ${mode} project`)
      }
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} project:`, error)
      toast.error(`Failed to ${mode} project`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'edit' ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update project details, team assignments, and documents.'
              : 'Fill in the project details to create a new project with team assignments and document uploads.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="team">Team & Budget</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter project name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Project Type *</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Client</Label>
                  <Controller
                    name="client_id"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Controller
                    name="start_date"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Controller
                    name="end_date"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </div>
              </div>

              {/* Status and Priority Preview */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={STATUS_COLORS[watchedStatus]}>
                    {watchedStatus}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Priority:</span>
                  <Badge className={PRIORITY_COLORS[watchedPriority]}>
                    {watchedPriority}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manager">Project Manager</Label>
                  <Controller
                    name="manager"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.name || member.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={member.avatar || ''} />
                                  <AvatarFallback>{(member.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {member.name || 'Unknown User'}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    {...register('progress', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {watchedProgress !== undefined && (
                    <Progress value={watchedProgress} className="w-full" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={member.id}
                        checked={selectedTeamMembers.includes(member.id)}
                        onCheckedChange={() => toggleTeamMember(member.id)}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar || ''} />
                          <AvatarFallback>{(member.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{member.name || 'Unknown User'}</p>
                          <p className="text-xs text-gray-500">{member.role || 'No role assigned'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  {selectedTeamMembers.length} team member(s) selected
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_budget">Estimated Budget</Label>
                  <Input
                    id="estimated_budget"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('estimated_budget', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.estimated_budget && (
                    <p className="text-sm text-red-500">{errors.estimated_budget.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_budget">Actual Budget</Label>
                  <Input
                    id="actual_budget"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('actual_budget', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.actual_budget && (
                    <p className="text-sm text-red-500">{errors.actual_budget.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload project documents
                        </span>
                        <span className="mt-1 block text-sm text-gray-500">
                          PDF, Word, Excel, PowerPoint, Images (Max 25MB each)
                        </span>
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        disabled={uploading}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Choose Files'}
                    </Button>
                  </div>
                </div>

                {uploadedDocuments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Documents ({uploadedDocuments.length})</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uploadedDocuments.map((doc, index) => (
                        <div key={doc.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.originalName || doc.filename || 'Unknown file'}</p>
                              <p className="text-xs text-gray-500">
                                {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                {doc.uploadedAt && ` • ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.url && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.url, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recurrence Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Recurrence Type</Label>
                        <Controller
                          name="recurrence_pattern.type"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select recurrence" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Interval</Label>
                        <Input
                          type="number"
                          min="1"
                          {...register('recurrence_pattern.interval', { valueAsNumber: true })}
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Recurrence End Date</Label>
                      <Controller
                        name="recurrence_pattern.end_date"
                        control={control}
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              {!isValid && (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Please fix validation errors</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !isValid}>
                {loading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {mode === 'edit' ? 'Update Project' : 'Create Project'}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}