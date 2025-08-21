import { EnhancedCalendar } from "@/components/ui/enhanced-calendar"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Content Calendar"
          description="Manage and schedule your content across all platforms"
        />
        <Link href="/dashboard/calendar/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </Link>
      </div>
      <EnhancedCalendar />
    </div>
  )
}
