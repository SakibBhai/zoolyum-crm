"use client"

import { useState } from "react"
import { Department, DepartmentStats, TeamMember } from "@/types/team"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Users, DollarSign, Target, MapPin, Calendar, Building2, TrendingUp, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DepartmentManagementProps {
  departments: Department[]
  departmentStats: DepartmentStats[]
  teamMembers: TeamMember[]
  onDepartmentCreate: (department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => void
  onDepartmentUpdate: (id: string, department: Partial<Department>) => void
  onDepartmentDelete: (id: string) => void
}

interface DepartmentFormData {
  name: string
  description: string
  head?: string
  budget?: number
  location?: string
  color?: string
  goals: string[]
  responsibilities: string[]
  isActive: boolean
}

const defaultFormData: DepartmentFormData = {
  name: "",
  description: "",
  budget: 0,
  location: "",
  color: "#4ECDC4",
  goals: [],
  responsibilities: [],
  isActive: true
}

const colorOptions = [
  { value: "#FF6B6B", label: "Red" },
  { value: "#4ECDC4", label: "Teal" },
  { value: "#45B7D1", label: "Blue" },
  { value: "#96CEB4", label: "Green" },
  { value: "#FECA57", label: "Yellow" },
  { value: "#A8E6CF", label: "Light Green" },
  { value: "#DDA0DD", label: "Purple" },
  { value: "#F4A460", label: "Orange" }
]

export function DepartmentManagement({
  departments,
  departmentStats,
  teamMembers,
  onDepartmentCreate,
  onDepartmentUpdate,
  onDepartmentDelete
}: DepartmentManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState<DepartmentFormData>(defaultFormData)
  const [newGoal, setNewGoal] = useState("")
  const [newResponsibility, setNewResponsibility] = useState("")

  const handleCreateDepartment = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Department name is required",
        variant: "destructive"
      })
      return
    }

    onDepartmentCreate({
      ...formData,
      isActive: true
    })

    setFormData(defaultFormData)
    setIsCreateDialogOpen(false)
    toast({
      title: "Success",
      description: "Department created successfully"
    })
  }

  const handleUpdateDepartment = () => {
    if (!editingDepartment || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Department name is required",
        variant: "destructive"
      })
      return
    }

    onDepartmentUpdate(editingDepartment.id, {
      ...formData,
      updatedAt: new Date().toISOString()
    })

    setEditingDepartment(null)
    setFormData(defaultFormData)
    toast({
      title: "Success",
      description: "Department updated successfully"
    })
  }

  const handleDeleteDepartment = (departmentId: string) => {
    const departmentMembers = teamMembers.filter(member => member.departmentId === departmentId)
    
    if (departmentMembers.length > 0) {
      toast({
        title: "Cannot Delete Department",
        description: `This department has ${departmentMembers.length} active members. Please reassign them first.`,
        variant: "destructive"
      })
      return
    }

    onDepartmentDelete(departmentId)
    toast({
      title: "Success",
      description: "Department deleted successfully"
    })
  }

  const startEdit = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description,
      head: department.head,
      budget: department.budget,
      location: department.location,
      color: department.color,
      goals: department.goals || [],
      responsibilities: department.responsibilities || [],
      isActive: department.isActive
    })
  }

  const addGoal = () => {
    if (newGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()]
      }))
      setNewGoal("")
    }
  }

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }))
  }

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, newResponsibility.trim()]
      }))
      setNewResponsibility("")
    }
  }

  const removeResponsibility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index)
    }))
  }

  const getDepartmentHead = (headId?: string) => {
    if (!headId) return null
    return teamMembers.find(member => member.id === headId)
  }

  const getDepartmentMemberCount = (departmentId: string) => {
    return teamMembers.filter(member => member.departmentId === departmentId).length
  }

  const getDepartmentStats = (departmentId: string) => {
    return departmentStats.find(stat => stat.id === departmentId)
  }

  const DepartmentForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Department Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter department name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Department location"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the department's purpose and role"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="head">Department Head</Label>
          <Select
            value={formData.head || ""}
            onValueChange={(value) => setFormData(prev => ({ ...prev, head: value || undefined }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department head" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No head assigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name} - {member.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Annual Budget ($)</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) || undefined }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Theme Color</Label>
        <Select
          value={formData.color || ""}
          onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select theme color" />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map((color) => (
              <SelectItem key={color.value} value={color.value}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: color.value }}
                  />
                  {color.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Department Goals</Label>
        <div className="flex gap-2">
          <Input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Add a goal"
            onKeyPress={(e) => e.key === 'Enter' && addGoal()}
          />
          <Button type="button" onClick={addGoal} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.goals.map((goal, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {goal}
              <button
                type="button"
                onClick={() => removeGoal(index)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Key Responsibilities</Label>
        <div className="flex gap-2">
          <Input
            value={newResponsibility}
            onChange={(e) => setNewResponsibility(e.target.value)}
            placeholder="Add a responsibility"
            onKeyPress={(e) => e.key === 'Enter' && addResponsibility()}
          />
          <Button type="button" onClick={addResponsibility} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.responsibilities.map((responsibility, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-1">
              {responsibility}
              <button
                type="button"
                onClick={() => removeResponsibility(index)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Department Management</h2>
          <p className="text-muted-foreground">Manage departments, budgets, and organizational structure</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <DepartmentForm />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDepartment}>
                Create Department
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              {departments.filter(d => d.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${departments.reduce((sum, dept) => sum + (dept.budget || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Annual allocation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(departmentStats.reduce((sum, stat) => sum + stat.performance, 0) / departmentStats.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departmentStats.reduce((sum, stat) => sum + stat.openPositions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Departments Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => {
          const head = getDepartmentHead(department.head)
          const memberCount = getDepartmentMemberCount(department.id)
          const stats = getDepartmentStats(department.id)
          
          return (
            <Card key={department.id} className="relative">
              <div 
                className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                style={{ backgroundColor: department.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {department.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {department.location}
                        </div>
                      )}
                      <Badge variant={department.isActive ? "default" : "secondary"}>
                        {department.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(department)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Department</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the {department.name} department? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDepartment(department.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {department.description}
                </p>

                {/* Department Head */}
                {head && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{head.name}</p>
                      <p className="text-xs text-muted-foreground">{head.role}</p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                {stats && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Members</p>
                      <p className="font-medium">{memberCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Performance</p>
                      <p className="font-medium">{stats.performance}/5.0</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">${(department.budget || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Utilization</p>
                      <div className="flex items-center gap-2">
                        <Progress value={stats.budgetUtilization} className="flex-1" />
                        <span className="text-xs">{stats.budgetUtilization}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Goals */}
                {department.goals && department.goals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Goals
                    </p>
                    <div className="space-y-1">
                      {department.goals.slice(0, 2).map((goal, index) => (
                        <p key={index} className="text-xs text-muted-foreground">• {goal}</p>
                      ))}
                      {department.goals.length > 2 && (
                        <p className="text-xs text-muted-foreground">+{department.goals.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Open Positions Alert */}
                {stats && stats.openPositions > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">
                      {stats.openPositions} open position{stats.openPositions > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Department Dialog */}
      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <DepartmentForm />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditingDepartment(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDepartment}>
              Update Department
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}