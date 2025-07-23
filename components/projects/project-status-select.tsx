"use client"

import { useState } from "react"
import { CheckCircle, Clock, AlertCircle, CircleDashed } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProjectContext } from "@/contexts/project-context"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

interface ProjectStatusSelectProps {
  projectId: string
  currentStatus: Project['status']
  onStatusChange?: (newStatus: Project['status']) => void
  className?: string
  size?: "default" | "sm"
}

export function ProjectStatusSelect({
  projectId,
  currentStatus,
  onStatusChange,
  className,
  size = "default",
}: ProjectStatusSelectProps) {
  const { updateProjectStatus } = useProjectContext()
  const [status, setStatus] = useState(currentStatus)

  // Mock current user - in a real app, this would come from authentication
  const currentUser = {
    id: "user1",
    name: "Sarah Johnson",
  }

  const handleStatusChange = (newStatus: Project['status']) => {
    setStatus(newStatus)
    updateProjectStatus(projectId, newStatus, currentUser.id, currentUser.name)
    if (onStatusChange) {
      onStatusChange(newStatus)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "On Hold":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <CircleDashed className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-500 border-green-200"
      case "In Progress":
        return "text-blue-500 border-blue-200"
      case "On Hold":
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
        <SelectItem value="Not Started">
          <div className="flex items-center gap-2">
            <CircleDashed className="h-4 w-4 text-gray-400" />
            <span>Not Started</span>
          </div>
        </SelectItem>
        <SelectItem value="In Progress">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>In Progress</span>
          </div>
        </SelectItem>
        <SelectItem value="On Hold">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span>On Hold</span>
          </div>
        </SelectItem>
        <SelectItem value="Completed">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Completed</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
