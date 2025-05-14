import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, CheckSquare, CreditCard, FolderKanban } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader heading="Reports" subheading="Generate and view reports for tasks, projects, and invoices." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-orange-500" />
              Task Reports
            </CardTitle>
            <CardDescription>Generate reports based on task data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analyze task completion rates, priorities, assignments, and more.
            </p>
            <Button asChild>
              <Link href="/dashboard/reports/tasks">View Task Reports</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderKanban className="h-5 w-5 mr-2 text-pink-700" />
              Project Reports
            </CardTitle>
            <CardDescription>Generate reports based on project data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analyze project progress, budgets, timelines, and resource allocation.
            </p>
            <Button asChild>
              <Link href="/dashboard/reports/projects">View Project Reports</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-amber-500" />
              Invoice Reports
            </CardTitle>
            <CardDescription>Generate reports based on invoice data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analyze revenue, payment status, client billing, and financial metrics.
            </p>
            <Button asChild>
              <Link href="/dashboard/reports/invoices">View Invoice Reports</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
              Performance Dashboard
            </CardTitle>
            <CardDescription>View overall performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get a comprehensive overview of key performance indicators across all areas.
            </p>
            <Button asChild>
              <Link href="/dashboard/reports/performance">View Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
