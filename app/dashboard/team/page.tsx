"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { TeamMemberCard } from "@/components/team/team-member-card"
import { TeamStatsComponent } from "@/components/team/team-stats"
import { DepartmentManagement } from "@/components/team/department-management"
import { AddTeamMemberForm } from "@/components/team/add-team-member-form"
import { teamMembers, teamStats, departments, departmentStats } from "@/data/team"
import { Department, TeamMember } from "@/types/team"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, UserPlus, Building2, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function TeamPage() {
  const [localDepartments, setLocalDepartments] = useState<Department[]>(departments)
  const [localTeamMembers, setLocalTeamMembers] = useState<TeamMember[]>(teamMembers)
  const [localDepartmentStats, setLocalDepartmentStats] = useState(departmentStats)

  const handleAddMember = (newMember: TeamMember) => {
    setLocalTeamMembers(prev => [...prev, newMember])
  }

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
                />
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {localDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <AddTeamMemberForm 
              onAddMember={handleAddMember}
              departments={localDepartments.map(dept => dept.name)}
            />
          </div>

          {/* Team Members Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {localTeamMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>

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
