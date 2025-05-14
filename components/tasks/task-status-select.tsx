"use client"

import { useState } from "react"
import { CheckCircle, Clock, AlertCircle, CircleDashed } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTaskContext } from "@/contexts/task-context"
import { cn } from "@/lib/utils"

interface TaskStatusSelectProps {
  taskId: string
  currentStatus: string
  onStatusChange?: (newStatus: string) => void
  className?: string
  size?: "default" | "sm"
}

export function TaskStatusSelect({
  taskId,
  currentStatus,
  onStatusChange,
  className,
  size = "default",
}: TaskStatusSelectProps) {
  const { updateTaskStatus } = useTaskContext()
  const [status, setStatus] = useState(currentStatus)

  // Mock current user - in a real app, this would come from authentication
  const currentUser = {
    id: "user1",
    name: "Sarah Johnson",
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    updateTaskStatus(taskId, newStatus, currentUser.id, currentUser.name)
    if (onStatusChange) {
      onStatusChange(newStatus)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "Review":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <CircleDashed className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "text-green-500 border-green-200"
      case "In Progress":
        return "text-blue-500 border-blue-200"
      case "Review":
        return "text-yellow-500 border-yellow-200"
      default:
        return "text-gray-500 border-gray-200"
    }
  }

  return (
    <Select value={status} onValueChange={handleStatusChange}>
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 font-medium",
          getStatusColor(status),
          size === "sm" ? "h-8 text-xs" : "h-10",
          className,
        )}
      >
        <SelectValue placeholder="Select status">
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <span>{status}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="To Do">
          <div className="flex items-center gap-2">
            <CircleDashed className="h-4 w-4 text-gray-400" />
            <span>To Do</span>
          </div>
        </SelectItem>
        <SelectItem value="In Progress">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>In Progress</span>
          </div>
        </SelectItem>
        <SelectItem value="Review">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span>Review</span>
          </div>
        </SelectItem>
        <SelectItem value="Done">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Done</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
