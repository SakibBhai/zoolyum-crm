import { ContentCalendarView } from "@/components/content-calendar-view"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader heading="Content Calendar" subheading="Manage your social media content calendar." />
        <Link href="/dashboard/calendar/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </Link>
      </div>
      <ContentCalendarView />
    </div>
  )
}
