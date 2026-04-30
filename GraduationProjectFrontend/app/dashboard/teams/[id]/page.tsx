"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowRight,
  Check,
  Copy,
  Globe2,
  Layers3,
  Loader2,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { teamsApi } from "@/lib/api/teams"
import type { ApiTeamDetail, ApiTeamMember } from "@/lib/api/types"
import { useMyTeamState } from "@/lib/hooks/use-my-team-state"
import { useAuthStore } from "@/lib/stores/auth-store"
import { formatRoleLabel, formatTeamStage, formatTeamVisibility, getAvatarInitial, getFullName } from "@/lib/team-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeamJoinRequestDialog } from "@/components/dashboard/team-join-request-dialog"

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentUser } = useAuthStore()
  const { data: myTeamState, isLoading: isMyTeamLoading } = useMyTeamState()
  const reduceMotion = Boolean(useReducedMotion())
  const teamId = String(params?.id || "")
  const [team, setTeam] = useState<ApiTeamDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [joinMessage, setJoinMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)

  useEffect(() => {
    if (!teamId || isMyTeamLoading) return
    if (myTeamState?.team?.id === teamId) {
      router.replace("/dashboard/my-team")
    }
  }, [isMyTeamLoading, myTeamState?.team?.id, router, teamId])

  useEffect(() => {
    if (!teamId) return

    let cancelled = false
    setIsLoading(true)
    setError("")

    teamsApi
      .getById(teamId)
      .then((result) => {
        if (!cancelled) setTeam(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load this team.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [teamId])

  if (!isMyTeamLoading && myTeamState?.team?.id === teamId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const sendJoinRequest = async () => {
    if (!team) return
    setIsSubmitting(true)
    try {
      await teamsApi.requestToJoin(team.id, { message: joinMessage.trim() || undefined })
      toast.success(`Join request sent to ${team.name}.`)
      const result = await teamsApi.getById(team.id)
      setTeam(result)
      closeJoinDialog()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't send that join request.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeJoinDialog = () => {
    setIsJoinDialogOpen(false)
    setJoinMessage("")
  }

  const copyInviteCode = async () => {
    if (!team?.inviteCode) return
    await navigator.clipboard.writeText(team.inviteCode)
    setCopied(true)
    toast.success("Invite code copied.")
    window.setTimeout(() => setCopied(false), 1200)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="container mx-auto max-w-3xl p-4 md:p-6">
        <Card className="p-6 text-center sm:p-8">
          <h2 className="text-xl font-semibold">Couldn&apos;t open this team</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{error || "Team not found."}</p>
          <Button className="mt-4 w-full sm:w-auto" asChild>
            <Link href="/dashboard/teams">Back to Teams</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const canJoin = currentUser?.role === "member" && team.permissions.canRequestToJoin && !team.hasPendingInvitation
  const canManage = team.permissions.canManage
  const seatsRemaining = Math.max(team.maxMembers - team.memberCount, 0)
  const openSeatsLabel = seatsRemaining === 0 ? "Full team" : `${seatsRemaining} open ${seatsRemaining === 1 ? "seat" : "seats"}`
  const occupancyRatio = team.maxMembers > 0 ? team.memberCount / team.maxMembers : 0
  const leader = team.leader

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <motion.section
        {...getRevealMotion(reduceMotion)}
        className="rounded-[28px] border border-border/70 bg-background shadow-sm"
      >
        <div className="space-y-5 p-5 sm:p-6 md:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Team Details
                </Badge>
                <Badge variant="outline">{formatTeamStage(team.stage)}</Badge>
                <Badge variant="secondary">{formatTeamVisibility(team.visibility)}</Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{team.name}</h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{team.bio}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {team.stack.length > 0 ? (
                  team.stack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="rounded-full px-3 py-1">
                      {tech}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    No stack details added yet
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-end">
              {canManage && team.inviteCode && (
                <motion.div {...getActionMotion(reduceMotion)} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="group h-11 w-full justify-between bg-transparent transition-colors duration-200 hover:border-primary/25 hover:bg-primary/[0.03] sm:min-w-[210px]"
                    onClick={() => void copyInviteCode()}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />
                    ) : (
                      <Copy className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />
                    )}
                    <span className="ml-2 font-mono tracking-[0.16em]">{team.inviteCode}</span>
                  </Button>
                </motion.div>
              )}
              {canJoin && (
                <motion.div {...getActionMotion(reduceMotion)} className="w-full sm:w-auto">
                  <Button className="group h-11 w-full justify-between sm:min-w-[210px]" onClick={() => setIsJoinDialogOpen(true)}>
                    Request to Join
                    <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Button>
                </motion.div>
              )}
              <motion.div {...getActionMotion(reduceMotion)} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="group h-11 w-full justify-between bg-transparent transition-colors duration-200 hover:border-primary/25 hover:bg-primary/[0.03] sm:min-w-[210px]"
                  asChild
                >
                  <Link href="/dashboard/teams">
                    Back to Teams
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailMetricCard
              reduceMotion={reduceMotion}
              delay={0.05}
              label="Members"
              value={`${team.memberCount}/${team.maxMembers}`}
              helper={openSeatsLabel}
            />
            <DetailMetricCard
              reduceMotion={reduceMotion}
              delay={0.08}
              label="Stage"
              value={formatTeamStage(team.stage)}
              helper="Current project phase"
            />
            <DetailMetricCard
              reduceMotion={reduceMotion}
              delay={0.11}
              label="Visibility"
              value={formatTeamVisibility(team.visibility)}
              helper={team.visibility === "PUBLIC" ? "Visible in team browser" : "Invite-only access"}
            />
            <DetailMetricCard
              reduceMotion={reduceMotion}
              delay={0.14}
              label="Join Requests"
              value={team.allowJoinRequests ? "Enabled" : "Disabled"}
              helper="Leader-controlled access"
            />
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <motion.section {...getRevealMotion(reduceMotion, 0.04)} className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl tracking-tight">Project Overview</CardTitle>
              <CardDescription>A cleaner summary of the team idea, stack, and workspace rules.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm leading-7 text-foreground/90">{team.bio}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailInfoRow
                  icon={team.visibility === "PUBLIC" ? <Globe2 className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                  label="Visibility"
                  value={formatTeamVisibility(team.visibility)}
                />
                <DetailInfoRow
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Join Requests"
                  value={team.allowJoinRequests ? "Enabled" : "Disabled"}
                />
                <DetailInfoRow
                  icon={<Users className="h-4 w-4" />}
                  label="Seats Remaining"
                  value={String(seatsRemaining)}
                />
                <DetailInfoRow
                  icon={<Layers3 className="h-4 w-4" />}
                  label="Stack"
                  value={team.stack.length > 0 ? `${team.stack.length} technologies added` : "Not added yet"}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl tracking-tight">Team Members</CardTitle>
                <CardDescription>See everyone in the team, their role, and their short bio.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {team.memberCount} members
                </Badge>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {openSeatsLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {team.members.map((member, index) => (
                <motion.div
                  key={member.id}
                  {...getRevealMotion(reduceMotion, 0.06 + index * 0.03)}
                  {...getCardHoverMotion(reduceMotion)}
                >
                  <DetailMemberCard member={member} />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.section>

        <motion.aside {...getRevealMotion(reduceMotion, 0.08)} className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl tracking-tight">Team Leader</CardTitle>
              <CardDescription>The main contact guiding this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-border/60">
                  <AvatarImage src={leader.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>{getAvatarInitial(leader)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{getFullName(leader)}</p>
                  <p className="text-sm text-muted-foreground">Team Leader</p>
                </div>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                {leader.bio?.trim() || "This team leader hasn't added a public bio yet."}
              </p>

              <div className="space-y-3">
                <DetailInfoRow icon={<Mail className="h-4 w-4" />} label="Contact" value={leader.email} />
                {leader.preferredTrack && (
                  <DetailInfoRow
                    icon={<Layers3 className="h-4 w-4" />}
                    label="Preferred Track"
                    value={humanizeLabel(leader.preferredTrack)}
                  />
                )}
                {leader.department && (
                  <DetailInfoRow
                    icon={<Sparkles className="h-4 w-4" />}
                    label="Department"
                    value={humanizeLabel(leader.department)}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl tracking-tight">Team Access</CardTitle>
              <CardDescription>What you can do from this page right now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium text-foreground">{team.memberCount}/{team.maxMembers} members</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary/10">
                  <motion.div
                    className="h-full origin-left rounded-full bg-primary"
                    initial={reduceMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: occupancyRatio }}
                    transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{openSeatsLabel}</p>
              </div>

              {canJoin && (
                <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
                  <p className="text-sm font-medium text-foreground">Ready to join this team?</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Open the request popup, add a short message, and the leader will review your request.
                  </p>
                  <Button className="mt-4 w-full justify-between" onClick={() => setIsJoinDialogOpen(true)}>
                    Request to Join
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {team.hasPendingRequest && (
                <div className="rounded-2xl border border-primary/15 bg-muted/20 p-4">
                  <p className="text-sm font-medium text-foreground">Request pending</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Your join request is already waiting for the team leader, so you don&apos;t need to send another one.
                  </p>
                </div>
              )}

              {canManage && team.inviteCode && (
                <div className="rounded-2xl border border-border/60 bg-muted/15 p-4">
                  <p className="text-sm font-medium text-foreground">Invite Code</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Share this code with students if you want them to join directly.
                  </p>
                  <Button variant="outline" className="mt-4 w-full justify-between bg-transparent" onClick={() => void copyInviteCode()}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-2 font-mono tracking-[0.16em]">{team.inviteCode}</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.aside>
      </div>

      <TeamJoinRequestDialog
        team={team}
        open={isJoinDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeJoinDialog()
        }}
        message={joinMessage}
        onMessageChange={setJoinMessage}
        onSubmit={() => void sendJoinRequest()}
        isSubmitting={isSubmitting}
        title="Request to join"
        description="Share a short note so the team leader can quickly understand why you&apos;re a good fit."
        messageLabel="Message"
        messageId="team-request-message"
        placeholder="I'd love to contribute because..."
        helperTitle="What to mention"
      />
    </div>
  )
}

function DetailMetricCard({
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
      <p className="mt-3 break-words text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{helper}</p>
    </motion.div>
  )
}

function DetailInfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
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

function DetailMemberCard({ member }: { member: ApiTeamMember }) {
  const isLeader = member.teamRole === "LEADER"
  const metadata = [member.user.department, member.user.academicYear, member.user.preferredTrack]
    .filter(Boolean)
    .map((item) => humanizeLabel(item as string))

  return (
    <Card
      className={`group/member h-full border shadow-sm transition-[border-color,background-color,box-shadow] duration-300 hover:shadow-md ${
        isLeader ? "border-primary/25 bg-primary/[0.04]" : "border-border/70 bg-background"
      }`}
    >
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border border-border/60">
            <AvatarImage src={member.user.avatarUrl || "/placeholder.svg"} />
            <AvatarFallback>{getAvatarInitial(member.user)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold">{getFullName(member.user)}</p>
              <Badge variant={isLeader ? "default" : "secondary"} className="rounded-full">
                {isLeader ? "Leader" : formatRoleLabel(member.user.role)}
              </Badge>
            </div>
            <p className="mt-2 break-words text-sm text-muted-foreground">{member.user.email}</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {member.user.bio?.trim() || "No bio added yet."}
        </p>

        {metadata.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {metadata.map((item) => (
              <Badge key={item} variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
                {item}
              </Badge>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="group mt-4 h-10 w-full justify-between rounded-xl bg-transparent px-4 transition-colors duration-200 hover:border-primary/25 hover:bg-primary/[0.03]"
          asChild
        >
          <Link href={`/dashboard/users/${member.user.id}`}>
            View Profile
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function getRevealMotion(reduceMotion: boolean, delay = 0) {
  if (reduceMotion) return {}

  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.52,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }
}

function getCardHoverMotion(reduceMotion: boolean) {
  if (reduceMotion) return {}

  return {
    whileHover: {
      y: -6,
      scale: 1.01,
      transition: {
        duration: 0.24,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
    whileTap: {
      scale: 0.992,
      transition: {
        duration: 0.16,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  }
}

function getActionMotion(reduceMotion: boolean) {
  if (reduceMotion) return {}

  return {
    whileHover: {
      y: -2,
      scale: 1.01,
      transition: {
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
    whileTap: {
      scale: 0.985,
      transition: {
        duration: 0.14,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  }
}

function humanizeLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

