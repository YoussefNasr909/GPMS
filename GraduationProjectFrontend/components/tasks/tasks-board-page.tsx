"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GitPullRequest,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Target,
  UserCheck,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { TeamRequiredGuard } from "@/components/team-required-guard"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useMyTeamState } from "@/lib/hooks/use-my-team-state"
import { tasksApi } from "@/lib/api/tasks"
import { teamsApi } from "@/lib/api/teams"
import type { ApiTask, ApiTaskIntegrationMode, ApiTaskPriority, ApiTaskStatus, ApiTaskType, ApiTeamMember, ApiTeamSummary } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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

type TaskFormState = {
  title: string
  description: string
  priority: ApiTaskPriority
  startDate: string
  endDate: string
  assigneeUserId: string
  taskType: ApiTaskType
  integrationMode: ApiTaskIntegrationMode
}

type TaskWorkflowAction = "accept" | "submit" | "approve" | "reject"

type TaskSortOption = "status" | "due-date" | "priority" | "updated"

type DetailTab = "overview" | "github" | "edit"

const TASK_TYPE_OPTIONS: Array<{ value: ApiTaskType; label: string }> = [
  { value: "CODE", label: "Code" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "DESIGN", label: "Design" },
  { value: "RESEARCH", label: "Research" },
  { value: "MEETING", label: "Meeting" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "OTHER", label: "Other" },
]

const INTEGRATION_MODE_OPTIONS: Array<{ value: ApiTaskIntegrationMode; label: string }> = [
  { value: "MANUAL", label: "Manual" },
  { value: "GITHUB", label: "GitHub" },
]

const GITHUB_DEFAULT_TASK_TYPES = new Set<ApiTaskType>(["CODE", "DOCUMENTATION", "DESIGN"])

const DEFAULT_TASK_FORM: TaskFormState = {
  title: "",
  description: "",
  priority: "MEDIUM",
  startDate: "",
  endDate: "",
  assigneeUserId: "",
  taskType: "OTHER",
  integrationMode: "MANUAL",
}

const TASK_STATUS_SORT_ORDER: Record<ApiTaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 1,
  REVIEW: 2,
  APPROVED: 3,
  DONE: 4,
}

const TASK_PRIORITY_SORT_ORDER: Record<ApiTaskPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

const TASK_COLUMNS: Array<{ status: ApiTaskStatus; label: string; color: string }> = [
  { status: "TODO", label: "To Do", color: "bg-slate-400" },
  { status: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
  { status: "REVIEW", label: "Review", color: "bg-purple-500" },
  { status: "APPROVED", label: "Approved", color: "bg-amber-500" },
  { status: "DONE", label: "Done", color: "bg-emerald-500" },
]

function defaultIntegrationModeForTaskType(taskType: ApiTaskType) {
  return GITHUB_DEFAULT_TASK_TYPES.has(taskType) ? "GITHUB" : "MANUAL"
}

function toInputDate(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatShortDate(value?: string | null) {
  if (!value) return "No date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No date"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not available"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not available"
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}

function formatDateRange(task: ApiTask) {
  if (!task.startDate && !task.endDate) return "No schedule"
  if (!task.startDate) return `Ends ${formatShortDate(task.endDate)}`
  if (!task.endDate) return `Starts ${formatShortDate(task.startDate)}`
  return `${formatShortDate(task.startDate)} – ${formatShortDate(task.endDate)}`
}

function formatStatusLabel(status: ApiTaskStatus) {
  switch (status) {
    case "IN_PROGRESS": return "In Progress"
    case "REVIEW": return "Review"
    case "APPROVED": return "Approved"
    case "DONE": return "Done"
    case "TODO": default: return "To Do"
  }
}

function formatPriorityLabel(priority: ApiTaskPriority) {
  return priority.charAt(0) + priority.slice(1).toLowerCase()
}

function formatTaskTypeLabel(taskType: ApiTaskType) {
  return TASK_TYPE_OPTIONS.find((o) => o.value === taskType)?.label ?? "Other"
}

function formatIntegrationModeLabel(mode: ApiTaskIntegrationMode) {
  return mode === "GITHUB" ? "GitHub" : "Manual"
}

function formatRoleLabel(member: ApiTeamMember) {
  return member.teamRole === "LEADER" ? "Leader" : "Member"
}

function getPriorityColor(priority: ApiTaskPriority) {
  switch (priority) {
    case "CRITICAL": return "text-rose-600 bg-rose-500/10"
    case "HIGH": return "text-orange-600 bg-orange-500/10"
    case "MEDIUM": return "text-amber-600 bg-amber-500/10"
    case "LOW": default: return "text-emerald-600 bg-emerald-500/10"
  }
}

function getPriorityBarColor(priority: ApiTaskPriority) {
  switch (priority) {
    case "CRITICAL": return "bg-rose-500"
    case "HIGH": return "bg-orange-500"
    case "MEDIUM": return "bg-amber-400"
    case "LOW": default: return "bg-emerald-500"
  }
}

function getStatusColor(status: ApiTaskStatus) {
  switch (status) {
    case "DONE": return "bg-emerald-500"
    case "IN_PROGRESS": return "bg-blue-500"
    case "REVIEW": return "bg-purple-500"
    case "APPROVED": return "bg-amber-500"
    case "TODO": default: return "bg-slate-400"
  }
}

function buildEditableDraft(task: ApiTask): TaskFormState {
  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    startDate: toInputDate(task.startDate),
    endDate: toInputDate(task.endDate),
    assigneeUserId: task.assignee?.id ?? "",
    taskType: task.taskType,
    integrationMode: task.integrationMode,
  }
}

function getTaskNextStep(task: ApiTask, currentUserId?: string | null) {
  if (task.status === "DONE") {
    return { title: "Task completed", description: "No additional action is required unless the task is edited or reopened by the leader." }
  }
  if (task.awaitingAcceptance) {
    return {
      title: task.assignee?.id === currentUserId ? "Accept the task to begin" : "Waiting for assignee acceptance",
      description: task.assignee?.id === currentUserId
        ? "Confirm ownership first so the task can move into In Progress."
        : `${task.assignee?.fullName || "The assignee"} still needs to accept the task before work formally starts.`,
    }
  }
  if (task.status === "IN_PROGRESS") {
    return {
      title: task.assignee?.id === currentUserId ? "Finish the work and submit it" : "Work is in progress",
      description: task.integrationMode === "GITHUB"
        ? "Make sure the issue, branch, pull request, and at least one commit are linked before submitting for review."
        : "Once the work is complete, send it to the leader for review.",
    }
  }
  if (task.status === "REVIEW") {
    return {
      title: "Leader review is pending",
      description: task.permissions.canApprove || task.permissions.canReject
        ? "You can approve the task or send it back with requested changes."
        : "The task is waiting for the team leader to review the submission.",
    }
  }
  if (task.status === "APPROVED") {
    return {
      title: task.integrationMode === "GITHUB" ? "Approved — waiting for PR merge" : "Approved",
      description: task.integrationMode === "GITHUB"
        ? "The pull request can be merged now or later. The task moves to Done when the merge is completed."
        : "This manual task has been approved.",
    }
  }
  return { title: "Ready to start", description: "Review the task details, owner, and schedule before starting the work." }
}

function getReviewDecisionMeta(decision: ApiTask["reviewDecision"]) {
  if (decision === "APPROVED") return { label: "Approved", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" }
  if (decision === "CHANGES_REQUESTED") return { label: "Changes requested", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" }
  return null
}

function compareTasksForView(left: ApiTask, right: ApiTask, sortBy: TaskSortOption) {
  if (sortBy === "due-date") {
    const l = left.endDate ? new Date(left.endDate).getTime() : Number.MAX_SAFE_INTEGER
    const r = right.endDate ? new Date(right.endDate).getTime() : Number.MAX_SAFE_INTEGER
    if (l !== r) return l - r
  }
  if (sortBy === "priority") {
    const d = TASK_PRIORITY_SORT_ORDER[left.priority] - TASK_PRIORITY_SORT_ORDER[right.priority]
    if (d !== 0) return d
  }
  if (sortBy === "updated") {
    const d = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    if (d !== 0) return d
  }
  const sd = TASK_STATUS_SORT_ORDER[left.status] - TASK_STATUS_SORT_ORDER[right.status]
  if (sd !== 0) return sd
  const le = left.endDate ? new Date(left.endDate).getTime() : Number.MAX_SAFE_INTEGER
  const re = right.endDate ? new Date(right.endDate).getTime() : Number.MAX_SAFE_INTEGER
  if (le !== re) return le - re
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
}

function buildWorkflowConfirmation(task: ApiTask, action: TaskWorkflowAction) {
  switch (action) {
    case "accept": return { title: "Accept this task?", description: "This confirms ownership and moves the task from To Do into In Progress.", actionLabel: "Accept task" }
    case "submit": return {
      title: "Submit for review?",
      description: task.integrationMode === "GITHUB" ? "This will send the task to leader review using the linked GitHub evidence." : "This will send the task to the leader for review.",
      actionLabel: "Submit for review",
    }
    case "approve": return {
      title: "Approve this task?",
      description: task.integrationMode === "GITHUB" ? "Approve the task and optionally keep it in Approved until the pull request is merged." : "Approve the task and move it to Done.",
      actionLabel: "Approve task",
    }
    case "reject": default: return { title: "Request changes?", description: "This will move the task back to In Progress and keep your review notes attached.", actionLabel: "Request changes" }
  }
}

function buildWorkflowTimeline(task: ApiTask) {
  const currentStepIndex = TASK_COLUMNS.findIndex((c) => c.status === task.status)
  return TASK_COLUMNS.map((column, index) => ({
    ...column,
    isCurrent: column.status === task.status || (task.awaitingAcceptance && column.status === "TODO"),
    isComplete: task.status === "DONE" ? index <= currentStepIndex : currentStepIndex > index && !task.awaitingAcceptance,
  }))
}

export function TasksBoardPage() {
  const { currentUser } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: myTeamState, isLoading: isTeamLoading, error: teamStateError, refresh: refreshTeamState } = useMyTeamState()

  const requestedTeamId = searchParams.get("teamId")
  const isSupportRole = currentUser?.role === "doctor" || currentUser?.role === "ta" || currentUser?.role === "admin"
  const supportNeedsTeamState = currentUser?.role === "doctor" || currentUser?.role === "ta"
  const fallbackTeam = myTeamState?.team ?? null
  const [supportTeamOptions, setSupportTeamOptions] = useState<ApiTeamSummary[]>([])
  const [supportTeamLoading, setSupportTeamLoading] = useState(false)
  const [supportTeamSearch, setSupportTeamSearch] = useState("")
  const [supportTeamPage, setSupportTeamPage] = useState(1)
  const [supportTeamTotalPages, setSupportTeamTotalPages] = useState(1)

  const team = useMemo(() => {
    if (!isSupportRole) return fallbackTeam
    if (!requestedTeamId) return null
    return supportTeamOptions.find((item) => item.id === requestedTeamId) ?? myTeamState?.supervisedTeams?.find((item) => item.id === requestedTeamId) ?? null
  }, [fallbackTeam, isSupportRole, myTeamState?.supervisedTeams, requestedTeamId, supportTeamOptions])

  const isLeader = currentUser?.role === "leader"
  const isMember = currentUser?.role === "member"

  const assignableMembers = useMemo<ApiTeamMember[]>(() => {
    if (!team) return []
    const roster = new Map<string, ApiTeamMember>()
    if (team.leader) {
      roster.set(team.leader.id, { id: `leader-${team.leader.id}`, joinedAt: team.createdAt, teamRole: "LEADER", user: team.leader })
    }
    const members = "members" in team && Array.isArray(team.members) ? team.members : []
    members.forEach((member) => roster.set(member.user.id, member))
    return Array.from(roster.values())
  }, [team])

  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [view, setView] = useState<"kanban" | "list">("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterTaskType, setFilterTaskType] = useState<string>("all")
  const [filterMode, setFilterMode] = useState<string>("all")
  const [sortBy, setSortBy] = useState<TaskSortOption>("status")
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("overview")
  const [createForm, setCreateForm] = useState<TaskFormState>(DEFAULT_TASK_FORM)
  const [detailDraft, setDetailDraft] = useState<TaskFormState | null>(null)
  const [reviewCommentDraft, setReviewCommentDraft] = useState("")
  const [mergeOnApprove, setMergeOnApprove] = useState(false)
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState<TaskWorkflowAction | null>(null)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [isSavingTask, setIsSavingTask] = useState(false)
  const [taskActionInFlight, setTaskActionInFlight] = useState("")

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const requestedTaskId = searchParams.get("taskId")

  useEffect(() => {
    if (!isSupportRole) return
    if (currentUser?.role === "doctor" || currentUser?.role === "ta") {
      setSupportTeamOptions(myTeamState?.supervisedTeams ?? [])
      setSupportTeamTotalPages(1)
      return
    }
    let cancelled = false
    setSupportTeamLoading(true)
    teamsApi
      .list({ page: supportTeamPage, limit: 12, search: supportTeamSearch || undefined })
      .then((result) => {
        if (cancelled) return
        setSupportTeamTotalPages(result.meta.totalPages || 1)
        setSupportTeamOptions((current) =>
          supportTeamPage === 1
            ? result.items
            : [...current, ...result.items.filter((item) => current.every((e) => e.id !== item.id))],
        )
      })
      .catch(() => { if (!cancelled && supportTeamPage === 1) setSupportTeamOptions([]) })
      .finally(() => { if (!cancelled) setSupportTeamLoading(false) })
    return () => { cancelled = true }
  }, [currentUser?.role, isSupportRole, myTeamState?.supervisedTeams, supportTeamPage, supportTeamSearch])

  useEffect(() => { if (requestedTaskId) setSelectedTaskId(requestedTaskId) }, [requestedTaskId])

  async function refreshTasks() {
    const activeTeamId = requestedTeamId ?? fallbackTeam?.id ?? team?.id
    if (!activeTeamId) { setTasks([]); setIsLoadingTasks(false); return }
    setLoadError("")
    setIsLoadingTasks(true)
    try {
      setTasks(await tasksApi.list({ teamId: activeTeamId }))
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Couldn't load tasks right now.")
    } finally {
      setIsLoadingTasks(false)
    }
  }

  const activeTeamId = requestedTeamId ?? fallbackTeam?.id ?? team?.id

  useEffect(() => {
    if (!activeTeamId) {
      if (!isTeamLoading) { setTasks([]); setIsLoadingTasks(false) }
      return
    }
    let cancelled = false
    const load = async () => {
      setLoadError("")
      setIsLoadingTasks(true)
      try {
        const result = await tasksApi.list({ teamId: activeTeamId })
        if (!cancelled) setTasks(result)
      } catch (error: unknown) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Couldn't load tasks right now.")
      } finally {
        if (!cancelled) setIsLoadingTasks(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [activeTeamId, isTeamLoading])

  useEffect(() => {
    if (!selectedTask) {
      setDetailDraft(null)
      setReviewCommentDraft("")
      setMergeOnApprove(false)
      setPendingWorkflowAction(null)
      setDetailTab("overview")
      return
    }
    setDetailDraft(buildEditableDraft(selectedTask))
    setReviewCommentDraft(selectedTask.reviewComment ?? selectedTask.reviewFeedback ?? "")
    setMergeOnApprove(false)
    setDetailTab("overview")
  }, [selectedTask?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return tasks
      .filter((task) => {
        const matchesSearch = !q || task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q) || task.assignee?.fullName.toLowerCase().includes(q) || formatTaskTypeLabel(task.taskType).toLowerCase().includes(q)
        return matchesSearch &&
          (filterPriority === "all" || task.priority === filterPriority) &&
          (filterStatus === "all" || task.status === filterStatus) &&
          (filterTaskType === "all" || task.taskType === filterTaskType) &&
          (filterMode === "all" || task.integrationMode === filterMode) &&
          (!showMyTasksOnly || task.assignee?.id === currentUser?.id)
      })
      .sort((l, r) => compareTasksForView(l, r, sortBy))
  }, [currentUser?.id, filterMode, filterPriority, filterStatus, filterTaskType, searchQuery, showMyTasksOnly, sortBy, tasks])

  const taskStats = useMemo(() => {
    const mine = tasks.filter((t) => t.assignee?.id === currentUser?.id)
    return {
      myTotal: mine.length,
      myCompleted: mine.filter((t) => t.status === "DONE").length,
      awaitingAcceptance: tasks.filter((t) => t.awaitingAcceptance).length,
      needsReview: tasks.filter((t) => t.status === "REVIEW").length,
      repoBacked: tasks.filter((t) => t.integrationMode === "GITHUB").length,
      overdue: tasks.filter((t) => t.isPastEndDate && t.status !== "DONE").length,
    }
  }, [currentUser?.id, tasks])

  const hasActiveFilters = Boolean(searchQuery.trim()) || filterPriority !== "all" || filterStatus !== "all" || filterTaskType !== "all" || filterMode !== "all" || showMyTasksOnly

  function requestTaskWorkflowAction(action: TaskWorkflowAction) {
    if (!selectedTask) return
    if (action === "reject" && !reviewCommentDraft.trim()) {
      toast.error("Add review comments before requesting changes.")
      return
    }
    setPendingWorkflowAction(action)
  }

  async function handleCreateTask() {
    if (!team?.id) { toast.error("Create or join a team first."); return }
    if (createForm.title.trim().length < 3) { toast.error("Task title must be at least 3 characters."); return }
    if (!createForm.startDate || !createForm.endDate) { toast.error("Choose both a start date and an end date."); return }
    if (!createForm.assigneeUserId) { toast.error("Choose one team member from the checklist."); return }
    setIsCreatingTask(true)
    try {
      await tasksApi.create({
        teamId: team.id,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        priority: createForm.priority,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        assigneeUserId: createForm.assigneeUserId,
        taskType: createForm.taskType,
        integrationMode: createForm.integrationMode,
      })
      toast.success(createForm.integrationMode === "GITHUB" ? "Task created. Open it to bootstrap the GitHub issue and branch." : "Task created and added to To Do.")
      setCreateDialogOpen(false)
      setCreateForm(DEFAULT_TASK_FORM)
      await refreshTasks()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't create the task.")
    } finally {
      setIsCreatingTask(false)
    }
  }

  async function handleSaveTaskChanges() {
    if (!selectedTask || !detailDraft) return
    if (!selectedTask.permissions.canEdit) { toast.error("You can't edit this task."); return }
    if (detailDraft.title.trim().length < 3) { toast.error("Task title must be at least 3 characters."); return }
    if (!detailDraft.startDate || !detailDraft.endDate) { toast.error("Choose both a start date and an end date."); return }
    if (!detailDraft.assigneeUserId) { toast.error("Choose one team member from the checklist."); return }
    setIsSavingTask(true)
    try {
      await tasksApi.update(selectedTask.id, {
        title: detailDraft.title.trim(),
        description: detailDraft.description.trim(),
        priority: detailDraft.priority,
        startDate: detailDraft.startDate,
        endDate: detailDraft.endDate,
        assigneeUserId: detailDraft.assigneeUserId,
        taskType: detailDraft.taskType,
        integrationMode: detailDraft.integrationMode,
      })
      toast.success("Task updated successfully.")
      await refreshTasks()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't update the task.")
    } finally {
      setIsSavingTask(false)
    }
  }

  async function handleTaskWorkflowAction(action: TaskWorkflowAction) {
    if (!selectedTask) return
    if (action === "reject" && !reviewCommentDraft.trim()) { toast.error("Add review comments before requesting changes."); return }
    setTaskActionInFlight(action)
    try {
      if (action === "accept") { await tasksApi.accept(selectedTask.id); toast.success("Task accepted and moved to In Progress.") }
      if (action === "submit") {
        await tasksApi.submitForReview(selectedTask.id)
        toast.success(selectedTask.integrationMode === "GITHUB" ? "Task sent to review. The leader can now inspect the linked PR and commits." : "Task sent to review.")
      }
      if (action === "approve") {
        await tasksApi.approve(selectedTask.id, { reviewComment: reviewCommentDraft.trim() || undefined, mergePullRequest: selectedTask.integrationMode === "GITHUB" ? mergeOnApprove : undefined })
        toast.success(selectedTask.integrationMode === "GITHUB" && !mergeOnApprove ? "Task approved. It will move to Done after the PR is merged." : "Task approved successfully.")
      }
      if (action === "reject") {
        await tasksApi.reject(selectedTask.id, { reviewComment: reviewCommentDraft.trim() })
        toast.success("Task sent back to In Progress with review notes.")
      }
      await refreshTasks()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Couldn't update the task workflow.")
    } finally {
      setTaskActionInFlight("")
    }
  }

  async function handleGitHubTaskAction(action: "bootstrap" | "open-pr" | "resync") {
    if (!selectedTask) return
    setTaskActionInFlight(action)
    try {
      if (action === "bootstrap") {
        await tasksApi.bootstrapGithub(selectedTask.id)
        toast.success("GitHub issue and branch are now linked to this task.")
      }
      if (action === "open-pr") {
        const updatedTask = await tasksApi.openPullRequest(selectedTask.id)
        const prUrl = updatedTask.github?.pullRequest?.url || updatedTask.github?.pullRequest?.htmlUrl
        
        if (prUrl) {
          toast.success("Pull request opened from the linked task branch.", {
            action: {
              label: "Open on GitHub",
              onClick: () => window.open(prUrl, "_blank"),
            },
            duration: 5000,
          })
          
          // Try to open it automatically (might be blocked by popup blocker after the await)
          const newWindow = window.open(prUrl, "_blank")
          if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
            toast.info("Pop-up was blocked. You can open the PR using the link in the notification.", { duration: 4000 })
          }
        } else {
          toast.success("Pull request opened successfully.")
        }
      }
      if (action === "resync") {
        await tasksApi.resyncGithub(selectedTask.id)
        toast.success("Task GitHub evidence refreshed.")
      }
      await refreshTasks()
    } catch (error: any) {
      console.error("[GITHUB_ACTION_ERROR]", error)
      const message = error?.message || ""
      const isNoCommitsError = error?.status === 422 || 
                             error?.code === "GITHUB_VALIDATION_FAILED" || 
                             message.toLowerCase().includes("no commits between")

      // 1. Handle "No Commits" specifically (422 Unprocessable Entity)
      if (isNoCommitsError) {
        toast.error("GitHub can't open a pull request yet", {
          description: "No code changes were found on the branch. Please push your work to GitHub, then click 'Resync' and try again.",
          duration: 8000,
        })
        return
      }

      // 2. Handle "PR already exists" (409 Conflict)
      if (error?.status === 409 || message.toLowerCase().includes("already exists")) {
        toast.info("Pull request already exists", {
          description: "A pull request for this task is already open. Click 'Resync' to refresh the link.",
          duration: 5000,
        })
        return
      }

      // 3. Fallback for other errors
      toast.error("GitHub Action Failed", {
        description: message || "Something went wrong while updating the GitHub flow. Please try again.",
      })
    } finally {
      setTaskActionInFlight("")
    }
  }

  function renderMemberChecklist(members: ApiTeamMember[], selectedAssigneeId: string, onSelect: (id: string) => void, disabled = false) {
    return (
      <div className="space-y-1.5 rounded-xl border border-border/70 p-2">
        {members.map((member) => {
          const checked = selectedAssigneeId === member.user.id
          return (
            <label
              key={member.user.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors",
                checked ? "bg-primary/[0.07] border-primary/20" : "hover:bg-muted/50",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => { if (!disabled) onSelect(member.user.id) }} />
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.user.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback>{member.user.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.user.fullName}</p>
                <p className="text-xs text-muted-foreground">{formatRoleLabel(member)}</p>
              </div>
              {member.user.id === currentUser?.id && <Badge variant="secondary" className="ml-auto text-[10px]">You</Badge>}
            </label>
          )
        })}
      </div>
    )
  }

  function handleSupportTeamSelection(teamId: string) {
    const next = new URLSearchParams(searchParams.toString())
    next.set("teamId", teamId)
    router.replace(`/dashboard/tasks?${next.toString()}`)
  }

  const loadingState = isTeamLoading || isLoadingTasks
  const shouldShowTeamScopedContent = !isSupportRole || Boolean(requestedTeamId)

  if (supportNeedsTeamState && teamStateError) {
    return (
      <TeamRequiredGuard pageName="Tasks & Boards" pageDescription="Manage your team's tasks, GitHub-backed work, and leader review flow in one place." icon={<ClipboardList className="h-10 w-10 text-primary" />}>
        <div className="rounded-[20px] border border-destructive/30 bg-destructive/[0.04] p-6">
          <h2 className="text-lg font-semibold text-destructive">Could not load your supervised teams</h2>
          <p className="mt-1 text-sm text-muted-foreground">{teamStateError}</p>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => void refreshTeamState()}>Try Again</Button>
            <Button variant="outline" asChild className="bg-transparent"><a href="/dashboard/my-team">Open My Team</a></Button>
          </div>
        </div>
      </TeamRequiredGuard>
    )
  }

  return (
    <TeamRequiredGuard
      pageName="Tasks & Boards"
      pageDescription="Manage your team's tasks, GitHub-backed work, and leader review flow in one place."
      icon={<ClipboardList className="h-10 w-10 text-primary" />}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4 sm:space-y-5"
      >

        {/* ── Hero Header ───────────────────────────────────── */}
        <div className="overflow-hidden rounded-[28px] border border-border/60 bg-gradient-to-br from-primary/[0.07] via-background to-primary/[0.03]">
          <div className="grid gap-5 px-6 py-6 sm:px-8 sm:py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-background/80 text-primary">
                  {isLeader ? "Team Leader" : isMember ? "Team Member" : "Tasks"}
                </Badge>
                {team && <Badge variant="secondary">{team.name}</Badge>}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tasks & Board</h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  {isLeader
                    ? "Create tasks, assign work, connect to GitHub, and approve submissions when ready."
                    : isMember
                      ? "Accept assigned tasks, track progress, link GitHub work, and submit for leader review."
                      : "Inspect team tasks, review progress, and track GitHub-backed work."}
                </p>
              </div>
              {/* Workflow steps strip */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: "To Do", cls: "bg-muted text-muted-foreground" },
                  { label: "In Progress", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                  { label: "Review", cls: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
                  { label: "Approved", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                  { label: "Done", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
                ].map((step, i, arr) => (
                  <span key={step.label} className="flex items-center gap-1.5">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", step.cls)}>{step.label}</span>
                    {i < arr.length - 1 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: support selector + new task */}
            <div className="flex flex-col items-start gap-3 lg:items-end">
              {isSupportRole && (
                <div className="w-full space-y-2 sm:w-[280px]">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Team scope</Label>
                  <div className="flex gap-2">
                    <Select value={requestedTeamId ?? ""} onValueChange={handleSupportTeamSelection}>
                      <SelectTrigger className="h-10 rounded-xl flex-1">
                        <SelectValue placeholder={supportTeamLoading ? "Loading..." : "Choose a team"} />
                      </SelectTrigger>
                      <SelectContent>
                        {supportTeamOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {currentUser?.role === "admin" && (
                      <Button type="button" variant="outline" size="sm" className="h-10 rounded-xl shrink-0" onClick={() => setSupportTeamPage((c) => c + 1)} disabled={supportTeamLoading || supportTeamPage >= supportTeamTotalPages}>
                        More
                      </Button>
                    )}
                  </div>
                  {currentUser?.role === "admin" && (
                    <Input value={supportTeamSearch} onChange={(e) => { setSupportTeamSearch(e.target.value); setSupportTeamPage(1) }} placeholder="Search teams..." className="h-10 rounded-xl" />
                  )}
                </div>
              )}
              {isLeader && team && (
                <Button className="h-10 gap-2 rounded-xl px-5 shadow-lg shadow-primary/10" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────── */}
        {shouldShowTeamScopedContent && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {[
              { label: "My Tasks", value: taskStats.myTotal, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Completed", value: taskStats.myCompleted, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Accepting", value: taskStats.awaitingAcceptance, icon: UserCheck, color: "text-sky-500", bg: "bg-sky-500/10" },
              { label: "In Review", value: taskStats.needsReview, icon: ClipboardList, color: "text-violet-500", bg: "bg-violet-500/10" },
              { label: "GitHub", value: taskStats.repoBacked, icon: FolderGit2, color: "text-primary", bg: "bg-primary/10" },
              { label: "Overdue", value: taskStats.overdue, icon: Clock, color: "text-rose-500", bg: "bg-rose-500/10" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="rounded-[18px] border border-border/60 bg-card p-3 sm:p-4">
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl sm:h-8 sm:w-8", stat.bg)}>
                    <stat.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", stat.color)} />
                  </div>
                  <p className="mt-2 text-xl font-bold sm:text-2xl">{stat.value}</p>
                  <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Controls bar ──────────────────────────────────── */}
        {shouldShowTeamScopedContent && (
          <div className="rounded-[20px] border border-border/60 bg-card p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1" style={{ minWidth: "160px" }}>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 rounded-xl pl-9 text-sm" />
              </div>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-9 w-[116px] rounded-xl"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-[120px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTaskType} onValueChange={setFilterTaskType}>
                <SelectTrigger className="h-9 w-[112px] rounded-xl"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {TASK_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as TaskSortOption)}>
                <SelectTrigger className="h-9 w-[126px] rounded-xl"><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">By workflow</SelectItem>
                  <SelectItem value="due-date">By end date</SelectItem>
                  <SelectItem value="priority">By priority</SelectItem>
                  <SelectItem value="updated">Recently updated</SelectItem>
                </SelectContent>
              </Select>
              {(isMember || isLeader) && (
                <Button
                  variant={showMyTasksOnly ? "default" : "outline"}
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl"
                  onClick={() => setShowMyTasksOnly((c) => !c)}
                >
                  <UserRound className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">My Tasks</span>
                </Button>
              )}
              <div className="ml-auto flex overflow-hidden rounded-xl border border-border/60">
                <Button variant={view === "kanban" ? "secondary" : "ghost"} size="sm" className="h-9 w-9 rounded-none rounded-l-xl p-0" onClick={() => setView("kanban")}>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="h-9 w-9 rounded-none rounded-r-xl p-0" onClick={() => setView("list")}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Support role — no team selected ───────────────── */}
        {isSupportRole && !requestedTeamId && (
          <div className="rounded-[20px] border border-dashed border-border/70 px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">Choose a team to load its task board</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Pick a team from the selector above to view its Kanban board, task details, and review history.
            </p>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────── */}
        {loadError && shouldShowTeamScopedContent && (
          <div className="flex flex-col gap-3 rounded-[20px] border border-destructive/30 bg-destructive/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">Could not load the task board.</p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 bg-transparent" onClick={() => void refreshTasks()}>Retry</Button>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────── */}
        {loadingState && shouldShowTeamScopedContent && (
          <div className="flex items-center justify-center gap-3 rounded-[20px] border border-border/60 bg-card p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading tasks...</span>
          </div>
        )}

        {/* ── Kanban view ───────────────────────────────────── */}
        {!loadingState && shouldShowTeamScopedContent && view === "kanban" && (
          <div className="-mx-2 overflow-x-auto px-2 pb-4 sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-3 sm:min-w-0 sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
              {TASK_COLUMNS.map((column) => {
                const columnTasks = filteredTasks.filter((t) => t.status === column.status)
                return (
                  <div key={column.status} className="w-[264px] shrink-0 sm:w-auto sm:shrink">
                    {/* Column header */}
                    <div className="mb-2.5 flex items-center gap-2 px-1">
                      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", column.color)} />
                      <span className="text-sm font-semibold">{column.label}</span>
                      <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{columnTasks.length}</span>
                    </div>

                    <div className="space-y-2">
                      {columnTasks.length === 0 ? (
                        <div className="rounded-[16px] border border-dashed border-border/50 py-8 text-center">
                          <p className="text-xs text-muted-foreground">No tasks</p>
                        </div>
                      ) : columnTasks.map((task) => {
                        const isUrgent = task.isPastEndDate && task.status !== "DONE"
                        const needsMyAction = (task.awaitingAcceptance && task.assignee?.id === currentUser?.id) || (task.status === "REVIEW" && (task.permissions.canApprove || task.permissions.canReject))
                        return (
                          <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
                            <div
                              className={cn(
                                "group relative cursor-pointer overflow-hidden rounded-[16px] border bg-card transition-all hover:border-primary/30 hover:shadow-md",
                                isUrgent ? "border-rose-500/30" : needsMyAction ? "border-primary/25" : "border-border/60",
                              )}
                              onClick={() => setSelectedTaskId(task.id)}
                            >
                              {/* Priority left accent bar */}
                              <div className={cn("absolute bottom-0 left-0 top-0 w-[3px]", getPriorityBarColor(task.priority))} />

                              <div className="p-3 pl-4">
                                {/* Title row */}
                                <div className="mb-2 flex items-start gap-2">
                                  <h4 className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug">{task.title}</h4>
                                  {(isUrgent || needsMyAction) && (
                                    <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", isUrgent ? "text-rose-500" : "text-primary")} />
                                  )}
                                </div>

                                {/* Badges */}
                                <div className="mb-2 flex flex-wrap gap-1">
                                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", getPriorityColor(task.priority))}>
                                    {formatPriorityLabel(task.priority)}
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                                    {formatTaskTypeLabel(task.taskType)}
                                  </span>
                                  {task.integrationMode === "GITHUB" && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                                      <FolderGit2 className="h-2.5 w-2.5" />
                                      GH
                                    </span>
                                  )}
                                </div>

                                {/* Description */}
                                {task.description && (
                                  <p className="mb-2.5 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{task.description}</p>
                                )}

                                {/* Alert flags */}
                                {(task.awaitingAcceptance || isUrgent) && (
                                  <div className="mb-2 flex flex-wrap gap-1">
                                    {task.awaitingAcceptance && (
                                      <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                                        Awaiting acceptance
                                      </span>
                                    )}
                                    {isUrgent && (
                                      <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
                                        Past due
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Footer */}
                                <div className="mt-1 flex items-center justify-between gap-2 border-t border-border/40 pt-2">
                                  <div className="flex min-w-0 items-center gap-1.5">
                                    <Avatar className="h-5 w-5 shrink-0">
                                      <AvatarImage src={task.assignee?.avatarUrl || "/placeholder.svg"} />
                                      <AvatarFallback className="text-[10px]">{task.assignee?.fullName?.charAt(0) || "?"}</AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-[10px] text-muted-foreground">{task.assignee?.fullName || "Unassigned"}</span>
                                  </div>
                                  {task.endDate && (
                                    <span className={cn("shrink-0 text-[10px]", isUrgent ? "font-medium text-rose-500" : "text-muted-foreground")}>
                                      {formatShortDate(task.endDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── List view ─────────────────────────────────────── */}
        {!loadingState && shouldShowTeamScopedContent && view === "list" && (
          <div className="overflow-hidden rounded-[20px] border border-border/60 bg-card">
            {filteredTasks.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No tasks match the current filters.</div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredTasks.map((task) => {
                  const isUrgent = task.isPastEndDate && task.status !== "DONE"
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/30"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className={cn("h-8 w-[3px] shrink-0 rounded-full", getPriorityBarColor(task.priority))} />
                      <div className={cn("h-2 w-2 shrink-0 rounded-full", getStatusColor(task.status))} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">{task.title}</span>
                          {task.awaitingAcceptance && <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">Awaiting acceptance</span>}
                          {isUrgent && <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">Past due</span>}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {task.assignee?.fullName || "Unassigned"} · {formatDateRange(task)} · {formatStatusLabel(task.status)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", getPriorityColor(task.priority))}>
                          {formatPriorityLabel(task.priority)}
                        </span>
                        <span className="hidden rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
                          {formatTaskTypeLabel(task.taskType)}
                        </span>
                        {task.integrationMode === "GITHUB" && <FolderGit2 className="hidden h-3.5 w-3.5 text-primary/60 sm:block" />}
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee?.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback className="text-[10px]">{task.assignee?.fullName?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────── */}
        {!loadingState && !loadError && shouldShowTeamScopedContent && filteredTasks.length === 0 && !hasActiveFilters && (
          <div className="rounded-[20px] border border-dashed border-border/70 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">No tasks yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {isLeader
                ? "Create the first task and choose whether it should stay manual or connect to GitHub from the start."
                : "Once the leader assigns work, tasks will appear here for you to accept and track."}
            </p>
            {isLeader && team && (
              <Button className="mt-5 rounded-xl" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Task
              </Button>
            )}
          </div>
        )}

        {/* ── Task Detail Dialog (tabbed) ───────────────────── */}
        <Dialog open={!!selectedTask && !!detailDraft} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
          <DialogContent className="mx-4 flex max-h-[90vh] w-[94vw] flex-col gap-0 overflow-hidden rounded-[28px] p-0 sm:mx-auto sm:max-w-3xl">
            {selectedTask && detailDraft && (() => {
              const timeline = buildWorkflowTimeline(selectedTask)
              const reviewDecision = getReviewDecisionMeta(selectedTask.reviewDecision)
              const nextStep = getTaskNextStep(selectedTask, currentUser?.id)
              const hasGithub = Boolean(selectedTask.github)
              const githubReady = selectedTask.github?.reviewGate?.ready
              const canEdit = selectedTask.permissions.canEdit && selectedTask.origin === "GPMS"

              const tabs: Array<{ value: DetailTab; label: string; dot?: boolean }> = [
                { value: "overview", label: "Overview" },
                ...(hasGithub ? [{ value: "github" as DetailTab, label: "GitHub", dot: !githubReady }] : []),
                ...(canEdit ? [{ value: "edit" as DetailTab, label: "Edit" }] : []),
              ]

              return (
                <>
                  {/* Fixed header */}
                  <div className="shrink-0 border-b border-border/60 px-6 pb-0 pt-5">
                    {/* Title + badges */}
                    <div className="mb-3">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white", getStatusColor(selectedTask.status))}>
                          {formatStatusLabel(selectedTask.status)}
                        </span>
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", getPriorityColor(selectedTask.priority))}>
                          {formatPriorityLabel(selectedTask.priority)}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground">
                          {formatTaskTypeLabel(selectedTask.taskType)}
                        </span>
                        {selectedTask.integrationMode === "GITHUB" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-primary">
                            <FolderGit2 className="h-3 w-3" />GitHub
                          </span>
                        )}
                        {selectedTask.awaitingAcceptance && (
                          <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                            Awaiting acceptance
                          </span>
                        )}
                        {selectedTask.isPastEndDate && selectedTask.status !== "DONE" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="h-3 w-3" />Past due
                          </span>
                        )}
                      </div>
                      <DialogTitle className="text-base font-bold leading-snug sm:text-lg">{selectedTask.title}</DialogTitle>
                      <DialogDescription className="sr-only">
                        View and manage details for task: {selectedTask.title}
                      </DialogDescription>
                      {selectedTask.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{selectedTask.description}</p>
                      )}
                    </div>
                    {/* Tab bar */}
                    <div className="flex gap-0 border-b-0">
                      {tabs.map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => setDetailTab(tab.value)}
                          className={cn(
                            "relative h-10 border-b-2 px-4 text-sm font-medium transition-colors",
                            detailTab === tab.value
                              ? "border-primary text-foreground"
                              : "border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {tab.label}
                          {tab.dot && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto">

                    {/* ── Overview tab ── */}
                    <div className={cn("space-y-4 p-6", detailTab !== "overview" && "hidden")}>
                      {/* Workflow timeline */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {timeline.map((step, i) => (
                          <div key={step.status} className="flex shrink-0 items-center gap-1">
                            <div className={cn(
                              "flex min-w-[68px] flex-col items-center gap-1.5 rounded-xl border px-3 py-2 text-center transition-colors",
                              step.isCurrent ? "border-primary/40 bg-primary/10" : step.isComplete ? "border-emerald-500/25 bg-emerald-500/10" : "border-border/50 bg-muted/20",
                            )}>
                              <div className={cn("h-2 w-2 rounded-full", step.color)} />
                              <p className={cn("text-[10px] font-semibold uppercase tracking-wide",
                                step.isCurrent ? "text-primary" : step.isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                              )}>{step.label}</p>
                            </div>
                            {i < timeline.length - 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />}
                          </div>
                        ))}
                      </div>

                      {/* Next step callout */}
                      <div className={cn("rounded-[16px] border p-4",
                        selectedTask.isPastEndDate && selectedTask.status !== "DONE" ? "border-rose-500/25 bg-rose-500/[0.05]" :
                        selectedTask.awaitingAcceptance && selectedTask.assignee?.id === currentUser?.id ? "border-primary/25 bg-primary/[0.05]" :
                        selectedTask.status === "REVIEW" && (selectedTask.permissions.canApprove || selectedTask.permissions.canReject) ? "border-purple-500/25 bg-purple-500/[0.05]" :
                        "border-border/60 bg-muted/20",
                      )}>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Next step</p>
                        <p className="mt-1 text-sm font-semibold">{nextStep.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{nextStep.description}</p>
                      </div>

                      {/* Key info */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[
                          { label: "Assignee", content: (
                            <div className="flex items-center gap-2 mt-1.5">
                              <Avatar className="h-6 w-6"><AvatarImage src={selectedTask.assignee?.avatarUrl || "/placeholder.svg"} /><AvatarFallback className="text-[10px]">{selectedTask.assignee?.fullName?.charAt(0) || "?"}</AvatarFallback></Avatar>
                              <span className="truncate text-xs font-medium">{selectedTask.assignee?.fullName || "Unassigned"}</span>
                            </div>
                          )},
                          { label: "Created By", content: (
                            <div className="flex items-center gap-2 mt-1.5">
                              <Avatar className="h-6 w-6"><AvatarImage src={selectedTask.createdBy?.avatarUrl || "/placeholder.svg"} /><AvatarFallback className="text-[10px]">{selectedTask.createdBy?.fullName?.charAt(0) || "?"}</AvatarFallback></Avatar>
                              <span className="truncate text-xs font-medium">{selectedTask.createdBy?.fullName || "Unknown"}</span>
                            </div>
                          )},
                          { label: "Start Date", content: <p className="mt-1.5 text-xs font-medium">{formatShortDate(selectedTask.startDate)}</p> },
                          { label: "End Date", content: <p className={cn("mt-1.5 text-xs font-medium", selectedTask.isPastEndDate && selectedTask.status !== "DONE" ? "text-rose-500" : "")}>{formatShortDate(selectedTask.endDate)}</p> },
                          { label: "Task Type", content: <p className="mt-1.5 text-xs font-medium">{formatTaskTypeLabel(selectedTask.taskType)}</p> },
                          { label: "Mode", content: <p className="mt-1.5 text-xs font-medium">{formatIntegrationModeLabel(selectedTask.integrationMode)}</p> },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl border border-border/60 bg-background/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                            {item.content}
                          </div>
                        ))}
                      </div>

                      {/* Timestamps */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Accepted", value: selectedTask.acceptedAt },
                          { label: "Submitted", value: selectedTask.submittedForReviewAt },
                          { label: "Reviewed", value: selectedTask.reviewedAt },
                        ].map((ts) => (
                          <div key={ts.label} className="rounded-xl border border-border/60 bg-muted/10 p-3">
                            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{ts.label}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{formatDateTime(ts.value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Review feedback */}
                      {selectedTask.reviewFeedback && (
                        <div className="rounded-[16px] border border-amber-500/20 bg-amber-500/[0.05] p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">Review note</p>
                            {reviewDecision && (
                              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", reviewDecision.className)}>
                                {reviewDecision.label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">{selectedTask.reviewFeedback}</p>
                        </div>
                      )}

                      {/* Leader review form */}
                      {(selectedTask.permissions.canApprove || selectedTask.permissions.canReject) && (
                        <div className="space-y-3 rounded-[16px] border border-border/60 bg-muted/10 p-4">
                          <div>
                            <p className="text-sm font-semibold">Leader Review</p>
                            <p className="text-xs text-muted-foreground">Your comment stays attached. Requesting changes moves the task back to In Progress.</p>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="task-review-comment" className="text-xs">Review Comment</Label>
                            <Textarea id="task-review-comment" value={reviewCommentDraft} onChange={(e) => setReviewCommentDraft(e.target.value)} placeholder="Add approval notes or explain what needs to change" className="resize-none rounded-xl" rows={3} />
                          </div>
                          {selectedTask.integrationMode === "GITHUB" && selectedTask.github?.pullRequest?.number && (
                            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-3">
                              <Checkbox checked={mergeOnApprove} onCheckedChange={(c) => setMergeOnApprove(c === true)} />
                              <div>
                                <p className="text-sm font-medium">Merge pull request when approving</p>
                                <p className="text-xs text-muted-foreground">Leave off if you want the task in Approved until the PR is merged later.</p>
                              </div>
                            </label>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── GitHub tab ── */}
                    {hasGithub && (
                      <div className={cn("space-y-4 p-6", detailTab !== "github" && "hidden")}>
                        {/* GitHub action buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl bg-transparent" asChild>
                            <a href={`/dashboard/github?teamId=${selectedTask.team.id}`}>
                              <FolderGit2 className="h-3.5 w-3.5" />Open Workspace
                            </a>
                          </Button>
                          {selectedTask.permissions.canResyncGithub && (
                            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl bg-transparent" onClick={() => void handleGitHubTaskAction("resync")} disabled={taskActionInFlight !== ""}>
                              {taskActionInFlight === "resync" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                              Resync
                            </Button>
                          )}
                          {selectedTask.permissions.canBootstrapGithub && (
                            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl bg-transparent" onClick={() => void handleGitHubTaskAction("bootstrap")} disabled={taskActionInFlight !== ""}>
                              {taskActionInFlight === "bootstrap" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
                              Setup Issue + Branch
                            </Button>
                          )}
                          {selectedTask.permissions.canOpenPullRequest && (
                            <Button
                              size="sm"
                              className="gap-1.5 rounded-xl"
                              onClick={() => void handleGitHubTaskAction("open-pr")}
                              disabled={taskActionInFlight !== "" || !selectedTask.github?.reviewGate?.hasCommits}
                              title={!selectedTask.github?.reviewGate?.hasCommits ? "Push at least one commit to GitHub first" : ""}
                            >
                              {taskActionInFlight === "open-pr" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitPullRequest className="h-3.5 w-3.5" />}
                              Open Pull Request
                            </Button>
                          )}
                        </div>

                        {/* GitHub Status Alert */}
                        {selectedTask.github?.reviewGate && !selectedTask.github.reviewGate.hasCommits && selectedTask.github.reviewGate.hasBranch && (
                          <div className="rounded-[16px] border border-amber-500/20 bg-amber-500/[0.08] p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">No commits detected on branch</p>
                                <p className="text-xs leading-5 text-amber-800/80 dark:text-amber-200/70">
                                  GitHub needs at least one code change to open a pull request. 
                                  Push your changes to <code className="rounded bg-amber-500/20 px-1 font-mono text-[10px]">{selectedTask.github.branch?.name || "the task branch"}</code>, 
                                  then click <strong className="font-semibold">Resync</strong> to update the status.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Review gate checklist */}
                        {selectedTask.github?.reviewGate && (
                          <div className="overflow-hidden rounded-[16px] border border-border/60">
                            <div className={cn("border-b border-border/60 px-4 py-3", selectedTask.github.reviewGate.ready ? "bg-emerald-500/[0.06]" : "bg-amber-500/[0.06]")}>
                              <div className="flex items-center gap-2">
                                {selectedTask.github.reviewGate.ready
                                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  : <AlertTriangle className="h-4 w-4 text-amber-500" />
                                }
                                <p className="text-sm font-semibold">
                                  {selectedTask.github.reviewGate.ready ? "Ready for review" : "Complete these steps before submitting"}
                                </p>
                              </div>
                            </div>
                            <div className="divide-y divide-border/40">
                              {[
                                { label: "GitHub Issue linked", done: selectedTask.github.reviewGate.hasIssue },
                                { label: "Task branch created", done: selectedTask.github.reviewGate.hasBranch },
                                { label: "Pull request opened", done: selectedTask.github.reviewGate.hasOpenPullRequest },
                                { label: "At least one commit pushed", done: selectedTask.github.reviewGate.hasCommits },
                              ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3 px-4 py-3">
                                  <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", item.done ? "bg-emerald-500/20" : "bg-muted/50")}>
                                    {item.done
                                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                      : <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                    }
                                  </div>
                                  <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                                  {!item.done && <span className="ml-auto text-[10px] font-semibold text-amber-600 dark:text-amber-400">Needed</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* GitHub evidence grid */}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Repository</p>
                            {selectedTask.github?.repository?.repoUrl ? (
                              <a href={selectedTask.github.repository.repoUrl} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                {selectedTask.github.repository.fullName}<ExternalLink className="h-3 w-3" />
                              </a>
                            ) : <p className="mt-1.5 text-sm text-muted-foreground">No active connection</p>}
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Issue</p>
                            {selectedTask.github?.issue?.url ? (
                              <a href={selectedTask.github.issue.url} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                #{selectedTask.github.issue.number}<ExternalLink className="h-3 w-3" />
                              </a>
                            ) : <p className="mt-1.5 text-sm text-muted-foreground">No issue linked yet</p>}
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Branch</p>
                            <p className="mt-1 text-sm font-medium">{selectedTask.github?.branch?.name || selectedTask.github?.branch?.suggestedName || "No branch yet"}</p>
                            <div className="mt-1 flex flex-wrap gap-3">
                              {selectedTask.github?.branch?.url && <a href={selectedTask.github.branch.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open branch</a>}
                              {selectedTask.github?.branch?.compareUrl && <a href={selectedTask.github.branch.compareUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View diff</a>}
                            </div>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pull Request</p>
                            {selectedTask.github?.pullRequest?.url ? (
                              <div className="mt-1.5">
                                <a href={selectedTask.github.pullRequest.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                  PR #{selectedTask.github.pullRequest.number}<ExternalLink className="h-3 w-3" />
                                </a>
                                {selectedTask.github.pullRequest.mergedAt && (
                                  <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">Merged {formatDateTime(selectedTask.github.pullRequest.mergedAt)}</p>
                                )}
                              </div>
                            ) : <p className="mt-1.5 text-sm text-muted-foreground">No PR linked yet</p>}
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/70 p-3 sm:col-span-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Commits</p>
                            <div className="mt-1.5 flex items-center justify-between">
                              <div>
                                {selectedTask.github?.latestCommit?.url ? (
                                  <a href={selectedTask.github.latestCommit.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline">
                                    {selectedTask.github.latestCommit.shortSha}<ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : <p className="text-sm text-muted-foreground">No commits tracked yet</p>}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">{selectedTask.github?.commitCount ?? 0}</p>
                                <p className="text-[10px] text-muted-foreground">commits</p>
                              </div>
                            </div>
                            <p className="mt-1.5 text-[10px] text-muted-foreground">Last synced {formatDateTime(selectedTask.github?.lastSyncedAt)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Edit tab ── */}
                    {canEdit && (
                      <div className={cn("space-y-4 p-6", detailTab !== "edit" && "hidden")}>
                        <div className="rounded-[16px] border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3">
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            Changing the assignee, dates, task type, or tracking mode resets the workflow back to To Do.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="task-edit-title" className="text-sm font-medium">Title</Label>
                          <Input id="task-edit-title" value={detailDraft.title} onChange={(e) => setDetailDraft((c) => c ? { ...c, title: e.target.value } : c)} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="task-edit-description" className="text-sm font-medium">Description</Label>
                          <Textarea id="task-edit-description" value={detailDraft.description} onChange={(e) => setDetailDraft((c) => c ? { ...c, description: e.target.value } : c)} className="resize-none rounded-xl" rows={4} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Task Type</Label>
                            <Select value={detailDraft.taskType} onValueChange={(v) => setDetailDraft((c) => c ? { ...c, taskType: v as ApiTaskType, integrationMode: defaultIntegrationModeForTaskType(v as ApiTaskType) } : c)}>
                              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>{TASK_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Tracking Mode</Label>
                            <Select value={detailDraft.integrationMode} onValueChange={(v) => setDetailDraft((c) => c ? { ...c, integrationMode: v as ApiTaskIntegrationMode } : c)}>
                              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>{INTEGRATION_MODE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Priority</Label>
                            <Select value={detailDraft.priority} onValueChange={(v) => setDetailDraft((c) => c ? { ...c, priority: v as ApiTaskPriority } : c)}>
                              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="CRITICAL">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="task-edit-start-date" className="text-sm font-medium">Start Date</Label>
                            <Input id="task-edit-start-date" type="date" value={detailDraft.startDate} onChange={(e) => setDetailDraft((c) => c ? { ...c, startDate: e.target.value } : c)} className="rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="task-edit-end-date" className="text-sm font-medium">End Date</Label>
                            <Input id="task-edit-end-date" type="date" value={detailDraft.endDate} onChange={(e) => setDetailDraft((c) => c ? { ...c, endDate: e.target.value } : c)} className="rounded-xl" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Assign To</Label>
                          {renderMemberChecklist(assignableMembers, detailDraft.assigneeUserId, (id) => setDetailDraft((c) => c ? { ...c, assigneeUserId: id } : c))}
                        </div>
                        <Button className="w-full rounded-xl" onClick={() => void handleSaveTaskChanges()} disabled={isSavingTask}>
                          {isSavingTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Fixed footer — workflow actions */}
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/60 p-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.permissions.canAccept && (
                        <Button className="h-9 gap-1.5 rounded-xl" onClick={() => requestTaskWorkflowAction("accept")} disabled={taskActionInFlight !== ""}>
                          {taskActionInFlight === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                          Accept & Start
                        </Button>
                      )}
                      {selectedTask.permissions.canSubmitForReview && (
                        <Button className="h-9 rounded-xl" onClick={() => requestTaskWorkflowAction("submit")} disabled={taskActionInFlight !== ""}>
                          {taskActionInFlight === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Review"}
                        </Button>
                      )}
                      {selectedTask.permissions.canApprove && (
                        <Button className="h-9 rounded-xl" onClick={() => requestTaskWorkflowAction("approve")} disabled={taskActionInFlight !== ""}>
                          {taskActionInFlight === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                        </Button>
                      )}
                      {selectedTask.permissions.canReject && (
                        <Button variant="outline" className="h-9 rounded-xl border-destructive/30 bg-transparent text-destructive hover:bg-destructive/5" onClick={() => requestTaskWorkflowAction("reject")} disabled={taskActionInFlight !== ""}>
                          {taskActionInFlight === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Changes"}
                        </Button>
                      )}
                    </div>
                    <Button variant="ghost" className="h-9 rounded-xl" onClick={() => setSelectedTaskId(null)}>Close</Button>
                  </div>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* ── Create Task Dialog ────────────────────────────── */}
        {isLeader && team && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="mx-4 max-h-[90vh] w-[94vw] overflow-y-auto rounded-[28px] sm:mx-auto sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Code, documentation, and design tasks connect to GitHub automatically when the mode is set to GitHub.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="create-task-title">Title</Label>
                  <Input id="create-task-title" placeholder="Task title" value={createForm.title} onChange={(e) => setCreateForm((c) => ({ ...c, title: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-task-description">Description</Label>
                  <Textarea id="create-task-description" placeholder="Briefly describe the work" value={createForm.description} onChange={(e) => setCreateForm((c) => ({ ...c, description: e.target.value }))} className="resize-none rounded-xl" rows={3} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Task Type</Label>
                    <Select value={createForm.taskType} onValueChange={(v) => setCreateForm((c) => ({ ...c, taskType: v as ApiTaskType, integrationMode: defaultIntegrationModeForTaskType(v as ApiTaskType) }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking</Label>
                    <Select value={createForm.integrationMode} onValueChange={(v) => setCreateForm((c) => ({ ...c, integrationMode: v as ApiTaskIntegrationMode }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{INTEGRATION_MODE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={createForm.priority} onValueChange={(v) => setCreateForm((c) => ({ ...c, priority: v as ApiTaskPriority }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {createForm.integrationMode === "GITHUB" && (
                  <div className="rounded-[16px] border border-primary/20 bg-primary/[0.04] px-4 py-3">
                    <p className="text-xs font-medium text-primary">
                      GitHub mode — an issue and branch will be created when you open this task for the first time.
                    </p>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-task-start-date">Start Date</Label>
                    <Input id="create-task-start-date" type="date" value={createForm.startDate} onChange={(e) => setCreateForm((c) => ({ ...c, startDate: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-task-end-date">End Date</Label>
                    <Input id="create-task-end-date" type="date" value={createForm.endDate} onChange={(e) => setCreateForm((c) => ({ ...c, endDate: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <p className="text-xs text-muted-foreground">Assign the task to any team member, including the leader.</p>
                  {renderMemberChecklist(assignableMembers, createForm.assigneeUserId, (id) => setCreateForm((c) => ({ ...c, assigneeUserId: id })))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" className="rounded-xl bg-transparent" onClick={() => { setCreateDialogOpen(false); setCreateForm(DEFAULT_TASK_FORM) }}>Cancel</Button>
                <Button className="rounded-xl" onClick={() => void handleCreateTask()} disabled={isCreatingTask}>
                  {isCreatingTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* ── Workflow Confirm Dialog ───────────────────────── */}
        <AlertDialog open={pendingWorkflowAction !== null} onOpenChange={(open) => !open && setPendingWorkflowAction(null)}>
          {selectedTask && pendingWorkflowAction ? (
            <AlertDialogContent className="rounded-[24px]">
              <AlertDialogHeader>
                <AlertDialogTitle>{buildWorkflowConfirmation(selectedTask, pendingWorkflowAction).title}</AlertDialogTitle>
                <AlertDialogDescription>{buildWorkflowConfirmation(selectedTask, pendingWorkflowAction).description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl"
                  onClick={(e) => {
                    e.preventDefault()
                    const a = pendingWorkflowAction
                    setPendingWorkflowAction(null)
                    void handleTaskWorkflowAction(a)
                  }}
                >
                  {buildWorkflowConfirmation(selectedTask, pendingWorkflowAction).actionLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          ) : null}
        </AlertDialog>

      </motion.div>
    </TeamRequiredGuard>
  )
}
