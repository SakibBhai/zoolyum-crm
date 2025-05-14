"use client"

import type { ProjectStatusHistoryEntry } from "@/types/project"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle, CircleDashed, ArrowRight } from "lucide-react"
import { format, parseISO } from "date-fns"

interface ProjectStatusHistoryProps {
  history: ProjectStatusHistoryEntry[]
}

export function ProjectStatusHistory({ history }: ProjectStatusHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No status changes have been recorded yet.</p>
        </CardContent>
      </Card>
    )
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className="flex flex-col items-center gap-1">
                  {getStatusIcon(entry.oldStatus)}
                  <div className="w-0.5 h-4 bg-gray-200"></div>
                  {getStatusIcon(entry.newStatus)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{entry.oldStatus}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{entry.newStatus}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Changed by {entry.userName} on {format(parseISO(entry.date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
