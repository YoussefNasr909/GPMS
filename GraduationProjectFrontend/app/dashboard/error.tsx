"use client"

import { useEffect } from "react"
import { FallbackState } from "@/components/feedback/fallback-state"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <FallbackState
      kind="error"
      mode="panel"
      eyebrow="Workspace Error"
      title="This page could not load"
      description="Something unexpected happened while opening this dashboard page."
      helperText="Try loading the page again or go back to the dashboard."
      onRetry={reset}
      actions={[
        { label: "Try Again", kind: "retry" },
        { label: "Open Dashboard", kind: "link", href: "/dashboard", variant: "outline" },
      ]}
    />
  )
}
