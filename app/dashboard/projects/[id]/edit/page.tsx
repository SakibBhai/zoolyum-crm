"use client"

import { useEffect, useState } from "react"
import { EditProjectModule } from "@/components/projects/edit-project-module";

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    async function initializeParams() {
      const { id } = await params
      setProjectId(id)
    }
    initializeParams()
  }, [params])

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <EditProjectModule projectId={projectId} />;
}