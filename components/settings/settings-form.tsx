"use client"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { 
  Building2, 
  Globe, 
  Mail, 
  Palette, 
  Shield, 
  Upload, 
  Camera, 
  User, 
  Bell, 
  Database, 
  Plug, 
  Accessibility, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  Key,
  Settings,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Laptop,
  Keyboard
} from "lucide-react"

const settingsSchema = z.object({
  // User Profile
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  profilePicture: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
  
  // Company Profile
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyLogo: z.string().optional(),
  tagline: z.string().optional(),
  
  // Notification Preferences
  emailNotifications: z.boolean(),
  inAppNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  soundEnabled: z.boolean(),
  notificationTypes: z.object({
    newLeads: z.boolean(),
    taskUpdates: z.boolean(),
    systemAlerts: z.boolean(),
    projectUpdates: z.boolean(),
    teamMessages: z.boolean(),
    deadlineReminders: z.boolean(),
  }),
  
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
  
  // Theme & Display Settings
  themeMode: z.string(),
  fontSize: z.string(),
  contrast: z.string(),
  uiScaling: z.string(),
  logoDisplayMode: z.string(),
  
  // Accessibility Settings
  screenReaderSupport: z.boolean(),
  keyboardNavigation: z.boolean(),
  highContrast: z.boolean(),
  reducedMotion: z.boolean(),
  largeText: z.boolean(),
  
  // Security Settings
  adminTwoFactorEnabled: z.boolean(),
  sessionTimeout: z.string(),
  multipleDeviceLogin: z.boolean(),
  
  // Integration Settings
  integrations: z.object({
    googleWorkspace: z.boolean(),
    microsoftOffice: z.boolean(),
    slack: z.boolean(),
    zapier: z.boolean(),
    mailchimp: z.boolean(),
    hubspot: z.boolean(),
  }),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

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
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [dataExportProgress, setDataExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      // User Profile
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@zoolyum.com",
      
      // Company Profile
      companyName: "Zoolyum Creative Agency",
      tagline: "Creative solutions for modern brands",
      
      // Notification Preferences
      emailNotifications: true,
      inAppNotifications: true,
      pushNotifications: false,
      soundEnabled: true,
      notificationTypes: {
        newLeads: true,
        taskUpdates: true,
        systemAlerts: true,
        projectUpdates: true,
        teamMessages: false,
        deadlineReminders: true,
      },
      
      // Localization
      timeZone: "America/New_York",
      language: "en",
      currency: "USD",
      dateFormat: "MM-DD-YYYY",
      timeFormat: "12",
      
      // Contact
      primaryEmail: "admin@zoolyum.com",
      billingEmail: "billing@zoolyum.com",
      phoneNumber: "+1 (555) 123-4567",
      
      // Theme & Display
      themeMode: "light",
      fontSize: "medium",
      contrast: "normal",
      uiScaling: "default",
      logoDisplayMode: "full",
      
      // Accessibility
      screenReaderSupport: false,
      keyboardNavigation: true,
      highContrast: false,
      reducedMotion: false,
      largeText: false,
      
      // Security
      adminTwoFactorEnabled: false,
      sessionTimeout: "8",
      multipleDeviceLogin: true,
      
      // Integrations
      integrations: {
        googleWorkspace: false,
        microsoftOffice: false,
        slack: false,
        zapier: false,
        mailchimp: false,
        hubspot: false,
      },
    },
  })

  // Watch theme changes and apply them
  const watchedTheme = form.watch("themeMode")
  useEffect(() => {
    if (watchedTheme && watchedTheme !== theme) {
      setTheme(watchedTheme)
    }
  }, [watchedTheme, theme, setTheme])

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

  const handleProfileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setProfilePreview(result)
        form.setValue("profilePicture", result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDataExport = async () => {
    setIsExporting(true)
    setDataExportProgress(0)
    
    try {
      // Simulate data export progress
      for (let i = 0; i <= 100; i += 10) {
        setDataExportProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Create and download mock data
      const data = {
        profile: form.getValues(),
        exportDate: new Date().toISOString(),
        version: "1.0"
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zoolyum-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Data exported successfully",
        description: "Your settings have been downloaded as a JSON file.",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setDataExportProgress(0)
    }
  }

  const handleDataImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string
          const data = JSON.parse(result)
          
          if (data.profile) {
            // Reset form with imported data
            form.reset(data.profile)
            toast({
              title: "Data imported successfully",
              description: "Your settings have been restored from the file.",
            })
          } else {
            throw new Error("Invalid file format")
          }
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid file format. Please select a valid settings file.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
  }

  const clearLocalStorage = () => {
    localStorage.clear()
    sessionStorage.clear()
    toast({
      title: "Local storage cleared",
      description: "All local data has been removed from your browser.",
    })
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
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Accessibility className="h-4 w-4" />
            Accessibility
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* User Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Profile
                  </CardTitle>
                  <CardDescription>
                    Manage your personal information and profile settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <FormLabel>Profile Picture</FormLabel>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profilePreview || "/placeholder-avatar.svg"} alt="Profile picture" />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="relative overflow-hidden"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Recommended: 200x200px, PNG or JPG
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Change Password</h4>
                    
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter current password" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter new password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Confirm new password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Preferences */}
             <TabsContent value="notifications" className="space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Bell className="h-5 w-5" />
                     Notification Preferences
                   </CardTitle>
                   <CardDescription>
                     Configure how and when you receive notifications
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div className="space-y-6">
                     <div className="space-y-4">
                       <h4 className="text-sm font-medium">Notification Channels</h4>
                       
                       <FormField
                         control={form.control}
                         name="emailNotifications"
                         render={({ field }) => (
                           <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                               <FormLabel className="text-base flex items-center gap-2">
                                 <Mail className="h-4 w-4" />
                                 Email Notifications
                               </FormLabel>
                               <FormDescription>
                                 Receive notifications via email
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
                         name="inAppNotifications"
                         render={({ field }) => (
                           <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                               <FormLabel className="text-base flex items-center gap-2">
                                 <Monitor className="h-4 w-4" />
                                 In-App Notifications
                               </FormLabel>
                               <FormDescription>
                                 Show notifications within the application
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
                         name="pushNotifications"
                         render={({ field }) => (
                           <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                               <FormLabel className="text-base flex items-center gap-2">
                                 <Smartphone className="h-4 w-4" />
                                 Push Notifications
                               </FormLabel>
                               <FormDescription>
                                 Receive push notifications on your devices
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
                         name="soundEnabled"
                         render={({ field }) => (
                           <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                               <FormLabel className="text-base flex items-center gap-2">
                                 {field.value ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                                 Sound Notifications
                               </FormLabel>
                               <FormDescription>
                                 Play sound when notifications arrive
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

                     <Separator />

                     <div className="space-y-4">
                       <h4 className="text-sm font-medium">Notification Types</h4>
                       <p className="text-sm text-muted-foreground">
                         Choose which types of notifications you want to receive
                       </p>
                       
                       <div className="grid gap-4 md:grid-cols-2">
                         <FormField
                           control={form.control}
                           name="notificationTypes.newLeads"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                               <FormControl>
                                 <Checkbox
                                   checked={field.value}
                                   onCheckedChange={field.onChange}
                                 />
                               </FormControl>
                               <div className="space-y-1 leading-none">
                                 <FormLabel>New Leads</FormLabel>
                                 <FormDescription>
                                   When new leads are added to the system
                                 </FormDescription>
                               </div>
                             </FormItem>
                           )}
                         />

                         <FormField
                           control={form.control}
                           name="notificationTypes.taskUpdates"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                               <FormControl>
                                 <Checkbox
                                   checked={field.value}
                                   onCheckedChange={field.onChange}
                                 />
                               </FormControl>
                               <div className="space-y-1 leading-none">
                                 <FormLabel>Task Updates</FormLabel>
                                 <FormDescription>
                                   When tasks are assigned or completed
                                 </FormDescription>
                               </div>
                             </FormItem>
                           )}
                         />

                         <FormField
                           control={form.control}
                           name="notificationTypes.systemAlerts"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                               <FormControl>
                                 <Checkbox
                                   checked={field.value}
                                   onCheckedChange={field.onChange}
                                 />
                               </FormControl>
                               <div className="space-y-1 leading-none">
                                 <FormLabel>System Alerts</FormLabel>
                                 <FormDescription>
                                   Important system notifications and updates
                                 </FormDescription>
                               </div>
                             </FormItem>
                           )}
                         />

                         <FormField
                           control={form.control}
                           name="notificationTypes.projectUpdates"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                               <FormControl>
                                 <Checkbox
                                   checked={field.value}
                                   onCheckedChange={field.onChange}
                                 />
                               </FormControl>
                               <div className="space-y-1 leading-none">
                                 <FormLabel>Project Updates</FormLabel>
                                 <FormDescription>
                                   When projects are created or modified
                                 </FormDescription>
                               </div>
                             </FormItem>
                           )}
                         />

                         <FormField
                           control={form.control}
                           name="notificationTypes.teamMessages"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                               <FormControl>
                                 <Checkbox
                                   checked={field.value}
                                   onCheckedChange={field.onChange}
                                 />
                               </FormControl>
                               <div className="space-y-1 leading-none">
                                 <FormLabel>Team Messages</FormLabel>
                                 <FormDescription>
                                   Messages from team members
                                 </FormDescription>
                               </div>
                             </FormItem>
                           )}
                         />

                         <FormField
                           control={form.control}
                           name="notificationTypes.deadlineReminders"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                               <FormControl>
                                 <Checkbox
                                   checked={field.value}
                                   onCheckedChange={field.onChange}
                                 />
                               </FormControl>
                               <div className="space-y-1 leading-none">
                                 <FormLabel>Deadline Reminders</FormLabel>
                                 <FormDescription>
                                   Reminders for upcoming deadlines
                                 </FormDescription>
                               </div>
                             </FormItem>
                           )}
                         />
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>

             {/* Theme & Display Settings */}
             <TabsContent value="theme" className="space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Palette className="h-5 w-5" />
                     Theme & Display Settings
                   </CardTitle>
                   <CardDescription>
                     Customize the appearance and display of the application
                   </CardDescription>
                 </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-6">
                     <div className="space-y-4">
                       <h4 className="text-sm font-medium">Theme Selection</h4>
                       
                       <FormField
                         control={form.control}
                         name="themeMode"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Theme Mode</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl>
                                 <SelectTrigger>
                                   <SelectValue placeholder="Select theme mode" />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                 <SelectItem value="light">
                                   <div className="flex items-center gap-2">
                                     <Sun className="h-4 w-4" />
                                     Light
                                   </div>
                                 </SelectItem>
                                 <SelectItem value="dark">
                                   <div className="flex items-center gap-2">
                                     <Moon className="h-4 w-4" />
                                     Dark
                                   </div>
                                 </SelectItem>
                                 <SelectItem value="system">
                                   <div className="flex items-center gap-2">
                                     <Monitor className="h-4 w-4" />
                                     System
                                   </div>
                                 </SelectItem>
                               </SelectContent>
                             </Select>
                             <FormDescription>
                               Choose your preferred theme or follow system settings
                             </FormDescription>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </div>

                     <Separator />

                     <div className="space-y-4">
                       <h4 className="text-sm font-medium">Display Settings</h4>
                       
                       <FormField
                         control={form.control}
                         name="fontSize"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Font Size</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl>
                                 <SelectTrigger>
                                   <SelectValue placeholder="Select font size" />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                 <SelectItem value="small">Small</SelectItem>
                                 <SelectItem value="medium">Medium</SelectItem>
                                 <SelectItem value="large">Large</SelectItem>
                                 <SelectItem value="extra-large">Extra Large</SelectItem>
                               </SelectContent>
                             </Select>
                             <FormDescription>
                               Adjust the font size for better readability
                             </FormDescription>
                             <FormMessage />
                           </FormItem>
                         )}
                       />

                       <FormField
                         control={form.control}
                         name="contrast"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Contrast Level</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl>
                                 <SelectTrigger>
                                   <SelectValue placeholder="Select contrast level" />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                 <SelectItem value="normal">Normal</SelectItem>
                                 <SelectItem value="high">High Contrast</SelectItem>
                                 <SelectItem value="extra-high">Extra High Contrast</SelectItem>
                               </SelectContent>
                             </Select>
                             <FormDescription>
                               Adjust contrast for better visibility
                             </FormDescription>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>

             {/* Accessibility Settings */}
             <TabsContent value="accessibility" className="space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Accessibility className="h-5 w-5" />
                     Accessibility Settings
                   </CardTitle>
                   <CardDescription>
                     Configure accessibility features for better usability
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div className="space-y-6">
                     <FormField
                       control={form.control}
                       name="screenReaderSupport"
                       render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                           <div className="space-y-0.5">
                             <FormLabel className="text-base">Screen Reader Support</FormLabel>
                             <FormDescription>
                               Enhanced support for screen readers
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
                       name="keyboardNavigation"
                       render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                           <div className="space-y-0.5">
                             <FormLabel className="text-base flex items-center gap-2">
                               <Keyboard className="h-4 w-4" />
                               Enhanced Keyboard Navigation
                             </FormLabel>
                             <FormDescription>
                               Improved keyboard navigation and shortcuts
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
                       name="highContrast"
                       render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                           <div className="space-y-0.5">
                             <FormLabel className="text-base flex items-center gap-2">
                               <Eye className="h-4 w-4" />
                               High Contrast Mode
                             </FormLabel>
                             <FormDescription>
                               Increase contrast for better visibility
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
                       name="reducedMotion"
                       render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                           <div className="space-y-0.5">
                             <FormLabel className="text-base">Reduced Motion</FormLabel>
                             <FormDescription>
                               Minimize animations and transitions
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
                       name="largeText"
                       render={({ field }) => (
                         <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                           <div className="space-y-0.5">
                             <FormLabel className="text-base">Large Text Mode</FormLabel>
                             <FormDescription>
                               Increase text size throughout the application
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
                 </CardContent>
               </Card>
             </TabsContent>

             {/* Data Management */}
             <TabsContent value="data" className="space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Database className="h-5 w-5" />
                     Data Management
                   </CardTitle>
                   <CardDescription>
                     Manage your data, including export, import, and storage options
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div className="space-y-6">
                     <div className="space-y-4">
                       <h4 className="text-sm font-medium">Data Export & Import</h4>
                       
                       <div className="grid gap-4 md:grid-cols-2">
                         <Button
                           type="button"
                           variant="outline"
                           onClick={handleDataExport}
                           className="flex items-center gap-2"
                         >
                           <Download className="h-4 w-4" />
                           Export Settings
                         </Button>
                         
                         <div className="relative">
                           <input
                             type="file"
                             accept=".json"
                             onChange={handleDataImport}
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                           />
                           <Button
                             type="button"
                             variant="outline"
                             className="w-full flex items-center gap-2"
                           >
                             <Upload className="h-4 w-4" />
                             Import Settings
                           </Button>
                         </div>
                       </div>
                       
                       {dataExportProgress > 0 && dataExportProgress < 100 && (
                         <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                             <span>Exporting data...</span>
                             <span>{dataExportProgress}%</span>
                           </div>
                           <Progress value={dataExportProgress} className="w-full" />
                         </div>
                       )}
                     </div>

                     <Separator />

                     <div className="space-y-4">
                       <h4 className="text-sm font-medium">Local Storage</h4>
                       <p className="text-sm text-muted-foreground">
                         Manage local browser storage and cached data
                       </p>
                       
                       <Button
                         type="button"
                         variant="destructive"
                         onClick={clearLocalStorage}
                         className="flex items-center gap-2"
                       >
                         <Trash2 className="h-4 w-4" />
                         Clear Local Storage
                       </Button>
                       
                       <p className="text-xs text-muted-foreground">
                         This will remove all locally stored preferences and cached data. You may need to reconfigure your settings.
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>

             {/* Integration Settings */}
             <TabsContent value="integrations" className="space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <Plug className="h-5 w-5" />
                     Integration Settings
                   </CardTitle>
                   <CardDescription>
                     Connect and configure third-party service integrations
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div className="space-y-6">
                     <div className="space-y-4">
                       <h4 className="text-sm font-medium">Productivity Tools</h4>
                       
                       <div className="grid gap-4">
                         <FormField
                           control={form.control}
                           name="integrations.googleWorkspace"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                               <div className="space-y-0.5">
                                 <FormLabel className="text-base">Google Workspace</FormLabel>
                                 <FormDescription>
                                   Connect with Gmail, Google Calendar, and Drive
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
                           name="integrations.microsoftOffice"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                               <div className="space-y-0.5">
                                 <FormLabel className="text-base">Microsoft Office 365</FormLabel>
                                 <FormDescription>
                                   Connect with Outlook, Teams, and OneDrive
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
                           name="integrations.slack"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                               <div className="space-y-0.5">
                                 <FormLabel className="text-base">Slack</FormLabel>
                                 <FormDescription>
                                   Receive notifications and updates in Slack
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
                     </div>

                     <Separator />

                     <div className="space-y-4">
                       <h4 className="text-sm font-medium">Marketing & Automation</h4>
                       
                       <div className="grid gap-4">
                         <FormField
                           control={form.control}
                           name="integrations.zapier"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                               <div className="space-y-0.5">
                                 <FormLabel className="text-base">Zapier</FormLabel>
                                 <FormDescription>
                                   Automate workflows with 5000+ apps
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
                           name="integrations.mailchimp"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                               <div className="space-y-0.5">
                                 <FormLabel className="text-base">Mailchimp</FormLabel>
                                 <FormDescription>
                                   Sync contacts and manage email campaigns
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
                           name="integrations.hubspot"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                               <div className="space-y-0.5">
                                 <FormLabel className="text-base">HubSpot</FormLabel>
                                 <FormDescription>
                                   Sync CRM data and marketing automation
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
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>

             {/* Company Settings */}
             <TabsContent value="company" className="space-y-6">
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