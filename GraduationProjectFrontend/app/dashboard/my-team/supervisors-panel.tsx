"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { usersApi } from "@/lib/api/users"
import { teamsApi } from "@/lib/api/teams"
import type {
  ApiDirectoryUser,
  ApiSupervisorRequest,
  ApiSupervisorRole,
  ApiTeamDetail,
  ApiTeamSummary,
  ApiTeamUser,
} from "@/lib/api/types"
import { getAvatarInitial, getFullName } from "@/lib/team-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type LeaderSupervisorsTabProps = {
  team: ApiTeamDetail
  requests: ApiSupervisorRequest[]
  onRefresh: () => Promise<void>
}

type SupervisorRequestInboxProps = {
  currentRole: "doctor" | "ta"
  requests: ApiSupervisorRequest[]
  supervisedTeams: ApiTeamDetail[] | ApiTeamSummary[]
  onRefresh: () => Promise<void>
}

type RequestDraft = {
  projectName: string
  technologies: string
  projectDescription: string
}

export function LeaderSupervisorsTab({ team, requests, onRefresh }: LeaderSupervisorsTabProps) {
  const [doctors, setDoctors] = useState<ApiDirectoryUser[]>([])
  const [tas, setTas] = useState<ApiDirectoryUser[]>([])
  const [doctorSearch, setDoctorSearch] = useState("")
  const [taSearch, setTaSearch] = useState("")
  const [doctorPage, setDoctorPage] = useState(1)
  const [taPage, setTaPage] = useState(1)
  const [doctorTotalPages, setDoctorTotalPages] = useState(1)
  const [taTotalPages, setTaTotalPages] = useState(1)
  const [doctorLoading, setDoctorLoading] = useState(true)
  const [taLoading, setTaLoading] = useState(true)
  const [doctorError, setDoctorError] = useState("")
  const [taError, setTaError] = useState("")
  const [removingRole, setRemovingRole] = useState<"" | ApiSupervisorRole>("")
  const [selectedSupervisor, setSelectedSupervisor] = useState<ApiDirectoryUser | null>(null)
  const [sendingRequest, setSendingRequest] = useState(false)
  const [draft, setDraft] = useState<RequestDraft>({
    projectName: team.name,
    technologies: team.stack.join(", "),
    projectDescription: team.bio,
  })

  useEffect(() => {
    let cancelled = false
    setDoctorLoading(true)
    setDoctorError("")

    usersApi
      .directory({ role: "DOCTOR", search: doctorSearch || undefined, page: doctorPage, limit: 12 })
      .then((result) => {
        if (cancelled) return
        setDoctorTotalPages(result.meta.totalPages || 1)
        setDoctors((current) => (doctorPage === 1 ? result.items : [...current, ...result.items.filter((item) => current.every((existing) => existing.id !== item.id))]))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setDoctorError(error instanceof Error ? error.message : "Couldn't load doctors right now.")
      })
      .finally(() => {
        if (!cancelled) setDoctorLoading(false)
      })

    return () => { cancelled = true }
  }, [doctorPage, doctorSearch])

  useEffect(() => {
    let cancelled = false
    setTaLoading(true)
    setTaError("")

    usersApi
      .directory({ role: "TA", search: taSearch || undefined, page: taPage, limit: 12 })
      .then((result) => {
        if (cancelled) return
        setTaTotalPages(result.meta.totalPages || 1)
        setTas((current) => (taPage === 1 ? result.items : [...current, ...result.items.filter((item) => current.every((existing) => existing.id !== item.id))]))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setTaError(error instanceof Error ? error.message : "Couldn't load teaching assistants right now.")
      })
      .finally(() => {
        if (!cancelled) setTaLoading(false)
      })

    return () => { cancelled = true }
  }, [taPage, taSearch])

  const openRequestDialog = (candidate: ApiDirectoryUser) => {
    setSelectedSupervisor(candidate)
    setDraft({
      projectName: team.name,
      technologies: team.stack.join(", "),
      projectDescription: team.bio,
    })
  }

  const sendRequest = async () => {
    if (!selectedSupervisor) return

    const technologies = draft.technologies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

    if (draft.projectName.trim().length < 3) {
      toast.error("Add a clear project name before sending the request.")
      return
    }

    if (draft.projectDescription.trim().length < 10) {
      toast.error("Add a short project description so the supervisor understands the idea.")
      return
    }

    if (technologies.length === 0) {
      toast.error("Add at least one technology before sending the request.")
      return
    }

    setSendingRequest(true)
    try {
      await teamsApi.createSupervisorRequest(team.id, {
        supervisorId: selectedSupervisor.id,
        projectName: draft.projectName.trim(),
        projectDescription: draft.projectDescription.trim(),
        technologies,
      })
      toast.success(`Request sent to ${getFullName(selectedSupervisor)}.`)
      setSelectedSupervisor(null)
      await onRefresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't send the supervisor request.")
    } finally {
      setSendingRequest(false)
    }
  }

  const removeSupervisorAssignment = async (role: ApiSupervisorRole) => {
    setRemovingRole(role)
    try {
      await teamsApi.removeSupervisor(team.id, role)
      toast.success(`${role === "DOCTOR" ? "Doctor" : "TA"} assignment removed.`)
      await onRefresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't remove that supervisor assignment.")
    } finally {
      setRemovingRole("")
    }
  }

  const pendingDoctorRequest = requests.find(
    (item) => item.supervisorRole === "DOCTOR" && item.status === "PENDING",
  ) ?? null
  const pendingTaRequest = requests.find((item) => item.supervisorRole === "TA" && item.status === "PENDING") ?? null

  return (
    <div className="space-y-8">
      {/* How It Works Guide */}
      <div className="rounded-[24px] border border-border/60 bg-muted/20 p-5 sm:p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">How It Works</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Check your current status",
              desc: "See if a doctor or TA is already assigned or has a pending request below.",
            },
            {
              step: "02",
              title: "Browse available supervisors",
              desc: "Search the list, read their profile, and find the right fit for your project.",
            },
            {
              step: "03",
              title: "Send a supervision request",
              desc: "Click Request, fill in your project details, and wait for their response.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-sm font-bold text-primary">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold leading-5">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 — Current Status */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
          <h2 className="text-base font-semibold tracking-tight">Your Supervisor Status</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <AssignmentCard
            role="DOCTOR"
            assignedSupervisor={team.doctor}
            pendingRequest={pendingDoctorRequest}
            helper="Supervises your project direction and milestone reviews."
            onRemove={() => void removeSupervisorAssignment("DOCTOR")}
            isRemoving={removingRole === "DOCTOR"}
          />
          <AssignmentCard
            role="TA"
            assignedSupervisor={team.ta}
            pendingRequest={pendingTaRequest}
            helper="Supports technical follow-up and provides ongoing feedback."
            onRemove={() => void removeSupervisorAssignment("TA")}
            isRemoving={removingRole === "TA"}
          />
        </div>
      </div>

      {/* Request History */}
      {requests.length > 0 && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base">Request History</CardTitle>
            <CardDescription>Track which requests are pending and which supervisors responded.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 xl:grid-cols-2">
            {requests.map((request) => (
              <SupervisorRequestHistoryCard key={request.id} request={request} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Browse & Request */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
          <h2 className="text-base font-semibold tracking-tight">Browse &amp; Request Supervisors</h2>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <SupervisorCandidatesSection
            title="Available Doctors"
            description="Browse active doctors and send one supervision request when you're ready."
            role="DOCTOR"
            candidates={doctors}
            assignedSupervisor={team.doctor}
            pendingRequest={pendingDoctorRequest}
            isLoading={doctorLoading}
            error={doctorError}
            searchValue={doctorSearch}
            onSearchChange={setDoctorSearch}
            canLoadMore={doctorPage < doctorTotalPages}
            onLoadMore={() => setDoctorPage((p) => p + 1)}
            onSelect={openRequestDialog}
          />
          <SupervisorCandidatesSection
            title="Available Teaching Assistants"
            description="Browse active TAs and request one that fits your project stack and workflow."
            role="TA"
            candidates={tas}
            assignedSupervisor={team.ta}
            pendingRequest={pendingTaRequest}
            isLoading={taLoading}
            error={taError}
            searchValue={taSearch}
            onSearchChange={setTaSearch}
            canLoadMore={taPage < taTotalPages}
            onLoadMore={() => setTaPage((p) => p + 1)}
            onSelect={openRequestDialog}
          />
        </div>
      </div>

      {/* Send Request Dialog */}
      <Dialog
        open={Boolean(selectedSupervisor)}
        onOpenChange={(open) => !open && !sendingRequest && setSelectedSupervisor(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl tracking-tight">Send supervision request</DialogTitle>
            <DialogDescription>
              {selectedSupervisor
                ? `Share your project snapshot with ${getFullName(selectedSupervisor)}. They'll use this to decide.`
                : "Share a brief project snapshot before sending the request."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {selectedSupervisor && (
              <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
                <Avatar className="h-12 w-12 border border-border/60">
                  <AvatarImage src={selectedSupervisor.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>{getAvatarInitial(selectedSupervisor)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold">{getFullName(selectedSupervisor)}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedSupervisor.role === "DOCTOR" ? "Doctor / Professor" : "Teaching Assistant"}
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto shrink-0 border-primary/25 text-primary">
                  {selectedSupervisor.role === "DOCTOR" ? "Doctor" : "TA"}
                </Badge>
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-semibold">Project Name</Label>
              <Input
                value={draft.projectName}
                onChange={(event) => setDraft((current) => ({ ...current, projectName: event.target.value }))}
                placeholder="Smart Campus Builders"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Technologies Used</Label>
              <Input
                value={draft.technologies}
                onChange={(event) => setDraft((current) => ({ ...current, technologies: event.target.value }))}
                placeholder="Next.js, Node.js, PostgreSQL"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Separate technologies with commas.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Project Description</Label>
              <Textarea
                rows={5}
                value={draft.projectDescription}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, projectDescription: event.target.value }))
                }
                placeholder="Describe the problem you're solving, what you want to build, and the kind of supervision you need."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Minimum 10 characters. Be clear and concise.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSelectedSupervisor(null)} disabled={sendingRequest}>
              Cancel
            </Button>
            <Button onClick={() => void sendRequest()} disabled={sendingRequest} className="min-w-[140px]">
              {sendingRequest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              <span className="ml-2">{sendingRequest ? "Sending..." : "Send Request"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function SupervisorRequestInbox({ currentRole, requests, supervisedTeams, onRefresh }: SupervisorRequestInboxProps) {
  const [busyRequestId, setBusyRequestId] = useState("")
  const [busyAction, setBusyAction] = useState<"accept" | "decline" | "">("")

  const pendingRequests = requests.filter((item) => item.status === "PENDING")
  const historyRequests = requests.filter((item) => item.status !== "PENDING")

  const respond = async (requestId: string, action: "accept" | "decline") => {
    setBusyRequestId(requestId)
    setBusyAction(action)
    try {
      if (action === "accept") {
        await teamsApi.acceptSupervisorRequest(requestId)
        toast.success("Supervisor request accepted.")
      } else {
        await teamsApi.declineSupervisorRequest(requestId)
        toast.success("Supervisor request declined.")
      }
      await onRefresh()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't update that supervisor request.")
    } finally {
      setBusyRequestId("")
      setBusyAction("")
    }
  }

  const roleLabel = currentRole === "doctor" ? "Doctor" : "Teaching Assistant"

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="overflow-hidden rounded-[28px] border border-border/70 shadow-sm">
        <div className="bg-gradient-to-br from-primary/[0.10] via-background to-primary/[0.04] px-5 py-6 sm:px-6 sm:py-7 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
            <div className="space-y-3">
              <Badge variant="outline" className="border-primary/25 bg-background/85 text-primary">
                {roleLabel} Inbox
              </Badge>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Supervision Requests
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Each request includes the team name, project idea, and tech stack so you can review and decide with full context.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-background/92 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inbox Overview</p>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-1">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-amber-700 dark:text-amber-400">Pending</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{pendingRequests.length}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Reviewed</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{historyRequests.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Teams */}
      {supervisedTeams.length > 0 && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base">Teams You Supervise</CardTitle>
            <CardDescription>Teams that currently list you as an active supervisor.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 xl:grid-cols-2">
            {supervisedTeams.map((team) => (
              <div key={team.id} className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold tracking-tight">{team.name}</p>
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        {team.stage.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground line-clamp-2">
                      {team.bio || "No team bio added yet."}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" asChild>
                    <Link href={`/dashboard/teams/${team.id}`}>
                      Open Team
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                    <Link href={`/dashboard/tasks?teamId=${team.id}`}>Tasks</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                    <Link href={`/dashboard/github?teamId=${team.id}`}>GitHub</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">Pending Requests</h2>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
              {pendingRequests.length} awaiting
            </Badge>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request) => {
              const isBusy = busyRequestId === request.id
              return (
                <div
                  key={request.id}
                  className="overflow-hidden rounded-[24px] border border-border/70 bg-background shadow-sm"
                >
                  {/* Amber accent bar */}
                  <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-500" />

                  <div className="p-5 sm:p-6">
                    {/* Header row */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            {request.supervisorRole === "DOCTOR" ? "Doctor Request" : "TA Request"}
                          </Badge>
                          <Badge variant="secondary">
                            {request.team.name}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-bold tracking-tight">{request.projectName}</h3>
                      </div>
                      <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.projectDescription}</p>

                    {/* Tech stack */}
                    {request.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {request.technologies.map((item) => (
                          <Badge key={item} variant="secondary" className="rounded-full">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Requester info */}
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                      <Avatar className="h-9 w-9 border border-border/60">
                        <AvatarImage src={request.requestedBy.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback>{getAvatarInitial(request.requestedBy)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{getFullName(request.requestedBy)}</p>
                        <p className="text-xs text-muted-foreground">{request.requestedBy.email}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto shrink-0">Team Leader</Badge>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button variant="ghost" size="sm" className="self-start rounded-xl text-muted-foreground" asChild>
                        <Link href={`/dashboard/teams/${request.team.id}`}>
                          View Team Page
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none sm:min-w-[110px]"
                          disabled={isBusy}
                          onClick={() => void respond(request.id, "decline")}
                        >
                          {isBusy && busyAction === "decline" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span className="ml-2">Decline</span>
                        </Button>
                        <Button
                          className="flex-1 rounded-xl sm:flex-none sm:min-w-[110px]"
                          disabled={isBusy}
                          onClick={() => void respond(request.id, "accept")}
                        >
                          {isBusy && busyAction === "accept" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          <span className="ml-2">Accept</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-dashed border-border/70 p-8 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No pending requests</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            When team leaders request you as a supervisor, requests will appear here with full project details.
          </p>
        </div>
      )}

      {/* History */}
      {historyRequests.length > 0 && (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base">Reviewed Requests</CardTitle>
            <CardDescription>Your past supervision decisions for reference.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 xl:grid-cols-2">
            {historyRequests.map((request) => (
              <SupervisorRequestHistoryCard key={request.id} request={request} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AssignmentCard({
  role,
  assignedSupervisor,
  pendingRequest,
  helper,
  onRemove,
  isRemoving,
}: {
  role: ApiSupervisorRole
  assignedSupervisor: ApiTeamUser | null
  pendingRequest: ApiSupervisorRequest | null
  helper: string
  onRemove?: () => void
  isRemoving?: boolean
}) {
  const roleLabel = role === "DOCTOR" ? "Doctor" : "Teaching Assistant"
  const RoleIcon = role === "DOCTOR" ? GraduationCap : Users

  return (
    <div className="overflow-hidden rounded-[24px] border border-border/70 bg-background shadow-sm">
      {/* Top accent */}
      <div className={`h-1 w-full ${assignedSupervisor ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : pendingRequest ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-border/40"}`} />

      <div className="p-5">
        {/* Role header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RoleIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">{roleLabel}</p>
            <p className="text-xs text-muted-foreground">{helper}</p>
          </div>
        </div>

        {/* Status body */}
        {assignedSupervisor ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border border-border/60">
                <AvatarImage src={assignedSupervisor.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback>{getAvatarInitial(assignedSupervisor)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-5">{getFullName(assignedSupervisor)}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{assignedSupervisor.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="gap-1 bg-emerald-600 text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Assigned
              </Badge>
              {onRemove && (
                <Button variant="outline" size="sm" className="h-7 rounded-lg px-2.5 text-xs" onClick={onRemove} disabled={isRemoving}>
                  {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  <span className="ml-1">Remove</span>
                </Button>
              )}
            </div>
          </div>
        ) : pendingRequest ? (
          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border border-border/60">
                <AvatarImage src={pendingRequest.supervisor.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback>{getAvatarInitial(pendingRequest.supervisor)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold leading-5">{getFullName(pendingRequest.supervisor)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Request sent &mdash; waiting for response
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="mt-3 gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <Clock className="h-3 w-3" />
              Awaiting Response
            </Badge>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border/60 p-4">
            <p className="text-sm text-muted-foreground">No {roleLabel.toLowerCase()} assigned yet.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Browse supervisors below and send a request.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SupervisorCandidatesSection({
  title,
  description,
  role,
  candidates,
  assignedSupervisor,
  pendingRequest,
  isLoading,
  error,
  searchValue,
  onSearchChange,
  canLoadMore,
  onLoadMore,
  onSelect,
}: {
  title: string
  description: string
  role: ApiSupervisorRole
  candidates: ApiDirectoryUser[]
  assignedSupervisor: ApiTeamUser | null
  pendingRequest: ApiSupervisorRequest | null
  isLoading: boolean
  error: string
  searchValue: string
  onSearchChange: (value: string) => void
  canLoadMore: boolean
  onLoadMore: () => void
  onSelect: (candidate: ApiDirectoryUser) => void
}) {
  const roleLabel = role === "DOCTOR" ? "Doctor" : "TA"
  const RoleIcon = role === "DOCTOR" ? GraduationCap : Users

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <RoleIcon className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={`Search by name, email, or department`}
            className="h-10 rounded-xl pl-9"
          />
        </div>

        {/* States */}
        {isLoading && (
          <div className="rounded-2xl border p-6 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading {roleLabel.toLowerCase()}s...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && candidates.length === 0 && (
          <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
            No {roleLabel.toLowerCase()} accounts available right now.
          </div>
        )}

        {/* Candidate list */}
        {!isLoading && !error && candidates.map((candidate) => {
          const isAssigned = assignedSupervisor?.id === candidate.id
          const hasAssignedOther = Boolean(assignedSupervisor) && assignedSupervisor?.id !== candidate.id
          const isPendingSameCandidate = pendingRequest?.supervisor.id === candidate.id
          const hasPendingOtherCandidate = Boolean(pendingRequest) && pendingRequest?.supervisor.id !== candidate.id
          const actionDisabled = isAssigned || hasAssignedOther || isPendingSameCandidate || hasPendingOtherCandidate

          let actionLabel = `Request ${roleLabel}`
          if (isAssigned) actionLabel = "Assigned"
          else if (hasAssignedOther) actionLabel = `${roleLabel} Assigned`
          else if (isPendingSameCandidate) actionLabel = "Request Sent"
          else if (hasPendingOtherCandidate) actionLabel = "Another Pending"

          return (
            <div
              key={candidate.id}
              className={`rounded-[20px] border p-4 transition-[border-color] duration-150 ${
                isAssigned
                  ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                  : isPendingSameCandidate
                    ? "border-amber-500/30 bg-amber-500/[0.04]"
                    : "border-border/60 bg-background hover:border-primary/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 border border-border/60">
                  <AvatarImage src={candidate.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>{getAvatarInitial(candidate)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold leading-5">{getFullName(candidate)}</p>
                    {isAssigned && (
                      <Badge className="gap-1 bg-emerald-600 text-white text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        Assigned
                      </Badge>
                    )}
                    {isPendingSameCandidate && (
                      <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{candidate.email}</p>
                  {candidate.department && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{candidate.department.replaceAll("_", " ")}</p>
                  )}
                  {candidate.bio?.trim() && (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-2">{candidate.bio}</p>
                  )}
                </div>
              </div>

              <Button
                variant={actionDisabled ? "outline" : "default"}
                size="sm"
                className="mt-3 w-full rounded-xl"
                disabled={actionDisabled}
                onClick={() => onSelect(candidate)}
              >
                <RoleIcon className="h-3.5 w-3.5" />
                <span className="ml-1.5">{actionLabel}</span>
              </Button>
            </div>
          )
        })}

        {!isLoading && !error && canLoadMore && (
          <Button variant="outline" className="w-full rounded-xl" onClick={onLoadMore}>
            Load more {roleLabel.toLowerCase()}s
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function SupervisorRequestHistoryCard({ request }: { request: ApiSupervisorRequest }) {
  return (
    <div className="rounded-[20px] border border-border/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-5">{request.projectName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {request.supervisorRole === "DOCTOR" ? "Doctor" : "TA"} request &bull; {request.team.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{getFullName(request.supervisor)}</p>
        </div>
        <SupervisorStatusBadge status={request.status} />
      </div>

      {request.technologies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {request.technologies.map((item) => (
            <Badge key={item} variant="secondary" className="rounded-full text-xs">
              {item}
            </Badge>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Sent {new Date(request.createdAt).toLocaleDateString()}
        {request.respondedAt && ` · Responded ${new Date(request.respondedAt).toLocaleDateString()}`}
      </p>
    </div>
  )
}

function SupervisorStatusBadge({ status }: { status: ApiSupervisorRequest["status"] }) {
  if (status === "ACCEPTED") {
    return (
      <Badge className="shrink-0 gap-1 bg-emerald-600 text-white">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Accepted
      </Badge>
    )
  }

  if (status === "DECLINED") {
    return (
      <Badge variant="destructive" className="shrink-0 gap-1">
        <XCircle className="h-3.5 w-3.5" />
        Declined
      </Badge>
    )
  }

  if (status === "CANCELLED") {
    return <Badge variant="secondary" className="shrink-0">Cancelled</Badge>
  }

  return (
    <Badge variant="secondary" className="shrink-0 gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400">
      <Sparkles className="h-3.5 w-3.5" />
      Pending
    </Badge>
  )
}

function SupervisorMetaLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/15 px-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
