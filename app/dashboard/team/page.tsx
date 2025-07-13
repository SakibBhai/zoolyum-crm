"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { TeamStatsComponent } from "@/components/team/team-stats"
import { TeamMemberCard } from "@/components/team/team-member-card"
import { AddTeamMemberForm } from "@/components/team/add-team-member-form"
import { DepartmentManagement } from "@/components/team/department-management"
import { teamStats, departments, departmentStats } from "@/data/team"
import { Department, TeamMember } from "@/types/team"
import { Search, Filter, UserPlus, Building2, Users, Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function TeamPage() {
  const [localDepartments, setLocalDepartments] = useState<Department[]>(departments)
  const [localTeamMembers, setLocalTeamMembers] = useState<TeamMember[]>([])
  const [localDepartmentStats, setLocalDepartmentStats] = useState(departmentStats)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  // Fetch team members from database
  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/team')
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      const data = await response.json()
      
      // Transform database response to match TeamMember interface
      const transformedMembers: TeamMember[] = data.map((member: any) => ({
        id: member.id.toString(),
        name: member.name,
        role: member.role,
        department: member.department,
        email: member.email,
        phone: member.phone,
        avatar: member.avatar || '/placeholder-user.jpg',
        bio: member.bio || '',
        skills: Array.isArray(member.skills) ? member.skills : JSON.parse(member.skills || '[]'),
        linkedin: member.linkedin,
        twitter: member.twitter,
        location: member.location || '',
        joinDate: member.created_at || new Date().toISOString(),
        employeeId: member.employee_id,
        salary: member.salary,
        manager: member.manager,
        performanceRating: member.performance_rating,
        emergencyContact: {
          name: member.emergency_contact_name,
          relationship: member.emergency_contact_relationship,
          phone: member.emergency_contact_phone,
          email: member.emergency_contact_email,
        },
        isActive: member.is_active !== false,
      }))
      
      setLocalTeamMembers(transformedMembers)
    } catch (error) {
      console.error('Error fetching team members:', error)
      toast("Error", {
        description: "Failed to load team members. Please try again.",
        style: { backgroundColor: '#ef4444', color: '#fff' },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const handleAddMember = (newMember: TeamMember) => {
    setLocalTeamMembers(prev => [...prev, newMember])
      toast("Success", {
        description: "Team member added successfully!",
      })
  }

  const handleUpdateMember = async (id: string, updates: Partial<TeamMember>) => {
    try {
      console.log('Updating team member:', id, 'with updates:', updates)
      
      const response = await fetch(`/api/team/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || 'Failed to update team member')
      }

      const updatedMember = await response.json()
      console.log('Successfully updated team member:', updatedMember)
      
      // Update local state with the returned data from the server
      setLocalTeamMembers(prev => 
        prev.map(member => 
          member.id === id ? { ...member, ...updatedMember } : member
        )
      )
      
      // Force a refresh of team data to ensure consistency
      await fetchTeamMembers()
      
      toast("Success", {
        description: "Team member updated successfully!",
      })
    } catch (error) {
      console.error('Error updating team member:', error)
      toast("Error", {
        description: error instanceof Error ? error.message : "Failed to update team member. Please try again.", 
        style: { backgroundColor: '#ef4444', color: '#fff' },
      })
    }
  }

  const handleDeleteMember = async (id: string) => {
    try {
      const response = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete team member')
      }

      setLocalTeamMembers(prev => prev.filter(member => member.id !== id))
      
      toast("Success", {
        description: "Team member removed successfully!",
      })
    } catch (error) {
      console.error('Error deleting team member:', error)
      toast("Error", {
        description: "Failed to remove team member. Please try again.",
        style: { backgroundColor: '#ef4444', color: '#fff' },
      })
    }
  }

  // Filter team members based on search and department
  const filteredTeamMembers = localTeamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || member.department === selectedDepartment
    return matchesSearch && matchesDepartment && member.isActive
  })

  const handleDepartmentCreate = (departmentData: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Generate timestamps in a useEffect-safe way
    const timestamp = typeof window !== 'undefined' ? new Date().toISOString() : '';
    const uniqueId = `dept-${typeof window !== 'undefined' ? Date.now() : '0'}`;
    
    const newDepartment: Department = {
      ...departmentData,
      id: uniqueId,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    
    setLocalDepartments(prev => [...prev, newDepartment])
    
    // Add initial stats for the new department
    const newStats = {
      id: newDepartment.id,
      totalMembers: 0,
      performance: 4.0,
      budgetUtilization: 0,
      openPositions: 0,
      avgSalary: 0,
      turnoverRate: 0
    }
    setLocalDepartmentStats(prev => [...prev, {
      id: newDepartment.id,
      departmentName: newDepartment.name,
      memberCount: 0,
      averageExperience: 0,
      budget: 0,
      totalMembers: 0,
      performance: 4.0,
      budgetUtilization: 0,
      openPositions: 0,
      avgSalary: 0,
      turnoverRate: 0
    }])
  }

  const handleDepartmentUpdate = (id: string, updates: Partial<Department>) => {
    setLocalDepartments(prev => 
      prev.map(dept => 
        dept.id === id ? { ...dept, ...updates } : dept
      )
    )
  }

  const handleDepartmentDelete = (id: string) => {
    setLocalDepartments(prev => prev.filter(dept => dept.id !== id))
    setLocalDepartmentStats(prev => prev.filter(stat => stat.id !== id))
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <PageHeader
        heading="Team Management"
        subheading="Manage your team members, departments, and organizational structure"
      />

      {/* Team Statistics */}
      <TeamStatsComponent stats={teamStats} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="team" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search team members..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {localDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedDepartment("all")
                }}
                title="Clear filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <AddTeamMemberForm 
              onAddMember={handleAddMember}
              departments={localDepartments.map(dept => dept.name)}
            />
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading team members...</span>
            </div>
          ) : (
            <>
              {/* Team Members Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTeamMembers.map((member) => (
                  <TeamMemberCard 
                    key={member.id} 
                    member={member} 
                    onUpdate={handleUpdateMember}
                    onDelete={handleDeleteMember}
                  />
                ))}
              </div>

              {/* No Results State */}
              {filteredTeamMembers.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm || selectedDepartment !== "all" ? "No team members found" : "No team members yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || selectedDepartment !== "all" 
                      ? "Try adjusting your search or filter criteria." 
                      : "Start building your team by adding your first team member."}
                  </p>
                  {(searchTerm || selectedDepartment !== "all") && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedDepartment("all")
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Call to Action */}
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">Growing Your Team?</h3>
            <p className="text-muted-foreground mb-4">
              Add new team members and manage departments to scale your organization effectively.
            </p>
            <div className="flex gap-4 justify-center">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
              <Button variant="outline">
                Manage Departments
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManagement
            departments={localDepartments}
            departmentStats={localDepartmentStats}
            teamMembers={localTeamMembers}
            onDepartmentCreate={handleDepartmentCreate}
            onDepartmentUpdate={handleDepartmentUpdate}
            onDepartmentDelete={handleDepartmentDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
