import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardCards } from "@/components/dashboard-cards"
import { RecentActivity } from "@/components/recent-activity"
import { UpcomingTasks } from "@/components/upcoming-tasks"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <DashboardCards />
      <div className="grid gap-6 md:grid-cols-2">
        <UpcomingTasks />
        <RecentActivity />
      </div>
    </div>
  )
}
