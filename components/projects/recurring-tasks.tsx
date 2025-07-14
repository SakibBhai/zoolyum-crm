"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { format, addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns"
import { CalendarIcon, Plus, Edit, Trash2, Clock, Repeat, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RecurringTask {
  id: string
  projectId: string
  title: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // Every X days/weeks/months/years
  daysOfWeek?: number[] // For weekly tasks (0 = Sunday, 1 = Monday, etc.)
  dayOfMonth?: number // For monthly tasks
  startDate: string
  endDate?: string
  isActive: boolean
  lastGenerated?: string
  nextDue: string
  assignedTo?: string
  priority: 'low' | 'medium' | 'high'
  estimatedHours?: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface GeneratedTask {
  id: string
  recurringTaskId: string
  title: string
  description: string
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assignedTo?: string
  completedAt?: string
  estimatedHours?: number
  actualHours?: number
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  createdAt: string
}

interface RecurringTasksProps {
  projectId: string
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
]

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

export function RecurringTasks({ projectId }: RecurringTasksProps) {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([])
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null)
  const [activeTab, setActiveTab] = useState<'recurring' | 'generated'>('recurring')
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'weekly' as const,
    interval: 1,
    daysOfWeek: [] as number[],
    dayOfMonth: 1,
    startDate: new Date(),
    endDate: undefined as Date | undefined,
    assignedTo: '',
    priority: 'medium' as const,
    estimatedHours: 0,
    tags: [] as string[],
    isActive: true
  })

  useEffect(() => {
    fetchRecurringTasks()
    fetchGeneratedTasks()
  }, [projectId])

  const fetchRecurringTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/recurring-tasks`)
      if (response.ok) {
        const data = await response.json()
        setRecurringTasks(data)
      }
    } catch (error) {
      console.error('Error fetching recurring tasks:', error)
      toast({
        title: "Error",
        description: "Failed to load recurring tasks.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGeneratedTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/generated-tasks`)
      if (response.ok) {
        const data = await response.json()
        setGeneratedTasks(data)
      }
    } catch (error) {
      console.error('Error fetching generated tasks:', error)
    }
  }

  const calculateNextDue = (task: Partial<RecurringTask>): Date => {
    const start = task.startDate ? parseISO(task.startDate) : new Date()
    const interval = task.interval || 1

    switch (task.frequency) {
      case 'daily':
        return addDays(start, interval)
      case 'weekly':
        return addWeeks(start, interval)
      case 'monthly':
        return addMonths(start, interval)
      case 'yearly':
        return addYears(start, interval)
      default:
        return start
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const nextDue = calculateNextDue({
        ...formData,
        startDate: formData.startDate.toISOString()
      })

      const taskData = {
        ...formData,
        projectId,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate?.toISOString(),
        nextDue: nextDue.toISOString()
      }

      const url = editingTask 
        ? `/api/projects/${projectId}/recurring-tasks/${editingTask.id}`
        : `/api/projects/${projectId}/recurring-tasks`
      
      const method = editingTask ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Recurring task ${editingTask ? 'updated' : 'created'} successfully.`
        })
        setIsDialogOpen(false)
        resetForm()
        fetchRecurringTasks()
      } else {
        throw new Error('Failed to save recurring task')
      }
    } catch (error) {
      console.error('Error saving recurring task:', error)
      toast({
        title: "Error",
        description: "Failed to save recurring task.",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (task: RecurringTask) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      frequency: task.frequency,
      interval: task.interval,
      daysOfWeek: task.daysOfWeek || [],
      dayOfMonth: task.dayOfMonth || 1,
      startDate: parseISO(task.startDate),
      endDate: task.endDate ? parseISO(task.endDate) : undefined,
      assignedTo: task.assignedTo || '',
      priority: task.priority,
      estimatedHours: task.estimatedHours || 0,
      tags: task.tags,
      isActive: task.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this recurring task?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/recurring-tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Recurring task deleted successfully."
        })
        fetchRecurringTasks()
      } else {
        throw new Error('Failed to delete recurring task')
      }
    } catch (error) {
      console.error('Error deleting recurring task:', error)
      toast({
        title: "Error",
        description: "Failed to delete recurring task.",
        variant: "destructive"
      })
    }
  }

  const handleToggleActive = async (taskId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/recurring-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        fetchRecurringTasks()
      }
    } catch (error) {
      console.error('Error toggling task status:', error)
    }
  }

  const generateTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/recurring-tasks/generate`, {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Generated ${result.count} new tasks.`
        })
        fetchGeneratedTasks()
        fetchRecurringTasks()
      }
    } catch (error) {
      console.error('Error generating tasks:', error)
      toast({
        title: "Error",
        description: "Failed to generate tasks.",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [],
      dayOfMonth: 1,
      startDate: new Date(),
      endDate: undefined,
      assignedTo: '',
      priority: 'medium',
      estimatedHours: 0,
      tags: [],
      isActive: true
    })
    setEditingTask(null)
  }

  const formatFrequency = (task: RecurringTask) => {
    const { frequency, interval, daysOfWeek } = task
    let base = `Every ${interval > 1 ? interval + ' ' : ''}${frequency}`
    
    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      const dayNames = daysOfWeek.map(day => DAYS_OF_WEEK[day].label).join(', ')
      base += ` on ${dayNames}`
    }
    
    return base
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading recurring tasks...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Recurring Tasks</h3>
          <p className="text-sm text-muted-foreground">
            Manage automated task generation for this project
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateTasks} variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Generate Tasks
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Recurring Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTask ? 'Edit Recurring Task' : 'Create Recurring Task'}
                </DialogTitle>
                <DialogDescription>
                  Set up a task that will be automatically generated based on your schedule.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="interval">Interval</Label>
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      value={formData.interval}
                      onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
                    />
                  </div>
                  
                  {formData.frequency === 'weekly' && (
                    <div className="col-span-2">
                      <Label>Days of Week</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {DAYS_OF_WEEK.map(day => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={formData.daysOfWeek.includes(day.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    daysOfWeek: [...formData.daysOfWeek, day.value]
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    daysOfWeek: formData.daysOfWeek.filter(d => d !== day.value)
                                  })
                                }
                              }}
                            />
                            <Label htmlFor={`day-${day.value}`} className="text-sm">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
                    />
                  </div>
                  
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label>End Date (Optional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, "PPP") : "No end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => setFormData({ ...formData, endDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="col-span-2 flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTask ? 'Update' : 'Create'} Task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs for Recurring vs Generated Tasks */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('recurring')}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'recurring'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            )}
          >
            Recurring Tasks ({recurringTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'generated'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
            )}
          >
            Generated Tasks ({generatedTasks.length})
          </button>
        </nav>
      </div>

      {activeTab === 'recurring' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Recurring Task Templates
            </CardTitle>
            <CardDescription>
              These templates automatically generate tasks based on your schedule.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recurringTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Repeat className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No recurring tasks configured.</p>
                <p className="text-sm">Create your first recurring task to automate task generation.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground">{task.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatFrequency(task)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(parseISO(task.nextDue), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={task.isActive}
                            onCheckedChange={(checked) => handleToggleActive(task.id, checked)}
                            size="sm"
                          />
                          <span className="text-sm text-muted-foreground">
                            {task.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Generated Tasks
            </CardTitle>
            <CardDescription>
              Tasks automatically created from your recurring task templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No generated tasks yet.</p>
                <p className="text-sm">Click "Generate Tasks" to create tasks from your templates.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground">{task.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(parseISO(task.dueDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {task.actualHours ? `${task.actualHours}h` : `${task.estimatedHours || 0}h est.`}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}