"use client"

import { useState, useMemo } from "react"
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns"
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Plus,
  Filter,
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  User
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Lead } from "./leads-overview"

export interface Activity {
  id: string
  leadId: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  title: string
  description: string
  scheduledDate: Date
  completed: boolean
  outcome?: string
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
}

interface ActivityTrackerProps {
  leads: Lead[]
  activities: Activity[]
  onAddActivity: (activity: Omit<Activity, 'id'>) => void
  onUpdateActivity: (id: string, activity: Partial<Activity>) => void
  onDeleteActivity: (id: string) => void
}

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Phone Call', icon: Phone, color: 'bg-blue-500' },
  { value: 'email', label: 'Email', icon: Mail, color: 'bg-green-500' },
  { value: 'meeting', label: 'Meeting', icon: Users, color: 'bg-purple-500' },
  { value: 'note', label: 'Note', icon: MessageSquare, color: 'bg-gray-500' },
  { value: 'task', label: 'Task', icon: CheckCircle, color: 'bg-orange-500' }
]

const ACTIVITY_OUTCOMES = [
  'Successful',
  'No Answer',
  'Voicemail Left',
  'Email Sent',
  'Meeting Scheduled',
  'Follow-up Required',
  'Not Interested',
  'Qualified',
  'Proposal Requested'
]

export function ActivityTracker({
  leads,
  activities,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity
}: ActivityTrackerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLead, setSelectedLead] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)

  // Form state for new/edit activity
  const [formData, setFormData] = useState({
    leadId: '',
    type: 'call' as Activity['type'],
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    outcome: '',
    completed: false,
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  // Filter and search activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const lead = leads.find(l => l.id === activity.leadId)
      const matchesSearch = 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead?.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesLead = selectedLead === 'all' || activity.leadId === selectedLead
      const matchesType = selectedType === 'all' || activity.type === selectedType
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'completed' && activity.completed) ||
        (selectedStatus === 'pending' && !activity.completed) ||
        (selectedStatus === 'overdue' && !activity.completed && isPast(activity.scheduledDate))
      
      return matchesSearch && matchesLead && matchesType && matchesStatus
    }).sort((a, b) => {
      // Sort by scheduled date, with overdue items first
      if (!a.completed && !b.completed) {
        const aOverdue = isPast(a.scheduledDate)
        const bOverdue = isPast(b.scheduledDate)
        if (aOverdue && !bOverdue) return -1
        if (!aOverdue && bOverdue) return 1
      }
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    })
  }, [activities, leads, searchTerm, selectedLead, selectedType, selectedStatus])

  // Get upcoming activities (next 7 days)
  const upcomingActivities = useMemo(() => {
    const nextWeek = addDays(new Date(), 7)
    return activities.filter(activity => 
      !activity.completed && 
      activity.scheduledDate <= nextWeek &&
      activity.scheduledDate >= new Date()
    ).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  }, [activities])

  // Get overdue activities
  const overdueActivities = useMemo(() => {
    return activities.filter(activity => 
      !activity.completed && isPast(activity.scheduledDate)
    )
  }, [activities])

  // Activity stats
  const stats = useMemo(() => {
    const total = activities.length
    const completed = activities.filter(a => a.completed).length
    const pending = activities.filter(a => !a.completed).length
    const overdue = overdueActivities.length
    const today = activities.filter(a => !a.completed && isToday(a.scheduledDate)).length
    
    return { total, completed, pending, overdue, today }
  }, [activities, overdueActivities])

  const handleAddActivity = () => {
    if (!formData.leadId || !formData.title || !formData.scheduledDate) return
    
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime || '09:00'}`)
    
    onAddActivity({
      leadId: formData.leadId,
      type: formData.type,
      title: formData.title,
      description: formData.description,
      scheduledDate: scheduledDateTime,
      completed: formData.completed,
      outcome: formData.outcome,
      priority: formData.priority,
      createdAt: new Date()
    })
    
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditActivity = () => {
    if (!editingActivity || !formData.title || !formData.scheduledDate) return
    
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime || '09:00'}`)
    
    onUpdateActivity(editingActivity.id, {
      title: formData.title,
      description: formData.description,
      scheduledDate: scheduledDateTime,
      completed: formData.completed,
      outcome: formData.outcome,
      priority: formData.priority
    })
    
    setEditingActivity(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      leadId: '',
      type: 'call',
      title: '',
      description: '',
      scheduledDate: '',
      scheduledTime: '',
      outcome: '',
      completed: false,
      priority: 'medium'
    })
  }

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      leadId: activity.leadId,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      scheduledDate: format(activity.scheduledDate, 'yyyy-MM-dd'),
      scheduledTime: format(activity.scheduledDate, 'HH:mm'),
      outcome: activity.outcome || '',
      completed: activity.completed,
      priority: activity.priority
    })
  }

  const getActivityIcon = (type: Activity['type']) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type)
    return activityType ? activityType.icon : MessageSquare
  }

  const getActivityColor = (type: Activity['type']) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type)
    return activityType ? activityType.color : 'bg-gray-500'
  }

  const getPriorityColor = (priority: Activity['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const formatActivityDate = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isPast(date)) return `${format(date, 'MMM d')} (Overdue)`
    return format(date, 'MMM d, yyyy')
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedLead} onValueChange={setSelectedLead}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              {leads.map(lead => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ACTIVITY_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Activity</DialogTitle>
                <DialogDescription>
                  Schedule a new activity for a lead
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="lead">Lead</Label>
                  <Select value={formData.leadId} onValueChange={(value) => setFormData(prev => ({ ...prev, leadId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map(lead => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name} - {lead.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="type">Activity Type</Label>
                  <Select value={formData.type} onValueChange={(value: Activity['type']) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Activity title"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Activity description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={formData.completed}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, completed: checked as boolean }))}
                  />
                  <Label htmlFor="completed">Mark as completed</Label>
                </div>
                
                {formData.completed && (
                  <div className="grid gap-2">
                    <Label htmlFor="outcome">Outcome</Label>
                    <Select value={formData.outcome} onValueChange={(value) => setFormData(prev => ({ ...prev, outcome: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_OUTCOMES.map(outcome => (
                          <SelectItem key={outcome} value={outcome}>
                            {outcome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddActivity}>
                  Add Activity
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Activities Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Activities</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No activities found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map(activity => {
                const lead = leads.find(l => l.id === activity.leadId)
                const Icon = getActivityIcon(activity.type)
                const isOverdue = !activity.completed && isPast(activity.scheduledDate)
                
                return (
                  <Card key={activity.id} className={`${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{activity.title}</h4>
                              <Badge variant="outline" className={`${getPriorityColor(activity.priority)} text-white`}>
                                {activity.priority}
                              </Badge>
                              {activity.completed && (
                                <Badge variant="outline" className="bg-green-500 text-white">
                                  Completed
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="destructive">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{lead?.name} - {lead?.company}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatActivityDate(activity.scheduledDate)}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{format(activity.scheduledDate, 'h:mm a')}</span>
                              </div>
                            </div>
                            
                            {activity.outcome && (
                              <div className="mt-2">
                                <Badge variant="secondary">
                                  {activity.outcome}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(activity)}
                          >
                            Edit
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateActivity(activity.id, { completed: !activity.completed })}
                          >
                            {activity.completed ? 'Mark Pending' : 'Complete'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="upcoming">
          <div className="space-y-4">
            {upcomingActivities.map(activity => {
              const lead = leads.find(l => l.id === activity.leadId)
              const Icon = getActivityIcon(activity.type)
              
              return (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {lead?.name} - {formatActivityDate(activity.scheduledDate)} at {format(activity.scheduledDate, 'h:mm a')}
                        </p>
                      </div>
                      
                      <Badge variant="outline" className={`${getPriorityColor(activity.priority)} text-white`}>
                        {activity.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="overdue">
          <div className="space-y-4">
            {overdueActivities.map(activity => {
              const lead = leads.find(l => l.id === activity.leadId)
              const Icon = getActivityIcon(activity.type)
              
              return (
                <Card key={activity.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{activity.title}</h4>
                          <Badge variant="destructive">Overdue</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lead?.name} - Due {format(activity.scheduledDate, 'MMM d, yyyy')}
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateActivity(activity.id, { completed: true })}
                      >
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="space-y-4">
            {activities.filter(a => a.completed).map(activity => {
              const lead = leads.find(l => l.id === activity.leadId)
              const Icon = getActivityIcon(activity.type)
              
              return (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{activity.title}</h4>
                          <Badge variant="outline" className="bg-green-500 text-white">
                            Completed
                          </Badge>
                          {activity.outcome && (
                            <Badge variant="secondary">
                              {activity.outcome}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lead?.name} - Completed {format(activity.scheduledDate, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Activity Dialog */}
      {editingActivity && (
        <Dialog open={!!editingActivity} onOpenChange={() => setEditingActivity(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
              <DialogDescription>
                Update activity details
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-completed"
                  checked={formData.completed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, completed: checked as boolean }))}
                />
                <Label htmlFor="edit-completed">Mark as completed</Label>
              </div>
              
              {formData.completed && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-outcome">Outcome</Label>
                  <Select value={formData.outcome} onValueChange={(value) => setFormData(prev => ({ ...prev, outcome: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_OUTCOMES.map(outcome => (
                        <SelectItem key={outcome} value={outcome}>
                          {outcome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingActivity(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditActivity}>
                Update Activity
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}