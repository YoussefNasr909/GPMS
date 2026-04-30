"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, ClipboardCheck, Eye, Loader2, Pencil, Plus, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { TeamRequiredGuard } from "@/components/team-required-guard"
import { risksApi } from "@/lib/api/risks"
import type { ApiRisk, ApiRiskChance, ApiRiskSeverity, ApiRiskStatus, ApiTeamMember } from "@/lib/api/types"
import { useMyTeamState } from "@/lib/hooks/use-my-team-state"
import { useAuthStore } from "@/lib/stores/auth-store"

const chanceOptions: ApiRiskChance[] = ["LOW", "MEDIUM", "HIGH"]
const statusOptions: ApiRiskStatus[] = ["OPEN", "MONITORING", "RESOLVED"]
const severityOptions: ApiRiskSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

const emptyCreateForm = {
  title: "",
  description: "",
  category: "Project",
  chance: "MEDIUM" as ApiRiskChance,
  impact: "MEDIUM" as ApiRiskChance,
  mitigation: "",
  monitorUserId: "",
}

const ALL_SUPERVISED_TEAMS = "__all_supervised_teams__"

function label(value: string | null | undefined) {
  if (!value) return "Pending"
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function severityClass(severity: ApiRiskSeverity | null) {
  switch (severity) {
    case "CRITICAL":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
    case "HIGH":
      return "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300"
    case "MEDIUM":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
    case "LOW":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
    default:
      return "border-slate-500/30 bg-slate-500/10 text-muted-foreground"
  }
}

function approvalVariant(status: ApiRisk["approvalStatus"]) {
  if (status === "APPROVED") return "default"
  if (status === "REVISION_REQUESTED") return "destructive"
  return "secondary"
}

function reviewLabel(risk: ApiRisk) {
  if (risk.status === "RESOLVED" && risk.approvalStatus === "PENDING") return "Resolution Review"
  if (risk.status === "RESOLVED" && risk.approvalStatus === "APPROVED") return "Resolution Confirmed"
  if (risk.approvalStatus === "REVISION_REQUESTED") return "Revision Requested"
  return label(risk.approvalStatus)
}

function memberName(member: ApiTeamMember) {
  return member.user.fullName || member.user.email
}

export default function RiskManagementPage() {
  const { currentUser } = useAuthStore()
  const { data: teamState, isLoading: isTeamLoading, error: teamError } = useMyTeamState()
  const [risks, setRisks] = useState<ApiRisk[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [selectedTeamId, setSelectedTeamId] = useState(ALL_SUPERVISED_TEAMS)
  const [createFormError, setCreateFormError] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMonitorDialog, setShowMonitorDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [isSubmittingRisk, setIsSubmittingRisk] = useState(false)
  const [isUpdatingRisk, setIsUpdatingRisk] = useState(false)
  const [selectedRisk, setSelectedRisk] = useState<ApiRisk | null>(null)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [editForm, setEditForm] = useState(emptyCreateForm)
  const [monitorForm, setMonitorForm] = useState({
    chance: "MEDIUM" as ApiRiskChance,
    status: "OPEN" as ApiRiskStatus,
    monitoringNotes: "",
    resolutionNotes: "",
  })
  const [approvalForm, setApprovalForm] = useState({
    severity: "MEDIUM" as ApiRiskSeverity,
    approvalNote: "",
  })

  const isSupervisor = currentUser?.role === "doctor" || currentUser?.role === "ta"
  const team = teamState?.team ?? null
  const supervisedTeams = useMemo(() => teamState?.supervisedTeams ?? [], [teamState?.supervisedTeams])
  const queryTeamId = isSupervisor && selectedTeamId !== ALL_SUPERVISED_TEAMS ? selectedTeamId : undefined
  const canCreateRisk = currentUser?.role === "leader" && Boolean(team?.permissions.canManage)
  const hasAssignedSupervisor = Boolean(team?.doctor || team?.ta)
  const monitorOptions = useMemo(() => {
    if (!team) return []

    const options = new Map<string, ApiTeamMember>()
    options.set(team.leader.id, {
      id: team.leader.id,
      joinedAt: team.createdAt,
      teamRole: "LEADER",
      user: team.leader,
    })

    for (const member of team.members) {
      options.set(member.user.id, member)
    }

    return Array.from(options.values())
  }, [team])

  useEffect(() => {
    if (!canCreateRisk || createForm.monitorUserId || monitorOptions.length === 0) return
    const leader = monitorOptions.find((member) => member.teamRole === "LEADER") ?? monitorOptions[0]
    setCreateForm((form) => ({ ...form, monitorUserId: leader.user.id }))
  }, [canCreateRisk, createForm.monitorUserId, monitorOptions])

  async function loadRisks() {
    if (isSupervisor && supervisedTeams.length === 0) {
      setRisks([])
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await risksApi.list(queryTeamId ? { teamId: queryTeamId } : undefined)
      setRisks(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load risks right now.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isTeamLoading) return
    void loadRisks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeamLoading, queryTeamId, isSupervisor, supervisedTeams.length])

  const filteredRisks = useMemo(() => {
    if (activeFilter === "pending") return risks.filter((risk) => risk.approvalStatus !== "APPROVED")
    if (activeFilter === "approved") return risks.filter((risk) => risk.approvalStatus === "APPROVED")
    if (activeFilter === "resolved") return risks.filter((risk) => risk.status === "RESOLVED")
    return risks
  }, [activeFilter, risks])

  const stats = useMemo(
    () => ({
      pending: risks.filter((risk) => risk.approvalStatus !== "APPROVED").length,
      approved: risks.filter((risk) => risk.approvalStatus === "APPROVED").length,
      critical: risks.filter((risk) => risk.severity === "CRITICAL").length,
      resolved: risks.filter((risk) => risk.status === "RESOLVED").length,
    }),
    [risks],
  )

  function openMonitorDialog(risk: ApiRisk) {
    setSelectedRisk(risk)
    setMonitorForm({
      chance: risk.chance,
      status: risk.status,
      monitoringNotes: risk.monitoringNotes,
      resolutionNotes: risk.resolutionNotes,
    })
    setShowMonitorDialog(true)
  }

  function openEditDialog(risk: ApiRisk) {
    setSelectedRisk(risk)
    setEditForm({
      title: risk.title,
      description: risk.description,
      category: risk.category,
      chance: risk.chance,
      impact: risk.impact,
      mitigation: risk.mitigation,
      monitorUserId: risk.monitor?.id ?? "",
    })
    setShowEditDialog(true)
  }

  function openApprovalDialog(risk: ApiRisk) {
    setSelectedRisk(risk)
    setApprovalForm({
      severity: risk.severity ?? "MEDIUM",
      approvalNote: risk.approvalNote,
    })
    setShowApprovalDialog(true)
  }

  async function handleCreateRisk() {
    const title = createForm.title.trim()
    const description = createForm.description.trim()
    const category = createForm.category.trim()
    setCreateFormError("")

    if (!title || !description || !category) {
      const message = "Add a title, description, and category before sending the risk for approval."
      setCreateFormError(message)
      toast.error(message)
      return
    }

    if (!createForm.monitorUserId && monitorOptions.length > 0) {
      const message = "Choose who will monitor this risk."
      setCreateFormError(message)
      toast.error(message)
      return
    }

    setIsSubmittingRisk(true)

    try {
      const created = await risksApi.create({
        ...createForm,
        title,
        description,
        category,
        mitigation: createForm.mitigation.trim(),
        monitorUserId: createForm.monitorUserId || undefined,
      })
      setRisks((items) => [created, ...items])
      setCreateForm({
        ...emptyCreateForm,
        monitorUserId:
          monitorOptions.find((member) => member.teamRole === "LEADER")?.user.id ?? monitorOptions[0]?.user.id ?? "",
      })
      setShowAddDialog(false)
      toast.success("Risk logged and sent to supervisors for approval.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't log this risk."
      setCreateFormError(message)
      toast.error(message)
    } finally {
      setIsSubmittingRisk(false)
    }
  }

  async function handleUpdateRiskDetails() {
    if (!selectedRisk) return

    const title = editForm.title.trim()
    const description = editForm.description.trim()
    const category = editForm.category.trim()

    if (!title || !description || !category) {
      toast.error("Add a title, description, and category before resubmitting the risk.")
      return
    }

    setIsUpdatingRisk(true)

    try {
      const updated = await risksApi.update(selectedRisk.id, {
        title,
        description,
        category,
        chance: editForm.chance,
        impact: editForm.impact,
        mitigation: editForm.mitigation.trim(),
        ...(monitorOptions.length > 0 ? { monitorUserId: editForm.monitorUserId || null } : {}),
      })
      setRisks((items) => items.map((risk) => (risk.id === updated.id ? updated : risk)))
      setShowEditDialog(false)
      toast.success("Risk updated and sent back for supervisor review.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update this risk.")
    } finally {
      setIsUpdatingRisk(false)
    }
  }

  async function handleUpdateMonitoring() {
    if (!selectedRisk) return

    try {
      const updated = await risksApi.update(selectedRisk.id, monitorForm)
      setRisks((items) => items.map((risk) => (risk.id === updated.id ? updated : risk)))
      setShowMonitorDialog(false)
      toast.success(
        monitorForm.status === "RESOLVED"
          ? "Resolution notes saved and sent for supervisor review."
          : "Risk monitoring updated.",
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update this risk.")
    }
  }

  async function handleApproveRisk() {
    if (!selectedRisk) return

    try {
      const updated = await risksApi.approve(selectedRisk.id, approvalForm)
      setRisks((items) => items.map((risk) => (risk.id === updated.id ? updated : risk)))
      setShowApprovalDialog(false)
      toast.success(
        selectedRisk.status === "RESOLVED"
          ? "Risk resolution confirmed by supervisor."
          : "Risk approved with supervisor severity.",
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't approve this risk.")
    }
  }

  async function handleRequestRevision() {
    if (!selectedRisk) return

    try {
      const updated = await risksApi.requestRevision(selectedRisk.id, {
        approvalNote: approvalForm.approvalNote || "Please revise this risk before approval.",
      })
      setRisks((items) => items.map((risk) => (risk.id === updated.id ? updated : risk)))
      setShowApprovalDialog(false)
      toast.success(
        selectedRisk.status === "RESOLVED"
          ? "Risk sent back for monitoring."
          : "Revision requested from the team leader.",
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't request a revision.")
    }
  }

  const content = (
    <div className="space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Risk Management</h1>
            <p className="mt-1 text-muted-foreground">
              Track team risks, capture assigned monitor notes, and route approvals or resolution reviews to supervisors.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {isSupervisor && supervisedTeams.length > 0 ? (
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select supervised team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SUPERVISED_TEAMS}>All supervised teams</SelectItem>
                  {supervisedTeams.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {canCreateRisk ? (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Risk
              </Button>
            ) : null}
          </div>
        </div>

        {teamError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Team access issue</AlertTitle>
            <AlertDescription>{teamError}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Risk loading failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isSupervisor && supervisedTeams.length === 0 ? (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>No supervised teams</AlertTitle>
            <AlertDescription>Risk approvals appear here after a team assigns you as doctor or TA.</AlertDescription>
          </Alert>
        ) : null}

        {canCreateRisk && !hasAssignedSupervisor ? (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>No supervisor assigned</AlertTitle>
            <AlertDescription>
              You can log risks, but a doctor or TA must be assigned to this team before severity approval can happen.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Approval</span>
                <ClipboardCheck className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Critical</span>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{stats.critical}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolved</span>
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-semibold">{stats.resolved}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="grid w-full grid-cols-4 lg:w-[520px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <Card>
            <CardContent className="flex min-h-48 items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading risks
            </CardContent>
          </Card>
        ) : filteredRisks.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
              <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">No risks here yet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Leaders log project risks, then assigned monitors can add notes and send resolved risks back for supervisor review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRisks.map((risk) => (
              <Card key={risk.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">{risk.title}</CardTitle>
                        <Badge variant={approvalVariant(risk.approvalStatus)}>{reviewLabel(risk)}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{risk.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{risk.category}</Badge>
                      <Badge className={severityClass(risk.severity)}>{label(risk.severity)}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Chance</p>
                      <p className="font-medium">{label(risk.chance)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Impact</p>
                      <p className="font-medium">{label(risk.impact)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{label(risk.status)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monitor</p>
                      <p className="font-medium">{risk.monitor?.fullName || "Unassigned"}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-4">
                    <div className="rounded-md border p-3">
                      <p className="text-sm font-medium">Mitigation</p>
                      <p className="mt-1 text-sm text-muted-foreground">{risk.mitigation || "No mitigation added yet."}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-sm font-medium">Monitoring Notes</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {risk.monitoringNotes || "No monitoring update yet."}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-sm font-medium">Resolution Notes</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {risk.resolutionNotes || "No resolution note yet."}
                      </p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-sm font-medium">Supervisor Note</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {risk.approvalNote || "No supervisor note yet."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                    {risk.permissions.canEdit ? (
                      <Button variant="outline" onClick={() => openEditDialog(risk)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Risk
                      </Button>
                    ) : null}
                    {risk.permissions.canMonitor ? (
                      <Button variant="outline" onClick={() => openMonitorDialog(risk)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Update Monitoring
                      </Button>
                    ) : null}
                    {risk.permissions.canApprove && risk.approvalStatus !== "APPROVED" ? (
                      <Button onClick={() => openApprovalDialog(risk)}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {risk.status === "RESOLVED" ? "Review Resolution" : "Supervisor Approval"}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log New Risk</DialogTitle>
            <DialogDescription>The risk will wait for supervisor severity approval.</DialogDescription>
          </DialogHeader>
          {createFormError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Risk was not sent</AlertTitle>
              <AlertDescription>{createFormError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="risk-title">Title</Label>
              <Input
                id="risk-title"
                value={createForm.title}
                onChange={(event) => setCreateForm((form) => ({ ...form, title: event.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="risk-description">Description</Label>
              <Textarea
                id="risk-description"
                value={createForm.description}
                onChange={(event) => setCreateForm((form) => ({ ...form, description: event.target.value }))}
                className="mt-2"
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="risk-category">Category</Label>
                <Input
                  id="risk-category"
                  value={createForm.category}
                  onChange={(event) => setCreateForm((form) => ({ ...form, category: event.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Assigned Monitor</Label>
                <Select
                  value={createForm.monitorUserId}
                  onValueChange={(value) => setCreateForm((form) => ({ ...form, monitorUserId: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {monitorOptions.map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {memberName(member)} ({label(member.teamRole)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Chance</Label>
                <Select
                  value={createForm.chance}
                  onValueChange={(value: ApiRiskChance) => setCreateForm((form) => ({ ...form, chance: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chanceOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {label(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Impact</Label>
                <Select
                  value={createForm.impact}
                  onValueChange={(value: ApiRiskChance) => setCreateForm((form) => ({ ...form, impact: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chanceOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {label(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="risk-mitigation">Mitigation</Label>
              <Textarea
                id="risk-mitigation"
                value={createForm.mitigation}
                onChange={(event) => setCreateForm((form) => ({ ...form, mitigation: event.target.value }))}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRisk} disabled={isSubmittingRisk}>
              {isSubmittingRisk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending
                </>
              ) : (
                "Send for Approval"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Risk</DialogTitle>
            <DialogDescription>Update the risk details and send it back for supervisor review.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="edit-risk-title">Title</Label>
              <Input
                id="edit-risk-title"
                value={editForm.title}
                onChange={(event) => setEditForm((form) => ({ ...form, title: event.target.value }))}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-risk-description">Description</Label>
              <Textarea
                id="edit-risk-description"
                value={editForm.description}
                onChange={(event) => setEditForm((form) => ({ ...form, description: event.target.value }))}
                className="mt-2"
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-risk-category">Category</Label>
                <Input
                  id="edit-risk-category"
                  value={editForm.category}
                  onChange={(event) => setEditForm((form) => ({ ...form, category: event.target.value }))}
                  className="mt-2"
                />
              </div>
              {monitorOptions.length > 0 ? (
                <div>
                  <Label>Assigned Monitor</Label>
                  <Select
                    value={editForm.monitorUserId}
                    onValueChange={(value) => setEditForm((form) => ({ ...form, monitorUserId: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {monitorOptions.map((member) => (
                        <SelectItem key={member.user.id} value={member.user.id}>
                          {memberName(member)} ({label(member.teamRole)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Chance</Label>
                <Select
                  value={editForm.chance}
                  onValueChange={(value: ApiRiskChance) => setEditForm((form) => ({ ...form, chance: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chanceOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {label(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Impact</Label>
                <Select
                  value={editForm.impact}
                  onValueChange={(value: ApiRiskChance) => setEditForm((form) => ({ ...form, impact: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chanceOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {label(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-risk-mitigation">Mitigation</Label>
              <Textarea
                id="edit-risk-mitigation"
                value={editForm.mitigation}
                onChange={(event) => setEditForm((form) => ({ ...form, mitigation: event.target.value }))}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRiskDetails} disabled={isUpdatingRisk}>
              {isUpdatingRisk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save and Resubmit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMonitorDialog} onOpenChange={setShowMonitorDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Update Student Notes</DialogTitle>
            <DialogDescription>Add notes and mark the risk resolved when it is ready for supervisor review.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Chance</Label>
                <Select
                  value={monitorForm.chance}
                  onValueChange={(value: ApiRiskChance) => setMonitorForm((form) => ({ ...form, chance: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chanceOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {label(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={monitorForm.status}
                  onValueChange={(value: ApiRiskStatus) => setMonitorForm((form) => ({ ...form, status: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {label(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="monitoring-notes">Monitoring Notes</Label>
              <Textarea
                id="monitoring-notes"
                value={monitorForm.monitoringNotes}
                onChange={(event) => setMonitorForm((form) => ({ ...form, monitoringNotes: event.target.value }))}
                className="mt-2"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="resolution-notes">Resolution Notes</Label>
              <Textarea
                id="resolution-notes"
                value={monitorForm.resolutionNotes}
                onChange={(event) => setMonitorForm((form) => ({ ...form, resolutionNotes: event.target.value }))}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMonitorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMonitoring}>Save Monitoring</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedRisk?.status === "RESOLVED" ? "Review Resolution" : "Supervisor Approval"}</DialogTitle>
            <DialogDescription>
              {selectedRisk?.status === "RESOLVED"
                ? "Confirm whether the assigned monitor's resolution notes prove this risk is resolved."
                : "Approve the risk and select the official severity for the team."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {selectedRisk?.status !== "RESOLVED" || !selectedRisk.severity ? (
              <div>
                <Label>Severity</Label>
                <Select
                  value={approvalForm.severity}
                  onValueChange={(value: ApiRiskSeverity) => setApprovalForm((form) => ({ ...form, severity: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severityOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {label(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div>
              <Label htmlFor="approval-note">Approval Note</Label>
              <Textarea
                id="approval-note"
                value={approvalForm.approvalNote}
                onChange={(event) => setApprovalForm((form) => ({ ...form, approvalNote: event.target.value }))}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={handleRequestRevision}>
              {selectedRisk?.status === "RESOLVED" ? "Keep Monitoring" : "Request Revision"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleApproveRisk}>
                {selectedRisk?.status === "RESOLVED" ? "Confirm Resolved" : "Approve Risk"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return (
    <TeamRequiredGuard
      pageName="Risk Management"
      pageDescription="Identify, assess, and mitigate project risks with your team"
      icon={<AlertTriangle className="h-12 w-12" />}
    >
      {content}
    </TeamRequiredGuard>
  )
}
