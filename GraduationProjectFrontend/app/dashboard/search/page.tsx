"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, Loader2, Search, Users } from "lucide-react"
import { teamsApi } from "@/lib/api/teams"
import type { ApiDirectoryUser, ApiTeamSummary, Paginated } from "@/lib/api/types"
import { usersApi } from "@/lib/api/users"
import { formatRoleLabel, getAvatarInitial, getFullName } from "@/lib/team-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const PAGE_SIZE = 8
const PREVIEW_LIMIT = 4

type SearchCategory = "all" | "users" | "teams"

function isSearchCategory(value: string | null): value is SearchCategory {
  return value === "all" || value === "users" || value === "teams"
}

function buildSearchHref(query: string, type: SearchCategory, page = 1) {
  const params = new URLSearchParams()
  const trimmed = query.trim()

  if (trimmed) params.set("q", trimmed)
  if (trimmed && type !== "all") params.set("type", type)
  if (trimmed && type !== "all" && page > 1) params.set("page", String(page))

  const nextQuery = params.toString()
  return `/dashboard/search${nextQuery ? `?${nextQuery}` : ""}`
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryLabel = (searchParams.get("q") ?? "").trim()
  const typeParam = searchParams.get("type")
  const activeType: SearchCategory = isSearchCategory(typeParam) ? typeParam : "all"
  const pageValue = Number.parseInt(searchParams.get("page") ?? "1", 10)
  const currentPage = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1

  const [usersResult, setUsersResult] = useState<Paginated<ApiDirectoryUser> | null>(null)
  const [teamsResult, setTeamsResult] = useState<Paginated<ApiTeamSummary> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!queryLabel) {
      setUsersResult(null)
      setTeamsResult(null)
      setError("")
      setIsLoading(false)
      return
    }

    let cancelled = false

    const loadResults = async () => {
      setIsLoading(true)
      setError("")

      try {
        if (activeType === "users") {
          const users = await usersApi.directory({ search: queryLabel, limit: PAGE_SIZE, page: currentPage })
          if (cancelled) return
          setUsersResult(users)
          setTeamsResult(null)
          return
        }

        if (activeType === "teams") {
          const teams = await teamsApi.list({ search: queryLabel, limit: PAGE_SIZE, page: currentPage })
          if (cancelled) return
          setTeamsResult(teams)
          setUsersResult(null)
          return
        }

        const [users, teams] = await Promise.all([
          usersApi.directory({ search: queryLabel, limit: PREVIEW_LIMIT, page: 1 }),
          teamsApi.list({ search: queryLabel, limit: PREVIEW_LIMIT, page: 1 }),
        ])

        if (cancelled) return
        setUsersResult(users)
        setTeamsResult(teams)
      } catch (loadError: unknown) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : "Couldn't search right now.")
        setUsersResult(null)
        setTeamsResult(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadResults()

    return () => {
      cancelled = true
    }
  }, [activeType, currentPage, queryLabel])

  const userTotal = usersResult?.meta.total ?? 0
  const teamTotal = teamsResult?.meta.total ?? 0
  const totalResults = useMemo(() => userTotal + teamTotal, [teamTotal, userTotal])

  const handleCategoryChange = (value: string) => {
    const nextType = isSearchCategory(value) ? value : "all"
    router.replace(buildSearchHref(queryLabel, nextType, 1))
  }

  const handlePageChange = (page: number) => {
    router.replace(buildSearchHref(queryLabel, activeType, page))
  }

  if (!queryLabel) {
    return (
      <div className="mx-auto flex w-full max-w-5xl p-4 md:p-6 xl:p-8">
        <section className="w-full rounded-2xl border border-border/60 bg-background">
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Search results</h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
              Use the navbar search above to find users and teams.
            </p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-6 xl:p-8">
      <section className="rounded-2xl border border-border/60 bg-background">
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">Search results</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Showing matches for <span className="font-medium text-foreground">{queryLabel}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>Users {userTotal}</span>
              <span>Teams {teamTotal}</span>
              {activeType === "all" ? <span>Total {totalResults}</span> : null}
            </div>
          </div>

          <div className="border-t border-border/60 pt-4">
            <Tabs value={activeType} onValueChange={handleCategoryChange}>
              <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-xl bg-muted/30 p-1">
                <TabsTrigger value="all" className="rounded-xl px-4 py-2.5">
                  All
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-xl px-4 py-2.5">
                  Users
              </TabsTrigger>
                <TabsTrigger value="teams" className="rounded-xl px-4 py-2.5">
                  Teams
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] px-5 py-4 text-sm text-destructive">
          {error}
        </div>
      ) : isLoading ? (
        <SearchLoadingState category={activeType} />
      ) : activeType === "all" ? (
        <div className="space-y-5">
          <SearchResultsSection
            title="Users"
            description="Matched by name, academic ID, or email."
            count={userTotal}
            actionLabel={userTotal > (usersResult?.items.length ?? 0) ? "Open all users" : undefined}
            onAction={userTotal > (usersResult?.items.length ?? 0) ? () => handleCategoryChange("users") : undefined}
            emptyLabel="No user matches."
          >
            {usersResult?.items.length ? usersResult.items.map((user) => <SearchUserRow key={user.id} user={user} />) : null}
          </SearchResultsSection>

          <SearchResultsSection
            title="Teams"
            description="Matched by team name or team bio."
            count={teamTotal}
            actionLabel={teamTotal > (teamsResult?.items.length ?? 0) ? "Open all teams" : undefined}
            onAction={teamTotal > (teamsResult?.items.length ?? 0) ? () => handleCategoryChange("teams") : undefined}
            emptyLabel="No team matches."
          >
            {teamsResult?.items.length ? teamsResult.items.map((team) => <SearchTeamRow key={team.id} team={team} />) : null}
          </SearchResultsSection>

          {totalResults === 0 ? <SearchEmptyState query={queryLabel} /> : null}
        </div>
      ) : activeType === "users" ? (
        <SearchResultsSection
          title="User results"
          description="Matched by name, academic ID, or email."
          count={userTotal}
          emptyLabel={`No users matched "${queryLabel}".`}
        >
          {usersResult?.items.length ? usersResult.items.map((user) => <SearchUserRow key={user.id} user={user} />) : null}
          <SearchPagination meta={usersResult?.meta} onPageChange={handlePageChange} />
        </SearchResultsSection>
      ) : (
        <SearchResultsSection
          title="Team results"
          description="Matched by team name or team bio."
          count={teamTotal}
          emptyLabel={`No teams matched "${queryLabel}".`}
        >
          {teamsResult?.items.length ? teamsResult.items.map((team) => <SearchTeamRow key={team.id} team={team} />) : null}
          <SearchPagination meta={teamsResult?.meta} onPageChange={handlePageChange} />
        </SearchResultsSection>
      )}
    </div>
  )
}

function SearchResultsSection({
  title,
  description,
  count,
  children,
  actionLabel,
  onAction,
  emptyLabel,
}: {
  title: string
  description: string
  count: number
  children: ReactNode
  actionLabel?: string
  onAction?: () => void
  emptyLabel: string
}) {
  const hasChildren = count > 0 && Boolean(children)

  return (
    <section className="rounded-2xl border border-border/60 bg-background">
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{count} results</span>
            {actionLabel && onAction ? (
              <Button variant="ghost" className="h-auto rounded-lg px-2 py-1 text-sm" onClick={onAction}>
                {actionLabel}
              </Button>
            ) : null}
          </div>
        </div>

        {hasChildren ? <div className="space-y-3">{children}</div> : <p className="text-sm text-muted-foreground">{emptyLabel}</p>}
      </div>
    </section>
  )
}

function SearchUserRow({ user }: { user: ApiDirectoryUser }) {
  const userSummary = user.bio?.trim() || "No bio added yet."
  const teamLabel = user.currentTeam ? user.currentTeam.name : "Not in a team yet"

  return (
    <Link
      href={`/dashboard/users/${user.id}`}
      className="group block rounded-2xl border border-border/60 bg-background px-4 py-4 transition-colors hover:bg-muted/20"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar className="h-12 w-12 border border-border/60">
          <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
          <AvatarFallback>{getAvatarInitial(user)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold sm:text-lg">{getFullName(user)}</p>
            <Badge variant="secondary" className="rounded-full">
              {formatRoleLabel(user.role)}
            </Badge>
            {user.academicId ? (
              <Badge variant="outline" className="rounded-full">
                ID {user.academicId}
              </Badge>
            ) : null}
          </div>

          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{userSummary}</p>

          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="space-y-1">
              <p className="font-medium uppercase tracking-[0.14em] text-foreground/70">Email</p>
              <p className="break-words">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium uppercase tracking-[0.14em] text-foreground/70">Team</p>
              <p>{teamLabel}</p>
            </div>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

function SearchTeamRow({ team }: { team: ApiTeamSummary }) {
  const stackSummary = team.stack.length > 0 ? team.stack.slice(0, 3).join(", ") : "No stack listed yet"

  return (
    <Link
      href={`/dashboard/teams/${team.id}`}
      className="group block rounded-2xl border border-border/60 bg-background px-4 py-4 transition-colors hover:bg-muted/20"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-primary">
          <Users className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold sm:text-lg">{team.name}</p>
            <Badge variant="secondary" className="rounded-full">
              {team.memberCount}/{team.maxMembers} members
            </Badge>
          </div>

          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{team.bio}</p>

          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <div className="space-y-1">
              <p className="font-medium uppercase tracking-[0.14em] text-foreground/70">Team leader</p>
              <p>{getFullName(team.leader)}</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium uppercase tracking-[0.14em] text-foreground/70">Capacity</p>
              <p>
                {team.memberCount} of {team.maxMembers} members
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium uppercase tracking-[0.14em] text-foreground/70">Stack</p>
              <p>{stackSummary}</p>
            </div>
          </div>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

function SearchLoadingState({ category }: { category: SearchCategory }) {
  const cardCount = category === "all" ? 4 : 5

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/60 bg-background px-5 py-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading search results...
        </div>
      </div>

      {Array.from({ length: cardCount }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/60 bg-background p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-2/3 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchEmptyState({ query }: { query: string }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-background">
      <div className="p-8 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Search className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">
          No results for &quot;{query}&quot;
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Try another name, academic ID, or team name from the navbar search.
        </p>
      </div>
    </section>
  )
}

function SearchPagination({
  meta,
  onPageChange,
}: {
  meta: Paginated<ApiDirectoryUser>["meta"] | Paginated<ApiTeamSummary>["meta"] | undefined
  onPageChange: (page: number) => void
}) {
  if (!meta || meta.totalPages <= 1) return null

  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {meta.page} of {meta.totalPages}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="rounded-xl bg-transparent" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          Previous
        </Button>
        <Button variant="outline" className="rounded-xl bg-transparent" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
