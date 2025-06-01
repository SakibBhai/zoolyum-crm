import { PageHeader } from "@/components/page-header"
import { TeamMemberCard } from "@/components/team/team-member-card"
import { TeamStatsComponent } from "@/components/team/team-stats"
import { teamMembers, teamStats } from "@/data/team"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Our Team" description="Meet the talented professionals who make our agency successful" />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Building Success Together</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          Our diverse team of experts brings together creativity, technology, and strategy to deliver exceptional
          results for our clients. Each member contributes unique skills and perspectives that drive innovation and
          excellence.
        </p>
        <div className="flex justify-center gap-4">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Join Our Team
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter Team
          </Button>
        </div>
      </div>

      {/* Team Statistics */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Team Overview</h3>
        <TeamStatsComponent stats={teamStats} />
      </div>

      {/* Team Members Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Team Members</h3>
          <p className="text-sm text-muted-foreground">{teamMembers.length} team members</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-muted rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">Want to Join Our Team?</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          We're always looking for talented individuals who share our passion for excellence and innovation.
        </p>
        <Button size="lg">View Open Positions</Button>
      </div>
    </div>
  )
}
