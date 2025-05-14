export type StatusHistoryEntry = {
  id: string
  date: string
  oldStatus: string
  newStatus: string
  userId: string
  userName: string
}

export type TaskDependency = {
  id: string
  taskId: string
  dependsOnTaskId: string
  type: "blocks" | "required_by" | "related_to"
}

export type Task = {
  id: string
  name: string
  project: string
  projectId: string
  assignedTo: string
  category: string
  dueDate: string
  priority: string
  status: string
  brief?: string
  details?: string
  statusHistory?: StatusHistoryEntry[]
  dependencies?: TaskDependency[]
}
