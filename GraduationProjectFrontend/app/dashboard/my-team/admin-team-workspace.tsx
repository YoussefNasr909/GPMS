"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Globe2,
  Layers3,
  Loader2,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { teamsApi } from "@/lib/api/teams"
import { usersApi } from "@/lib/api/users"
import type { ApiTeamSummary, UsersSummary } from "@/lib/api/types"
import { formatTeamStage, formatTeamVisibility, getAvatarInitial, getFullName } from "@/lib/team-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const TEAM_PREVIEW_LIMIT = 8

export default function AdminTeamWorkspace() {
  const reduceMotion = Boolean(useReducedMotion())
  const [teams, setTeams] = useState<ApiTeamSummary[]>([])
  const [totalTeams, setTotalTeams] = useState(0)
  const [usersSummary, setUsersSummary] = useState<UsersSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    const loadWorkspace = async () => {
      setIsLoading(true)
      setError("")

      try {
        const [teamsResult, usersResult] = await Promise.all([
          teamsApi.list({ page: 1, limit: TEAM_PREVIEW_LIMIT }),
          usersApi.summary(),
        ])

        if (cancelled) return

        setTeams(teamsResult.items)
        setTotalTeams(teamsResult.meta.total)
        setUsersSummary(usersResult)
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Couldn't load the admin team workspace right now.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadWorkspace()

    return () => {
      cancelled = true
    }
  }, [])

  const supervisorCount = (usersSummary?.byRole.doctors ?? 0) + (usersSummary?.byRole.tas ?? 0)
  const openTeams = teams.filter((team) => !team.isFull).length
  const privateTeams = teams.filter((team) => team.visibility === "PRIVATE").length
  const implementationTeams = teams.filter((team) => team.stage === "IMPLEMENTATION").length

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 xl:p-8">
      <motion.section
        {...getRevealMotion(reduceMotion)}
        className="overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(135deg,oklch(var(--primary)/0.08),transparent_34%),linear-gradient(180deg,oklch(var(--background)),oklch(var(--background)))] shadow-sm"
      >
        <div className="grid gap-8 px-5 py-6 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:px-8 lg:py-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/20 bg-background/80 text-primary">
                Admin Workspace
              </Badge>
              <Badge variant="secondary">Team Oversight</Badge>
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl xl:text-[2.7rem] xl:leading-[1.06]">
                Oversee the team system without getting buried in team-only controls.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Use this page as a clean command center for team visibility, user distribution, and quick admin decisions. Jump straight into the tools that need attention instead of landing in a member workflow that does not fit your role.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="h-12 rounded-2xl px-6 text-base shadow-lg shadow-primary/15" asChild>
                <Link href="/dashboard/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Open Admin Console
                </Link>
              </Button>
              <Button variant="outline" className="h-12 rounded-2xl bg-background/75 px-6 text-base" asChild>
                <Link href="/dashboard/teams">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Teams
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AdminMetricCard reduceMotion={reduceMotion} delay={0.04} label="Total Teams" value={formatMetricValue(isLoading, totalTeams)} helper="Live team directory size" />
              <AdminMetricCard reduceMotion={reduceMotion} delay={0.08} label="Students" value={formatMetricValue(isLoading, usersSummary?.byRole.students ?? null)} helper="Student member accounts" />
              <AdminMetricCard reduceMotion={reduceMotion} delay={0.12} label="Leaders" value={formatMetricValue(isLoading, usersSummary?.byRole.leaders ?? null)} helper="Team leader accounts" />
              <AdminMetricCard reduceMotion={reduceMotion} delay={0.16} label="Supervisors" value={formatMetricValue(isLoading, supervisorCount)} helper="Doctors and TAs combined" />
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-border/60 bg-background/88 p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin Flow</p>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">Use My Team as oversight</h2>
            </div>

            <div className="space-y-3">
              <ChecklistLine
                icon={<Layers3 className="h-4 w-4" />}
                title="See the whole system"
                description="Scan team activity and staffing without entering a student-only path."
              />
              <ChecklistLine
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Resolve blockers faster"
                description="Jump to user management, reports, or logs when teams need intervention."
              />
              <ChecklistLine
                icon={<Sparkles className="h-4 w-4" />}
                title="Keep the page lightweight"
                description="Show only the signals and actions an administrator actually needs here."
              />
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <Card className="border-destructive/25 bg-destructive/[0.04] shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_360px]">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="flex flex-col gap-2 border-b border-border/60 bg-background/70 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl tracking-tight">Recent Team Snapshot</CardTitle>
              <CardDescription>The latest teams loaded into this workspace for quick review and follow-up.</CardDescription>
            </div>
            <Badge variant="outline">{isLoading ? "Loading..." : `${teams.length} shown`}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 p-5 sm:p-6">
            {isLoading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-border/60 bg-muted/15 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading teams and admin signals...
              </div>
            ) : teams.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border/60 bg-muted/10 px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">No teams yet</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  When teams start forming, this page will surface them here so admins can monitor structure, visibility, and leadership.
                </p>
                <Button className="mt-5 rounded-2xl" asChild>
                  <Link href="/dashboard/teams">Open Team Browser</Link>
                </Button>
              </div>
            ) : (
              teams.map((team, index) => (
                <motion.div
                  key={team.id}
                  {...getRevealMotion(reduceMotion, 0.04 + index * 0.03)}
                  {...getCardHoverMotion(reduceMotion)}
                  className="rounded-[24px] border border-border/60 bg-background p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-tight">{team.name}</h3>
                        <Badge variant="outline">{formatTeamStage(team.stage)}</Badge>
                        <Badge variant="secondary">{formatTeamVisibility(team.visibility)}</Badge>
                      </div>
                      <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{team.bio}</p>
                      <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/15 px-3 py-3">
                        <Avatar className="h-10 w-10 border border-border/60">
                          <AvatarImage src={team.leader.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback>{getAvatarInitial(team.leader)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{getFullName(team.leader)}</p>
                          <p className="text-xs text-muted-foreground">Team leader</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[180px] lg:items-end">
                      <Badge variant={team.isFull ? "secondary" : "outline"} className="rounded-full px-3 py-1">
                        {team.memberCount}/{team.maxMembers} members
                      </Badge>
                      <Button variant="outline" className="w-full rounded-xl lg:w-auto" asChild>
                        <Link href={`/dashboard/teams/${team.id}`}>
                          Review Team
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Admin Shortcuts</CardTitle>
              <CardDescription>Open the most common admin destinations without hunting through the sidebar.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <QuickActionCard href="/dashboard/admin" icon={<ShieldCheck className="h-4 w-4" />} title="User management" description="Create, edit, suspend, or delete accounts from the real admin workspace." />
              <QuickActionCard href="/dashboard/admin/logs" icon={<Layers3 className="h-4 w-4" />} title="System logs" description="Review activity history when a team or account issue needs context." />
              <QuickActionCard href="/dashboard/reports" icon={<Sparkles className="h-4 w-4" />} title="Reports" description="Open reporting tools to review trends, exports, and platform performance." />
              <QuickActionCard href="/dashboard/teams" icon={<Search className="h-4 w-4" />} title="Team browser" description="Inspect the public team directory the same way students experience it." />
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">Admin Signals</CardTitle>
              <CardDescription>Keep the most important operational signals visible in one glance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <SignalTile icon={<Globe2 className="h-4 w-4" />} label="Active Users" value={formatMetricValue(isLoading, usersSummary?.byStatus.active ?? null)} helper="Accounts currently allowed to sign in" />
                <SignalTile icon={<LockKeyhole className="h-4 w-4" />} label="Restricted Users" value={formatMetricValue(isLoading, (usersSummary?.byStatus.inactive ?? 0) + (usersSummary?.byStatus.suspended ?? 0))} helper="Inactive and suspended accounts combined" />
                <SignalTile icon={<Users className="h-4 w-4" />} label="Open Teams" value={isLoading ? "..." : String(openTeams)} helper="Teams with room in this snapshot" />
                <SignalTile icon={<Layers3 className="h-4 w-4" />} label="Implementation" value={isLoading ? "..." : String(implementationTeams)} helper="Teams currently in implementation" />
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/15 p-4 text-sm leading-6 text-muted-foreground">
                <span className="font-medium text-foreground">Snapshot note:</span> This sidebar reflects the {teams.length} most recent teams loaded on this page, with {privateTeams} private team{privateTeams === 1 ? "" : "s"} visible in the current snapshot.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AdminMetricCard({
  reduceMotion,
  delay,
  label,
  value,
  helper,
}: {
  reduceMotion: boolean
  delay: number
  label: string
  value: string
  helper: string
}) {
  return (
    <motion.div
      {...getRevealMotion(reduceMotion, delay)}
      {...getCardHoverMotion(reduceMotion)}
      className="rounded-[24px] border border-border/60 bg-background/88 p-4 shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{helper}</p>
    </motion.div>
  )
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <Button variant="outline" className="h-auto justify-start rounded-[22px] border-border/60 bg-background px-4 py-4 text-left" asChild>
      <Link href={href} className="flex w-full items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </Link>
    </Button>
  )
}

function SignalTile({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-[22px] border border-border/60 bg-background p-4 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  )
}

function ChecklistLine({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/15 p-3">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function formatMetricValue(isLoading: boolean, value: number | null) {
  if (isLoading) return "..."
  if (value === null) return "--"
  return String(value)
}

function getRevealMotion(reduceMotion: boolean, delay = 0) {
  if (reduceMotion) return {}

  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.36, delay, ease: [0.22, 1, 0.36, 1] as const },
  }
}

function getCardHoverMotion(reduceMotion: boolean) {
  if (reduceMotion) return {}

  return {
    whileHover: {
      y: -4,
      transition: {
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  }
}


