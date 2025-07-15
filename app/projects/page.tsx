'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard projects page to ensure sidebar is visible
    router.replace('/dashboard/projects')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Redirecting to Projects...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you to the projects dashboard.</p>
      </div>
    </div>
  )
}