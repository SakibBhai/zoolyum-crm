import { TeamMember, TeamStats, Department, DepartmentStats } from "@/types/team"

export const departments: Department[] = [
  {
    id: "dept-1",
    name: "Creative",
    description: "Responsible for brand strategy, creative direction, and visual design across all client projects.",
    head: "1", // Sarah Johnson
    budget: 250000,
    location: "New York, NY",
    createdAt: "2020-01-15",
    updatedAt: "2024-01-15",
    isActive: true,
    color: "#FF6B6B",
    goals: ["Increase brand engagement by 25%", "Launch 3 major rebranding projects", "Expand creative team by 2 members"],
    responsibilities: ["Brand Strategy", "Creative Direction", "Visual Design", "Campaign Development"]
  },
  {
    id: "dept-2",
    name: "Technology",
    description: "Develops and maintains digital solutions, web applications, and technical infrastructure.",
    head: "2", // Michael Chen
    budget: 400000,
    location: "San Francisco, CA",
    createdAt: "2019-06-01",
    updatedAt: "2024-01-15",
    isActive: true,
    color: "#4ECDC4",
    goals: ["Migrate to cloud infrastructure", "Implement AI-powered features", "Achieve 99.9% uptime"],
    responsibilities: ["Web Development", "Mobile Apps", "DevOps", "Technical Architecture"]
  },
  {
    id: "dept-3",
    name: "Client Services",
    description: "Manages client relationships, project delivery, and ensures customer satisfaction.",
    head: "3", // Emily Rodriguez
    budget: 180000,
    location: "Chicago, IL",
    createdAt: "2020-08-10",
    updatedAt: "2024-01-15",
    isActive: true,
    color: "#45B7D1",
    goals: ["Maintain 95%+ client retention", "Expand account values by 20%", "Implement new CRM system"],
    responsibilities: ["Account Management", "Project Coordination", "Client Communication", "Contract Negotiation"]
  },
  {
    id: "dept-4",
    name: "Analytics",
    description: "Provides data insights, performance analysis, and strategic recommendations.",
    head: "4", // David Kim
    budget: 150000,
    location: "Austin, TX",
    createdAt: "2020-09-01",
    updatedAt: "2024-01-15",
    isActive: true,
    color: "#96CEB4",
    goals: ["Implement predictive analytics", "Automate reporting processes", "Increase data accuracy to 99%"],
    responsibilities: ["Data Analysis", "Performance Tracking", "Business Intelligence", "Reporting"]
  },
  {
    id: "dept-5",
    name: "Content",
    description: "Creates compelling content strategies and manages content across all platforms.",
    head: "5", // Lisa Thompson
    budget: 120000,
    location: "Los Angeles, CA",
    createdAt: "2021-03-15",
    updatedAt: "2024-01-15",
    isActive: true,
    color: "#FECA57",
    goals: ["Increase content engagement by 40%", "Launch video content series", "Expand to 3 new platforms"],
    responsibilities: ["Content Strategy", "Copywriting", "Social Media", "SEO Optimization"]
  },
  {
    id: "dept-6",
    name: "Design",
    description: "Focuses on user experience design and interface development for digital products.",
    head: "6", // James Wilson
    budget: 200000,
    location: "Seattle, WA",
    createdAt: "2020-07-20",
    updatedAt: "2024-01-15",
    isActive: true,
    color: "#A8E6CF",
    goals: ["Improve user satisfaction scores by 30%", "Standardize design system", "Reduce design-to-development time"],
    responsibilities: ["UX Design", "UI Design", "User Research", "Prototyping"]
  }
]

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Creative Director",
    department: "Creative",
    departmentId: "dept-1",
    email: "sarah.johnson@agency.com",
    phone: "+1 (555) 123-4567",
    bio: "Sarah leads our creative team with over 8 years of experience in digital marketing and brand strategy. She specializes in creating compelling visual narratives that drive engagement.",
    skills: ["Brand Strategy", "Creative Direction", "Team Leadership", "Adobe Creative Suite"],
    avatar: "/placeholder.svg?height=200&width=200",
    linkedin: "https://linkedin.com/in/sarahjohnson",
    twitter: "https://twitter.com/sarahjohnson",
    joinDate: "2020-03-15",
    location: "New York, NY",
    salary: 95000,
    employeeId: "EMP-001",
    performanceRating: 4.8,
    lastReviewDate: "2023-12-15",
    emergencyContact: {
      name: "John Johnson",
      relationship: "Spouse",
      phone: "+1 (555) 123-4568",
      email: "john.johnson@email.com"
    },
    isActive: true,
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Senior Developer",
    department: "Technology",
    departmentId: "dept-2",
    email: "michael.chen@agency.com",
    phone: "+1 (555) 234-5678",
    bio: "Michael is our lead full-stack developer with expertise in modern web technologies. He ensures our digital solutions are scalable, secure, and user-friendly.",
    skills: ["React", "Node.js", "TypeScript", "AWS", "Database Design"],
    avatar: "/placeholder.svg?height=200&width=200",
    linkedin: "https://linkedin.com/in/michaelchen",
    twitter: "https://twitter.com/michaelchen",
    joinDate: "2019-08-22",
    location: "San Francisco, CA",
    salary: 110000,
    employeeId: "EMP-002",
    performanceRating: 4.9,
    lastReviewDate: "2023-11-20",
    emergencyContact: {
      name: "Lisa Chen",
      relationship: "Sister",
      phone: "+1 (555) 234-5679"
    },
    isActive: true,
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Account Manager",
    department: "Client Services",
    departmentId: "dept-3",
    email: "emily.rodriguez@agency.com",
    phone: "+1 (555) 345-6789",
    bio: "Emily manages our key client relationships and ensures project delivery exceeds expectations. Her strategic approach has helped retain 95% of our clients.",
    skills: ["Client Relations", "Project Management", "Strategic Planning", "Communication"],
    avatar: "/placeholder.svg?height=200&width=200",
    linkedin: "https://linkedin.com/in/emilyrodriguez",
    joinDate: "2021-01-10",
    location: "Chicago, IL",
    salary: 75000,
    employeeId: "EMP-003",
    performanceRating: 4.7,
    lastReviewDate: "2023-12-01",
    emergencyContact: {
      name: "Carlos Rodriguez",
      relationship: "Father",
      phone: "+1 (555) 345-6790",
      email: "carlos.rodriguez@email.com"
    },
    isActive: true,
  },
  {
    id: "4",
    name: "David Kim",
    role: "Data Analyst",
    department: "Analytics",
    departmentId: "dept-4",
    email: "david.kim@agency.com",
    phone: "+1 (555) 456-7890",
    bio: "David transforms complex data into actionable insights that drive our marketing strategies. His analytical expertise helps optimize campaign performance.",
    skills: ["Data Analysis", "Google Analytics", "SQL", "Python", "Visualization"],
    avatar: "/placeholder.svg?height=200&width=200",
    linkedin: "https://linkedin.com/in/davidkim",
    joinDate: "2020-11-05",
    location: "Austin, TX",
    salary: 85000,
    employeeId: "EMP-004",
    performanceRating: 4.6,
    lastReviewDate: "2023-10-15",
    emergencyContact: {
      name: "Susan Kim",
      relationship: "Mother",
      phone: "+1 (555) 456-7891"
    },
    isActive: true,
  },
  {
    id: "5",
    name: "Lisa Thompson",
    role: "Content Strategist",
    department: "Content",
    departmentId: "dept-5",
    email: "lisa.thompson@agency.com",
    phone: "+1 (555) 567-8901",
    bio: "Lisa crafts compelling content strategies that resonate with target audiences. Her expertise spans across multiple industries and content formats.",
    skills: ["Content Strategy", "SEO", "Copywriting", "Social Media", "Brand Voice"],
    avatar: "/placeholder.svg?height=200&width=200",
    linkedin: "https://linkedin.com/in/lisathompson",
    twitter: "https://twitter.com/lisathompson",
    joinDate: "2021-06-18",
    location: "Los Angeles, CA",
    salary: 70000,
    employeeId: "EMP-005",
    performanceRating: 4.5,
    lastReviewDate: "2023-11-30",
    emergencyContact: {
      name: "Mark Thompson",
      relationship: "Spouse",
      phone: "+1 (555) 567-8902",
      email: "mark.thompson@email.com"
    },
    isActive: true,
  },
  {
    id: "6",
    name: "James Wilson",
    role: "UX Designer",
    department: "Design",
    departmentId: "dept-6",
    email: "james.wilson@agency.com",
    phone: "+1 (555) 678-9012",
    bio: "James creates intuitive user experiences that delight customers and drive conversions. His user-centered design approach has improved client satisfaction by 40%.",
    skills: ["UX Design", "User Research", "Prototyping", "Figma", "Usability Testing"],
    avatar: "/placeholder.svg?height=200&width=200",
    linkedin: "https://linkedin.com/in/jameswilson",
    joinDate: "2020-09-12",
    location: "Seattle, WA",
    salary: 80000,
    employeeId: "EMP-006",
    performanceRating: 4.4,
    lastReviewDate: "2023-09-20",
    emergencyContact: {
      name: "Sarah Wilson",
      relationship: "Sister",
      phone: "+1 (555) 678-9013"
    },
    isActive: true,
  },
]

export const departmentStats: DepartmentStats[] = [
  {
    id: "dept-1",
    departmentName: "Creative",
    memberCount: 1,
    averageExperience: 8.0,
    budget: 250000,
    budgetUtilization: 85,
    performance: 4.8,
    openPositions: 2
  },
  {
    id: "dept-2",
    departmentName: "Technology",
    memberCount: 1,
    averageExperience: 6.5,
    budget: 400000,
    budgetUtilization: 92,
    performance: 4.9,
    openPositions: 3
  },
  {
    id: "dept-3",
    departmentName: "Client Services",
    memberCount: 1,
    averageExperience: 3.2,
    budget: 180000,
    budgetUtilization: 78,
    performance: 4.7,
    openPositions: 1
  },
  {
    id: "dept-4",
    departmentName: "Analytics",
    memberCount: 1,
    averageExperience: 4.5,
    budget: 150000,
    budgetUtilization: 88,
    performance: 4.6,
    openPositions: 1
  },
  {
    id: "dept-5",
    departmentName: "Content",
    memberCount: 1,
    averageExperience: 2.8,
    budget: 120000,
    budgetUtilization: 75,
    performance: 4.5,
    openPositions: 2
  },
  {
    id: "dept-6",
    departmentName: "Design",
    memberCount: 1,
    averageExperience: 4.0,
    budget: 200000,
    budgetUtilization: 82,
    performance: 4.4,
    openPositions: 1
  }
]

export const teamStats: TeamStats = {
  totalMembers: teamMembers.length,
  departments: departments.length,
  averageExperience: 4.2,
  projectsCompleted: 150,
  activeDepartments: departments.filter(dept => dept.isActive).length,
  averageSalary: Math.round(teamMembers.reduce((sum, member) => sum + (member.salary || 0), 0) / teamMembers.length),
  retentionRate: 94.5
}
