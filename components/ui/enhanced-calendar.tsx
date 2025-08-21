"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarIcon,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { EventForm } from "@/components/ui/event-form"

// Content calendar event interface
interface ContentCalendarEvent {
  id: string
  title: string
  description?: string
  content_type: string
  platform: string
  scheduled_date: string
  scheduled_time?: string
  project_id?: string
  client_id?: string
  assigned_to?: string
  status: string
  tags?: string[]
  media_urls?: string[]
  approval_required: boolean
  approved_by?: string
  approved_at?: string
  published_at?: string
  engagement_metrics?: any
  notes?: string
  created_at: string
  updated_at: string
  project_name?: string
  client_name?: string
  assigned_name?: string
}

// Transform content calendar event to calendar event format
const transformContentEvent = (event: ContentCalendarEvent): CalendarEvent => {
  const startDate = new Date(event.scheduled_date)
  if (event.scheduled_time) {
    const [hours, minutes] = event.scheduled_time.split(':')
    startDate.setHours(parseInt(hours), parseInt(minutes))
  }
  
  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    start_date: startDate,
    end_date: startDate,
    start_time: event.scheduled_time,
    type: 'content' as const,
    status: event.status === 'published' ? 'completed' : event.status === 'draft' ? 'scheduled' : 'in_progress',
    priority: event.approval_required ? 'high' : 'medium',
    location: event.platform,
    project_id: event.project_id,
    client_id: event.client_id,
    assigned_to: event.assigned_to,
    attendees: event.assigned_to ? [event.assigned_to] : [],
    color: EVENT_COLORS.content
  }
}

// Types for calendar events
interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_date: Date
  end_date?: Date
  start_time?: string
  end_time?: string
  type: 'meeting' | 'task' | 'content' | 'deadline' | 'event'
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  project_id?: string
  client_id?: string
  assigned_to?: string
  location?: string
  attendees?: string[]
  color?: string
}

interface EnhancedCalendarProps {
  events?: CalendarEvent[]
  onEventCreate?: (event: Partial<CalendarEvent>) => void
  onEventUpdate?: (id: string, event: Partial<CalendarEvent>) => void
  onEventDelete?: (id: string) => void
  onDateSelect?: (date: Date) => void
  className?: string
  defaultView?: 'month' | 'week' | 'day' | 'agenda'
}

const EVENT_COLORS = {
  meeting: 'bg-blue-500',
  task: 'bg-green-500',
  content: 'bg-purple-500',
  deadline: 'bg-red-500',
  event: 'bg-orange-500',
}

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
}

const PRIORITY_COLORS = {
  low: 'border-l-gray-400',
  medium: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-400',
}

export function EnhancedCalendar({
  events = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateSelect,
  className,
  defaultView = 'month'
}: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState(defaultView)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [contentEvents, setContentEvents] = useState<ContentCalendarEvent[]>([])
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>(events)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch content calendar events
  useEffect(() => {
    const fetchContentEvents = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/content-calendar')
        if (!response.ok) {
          throw new Error('Failed to fetch content calendar events')
        }
        const data = await response.json()
        setContentEvents(data)
        
        // Transform content events to calendar events
        const transformedEvents = data.map(transformContentEvent)
        setAllEvents([...events, ...transformedEvents])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchContentEvents()
  }, [events])

  // Filter events based on search and filters
  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || event.type === filterType
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.start_date, date))
  }

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'prev' ? -7 : 7))
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addDays(prev, direction === 'prev' ? -1 : 1))
  }

  const handleNavigation = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'month':
        navigateMonth(direction)
        break
      case 'week':
        navigateWeek(direction)
        break
      case 'day':
        navigateDay(direction)
        break
    }
  }

  // Event handlers
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setCurrentDate(date)
    onDateSelect?.(date)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventDialogOpen(true)
    setIsEditing(false)
  }

  const handleCreateEvent = async (formData?: any) => {
    if (!formData) {
      setSelectedEvent(null)
      setIsEventFormOpen(true)
      return
    }

    try {
      setIsLoading(true)
      
      // Combine date and time for scheduled_date
      const scheduledDateTime = new Date(formData.startDate)
      if (formData.startTime) {
        const [hours, minutes] = formData.startTime.split(':')
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes))
      }
      
      // Create content calendar event via API
      const contentEventData = {
        title: formData.title || "New Event",
        description: formData.description || "",
        content_type: formData.type || "post",
        platform: formData.location || "instagram",
        scheduled_date: scheduledDateTime.toISOString().split('T')[0],
        scheduled_time: formData.startTime ? formData.startTime + ':00' : null,
        project_id: formData.projectId || null,
        client_id: formData.clientId || null,
        assigned_to: formData.assignedTo || null,
        status: formData.status || "draft",
        tags: formData.tags?.length ? formData.tags.join(',') : '',
        approval_required: formData.priority === 'high',
        notes: formData.notes || ''
      }

      const response = await fetch('/api/content-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentEventData),
      })

      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      // Refresh events after creation
      const updatedResponse = await fetch('/api/content-calendar')
      const updatedData = await updatedResponse.json()
      setContentEvents(updatedData)
      const transformedEvents = updatedData.map(transformContentEvent)
      setAllEvents([...events, ...transformedEvents])
      
      setIsEventFormOpen(false)
      onEventCreate?.(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsEventFormOpen(true)
  }

  const handleUpdateEvent = async (formData: any) => {
    if (!selectedEvent) return
    
    try {
      setIsLoading(true)
      
      // Combine date and time for scheduled_date
      const scheduledDateTime = new Date(formData.startDate)
      if (formData.startTime) {
        const [hours, minutes] = formData.startTime.split(':')
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes))
      }
      
      // Update content calendar event via API
      const contentEventData = {
        title: formData.title,
        description: formData.description || "",
        content_type: formData.type || "post",
        platform: formData.location || "instagram",
        scheduled_date: scheduledDateTime.toISOString().split('T')[0],
        scheduled_time: formData.startTime ? formData.startTime + ':00' : null,
        project_id: formData.projectId || null,
        client_id: formData.clientId || null,
        assigned_to: formData.assignedTo || null,
        status: formData.status || "draft",
        tags: formData.tags?.length ? formData.tags.join(',') : '',
        approval_required: formData.priority === 'high',
        notes: formData.notes || ''
      }
      
      const response = await fetch(`/api/content-calendar/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentEventData),
      })

      if (!response.ok) {
        throw new Error('Failed to update event')
      }

      // Refresh events after update
      const updatedResponse = await fetch('/api/content-calendar')
      const updatedData = await updatedResponse.json()
      setContentEvents(updatedData)
      const transformedEvents = updatedData.map(transformContentEvent)
      setAllEvents([...events, ...transformedEvents])
      
      setIsEventFormOpen(false)
      setSelectedEvent(null)
      onEventUpdate?.(selectedEvent.id, formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/content-calendar/${eventId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      // Refresh events after deletion
      const updatedResponse = await fetch('/api/content-calendar')
      const updatedData = await updatedResponse.json()
      setContentEvents(updatedData)
      const transformedEvents = updatedData.map(transformContentEvent)
      setAllEvents([...events, ...transformedEvents])
      
      setIsEventDialogOpen(false)
      setSelectedEvent(null)
      onEventDelete?.(eventId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event')
    } finally {
      setIsLoading(false)
    }
  }

  // Render different calendar views
  const renderMonthView = () => {
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {Array.from({ length: 42 }, (_, i) => {
          const date = addDays(startOfWeek(currentDate), i - new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay())
          const dayEvents = getEventsForDate(date)
          const isCurrentMonth = isSameMonth(date, currentDate)
          const isToday = isSameDay(date, new Date())
          const isSelected = selectedDate && isSameDay(date, selectedDate)
          
          return (
            <div
              key={i}
              className={cn(
                "min-h-[100px] p-1 border border-border cursor-pointer hover:bg-accent/50 transition-colors",
                !isCurrentMonth && "text-muted-foreground bg-muted/30",
                isToday && "bg-primary/10 border-primary",
                isSelected && "bg-accent border-accent-foreground"
              )}
              onClick={() => handleDateClick(date)}
            >
              <div className={cn(
                "text-sm font-medium mb-1",
                isToday && "text-primary font-bold"
              )}>
                {format(date, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs p-1 rounded truncate cursor-pointer border-l-2",
                      EVENT_COLORS[event.type],
                      "text-white",
                      PRIORITY_COLORS[event.priority]
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEventClick(event)
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekEnd = endOfWeek(currentDate)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return (
      <div className="grid grid-cols-8 gap-1">
        {/* Time column header */}
        <div className="p-2"></div>
        
        {/* Day headers */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-2 text-center border-b">
            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
            <div className={cn(
              "text-lg font-bold",
              isSameDay(day, new Date()) && "text-primary"
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
        
        {/* Time slots */}
        {Array.from({ length: 24 }, (_, hour) => (
          <>
            {/* Time label */}
            <div key={`time-${hour}`} className="p-2 text-xs text-muted-foreground border-r">
              {format(new Date().setHours(hour, 0), 'HH:mm')}
            </div>
            
            {/* Day columns */}
            {weekDays.map(day => {
              const dayEvents = getEventsForDate(day).filter(event => {
                if (!event.start_time) return hour === 9 // Default to 9 AM if no time
                const eventHour = parseInt(event.start_time.split(':')[0])
                return eventHour === hour
              })
              
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-[60px] p-1 border-b border-r hover:bg-accent/30 cursor-pointer"
                  onClick={() => handleDateClick(day)}
                >
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        "text-xs p-1 mb-1 rounded cursor-pointer border-l-2",
                        EVENT_COLORS[event.type],
                        "text-white",
                        PRIORITY_COLORS[event.priority]
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event)
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {event.start_time && (
                        <div className="opacity-80">{event.start_time}</div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </>
        ))}
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate)
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-1">
          {Array.from({ length: 24 }, (_, hour) => {
            const hourEvents = dayEvents.filter(event => {
              if (!event.start_time) return hour === 9
              const eventHour = parseInt(event.start_time.split(':')[0])
              return eventHour === hour
            })
            
            return (
              <div key={hour} className="flex border-b">
                <div className="w-20 p-2 text-sm text-muted-foreground border-r">
                  {format(new Date().setHours(hour, 0), 'HH:mm')}
                </div>
                <div className="flex-1 min-h-[60px] p-2 hover:bg-accent/30">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-2 mb-2 rounded cursor-pointer border-l-4",
                        "bg-card hover:bg-accent",
                        PRIORITY_COLORS[event.priority]
                      )}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground">{event.description}</div>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {event.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.start_time}
                                {event.end_time && ` - ${event.end_time}`}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", STATUS_COLORS[event.status])}>
                            {event.status}
                          </Badge>
                          <Badge className={cn("text-xs", EVENT_COLORS[event.type], "text-white")}>
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderAgendaView = () => {
    const sortedEvents = [...filteredEvents]
      .sort((a, b) => a.start_date.getTime() - b.start_date.getTime())
    
    return (
      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No events found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          sortedEvents.map(event => (
            <Card key={event.id} className={cn("cursor-pointer hover:shadow-md transition-shadow border-l-4", PRIORITY_COLORS[event.priority])}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{event.title}</h4>
                      <Badge className={cn("text-xs", STATUS_COLORS[event.status])}>
                        {event.status}
                      </Badge>
                      <Badge className={cn("text-xs", EVENT_COLORS[event.type], "text-white")}>
                        {event.type}
                      </Badge>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {format(event.start_date, 'MMM d, yyyy')}
                      </span>
                      {event.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.start_time}
                          {event.end_time && ` - ${event.end_time}`}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.attendees.length} attendees
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEventClick(event)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <div className="text-sm font-medium">Error: {error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading events...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('prev')}
                  disabled={isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigation('next')}
                  disabled={isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div>
                <CardTitle className="text-xl">
                  {view === 'month' && format(currentDate, 'MMMM yyyy')}
                  {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
                  {view === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
                  {view === 'agenda' && 'Event Agenda'}
                </CardTitle>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => handleCreateEvent()} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Button>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="meeting">Meetings</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="deadline">Deadlines</SelectItem>
                <SelectItem value="event">Events</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>
      
      {/* View Tabs */}
      <Tabs value={view} onValueChange={(value) => setView(value as typeof view)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>
        
        <TabsContent value="month" className="mt-6">
          <Card>
            <CardContent className="p-4">
              {renderMonthView()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="week" className="mt-6">
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              {renderWeekView()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="day" className="mt-6">
          <Card>
            <CardContent className="p-4">
              {renderDayView()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agenda" className="mt-6">
          {renderAgendaView()}
        </TabsContent>
      </Tabs>
      
      {/* Event Details Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              View event information and manage actions.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg">{selectedEvent.title}</h4>
                {selectedEvent.description && (
                  <p className="text-muted-foreground mt-1">{selectedEvent.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-sm">{format(selectedEvent.start_date, 'MMM d, yyyy')}</p>
                </div>
                {selectedEvent.start_time && (
                  <div>
                    <label className="text-sm font-medium">Time</label>
                    <p className="text-sm">
                      {selectedEvent.start_time}
                      {selectedEvent.end_time && ` - ${selectedEvent.end_time}`}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Badge className={cn("text-xs ml-2", EVENT_COLORS[selectedEvent.type], "text-white")}>
                    {selectedEvent.type}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={cn("text-xs ml-2", STATUS_COLORS[selectedEvent.status])}>
                    {selectedEvent.status}
                  </Badge>
                </div>
                {selectedEvent.location && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Location</label>
                    <p className="text-sm">{selectedEvent.location}</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEventDialogOpen(false)
                  handleEditEvent(selectedEvent)
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Event
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Form Dialog */}
      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>
          <EventForm
             initialData={selectedEvent ? {
               title: selectedEvent.title,
               description: selectedEvent.description || '',
               startDate: selectedEvent.start_date,
               endDate: selectedEvent.end_date || selectedEvent.start_date,
               startTime: selectedEvent.start_time || '09:00',
               endTime: selectedEvent.end_time || '10:00',
               type: selectedEvent.type || 'meeting',
               status: selectedEvent.status || 'scheduled',
               priority: selectedEvent.priority || 'medium',
               location: selectedEvent.location || '',
               projectId: selectedEvent.project_id || '',
               clientId: selectedEvent.client_id || '',
               assignedTo: selectedEvent.assigned_to || '',
               tags: [],
               isAllDay: false,
               isRecurring: false,
               recurringPattern: 'weekly',
               recurringEndDate: undefined,
               reminders: [15],
               attendees: [],
               notes: selectedEvent.description || ''
             } : undefined}
             onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
             onCancel={() => setIsEventFormOpen(false)}
             isLoading={isLoading}
             mode={selectedEvent ? 'edit' : 'create'}
           />
        </DialogContent>
      </Dialog>
    </div>
  )
}