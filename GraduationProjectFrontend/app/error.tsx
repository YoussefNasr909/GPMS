"use client"

import { useEffect } from "react"
import { FallbackState } from "@/components/feedback/fallback-state"

export default function GlobalError({
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
      eyebrow="Unexpected Error"
      title="Something went wrong"
      description="The page hit an unexpected problem while loading."
      helperText="Try again first. If the issue continues, return to a safe page and open the feature again."
      onRetry={reset}
      actions={[
        { label: "Try Again", kind: "retry" },
        { label: "Go Home", kind: "link", href: "/", variant: "outline" },
      ]}
    />
  )
}
