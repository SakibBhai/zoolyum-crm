import { PageHeader } from "@/components/page-header"
import { SettingsForm } from "@/components/settings/settings-form"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        heading="Settings"
        subheading="Manage your company profile, preferences, and security settings."
      />
      <SettingsForm />
    </div>
  )
}