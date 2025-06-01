import type { TeamStats } from "@/types/team"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Award, TrendingUp } from "lucide-react"

interface TeamStatsProps {
  stats: TeamStats
}

export function TeamStatsComponent({ stats }: TeamStatsProps) {
  const statItems = [
    {
      title: "Team Members",
      value: stats.totalMembers,
      icon: Users,
      description: "Talented professionals",
    },
    {
      title: "Departments",
      value: stats.departments,
      icon: Building2,
      description: "Specialized teams",
    },
    {
      title: "Avg. Experience",
      value: `${stats.averageExperience} years`,
      icon: Award,
      description: "Industry expertise",
    },
    {
      title: "Projects Completed",
      value: `${stats.projectsCompleted}+`,
      icon: TrendingUp,
      description: "Successful deliveries",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
