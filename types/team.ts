export interface TeamMember {
  id: string
  name: string
  role: string
  department: string
  email: string
  phone?: string
  bio: string
  skills: string[]
  avatar: string
  linkedin?: string
  twitter?: string
  joinDate: string
  location: string
}

export interface TeamStats {
  totalMembers: number
  departments: number
  averageExperience: number
  projectsCompleted: number
}
