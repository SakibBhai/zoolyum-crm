"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { DollarSign, Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle, PieChart, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BudgetCategory {
  id: string
  name: string
  description?: string
  allocatedAmount: number
  spentAmount: number
  color: string
}

export interface BudgetExpense {
  id: string
  projectId: string
  categoryId: string
  title: string
  description?: string
  amount: number
  date: string
  type: 'expense' | 'income' | 'adjustment'
  status: 'pending' | 'approved' | 'rejected'
  receipt?: string
  vendor?: string
  approvedBy?: string
  approvedAt?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ProjectBudget {
  id: string
  projectId: string
  totalBudget: number
  allocatedBudget: number
  spentAmount: number
  remainingBudget: number
  categories: BudgetCategory[]
  expenses: BudgetExpense[]
  budgetAlerts: {
    warningThreshold: number // percentage
    criticalThreshold: number // percentage
  }
  createdAt: string
  updatedAt: string
}

interface BudgetManagementProps {
  projectId: string
}

const EXPENSE_TYPES = [
  { value: 'expense', label: 'Expense', color: 'bg-red-100 text-red-800' },
  { value: 'income', label: 'Income', color: 'bg-green-100 text-green-800' },
  { value: 'adjustment', label: 'Adjustment', color: 'bg-blue-100 text-blue-800' }
]

const EXPENSE_STATUS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
]

const DEFAULT_CATEGORIES = [
  { name: 'Labor', color: '#3B82F6' },
  { name: 'Materials', color: '#10B981' },
  { name: 'Equipment', color: '#F59E0B' },
  { name: 'Software', color: '#8B5CF6' },
  { name: 'Travel', color: '#EF4444' },
  { name: 'Miscellaneous', color: '#6B7280' }
]

export function BudgetManagement({ projectId }: BudgetManagementProps) {
  const [budget, setBudget] = useState<ProjectBudget | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<BudgetExpense | null>(null)
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null)
  const { toast } = useToast()

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: 0,
    categoryId: '',
    type: 'expense' as const,
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    tags: [] as string[]
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    allocatedAmount: 0,
    color: '#3B82F6'
  })

  const [budgetSettings, setBudgetSettings] = useState({
    totalBudget: 0,
    warningThreshold: 80,
    criticalThreshold: 95
  })

  useEffect(() => {
    fetchBudget()
  }, [projectId])

  const fetchBudget = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/budget`)
      if (response.ok) {
        const data = await response.json()
        setBudget(data)
        setBudgetSettings({
          totalBudget: data.totalBudget,
          warningThreshold: data.budgetAlerts.warningThreshold,
          criticalThreshold: data.budgetAlerts.criticalThreshold
        })
      } else if (response.status === 404) {
        // No budget exists, create default
        await createDefaultBudget()
      }
    } catch (error) {
      console.error('Error fetching budget:', error)
      toast({
        title: "Error",
        description: "Failed to load budget data.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultBudget = async () => {
    try {
      const defaultBudget = {
        projectId,
        totalBudget: 0,
        categories: DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          allocatedAmount: 0,
          spentAmount: 0
        })),
        budgetAlerts: {
          warningThreshold: 80,
          criticalThreshold: 95
        }
      }

      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultBudget)
      })

      if (response.ok) {
        const data = await response.json()
        setBudget(data)
      }
    } catch (error) {
      console.error('Error creating default budget:', error)
    }
  }

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const expenseData = {
        ...expenseForm,
        projectId,
        status: 'pending'
      }

      const url = editingExpense
        ? `/api/projects/${projectId}/budget/expenses/${editingExpense.id}`
        : `/api/projects/${projectId}/budget/expenses`

      const method = editingExpense ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Expense ${editingExpense ? 'updated' : 'added'} successfully.`
        })
        setIsExpenseDialogOpen(false)
        resetExpenseForm()
        fetchBudget()
      } else {
        throw new Error('Failed to save expense')
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      toast({
        title: "Error",
        description: "Failed to save expense.",
        variant: "destructive"
      })
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingCategory
        ? `/api/projects/${projectId}/budget/categories/${editingCategory.id}`
        : `/api/projects/${projectId}/budget/categories`

      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Category ${editingCategory ? 'updated' : 'created'} successfully.`
        })
        setIsCategoryDialogOpen(false)
        resetCategoryForm()
        fetchBudget()
      } else {
        throw new Error('Failed to save category')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast({
        title: "Error",
        description: "Failed to save category.",
        variant: "destructive"
      })
    }
  }

  const updateBudgetSettings = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/budget/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetSettings)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Budget settings updated successfully."
        })
        fetchBudget()
      }
    } catch (error) {
      console.error('Error updating budget settings:', error)
      toast({
        title: "Error",
        description: "Failed to update budget settings.",
        variant: "destructive"
      })
    }
  }

  const approveExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/budget/expenses/${expenseId}/approve`, {
        method: 'PUT'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Expense approved successfully."
        })
        fetchBudget()
      }
    } catch (error) {
      console.error('Error approving expense:', error)
      toast({
        title: "Error",
        description: "Failed to approve expense.",
        variant: "destructive"
      })
    }
  }

  const deleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const response = await fetch(`/api/projects/${projectId}/budget/expenses/${expenseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Expense deleted successfully."
        })
        fetchBudget()
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast({
        title: "Error",
        description: "Failed to delete expense.",
        variant: "destructive"
      })
    }
  }

  const resetExpenseForm = () => {
    setExpenseForm({
      title: '',
      description: '',
      amount: 0,
      categoryId: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      tags: []
    })
    setEditingExpense(null)
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      allocatedAmount: 0,
      color: '#3B82F6'
    })
    setEditingCategory(null)
  }

  const getBudgetStatus = () => {
    if (!budget) return { status: 'good', message: 'No budget data' }

    const utilizationPercent = (budget.spentAmount / budget.totalBudget) * 100

    if (utilizationPercent >= budget.budgetAlerts.criticalThreshold) {
      return { status: 'critical', message: 'Budget critically exceeded!' }
    } else if (utilizationPercent >= budget.budgetAlerts.warningThreshold) {
      return { status: 'warning', message: 'Budget warning threshold reached' }
    } else {
      return { status: 'good', message: 'Budget on track' }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading budget data...</div>
        </CardContent>
      </Card>
    )
  }

  if (!budget) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No budget configured for this project.</p>
            <Button onClick={createDefaultBudget} className="mt-4">
              Create Budget
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const budgetStatus = getBudgetStatus()
  const utilizationPercent = budget.totalBudget > 0 ? (budget.spentAmount / budget.totalBudget) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(budget.totalBudget)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Spent</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(budget.spentAmount)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(budget.remainingBudget)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold">{utilizationPercent.toFixed(1)}%</p>
                <Progress value={utilizationPercent} className="mt-2" />
              </div>
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                budgetStatus.status === 'critical' ? 'bg-red-100' :
                  budgetStatus.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
              )}>
                <AlertTriangle className={cn(
                  "h-4 w-4",
                  budgetStatus.status === 'critical' ? 'text-red-600' :
                    budgetStatus.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                )} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status Alert */}
      {budgetStatus.status !== 'good' && (
        <Card className={cn(
          "border-l-4",
          budgetStatus.status === 'critical' ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                budgetStatus.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
              )} />
              <span className={cn(
                "font-medium",
                budgetStatus.status === 'critical' ? 'text-red-800' : 'text-yellow-800'
              )}>
                {budgetStatus.message}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Budget by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budget.categories.map((category) => {
                    const utilizationPercent = category.allocatedAmount > 0
                      ? (category.spentAmount / category.allocatedAmount) * 100
                      : 0

                    return (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(category.spentAmount)} / {formatCurrency(category.allocatedAmount)}
                          </span>
                        </div>
                        <Progress value={utilizationPercent} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Recent Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budget.expenses.slice(0, 5).map((expense) => {
                    const category = budget.categories.find(c => c.id === expense.categoryId)
                    return (
                      <div key={expense.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{expense.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {category?.name} • {format(parseISO(expense.date), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(expense.amount)}</div>
                          <Badge className={EXPENSE_STATUS.find(s => s.value === expense.status)?.color}>
                            {expense.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Budget Categories</h3>
              <p className="text-sm text-muted-foreground">
                Manage budget allocation across different categories
              </p>
            </div>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetCategoryForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Create Category'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="allocatedAmount">Allocated Amount</Label>
                    <Input
                      id="allocatedAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={categoryForm.allocatedAmount}
                      onChange={(e) => setCategoryForm({ ...categoryForm, allocatedAmount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoryColor">Color</Label>
                    <Input
                      id="categoryColor"
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingCategory ? 'Update' : 'Create'} Category
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budget.categories.map((category) => {
                    const remaining = category.allocatedAmount - category.spentAmount
                    const utilizationPercent = category.allocatedAmount > 0
                      ? (category.spentAmount / category.allocatedAmount) * 100
                      : 0

                    return (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <div className="font-medium">{category.name}</div>
                              {category.description && (
                                <div className="text-sm text-muted-foreground">{category.description}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(category.allocatedAmount)}</TableCell>
                        <TableCell>{formatCurrency(category.spentAmount)}</TableCell>
                        <TableCell className={remaining < 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(remaining)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={utilizationPercent} className="w-16 h-2" />
                            <span className="text-sm">{utilizationPercent.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCategory(category)
                              setCategoryForm({
                                name: category.name,
                                description: category.description || '',
                                allocatedAmount: category.allocatedAmount,
                                color: category.color
                              })
                              setIsCategoryDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Expenses</h3>
              <p className="text-sm text-muted-foreground">
                Track and manage project expenses
              </p>
            </div>
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetExpenseForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? 'Edit Expense' : 'Add Expense'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="expenseTitle">Title</Label>
                    <Input
                      id="expenseTitle"
                      value={expenseForm.title}
                      onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="expenseDescription">Description</Label>
                    <Textarea
                      id="expenseDescription"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expenseAmount">Amount</Label>
                      <Input
                        id="expenseAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="expenseCategory">Category</Label>
                      <Select
                        value={expenseForm.categoryId}
                        onValueChange={(value) => setExpenseForm({ ...expenseForm, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {budget.categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expenseType">Type</Label>
                      <Select
                        value={expenseForm.type}
                        onValueChange={(value: any) => setExpenseForm({ ...expenseForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="expenseDate">Date</Label>
                      <Input
                        id="expenseDate"
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expenseVendor">Vendor</Label>
                    <Input
                      id="expenseVendor"
                      value={expenseForm.vendor}
                      onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingExpense ? 'Update' : 'Add'} Expense
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budget.expenses.map((expense) => {
                    const category = budget.categories.find(c => c.id === expense.categoryId)
                    return (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{expense.title}</div>
                            {expense.description && (
                              <div className="text-sm text-muted-foreground">{expense.description}</div>
                            )}
                            {expense.vendor && (
                              <div className="text-sm text-muted-foreground">Vendor: {expense.vendor}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category?.color }}
                            />
                            {category?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={EXPENSE_TYPES.find(t => t.value === expense.type)?.color}>
                            {formatCurrency(expense.amount)}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(parseISO(expense.date), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge className={EXPENSE_STATUS.find(s => s.value === expense.status)?.color}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {expense.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveExpense(expense.id)}
                              >
                                Approve
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingExpense(expense)
                                setExpenseForm({
                                  title: expense.title,
                                  description: expense.description || '',
                                  amount: expense.amount,
                                  categoryId: expense.categoryId,
                                  type: expense.type === 'expense' ? 'expense' : 'expense' as const,
                                  date: expense.date.split('T')[0],
                                  vendor: expense.vendor || '',
                                  tags: expense.tags
                                })
                                setIsExpenseDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteExpense(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Settings</CardTitle>
              <CardDescription>
                Configure budget parameters and alert thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="totalBudget">Total Project Budget</Label>
                <Input
                  id="totalBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetSettings.totalBudget}
                  onChange={(e) => setBudgetSettings({ ...budgetSettings, totalBudget: parseFloat(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warningThreshold">Warning Threshold (%)</Label>
                  <Input
                    id="warningThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={budgetSettings.warningThreshold}
                    onChange={(e) => setBudgetSettings({ ...budgetSettings, warningThreshold: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="criticalThreshold">Critical Threshold (%)</Label>
                  <Input
                    id="criticalThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={budgetSettings.criticalThreshold}
                    onChange={(e) => setBudgetSettings({ ...budgetSettings, criticalThreshold: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Button onClick={updateBudgetSettings}>
                Update Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}