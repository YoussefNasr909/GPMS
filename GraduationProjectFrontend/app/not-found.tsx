import { FallbackState } from "@/components/feedback/fallback-state"

export default function NotFound() {
  return (
    <FallbackState
      kind="not-found"
      eyebrow="404"
      title="This page does not exist"
      description="The link may be wrong, the page may have moved, or it may no longer be available."
      helperText="You can return to the homepage or open the dashboard to keep working."
      actions={[
        { label: "Go Home", kind: "link", href: "/" },
        { label: "Open Dashboard", kind: "link", href: "/dashboard", variant: "outline" },
      ]}
    />
  )
}
