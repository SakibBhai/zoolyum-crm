export type ProjectStatusHistoryEntry = {
  id: string
  date: string
  oldStatus: string
  newStatus: string
  userId: string
  userName: string
}

export type Project = {
  id: string
  name: string
  client: string
  clientId: string
  type: string
  startDate: string
  deadline: string
  manager: string
  managerId: string
  status: string
  progress: number
  description?: string
  tasksTotal?: number
  tasksCompleted?: number
  statusHistory?: ProjectStatusHistoryEntry[]
  budget?: number
  actualCost?: number
}
