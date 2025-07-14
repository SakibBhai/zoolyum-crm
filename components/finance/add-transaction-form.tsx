"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Save, 
  RotateCcw,
  Info,
  Tag,
  FileText,
  Calculator
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

const transactionSchema = z.object({
  type: z.enum(["income", "expense"], {
    required_error: "Please select a transaction type.",
  }),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  date: z.date({
    required_error: "Date is required.",
  }),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

const incomeCategories = [
  "Salary",
  "Freelance",
  "Business Revenue",
  "Investment Returns",
  "Rental Income",
  "Dividends",
  "Interest",
  "Bonus",
  "Commission",
  "Consulting",
  "Sales",
  "Other Income"
]

const expenseCategories = [
  "Office Supplies",
  "Software & Tools",
  "Marketing & Advertising",
  "Travel & Transportation",
  "Meals & Entertainment",
  "Professional Services",
  "Rent & Utilities",
  "Insurance",
  "Equipment",
  "Training & Education",
  "Taxes",
  "Bank Fees",
  "Maintenance",
  "Other Expenses"
]

export function AddTransactionForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState<'income' | 'expense' | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: undefined,
      amount: "",
      category: "",
      description: "",
      date: new Date(),
    },
  })

  const handleSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true)
    
    try {
      // Simulate API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create transaction object
      const transaction = {
        id: crypto.randomUUID(),
        type: values.type,
        amount: Number(values.amount),
        category: values.category,
        description: values.description,
        date: values.date.toISOString(),
        createdAt: new Date().toISOString()
      }
      
      // Save to localStorage (replace with actual API call)
      const existingTransactions = JSON.parse(localStorage.getItem('finance-transactions') || '[]')
      const updatedTransactions = [transaction, ...existingTransactions]
      localStorage.setItem('finance-transactions', JSON.stringify(updatedTransactions))
      
      toast({
        title: "Transaction Added Successfully",
        description: `${values.type === 'income' ? 'Income' : 'Expense'} of ৳${Number(values.amount).toLocaleString('en-BD')} has been recorded.`,
      })
      
      // Redirect back to finance page
      router.push('/dashboard/finance')
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    form.reset({
      type: undefined,
      amount: "",
      category: "",
      description: "",
      date: new Date(),
    })
    setSelectedType('')
  }

  const watchedType = form.watch("type")
  const watchedAmount = form.watch("amount")
  
  useEffect(() => {
    setSelectedType(watchedType)
    // Reset category when type changes
    if (watchedType && watchedType !== selectedType) {
      form.setValue("category", "")
    }
  }, [watchedType, selectedType, form])

  const availableCategories = selectedType === 'income' ? incomeCategories : expenseCategories
  const formattedAmount = watchedAmount ? Number(watchedAmount).toLocaleString('en-BD') : '0'

  return (
    <div className="space-y-6">
      {/* Transaction Preview Card */}
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Transaction Preview
          </CardTitle>
          <CardDescription>
            Preview of your transaction before saving
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Type</div>
              <div className="flex items-center gap-2">
                {selectedType === 'income' && (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      Income
                    </Badge>
                  </>
                )}
                {selectedType === 'expense' && (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                      Expense
                    </Badge>
                  </>
                )}
                {!selectedType && (
                  <Badge variant="outline">Not selected</Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Amount</div>
              <div className="text-2xl font-bold flex items-center gap-1">
                <span className="text-lg">৳</span>
                <span className={selectedType === 'income' ? 'text-green-600' : selectedType === 'expense' ? 'text-red-600' : 'text-muted-foreground'}>
                  {formattedAmount}
                </span>
                <span className="text-sm font-normal text-muted-foreground">BDT</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Category</div>
              <div className="text-sm">
                {form.watch('category') || 'Not selected'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transaction Details
          </CardTitle>
          <CardDescription>
            Fill in the information below to record your financial transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Transaction Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Transaction Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Choose whether this is income or expense" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span>Income</span>
                            <Badge variant="default" className="ml-2 bg-green-100 text-green-800 border-green-200">
                              Money In
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="expense">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span>Expense</span>
                            <Badge variant="destructive" className="ml-2 bg-red-100 text-red-800 border-red-200">
                              Money Out
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select whether this transaction represents money coming in (income) or going out (expense)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Amount *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                          <span className="text-lg font-semibold">৳</span>
                        </div>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-10 pr-16 h-12 text-lg"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground font-medium">
                          BDT
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the amount in Bangladeshi Taka (BDT). Use decimal points for paisa (e.g., 1500.50)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Category *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!selectedType}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue 
                            placeholder={
                              selectedType 
                                ? "Select a category for this transaction" 
                                : "Select transaction type first"
                            } 
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              {category}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose a category that best describes this transaction for better organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-base font-semibold">Transaction Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "h-12 pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                {format(field.value, "PPP")}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                <span>Pick the transaction date</span>
                              </div>
                            )}
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
                    <FormDescription>
                      Select the date when this transaction occurred
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Provide a detailed description of this transaction...\n\nExample: Monthly salary payment from ABC Company for December 2024"
                        className="resize-none min-h-[100px]"
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a clear and detailed description to help you identify this transaction later
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving Transaction...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Transaction
                    </div>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset Form
                  </div>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900">Tips for Better Transaction Management</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use descriptive names to easily identify transactions later</li>
                <li>• Choose the most specific category available for better reporting</li>
                <li>• Record transactions as soon as possible to maintain accuracy</li>
                <li>• Include reference numbers or invoice details in the description when applicable</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}