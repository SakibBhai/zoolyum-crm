import type { TeamMember } from "@/types/team"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Mail, Phone, Linkedin, Twitter, MapPin, Calendar, MoreVertical, Edit, Trash2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { EditTeamMemberDialog } from "./edit-team-member-dialog"

interface TeamMemberCardProps {
  member: TeamMember
  onUpdate?: (id: string, updates: Partial<TeamMember>) => void
  onDelete?: (id: string) => void
}

export function TeamMemberCard({ member, onUpdate, onDelete }: TeamMemberCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleEdit = () => {
    setShowEditDialog(true)
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    onDelete?.(member.id)
    setShowDeleteDialog(false)
  }

  const handleUpdate = (updates: Partial<TeamMember>) => {
    onUpdate?.(member.id, updates)
    setShowEditDialog(false)
  }
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-6">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <Image
              src={member.avatar || "/placeholder.svg"}
              alt={`${member.name} profile picture`}
              width={64}
              height={64}
              className="rounded-full object-cover ring-2 ring-background shadow-sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg leading-tight">{member.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">{member.role}</p>
                <Badge variant="secondary" className="text-xs">
                  {member.department}
                </Badge>
              </div>
              {(onUpdate || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onUpdate && (
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onUpdate && onDelete && <DropdownMenuSeparator />}
                    {onDelete && (
                      <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">{member.bio}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-4">
          {member.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {member.skills.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{member.skills.length - 4} more
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{member.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              Joined{" "}
              {new Date(member.joinDate).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-2 mt-4">
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
        
        {/* Edit Dialog */}
        {showEditDialog && (
          <EditTeamMemberDialog
            member={member}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSave={handleUpdate}
          />
        )}
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {member.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
