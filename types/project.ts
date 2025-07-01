export type ProjectStatusHistoryEntry = {
  id: string
  date: string
  oldStatus: string
  newStatus: string
  userId: string
  userName: string
}

export type RecurrencePattern = {
  type: string
  interval?: number
  daysOfWeek?: string[]
  dayOfMonth?: number
  monthOfYear?: number
}

export type VersionHistoryEntry = {
  id: string
  projectId: string
  changedFields: string[]
  previousValues: Record<string, any>
  changedBy: string
  timestamp: string
  createdAt: string
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
  isRecurring?: boolean
  recurrencePattern?: RecurrencePattern
  recurrenceEnd?: string
  versionHistoryId?: string
  lastModified?: string
  priority?: number
}
