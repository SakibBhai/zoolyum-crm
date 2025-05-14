import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function UpcomingTasks() {
  const tasks = [
    {
      id: 1,
      name: "Design Instagram Carousel for ABC Apparel",
      dueDate: "Today",
      priority: "High",
      status: "In Progress",
    },
    {
      id: 2,
      name: "Write Blog Post for XYZ Corp",
      dueDate: "Tomorrow",
      priority: "Medium",
      status: "To Do",
    },
    {
      id: 3,
      name: "Schedule Social Media Posts for 123 Industries",
      dueDate: "May 15",
      priority: "Medium",
      status: "To Do",
    },
    {
      id: 4,
      name: "Client Meeting with ABC Apparel",
      dueDate: "May 16",
      priority: "High",
      status: "To Do",
    },
    {
      id: 5,
      name: "Finalize Website Design for XYZ Corp",
      dueDate: "May 18",
      priority: "Urgent",
      status: "To Do",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-blue-100 text-blue-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
        <CardDescription>Your tasks due soon.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{task.name}</p>
                </div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Due: {task.dueDate}</span>
                  <span>•</span>
                  <span>{task.status}</span>
                </div>
              </div>
              <Badge className={cn("ml-2", getPriorityColor(task.priority))}>{task.priority}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
