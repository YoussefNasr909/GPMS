"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Globe2,
  Hash,
  Layers3,
  Loader2,
  LockKeyhole,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { ApiRequestError } from "@/lib/api/http"
import { mapApiUserToUiUser } from "@/lib/api/mappers"
import { usersApi } from "@/lib/api/users"
import { LeaderSupervisorsTab, SupervisorRequestInbox } from "./supervisors-panel"
import AdminTeamWorkspace from "./admin-team-workspace"
import { useAuthStore } from "@/lib/stores/auth-store"
import { teamsApi } from "@/lib/api/teams"
import type {
  ApiTeamDetail,
  ApiTeamInvitation,
  ApiTeamJoinRequest,
  ApiTeamMember,
  ApiTeamStage,
  ApiTeamVisibility,
} from "@/lib/api/types"
import { useMyTeamState } from "@/lib/hooks/use-my-team-state"
import { formatRoleLabel, formatTeamStage, formatTeamVisibility, getAvatarInitial, getFullName } from "@/lib/team-display"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const STAGES: ApiTeamStage[] = ["REQUIREMENTS", "DESIGN", "IMPLEMENTATION", "TESTING", "DEPLOYMENT", "MAINTENANCE"]
const STACK_SUGGESTIONS = ["Next.js", "React", "Node.js", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Tailwind CSS"]
const TEAM_SETUP_POINTS = [
  {
    icon: Crown,
    title: "One team space",
    description: "Set up the workspace once and manage the project from one place.",
  },
  {
    icon: UserPlus,
    title: "Invite students",
    description: "Share the invite code or send direct invitations right after setup.",
  },
  {
    icon: ShieldCheck,
    title: "Unlock team pages",
    description: "Tasks, meetings, submissions, and other team workflows stay protected until the team exists.",
  },
]

export default function MyTeamClient() {
  const { currentUser, setCurrentUser, hasHydrated } = useAuthStore()
  const isAdmin = currentUser?.role === "admin"
  const { data, isLoading, error, refresh } = useMyTeamState(hasHydrated && !isAdmin)
  const [joinCode, setJoinCode] = useState("")
  const [joinCodeError, setJoinCodeError] = useState("")
  const [joiningByCode, setJoiningByCode] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [switchingRole, setSwitchingRole] = useState<"" | "member" | "leader">("")
  const isLeader = currentUser?.role === "leader"
  const isStudent = currentUser?.role === "member"
  const isSupervisor = currentUser?.role === "doctor" || currentUser?.role === "ta"

  const joinByCode = async () => {
    setJoinCodeError("")
    setJoiningByCode(true)
    setJoinSuccess(false)
    try {
      await teamsApi.joinByCode(joinCode.trim().toUpperCase())
      setJoinSuccess(true)
      toast.success("You joined the team successfully.")
      setJoinCode("")
      setJoinCodeError("")
      
      setTimeout(async () => {
        await refresh()
        setJoinSuccess(false)
      }, 1500)
    } catch (err: unknown) {
      setJoinCodeError(getJoinCodeErrorMessage(err))
    } finally {
      setJoiningByCode(false)
    }
  }

  const switchRole = async (nextRole: "STUDENT" | "LEADER") => {
    if (!currentUser) return

    const nextUiRole = nextRole === "LEADER" ? "leader" : "member"
    if (currentUser.role === nextUiRole) return

    setSwitchingRole(nextUiRole)
    try {
      const updatedUser = await usersApi.updateMyRole(nextRole)
      setCurrentUser(mapApiUserToUiUser(updatedUser))
      toast.success(
        nextRole === "LEADER"
          ? "You're now set up as a student leader. Create your team to get started."
          : "You're now set up as a student member. Browse teams or join with a code whenever you're ready.",
      )
      await refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't update your role right now.")
    } finally {
      setSwitchingRole("")
    }
  }

  if (!hasHydrated) return <CenteredCard title="Loading your workspace" body="Preparing the right team experience for your role." />
  if (isAdmin) return <AdminTeamWorkspace />
  if (isLoading) return <CenteredCard title="Loading your team" body="Fetching the live team state from the backend." />
  if (error) return <CenteredCard title="Couldn't load your team" body={error} onRetry={refresh} />

  if (isStudent && !data?.team) {
    return (
      <StudentNoTeam
        invitations={data?.receivedInvitations ?? []}
        myJoinRequests={data?.myJoinRequests ?? []}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        joinCodeError={joinCodeError}
        clearJoinCodeError={() => setJoinCodeError("")}
        joiningByCode={joiningByCode}
        onJoinByCode={joinByCode}
        joinSuccess={joinSuccess}
        onBecomeLeader={() => switchRole("LEADER")}
        isSwitchingToLeader={switchingRole === "leader"}
        onRefresh={refresh}
      />
    )
  }

  if (isLeader && !data?.team) {
    return (
      <LeaderNoTeam
        onRefresh={refresh}
        onBecomeMember={() => switchRole("STUDENT")}
        isSwitchingToMember={switchingRole === "member"}
      />
    )
  }

  if (isSupervisor) {
    return (
      <SupervisorRequestInbox
        currentRole={currentUser?.role === "doctor" ? "doctor" : "ta"}
        requests={data?.supervisorRequestsReceived ?? []}
        supervisedTeams={data?.supervisedTeams ?? []}
        onRefresh={refresh}
      />
    )
  }

  if (!data?.team) return <CenteredCard title="No team found" body="There isn't any team data to show right now." />

  const team = data.team

  if (isStudent) {
    return <StudentTeamExperience team={team} currentUserId={currentUser?.id ?? ""} onRefresh={refresh} />
  }

  const pendingRequestsCount = data?.joinRequests?.filter((r) => r.status === "PENDING").length ?? 0
  const pendingInvitesCount = data?.sentInvitations?.filter((inv) => inv.status === "PENDING").length ?? 0

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 xl:p-8">
      <TeamHero team={team} isLeader={Boolean(isLeader)} onRefresh={refresh} />

      <Tabs defaultValue="overview" className="space-y-5">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-12 min-w-max items-center gap-1 rounded-2xl border border-border/70 bg-background/90 p-1.5 shadow-sm">
            <TabsTrigger value="overview" className="h-9 rounded-xl px-4 text-sm font-medium">
              Overview
            </TabsTrigger>
            <TabsTrigger value="members" className="h-9 rounded-xl px-4 text-sm font-medium">
              Members
              <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-bold">
                {team.memberCount}
              </Badge>
            </TabsTrigger>
            {isLeader && (
              <TabsTrigger value="invitations" className="h-9 rounded-xl px-4 text-sm font-medium">
                Invitations
                {pendingInvitesCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
                    {pendingInvitesCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {isLeader && (
              <TabsTrigger value="supervisors" className="h-9 rounded-xl px-4 text-sm font-medium">
                Supervisors
              </TabsTrigger>
            )}
            {isLeader && (
              <TabsTrigger value="requests" className="h-9 rounded-xl px-4 text-sm font-medium">
                Join Requests
                {pendingRequestsCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] rounded-full bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    {pendingRequestsCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {isLeader && (
              <TabsTrigger value="settings" className="h-9 rounded-xl px-4 text-sm font-medium">
                Settings
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          <div className="space-y-4">
            <Card className="overflow-hidden border-border/70 shadow-sm">
              <div className="bg-gradient-to-br from-primary/[0.07] via-background to-transparent px-6 py-6 sm:px-8 sm:py-7">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                      {formatTeamStage(team.stage)}
                    </Badge>
                    <Badge variant="secondary">{formatTeamVisibility(team.visibility)}</Badge>
                    <Badge variant="outline">{team.memberCount}/{team.maxMembers} members</Badge>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">{team.name}</h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{team.bio}</p>
                </div>
                {team.stack.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {team.stack.map((tech) => (
                      <Badge key={tech} variant="secondary" className="rounded-full">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                <Stat label="Members" value={`${team.memberCount}/${team.maxMembers}`} />
                <Stat label="Stage" value={formatTeamStage(team.stage)} />
                <Stat label="Visibility" value={formatTeamVisibility(team.visibility)} />
                <Stat label="Join Requests" value={team.allowJoinRequests ? "Enabled" : "Disabled"} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-0">
          <MembersCard team={team} onRefresh={refresh} />
        </TabsContent>

        {isLeader && (
          <TabsContent value="invitations" className="mt-0">
            <InvitationsCard team={team} invitations={data.sentInvitations} onRefresh={refresh} />
          </TabsContent>
        )}

        {isLeader && (
          <TabsContent value="supervisors" className="mt-0">
            <LeaderSupervisorsTab team={team} requests={data.supervisorRequestsSent} onRefresh={refresh} />
          </TabsContent>
        )}

        {isLeader && (
          <TabsContent value="requests" className="mt-0">
            <JoinRequestsCard requests={data.joinRequests} onRefresh={refresh} />
          </TabsContent>
        )}

        {isLeader && (
          <TabsContent value="settings" className="mt-0">
            <SettingsCard team={team} onRefresh={refresh} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function getJoinCodeErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === "TEAM_NOT_FOUND") {
      return "We couldn't find a team with that invite code. Check the code and try again."
    }

    if (error.code === "TEAM_FULL") {
      return "That team is already full right now. Try another team or ask the leader for an update."
    }

    if (error.code === "ALREADY_IN_TEAM") {
      return "You're already in a team, so you can't join another one with a code."
    }
  }

  return error instanceof Error ? error.message : "That invite code didn't work. Please try again."
}

function getInviteErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === "INVITE_TARGET_LEADER") {
      return "This user is already a team leader. Ask them to switch to Student Member before inviting them."
    }

    if (error.code === "INVITE_TARGET_NOT_STUDENT") {
      return "Only Student Member accounts can be invited to a team."
    }

    if (error.code === "INVITE_TARGET_INACTIVE") {
      return "This student account is inactive. Ask them to reactivate it before sending an invitation."
    }
  }

  return error instanceof Error ? error.message : "Couldn't send that invitation."
}

function StudentTeamExperience({
  team,
  currentUserId,
  onRefresh,
}: {
  team: ApiTeamDetail
  currentUserId: string
  onRefresh: () => Promise<void>
}) {
  const reduceMotion = Boolean(useReducedMotion())
  const [busy, setBusy] = useState("")
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const sortedMembers = [...team.members].sort((left, right) => {
    if (left.teamRole === right.teamRole) return left.user.firstName.localeCompare(right.user.firstName)
    return left.teamRole === "LEADER" ? -1 : 1
  })
  const leaderMember = sortedMembers.find((member) => member.teamRole === "LEADER")
  const leader = leaderMember?.user ?? team.leader
  const currentMember = sortedMembers.find((member) => member.user.id === currentUserId)
  const seatsRemaining = Math.max(team.maxMembers - team.memberCount, 0)
  const occupancyRatio = team.maxMembers > 0 ? team.memberCount / team.maxMembers : 0
  const openSeatsLabel = seatsRemaining === 0 ? "Full team" : `${seatsRemaining} open ${seatsRemaining === 1 ? "seat" : "seats"}`

  const leaveTeam = async () => {
    setBusy("leave")
    try {
      await teamsApi.leave(team.id)
      toast.success("You left the team.")
      setIsLeaveDialogOpen(false)
      await onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't leave the team.")
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="mx-auto w-full max-w-none space-y-6 p-4 md:p-6 xl:p-8">
      <motion.section
        {...getRevealMotion(reduceMotion)}
        className="rounded-[28px] border border-border/70 bg-background shadow-sm"
      >
        <div className="space-y-5 p-5 sm:p-6 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  My Team
                </Badge>
                <Badge variant="outline">{formatTeamStage(team.stage)}</Badge>
                <Badge variant="secondary">{formatTeamVisibility(team.visibility)}</Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{team.name}</h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{team.bio}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
              <motion.div {...getActionMotion(reduceMotion)} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="group h-11 w-full border-border/70 bg-transparent text-foreground transition-[color,border-color,background-color] duration-200 hover:border-destructive/45 hover:bg-destructive/[0.08] hover:text-destructive sm:min-w-[190px]"
                  onClick={() => setIsLeaveDialogOpen(true)}
                  disabled={busy === "leave"}
                >
                  {busy === "leave" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  )}
                  <span className="ml-2">Leave Team</span>
                </Button>
              </motion.div>
            </div>
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

          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            <StudentMetricCard
              reduceMotion={reduceMotion}
              delay={0.05}
              label="Members"
              value={`${team.memberCount}/${team.maxMembers}`}
              helper={openSeatsLabel}
            />
            <StudentMetricCard
              reduceMotion={reduceMotion}
              delay={0.08}
              label="Stage"
              value={formatTeamStage(team.stage)}
              helper="Current project phase"
            />
            <StudentMetricCard
              reduceMotion={reduceMotion}
              delay={0.11}
              label="Visibility"
              value={formatTeamVisibility(team.visibility)}
              helper={team.visibility === "PUBLIC" ? "Visible in team browser" : "Invite-only access"}
            />
            <StudentMetricCard
              reduceMotion={reduceMotion}
              delay={0.14}
              label="Your Role"
              value={currentMember?.teamRole === "LEADER" ? "Leader" : "Member"}
              helper="Active inside this workspace"
            />
          </div>
        </div>
      </motion.section>

      <div className="space-y-6">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <motion.section {...getRevealMotion(reduceMotion, 0.04)} {...getPanelMotion(reduceMotion)} className="min-w-0 space-y-6">
            <Card className="group/panel border-border/70 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/15 hover:shadow-md">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl tracking-tight">About This Team</CardTitle>
                <CardDescription>The essential project and workspace details in one place.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <motion.div
                  {...getInsetMotion(reduceMotion)}
                  className="rounded-3xl border border-border/60 bg-muted/20 p-4 transition-colors duration-300 group-hover/panel:bg-muted/30"
                >
                  <p className="text-sm leading-7 text-foreground/90">{team.bio}</p>
                </motion.div>

                <motion.div
                  {...getInsetMotion(reduceMotion)}
                  className="rounded-3xl border border-border/60 bg-muted/20 p-4 transition-colors duration-300 group-hover/panel:bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium text-foreground">
                      {team.memberCount}/{team.maxMembers} members
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-primary/10">
                    <motion.div
                      className="h-full origin-left rounded-full bg-primary"
                      initial={reduceMotion ? false : { scaleX: 0 }}
                      animate={{ scaleX: occupancyRatio }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.42,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.08,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{openSeatsLabel}</p>
                </motion.div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <StudentInfoRow
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="Join Requests"
                    value={team.allowJoinRequests ? "Enabled" : "Disabled"}
                  />
                  <StudentInfoRow
                    icon={
                      team.visibility === "PUBLIC" ? (
                        <Globe2 className="h-4 w-4" />
                      ) : (
                        <LockKeyhole className="h-4 w-4" />
                      )
                    }
                    label="Visibility"
                    value={formatTeamVisibility(team.visibility)}
                  />
                  <StudentInfoRow
                    icon={<Users className="h-4 w-4" />}
                    label="Seats Remaining"
                    value={String(seatsRemaining)}
                  />
                  <StudentInfoRow
                    icon={<Layers3 className="h-4 w-4" />}
                    label="Stack"
                    value={team.stack.length > 0 ? `${team.stack.length} tools added` : "Stack not added yet"}
                  />
                </div>
              </CardContent>
            </Card>

            <motion.section {...getRevealMotion(reduceMotion, 0.1)} className="w-full">
              <Card className="border-border/70 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/15 hover:shadow-md">
                <CardHeader className="space-y-2">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl tracking-tight">Team Members</CardTitle>
                      <CardDescription>Everyone currently building in this workspace.</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {team.memberCount} members
                      </Badge>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {openSeatsLabel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {sortedMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      {...getRevealMotion(reduceMotion, 0.06 + index * 0.03)}
                      {...getCardHoverMotion(reduceMotion)}
                    >
                      <StudentMemberCard member={member} isCurrentUser={member.user.id === currentUserId} />
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.section>
          </motion.section>

          <motion.aside {...getRevealMotion(reduceMotion, 0.08)} {...getPanelMotion(reduceMotion)} className="space-y-6">
            <Card className="group/panel border-border/70 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/15 hover:shadow-md">
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl tracking-tight">Team Leader</CardTitle>
                <CardDescription>The main contact guiding this workspace.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border border-border/60 transition-transform duration-300 group-hover/panel:-translate-y-0.5 group-hover/panel:scale-[1.03]">
                    <AvatarImage src={leader.avatarUrl || "/placeholder.svg"} />
                    <AvatarFallback>{getAvatarInitial(leader)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">{getFullName(leader)}</p>
                    <p className="text-sm text-muted-foreground">Leading this workspace</p>
                  </div>
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {leader.bio?.trim() || "Your team leader hasn't added a public bio yet."}
                </p>

                <div className="space-y-3">
                  <StudentInfoRow icon={<Mail className="h-4 w-4" />} label="Contact" value={leader.email} />
                  {leader.preferredTrack && (
                    <StudentInfoRow
                      icon={<Layers3 className="h-4 w-4" />}
                      label="Preferred Track"
                      value={humanizeLabel(leader.preferredTrack)}
                    />
                  )}
                  {leader.department && (
                    <StudentInfoRow
                      icon={<Sparkles className="h-4 w-4" />}
                      label="Department"
                      value={humanizeLabel(leader.department)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {team.doctor ? (
              <Card className="group/panel border-border/70 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/15 hover:shadow-md">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg tracking-tight">Project Doctor</CardTitle>
                  </div>
                  <CardDescription>The primary supervisor for your graduation project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-border/60 transition-transform duration-300 group-hover/panel:-translate-y-0.5 group-hover/panel:scale-[1.03]">
                      <AvatarImage src={team.doctor.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback>{getAvatarInitial(team.doctor)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{getFullName(team.doctor)}</p>
                      <p className="text-xs text-muted-foreground">Assigned Supervisor</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <StudentInfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={team.doctor.email} />
                    {team.doctor.department && (
                      <StudentInfoRow
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                        label="Department"
                        value={humanizeLabel(team.doctor.department)}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-border/70 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                    <ShieldCheck className="h-6 w-6 opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground/80">No Doctor Assigned</p>
                    <p className="text-xs text-muted-foreground">
                      Your team doesn't have an assigned Doctor yet.
                    </p>
                  </div>
                  {currentMember?.teamRole === "LEADER" && (
                    <Button variant="outline" size="sm" className="h-9 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" asChild>
                      <Link href="/dashboard/proposals">
                        <UserPlus className="mr-2 h-3.5 w-3.5" />
                        Invite Doctor
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {team.ta ? (
              <Card className="group/panel border-border/70 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-primary/15 hover:shadow-md">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-lg tracking-tight">Teaching Assistant</CardTitle>
                  </div>
                  <CardDescription>Assisting in your project's technical guidance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-border/60 transition-transform duration-300 group-hover/panel:-translate-y-0.5 group-hover/panel:scale-[1.03]">
                      <AvatarImage src={team.ta.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback>{getAvatarInitial(team.ta)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{getFullName(team.ta)}</p>
                      <p className="text-xs text-muted-foreground">Assigned TA</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <StudentInfoRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={team.ta.email} />
                    {team.ta.department && (
                      <StudentInfoRow
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                        label="Department"
                        value={humanizeLabel(team.ta.department)}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-border/70 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
                    <Users className="h-6 w-6 opacity-40" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground/80">No TA Assigned</p>
                    <p className="text-xs text-muted-foreground">
                      Your team doesn't have an assigned TA yet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.aside>
        </div>
      </div>

      <LeaveTeamDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        teamName={team.name}
        isSubmitting={busy === "leave"}
        onConfirm={leaveTeam}
      />
    </div>
  )
}

function TeamHero({ team, isLeader, onRefresh }: { team: ApiTeamDetail; isLeader: boolean; onRefresh: () => Promise<void> }) {
  const [busy, setBusy] = useState("")
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

  const copyCode = async () => {
    if (!team.inviteCode) return
    await navigator.clipboard.writeText(team.inviteCode)
    toast.success("Invite code copied.")
  }

  const leaveTeam = async () => {
    setBusy("leave")
    try {
      await teamsApi.leave(team.id)
      toast.success("You left the team.")
      setIsLeaveDialogOpen(false)
      await onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't leave the team.")
    } finally {
      setBusy("")
    }
  }

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <div className="bg-gradient-to-br from-primary/[0.09] via-background to-transparent">
        <div className="flex flex-col gap-5 p-5 sm:p-6 md:p-7 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: team info */}
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                <Crown className="mr-1.5 h-3 w-3" />
                My Team
              </Badge>
              <Badge variant="outline">{formatTeamStage(team.stage)}</Badge>
              <Badge variant="secondary">{formatTeamVisibility(team.visibility)}</Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {team.memberCount}/{team.maxMembers} members
              </Badge>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{team.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{team.bio}</p>
            </div>
            {team.stack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {team.stack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="rounded-full text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Right: leader card + actions */}
          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
              <Avatar className="h-10 w-10 border border-border/60">
                <AvatarImage src={team.leader.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-sm font-semibold">{getAvatarInitial(team.leader)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{getFullName(team.leader)}</p>
                <p className="text-xs text-muted-foreground">Team Leader</p>
              </div>
            </div>

            {isLeader && team.inviteCode && (
              <div className="flex items-center gap-2">
                <div className="flex h-10 items-center rounded-xl border border-border/60 bg-background/70 px-3 font-mono text-sm tracking-[0.2em]">
                  {team.inviteCode}
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/60" onClick={() => void copyCode()}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {!isLeader && team.permissions.canLeave && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-border/60 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                onClick={() => setIsLeaveDialogOpen(true)}
                disabled={busy === "leave"}
              >
                {busy === "leave" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                <span className="ml-2">Leave Team</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <LeaveTeamDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        teamName={team.name}
        isSubmitting={busy === "leave"}
        onConfirm={leaveTeam}
      />
    </Card>
  )
}

function MembersCard({ team, onRefresh }: { team: ApiTeamDetail; onRefresh: () => Promise<void> }) {
  const [removingId, setRemovingId] = useState<string>("")
  const [memberToRemove, setMemberToRemove] = useState<ApiTeamMember | null>(null)
  const reduceMotion = Boolean(useReducedMotion())

  const removeMember = async () => {
    if (!memberToRemove) return

    const memberId = memberToRemove.user.id
    const memberName = getFullName(memberToRemove.user)

    setRemovingId(memberId)
    try {
      await teamsApi.removeMember(team.id, memberId)
      toast.success(`${memberName} was removed from the team.`)
      setMemberToRemove(null)
      try {
        await onRefresh()
      } catch {
        toast.error("Member removed, but we couldn't refresh the latest team state.")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove that member.")
    } finally {
      setRemovingId("")
    }
  }

  return (
    <>
      <Card className="overflow-hidden border-none bg-muted/30 shadow-none ring-1 ring-border/50">
        <CardHeader className="border-b bg-background/50 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Team Members</CardTitle>
              <CardDescription>See who is in the team, review their bios, and manage membership safely.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6 sm:p-8">
          {team.members.map((member, index) => {
            const name = getFullName(member.user)
            const isLeader = member.teamRole === "LEADER"
            const isRemoving = removingId === member.user.id

            return (
              <motion.div
                key={member.id}
                {...getRevealMotion(reduceMotion, 0.02 + index * 0.03)}
                className="rounded-[24px] border border-border/60 bg-background p-5 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <Avatar className="h-12 w-12 border border-border/60">
                      <AvatarImage src={member.user.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback>{getAvatarInitial(member.user)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-semibold tracking-tight">{name}</p>
                        <Badge variant={isLeader ? "default" : "secondary"}>
                          {isLeader ? "Leader" : formatRoleLabel(member.user.role)}
                        </Badge>
                      </div>
                      <p className="mt-1 break-words text-sm text-muted-foreground">{member.user.email}</p>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {member.user.bio?.trim() || "No bio added yet."}
                      </p>
                    </div>
                  </div>

                  {team.permissions.canRemoveMembers && !isLeader && (
                    <Button
                      className="w-full rounded-xl md:w-auto"
                      variant="outline"
                      disabled={isRemoving}
                      onClick={() => setMemberToRemove(member)}
                    >
                      {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                      <span className="ml-2">Remove</span>
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </CardContent>
      </Card>

      <RemoveMemberDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => {
          if (!open && !removingId) setMemberToRemove(null)
        }}
        member={memberToRemove}
        teamName={team.name}
        isSubmitting={Boolean(removingId)}
        onConfirm={removeMember}
      />
    </>
  )
}

function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  teamName,
  isSubmitting,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: ApiTeamMember | null
  teamName: string
  isSubmitting: boolean
  onConfirm: () => Promise<void>
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md overflow-hidden rounded-[28px] border-border/70 p-0">
        <div className="p-5 sm:p-6">
          <AlertDialogHeader className="space-y-4 text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <UserMinus className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl tracking-tight">Remove team member?</AlertDialogTitle>
              <AlertDialogDescription className="leading-6">
                {member ? (
                  <>
                    Remove <span className="font-medium text-foreground">{getFullName(member.user)}</span> from <span className="font-medium text-foreground">{teamName}</span>.
                  </>
                ) : null}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          {member && (
            <>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <Avatar className="h-12 w-12 border border-border/60">
                  <AvatarImage src={member.user.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>{getAvatarInitial(member.user)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{getFullName(member.user)}</p>
                  <p className="break-words text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-destructive/15 bg-destructive/[0.03] p-4">
                <p className="text-sm font-medium text-foreground">What happens next</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This member will lose access to the team workspace and its protected pages. You can invite them again later if needed.
                </p>
              </div>
            </>
          )}

          <AlertDialogFooter className="mt-6 gap-3 sm:gap-3">
            <Button type="button" variant="outline" className="h-11" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
              Keep Member
            </Button>
            <Button
              type="button"
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void onConfirm()}
              disabled={!member || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
              <span className="ml-2">Remove Member</span>
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
function InvitationsCard({ team, invitations, onRefresh }: { team: ApiTeamDetail; invitations: ApiTeamInvitation[]; onRefresh: () => Promise<void> }) {
  const [email, setEmail] = useState<string>("")
  const [academicId, setAcademicId] = useState<string>("")
  const [busy, setBusy] = useState<"email" | "academicId" | "">("")
  const [success, setSuccess] = useState<"email" | "academicId" | "">("")
  const [error, setError] = useState<{ mode: "email" | "academicId" | ""; message: string }>({ mode: "", message: "" })
  const [busyInvitationId, setBusyInvitationId] = useState("")
  const [invitationToCancel, setInvitationToCancel] = useState<ApiTeamInvitation | null>(null)

  const invite = async (mode: "email" | "academicId") => {
    if (busy) return
    setBusy(mode)
    setError({ mode: "", message: "" })
    try {
      if (mode === "email") {
        const trimmedEmail = email.trim().toLowerCase()
        if (!trimmedEmail.includes("@")) {
          setError({ mode: "email", message: "Please enter a valid email address." })
          setBusy("")
          return
        }
        await teamsApi.invite(team.id, { email: trimmedEmail })
      } else {
        const trimmedId = academicId.trim().toUpperCase()
        if (!trimmedId) {
          setError({ mode: "academicId", message: "Please enter an academic ID." })
          setBusy("")
          return
        }
        await teamsApi.invite(team.id, { academicId: trimmedId })
      }

      setSuccess(mode)
      toast.success("Invitation sent successfully.")
      setEmail("")
      setAcademicId("")

      setTimeout(async () => {
        await onRefresh()
        setSuccess("")
      }, 1500)
    } catch (err: unknown) {
      const message = getInviteErrorMessage(err)
      setError({ mode, message })
      toast.error(message)
    } finally {
      setBusy("")
    }
  }

  const cancelInvitation = async () => {
    if (!invitationToCancel || busyInvitationId) return

    setBusyInvitationId(invitationToCancel.id)
    try {
      await teamsApi.cancelInvitation(invitationToCancel.id)
      toast.success("Invitation canceled.")
      setInvitationToCancel(null)
      try {
        await onRefresh()
      } catch {
        toast.error("Invitation canceled, but we couldn't refresh the latest team state.")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't cancel that invitation.")
    } finally {
      setBusyInvitationId("")
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <Card className="border-none bg-muted/30 shadow-none ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="border-b bg-background/50 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Send Invitations</CardTitle>
              <CardDescription>Invite registered GPMS students to your team.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="space-y-4">
            <Label className="text-sm font-bold tracking-wide">Invite by Email</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input 
                  value={email} 
                  className={`h-12 pl-11 rounded-xl bg-background border-border/60 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 ${
                    error.mode === "email" ? "border-destructive ring-1 ring-destructive" : ""
                  }`} 
                  placeholder="student@university.edu" 
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error.mode === "email") setError({ mode: "", message: "" })
                  }} 
                />
              </div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  className={`h-12 w-full sm:w-auto sm:min-w-[140px] rounded-xl font-bold shadow-lg transition-all ${
                    success === "email" ? "bg-green-500 hover:bg-green-600 shadow-green-200" : "shadow-primary/10"
                  }`} 
                  disabled={!email.trim() || !!busy || success === "email"} 
                  onClick={() => void invite("email")}
                >
                  <AnimatePresence mode="wait">
                    {busy === "email" ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </motion.div>
                    ) : success === "email" ? (
                      <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Sent</span>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Send Invite</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
            <AnimatePresence>
              {error.mode === "email" && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-medium text-destructive mt-1 flex items-center gap-1.5 px-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {error.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-muted/30 px-2 text-muted-foreground font-bold tracking-widest">OR</span></div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-bold tracking-wide">Invite by Academic ID</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <ShieldCheck className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input 
                  value={academicId} 
                  className={`h-12 pl-11 rounded-xl bg-background border-border/60 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 font-mono tracking-wider ${
                    error.mode === "academicId" ? "border-destructive ring-1 ring-destructive" : ""
                  }`} 
                  placeholder="CS2021014" 
                  onChange={(e) => {
                    setAcademicId(e.target.value.toUpperCase())
                    if (error.mode === "academicId") setError({ mode: "", message: "" })
                  }} 
                />
              </div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  className={`h-12 w-full sm:w-auto sm:min-w-[140px] rounded-xl font-bold shadow-lg transition-all ${
                    success === "academicId" ? "bg-green-500 hover:bg-green-600 shadow-green-200" : "shadow-primary/10"
                  }`} 
                  disabled={!academicId.trim() || !!busy || success === "academicId"} 
                  onClick={() => void invite("academicId")}
                >
                  <AnimatePresence mode="wait">
                    {busy === "academicId" ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </motion.div>
                    ) : success === "academicId" ? (
                      <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Sent</span>
                      </motion.div>
                    ) : (
                      <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Invite ID</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
            <AnimatePresence>
              {error.mode === "academicId" && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-medium text-destructive mt-1 flex items-center gap-1.5 px-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {error.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-muted/30 shadow-none ring-1 ring-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">Pending Invitations</CardTitle>
          <CardDescription>Students who haven&apos;t joined yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center text-muted-foreground/30 ring-1 ring-border/50 mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground max-w-[180px]">No pending invitations at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((item) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="group relative flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs">
                    {getAvatarInitial(item.invitedUser)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{getFullName(item.invitedUser)}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.invitedUser.email}</p>
                  </div>
                  <div className="ml-auto flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                    <Badge variant="secondary" className="bg-slate-100/80 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300 text-[10px] font-bold">
                      PENDING
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl border-border/60 bg-background text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/60 dark:hover:text-slate-100"
                      disabled={busyInvitationId === item.id}
                      onClick={() => setInvitationToCancel(item)}
                    >
                      {busyInvitationId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      <span className="ml-1.5">Cancel</span>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(invitationToCancel)}
        onOpenChange={(open) => {
          if (!open && !busyInvitationId) setInvitationToCancel(null)
        }}
      >
        <AlertDialogContent className="max-w-md overflow-hidden rounded-[28px] border-border/70 p-0">
          <div className="p-5 sm:p-6">
            <AlertDialogHeader className="space-y-4 text-left">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-2xl tracking-tight">Cancel invitation?</AlertDialogTitle>
                <AlertDialogDescription className="leading-6">
                  {invitationToCancel ? (
                    <>
                      Remove the pending invitation for <span className="font-medium text-foreground">{getFullName(invitationToCancel.invitedUser)}</span> from <span className="font-medium text-foreground">{team.name}</span>.
                    </>
                  ) : null}
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800/70 dark:bg-slate-950/40">
              <p className="text-sm font-medium text-foreground">What happens next</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {invitationToCancel ? (
                  <>
                    This removes the invitation from <span className="font-medium text-foreground">{getFullName(invitationToCancel.invitedUser)}</span>&apos;s inbox. You can invite them again later if needed.
                  </>
                ) : null}
              </p>
            </div>

            <AlertDialogFooter className="mt-6 gap-3 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={busyInvitationId === invitationToCancel?.id}
                onClick={() => {
                  if (!busyInvitationId) setInvitationToCancel(null)
                }}
              >
                Keep Invitation
              </Button>
              <Button
                type="button"
                className="h-11 bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-950 dark:hover:bg-slate-100"
                onClick={() => void cancelInvitation()}
                disabled={!invitationToCancel || busyInvitationId === invitationToCancel?.id}
              >
                {busyInvitationId === invitationToCancel?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="ml-2">Cancel Invitation</span>
              </Button>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function JoinRequestsCard({ requests, onRefresh }: { requests: ApiTeamJoinRequest[]; onRefresh: () => Promise<void> }) {
  const [busyId, setBusyId] = useState<string>("")
  const [requestDecision, setRequestDecision] = useState<{
    id: string
    action: "approve" | "reject"
    requesterName: string
    requesterEmail: string
    message: string | null
  } | null>(null)

  const openRequestDecision = (request: ApiTeamJoinRequest, action: "approve" | "reject") => {
    setRequestDecision({
      id: request.id,
      action,
      requesterName: getFullName(request.user),
      requesterEmail: request.user.email,
      message: request.message,
    })
  }

  const decide = async (id: string, action: "approve" | "reject") => {
    setBusyId(id)
    try {
      if (action === "approve") await teamsApi.approveJoinRequest(id)
      else await teamsApi.rejectJoinRequest(id)
      toast.success(action === "approve" ? "Join request approved." : "Join request rejected.")
      setRequestDecision(null)
      await onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't update that request.")
    } finally {
      setBusyId("")
    }
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl tracking-tight">Join Requests</CardTitle>
            <CardDescription>Students asking to join your team. Review each request carefully.</CardDescription>
          </div>
          {requests.length > 0 && (
            <Badge variant="secondary" className="shrink-0">{requests.length} pending</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-border/60 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium">No pending requests</p>
            <p className="mt-1 text-xs text-muted-foreground">When students request to join your team, they'll appear here for review.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="overflow-hidden rounded-[20px] border border-border/60 bg-background shadow-sm">
              <div className="h-0.5 w-full bg-gradient-to-r from-primary/40 to-primary/10" />
              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-primary/10 text-sm font-bold text-primary">
                    {getAvatarInitial(request.user)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-5">{getFullName(request.user)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{request.user.email}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
                    Pending
                  </Badge>
                </div>
                {request.message && (
                  <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Message</p>
                    <p className="text-sm leading-5 text-foreground/80">{request.message}</p>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl"
                    disabled={busyId === request.id}
                    onClick={() => openRequestDecision(request, "approve")}
                  >
                    {busyId === request.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    <span className="ml-1.5">Approve</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl border-border/60"
                    disabled={busyId === request.id}
                    onClick={() => openRequestDecision(request, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <AlertDialog
        open={Boolean(requestDecision)}
        onOpenChange={(open) => {
          if (!open && !busyId) setRequestDecision(null)
        }}
      >
        <AlertDialogContent className="max-w-md overflow-hidden rounded-[28px] border-border/70 p-0">
          <div className="p-5 sm:p-6">
            <AlertDialogHeader className="space-y-4 text-left">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${requestDecision?.action === "approve" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-200"}`}>
                {requestDecision?.action === "approve" ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-2xl tracking-tight">{requestDecision?.action === "approve" ? "Approve join request?" : "Reject join request?"}</AlertDialogTitle>
                <AlertDialogDescription className="leading-6">
                  {requestDecision?.action === "approve"
                    ? `${requestDecision?.requesterName} will be added to your team immediately after approval.`
                    : `${requestDecision?.requesterName} will be removed from the pending requests list. They can still send another request later.`}
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="font-medium">{requestDecision?.requesterName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{requestDecision?.requesterEmail}</p>
              {requestDecision?.message ? (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{requestDecision.message}</p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">No message was included with this request.</p>
              )}
            </div>

            <AlertDialogFooter className="mt-6 gap-3 sm:gap-3">
              <AlertDialogCancel className="h-11" disabled={busyId === requestDecision?.id} onClick={() => { if (!busyId) setRequestDecision(null) }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className={`h-11 ${requestDecision?.action === "approve" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-950 dark:hover:bg-slate-100"}`}
                onClick={(event) => {
                  event.preventDefault()
                  if (requestDecision) void decide(requestDecision.id, requestDecision.action)
                }}
                disabled={!requestDecision || busyId === requestDecision?.id}
              >
                {busyId === requestDecision?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : requestDecision?.action === "approve" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span className="ml-2">{requestDecision?.action === "approve" ? "Approve Request" : "Reject Request"}</span>
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function SettingsCard({ team, onRefresh }: { team: ApiTeamDetail; onRefresh: () => Promise<void> }) {
  const [form, setForm] = useState<{
    name: string
    bio: string
    maxMembers: string
    visibility: ApiTeamVisibility
    allowJoinRequests: string
    stage: ApiTeamStage
    stack: string
  }>({
    name: team.name,
    bio: team.bio,
    maxMembers: String(team.maxMembers),
    visibility: team.visibility,
    allowJoinRequests: String(team.allowJoinRequests),
    stage: team.stage,
    stack: team.stack.join(", "),
  })
  const [busy, setBusy] = useState("")

  const save = async () => {
    setBusy("save")
    try {
      await teamsApi.update(team.id, {
        name: form.name,
        bio: form.bio,
        maxMembers: Number(form.maxMembers),
        visibility: form.visibility as ApiTeamVisibility,
        allowJoinRequests: form.allowJoinRequests === "true",
        stage: form.stage as ApiTeamStage,
        stack: form.stack.split(",").map((item) => item.trim()).filter(Boolean),
      })
      toast.success("Team settings updated.")
      await onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the settings.")
    } finally {
      setBusy("")
    }
  }

  const removeTeam = async () => {
    if (!window.confirm(`Delete ${team.name}? This removes the team, members, and invitations.`)) return
    setBusy("delete")
    try {
      await teamsApi.delete(team.id)
      toast.success("Team deleted.")
      await onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete the team.")
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Main settings */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Team Settings</CardTitle>
              <CardDescription>Update the live team information and configuration.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Team Name">
              <Input
                value={form.name}
                className="h-11 rounded-xl bg-background border-border/60"
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              />
            </Field>
            <Field label="Maximum Members">
              <Select
                value={form.maxMembers}
                onValueChange={(value) => setForm((c) => ({ ...c, maxMembers: value }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["3", "4", "5", "6"].map((value) => (
                    <SelectItem key={value} value={value}>{value} members</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Team Bio">
            <Textarea
              rows={4}
              value={form.bio}
              className="rounded-xl bg-background border-border/60 resize-none"
              onChange={(e) => setForm((c) => ({ ...c, bio: e.target.value }))}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Visibility">
              <Select
                value={form.visibility}
                onValueChange={(value) => setForm((c) => ({ ...c, visibility: value as ApiTeamVisibility }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Join Requests">
              <Select
                value={form.allowJoinRequests}
                onValueChange={(value) => setForm((c) => ({ ...c, allowJoinRequests: value }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Stage">
              <Select
                value={form.stage}
                onValueChange={(value) => setForm((c) => ({ ...c, stage: value as ApiTeamStage }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-background border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>{formatTeamStage(stage)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Tech Stack">
            <Input
              value={form.stack}
              className="h-11 rounded-xl bg-background border-border/60 font-mono"
              placeholder="React, Node.js, PostgreSQL, Tailwind CSS…"
              onChange={(e) => setForm((c) => ({ ...c, stack: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">Separate technologies with commas.</p>
          </Field>

          <div className="flex justify-end border-t border-border/50 pt-4">
            <Button
              className="h-11 rounded-xl px-6"
              onClick={() => void save()}
              disabled={!!busy}
            >
              {busy === "save" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              <span className="ml-2">Save Changes</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/25 shadow-sm">
        <CardHeader className="border-b border-destructive/15 bg-destructive/[0.03] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible team actions.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="rounded-2xl border border-destructive/15 bg-destructive/[0.03] p-4">
            <p className="text-sm font-medium">Delete this team</p>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Permanently removes the team, all members, invitations, and join requests. This cannot be undone.
            </p>
          </div>
          <Button
            className="w-full rounded-xl"
            variant="destructive"
            disabled={!!busy}
            onClick={() => void removeTeam()}
          >
            {busy === "delete" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="ml-2">Delete Team</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function StudentNoTeam({
  invitations,
  myJoinRequests,
  joinCode,
  setJoinCode,
  joinCodeError,
  clearJoinCodeError,
  joiningByCode,
  joinSuccess,
  onJoinByCode,
  onBecomeLeader,
  isSwitchingToLeader,
  onRefresh,
}: {
  invitations: ApiTeamInvitation[]
  myJoinRequests: ApiTeamJoinRequest[]
  joinCode: string
  setJoinCode: (value: string) => void
  joinCodeError: string
  clearJoinCodeError: () => void
  joiningByCode: boolean
  joinSuccess: boolean
  onJoinByCode: () => Promise<void>
  onBecomeLeader: () => Promise<void>
  isSwitchingToLeader: boolean
  onRefresh: () => Promise<void>
}) {
  const [busyInvitationId, setBusyInvitationId] = useState("")
  const [invitationDecision, setInvitationDecision] = useState<{
    id: string
    teamName: string
    inviterName: string
    action: "accept" | "decline"
  } | null>(null)

  const openInvitationDecision = (invitation: ApiTeamInvitation, action: "accept" | "decline") => {
    setInvitationDecision({
      id: invitation.id,
      teamName: invitation.team.name,
      inviterName: getFullName(invitation.invitedBy),
      action,
    })
  }

  const respond = async (id: string, action: "accept" | "decline") => {
    setBusyInvitationId(id)
    try {
      if (action === "accept") await teamsApi.acceptInvitation(id)
      else await teamsApi.declineInvitation(id)
      toast.success(action === "accept" ? "Invitation accepted." : "Invitation declined.")
      setInvitationDecision(null)
      try {
        await onRefresh()
      } catch {
        toast.error("Invitation updated, but we couldn't refresh the latest team state.")
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't update that invitation.")
    } finally {
      setBusyInvitationId("")
    }
  }

  const reduceMotion = Boolean(useReducedMotion())

  const stagger = (i: number) => ({
    initial: reduceMotion ? {} : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? {} : { duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  })

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6 xl:p-8">

      {/* ── Hero ──────────────────────────────────────── */}
      <motion.div {...stagger(0)} className="space-y-2">
        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary text-xs font-semibold">
          Student Member
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find your team</h1>
        <p className="max-w-lg text-base leading-7 text-muted-foreground">
          Browse open teams, enter an invite code, or accept a direct invitation.
        </p>
      </motion.div>

      {/* ── Invitations — always visible ──────────────── */}
      <motion.section {...stagger(1)}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold">Team Invitations</p>
          </div>
          {invitations.length > 0 && (
            <Badge className="border border-primary/20 bg-primary/10 text-primary text-[10px] font-semibold">
              {invitations.length} pending
            </Badge>
          )}
        </div>

        <AnimatePresence mode="wait">
          {invitations.length === 0 ? (
            <motion.div
              key="empty"
              initial={reduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-5 py-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">No pending invitations</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  When a team leader invites you, it will appear here for you to accept or decline.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="filled"
              initial={reduceMotion ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {invitations.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background p-5 shadow-sm transition-all duration-200 hover:border-primary/35 hover:shadow-md"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/70 via-primary/30 to-transparent" />

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{formatTeamVisibility(item.team.visibility)}</Badge>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {item.team.memberCount}/{item.team.maxMembers} members
                    </Badge>
                  </div>

                  <h3 className="font-bold text-sm leading-snug tracking-tight">{item.team.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-2">{item.team.bio}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                      {getAvatarInitial(item.invitedBy)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From <span className="font-semibold text-foreground">{getFullName(item.invitedBy)}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="h-9 flex-1 rounded-xl"
                      disabled={busyInvitationId === item.id}
                      onClick={() => openInvitationDecision(item, "accept")}
                    >
                      {busyInvitationId === item.id
                        ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 rounded-xl px-4 text-muted-foreground hover:text-foreground"
                      disabled={busyInvitationId === item.id}
                      onClick={() => openInvitationDecision(item, "decline")}
                    >
                      Decline
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ── Three action paths ────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* 1 · Browse Teams */}
        <motion.div {...stagger(2)} className="h-full">
          <Link href="/dashboard/teams" className="group block h-full">
            <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-background p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Explore</p>
              <h3 className="text-lg font-bold tracking-tight">Browse Teams</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
                Compare open teams by project idea, capacity, and tech stack to find the right fit.
              </p>
              <p className="mt-4 text-sm font-semibold text-primary">View all open teams →</p>
            </div>
          </Link>
        </motion.div>

        {/* 2 · Join with Code */}
        <motion.div {...stagger(3)} className="h-full">
          <div id="join-with-code" className="flex h-full flex-col rounded-2xl border border-border/70 bg-background p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Hash className="h-4 w-4" />
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Instant access</p>
            <h3 className="text-lg font-bold tracking-tight">Join with Code</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Got an invite code from a team leader? Enter it to join right away — no request needed.
            </p>

            <div className="mt-4 flex flex-1 flex-col justify-end space-y-2.5">
              <Input
                value={joinCode}
                placeholder="e.g. TEAM-A1B2"
                className={`h-11 rounded-xl font-mono text-center text-sm tracking-[0.22em] uppercase ${
                  joinCodeError ? "border-destructive ring-1 ring-destructive/25" : ""
                }`}
                onChange={(e) => {
                  if (joinCodeError) clearJoinCodeError()
                  setJoinCode(e.target.value.toUpperCase())
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.trim() && !joiningByCode && !joinSuccess) void onJoinByCode()
                }}
              />
              <AnimatePresence>
                {joinCodeError && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-1.5 overflow-hidden text-xs text-destructive"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {joinCodeError}
                  </motion.p>
                )}
              </AnimatePresence>
              <Button
                className={`h-10 w-full rounded-xl font-semibold transition-all duration-300 ${
                  joinSuccess ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" : ""
                }`}
                disabled={!joinCode.trim() || joiningByCode || joinSuccess}
                onClick={() => void onJoinByCode()}
              >
                <AnimatePresence mode="wait">
                  {joiningByCode ? (
                    <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />Joining…
                    </motion.span>
                  ) : joinSuccess ? (
                    <motion.span key="s" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />Joined!
                    </motion.span>
                  ) : (
                    <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />Join Team
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              <p className="text-center text-[11px] text-muted-foreground/60">
                Press <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to confirm
              </p>
            </div>
          </div>
        </motion.div>

        {/* 3 · Become a Leader */}
        <motion.div {...stagger(4)} className="h-full">
          <div className="flex h-full flex-col rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Crown className="h-4 w-4" />
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Another path</p>
            <h3 className="text-lg font-bold tracking-tight">Become a Leader</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Want to define the project direction? Create and lead your own team from scratch.
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {["Define your project idea", "Invite teammates directly", "Manage join requests"].map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" />
                  {point}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-5 h-9 w-full rounded-xl border-amber-500/30 text-sm font-medium hover:bg-amber-500/5 hover:border-amber-500/50 hover:text-amber-700 dark:hover:text-amber-300"
              disabled={isSwitchingToLeader}
              onClick={() => void onBecomeLeader()}
            >
              {isSwitchingToLeader
                ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                : <Crown className="mr-2 h-3.5 w-3.5 text-amber-500" />}
              Switch to Leader
            </Button>
          </div>
        </motion.div>
      </div>

      {/* ── My Join Requests ──────────────────────────── */}
      <AnimatePresence>
        {myJoinRequests.length > 0 && (
          <motion.section
            key="join-requests"
            initial={reduceMotion ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">My Join Requests</p>
              <Badge className="border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                {myJoinRequests.length} pending
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {myJoinRequests.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={reduceMotion ? {} : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, delay: index * 0.05 }}
                  className="rounded-2xl border border-border/60 bg-background p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">{item.team.name}</h3>
                    <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground line-clamp-2 mb-3">{item.team.bio}</p>
                  <Badge variant="secondary" className="text-[10px]">{formatTeamVisibility(item.team.visibility)}</Badge>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Invitation decision dialog ────────────────────── */}
      <AlertDialog
        open={Boolean(invitationDecision)}
        onOpenChange={(open) => { if (!open && !busyInvitationId) setInvitationDecision(null) }}
      >
        <AlertDialogContent className="max-w-md overflow-hidden rounded-[28px] border-border/70 p-0">
          <div className="p-5 sm:p-6">
            <AlertDialogHeader className="space-y-4 text-left">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                invitationDecision?.action === "accept"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {invitationDecision?.action === "accept"
                  ? <CheckCircle2 className="h-6 w-6" />
                  : <AlertCircle className="h-6 w-6" />}
              </div>
              <div className="space-y-2">
                <AlertDialogTitle className="text-xl tracking-tight">
                  {invitationDecision?.action === "accept" ? "Accept invitation?" : "Decline invitation?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="leading-6">
                  {invitationDecision?.action === "accept"
                    ? <>Join <span className="font-medium text-foreground">{invitationDecision?.teamName}</span> and start collaborating right away.</>
                    : <>Remove the invitation to <span className="font-medium text-foreground">{invitationDecision?.teamName}</span> from your inbox.</>}
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>

            <div className={`mt-5 rounded-2xl border p-4 ${
              invitationDecision?.action === "accept"
                ? "border-primary/15 bg-primary/[0.03]"
                : "border-border/60 bg-muted/20"
            }`}>
              <p className="text-sm font-medium">
                {invitationDecision?.action === "accept" ? "What happens next" : "Good to know"}
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {invitationDecision?.action === "accept"
                  ? `You'll join ${invitationDecision?.teamName} immediately. The invitation from ${invitationDecision?.inviterName} will be marked as accepted.`
                  : `You'll remove this invitation. You can still be invited again or join via a code if things change.`}
              </p>
            </div>

            <AlertDialogFooter className="mt-5 gap-3">
              <AlertDialogCancel
                className="h-11 rounded-xl"
                disabled={busyInvitationId === invitationDecision?.id}
                onClick={() => { if (!busyInvitationId) setInvitationDecision(null) }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className={`h-11 rounded-xl ${
                  invitationDecision?.action === "accept"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  if (invitationDecision) void respond(invitationDecision.id, invitationDecision.action)
                }}
                disabled={!invitationDecision || busyInvitationId === invitationDecision?.id}
              >
                {busyInvitationId === invitationDecision?.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : invitationDecision?.action === "accept"
                    ? <CheckCircle2 className="h-4 w-4" />
                    : <AlertCircle className="h-4 w-4" />}
                <span className="ml-2">
                  {invitationDecision?.action === "accept" ? "Accept" : "Decline"}
                </span>
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function LeaderNoTeam({
  onRefresh,
  onBecomeMember,
  isSwitchingToMember,
}: {
  onRefresh: () => Promise<void>
  onBecomeMember: () => Promise<void>
  isSwitchingToMember: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<{
    name: string
    bio: string
    stack: string
    maxMembers: string
    visibility: ApiTeamVisibility
    allowJoinRequests: boolean
    stage: ApiTeamStage
  }>({
    name: "",
    bio: "",
    stack: "",
    maxMembers: "5",
    visibility: "PUBLIC",
    allowJoinRequests: true,
    stage: "REQUIREMENTS",
  })

  const stackItems = form.stack
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  const bioLength = form.bio.trim().length
  const canCreateTeam = form.name.trim().length >= 3 && bioLength >= 10
  const reduceMotion = Boolean(useReducedMotion())

  const slide = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  const addSuggestedStack = (value: string) => {
    const current = new Set(stackItems.map((item) => item.toLowerCase()))
    if (current.has(value.toLowerCase())) return
    setForm((state) => ({
      ...state,
      stack: [...stackItems, value].join(", "),
    }))
  }

  const createTeam = async () => {
    if (!canCreateTeam) {
      toast.error("Add a team name and a short bio before creating the team.")
      return
    }

    setBusy(true)
    try {
      await teamsApi.create({
        name: form.name.trim(),
        bio: form.bio.trim(),
        stack: stackItems,
        maxMembers: Number(form.maxMembers),
        visibility: form.visibility,
        allowJoinRequests: form.visibility === "PUBLIC" ? form.allowJoinRequests : false,
        stage: form.stage,
      })
      toast.success("Team created successfully.")
      await onRefresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the team.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6 xl:p-8">

      {/* ── Hero ─────────────────────────────────────── */}
      <motion.div {...slide(0)} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary text-xs font-semibold">
              <Crown className="mr-1.5 h-3 w-3" />
              Team Leader
            </Badge>
            <Badge variant="secondary" className="text-xs">Setup</Badge>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create your team</h1>
            <p className="text-base leading-7 text-muted-foreground">
              Define your project workspace, set team capacity, and choose who can find you.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-10 shrink-0 rounded-xl border-border/70 px-5 text-sm font-medium hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          onClick={() => void onBecomeMember()}
          disabled={isSwitchingToMember}
        >
          {isSwitchingToMember ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Users className="mr-2 h-3.5 w-3.5" />
          )}
          Switch to Member
        </Button>
      </motion.div>

      {/* ── Two-column form ───────────────────────────── */}
      <motion.div
        {...slide(0.07)}
        className="overflow-hidden rounded-3xl border border-border/70 bg-background shadow-sm"
      >
        <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border/50">

          {/* ── Left column: Steps 1 & 2 ─── */}
          <div className="flex flex-col divide-y divide-border/50">

            {/* Step 1 — Identity */}
            <div className="p-6 sm:p-7">
              <LeaderFormStep step={1} title="Team Identity" sub="Name your team and set the member capacity" />

              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Team Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    className="h-11 rounded-xl border-border/60 bg-background"
                    placeholder="e.g. Smart Campus Builders"
                    onChange={(e) => setForm((state) => ({ ...state, name: e.target.value }))}
                  />
                  {form.name.trim().length > 0 && form.name.trim().length < 3 ? (
                    <p className="text-xs text-destructive">Name must be at least 3 characters.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">This is how your team appears in the directory.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Team Size</Label>
                  <Select
                    value={form.maxMembers}
                    onValueChange={(value) => setForm((state) => ({ ...state, maxMembers: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["3", "4", "5", "6"].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v} members (you + {Number(v) - 1} others)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">You count as 1 — the team leader.</p>
                </div>
              </div>
            </div>

            {/* Step 2 — Description */}
            <div className="flex flex-1 flex-col p-6 sm:p-7">
              <LeaderFormStep step={2} title="Project Description" sub="Help teammates understand what you're building" />

              <div className="mt-6 flex flex-1 flex-col space-y-2">
                <Textarea
                  rows={6}
                  value={form.bio}
                  className="flex-1 resize-none rounded-xl border-border/60 bg-background p-4"
                  placeholder="Describe your project idea, the problem it solves, and the kind of teammates you're looking for…"
                  onChange={(e) => setForm((state) => ({ ...state, bio: e.target.value }))}
                />
                <div className="flex items-center justify-between">
                  {bioLength > 0 && bioLength < 10 ? (
                    <p className="text-xs text-destructive">Write at least 10 characters.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">A clear description attracts better-fit teammates.</p>
                  )}
                  <span className={`text-xs tabular-nums font-medium ${bioLength > 0 && bioLength < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                    {bioLength}/1000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: Steps 3 & 4 ── */}
          <div className="flex flex-col divide-y divide-border/50">

            {/* Step 3 — Tech Stack */}
            <div className="p-6 sm:p-7">
              <LeaderFormStep step={3} title="Tech Stack" sub="Technologies your team plans to use" optional />

              <div className="mt-6 space-y-4">
                <Input
                  value={form.stack}
                  className="h-11 rounded-xl border-border/60 bg-background"
                  placeholder="React, Node.js, PostgreSQL… (comma-separated)"
                  onChange={(e) => setForm((state) => ({ ...state, stack: e.target.value }))}
                />

                <AnimatePresence>
                  {stackItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 py-1">
                        {stackItems.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Quick add:</p>
                  <div className="flex flex-wrap gap-2">
                    {STACK_SUGGESTIONS.map((s) => {
                      const added = stackItems.map((i) => i.toLowerCase()).includes(s.toLowerCase())
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addSuggestedStack(s)}
                          disabled={added}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                            added
                              ? "border-primary/25 bg-primary/10 text-primary cursor-default"
                              : "border-border/60 bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          }`}
                        >
                          {added && <Check className="h-2.5 w-2.5" />}
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 — Visibility */}
            <div className="p-6 sm:p-7">
              <LeaderFormStep step={4} title="Visibility & Access" sub="Control who can discover and join your team" />

              <div className="mt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Public */}
                  <button
                    type="button"
                    onClick={() => setForm((state) => ({ ...state, visibility: "PUBLIC", allowJoinRequests: true }))}
                    className={`relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                      form.visibility === "PUBLIC"
                        ? "border-primary bg-primary/[0.04] shadow-sm"
                        : "border-border/60 hover:border-border hover:bg-muted/15"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      form.visibility === "PUBLIC" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <Globe2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Public</p>
                      <p className="mt-0.5 text-xs leading-4 text-muted-foreground">Listed in teams directory</p>
                    </div>
                    {form.visibility === "PUBLIC" && (
                      <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>

                  {/* Private */}
                  <button
                    type="button"
                    onClick={() => setForm((state) => ({ ...state, visibility: "PRIVATE", allowJoinRequests: false }))}
                    className={`relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                      form.visibility === "PRIVATE"
                        ? "border-primary bg-primary/[0.04] shadow-sm"
                        : "border-border/60 hover:border-border hover:bg-muted/15"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                      form.visibility === "PRIVATE" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <LockKeyhole className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Private</p>
                      <p className="mt-0.5 text-xs leading-4 text-muted-foreground">Invite-only, hidden from directory</p>
                    </div>
                    {form.visibility === "PRIVATE" && (
                      <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                </div>

                <AnimatePresence>
                  {form.visibility === "PUBLIC" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/15 px-4 py-3.5">
                        <div>
                          <p className="text-sm font-medium">Allow join requests</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Students can request to join from the teams page.
                          </p>
                        </div>
                        <Switch
                          checked={form.allowJoinRequests}
                          onCheckedChange={(checked) =>
                            setForm((state) => ({ ...state, allowJoinRequests: checked }))
                          }
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* ── Create CTA ───────────────────────────────── */}
      <motion.div {...slide(0.14)} className="space-y-3 pb-4">
        <Button
          size="lg"
          className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/15 transition-all disabled:opacity-50"
          disabled={!canCreateTeam || busy}
          onClick={() => void createTeam()}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating your team…
            </>
          ) : (
            <>
              <Crown className="mr-2 h-5 w-5" />
              Create Team
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {canCreateTeam
            ? "You'll become the team leader and can start inviting students right away."
            : !form.name.trim()
              ? "Add a team name to continue."
              : "Write at least 10 characters in the description to continue."}
        </p>
      </motion.div>
    </div>
  )
}

function LeaderFormStep({
  step,
  title,
  sub,
  optional,
}: {
  step: number
  title: string
  sub: string
  optional?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <span className="text-sm font-bold">{step}</span>
      </div>
      <div>
        <p className="font-semibold text-sm leading-none">
          {title}
          {optional && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  const reduceMotion = Boolean(useReducedMotion())

  return (
    <motion.div
      {...getRevealMotion(reduceMotion)}
      {...getCardHoverMotion(reduceMotion)}
      className="rounded-[24px] border border-border/60 bg-background/88 p-4 shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 break-words text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{helper}</p>
    </motion.div>
  )
}

function InfoLine({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return <ChecklistLine icon={icon} title={title} description={description} />
}

function CenteredCard({ title, body, onRetry }: { title: string; body: string; onRetry?: () => Promise<void> | void }) {
  return <div className="container mx-auto max-w-3xl p-4 md:p-6"><Card className="p-6 text-center sm:p-8"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>{onRetry && <Button className="mt-4 w-full sm:w-auto" onClick={() => void onRetry()}>Try Again</Button>}</Card></div>
}

function StudentMetricCard({
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

function StudentInfoRow({
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

function StudentMemberCard({
  member,
  isCurrentUser,
}: {
  member: ApiTeamMember
  isCurrentUser: boolean
}) {
  const name = getFullName(member.user)
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
              <p className="truncate font-semibold">{name}</p>
              {isCurrentUser && (
                <Badge variant="outline" className="rounded-full bg-background/80 px-2 py-0.5 text-[11px]">
                  You
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLeader ? "Team Leader" : formatRoleLabel(member.user.role)}
            </p>
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

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {isLeader ? "Leading this team" : "Team member"}
            </p>
          </div>

          <Button
            variant="outline"
            className="group mt-3 h-10 w-full justify-between rounded-xl border-border/70 bg-transparent px-4 text-foreground transition-[color,border-color,background-color] duration-200 hover:border-primary/35 hover:bg-primary/[0.06] hover:text-primary"
            asChild
          >
            <Link href={`/dashboard/users/${member.user.id}`}>
              View Profile
              <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function LeaveTeamDialog({
  open,
  onOpenChange,
  teamName,
  isSubmitting,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamName: string
  isSubmitting: boolean
  onConfirm: () => Promise<void>
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md overflow-hidden rounded-[28px] border-border/70 p-0">
        <div className="p-5 sm:p-6">
          <AlertDialogHeader className="space-y-4 text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <UserMinus className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-2xl tracking-tight">Leave team?</AlertDialogTitle>
              <AlertDialogDescription className="leading-6">
                You will leave <span className="font-medium text-foreground">{teamName}</span> and lose access to its team pages until you join another team.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          <div className="mt-6 rounded-2xl border border-destructive/15 bg-destructive/[0.03] p-4">
            <p className="text-sm font-medium text-foreground">Before you continue</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This only removes you from the team. You can still browse teams, join by code, or accept a new invitation later.
            </p>
          </div>

          <AlertDialogFooter className="mt-6 gap-3 sm:gap-3">
            <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void onConfirm()}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
              <span className="ml-2">Leave Team</span>
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
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

function getPanelMotion(reduceMotion: boolean) {
  if (reduceMotion) return {}

  return {
    whileHover: {
      y: -3,
      scale: 1.004,
      transition: {
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  }
}

function getInsetMotion(reduceMotion: boolean) {
  if (reduceMotion) return {}

  return {
    whileHover: {
      y: -2,
      transition: {
        duration: 0.2,
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 transition-colors hover:bg-muted/20">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
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
    <div className="group flex items-start gap-4 rounded-3xl border border-border/50 bg-background/50 p-4 transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold tracking-tight">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">{description}</p>
      </div>
    </div>
  )
}


















