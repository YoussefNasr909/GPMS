"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length <= 1) return null

  const customDashboardBreadcrumbs =
    segments[0] === "dashboard" && segments[1] === "users" && segments[2]
      ? [{ href: `/dashboard/users/${segments[2]}`, label: "Profile" }]
      : null

  const segmentLabels: Record<string, string> = {
    chat: "Direct Messages",
    "my-team": "My Team",
    "peer-reviews": "Peer Reviews",
    "risk-management": "Risk Management",
    "time-tracker": "Time Tracker",
    "weekly-progress": "Weekly Progress",
    "version-control": "Version Control",
    github: "GitHub",
    sdlc: "SDLC Phases",
    faq: "FAQs",
  }

  const breadcrumbs =
    customDashboardBreadcrumbs ??
    segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const label = segmentLabels[segment] ?? (segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "))
    return { href, label }
    })

  return (
    <nav className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 text-xs text-muted-foreground scrollbar-hide scroll-smooth-touch sm:gap-2 sm:text-sm mb-4 sm:mb-5 md:mb-6">
      <Link
        href="/dashboard"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      >
        <Home className="h-4 w-4" />
      </Link>
      {(customDashboardBreadcrumbs ?? breadcrumbs.slice(1)).map((crumb, index) => (
        <Fragment key={crumb.href}>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground/50" />
          {index === (customDashboardBreadcrumbs ?? breadcrumbs.slice(1)).length - 1 ? (
            <span className="inline-flex min-h-8 items-center font-medium leading-none text-foreground truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] md:max-w-none">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="inline-flex min-h-8 items-center rounded-md px-2 leading-none transition-colors hover:bg-muted/50 hover:text-foreground truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[150px] md:max-w-none"
            >
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
