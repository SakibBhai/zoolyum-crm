"use client"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { CalendarIcon, Save, Star, Clock, RotateCcw, CheckCircle } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Project } from "@/types/project"
import { useProjectContext } from "@/contexts/project-context"

const projectTypes = [
  "Social Media Management",
  "Branding",
  "Website Design",
  "Content Marketing",
  "Email Marketing",
  "SEO",
  "PPC",
  "Video Production",
  "Graphic Design",
  "Other",
]

const recurrencePatterns = [
  { id: "daily", label: "Daily", description: "Repeats every day" },
  { id: "weekly", label: "Weekly", description: "Repeats every week on the same day" },
  { id: "biweekly", label: "Bi-weekly", description: "Repeats every two weeks" },
  { id: "monthly", label: "Monthly", description: "Repeats every month on the same date" },
  { id: "quarterly", label: "Quarterly", description: "Repeats every three months" },
  { id: "yearly", label: "Yearly", description: "Repeats every year on the same date" },
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Project name must be at least 2 characters.",
  }),
  clientId: z.string({
    required_error: "Please select a client.",
  }),
  type: z.string({
    required_error: "Please select a project type.",
  }),
  managerId: z.string({
    required_error: "Please select a project manager.",
  }),
  startDate: z.date({
    required_error: "Please select a start date.",
  }),
  deadline: z.date({
    required_error: "Please select a deadline.",
  }),
  status: z.string(),
  description: z.string().optional(),
  isRecurring: z.boolean(),
  recurrencePattern: z.object({
    type: z.string().optional(),
    interval: z.number().optional(),
    daysOfWeek: z.array(z.string()).optional(),
    dayOfMonth: z.number().optional(),
    monthOfYear: z.number().optional(),
  }).optional(),
  recurrenceEnd: z.date().optional(),
  priority: z.number().min(1).max(5),
}).superRefine((data, ctx) => {
  if (data.isRecurring) {
    if (!data.recurrencePattern?.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurrence pattern is required for recurring projects.",
        path: ["recurrencePattern", "type"],
      });
    }
    if (!data.recurrenceEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurrence end date is required for recurring projects.",
        path: ["recurrenceEnd"],
      });
    }
  }
});

interface EditProjectModuleProps {
  projectId: string;
  onClose?: () => void;
}

/**
 * EditProjectModule - A component for editing project details with recurrence patterns
 * 
 * @param {string} projectId - The ID of the project to edit
 * @param {Function} onClose - Optional callback when editing is cancelled
 */
export function EditProjectModule({ projectId, onClose }: EditProjectModuleProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { getProjectById } = useProjectContext()
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])  
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([])  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [showRecurrencePreview, setShowRecurrencePreview] = useState(false)
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false)

  const project = getProjectById(projectId)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      clientId: "",
      type: "",
      managerId: "",
      startDate: new Date(),
      deadline: new Date(),
      status: "draft",
      description: "",
      isRecurring: false,
      priority: 3,
    },
  })

  // Watch form values for changes
  const formValues = form.watch()

  // Load project data
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        clientId: project.clientId,
        type: project.type,
        managerId: project.managerId,
        // Initialize with undefined to prevent hydration mismatch
        startDate: undefined,
        deadline: undefined,
        status: project.status,
        description: project.description || "",
        isRecurring: false, // Set based on your data structure
        priority: 3, // Set based on your data structure
      })
      
      // Set date values after initial render to prevent hydration mismatch
      setTimeout(() => {
        form.setValue('startDate', project.startDate ? new Date(project.startDate) : new Date());
        form.setValue('deadline', project.deadline ? new Date(project.deadline) : new Date());
      }, 0);
    }
  }, [project, form])

  // Load clients and team members
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsResponse, teamResponse] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/team')
        ])
        
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          setClients(clientsData)
        }
        
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          // Handle the response structure from the enhanced team API
          setTeamMembers(teamData.teamMembers || teamData || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
        })
      }
    }
    
    fetchData()
  }, [])

  // Detect form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasChanges(true)
      
      // Set up debounced autosave
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      
      setAutoSaveStatus('idle')
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave()
      }, 2000) // 2 second debounce
    })
    
    return () => subscription.unsubscribe()
  }, [form.watch])

  // Animation effect
  useEffect(() => {
    setIsVisible(true)
    
    return () => {
      setIsVisible(false)
    }
  }, [])

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        form.handleSubmit(onSubmit)()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [form])

  // Clean up autosave timer
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  /**
   * Handles autosaving the form data
   */
  const handleAutoSave = async () => {
    if (!hasChanges || !form.formState.isValid) return
    
    setAutoSaveStatus('saving')
    
    try {
      const formData = form.getValues()
      
      // Create a diff of what changed
      const changedFields = Object.entries(formData).reduce((acc, [key, value]) => {
        // @ts-ignore - Dynamic access
        if (project && project[key] !== value) {
          // @ts-ignore - Dynamic access
          acc[key] = value
        }
        return acc
      }, {} as Record<string, any>)
      
      if (Object.keys(changedFields).length === 0) {
        setAutoSaveStatus('idle')
        return
      }
      
      // Only send changed fields
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changedFields),
      })
      
      if (response.ok) {
        setAutoSaveStatus('saved')
        setHasChanges(false)
        
        // Reset after a few seconds
        setTimeout(() => {
          setAutoSaveStatus('idle')
        }, 3000)
      } else {
        setAutoSaveStatus('error')
      }
    } catch (error) {
      console.error('Autosave error:', error)
      setAutoSaveStatus('error')
    }
  }

  /**
   * Handles form submission
   */
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    setIsSaving(true)
    
    try {
      // Format dates for API
      const formattedData = {
        ...data,
        start_date: data.startDate.toISOString(),
        end_date: data.deadline.toISOString(),
        recurrence_end: data.recurrenceEnd?.toISOString(),
        recurrence_pattern: data.recurrencePattern ? JSON.stringify(data.recurrencePattern) : null,
        client_id: data.clientId,
        manager_id: data.managerId,
        is_recurring: data.isRecurring,
      }
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Project updated successfully",
        })
        
        // Refresh data or redirect
        router.refresh()
        
        if (onClose) {
          onClose()
        }
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsSaving(false)
    }
  }

  /**
   * Generates a preview of the recurrence pattern in human-readable form
   */
  const getRecurrencePreview = () => {
    const { recurrencePattern, startDate, recurrenceEnd } = formValues
    
    if (!recurrencePattern?.type) return 'No recurrence pattern selected'
    
    const pattern = recurrencePatterns.find(p => p.id === recurrencePattern.type)
    const startFormatted = startDate ? format(startDate, "MMMM d, yyyy") : 'the start date'
    const endFormatted = recurrenceEnd ? format(recurrenceEnd, "MMMM d, yyyy") : 'no end date'
    
    return `This project will repeat ${pattern?.description.toLowerCase() || ''} starting from ${startFormatted} until ${endFormatted}.`
  }

  /**
   * Renders the priority stars with interactive hover effects
   */
  const renderPriorityStars = () => {
    const stars = []
    const currentPriority = form.watch('priority')
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <motion.div 
          key={i}
          whileHover={{ scale: 1.2 }}
          onClick={() => form.setValue('priority', i, { shouldDirty: true })}
          className={cn(
            "cursor-pointer transition-colors",
            i <= currentPriority ? "text-yellow-500" : "text-gray-300"
          )}
        >
          <Star 
            className={cn(
              "h-6 w-6",
              i <= currentPriority ? "fill-yellow-500" : "fill-transparent"
            )} 
          />
        </motion.div>
      )
    }
    
    return (
      <div className="flex space-x-2">
        {stars}
      </div>
    )
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Project not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <Card className="w-full shadow-lg border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Edit Project</span>
                <div className="flex items-center space-x-2 text-sm">
                  {autoSaveStatus === 'saving' && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </Badge>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                  {autoSaveStatus === 'error' && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Error saving
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isLoading || isSaving}
                    className="gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Update project details and settings
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Accordion type="single" collapsible defaultValue="basic-info" className="w-full">
                    <AccordionItem value="basic-info" className="border rounded-md px-4">
                      <AccordionTrigger className="py-4">Basic Information</AccordionTrigger>
                      <AccordionContent className="pb-4 pt-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter project name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {clients.map((client) => (
                                      <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Type</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a project type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {projectTypes.map((type) => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="managerId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Manager</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a project manager" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {teamMembers.map((member) => (
                                      <SelectItem key={member.id} value={member.id}>
                                        {member.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Start Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          (() => {
                                            try {
                                              return format(field.value, "PPP");
                                            } catch (error) {
                                              return "Invalid date";
                                            }
                                          })()
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="deadline"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Deadline</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          (() => {
                                            try {
                                              return format(field.value, "PPP");
                                            } catch (error) {
                                              return "Invalid date";
                                            }
                                          })()
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter project description" 
                                  className="min-h-[120px]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <FormControl>
                                <div className="flex flex-col space-y-2">
                                  {renderPriorityStars()}
                                  <p className="text-sm text-muted-foreground">
                                    {field.value === 1 && "Low priority"}
                                    {field.value === 2 && "Below average priority"}
                                    {field.value === 3 && "Average priority"}
                                    {field.value === 4 && "High priority"}
                                    {field.value === 5 && "Critical priority"}
                                  </p>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="recurrence" className="border rounded-md px-4 mt-4">
                      <AccordionTrigger className="py-4">Recurrence Settings</AccordionTrigger>
                      <AccordionContent className="pb-4 pt-2 space-y-4">
                        <FormField
                          control={form.control}
                          name="isRecurring"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Recurring Project
                                </FormLabel>
                                <FormDescription>
                                  Enable if this project repeats on a schedule
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        {form.watch("isRecurring") && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                          >
                            <FormField
                              control={form.control}
                              name="recurrencePattern.type"
                              render={({ field }) => (
                                <FormItem className="space-y-3">
                                  <FormLabel>Recurrence Pattern</FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex flex-col space-y-1"
                                    >
                                      {recurrencePatterns.map((pattern) => (
                                        <FormItem key={pattern.id} className="flex items-center space-x-3 space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value={pattern.id} />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            <span className="font-medium">{pattern.label}</span> - {pattern.description}
                                          </FormLabel>
                                        </FormItem>
                                      ))}
                                    </RadioGroup>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="recurrenceEnd"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Recurrence End Date</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            (() => {
                                              try {
                                                return format(field.value, "PPP");
                                              } catch (error) {
                                                return "Invalid date";
                                              }
                                            })()
                                          ) : (
                                            <span>Pick an end date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                        disabled={(date) => date < new Date()}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="rounded-lg border p-4 bg-muted/50">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-medium flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  Recurrence Preview
                                </h4>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  type="button"
                                  onClick={() => setShowRecurrencePreview(!showRecurrencePreview)}
                                >
                                  {showRecurrencePreview ? "Hide" : "Show"}
                                </Button>
                              </div>
                              
                              {showRecurrencePreview && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-sm text-muted-foreground"
                                >
                                  {getRecurrencePreview()}
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isLoading || isSaving}
                      className="gap-1"
                    >
                      <Save className="h-4 w-4" />
                      Save Project
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}