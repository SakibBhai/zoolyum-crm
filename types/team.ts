export interface Department {
  id: string
  name: string
  description: string
  head?: string // Team member ID who heads the department
  budget?: number
  location?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  color?: string // For UI theming
  goals?: string[]
  responsibilities?: string[]
}

export interface TeamMember {
  id: string
  name: string
  role: string
  department: string
  departmentId?: string // Reference to Department.id
  email: string
  phone?: string
  bio: string
  skills: string[]
  avatar: string
  linkedin?: string
  twitter?: string
  joinDate: string
  location: string
  salary?: number
  employeeId?: string
  manager?: string // Team member ID of direct manager
  performanceRating?: number // 1-5 scale
  lastReviewDate?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }
  documents?: {
    id: string
    name: string
    type: 'contract' | 'certification' | 'review' | 'other'
    url: string
    uploadDate: string
  }[]
  isActive: boolean
}

export interface TeamStats {
  totalMembers: number
  departments: number
  averageExperience: number
  projectsCompleted: number
  activeDepartments: number
  averageSalary?: number
  retentionRate?: number
}

export interface DepartmentStats {
  id: string
  departmentName: string
  memberCount: number
  averageExperience: number
  budget: number
  budgetUtilization: number
  performance: number
  openPositions: number
}
