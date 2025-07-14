"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CalendarIcon,
  Upload,
  X,
  AlertTriangle,
  Repeat,
  CreditCard,
  Building,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  DollarSign,
  Globe
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Enhanced Transaction interface
export interface EnhancedTransaction {
  id: string
  type: 'income' | 'expense'
  subType?: string
  amount: number
  currency: string
  exchangeRate?: number
  originalAmount?: number
  originalCurrency?: string
  category: string
  customCategory?: string
  description: string
  richDescription?: string
  date: string
  dueDate?: string
  paymentMethod: string
  vendorClient?: string
  attachments: string[]
  isRecurring: boolean
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
    interval: number
    endDate?: string
    maxOccurrences?: number
  }
  isConfidential: boolean
  tags: string[]
  createdAt: string
  updatedAt?: string
}

const enhancedTransactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "Please select a transaction type.",
  }),
  subType: z.string().optional(),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  currency: z.string().default("BDT"),
  category: z.string().min(1, "Category is required"),
  customCategory: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  richDescription: z.string().optional(),
  date: z.date({
    required_error: "Date is required.",
  }),
  dueDate: z.date().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  vendorClient: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["daily", "weekly", "monthly", "yearly", "custom"]).optional(),
  recurringInterval: z.number().min(1).optional(),
  recurringEndDate: z.date().optional(),
  maxOccurrences: z.number().min(1).optional(),
  isConfidential: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})

type EnhancedTransactionFormValues = z.infer<typeof enhancedTransactionSchema>

interface EnhancedTransactionFormProps {
  transaction?: EnhancedTransaction | null
  onSubmit: (transaction: Omit<EnhancedTransaction, 'id' | 'createdAt'>) => void
  onCancel: () => void
  existingTransactions?: EnhancedTransaction[]
}

// Enhanced categories with sub-types
const enhancedCategories = {
  income: {
    "Salary & Wages": ["Base Salary", "Overtime", "Bonus", "Commission", "Tips"],
    "Business Revenue": ["Product Sales", "Service Revenue", "Consulting", "Licensing", "Royalties"],
    "Investment Income": ["Dividends", "Interest", "Capital Gains", "Rental Income", "Crypto Gains"],
    "Freelance & Gig": ["Project Work", "Contract Work", "Gig Economy", "Creative Work"],
    "Other Income": ["Gifts", "Refunds", "Insurance Claims", "Government Benefits", "Miscellaneous"]
  },
  expense: {
    "Business Operations": ["Office Rent", "Utilities", "Internet", "Phone", "Insurance"],
    "Marketing & Sales": ["Advertising", "Social Media", "Content Creation", "Events", "PR"],
    "Technology": ["Software Licenses", "Hardware", "Cloud Services", "Maintenance", "Security"],
    "Travel & Transport": ["Flights", "Hotels", "Car Rental", "Fuel", "Public Transport"],
    "Professional Services": ["Legal", "Accounting", "Consulting", "Banking", "Professional Fees"],
    "Supplies & Materials": ["Office Supplies", "Raw Materials", "Inventory", "Equipment", "Tools"],
    "Human Resources": ["Salaries", "Benefits", "Training", "Recruitment", "Team Building"],
    "Other Expenses": ["Miscellaneous", "Unexpected", "Emergency", "Personal", "Charity"]
  }
}

const currencies = [
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
]

const paymentMethods = [
  "Bank Transfer",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Digital Wallet",
  "Cryptocurrency",
  "Check",
  "Wire Transfer",
  "Mobile Banking",
  "Online Payment",
  "Other"
]

const descriptionTemplates = {
  income: {
    "Salary & Wages": "Monthly salary payment for {month} {year}",
    "Business Revenue": "Payment received from {client} for {service/product}",
    "Investment Income": "Dividend payment from {investment}",
    "Freelance & Gig": "Project completion payment for {project_name}"
  },
  expense: {
    "Business Operations": "Monthly {expense_type} payment for {month} {year}",
    "Marketing & Sales": "{campaign_name} advertising spend on {platform}",
    "Technology": "{software_name} subscription renewal",
    "Travel & Transport": "Business trip to {destination} - {expense_type}"
  }
}

export function EnhancedTransactionForm({ 
  transaction, 
  onSubmit, 
  onCancel, 
  existingTransactions = [] 
}: EnhancedTransactionFormProps) {
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | ''>('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('BDT')
  const [attachments, setAttachments] = useState<File[]>([])
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const form = useForm<EnhancedTransactionFormValues>({
    resolver: zodResolver(enhancedTransactionSchema),
    defaultValues: {
      type: transaction?.type || undefined,
      subType: transaction?.subType || "",
      amount: transaction?.amount?.toString() || "",
      currency: transaction?.currency || "BDT",
      category: transaction?.category || "",
      customCategory: transaction?.customCategory || "",
      description: transaction?.description || "",
      richDescription: transaction?.richDescription || "",
      date: transaction?.date ? new Date(transaction.date) : new Date(),
      dueDate: transaction?.dueDate ? new Date(transaction.dueDate) : undefined,
      paymentMethod: transaction?.paymentMethod || "",
      vendorClient: transaction?.vendorClient || "",
      isRecurring: transaction?.isRecurring || false,
      recurringFrequency: transaction?.recurringPattern?.frequency || "monthly",
      recurringInterval: transaction?.recurringPattern?.interval || 1,
      recurringEndDate: transaction?.recurringPattern?.endDate ? new Date(transaction.recurringPattern.endDate) : undefined,
      maxOccurrences: transaction?.recurringPattern?.maxOccurrences || undefined,
      isConfidential: transaction?.isConfidential || false,
      tags: transaction?.tags || [],
    },
  })

  // Watch for changes to detect duplicates
  const watchedValues = form.watch()
  
  useEffect(() => {
    if (watchedValues.amount && watchedValues.description && watchedValues.date) {
      const potential = existingTransactions.find(t => 
        Math.abs(t.amount - Number(watchedValues.amount)) < 0.01 &&
        t.description.toLowerCase().includes(watchedValues.description.toLowerCase()) &&
        Math.abs(new Date(t.date).getTime() - watchedValues.date.getTime()) < 24 * 60 * 60 * 1000
      )
      
      if (potential && potential.id !== transaction?.id) {
        setDuplicateWarning(`Similar transaction found: ${potential.description} (${potential.amount})`)
      } else {
        setDuplicateWarning(null)
      }
    }
  }, [watchedValues.amount, watchedValues.description, watchedValues.date, existingTransactions, transaction?.id])

  // AI-based suggestions
  useEffect(() => {
    if (watchedValues.description && watchedValues.description.length > 3) {
      const suggestions = existingTransactions
        .filter(t => t.description.toLowerCase().includes(watchedValues.description.toLowerCase()))
        .map(t => t.category)
        .filter((category, index, self) => self.indexOf(category) === index)
        .slice(0, 3)
      setAiSuggestions(suggestions)
    } else {
      setAiSuggestions([])
    }
  }, [watchedValues.description, existingTransactions])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type)
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid Files",
        description: "Some files were rejected. Only images and PDFs under 10MB are allowed.",
        variant: "destructive"
      })
    }
    
    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (values: EnhancedTransactionFormValues) => {
    const enhancedTransaction: Omit<EnhancedTransaction, 'id' | 'createdAt'> = {
      type: values.type,
      subType: values.subType,
      amount: Number(values.amount),
      currency: values.currency,
      category: values.customCategory || values.category,
      customCategory: values.customCategory,
      description: values.description,
      richDescription: values.richDescription,
      date: values.date.toISOString(),
      dueDate: values.dueDate?.toISOString(),
      paymentMethod: values.paymentMethod,
      vendorClient: values.vendorClient,
      attachments: attachments.map(file => URL.createObjectURL(file)), // In real app, upload to cloud storage
      isRecurring: values.isRecurring,
      recurringPattern: values.isRecurring ? {
        frequency: values.recurringFrequency!,
        interval: values.recurringInterval!,
        endDate: values.recurringEndDate?.toISOString(),
        maxOccurrences: values.maxOccurrences
      } : undefined,
      isConfidential: values.isConfidential,
      tags: values.tags,
      updatedAt: new Date().toISOString()
    }
    
    onSubmit(enhancedTransaction)
  }

  const watchedType = form.watch("type")
  const watchedCategory = form.watch("category")
  const watchedIsRecurring = form.watch("isRecurring")
  const watchedCurrency = form.watch("currency")
  
  useEffect(() => {
    setSelectedType(watchedType)
    if (watchedType && watchedType !== selectedType) {
      form.setValue("category", "")
      form.setValue("subType", "")
    }
  }, [watchedType, selectedType, form])

  useEffect(() => {
    setSelectedCategory(watchedCategory)
  }, [watchedCategory])

  useEffect(() => {
    setSelectedCurrency(watchedCurrency)
  }, [watchedCurrency])

  const availableCategories = selectedType ? enhancedCategories[selectedType] : {}
  const availableSubTypes = selectedCategory ? enhancedCategories[selectedType]?.[selectedCategory] || [] : []
  const selectedCurrencyInfo = currencies.find(c => c.code === selectedCurrency)

  const applyTemplate = (template: string) => {
    form.setValue("description", template)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
            <Badge variant="outline">Enterprise</Badge>
          </DialogTitle>
          <DialogDescription>
            {transaction 
              ? 'Update the transaction details with advanced features.' 
              : 'Create a comprehensive financial transaction with enterprise-grade features.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                {/* Duplicate Warning */}
                {duplicateWarning && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {duplicateWarning}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">💰 Income</SelectItem>
                            <SelectItem value="expense">💸 Expense</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.symbol} {currency.code} - {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-semibold">
                            {selectedCurrencyInfo?.symbol || '৳'}
                          </span>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-8 pr-16"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                            {selectedCurrency}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.keys(availableCategories).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">🎯 Custom Category</SelectItem>
                          </SelectContent>
                        </Select>
                        {aiSuggestions.length > 0 && (
                          <FormDescription>
                            💡 AI Suggestions: {aiSuggestions.join(', ')}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedCategory && availableSubTypes.length > 0 && (
                    <FormField
                      control={form.control}
                      name="subType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sub-type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sub-type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableSubTypes.map((subType) => (
                                <SelectItem key={subType} value={subType}>
                                  {subType}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {watchedCategory === "custom" && (
                  <FormField
                    control={form.control}
                    name="customCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Category Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter custom category name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter transaction description..."
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      {selectedType && selectedCategory && descriptionTemplates[selectedType]?.[selectedCategory] && (
                        <FormDescription>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => applyTemplate(descriptionTemplates[selectedType][selectedCategory])}
                          >
                            📝 Use Template
                          </Button>
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Transaction Date *</FormLabel>
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
                                  format(field.value, "PPP")
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
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
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
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method} value={method}>
                                <CreditCard className="inline h-4 w-4 mr-2" />
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={form.control}
                  name="vendorClient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor/Client Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} placeholder="Enter vendor or client name" className="pl-10" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Link this transaction to a specific vendor or client
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date (if different from transaction date)</FormLabel>
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
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick due date</span>
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
                  name="richDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rich Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Add detailed notes, bullet points, or additional context..."
                          className="min-h-[120px]"
                        />
                      </FormControl>
                      <FormDescription>
                        Add detailed notes, links, or formatted text
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base flex items-center gap-2">
                            <Repeat className="h-4 w-4" />
                            Recurring Transaction
                          </FormLabel>
                          <FormDescription>
                            Set up automatic recurring transactions
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

                  {watchedIsRecurring && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recurring Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="recurringFrequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="recurringInterval"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Interval</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Every {field.value || 1} {form.watch("recurringFrequency") || "month"}(s)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="recurringEndDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>End Date (Optional)</FormLabel>
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
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>No end date</span>
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
                            name="maxOccurrences"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Occurrences (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min="1"
                                    placeholder="Unlimited"
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Maximum number of recurring transactions
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="isConfidential"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          {field.value ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          Confidential Transaction
                        </FormLabel>
                        <FormDescription>
                          Mark as private for team environments
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
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Receipt & Documents</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload receipts, invoices, or supporting documents
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {attachments.map((file, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm truncate">{file.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Alert>
                    <Upload className="h-4 w-4" />
                    <AlertDescription>
                      Supported formats: JPEG, PNG, GIF, PDF. Maximum file size: 10MB per file.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <DialogFooter className="flex justify-between">
              <div className="flex items-center gap-2">
                {duplicateWarning && (
                  <Badge variant="destructive">Potential Duplicate</Badge>
                )}
                {form.watch("isConfidential") && (
                  <Badge variant="secondary">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Confidential
                  </Badge>
                )}
                {form.watch("isRecurring") && (
                  <Badge variant="outline">
                    <Repeat className="h-3 w-3 mr-1" />
                    Recurring
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  {transaction ? 'Update Transaction' : 'Create Transaction'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}