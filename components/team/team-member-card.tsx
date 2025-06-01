import type { TeamMember } from "@/types/team"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Linkedin, Twitter, MapPin, Calendar } from "lucide-react"
import Image from "next/image"

interface TeamMemberCardProps {
  member: TeamMember
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-background shadow-lg group-hover:scale-105 transition-transform duration-300">
            <Image
              src={member.avatar || "/placeholder.svg"}
              alt={`${member.name} profile picture`}
              fill
              className="object-cover"
            />
          </div>

          {/* Basic Info */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">{member.name}</h3>
            <p className="text-lg text-primary font-medium">{member.role}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{member.department}</Badge>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {member.location}
              </span>
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{member.bio}</p>

          {/* Skills */}
          <div className="flex flex-wrap gap-1 justify-center">
            {member.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {member.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{member.skills.length - 3} more
              </Badge>
            )}
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Joined{" "}
                {new Date(member.joinDate).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`}>
                  <Mail className="h-4 w-4" />
                </a>
              </Button>

              {member.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${member.phone}`} aria-label={`Call ${member.name}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              )}

              {member.linkedin && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s LinkedIn profile`}
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}

              {member.twitter && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={member.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name}'s Twitter profile`}
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
