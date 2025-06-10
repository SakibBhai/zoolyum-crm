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
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

// Mock data for team members
const teamMembers = [
  { id: "1", name: "Sarah Johnson" },
  { id: "2", name: "Michael Chen" },
  { id: "3", name: "Emily Rodriguez" },
  { id: "4", name: "David Kim" },
  { id: "5", name: "Jessica Lee" },
]

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
})

export function ProjectForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      clientId: "",
      type: "",
      managerId: "",
      status: "not_started",
      description: "",
    },
  })

  useEffect(() => {
    // Fetch clients for the dropdown
    async function fetchClients() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/clients")
        if (response.ok) {
          const clientsData = await response.json()
          setClients(Array.isArray(clientsData) ? clientsData : [])
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
          type: values.type,
          manager_id: values.managerId,
          start_date: values.startDate.toISOString().split("T")[0],
          deadline: values.deadline.toISOString().split("T")[0],
          status: values.status,
          description: values.description || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create project")
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectTypes.map((type) => (
                          <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, "_")}>
                            {type}
                          </SelectItem>
                        ))}
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
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
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
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Manager</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
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
