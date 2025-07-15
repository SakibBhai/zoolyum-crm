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

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  industry: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect"]).default("prospect"),
  notes: z.string().optional(),
})

interface ClientFormProps {
  clientData?: {
    id?: string
    name: string
    industry?: string
    contact_name?: string
    email: string
    phone: string
    status: string
    notes?: string
  }
  isEditing?: boolean
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClientForm({ clientData, isEditing = false, onSuccess, onCancel }: ClientFormProps) {
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: clientData?.name || "",
      industry: clientData?.industry || "",
      contact_name: clientData?.contact_name || "",
      email: clientData?.email || "",
      phone: clientData?.phone || "",
      status: clientData?.status || "prospect",
      notes: clientData?.notes || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const url = isEditing ? `/api/clients/${clientData?.id}` : "/api/clients"
      const method = isEditing ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
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
        throw new Error(isEditing ? "Failed to update client" : "Failed to create client")
      }

      toast({
        title: isEditing ? "Client updated" : "Client created",
        description: isEditing 
          ? `${values.name} has been updated successfully.`
          : `${values.name} has been added to your clients.`,
      })

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(isEditing ? `/dashboard/clients/${clientData?.id}` : "/dashboard/clients")
      }
    } catch (error) {
      console.error(isEditing ? "Error updating client:" : "Error creating client:", error)
      toast({
        title: "Error",
        description: isEditing 
          ? "There was a problem updating the client. Please try again."
          : "There was a problem creating the client. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Apparel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Technology, Healthcare, Finance, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
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

              <FormField
                control={form.control}
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
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@abcapparel.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the client..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel || (() => router.back())}
              >
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Update Client" : "Create Client"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
