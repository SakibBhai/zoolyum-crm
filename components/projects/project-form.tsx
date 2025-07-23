"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { CalendarIcon, Plus } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Project name must be at least 2 characters.",
  }),
  clientId: z.string().min(1, {
    message: "Please select a client.",
  }),
  startDate: z.date().optional(),
  deadline: z.date().optional(),
  status: z.enum(["draft", "active", "on_hold", "completed"]),
  estimatedBudget: z.number().min(0),
  description: z.string().optional(),
})

const clientSchema = z.object({
  name: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  industry: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect"]),
  notes: z.string().optional(),
})

export function ProjectForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      clientId: "",
      startDate: new Date(),
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "draft",
      description: "",
      estimatedBudget: 0,
    },
  })

  const clientForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: "prospect",
    },
  })

  useEffect(() => {
    // Fetch clients for the dropdown
    async function fetchClients() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/clients?page=1&limit=100")
        if (response.ok) {
          const data = await response.json()
          // Extract clients from the paginated response
          setClients(data.clients || [])
        } else {
          console.error("Failed to fetch clients:", await response.text())
          setClients([])
        }
      } catch (error) {
        console.error("Error fetching clients:", error)
        setClients([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  async function onCreateClient(values: z.infer<typeof clientSchema>) {
    setIsCreatingClient(true)
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          industry: values.industry || "",
          contact_name: values.contact_name || "",
          email: values.email || "",
          phone: values.phone || "",
          status: values.status,
          notes: values.notes || "",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create client")
      }

      const newClient = await response.json()

      // Update clients list
      setClients(prev => [...prev, newClient])

      // Select the new client in the project form
      form.setValue("clientId", newClient.id)

      // Reset client form and close dialog
      clientForm.reset()
      setIsClientDialogOpen(false)

      toast({
        title: "Client created",
        description: `${values.name} has been added to your clients and selected for this project.`,
      })
    } catch (error) {
      console.error("Error creating client:", error)
      toast({
        title: "Error",
        description: "There was a problem creating the client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingClient(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          client_id: values.clientId,
          start_date: values.startDate?.toISOString().split("T")[0],
          end_date: values.deadline?.toISOString().split("T")[0],
          status: values.status,
          description: values.description || "",
          estimated_budget: values.estimatedBudget || 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || "Failed to create project")
      }

      toast({
        title: "Project created",
        description: `${values.name} has been added to your projects.`,
      })

      // Redirect to projects list
      router.push("/dashboard/projects")
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: "There was a problem creating the project. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Collection Campaign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={isLoading ? "Loading clients..." : "Select a client"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients && clients.length > 0 ? (
                            clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-clients" disabled>
                              {isLoading ? "Loading clients..." : "No clients available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Create New Client</DialogTitle>
                            <DialogDescription>
                              Add a new client to your database. They will be automatically selected for this project.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...clientForm}>
                            <form onSubmit={clientForm.handleSubmit(onCreateClient)} className="space-y-4">
                              <FormField
                                control={clientForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Client Name *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="ABC Company" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={clientForm.control}
                                  name="industry"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Industry</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Technology" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={clientForm.control}
                                  name="contact_name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Contact Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={clientForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input type="email" placeholder="john@abc.com" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={clientForm.control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Phone</FormLabel>
                                      <FormControl>
                                        <Input placeholder="+1 (555) 123-4567" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={clientForm.control}
                                name="status"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select client status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="prospect">Prospect</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={clientForm.control}
                                name="notes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="Additional notes about the client..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsClientDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={isCreatingClient}>
                                  {isCreatingClient ? "Creating..." : "Create Client"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
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
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
              name="estimatedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Budget</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the project goals, deliverables, and other important details..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
