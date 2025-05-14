import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, Mail, Phone, Calendar, FileText } from "lucide-react"

// Mock data - in a real app, you would fetch this from your API
const client = {
  id: "1",
  name: "ABC Apparel",
  industry: "Fashion",
  contact: "John Smith",
  email: "john@abcapparel.com",
  phone: "(555) 123-4567",
  status: "Active",
  contractStart: "January 15, 2023",
  contractEnd: "January 15, 2024",
  notes:
    "ABC Apparel is a premium clothing brand focusing on sustainable fashion. They are looking to expand their online presence and increase engagement on social media platforms.",
}

export function ClientDetails({ id }: { id: string }) {
  // In a real app, you would fetch the client data based on the ID

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Basic details about the client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Company Name</p>
              <p>{client.name}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Industry</p>
            <p>{client.industry}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Status</p>
            <Badge variant={client.status === "Active" ? "default" : "secondary"}>{client.status}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How to reach the client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Point of Contact</p>
            <p>{client.contact}</p>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p>{client.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p>{client.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
          <CardDescription>Details about the client contract.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Contract Start Date</p>
                <p>{client.contractStart}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Contract End Date</p>
                <p>{client.contractEnd}</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-sm font-medium">Notes</p>
              <p className="text-sm text-muted-foreground">{client.notes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
