import { FallbackState } from "@/components/feedback/fallback-state"

export default function DashboardNotFound() {
  return (
    <FallbackState
      kind="not-found"
      mode="panel"
      eyebrow="Page Missing"
      title="We could not find that dashboard page"
      description="This address does not match an available page in your workspace."
      helperText="Go back to the previous page or return to the main dashboard."
      actions={[
        { label: "Go Back", kind: "back", variant: "outline" },
        { label: "Open Dashboard", kind: "link", href: "/dashboard" },
      ]}
    />
  )
}
