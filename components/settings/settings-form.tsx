"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Building2, Globe, Mail, Palette, Shield, Upload, Camera } from "lucide-react"

const settingsSchema = z.object({
  // Company Profile
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyLogo: z.string().optional(),
  tagline: z.string().optional(),
  
  // Localization & Regional Settings
  timeZone: z.string(),
  language: z.string(),
  currency: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  
  // Primary Contact Information
  primaryEmail: z.string().email("Invalid email address"),
  billingEmail: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  
  // UI Preferences
  themeMode: z.string(),
  uiScaling: z.string(),
  logoDisplayMode: z.string(),
  
  // Security Settings
  adminTwoFactorEnabled: z.boolean(),
  sessionTimeout: z.string(),
  multipleDeviceLogin: z.boolean(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

const timeZones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
]

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
]

const currencies = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
  { value: "CNY", label: "Chinese Yuan (¥)" },
]

export function SettingsForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: "Zoolyum Creative Agency",
      tagline: "Creative solutions for modern brands",
      timeZone: "America/New_York",
      language: "en",
      currency: "USD",
      dateFormat: "MM-DD-YYYY",
      timeFormat: "12",
      primaryEmail: "admin@zoolyum.com",
      billingEmail: "billing@zoolyum.com",
      phoneNumber: "+1 (555) 123-4567",
      themeMode: "light",
      uiScaling: "default",
      logoDisplayMode: "full",
      adminTwoFactorEnabled: false,
      sessionTimeout: "8",
      multipleDeviceLogin: true,
    },
  })

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoPreview(result)
        form.setValue("companyLogo", result)
      }
      reader.readAsDataURL(file)
    }
  }

  const detectTimeZone = () => {
    const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    form.setValue("timeZone", detectedTimeZone)
    toast({
      title: "Time zone detected",
      description: `Set to ${detectedTimeZone}`,
    })
  }

  async function onSubmit(data: SettingsFormValues) {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="interface" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Interface
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Profile
                  </CardTitle>
                  <CardDescription>
                    Manage your company information and branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormLabel>Company Logo</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={logoPreview || "/placeholder-logo.svg"} alt="Company logo" />
                        <AvatarFallback>
                          <Building2 className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="relative overflow-hidden"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Recommended: 200x200px, PNG or JPG
                        </p>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline / Short Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of your company (optional)"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will appear in invoices and other documents
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Localization & Regional Settings */}
            <TabsContent value="localization" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Localization & Regional Settings
                  </CardTitle>
                  <CardDescription>
                    Configure language, timezone, and regional preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="timeZone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Time Zone</FormLabel>
                          <div className="flex gap-2">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeZones.map((tz) => (
                                  <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={detectTimeZone}
                            >
                              Auto-detect
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Preference</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Used for billing, invoices, and reports
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select date format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MM-DD-YYYY">MM-DD-YYYY (US)</SelectItem>
                                <SelectItem value="DD-MM-YYYY">DD-MM-YYYY (EU)</SelectItem>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timeFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                                <SelectItem value="24">24-hour</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Primary Contact Information */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Primary Contact Information
                  </CardTitle>
                  <CardDescription>
                    Configure contact details for system notifications and billing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primaryEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Contact Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="admin@company.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Used for system alerts and notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="billing@company.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Used for invoices and receipts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormDescription>
                          For internal references and client contact
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Interface Preferences */}
            <TabsContent value="interface" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    User Interface Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="themeMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme Mode</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                              <SelectItem value="auto">Auto (System-based)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="uiScaling"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UI Scaling</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select scaling" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="compact">Compact</SelectItem>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="spacious">Spacious</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            For accessibility and different screen sizes
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="logoDisplayMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo Display Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full md:w-[300px]">
                              <SelectValue placeholder="Select display mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full">Full Logo with Text</SelectItem>
                            <SelectItem value="icon">Icon Only</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How the logo appears in the sidebar
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Configure security policies and access controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="adminTwoFactorEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Admin 2FA Enforcement
                            </FormLabel>
                            <FormDescription>
                              Require two-factor authentication for all admin users
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

                    <FormField
                      control={form.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout Duration</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full md:w-[300px]">
                                <SelectValue placeholder="Select timeout duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 hour</SelectItem>
                              <SelectItem value="4">4 hours</SelectItem>
                              <SelectItem value="8">8 hours</SelectItem>
                              <SelectItem value="24">24 hours</SelectItem>
                              <SelectItem value="never">Never expire</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How long users stay logged in without activity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="multipleDeviceLogin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Login from Multiple Devices
                            </FormLabel>
                            <FormDescription>
                              Users can be logged in from multiple devices simultaneously
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
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Security Recommendations</h4>
                        <ul className="mt-2 text-sm text-amber-700 space-y-1">
                          <li>• Enable 2FA for enhanced security</li>
                          <li>• Use shorter session timeouts for sensitive environments</li>
                          <li>• Regularly review user access and permissions</li>
                          <li>• Monitor login activities for suspicious behavior</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Save Button */}
            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline">
                Reset to Defaults
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}