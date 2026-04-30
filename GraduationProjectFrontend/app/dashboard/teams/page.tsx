"use client"

import type { ReactNode } from "react"
import { useDeferredValue, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Crown,
  ExternalLink,
  Hash,
  Loader2,
  Search,
  Send,
  ShieldCheck,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { teamsApi } from "@/lib/api/teams"
import type { ApiTeamSummary } from "@/lib/api/types"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useMyTeamState } from "@/lib/hooks/use-my-team-state"
import { formatTeamVisibility, getAvatarInitial, getFullName } from "@/lib/team-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TeamJoinRequestDialog } from "@/components/dashboard/team-join-request-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"



function getRevealMotion(reduceMotion: boolean, delay = 0) {
  if (reduceMotion) return {}

  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.36, delay, ease: [0.22, 1, 0.36, 1] as const },
  }
}

export default function TeamsPage() {
  const router = useRouter()
  const reduceMotion = Boolean(useReducedMotion())
  const { currentUser } = useAuthStore()
  const { data: myTeamState, refresh: refreshMyTeam } = useMyTeamState()
  const [teams, setTeams] = useState<ApiTeamSummary[]>([])
  const [search, setSearch] = useState("")
  const [availability, setAvailability] = useState<"all" | "open" | "full">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<ApiTeamSummary | null>(null)
  const [joinMessage, setJoinMessage] = useState("")
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joiningByCode, setJoiningByCode] = useState(false)
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false)
  const deferredSearch = useDeferredValue(search)
  const isLeader = currentUser?.role === "leader"
  const isStudent = currentUser?.role === "member"
  const isSupportRole = currentUser?.role === "doctor" || currentUser?.role === "ta" || currentUser?.role === "admin"
  const hasTeam = Boolean(myTeamState?.team)

  const [viewMode, setViewMode] = useState<"all" | "supervised">(isSupportRole ? "supervised" : "all")
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)

  const loadTeams = async () => {
    const result = await teamsApi.list({
      page,
      limit: 9,
      search: deferredSearch || undefined,
      availability: availability === "all" ? undefined : availability,
    })
    setTeams(result.items)
    setTotalPages(result.meta.totalPages || 1)
  }

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError("")

    teamsApi
      .list({
        page,
        limit: 9,
        search: deferredSearch || undefined,
        availability: availability === "all" ? undefined : availability,
      })
      .then((result) => {
        if (cancelled) return
        setTeams(result.items)
        setTotalPages(result.meta.totalPages || 1)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Couldn't load teams right now.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [availability, deferredSearch, page])

  useEffect(() => {
    setPage(1)
  }, [availability, deferredSearch])

  const closeRequestDialog = () => {
    setSelectedTeam(null)
    setJoinMessage("")
  }

  const requestJoin = async () => {
    if (!selectedTeam) return
    setSubmittingRequest(true)

    try {
      await teamsApi.requestToJoin(selectedTeam.id, { message: joinMessage.trim() || undefined })
      toast.success(`Join request sent to ${selectedTeam.name}.`)
      closeRequestDialog()
      await refreshMyTeam()
      await loadTeams()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't send that join request.")
    } finally {
      setSubmittingRequest(false)
    }
  }

  const joinWithCode = async () => {
    if (!joinCode.trim()) return
    setJoiningByCode(true)

    try {
      await teamsApi.joinByCode(joinCode.trim().toUpperCase())
      toast.success("You joined the team successfully.")
      setJoinCode("")
      setIsJoinCodeOpen(false)
      await refreshMyTeam()
      router.push("/dashboard/my-team")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't join that team.")
    } finally {
      setJoiningByCode(false)
    }
  }

  const handleSupervisionRequest = async (requestId: string, action: "accept" | "decline") => {
    if (processingRequestId) return
    setProcessingRequestId(requestId)
    
    try {
      if (action === "accept") {
        await teamsApi.acceptSupervisorRequest(requestId)
        toast.success("Supervision request accepted. You are now supervising this team.")
        setViewMode("supervised") // Automatically switch to show the new team
      } else {
        await teamsApi.declineSupervisorRequest(requestId)
        toast.success("Supervision request declined.")
      }
      
      // Force a fresh fetch of all team data
      await refreshMyTeam()
      await loadTeams()
    } catch (err: unknown) {
      console.error("[SUPERVISION_ACTION_ERROR]", err)
      toast.error(err instanceof Error ? err.message : "Action failed. Please try again.")
    } finally {
      setProcessingRequestId(null)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setAvailability("all")
    setPage(1)
  }

  const pendingSupervisionRequests = (myTeamState?.supervisorRequestsReceived || []).filter(
    (req) => req.status === "PENDING",
  )

  if (isLeader) {
    return (
      <CenteredState
        icon={<Crown className="h-9 w-9 text-primary" />}
        title="Team leaders work from My Team"
        description="Leaders can’t join another team. Use My Team to create a workspace, manage invitations, and review join requests."
        actionHref="/dashboard/my-team"
        actionLabel={hasTeam ? "Open My Team" : "Create My Team"}
      />
    )
  }

  if (isStudent && hasTeam && myTeamState?.team) {
    return (
      <CenteredState
        icon={<Users className="h-9 w-9 text-primary" />}
        title={`You're already in ${myTeamState.team.name}`}
        description="Students can only belong to one team at a time. Open My Team to review members, invitations, and your current workspace."
        actionHref="/dashboard/my-team"
        actionLabel="Open My Team"
      />
    )
  }

  const displayedTeams =
    isSupportRole && viewMode === "supervised" ? myTeamState?.supervisedTeams || [] : teams

  const openTeamsCount = (isSupportRole && viewMode === "supervised" ? (myTeamState?.supervisedTeams || []) : teams).filter((team) => !team.isFull).length
  const pendingTeamsCount = teams.filter((team) => team.hasPendingRequest).length
  const invitationTeamsCount = teams.filter((team) => team.hasPendingInvitation).length

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 xl:p-8">
      <motion.section
        {...getRevealMotion(reduceMotion)}
        className="relative overflow-hidden rounded-[32px] border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
            {/* Title + CTAs */}
            <div className="space-y-5 max-w-2xl flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-medium px-3 py-1">
                  Browse Teams
                </Badge>
                {isStudent && <Badge variant="secondary" className="px-3 py-1">Student</Badge>}
                {isSupportRole && <Badge variant="secondary" className="px-3 py-1 bg-amber-500/10 text-amber-600 border-0 hover:bg-amber-500/20">Support View</Badge>}
              </div>
              
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                  {isSupportRole ? "Teams you supervise" : "Find your team"}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground/90">
                  {isStudent
                    ? "Compare project ideas, stages, and open seats. Send a request or use an invite code to join."
                    : isSupportRole
                      ? "Review team details, composition, and project stage across all your supervised workspaces."
                      : "Explore teams, check availability, and connect with the right workspace."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {isStudent && (
                  <Button className="h-11 rounded-2xl px-6 shadow-lg shadow-primary/15 font-semibold" onClick={() => setIsJoinCodeOpen(true)}>
                    <Hash className="mr-2 h-4 w-4" />
                    Join with Code
                  </Button>
                )}
                {!isSupportRole && (
                  <Button variant="outline" className="h-11 rounded-2xl px-6 bg-background border-border/60 shadow-sm hover:bg-muted/50" asChild>
                    <Link href="/dashboard/my-team">
                      My Invitations
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {isSupportRole && (
                  <Button variant="outline" className="h-11 rounded-2xl px-6 bg-background border-border/60 shadow-sm hover:bg-muted/50" onClick={() => setViewMode("supervised")}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    My Teams
                  </Button>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
              <MetricCard label="Teams" value={String(displayedTeams.length)} helper="Visible results" />
              <MetricCard label="Open" value={String(openTeamsCount)} helper="Available seats" />
              <div className="col-span-2 sm:col-span-1">
                <MetricCard
                  label={isSupportRole ? "Requests" : "Pending"}
                  value={String(isSupportRole ? pendingSupervisionRequests.length : (pendingTeamsCount + invitationTeamsCount))}
                  helper={isSupportRole ? "Supervision" : "Activity"}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...getRevealMotion(reduceMotion, 0.05)}>
        {isSupportRole && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 text-sm font-semibold text-primary">
              <Briefcase className="h-3.5 w-3.5" />
              Supervised Teams
              {myTeamState?.supervisedTeams?.length ? (
                <Badge className="h-5 rounded-full bg-primary/20 px-1.5 text-[10px] font-bold text-primary hover:bg-primary/30">
                  {myTeamState.supervisedTeams.length}
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">Showing teams assigned to you</p>
          </div>
        )}

        {isSupportRole && pendingSupervisionRequests.length > 0 && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Send className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Supervision Requests</h2>
                <p className="text-sm text-muted-foreground">Teams have invited you to supervise their graduation projects.</p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingSupervisionRequests.map((request) => (
                <Card key={request.id} className="group overflow-hidden border-primary/10 bg-gradient-to-br from-primary/[0.03] to-transparent shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{request.projectName}</CardTitle>
                        <CardDescription className="flex items-center gap-1.5 font-medium text-foreground/70">
                          <Users className="h-3.5 w-3.5" />
                          {request.team.name}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="line-clamp-2 text-sm text-muted-foreground leading-6">
                      {request.projectDescription}
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {request.technologies.slice(0, 4).map(tech => (
                        <Badge key={tech} variant="secondary" className="bg-background/80 text-[10px] font-medium border-border/50">{tech}</Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        className="flex-1 rounded-xl shadow-sm transition-transform active:scale-[0.98]" 
                        size="sm"
                        disabled={!!processingRequestId}
                        onClick={() => void handleSupervisionRequest(request.id, "accept")}
                      >
                        {processingRequestId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-xl border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-sm transition-all active:scale-[0.98]" 
                        size="sm"
                        disabled={!!processingRequestId}
                        onClick={() => void handleSupervisionRequest(request.id, "decline")}
                      >
                        {processingRequestId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1.5" />}
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search teams by name, idea, or stack…"
                className="h-11 pl-9 rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <Select value={availability} onValueChange={(value) => { setAvailability(value as "all" | "open" | "full"); setPage(1) }}>
                <SelectTrigger className="h-11 w-[130px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="h-11 rounded-xl px-4 shrink-0" onClick={clearFilters}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {error && (
        <Card className="border-destructive/25 bg-destructive/[0.04] shadow-none">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <motion.div {...getRevealMotion(reduceMotion, 0.08)} className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {teams.length > 0
              ? `${teams.length} team${teams.length === 1 ? "" : "s"} found`
              : "No teams match the current filters."}
          </p>
          {totalPages > 1 && (
            <p className="text-xs text-muted-foreground">Page {page} / {Math.max(totalPages, 1)}</p>
          )}
        </motion.div>
        {isLoading ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading teams and current availability.</p>
            </CardContent>
          </Card>
        ) : teams.length === 0 ? (
          <Card className="border-dashed border-border/70 shadow-none">
            <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight">No teams matched this search</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Try another keyword, change the availability filter, or clear everything to start again with the full list.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="rounded-xl" onClick={clearFilters}>Reset Filters</Button>
                {isStudent && <Button className="rounded-xl" onClick={() => setIsJoinCodeOpen(true)}>Join with Code</Button>}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {displayedTeams.map((team, index) => {
              const fillPercent = team.maxMembers > 0 ? Math.round((team.memberCount / team.maxMembers) * 100) : 0
              const spotsLeft = Math.max(team.maxMembers - team.memberCount, 0)
              const statusCopy = team.hasPendingInvitation
                ? "Invitation waiting in My Team"
                : team.hasPendingRequest
                  ? "Request already sent"
                  : team.isFull
                    ? "No seats available right now"
                    : `${spotsLeft} ${spotsLeft === 1 ? "seat" : "seats"} left`

              const isSupervisorOfTeam = isSupportRole && (team.doctor?.id === currentUser?.id || team.ta?.id === currentUser?.id)
              const supervisorRole = team.doctor?.id === currentUser?.id ? "Doctor" : "TA"

              return (
                <motion.div
                  key={team.id}
                  {...getRevealMotion(reduceMotion, 0.04 + index * 0.03)}
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className={`flex h-full flex-col overflow-hidden border-border/70 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-md ${isSupervisorOfTeam ? "ring-1 ring-primary/20" : ""}`}>
                    <div className={`h-1 w-full ${isSupervisorOfTeam ? "bg-gradient-to-r from-primary/60 to-primary/20" : team.isFull ? "bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/10" : fillPercent >= 75 ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500"}`} />
                    <CardContent className="flex h-full flex-col gap-5 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{formatTeamVisibility(team.visibility)}</Badge>
                          {isSupervisorOfTeam && (
                            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Supervising as {supervisorRole}</Badge>
                          )}
                        </div>
                        <Badge variant={team.isFull ? "secondary" : "outline"} className={`rounded-full ${!team.isFull ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-400" : ""}`}>{team.isFull ? "Full" : "Open"}</Badge>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-xl font-semibold tracking-tight break-words">{team.name}</h2>
                        <p className="min-h-[72px] text-sm leading-6 text-muted-foreground line-clamp-3 break-words">{team.bio}</p>
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-muted/15 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 border border-border/60">
                              <AvatarImage src={team.leader.avatarUrl || "/placeholder.svg"} />
                              <AvatarFallback>{getAvatarInitial(team.leader)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{getFullName(team.leader)}</p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Team Leader</p>
                            </div>
                          </div>
                          {isSupervisorOfTeam && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capacity</span>
                          <span className={`font-semibold ${team.isFull ? "text-muted-foreground" : fillPercent >= 75 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{team.memberCount}/{team.maxMembers}</span>
                        </div>
                        <Progress value={fillPercent} className={`h-2 ${team.isFull ? "[&>div]:bg-muted-foreground/40" : fillPercent >= 75 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`} />
                        {!isSupportRole && <p className={`text-xs font-medium ${team.hasPendingInvitation ? "text-primary" : team.hasPendingRequest ? "text-muted-foreground" : team.isFull ? "text-muted-foreground" : "text-emerald-700 dark:text-emerald-400"}`}>{statusCopy}</p>}
                        {isSupportRole && (
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{team.memberCount} members currently active</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {team.stack.length > 0 ? (
                          <>
                            {team.stack.slice(0, 4).map((tech) => <Badge key={tech} variant="secondary" className="rounded-full bg-background/50 border-border/50 text-[11px]">{tech}</Badge>)}
                            {team.stack.length > 4 && <Badge variant="outline" className="rounded-full text-[10px]">+{team.stack.length - 4}</Badge>}
                          </>
                        ) : (
                          <Badge variant="outline" className="rounded-full text-xs opacity-60">Stack not added yet</Badge>
                        )}
                      </div>

                      <div className="mt-auto space-y-3 pt-1">
                        {!isSupportRole && (team.hasPendingInvitation || team.hasPendingRequest) && (
                          <div className={`rounded-2xl px-3 py-2.5 text-sm ${team.hasPendingInvitation ? "border border-primary/20 bg-primary/5 text-primary" : "border border-border/60 bg-muted/20 text-muted-foreground"}`}>
                            {team.hasPendingInvitation ? "You already have a direct invitation from this team." : "Your join request is already waiting for review."}
                          </div>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button asChild variant="outline" className={`flex-1 rounded-xl bg-transparent ${isSupervisorOfTeam ? "border-primary/30 text-primary hover:bg-primary/5" : ""}`}>
                            <Link href={`/dashboard/teams/${team.id}`}>
                              {isSupervisorOfTeam ? "Open Workspace" : "View Details"}
                              {isSupervisorOfTeam && <ExternalLink className="ml-1.5 h-3.5 w-3.5" />}
                            </Link>
                          </Button>
                          {!isSupportRole && (
                            team.hasPendingInvitation ? (
                              <Button asChild className="flex-1 rounded-xl">
                                <Link href="/dashboard/my-team">Review Invitation</Link>
                              </Button>
                            ) : (
                              <Button className="flex-1 rounded-xl" disabled={!team.isJoinable} onClick={() => setSelectedTeam(team)}>
                                {team.hasPendingRequest ? "Request Sent" : team.isFull ? "Team Full" : "Request to Join"}
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/50 pt-2">
          <p className="text-sm text-muted-foreground">Page {page} of {Math.max(totalPages, 1)}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={isJoinCodeOpen} onOpenChange={setIsJoinCodeOpen}>
        <DialogContent className="w-[94vw] max-w-md overflow-hidden rounded-[28px] p-0">
          <div className="p-5 sm:p-6">
            <DialogHeader className="space-y-4 text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Hash className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-2xl tracking-tight">Join with invite code</DialogTitle>
                <DialogDescription className="leading-6">
                  Enter the exact code shared by a team leader. If the team still has room, you will join immediately.
                </DialogDescription>
              </div>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-team-code">Invite Code</Label>
                <Input id="join-team-code" value={joinCode} placeholder="SMART-25A1" className="h-12 font-mono tracking-[0.18em]" onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-medium">Helpful tip</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Invite codes are case-insensitive here, so you can paste them directly without reformatting.</p>
              </div>
              <DialogFooter className="gap-3 sm:gap-3">
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => setIsJoinCodeOpen(false)}>Cancel</Button>
                <Button className="h-12 rounded-xl" disabled={!joinCode.trim() || joiningByCode} onClick={() => void joinWithCode()}>
                  {joiningByCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span className="ml-2">Join Team</span>
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <TeamJoinRequestDialog
        team={selectedTeam}
        open={Boolean(selectedTeam)}
        onOpenChange={(open) => {
          if (!open) closeRequestDialog()
        }}
        message={joinMessage}
        onMessageChange={setJoinMessage}
        onSubmit={() => void requestJoin()}
        isSubmitting={submittingRequest}
        title="Send join request"
        description="Keep it short and helpful. Mention what you can contribute so the leader can decide quickly."
        messageId="join-request-message"
        placeholder="I can help with frontend structure, testing, and keeping the team organized..."
      />
    </div>
  )
}

function CenteredState({ icon, title, description, actionHref, actionLabel }: { icon: ReactNode; title: string; description: string; actionHref: string; actionLabel: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4 md:p-6">
      <Card className="w-full max-w-2xl overflow-hidden border-border/70 shadow-sm">
        <CardContent className="px-6 py-10 text-center sm:px-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-primary/10 text-primary">{icon}</div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
          <Button className="mt-6 rounded-2xl px-6" asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[20px] border border-border/60 bg-background/88 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>
    </div>
  )
}


