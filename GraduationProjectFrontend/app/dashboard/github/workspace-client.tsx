"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  Check,
  CheckSquare,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  FileCode2,
  FilePlus2,
  Folder,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  Globe,
  Github,
  GitMerge,
  GitPullRequest,
  Link2,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Unplug,
  Upload,
  UserRound,
  UserMinus,
  UserPlus,
  Users,
  WandSparkles,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { TeamRequiredLoadingState, TeamRequiredState } from "@/components/team-required-guard"
import { githubApi } from "@/lib/api/github"
import { ApiRequestError } from "@/lib/api/http"
import { teamsApi } from "@/lib/api/teams"
import { tasksApi } from "@/lib/api/tasks"
import { useMyTeamState } from "@/lib/hooks/use-my-team-state"
import type {
  ApiGitHubBlob,
  ApiGitHubBranch,
  ApiGitHubCommit,
  ApiGitHubCommitDetail,
  ApiGitHubCommitPage,
  ApiGitHubCompare,
  ApiGitHubRepositoryAccessState,
  ApiGitHubRepositoryCollaborator,
  ApiGitHubRepositoryInvitation,
  ApiGitHubInstallation,
  ApiGitHubIssue,
  ApiGitHubPullRequest,
  ApiGitHubRelease,
  ApiGitHubRepositoryVisibility,
  ApiGitHubWorkflowRun,
  ApiGitHubWorkspaceSummary,
  ApiTask,
  ApiTeamSummary,
} from "@/lib/api/types"
import { useAuthStore } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
      Loading editor...
    </div>
  ),
})

type WorkspaceTab = "overview" | "code" | "commits" | "issues" | "pulls" | "branches" | "actions" | "releases" | "members" | "settings"
type RepositorySetupMode = "create" | "connect"
type PullRequestMergeMethod = "merge" | "squash" | "rebase"
type GitHubCallbackNotice = {
  tone: "success" | "error" | "warning"
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}
type GitHubCallbackPayload = {
  githubInstall?: string | null
  githubConnect?: string | null
  reason?: string | null
  installationId?: string | null
  owner?: string | null
}
type FolderUploadEntry = {
  relativePath: string
  content: string
  size: number
}
type FolderUploadRejectedEntry = {
  relativePath: string
  reason: string
}
type FolderUploadMode = "create" | "upsert"
type PathActivityState = {
  path: string
  loading: boolean
  lastUpdatedAt: string | null
  error: string
}
type TreeDeleteDialogState = {
  open: boolean
  path: string
  isDirectory: boolean
  message: string
}

type ConfirmationTone = "danger" | "warning"

type ConfirmationDialogState = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  busyKey: string | null
  tone: ConfirmationTone
  notes: string[]
  confirmationLabel?: string
  confirmationPlaceholder?: string
  confirmationValues?: string[]
  confirmationCaseSensitive?: boolean
  action: ((confirmationText?: string) => Promise<void>) | null
}

const SUPPORT_ROLES = new Set(["admin", "doctor", "ta"])
const RECENT_COMMITS_PAGE_SIZE = 20
const ISSUES_PAGE_SIZE = 40
const PULLS_PAGE_SIZE = 40
const MAX_FILES_PER_COMMIT = 20
const MAX_FOLDER_UPLOAD_FILE_SIZE_BYTES = 1024 * 1024
const GITHUB_CALLBACK_MESSAGE_TYPE = "gpms:github-callback"
const GITHUB_INSTALL_STATUS_POLL_MS = 2500
const GITHUB_INSTALL_STATUS_TIMEOUT_MS = 120000
const workspaceTabTriggerClass =
  "relative min-h-10 rounded-[18px] px-3 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-250 ease-out motion-reduce:transition-none sm:px-3.5 sm:py-2.5 sm:text-sm hover:-translate-y-0.5 hover:text-primary hover:bg-primary/8 hover:shadow-[0_10px_22px_-18px_color-mix(in_oklab,var(--primary)_30%,transparent)] dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 data-[state=active]:-translate-y-0.5 data-[state=active]:text-primary data-[state=active]:bg-primary/12 data-[state=active]:shadow-[0_12px_24px_-18px_color-mix(in_oklab,var(--primary)_40%,transparent)] data-[state=active]:ring-1 data-[state=active]:ring-primary/30 after:pointer-events-none after:absolute after:inset-x-4 after:bottom-1.5 after:h-[2px] after:rounded-full after:bg-primary after:opacity-0 after:scale-x-50 after:transition-all after:duration-250 after:ease-out hover:after:opacity-70 hover:after:scale-x-100 data-[state=active]:after:opacity-100 data-[state=active]:after:scale-x-100"
const quickActionButtonClass =
  "group h-10 w-full justify-start rounded-xl border border-border/60 bg-background/70 text-foreground/85 transition-all duration-200 motion-reduce:transform-none hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
const tabActionButtonClass =
  "h-10 rounded-xl border-border/50 bg-background/70 text-foreground/85 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary"

const initialConfirmationDialogState: ConfirmationDialogState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Confirm",
  busyKey: null,
  tone: "danger",
  notes: [],
  confirmationLabel: undefined,
  confirmationPlaceholder: undefined,
  confirmationValues: [],
  confirmationCaseSensitive: false,
  action: null,
}

const editorLanguageMap: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  css: "css",
  scss: "scss",
  md: "markdown",
  html: "html",
  yml: "yaml",
  yaml: "yaml",
  py: "python",
  prisma: "plaintext",
  sql: "sql",
  sh: "shell",
  env: "shell",
}

const initialCreateRepoForm = {
  installationId: "",
  owner: "",
  ownerType: "USER" as "USER" | "ORGANIZATION",
  repoName: "",
  description: "",
  visibility: "PRIVATE" as ApiGitHubRepositoryVisibility,
  defaultBranch: "main",
  templateOwner: "",
  templateRepo: "",
}

const initialConnectRepoForm = {
  installationId: "",
  owner: "",
  repoName: "",
}

const initialIssueForm = {
  title: "",
  body: "",
  assignees: "",
  labels: "",
}

const initialPullRequestForm = {
  title: "",
  body: "",
  head: "",
  base: "main",
  draft: false,
  reviewers: "",
}

const initialReleaseForm = {
  tagName: "",
  name: "",
  targetCommitish: "",
  body: "",
  draft: false,
  prerelease: false,
}

const emptyRepositoryAccessState: ApiGitHubRepositoryAccessState = {
  collaborators: [],
  invitations: [],
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatRelative(value?: string | null) {
  if (!value) return "Not available"
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

function useDebouncedValue<T>(value: T, delayMs = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs, value])
  return debounced
}

function formatRepoSize(sizeInKb?: number | null) {
  const bytes = Math.max(Number(sizeInKb ?? 0), 0) * 1024
  if (!bytes) return "0 KB"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`
}

function getCommitSubject(message?: string | null) {
  return String(message ?? "").split("\n")[0]?.trim() || "Untitled commit"
}

function getCommitBody(message?: string | null) {
  const [, ...rest] = String(message ?? "").split("\n")
  const body = rest.join("\n").trim()
  return body || null
}

function formatCommitChangeLabel(status?: string | null) {
  switch (String(status ?? "").toLowerCase()) {
    case "added":
      return "Added"
    case "removed":
      return "Removed"
    case "modified":
      return "Modified"
    case "renamed":
      return "Renamed"
    case "copied":
      return "Copied"
    default:
      return String(status ?? "Changed")
  }
}

function getCommitChangeBadgeClass(status?: string | null) {
  switch (String(status ?? "").toLowerCase()) {
    case "added":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "removed":
      return "border-red-200 bg-red-50 text-red-700"
    case "renamed":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "copied":
      return "border-sky-200 bg-sky-50 text-sky-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

function getInitials(name?: string | null) {
  const normalized = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!normalized.length) return "GP"
  return normalized
    .slice(0, 2)
    .map((item) => item.charAt(0).toUpperCase())
    .join("")
}

function getFileLanguage(path?: string | null) {
  const filename = String(path ?? "")
  const extension = filename.split(".").pop()?.toLowerCase()
  return (extension && editorLanguageMap[extension]) || "plaintext"
}

function getParentPath(path?: string | null) {
  const normalized = String(path ?? "").trim().replace(/^\/+|\/+$/g, "")
  if (!normalized) return ""

  const segments = normalized.split("/")
  segments.pop()
  return segments.join("/")
}

function getPathSegments(path?: string | null) {
  const normalized = String(path ?? "").trim().replace(/^\/+|\/+$/g, "")
  if (!normalized) return []

  return normalized.split("/").map((segment, index, array) => ({
    label: segment,
    value: array.slice(0, index + 1).join("/"),
  }))
}

function buildSuggestedNewFilePath(path?: string | null) {
  const normalized = String(path ?? "").trim().replace(/^\/+|\/+$/g, "")
  return normalized ? `${normalized}/untitled.txt` : "untitled.txt"
}

function buildSuggestedCreateFileMessage(path?: string | null) {
  const normalized = String(path ?? "").trim().replace(/^\/+/, "")
  return normalized ? `Create ${normalized}` : "Create a new file"
}

function normalizeUploadRelativePath(path?: string | null) {
  const normalized = String(path ?? "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^\.\/+/, "")
    .trim()

  if (!normalized || normalized.endsWith("/")) return ""
  const segments = normalized.split("/").filter(Boolean)
  if (!segments.length) return ""
  if (segments.some((segment) => segment === "." || segment === "..")) return ""
  return segments.join("/")
}

function joinRepositoryPath(basePath?: string | null, relativePath?: string | null) {
  const base = String(basePath ?? "").trim().replace(/^\/+|\/+$/g, "")
  const relative = normalizeUploadRelativePath(relativePath)
  if (!relative) return ""
  return base ? `${base}/${relative}` : relative
}

async function readFileAsUtf8(file: File) {
  const buffer = await file.arrayBuffer()
  const decoder = new TextDecoder("utf-8", { fatal: true })
  return decoder.decode(buffer)
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function toPathBusyKey(prefix: string, path: string) {
  return `${prefix}-${path.replaceAll("/", "_")}`
}

function isSensitiveUploadPath(path: string) {
  const normalized = path.toLowerCase()
  const fileName = normalized.split("/").pop() ?? normalized
  const sensitiveDotEnv = fileName.startsWith(".env") && fileName !== ".env.example"
  const sensitiveExtension = [".pem", ".key", ".p12", ".pfx", ".jks", ".keystore"].some((suffix) => fileName.endsWith(suffix))
  const sensitiveKnownFiles = [".npmrc", "id_rsa", "id_ed25519", "google-services.json", "service-account.json"].includes(fileName)
  return sensitiveDotEnv || sensitiveExtension || sensitiveKnownFiles
}

function detectSecretLikeContent(content: string) {
  const patterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\bghp_[a-zA-Z0-9]{36}\b/,
    /\bgithub_pat_[a-zA-Z0-9_]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /aws_secret_access_key\s*[:=]\s*[a-zA-Z0-9/+=]{32,}/i,
    /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["']?[a-zA-Z0-9_\-/+=]{20,}/i,
  ]
  return patterns.some((pattern) => pattern.test(content))
}

function getPullRequestMergeGuidance(pullRequest: ApiGitHubPullRequest) {
  if (pullRequest.merged) {
    return {
      tone: "success" as const,
      label: "Merged",
      detail: "This pull request is already merged.",
      canMerge: false,
    }
  }

  if (pullRequest.state !== "open") {
    return {
      tone: "muted" as const,
      label: "Closed",
      detail: "Closed pull requests cannot be merged.",
      canMerge: false,
    }
  }

  if (pullRequest.draft) {
    return {
      tone: "warning" as const,
      label: "Draft",
      detail: "Mark this pull request as ready for review before merging.",
      canMerge: false,
    }
  }

  if (pullRequest.mergeable === null) {
    return {
      tone: "warning" as const,
      label: "Merge check pending",
      detail: "GitHub is still calculating mergeability. Click refresh to check again.",
      canMerge: false,
    }
  }

  if (pullRequest.mergeable === false) {
    return {
      tone: "danger" as const,
      label: "Merge blocked",
      detail: "GitHub reports conflicts or unmet requirements (checks/reviews/branch rules).",
      canMerge: false,
    }
  }

  return {
    tone: "success" as const,
    label: "Ready to merge",
    detail: "All merge checks passed and this pull request can be merged.",
    canMerge: true,
  }
}

function isEditableBlob(blob: ApiGitHubBlob | null, branch: ApiGitHubBranch | null, canWrite: boolean) {
  if (!blob || !canWrite || blob.readOnly || branch?.protected) return false
  return true
}

function friendlyError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function friendlyWriteConflictAwareError(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError && error.code === "GITHUB_BRANCH_HEAD_CONFLICT") {
    return "This branch changed while you were editing. Refresh the code tab to get the latest files, then apply your changes again."
  }
  return friendlyError(error, fallback)
}

function getGitHubConnectErrorNotice(reason?: string | null): GitHubCallbackNotice {
  const normalizedReason = String(reason ?? "").trim()
  const lowerReason = normalizedReason.toLowerCase()

  if (
    lowerReason.includes("email mismatch") ||
    (lowerReason.includes("does not match") && lowerReason.includes("email")) ||
    lowerReason.includes("wrong email")
  ) {
    return {
      tone: "error",
      title: "Wrong GitHub account selected",
      message:
        "The GitHub account you picked does not match this GPMS account. Sign in with the correct GitHub account, then try Connect Personal GitHub again.",
    }
  }

  if (
    lowerReason.includes("username mismatch") ||
    lowerReason.includes("login mismatch") ||
    lowerReason.includes("account mismatch") ||
    lowerReason.includes("wrong account") ||
    lowerReason.includes("different account") ||
    lowerReason.includes("not acceptable") ||
    lowerReason.includes("not allowed for this account")
  ) {
    return {
      tone: "error",
      title: "This GitHub account is not acceptable",
      message:
        "You must connect the same GitHub account linked to your GPMS profile. Please switch GitHub account, then try Connect Personal GitHub again.",
    }
  }

  if (lowerReason.includes("already connected")) {
    return {
      tone: "error",
      title: "GitHub account already in use",
      message:
        "This GitHub account is already linked to another GPMS account. Disconnect it there first, or choose a different GitHub account here.",
    }
  }

  return {
    tone: "error",
    title: "GitHub connection failed",
    message: normalizedReason || "GitHub personal connection failed.",
  }
}

function isTeamRequiredWorkspaceError(error: unknown) {
  if (!(error instanceof ApiRequestError)) return false

  if (error.code === "TEAM_REQUIRED" || error.code === "TEAM_ID_REQUIRED") return true

  const message = error.message.toLowerCase()
  return message.includes("github workspace") && (message.includes("part of a team") || message.includes("provide a teamid"))
}

function normalizeGitHubVisibility(value?: string | null) {
  return String(value ?? "private").toLowerCase()
}

function normalizeGitHubMatchValue(value?: string | null) {
  return String(value ?? "").trim().toLowerCase()
}

function normalizeInstallationIdValue(value?: string | null) {
  return String(value ?? "").trim()
}

function isKnownInstallationId(installations: ApiGitHubInstallation[], installationId?: string | null) {
  const normalizedInstallationId = normalizeInstallationIdValue(installationId)
  return Boolean(normalizedInstallationId) && installations.some((installation) => installation.id === normalizedInstallationId)
}

function pickSuggestedInstallation(
  installations: ApiGitHubInstallation[],
  ...candidates: Array<string | null | undefined>
) {
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeGitHubMatchValue(candidate)
    if (!normalizedCandidate) continue

    const matchedInstallation = installations.find(
      (installation) =>
        normalizeGitHubMatchValue(installation.accountLogin) === normalizedCandidate ||
        normalizeInstallationIdValue(installation.id) === normalizeInstallationIdValue(candidate),
    )

    if (matchedInstallation) return matchedInstallation
  }

  return installations[0] ?? null
}

function humanizeStateLabel(value?: string | null) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()

  if (!normalized) return "Unknown"

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color = "blue", 
  onClick 
}: { 
  icon: ReactNode; 
  label: string; 
  value: string; 
  color?: "blue" | "amber" | "emerald" | "indigo";
  onClick?: () => void;
}) {
  const colorMap = {
    blue: "text-primary bg-primary/10 border-primary/20 shadow-primary/10",
    amber: "text-destructive bg-destructive/5 border-destructive/20 shadow-destructive/5 dark:bg-destructive/10 dark:border-destructive/20 dark:text-destructive",
    emerald: "text-emerald-600 bg-emerald-50/50 border-emerald-100 shadow-emerald-500/5 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400",
    indigo: "text-slate-700 bg-slate-50/50 border-slate-200 shadow-slate-500/5 dark:bg-slate-500/10 dark:border-slate-500/20 dark:text-slate-400",
  };

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[28px] border bg-background p-6 text-left transition-all duration-300",
        onClick ? "cursor-pointer hover:border-primary/30 hover:shadow-xl" : "cursor-default border-border/50 shadow-sm"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-110", colorMap[color])}>
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
      </div>
    </motion.button>
  );
}

function AutomationRow({ icon, label, active }: { icon: ReactNode; label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/40 bg-muted/[0.03] p-4 transition-all hover:bg-muted/[0.06] hover:border-border/60">
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
          active ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/10 border-border/40 text-muted-foreground/60"
        )}>
          {icon}
        </div>
        <span className="text-sm font-semibold text-foreground/80">{label}</span>
      </div>
      <Badge 
        className={cn(
          "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider border-none shadow-none",
          active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
        )}
      >
        {active ? "Active" : "Disabled"}
      </Badge>
    </div>
  );
}

function getMemberRepositoryAccessState({
  githubUsername,
  repositoryOwnerLogin,
  repositoryVisibility,
  collaborator,
  invitation,
}: {
  githubUsername?: string | null
  repositoryOwnerLogin?: string | null
  repositoryVisibility?: string | null
  collaborator?: ApiGitHubRepositoryCollaborator
  invitation?: ApiGitHubRepositoryInvitation
}) {
  const normalizedUsername = normalizeGitHubMatchValue(githubUsername)
  const normalizedOwner = normalizeGitHubMatchValue(repositoryOwnerLogin)

  if (!normalizedUsername) {
    return {
      tone: "muted" as const,
      label: "No GitHub username",
      detail: "Add a GitHub username in the user profile first.",
    }
  }

  if (normalizedUsername === normalizedOwner) {
    return {
      tone: "success" as const,
      label: "Repository owner",
      detail: "Full repository control",
    }
  }

  if (collaborator?.hasAdminAccess) {
    return {
      tone: "success" as const,
      label: "Admin collaborator",
      detail: "Can fully manage the repository",
    }
  }

  if (collaborator?.hasWriteAccess) {
    return {
      tone: "success" as const,
      label: "Can write",
      detail: "Can branch, commit, and open pull requests",
    }
  }

  if (collaborator) {
    return {
      tone: "warning" as const,
      label: "Read-only collaborator",
      detail: "Can view the repository but cannot write",
    }
  }

  if (invitation) {
    return {
      tone: "warning" as const,
      label: "Invitation pending",
      detail: "Waiting for the GitHub invite to be accepted",
    }
  }

  if (normalizeGitHubVisibility(repositoryVisibility) === "public") {
    return {
      tone: "muted" as const,
      label: "View only",
      detail: "Public repos still need collaborator access for write actions",
    }
  }

  return {
    tone: "danger" as const,
    label: "Needs invite",
    detail: "This GitHub account still needs collaborator access",
  }
}

export function GitHubWorkspaceClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const { accessToken, currentUser, hasHydrated } = useAuthStore()
  const isStudentRole = currentUser?.role === "member" || currentUser?.role === "leader"
  const supportNeedsTeamState = currentUser?.role === "doctor" || currentUser?.role === "ta"
  const shouldLoadMyTeamState = isStudentRole || supportNeedsTeamState
  const { data: myTeamState, isLoading: myTeamLoading, error: myTeamError, refresh: refreshMyTeamState } = useMyTeamState(shouldLoadMyTeamState)

  const requestedTeamId = searchParams.get("teamId")
  const githubInstallStatus = searchParams.get("githubInstall")
  const githubConnectStatus = searchParams.get("githubConnect")
  const callbackReason = searchParams.get("reason")
  const callbackInstallationId = searchParams.get("installationId")
  const callbackOwner = searchParams.get("owner")

  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview")
  const [workspace, setWorkspace] = useState<ApiGitHubWorkspaceSummary | null>(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState("")
  const [workspaceNeedsTeam, setWorkspaceNeedsTeam] = useState(false)
  const [teamOptions, setTeamOptions] = useState<ApiTeamSummary[]>([])
  const [teamOptionsLoading, setTeamOptionsLoading] = useState(false)
  const [teamOptionsSearch, setTeamOptionsSearch] = useState("")
  const [teamOptionsPage, setTeamOptionsPage] = useState(1)
  const [teamOptionsTotalPages, setTeamOptionsTotalPages] = useState(1)

  const [branches, setBranches] = useState<ApiGitHubBranch[]>([])
  const [commits, setCommits] = useState<ApiGitHubCommit[]>([])
  const [commitPage, setCommitPage] = useState(1)
  const [commitHasNextPage, setCommitHasNextPage] = useState(false)
  const [commitHasPreviousPage, setCommitHasPreviousPage] = useState(false)
  const [commitFeedLoading, setCommitFeedLoading] = useState(false)
  const [commitFeedError, setCommitFeedError] = useState("")
  const [selectedCommitSha, setSelectedCommitSha] = useState("")
  const [selectedCommit, setSelectedCommit] = useState<ApiGitHubCommitDetail | null>(null)
  const [commitDetailLoading, setCommitDetailLoading] = useState(false)
  const [commitDetailError, setCommitDetailError] = useState("")
  const [issues, setIssues] = useState<ApiGitHubIssue[]>([])
  const [issuePage, setIssuePage] = useState(1)
  const [issueHasPreviousPage, setIssueHasPreviousPage] = useState(false)
  const [issueHasNextPage, setIssueHasNextPage] = useState(false)
  const [pullRequests, setPullRequests] = useState<ApiGitHubPullRequest[]>([])
  const [pullPage, setPullPage] = useState(1)
  const [pullHasPreviousPage, setPullHasPreviousPage] = useState(false)
  const [pullHasNextPage, setPullHasNextPage] = useState(false)
  const [workflowRuns, setWorkflowRuns] = useState<ApiGitHubWorkflowRun[]>([])
  const [releases, setReleases] = useState<ApiGitHubRelease[]>([])
  const [repositoryAccessState, setRepositoryAccessState] = useState<ApiGitHubRepositoryAccessState>(emptyRepositoryAccessState)
  const [repositoryAccessLoading, setRepositoryAccessLoading] = useState(false)
  const [repositoryAccessError, setRepositoryAccessError] = useState("")
  const [repositoryDataLoading, setRepositoryDataLoading] = useState(false)
  const [repositoryDataError, setRepositoryDataError] = useState("")
  const [workspaceTasks, setWorkspaceTasks] = useState<ApiTask[]>([])
  const [workspaceTasksLoading, setWorkspaceTasksLoading] = useState(false)
  const [workspaceTasksError, setWorkspaceTasksError] = useState("")
  const [callbackNotice, setCallbackNotice] = useState<GitHubCallbackNotice | null>(null)
  const [callbackInstallationHint, setCallbackInstallationHint] = useState<string | null>(callbackInstallationId)
  const [callbackOwnerHint, setCallbackOwnerHint] = useState<string | null>(callbackOwner)
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState>(initialConfirmationDialogState)
  const [confirmationInputValue, setConfirmationInputValue] = useState("")

  const [selectedBranch, setSelectedBranch] = useState("")
  const [currentPath, setCurrentPath] = useState("")
  const [selectedFilePath, setSelectedFilePath] = useState("")
  const [treeLoading, setTreeLoading] = useState(false)
  const [treeError, setTreeError] = useState("")
  const [treeItems, setTreeItems] = useState<Array<{ name: string; path: string; type: string; size: number | null; sha: string | null; url: string | null; downloadUrl: string | null }>>([])
  const [selectedBlob, setSelectedBlob] = useState<ApiGitHubBlob | null>(null)
  const [blobLoading, setBlobLoading] = useState(false)
  const [blobError, setBlobError] = useState("")
  const [isEditingCode, setIsEditingCode] = useState(false)
  const [editorValue, setEditorValue] = useState("")

  const [setupDialogOpen, setSetupDialogOpen] = useState(false)
  const [setupMode, setSetupMode] = useState<RepositorySetupMode>("create")
  const [createRepositoryForm, setCreateRepositoryForm] = useState(initialCreateRepoForm)
  const [connectRepositoryForm, setConnectRepositoryForm] = useState(initialConnectRepoForm)

  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [branchForm, setBranchForm] = useState({ name: "", fromBranch: "", startEmpty: false, confirmEmptyStart: false })
  const [branchToDelete, setBranchToDelete] = useState<ApiGitHubBranch | null>(null)
  const [branchDeleteConfirmationText, setBranchDeleteConfirmationText] = useState("")

  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [issueForm, setIssueForm] = useState(initialIssueForm)
  const [editingIssue, setEditingIssue] = useState<ApiGitHubIssue | null>(null)
  const [issueDialogError, setIssueDialogError] = useState("")
  const [showCompareDetails, setShowCompareDetails] = useState(false)
  const [pullRequestDialogOpen, setPullRequestDialogOpen] = useState(false)
  const [pullRequestForm, setPullRequestForm] = useState(initialPullRequestForm)
  const [pullRequestDialogError, setPullRequestDialogError] = useState("")

  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [releaseForm, setReleaseForm] = useState(initialReleaseForm)
  const [releaseDialogError, setReleaseDialogError] = useState("")
  const [setupDialogError, setSetupDialogError] = useState("")
  const availableInstallations = useMemo(() => workspace?.availableInstallations ?? [], [workspace?.availableInstallations])
  const [inviteForm, setInviteForm] = useState({
    login: "",
    permission: "push" as "pull" | "triage" | "push" | "maintain" | "admin",
  })

  const [reviewingPullRequest, setReviewingPullRequest] = useState<ApiGitHubPullRequest | null>(null)
  const [reviewForm, setReviewForm] = useState({
    event: "COMMENT" as "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
    body: "",
  })
  const [mergeDialogPullRequest, setMergeDialogPullRequest] = useState<ApiGitHubPullRequest | null>(null)
  const [mergeMethod, setMergeMethod] = useState<PullRequestMergeMethod>("squash")
  const [mergeCommitMessage, setMergeCommitMessage] = useState("")

  const [compareState, setCompareState] = useState({
    base: "",
    head: "",
    result: null as ApiGitHubCompare | null,
    loading: false,
    error: "",
    success: "",
  })

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveCommitMessage, setSaveCommitMessage] = useState("")
  const [saveDialogError, setSaveDialogError] = useState("")
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false)
  const [newFileForm, setNewFileForm] = useState({ path: "", content: "", message: "", branch: "" })
  const [newFileDialogError, setNewFileDialogError] = useState("")
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameForm, setRenameForm] = useState({ path: "", nextPath: "", message: "" })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteCommitMessage, setDeleteCommitMessage] = useState("")
  const [uploadFolderDialogOpen, setUploadFolderDialogOpen] = useState(false)
  const [uploadFolderPickerConfirmOpen, setUploadFolderPickerConfirmOpen] = useState(false)
  const [uploadFolderBranch, setUploadFolderBranch] = useState("")
  const [uploadFolderBasePath, setUploadFolderBasePath] = useState("")
  const [uploadFolderCommitMessage, setUploadFolderCommitMessage] = useState("")
  const [uploadFolderEntries, setUploadFolderEntries] = useState<FolderUploadEntry[]>([])
  const [uploadFolderRejectedEntries, setUploadFolderRejectedEntries] = useState<FolderUploadRejectedEntry[]>([])
  const [uploadFolderError, setUploadFolderError] = useState("")
  const [uploadFolderMode, setUploadFolderMode] = useState<FolderUploadMode>("create")
  const [uploadResultCommitUrl, setUploadResultCommitUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 })
  const [treeDeleteDialog, setTreeDeleteDialog] = useState<TreeDeleteDialogState>({
    open: false,
    path: "",
    isDirectory: false,
    message: "",
  })
  const [pathActivity, setPathActivity] = useState<PathActivityState>({
    path: "",
    loading: false,
    lastUpdatedAt: null,
    error: "",
  })
  const [branchDialogError, setBranchDialogError] = useState("")
  const [codeActionNotice, setCodeActionNotice] = useState<GitHubCallbackNotice | null>(null)

  const [settingsDraft, setSettingsDraft] = useState({
    defaultBranch: "",
    visibility: "PRIVATE" as Extract<ApiGitHubRepositoryVisibility, "PUBLIC" | "PRIVATE">,
    syncIssuesToTasks: true,
    syncActivityToWeeklyReports: true,
    syncReleasesToSubmissions: true,
  })

  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [copiedActionKey, setCopiedActionKey] = useState<string | null>(null)
  const [commitSearch, setCommitSearch] = useState("")
  const [codeSearch, setCodeSearch] = useState("")
  const [issueSearch, setIssueSearch] = useState("")
  const [issueStateFilter, setIssueStateFilter] = useState<"all" | "open" | "closed">("all")
  const [pullSearch, setPullSearch] = useState("")
  const [pullStateFilter, setPullStateFilter] = useState<"all" | "open" | "closed">("all")
  const [memberSearch, setMemberSearch] = useState("")
  const [treeRenderLimit, setTreeRenderLimit] = useState(200)
  const [commitRenderLimit, setCommitRenderLimit] = useState(60)
  const [memberRenderLimit, setMemberRenderLimit] = useState(30)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const commitPageCacheRef = useRef<Map<string, ApiGitHubCommitPage>>(new Map())
  const commitDetailsCacheRef = useRef<Map<string, ApiGitHubCommitDetail>>(new Map())
  const installWatcherRef = useRef<{ intervalId: number | null; timeoutId: number | null } | null>(null)

  const deferredCommitSearch = useDebouncedValue(commitSearch, 300)
  const deferredCodeSearch = useDebouncedValue(codeSearch, 180)
  const deferredIssueSearch = useDebouncedValue(issueSearch, 300)
  const deferredPullSearch = useDebouncedValue(pullSearch, 300)
  const deferredMemberSearch = useDebouncedValue(memberSearch, 220)

  const activeTeamId = workspace?.team?.id ?? requestedTeamId ?? undefined

  useEffect(() => {
    if (!activeTeamId) {
      setWorkspaceTasks([])
      setWorkspaceTasksLoading(false)
      setWorkspaceTasksError("")
      return
    }

    let cancelled = false
    setWorkspaceTasksLoading(true)
    setWorkspaceTasksError("")

    tasksApi
      .list({ teamId: activeTeamId })
      .then((data) => {
        if (!cancelled) setWorkspaceTasks(data)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setWorkspaceTasks([])
          setWorkspaceTasksError(friendlyError(error, "We couldn't load the related GPMS tasks right now."))
        }
      })
      .finally(() => {
        if (!cancelled) setWorkspaceTasksLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeTeamId])

  const selectedBranchMeta = branches.find((branch) => branch.name === selectedBranch) ?? null
  const canManageRepository = Boolean(workspace?.permissions.canManageRepository)
  const canSyncWorkspace = Boolean(workspace?.permissions.canSync)
  const canDisconnectConnectedRepository = Boolean(workspace?.permissions.canDisconnectRepository)
  const canWriteCode = Boolean(workspace?.permissions.canWriteCode)
  const canManageIssues = Boolean(workspace?.permissions.canManageIssues)
  const canManagePullRequests = Boolean(workspace?.permissions.canManagePullRequests)
  const connectedRepositoryAccess = workspace?.githubConnection.repositoryAccess ?? null
  const currentRepositoryVisibility =
    (workspace?.repository?.visibility ?? workspace?.repositoryRecord?.visibility ?? "PRIVATE") as Extract<
      ApiGitHubRepositoryVisibility,
      "PUBLIC" | "PRIVATE"
    >
  const hasConnectedGitHubWriteAccess = Boolean(connectedRepositoryAccess?.hasWriteAccess)
  const canAuthorRepositoryChanges = canWriteCode && hasConnectedGitHubWriteAccess
  const canManageIssueActions = canManageIssues && hasConnectedGitHubWriteAccess
  const canManagePullRequestActions = canManagePullRequests && hasConnectedGitHubWriteAccess
  const canRunLeaderWriteActions = canManageRepository && hasConnectedGitHubWriteAccess
  const isTeamLeader = Boolean(workspace?.team?.leader?.id && currentUser?.id && workspace.team.leader.id === currentUser.id)

  const filteredIssues = useMemo(() => issues, [issues])

  const filteredPullRequests = useMemo(() => pullRequests, [pullRequests])

  const filteredMembers = useMemo(() => {
    const query = deferredMemberSearch.trim().toLowerCase()
    const members = workspace?.team?.members ?? []
    if (!query) return members
    return members.filter((member) => {
      const fullName = member.user?.fullName?.toLowerCase() ?? ""
      const email = member.user?.email?.toLowerCase() ?? ""
      const githubUsername = member.user?.githubUsername?.toLowerCase() ?? ""
      return fullName.includes(query) || email.includes(query) || githubUsername.includes(query)
    })
  }, [workspace?.team?.members, deferredMemberSearch])
  const visibleMembers = useMemo(() => filteredMembers.slice(0, memberRenderLimit), [filteredMembers, memberRenderLimit])
  const hasMoreMembers = filteredMembers.length > visibleMembers.length

  const filteredCommits = useMemo(() => commits, [commits])
  const commitSearchQuery = deferredCommitSearch.trim()
  const visibleCommits = useMemo(() => filteredCommits.slice(0, commitRenderLimit), [filteredCommits, commitRenderLimit])
  const hasMoreCommits = filteredCommits.length > visibleCommits.length

  const collaboratorByLogin = useMemo(() => {
    return new Map(
      repositoryAccessState.collaborators.map((collaborator) => [
        normalizeGitHubMatchValue(collaborator.login),
        collaborator,
      ]),
    )
  }, [repositoryAccessState.collaborators])

  const invitationByLogin = useMemo(() => {
    return new Map(
      repositoryAccessState.invitations
        .filter((invitation) => invitation.inviteeLogin)
        .map((invitation) => [normalizeGitHubMatchValue(invitation.inviteeLogin), invitation]),
    )
  }, [repositoryAccessState.invitations])

  const teamInviteCandidates = useMemo(() => {
    const repositoryOwner = normalizeGitHubMatchValue(workspace?.repositoryRecord?.ownerLogin)

    return (workspace?.team?.members ?? []).filter((member) => {
      const login = normalizeGitHubMatchValue(member.user?.githubUsername)
      if (!login || login === repositoryOwner) return false
      return !collaboratorByLogin.has(login) && !invitationByLogin.has(login)
    })
  }, [collaboratorByLogin, invitationByLogin, workspace?.repositoryRecord?.ownerLogin, workspace?.team?.members])

  const filteredTreeItems = useMemo(() => {
    const query = deferredCodeSearch.trim().toLowerCase()
    if (!query) return treeItems
    return treeItems.filter((item) => item.name.toLowerCase().includes(query) || item.path.toLowerCase().includes(query))
  }, [treeItems, deferredCodeSearch])
  const visibleTreeItems = useMemo(() => filteredTreeItems.slice(0, treeRenderLimit), [filteredTreeItems, treeRenderLimit])
  const hasMoreTreeItems = filteredTreeItems.length > visibleTreeItems.length

  const currentPathSegments = useMemo(() => getPathSegments(currentPath), [currentPath])
  const currentDirectoryLabel = currentPathSegments[currentPathSegments.length - 1]?.label ?? "Root"
  const currentDirectoryTitle = currentPathSegments.length ? currentDirectoryLabel : "Repository root"
  const currentDirectoryHint = currentPathSegments.length ? currentPath : "Top-level files and folders"
  const visibleTreeItemLabel = `${filteredTreeItems.length} visible item${filteredTreeItems.length === 1 ? "" : "s"}`
  const totalTreeItemLabel = `${treeItems.length} total item${treeItems.length === 1 ? "" : "s"}`
  const commitPageStart = commits.length ? (commitPage - 1) * RECENT_COMMITS_PAGE_SIZE + 1 : 0
  const commitPageEnd = commits.length ? commitPageStart + commits.length - 1 : 0
  const teamMembers = workspace?.team?.members ?? []
  const teamMemberCount = workspace?.team?.memberCount ?? teamMembers.length
  const teamMembersWithGitHubCount = teamMembers.filter((member) => Boolean(member.user?.githubUsername)).length
  const missingGitHubCount = Math.max(teamMemberCount - teamMembersWithGitHubCount, 0)
  const collaboratorCount = repositoryAccessState.collaborators.length
  const collaboratorWriteCount = repositoryAccessState.collaborators.filter((collaborator) => collaborator.hasWriteAccess).length
  const pendingInvitationCount = repositoryAccessState.invitations.length
  const openIssueCount = workspace?.repository?.openIssues ?? issues.filter((issue) => issue.state === "open").length
  const openPullRequestCount = workspace?.stats?.openPullRequests ?? pullRequests.filter((pullRequest) => pullRequest.state === "open").length
  const linkedTaskCount = issues.filter((issue) => issue.linkedTask).length
  const repoBackedTasks = useMemo(
    () => workspaceTasks.filter((task) => task.origin === "GPMS" && task.integrationMode === "GITHUB"),
    [workspaceTasks],
  )
  const repoBackedTaskCount = repoBackedTasks.length
  const repoBackedTasksWaitingAcceptance = repoBackedTasks.filter((task) => task.awaitingAcceptance).length
  const repoBackedTasksInReview = repoBackedTasks.filter((task) => task.status === "REVIEW").length
  const repoBackedTasksAwaitingMerge = repoBackedTasks.filter((task) => task.status === "APPROVED").length
  const repoBackedTasksBlocked = repoBackedTasks.filter(
    (task) => task.status !== "DONE" && Boolean(task.github?.reviewGate) && !task.github?.reviewGate?.ready,
  ).length
  const nextRepoTask = useMemo(
    () =>
      repoBackedTasks.find((task) => task.status !== "DONE") ??
      repoBackedTasks.find((task) => task.status === "DONE") ??
      null,
    [repoBackedTasks],
  )
  const workflowRunCount = workflowRuns.length
  const releaseCount = releases.length
  const branchCount = branches.length
  const lastSyncLabel = formatRelative(workspace?.repositoryRecord?.lastSyncAt)
  const lastPushLabel = formatRelative(workspace?.repository?.pushedAt)
  const lastWebhookLabel = formatRelative(workspace?.repositoryRecord?.lastWebhookAt)
  const repositoryOwnerLogin = workspace?.repositoryRecord?.ownerLogin ?? workspace?.repository?.owner?.login ?? "Unknown owner"
  const repositoryDisplayName = workspace?.repository?.name ?? workspace?.repositoryRecord?.repoName ?? "Repository"
  const repositoryPathLabel = workspace?.repository?.fullName ?? workspace?.repositoryRecord?.fullName ?? repositoryDisplayName
  const syncStatusLabel = humanizeStateLabel(workspace?.repositoryRecord?.syncStatus)
  const connectedAccessLabel = connectedRepositoryAccess?.status
    ? humanizeStateLabel(connectedRepositoryAccess.status)
    : "Not connected"
  const selectedCommitSubject = useMemo(() => getCommitSubject(selectedCommit?.message), [selectedCommit?.message])
  const selectedCommitBody = useMemo(() => getCommitBody(selectedCommit?.message), [selectedCommit?.message])
  const selectedBlobContent = useMemo(() => {
    if (!selectedBlob) return ""
    return (selectedBlob.content ?? "").replace(/\r\n/g, "\n")
  }, [selectedBlob])
  const selectedBlobLines = useMemo(() => {
    if (!selectedBlob) return []
    return selectedBlobContent.length ? selectedBlobContent.split("\n") : [""]
  }, [selectedBlob, selectedBlobContent])
  const mergeDialogGuidance = useMemo(
    () => (mergeDialogPullRequest ? getPullRequestMergeGuidance(mergeDialogPullRequest) : null),
    [mergeDialogPullRequest],
  )
  const isDarkTheme = resolvedTheme === "dark"
  const monacoTheme = isDarkTheme ? "vs-dark" : "vs"
  const isUploadInProgress = busyAction === "upload-folder"

  const closeConfirmationDialog = useCallback(() => {
    setConfirmationInputValue("")
    setConfirmationDialog(initialConfirmationDialogState)
  }, [])

  const openConfirmationDialog = useCallback(
    (config: Omit<ConfirmationDialogState, "open">) => {
      setConfirmationInputValue("")
      setConfirmationDialog({
        open: true,
        ...config,
      })
    },
    [],
  )

  const runConfirmedAction = useCallback(async () => {
    const action = confirmationDialog.action
    if (!action) return
    if (confirmationDialog.confirmationValues?.length) {
      const inputValue = confirmationDialog.confirmationCaseSensitive
        ? confirmationInputValue.trim()
        : confirmationInputValue.trim().toLowerCase()
      const hasMatch = confirmationDialog.confirmationValues.some((value) => {
        const candidate = confirmationDialog.confirmationCaseSensitive ? value.trim() : value.trim().toLowerCase()
        return candidate === inputValue
      })
      if (!hasMatch) return
    }
    closeConfirmationDialog()
    await action(confirmationInputValue.trim())
  }, [
    closeConfirmationDialog,
    confirmationDialog.action,
    confirmationDialog.confirmationCaseSensitive,
    confirmationDialog.confirmationValues,
    confirmationInputValue,
  ])

  const applyWorkspaceSummary = useCallback((data: ApiGitHubWorkspaceSummary) => {
    setWorkspace(data)
    setSettingsDraft({
      defaultBranch: data.repositoryRecord?.defaultBranch ?? data.repository?.defaultBranch ?? "main",
      visibility:
        (data.repository?.visibility ?? data.repositoryRecord?.visibility ?? "PRIVATE") as Extract<
          ApiGitHubRepositoryVisibility,
          "PUBLIC" | "PRIVATE"
        >,
      syncIssuesToTasks: data.repositoryRecord?.syncSettings.syncIssuesToTasks ?? true,
      syncActivityToWeeklyReports: data.repositoryRecord?.syncSettings.syncActivityToWeeklyReports ?? true,
      syncReleasesToSubmissions: data.repositoryRecord?.syncSettings.syncReleasesToSubmissions ?? true,
    })
  }, [])

  const refreshWorkspace = useCallback(async () => {
    if (!hasHydrated || !accessToken || !currentUser || (isStudentRole && (myTeamLoading || !myTeamState?.team))) return

    setWorkspaceLoading(true)
    setWorkspaceError("")
    setWorkspaceNeedsTeam(false)

    try {
      const data = await githubApi.getWorkspace(requestedTeamId)
      applyWorkspaceSummary(data)
    } catch (error) {
      setWorkspace(null)
      if (isTeamRequiredWorkspaceError(error)) {
        setWorkspaceNeedsTeam(true)
        setWorkspaceError("")
      } else {
        setWorkspaceError(friendlyError(error, "Couldn't load the GitHub workspace right now."))
      }
    } finally {
      setWorkspaceLoading(false)
    }
  }, [accessToken, applyWorkspaceSummary, currentUser, hasHydrated, isStudentRole, myTeamLoading, myTeamState?.team, requestedTeamId])

  const clearInstallWatcher = useCallback(() => {
    const watcher = installWatcherRef.current

    if (typeof window === "undefined") {
      installWatcherRef.current = null
      return
    }

    if (!watcher) {
      return
    }

    if (watcher.intervalId !== null) {
      window.clearInterval(watcher.intervalId)
    }

    if (watcher.timeoutId !== null) {
      window.clearTimeout(watcher.timeoutId)
    }

    installWatcherRef.current = null
  }, [])

  const announceInstallationReady = useCallback(() => {
    const message = "GitHub App installation is ready. You can finish repository setup now."
    toast.success(message)
    setCallbackNotice({
      tone: "success",
      title: "GitHub App ready",
      message,
    })
    setSetupDialogOpen(true)
  }, [])

  const checkInstallationStatus = useCallback(
    async (showWarningIfMissing = false) => {
      if (!hasHydrated || !accessToken || !currentUser || (isStudentRole && (myTeamLoading || !myTeamState?.team))) {
        return false
      }

      try {
        const data = await githubApi.getWorkspace(requestedTeamId)
        applyWorkspaceSummary(data)
        setWorkspaceError("")
        setWorkspaceNeedsTeam(false)

        const suggestedInstallation = pickSuggestedInstallation(
          data.availableInstallations ?? [],
          callbackInstallationHint,
          callbackOwnerHint,
          data.githubConnection.login,
          data.repository?.owner.login,
        )

        if (suggestedInstallation?.id) {
          setCallbackInstallationHint(suggestedInstallation.id)
        }

        const nextOwnerHint =
          suggestedInstallation?.accountLogin ??
          callbackOwnerHint ??
          data.githubConnection.login ??
          data.repository?.owner.login ??
          null

        if (nextOwnerHint) {
          setCallbackOwnerHint(nextOwnerHint)
        }

        const installationDetected = Boolean(data.availableInstallations?.length)
        if (installationDetected) {
          return true
        }

        if (showWarningIfMissing) {
          const connectedLogin = data.githubConnection.login ? " (" + data.githubConnection.login + ")" : ""
          setCallbackNotice({
            tone: "error",
            title: "Installation not found yet",
            message:
              "We couldn't see the GPMS GitHub App installation yet. Install it using the connected GitHub account" +
              connectedLogin +
              " or choose the target organization, then check again.",
            actionLabel: "Check again",
            onAction: () => {
              void (async () => {
                const found = await checkInstallationStatus(true)
                if (found) {
                  announceInstallationReady()
                }
              })()
            },
          })
        }

        return false
      } catch (error) {
        if (showWarningIfMissing) {
          setCallbackNotice({
            tone: "error",
            title: "Couldn't verify the installation",
            message: friendlyError(error, "We couldn't check the GitHub App installation status right now."),
          })
        }

        return false
      }
    },
    [
      accessToken,
      announceInstallationReady,
      applyWorkspaceSummary,
      callbackInstallationHint,
      callbackOwnerHint,
      currentUser,
      hasHydrated,
      isStudentRole,
      myTeamLoading,
      myTeamState?.team,
      requestedTeamId,
    ],
  )

  const handleInstallationStatusCheck = useCallback(async () => {
    const found = await checkInstallationStatus(true)
    if (found) {
      announceInstallationReady()
    }
  }, [announceInstallationReady, checkInstallationStatus])

  const startInstallWatcher = useCallback(
    (popup: Window | null) => {
      if (typeof window === "undefined") return

      clearInstallWatcher()

      const pollForInstallation = async (showWarningIfMissing = false) => {
        const found = await checkInstallationStatus(showWarningIfMissing)
        if (found) {
          clearInstallWatcher()
          announceInstallationReady()
        }
      }

      const intervalId = window.setInterval(() => {
        if (popup && popup.closed) {
          clearInstallWatcher()
          void pollForInstallation(true)
          return
        }

        void pollForInstallation(false)
      }, GITHUB_INSTALL_STATUS_POLL_MS)

      const timeoutId = window.setTimeout(() => {
        clearInstallWatcher()
        void pollForInstallation(true)
      }, GITHUB_INSTALL_STATUS_TIMEOUT_MS)

      installWatcherRef.current = { intervalId, timeoutId }
    },
    [announceInstallationReady, checkInstallationStatus, clearInstallWatcher],
  )

  const handleGitHubCallbackPayload = useCallback(
    async (payload: GitHubCallbackPayload) => {
      if (payload.installationId) {
        setCallbackInstallationHint(payload.installationId)
      }

      if (payload.owner) {
        setCallbackOwnerHint(payload.owner)
      }

      if (payload.githubInstall === "success") {
        setSetupDialogOpen(true)
        const found = await checkInstallationStatus(false)
        if (found) {
          clearInstallWatcher()
          announceInstallationReady()
        } else {
          setCallbackNotice({
            tone: "success",
            title: "Checking GitHub App installation",
            message: "GitHub sent you back successfully. We're checking the installation status now.",
          })
        }
      }

      if (payload.githubInstall === "error") {
        clearInstallWatcher()
        const message = payload.reason || "GitHub App installation was cancelled."
        toast.error(message)
        setCallbackNotice({
          tone: "error",
          title: "GitHub App installation failed",
          message,
        })
      }

      if (payload.githubConnect === "success") {
        await refreshWorkspace()
        setSetupDialogOpen(true)
        const message = "Your personal GitHub connection is ready."
        toast.success(message)
        setCallbackNotice({
          tone: "success",
          title: "GitHub connected",
          message,
        })
      }

      if (payload.githubConnect === "error") {
        const notice = getGitHubConnectErrorNotice(payload.reason)
        toast.error(notice.message)
        setCallbackNotice(notice)
      }
    },
    [announceInstallationReady, checkInstallationStatus, clearInstallWatcher, refreshWorkspace],
  )

  const applyCommitPage = useCallback((pageData: ApiGitHubCommitPage) => {
    setCommits(pageData.items)
    setCommitPage(pageData.page)
    setCommitHasNextPage(pageData.hasNextPage)
    setCommitHasPreviousPage(pageData.hasPreviousPage)
    setCommitFeedError("")
  }, [])

  const fetchCommitPage = useCallback(
    async (page: number, query?: string) =>
      githubApi.getCommits({
        teamId: activeTeamId,
        ref: selectedBranch || undefined,
        q: query || undefined,
        page,
        perPage: RECENT_COMMITS_PAGE_SIZE,
      }),
    [activeTeamId, selectedBranch],
  )

  const loadRepositorySnapshot = useCallback(async (commitPageForFetch = 1) => {
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") return

    setRepositoryDataLoading(true)
    setRepositoryDataError("")
    setCommitFeedLoading(true)

    const scope = { teamId: activeTeamId }
    const results = await Promise.allSettled([githubApi.getBranches(scope), fetchCommitPage(commitPageForFetch)])

    const [branchesResult, commitsResult] = results

    if (branchesResult.status === "fulfilled") setBranches(branchesResult.value)
    if (commitsResult.status === "fulfilled") {
      applyCommitPage(commitsResult.value)
    } else {
      setCommitFeedError(friendlyError(commitsResult.reason, "Couldn't load commit history right now."))
    }

    const firstFailure = results.find((result) => result.status === "rejected")
    if (firstFailure?.status === "rejected") {
      setRepositoryDataError(friendlyError(firstFailure.reason, "Some repository data could not be refreshed."))
    }

    setRepositoryDataLoading(false)
    setCommitFeedLoading(false)
  }, [activeTeamId, applyCommitPage, fetchCommitPage, workspace?.repositoryRecord])

  const loadActionsFeed = useCallback(async () => {
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") return
    try {
      const result = await githubApi.getActions({ teamId: activeTeamId, perPage: 20 })
      setWorkflowRuns(result.items)
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't load workflow runs right now."))
    }
  }, [activeTeamId, workspace?.repositoryRecord])

  const loadReleasesFeed = useCallback(async () => {
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") return
    try {
      const result = await githubApi.getReleases({ teamId: activeTeamId, perPage: 20 })
      setReleases(result)
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't load releases right now."))
    }
  }, [activeTeamId, workspace?.repositoryRecord])

  const refreshRepositoryData = useCallback(async () => {
    await loadRepositorySnapshot(activeTab === "commits" ? commitPage : 1)
    if (activeTab === "issues") {
      try {
        const issueResult = await githubApi.getIssues({
          teamId: activeTeamId,
          state: issueStateFilter,
          q: deferredIssueSearch.trim() || undefined,
          perPage: ISSUES_PAGE_SIZE,
          page: issuePage,
        })
        setIssues(issueResult)
        setIssueHasPreviousPage(issuePage > 1)
        setIssueHasNextPage(issueResult.length >= ISSUES_PAGE_SIZE)
      } catch (error) {
        toast.error(friendlyError(error, "Couldn't refresh issues right now."))
      }
    } else if (activeTab === "pulls") {
      try {
        const pullResult = await githubApi.getPullRequests({
          teamId: activeTeamId,
          state: pullStateFilter,
          q: deferredPullSearch.trim() || undefined,
          perPage: PULLS_PAGE_SIZE,
          page: pullPage,
        })
        setPullRequests(pullResult)
        setPullHasPreviousPage(pullPage > 1)
        setPullHasNextPage(pullResult.length >= PULLS_PAGE_SIZE)
      } catch (error) {
        toast.error(friendlyError(error, "Couldn't refresh pull requests right now."))
      }
    } else if (activeTab === "actions") {
      await loadActionsFeed()
    } else if (activeTab === "releases") {
      await loadReleasesFeed()
    }
  }, [
    activeTab,
    activeTeamId,
    commitPage,
    deferredIssueSearch,
    deferredPullSearch,
    issuePage,
    issueStateFilter,
    loadActionsFeed,
    loadReleasesFeed,
    loadRepositorySnapshot,
    pullPage,
    pullStateFilter,
  ])

  const loadCommitPage = useCallback(
    async (nextPage: number, forceRefresh = false) => {
      if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE" || nextPage < 1) return

      const query = commitSearchQuery || undefined
      const cacheKey = `${selectedBranch || "default"}::${query || ""}::${nextPage}`
      const cachedPage = forceRefresh ? null : commitPageCacheRef.current.get(cacheKey)
      if (cachedPage && !forceRefresh) {
        applyCommitPage(cachedPage)
        return
      }

      setCommitFeedLoading(true)
      setCommitFeedError("")

      try {
        const pageData = await fetchCommitPage(nextPage, query)
        commitPageCacheRef.current.set(cacheKey, pageData)
        applyCommitPage(pageData)
      } catch (error) {
        setCommitFeedError(friendlyError(error, "Couldn't load that page of commits."))
      } finally {
        setCommitFeedLoading(false)
      }
    },
    [applyCommitPage, commitSearchQuery, fetchCommitPage, selectedBranch, workspace?.repositoryRecord],
  )

  const loadIssuePage = useCallback(
    async (nextPage: number) => {
      if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE" || nextPage < 1) return
      try {
        const issueResult = await githubApi.getIssues({
          teamId: activeTeamId,
          state: "all",
          q: deferredIssueSearch.trim() || undefined,
          perPage: ISSUES_PAGE_SIZE,
          page: nextPage,
        })
        setIssuePage(nextPage)
        setIssues(issueResult)
        setIssueHasPreviousPage(nextPage > 1)
        setIssueHasNextPage(issueResult.length >= ISSUES_PAGE_SIZE)
      } catch (error) {
        toast.error(friendlyError(error, "Couldn't load that page of issues."))
      }
    },
    [activeTeamId, deferredIssueSearch, workspace?.repositoryRecord],
  )

  const loadPullPage = useCallback(
    async (nextPage: number) => {
      if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE" || nextPage < 1) return
      try {
        const pullResult = await githubApi.getPullRequests({
          teamId: activeTeamId,
          state: "all",
          q: deferredPullSearch.trim() || undefined,
          perPage: PULLS_PAGE_SIZE,
          page: nextPage,
        })
        setPullPage(nextPage)
        setPullRequests(pullResult)
        setPullHasPreviousPage(nextPage > 1)
        setPullHasNextPage(pullResult.length >= PULLS_PAGE_SIZE)
      } catch (error) {
        toast.error(friendlyError(error, "Couldn't load that page of pull requests."))
      }
    },
    [activeTeamId, deferredPullSearch, workspace?.repositoryRecord],
  )

  const loadPathActivity = useCallback(
    async (path: string, branch = selectedBranch) => {
      if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE" || !branch) {
        setPathActivity({
          path,
          loading: false,
          lastUpdatedAt: null,
          error: "",
        })
        return
      }

      setPathActivity((current) => ({
        ...current,
        path,
        loading: true,
        error: "",
      }))

      try {
        const result = await githubApi.getCommits({
          teamId: activeTeamId,
          ref: branch,
          path: path || undefined,
          perPage: 1,
          page: 1,
        })
        const lastUpdatedAt = result.items[0]?.author?.date ?? null
        setPathActivity({
          path,
          loading: false,
          lastUpdatedAt,
          error: "",
        })
      } catch (error) {
        setPathActivity({
          path,
          loading: false,
          lastUpdatedAt: null,
          error: friendlyError(error, "Couldn't load last update information."),
        })
      }
    },
    [activeTeamId, selectedBranch, workspace?.repositoryRecord],
  )

  const loadCommitDetails = useCallback(
    async (sha: string) => {
      if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE" || !sha) return

      const cachedCommit = commitDetailsCacheRef.current.get(sha)
      if (cachedCommit) {
        setSelectedCommit(cachedCommit)
        setCommitDetailLoading(false)
        setCommitDetailError("")
        return
      }

      setCommitDetailLoading(true)
      setCommitDetailError("")

      try {
        const commit = await githubApi.getCommit(sha, activeTeamId)
        commitDetailsCacheRef.current.set(sha, commit)
        setSelectedCommit(commit)
      } catch (error) {
        setSelectedCommit(null)
        setCommitDetailError(friendlyError(error, "Couldn't load that commit yet."))
      } finally {
        setCommitDetailLoading(false)
      }
    },
    [activeTeamId, workspace?.repositoryRecord],
  )

  const refreshRepositoryAccess = useCallback(async () => {
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") {
      setRepositoryAccessState(emptyRepositoryAccessState)
      setRepositoryAccessError("")
      return
    }

    setRepositoryAccessLoading(true)
    setRepositoryAccessError("")

    try {
      const data = await githubApi.getRepositoryAccessState(activeTeamId)
      setRepositoryAccessState(data)
    } catch (error) {
      setRepositoryAccessState(emptyRepositoryAccessState)
      setRepositoryAccessError(friendlyError(error, "Couldn't load repository collaborators and invitations."))
    } finally {
      setRepositoryAccessLoading(false)
    }
  }, [activeTeamId, workspace?.repositoryRecord])

  const loadTeamOptions = useCallback(async () => {
    if (!currentUser || !SUPPORT_ROLES.has(currentUser.role)) return

    if (currentUser.role === "doctor" || currentUser.role === "ta") {
      const normalizedSearch = teamOptionsSearch.trim().toLowerCase()
      const supervisedTeams = myTeamState?.supervisedTeams ?? []
      const filteredTeams = normalizedSearch
        ? supervisedTeams.filter((team) => {
            const haystack = `${team.name} ${team.bio ?? ""}`.toLowerCase()
            return haystack.includes(normalizedSearch)
          })
        : supervisedTeams
      setTeamOptions(filteredTeams)
      setTeamOptionsTotalPages(1)
      setTeamOptionsLoading(false)
      return
    }

    setTeamOptionsLoading(true)
    try {
      const result = await teamsApi.list({ page: teamOptionsPage, limit: 12, search: teamOptionsSearch || undefined })
      setTeamOptionsTotalPages(result.meta.totalPages || 1)
      setTeamOptions((current) =>
        teamOptionsPage === 1
          ? result.items
          : [...current, ...result.items.filter((item) => current.every((existing) => existing.id !== item.id))],
      )
    } catch {
      if (teamOptionsPage === 1) setTeamOptions([])
    } finally {
      setTeamOptionsLoading(false)
    }
  }, [currentUser, myTeamState?.supervisedTeams, teamOptionsPage, teamOptionsSearch])

  const loadTree = useCallback(
    async (nextPath: string, branch = selectedBranch) => {
      if (!workspace?.repositoryRecord || !branch) return

      setTreeLoading(true)
      setTreeError("")
      try {
        const response = await githubApi.getTree({
          teamId: activeTeamId,
          ref: branch,
          path: nextPath || undefined,
        })
        setTreeItems(response.items)
      } catch (error) {
        setTreeItems([])
        setTreeError(friendlyError(error, "Couldn't load this folder from GitHub."))
      } finally {
        setTreeLoading(false)
      }
    },
    [activeTeamId, selectedBranch, workspace?.repositoryRecord],
  )

  const loadBlob = useCallback(
    async (path: string, branch = selectedBranch) => {
      if (!workspace?.repositoryRecord || !path || !branch) return

      setBlobLoading(true)
      setBlobError("")
      try {
        const response = await githubApi.getBlob({ teamId: activeTeamId, ref: branch, path })
        setSelectedBlob(response)
        setEditorValue(response.content ?? "")
      } catch (error) {
        setSelectedBlob(null)
        setEditorValue("")
        setBlobError(friendlyError(error, "Couldn't open this file right now."))
      } finally {
        setBlobLoading(false)
      }
    },
    [activeTeamId, selectedBranch, workspace?.repositoryRecord],
  )

  useEffect(() => {
    void refreshWorkspace()
  }, [refreshWorkspace])

  useEffect(() => {
    void loadTeamOptions()
  }, [loadTeamOptions])

  useEffect(() => {
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") {
      setCommits([])
      setIssues([])
      setPullRequests([])
      setWorkflowRuns([])
      setReleases([])
      setCommitPage(1)
      setCommitHasNextPage(false)
      setCommitHasPreviousPage(false)
      setIssuePage(1)
      setIssueHasPreviousPage(false)
      setIssueHasNextPage(false)
      setPullPage(1)
      setPullHasPreviousPage(false)
      setPullHasNextPage(false)
      setCommitFeedLoading(false)
      setCommitFeedError("")
      setSelectedCommitSha("")
      setSelectedCommit(null)
      setCommitDetailLoading(false)
      setCommitDetailError("")
      return
    }
    void loadRepositorySnapshot(1)
  }, [loadRepositorySnapshot, workspace?.repositoryRecord, workspace?.repositoryRecord?.id, workspace?.repositoryRecord?.connectionStatus])

  useEffect(() => {
    if (activeTab !== "commits" || !commits.length) return

    setSelectedCommitSha((current) => {
      if (current && commits.some((commit) => commit.sha === current)) return current
      if (commitSearchQuery) return ""
      return commits[0]?.sha ?? ""
    })
  }, [activeTab, commitSearchQuery, commits])

  useEffect(() => {
    if (activeTab !== "commits" || !selectedBranch) return
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") return

    void loadCommitPage(1, true)
  }, [activeTab, loadCommitPage, selectedBranch, workspace?.repositoryRecord, workspace?.repositoryRecord?.connectionStatus])

  useEffect(() => {
    if (activeTab !== "issues") return
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") return
    void loadIssuePage(1)
  }, [activeTab, deferredIssueSearch, loadIssuePage, workspace?.repositoryRecord, workspace?.repositoryRecord?.connectionStatus])

  useEffect(() => {
    if (activeTab !== "pulls") return
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") return
    void loadPullPage(1)
  }, [activeTab, deferredPullSearch, loadPullPage, workspace?.repositoryRecord, workspace?.repositoryRecord?.connectionStatus])

  useEffect(() => {
    if (activeTab !== "actions") return
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") return
    if (workflowRuns.length) return
    void loadActionsFeed()
  }, [
    activeTab,
    loadActionsFeed,
    workflowRuns.length,
    workspace?.repositoryRecord,
    workspace?.repositoryRecord?.connectionStatus,
  ])

  useEffect(() => {
    if (activeTab !== "releases") return
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") return
    if (releases.length) return
    void loadReleasesFeed()
  }, [
    activeTab,
    loadReleasesFeed,
    releases.length,
    workspace?.repositoryRecord,
    workspace?.repositoryRecord?.connectionStatus,
  ])

  useEffect(() => {
    if (activeTab !== "commits") return

    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE" || !selectedCommitSha) {
      setSelectedCommit(null)
      setCommitDetailLoading(false)
      setCommitDetailError("")
      return
    }

    void loadCommitDetails(selectedCommitSha)
  }, [activeTab, loadCommitDetails, selectedCommitSha, workspace?.repositoryRecord, workspace?.repositoryRecord?.connectionStatus])

  useEffect(() => {
    if (!workspace?.repositoryRecord || workspace.repositoryRecord.connectionStatus !== "ACTIVE") {
      setRepositoryAccessState(emptyRepositoryAccessState)
      setRepositoryAccessError("")
      return
    }

    void refreshRepositoryAccess()
  }, [workspace?.repositoryRecord, workspace?.repositoryRecord?.id, workspace?.repositoryRecord?.connectionStatus, refreshRepositoryAccess])

  useEffect(() => {
    if (!workspace?.repositoryRecord) return
    const defaultBranch = workspace.repositoryRecord.defaultBranch || workspace.repository?.defaultBranch || "main"
    setSelectedBranch((current) => current || defaultBranch)
  }, [workspace?.repository?.defaultBranch, workspace?.repositoryRecord])

  useEffect(() => {
    if (!workspace?.repositoryRecord || !selectedBranch) return
    void loadTree(currentPath, selectedBranch)
  }, [workspace?.repositoryRecord, workspace?.repositoryRecord?.id, selectedBranch, currentPath, loadTree])

  useEffect(() => {
    if (!selectedFilePath || !selectedBranch) return
    void loadBlob(selectedFilePath, selectedBranch)
  }, [selectedFilePath, selectedBranch, loadBlob])

  useEffect(() => {
    setTreeRenderLimit(200)
  }, [currentPath, selectedBranch, deferredCodeSearch, treeItems.length])

  useEffect(() => {
    setCommitRenderLimit(60)
  }, [commitPage, commitSearchQuery, selectedBranch])

  useEffect(() => {
    setMemberRenderLimit(30)
  }, [deferredMemberSearch, workspace?.team?.id, workspace?.team?.memberCount])

  useEffect(() => {
    commitPageCacheRef.current.clear()
    commitDetailsCacheRef.current.clear()
  }, [activeTeamId, selectedBranch, workspace?.repositoryRecord?.id])

  useEffect(() => {
    if (activeTab !== "code" || !selectedBranch) return
    const targetPath = selectedFilePath || currentPath
    void loadPathActivity(targetPath, selectedBranch)
  }, [activeTab, currentPath, loadPathActivity, selectedBranch, selectedFilePath])

  useEffect(() => {
    if (!workspace?.team) return
    const team = workspace.team
    const ownerLogin = callbackOwnerHint ?? workspace.githubConnection.login ?? workspace.repository?.owner.login ?? ""
    const suggestedInstallation = pickSuggestedInstallation(
      availableInstallations,
      callbackInstallationHint,
      callbackOwnerHint,
      workspace.githubConnection.login,
      workspace.repository?.owner.login,
    )

    setCreateRepositoryForm((current) => ({
      ...current,
      installationId:
        isKnownInstallationId(availableInstallations, callbackInstallationHint) ||
        !availableInstallations.length
          ? callbackInstallationHint || current.installationId
          : isKnownInstallationId(availableInstallations, current.installationId)
            ? current.installationId
            : suggestedInstallation?.id || current.installationId,
      owner: current.owner || ownerLogin || suggestedInstallation?.accountLogin || "",
      ownerType: suggestedInstallation?.accountType ?? current.ownerType,
      repoName: current.repoName || team.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: current.description || team.bio,
      defaultBranch: current.defaultBranch || workspace.repositoryRecord?.defaultBranch || "main",
    }))
    setConnectRepositoryForm((current) => ({
      ...current,
      installationId:
        isKnownInstallationId(availableInstallations, callbackInstallationHint) ||
        !availableInstallations.length
          ? callbackInstallationHint || current.installationId
          : isKnownInstallationId(availableInstallations, current.installationId)
            ? current.installationId
            : suggestedInstallation?.id || current.installationId,
      owner: current.owner || ownerLogin || suggestedInstallation?.accountLogin || "",
    }))
  }, [
    availableInstallations,
    callbackInstallationHint,
    callbackOwnerHint,
    workspace?.githubConnection.login,
    workspace?.repository?.owner.login,
    workspace?.repositoryRecord?.defaultBranch,
    workspace?.team,
  ])

  useEffect(() => {
    return () => {
      clearInstallWatcher()
    }
  }, [clearInstallWatcher])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      const data = event.data as { type?: string; payload?: GitHubCallbackPayload } | null
      if (!data || data.type !== GITHUB_CALLBACK_MESSAGE_TYPE || !data.payload) return

      void handleGitHubCallbackPayload(data.payload)
    }

    window.addEventListener("message", handleMessage)
    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [handleGitHubCallbackPayload])

  useEffect(() => {
    if (!searchParams.size || (!githubInstallStatus && !githubConnectStatus)) return

    const payload: GitHubCallbackPayload = {
      githubInstall: githubInstallStatus,
      githubConnect: githubConnectStatus,
      reason: callbackReason,
      installationId: callbackInstallationId,
      owner: callbackOwner,
    }

    if (payload.installationId) {
      setCallbackInstallationHint(payload.installationId)
    }

    if (payload.owner) {
      setCallbackOwnerHint(payload.owner)
    }

    if (typeof window !== "undefined" && window.opener && window.opener !== window) {
      window.opener.postMessage({ type: GITHUB_CALLBACK_MESSAGE_TYPE, payload }, window.location.origin)
      window.close()
      return
    }

    void handleGitHubCallbackPayload(payload)

    const next = new URLSearchParams(searchParams.toString())
    ;["githubInstall", "githubConnect", "reason", "installationId", "owner", "setupAction"].forEach((key) => next.delete(key))
    startTransition(() => {
      router.replace(next.toString() ? `/dashboard/github?${next.toString()}` : "/dashboard/github")
    })
  }, [
    callbackInstallationId,
    callbackOwner,
    callbackReason,
    githubConnectStatus,
    githubInstallStatus,
    handleGitHubCallbackPayload,
    router,
    searchParams,
  ])

  const openExternalGitHubFlow = async (
    busyKey: "connect-user" | "install-app",
    loadUrl: () => Promise<{ url: string }>,
    fallbackMessage: string,
  ): Promise<Window | null> => {
    let popup: Window | null = null

    if (typeof window !== "undefined") {
      popup = window.open("", "_blank")
    }

    try {
      setBusyAction(busyKey)
      setCallbackNotice(null)
      const { url } = await loadUrl()

      if (popup) {
        popup.location.href = url
        popup.focus()
        return popup
      }

      window.location.href = url
      return null
    } catch (error) {
      popup?.close()
      toast.error(friendlyError(error, fallbackMessage))
      return null
    } finally {
      setBusyAction(null)
    }
  }

  const handleTeamSelection = (teamId: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("teamId", teamId)
    startTransition(() => {
      router.replace(`/dashboard/github?${next.toString()}`)
    })
  }

  const handleGitHubUserConnect = async () => {
    setSetupDialogError("")
    await openExternalGitHubFlow(
      "connect-user",
      () => githubApi.getUserConnectUrl(activeTeamId),
      "Couldn't start the GitHub personal connection flow.",
    )
  }

  const handleGitHubInstall = async () => {
    setSetupDialogError("")
    const popup = await openExternalGitHubFlow(
      "install-app",
      () => githubApi.getInstallUrl(activeTeamId),
      "Couldn't start the GitHub App installation flow.",
    )

    if (popup) {
      startInstallWatcher(popup)
    }
  }

  const handleDisconnectUserConnection = async () => {
    try {
      setSetupDialogError("")
      setBusyAction("disconnect-user")
      await githubApi.disconnectUserConnection()
      toast.success("Personal GitHub connection removed.")
      await refreshWorkspace()
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't disconnect your GitHub account."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleCreateRepository = async () => {
    if (!workspace?.team) return

    const hasTemplateOwner = Boolean(createRepositoryForm.templateOwner.trim())
    const hasTemplateRepo = Boolean(createRepositoryForm.templateRepo.trim())

    if (hasTemplateOwner !== hasTemplateRepo) {
      const message = "Fill both Template owner and Template repo, or leave both empty for a normal repository."
      setSetupDialogError(message)
      toast.error(message)
      return
    }

    try {
      setSetupDialogError("")
      setBusyAction("create-repository")
      await githubApi.createRepository({
        teamId: workspace.team.id,
        installationId: createRepositoryForm.installationId,
        owner: createRepositoryForm.owner,
        ownerType: createRepositoryForm.ownerType,
        repoName: createRepositoryForm.repoName,
        description: createRepositoryForm.description,
        visibility: createRepositoryForm.visibility,
        defaultBranch: createRepositoryForm.defaultBranch,
        templateOwner: createRepositoryForm.templateOwner || undefined,
        templateRepo: createRepositoryForm.templateRepo || undefined,
      })
      toast.success("Repository created and connected.")
      setSetupDialogOpen(false)
      await refreshWorkspace()
    } catch (error) {
      const message = friendlyError(error, "Couldn't create the repository from GPMS.")
      setSetupDialogError(message)
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleConnectRepository = async () => {
    if (!workspace?.team) return

    try {
      setSetupDialogError("")
      setBusyAction("connect-repository")
      await githubApi.connectRepository({
        teamId: workspace.team.id,
        installationId: connectRepositoryForm.installationId,
        owner: connectRepositoryForm.owner,
        repoName: connectRepositoryForm.repoName,
      })
      toast.success("Existing repository connected.")
      setSetupDialogOpen(false)
      await refreshWorkspace()
    } catch (error) {
      const message = friendlyError(error, "Couldn't connect the selected repository.")
      setSetupDialogError(message)
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleSyncRepository = async () => {
    try {
      setBusyAction("sync")
      await githubApi.syncWorkspace(activeTeamId)
      await Promise.all([refreshWorkspace(), refreshRepositoryData(), refreshRepositoryAccess()])
      toast.success("GitHub workspace synced.")
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't sync the GitHub workspace."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleDisconnectRepository = async (confirmationText?: string) => {
    try {
      setBusyAction("disconnect-repository")
      await githubApi.disconnectRepository({
        teamId: activeTeamId ?? undefined,
        confirmationText: (confirmationText ?? "").trim(),
      })
      toast.success("Repository disconnected from this team.")
      await refreshWorkspace()
      setRepositoryAccessState(emptyRepositoryAccessState)
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't disconnect the repository."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleDeleteRepositoryPermanently = async (confirmationText: string) => {
    try {
      setBusyAction("delete-repository-permanent")
      const result = await githubApi.deleteRepositoryPermanently({
        teamId: activeTeamId,
        confirmationText,
      })
      toast.success(`Repository ${result.repository} deleted permanently from GitHub.`)
      await refreshWorkspace()
      setRepositoryAccessState(emptyRepositoryAccessState)
      setActiveTab("overview")
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't permanently delete this repository."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleInviteCollaborator = async (loginOverride?: string) => {
    const login = (loginOverride ?? inviteForm.login).trim()
    if (!login) {
      toast.error("Enter a GitHub username to invite.")
      return
    }

    try {
      const inviteBusyKey = loginOverride ? `invite-${login}` : "invite-collaborator"
      setBusyAction(inviteBusyKey)
      const result = await githubApi.inviteCollaborator({
        teamId: activeTeamId,
        login,
        permission:
          workspace?.repositoryRecord?.ownerType === "ORGANIZATION" ? inviteForm.permission : undefined,
      })
      toast.success(result.invitationCreated ? `Invitation sent to @${login}.` : `@${login} already has access.`)
      setInviteForm((current) => ({ ...current, login: loginOverride ? current.login : "" }))
      await Promise.all([refreshRepositoryAccess(), refreshWorkspace()])
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't invite that GitHub account."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleRemoveCollaborator = async (login: string) => {
    try {
      setBusyAction(`remove-collaborator-${login}`)
      await githubApi.removeCollaborator(login, activeTeamId)
      toast.success(`Removed @${login} from the repository.`)
      await Promise.all([refreshRepositoryAccess(), refreshWorkspace()])
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't remove that collaborator."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      setBusyAction(`cancel-invitation-${invitationId}`)
      await githubApi.cancelInvitation(invitationId, activeTeamId)
      toast.success("Invitation cancelled.")
      await Promise.all([refreshRepositoryAccess(), refreshWorkspace()])
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't cancel that invitation."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleCreateBranch = async () => {
    const nextBranchName = branchForm.name.trim()
    const baseBranch = branchForm.fromBranch || selectedBranch || workspace?.repositoryRecord?.defaultBranch || defaultBranchName

    if (!nextBranchName) {
      setBranchDialogError("Enter a branch name before creating it.")
      return
    }

    if (!branchForm.startEmpty && !baseBranch) {
      setBranchDialogError("Choose a base branch before you continue.")
      return
    }

    if (branches.some((branch) => branch.name.toLowerCase() === nextBranchName.toLowerCase())) {
      setBranchDialogError(`Branch ${nextBranchName} already exists. Choose a different name.`)
      return
    }

    try {
      setBusyAction("create-branch")
      setBranchDialogError("")
      await githubApi.createBranch({
        teamId: activeTeamId,
        name: nextBranchName,
        fromBranch: branchForm.startEmpty ? undefined : baseBranch,
        startEmpty: branchForm.startEmpty,
      })
      toast.success(`Branch ${nextBranchName} created.`)
      setActiveTab("code")
      setBranchDialogOpen(false)
      setBranchForm({ name: "", fromBranch: branchForm.startEmpty ? "" : baseBranch, startEmpty: false, confirmEmptyStart: false })
      setSelectedBranch(nextBranchName)
      setCurrentPath("")
      setSelectedFilePath("")
      setSelectedBlob(null)
      setIsEditingCode(false)
      setCodeActionNotice({
        tone: "success",
        title: "Branch ready",
        message: `${nextBranchName} is ready. GPMS switched the code workspace to the new branch for you.`,
      })
      await Promise.all([refreshRepositoryData(), loadTree("", nextBranchName)])
    } catch (error) {
      const message = friendlyError(error, "Couldn't create the new branch.")
      setBranchDialogError(message)
      setCodeActionNotice({
        tone: "error",
        title: "Couldn't create branch",
        message,
      })
      toast.error(message)
      if (error instanceof ApiRequestError && error.code === "GITHUB_REPOSITORY_WRITE_ACCESS_REQUIRED" && canManageRepository) {
        setActiveTab("members")
      }
    } finally {
      setBusyAction(null)
    }
  }

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return

    const branchName = branchToDelete.name
    const fallbackBranch = workspace?.repositoryRecord?.defaultBranch ?? workspace?.repository?.defaultBranch ?? "main"
    if (branchDeleteConfirmationText.trim() !== branchName) {
      toast.error(`Type "${branchName}" exactly to confirm branch deletion.`)
      return
    }

    try {
      setBusyAction(`delete-branch-${branchName}`)
      await githubApi.deleteBranch(branchName, activeTeamId)
      toast.success(`Branch ${branchName} deleted.`)
      setBranchToDelete(null)
      setBranchDeleteConfirmationText("")

      if (selectedBranch === branchName) {
        setSelectedBranch(fallbackBranch)
        setCurrentPath("")
        setSelectedFilePath("")
        setSelectedBlob(null)
        setIsEditingCode(false)
      }

      await refreshRepositoryData()
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "GITHUB_DEFAULT_BRANCH_PROTECTED") {
        toast.error("This is the default branch. Change default branch first, then delete it.")
      } else {
        toast.error(friendlyError(error, "Couldn't delete this branch."))
      }
      if (error instanceof ApiRequestError && error.code === "GITHUB_REPOSITORY_WRITE_ACCESS_REQUIRED" && canManageRepository) {
        setActiveTab("members")
      }
    } finally {
      setBusyAction(null)
    }
  }

  const handleMergeBranch = async (base: string, head: string) => {
    try {
      setBusyAction("merge-branch")
      await githubApi.mergeBranch({
        teamId: activeTeamId,
        base,
        head,
      })
      
      setCompareState(current => ({
        ...current,
        result: null,
        success: `Branches merged successfully! ${head} is now integrated into ${base}.`
      }))

      toast.success(`Merged ${head} into ${base}`)
      await refreshRepositoryData()
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't merge these branches."))
    } finally {
      setBusyAction(null)
    }
  }

  const requestMergeBranch = (base: string, head: string) => {
    openConfirmationDialog({
      title: `Merge ${head} into ${base}?`,
      description: `This will combine all changes from ${head} directly into the ${base} branch.`,
      confirmLabel: "Confirm Merge",
      busyKey: "merge-branch",
      tone: "warning",
      notes: [
        "A new merge commit will be created on the base branch.",
        "Ensure your changes are tested before merging directly.",
      ],
      action: async () => await handleMergeBranch(base, head),
    })
  }

  const handleSetDefaultBranch = async (nextBranchName: string) => {
    if (!isTeamLeader || nextBranchName === defaultBranchName) return

    try {
      setBusyAction(`set-default-${nextBranchName}`)
      await githubApi.updateSettings({
        teamId: activeTeamId,
        defaultBranch: nextBranchName,
      })
      setSettingsDraft((current) => ({ ...current, defaultBranch: nextBranchName }))
      toast.success(`GitHub default branch updated to ${nextBranchName}.`)
      await refreshWorkspace()
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't set this branch as default."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleCreateOrUpdateIssue = async () => {
    try {
      setIssueDialogError("")
      setBusyAction("save-issue")
      if (editingIssue) {
        await githubApi.updateIssue(editingIssue.number, {
          teamId: activeTeamId,
          title: issueForm.title,
          body: issueForm.body,
          assignees: splitCsv(issueForm.assignees),
          labels: splitCsv(issueForm.labels),
          state: editingIssue.state === "open" ? "open" : "closed",
        })
        toast.success("Issue updated.")
      } else {
        await githubApi.createIssue({
          teamId: activeTeamId,
          title: issueForm.title,
          body: issueForm.body,
          assignees: splitCsv(issueForm.assignees),
          labels: splitCsv(issueForm.labels),
        })
        toast.success("Issue created.")
      }

      setIssueDialogOpen(false)
      setEditingIssue(null)
      setIssueForm(initialIssueForm)
      await refreshRepositoryData()
    } catch (error) {
      setIssueDialogError(friendlyError(error, "Couldn't save this issue."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleToggleIssueState = async (issue: ApiGitHubIssue) => {
    try {
      const nextState = issue.state === "open" ? "closed" : "open"
      setBusyAction(`issue-${issue.number}`)
      await githubApi.updateIssue(issue.number, {
        teamId: activeTeamId,
        state: nextState,
      })
      toast.success(nextState === "closed" ? "Issue closed." : "Issue reopened.")
      await refreshRepositoryData()
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't update the issue state."))
    } finally {
      setBusyAction(null)
    }
  }

  const requestToggleIssueState = (issue: ApiGitHubIssue) => {
    const isClosing = issue.state === "open"
    openConfirmationDialog({
      title: isClosing ? "Close this issue?" : "Reopen this issue?",
      description: isClosing 
        ? "This will mark the issue as completed and move it to the closed tab on GitHub." 
        : "This will reopen the issue for further discussion or work.",
      confirmLabel: isClosing ? "Close Issue" : "Reopen Issue",
      busyKey: `issue-${issue.number}`,
      tone: isClosing ? "danger" : "warning",
      notes: isClosing 
        ? ["The issue can be reopened later if needed.", "Linked tasks may need manual status updates."]
        : ["Collaborators will see that this issue is active again."],
      action: async () => await handleToggleIssueState(issue),
    })
  }

  const handleCreatePullRequest = async () => {
    try {
      setPullRequestDialogError("")
      setBusyAction("create-pull-request")
      await githubApi.createPullRequest({
        teamId: activeTeamId,
        title: pullRequestForm.title,
        body: pullRequestForm.body,
        head: pullRequestForm.head,
        base: pullRequestForm.base,
        draft: pullRequestForm.draft,
        reviewerLogins: splitCsv(pullRequestForm.reviewers),
      })
      toast.success("Pull request created.")
      setPullRequestDialogOpen(false)
      setPullRequestForm(initialPullRequestForm)
      await refreshRepositoryData()
      await refreshWorkspace()
    } catch (error) {
      setPullRequestDialogError(friendlyError(error, "Couldn't create the pull request."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewingPullRequest) return

    try {
      setBusyAction("review-pull-request")
      await githubApi.reviewPullRequest(reviewingPullRequest.number, {
        teamId: activeTeamId,
        body: reviewForm.body,
        event: reviewForm.event,
      })
      toast.success("Review submitted.")
      setReviewingPullRequest(null)
      setReviewForm({ event: "COMMENT", body: "" })
      await refreshRepositoryData()
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't submit the review."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleMergePullRequest = async (
    pullRequest: ApiGitHubPullRequest,
    method: PullRequestMergeMethod = "squash",
    commitMessage?: string,
  ) => {
    try {
      setBusyAction(`merge-${pullRequest.number}`)
      await githubApi.mergePullRequest(pullRequest.number, {
        teamId: activeTeamId,
        commitTitle: pullRequest.title,
        commitMessage: commitMessage?.trim() ? commitMessage.trim() : undefined,
        mergeMethod: method,
      })
      toast.success("Pull request merged.")
      await Promise.all([refreshRepositoryData(), refreshWorkspace()])
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't merge this pull request."))
    } finally {
      setBusyAction(null)
    }
  }

  const refreshPullRequest = async (number: number) => {
    try {
      setBusyAction(`pull-refresh-${number}`)
      const updatedPr = await githubApi.getPullRequest(number, activeTeamId)
      setPullRequests((current) =>
        current.map((pr) => (pr.number === number ? updatedPr : pr))
      )
      toast.success(`PR #${number} refreshed.`)
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't refresh this pull request."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleTogglePullRequestState = async (pullRequest: ApiGitHubPullRequest) => {
    try {
      const nextState = pullRequest.state === "open" ? "closed" : "open"
      setBusyAction(`pull-${pullRequest.number}`)
      await githubApi.updateIssue(pullRequest.number, {
        teamId: activeTeamId,
        state: nextState,
      })
      toast.success(nextState === "closed" ? "Pull request closed." : "Pull request reopened.")
      await refreshRepositoryData()
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't update the pull request state."))
    } finally {
      setBusyAction(null)
    }
  }

  const requestTogglePullRequestState = (pullRequest: ApiGitHubPullRequest) => {
    const isClosing = pullRequest.state === "open"
    openConfirmationDialog({
      title: isClosing ? "Close this pull request?" : "Reopen this pull request?",
      description: isClosing 
        ? "This will mark the pull request as closed without merging. You can reopen it later." 
        : "This will reopen the pull request for further review or changes.",
      confirmLabel: isClosing ? "Close PR" : "Reopen PR",
      busyKey: `pull-${pullRequest.number}`,
      tone: isClosing ? "danger" : "warning",
      notes: isClosing 
        ? ["The PR stays on GitHub and can be reopened.", "Any linked issues or tasks stay as they are."]
        : ["Collaborators will see that this PR is active again."],
      action: async () => await handleTogglePullRequestState(pullRequest),
    })
  }

  const openMergeDialog = (pullRequest: ApiGitHubPullRequest) => {
    setMergeDialogPullRequest(pullRequest)
    setMergeMethod("squash")
    setMergeCommitMessage("")
  }

  const closeMergeDialog = () => {
    setMergeDialogPullRequest(null)
    setMergeMethod("squash")
    setMergeCommitMessage("")
  }

  const confirmMergePullRequest = async () => {
    if (!mergeDialogPullRequest) return
    await handleMergePullRequest(mergeDialogPullRequest, mergeMethod, mergeCommitMessage)
    closeMergeDialog()
  }

  const handleCreateRelease = async () => {
    try {
      setReleaseDialogError("")
      setBusyAction("create-release")
      await githubApi.createRelease({
        teamId: activeTeamId,
        tagName: releaseForm.tagName,
        name: releaseForm.name || undefined,
        targetCommitish: releaseForm.targetCommitish || undefined,
        body: releaseForm.body || undefined,
        draft: releaseForm.draft,
        prerelease: releaseForm.prerelease,
      })
      toast.success("Release published.")
      setReleaseDialogOpen(false)
      setReleaseForm(initialReleaseForm)
      await refreshRepositoryData()
    } catch (error) {
      setReleaseDialogError(friendlyError(error, "Couldn't create the release."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleUpdateSettings = async (confirmationText?: string) => {
    try {
      setBusyAction("update-settings")
      await githubApi.updateSettings({
        teamId: activeTeamId,
        defaultBranch: settingsDraft.defaultBranch,
        ...(settingsDraft.visibility !== currentRepositoryVisibility ? { visibility: settingsDraft.visibility } : {}),
        confirmationText: settingsDraft.visibility !== currentRepositoryVisibility ? (confirmationText ?? "").trim() : undefined,
        syncSettings: {
          syncIssuesToTasks: settingsDraft.syncIssuesToTasks,
          syncActivityToWeeklyReports: settingsDraft.syncActivityToWeeklyReports,
          syncReleasesToSubmissions: settingsDraft.syncReleasesToSubmissions,
        },
      })
      toast.success("Workspace settings updated.")
      await Promise.all([refreshWorkspace(), refreshRepositoryAccess(), refreshRepositoryData()])
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't update the workspace settings."))
    } finally {
      setBusyAction(null)
    }
  }

  const requestDisconnectUserConnection = async () => {
    openConfirmationDialog({
      title: "Disconnect personal GitHub?",
      description: "GPMS will stop using this GitHub account for author actions until you connect it again.",
      confirmLabel: "Disconnect GitHub",
      busyKey: "disconnect-user",
      tone: "danger",
      notes: [
        "Your GitHub account stays safe on GitHub.",
        "The team repository stays connected to GPMS.",
        "Branching, commits, pull requests, and reviews from GPMS will pause for this account.",
      ],
      action: handleDisconnectUserConnection,
    })
  }

  const requestDisconnectRepository = async () => {
    const requiredPhrase = "DISCONNECT"
    openConfirmationDialog({
      title: "Disconnect this repository from GPMS?",
      description: "This removes the team workspace link, but it does not delete the repository or any GitHub data.",
      confirmLabel: "Disconnect repository",
      busyKey: "disconnect-repository",
      tone: "danger",
      notes: [
        "The repository, branches, issues, pull requests, and releases stay on GitHub.",
        "Your team can reconnect the repository later if needed.",
      ],
      confirmationLabel: `Type ${requiredPhrase} to confirm`,
      confirmationPlaceholder: requiredPhrase,
      confirmationValues: [requiredPhrase],
      confirmationCaseSensitive: true,
      action: (confirmationText) => handleDisconnectRepository(confirmationText),
    })
  }

  const requestDeleteRepositoryPermanently = async () => {
    const requiredPhrase = "i want to delete this repository"

    openConfirmationDialog({
      title: "Permanently delete this repository?",
      description: "This action deletes the repository from GitHub and cannot be undone.",
      confirmLabel: "Delete repository permanently",
      busyKey: "delete-repository-permanent",
      tone: "danger",
      notes: [
        "All branches, commits, pull requests, releases, and issues in this repository will be removed from GitHub.",
        "GPMS will disconnect this workspace after deletion.",
        "Only team leaders can perform this action.",
      ],
      confirmationLabel: "Type this exact sentence to confirm",
      confirmationPlaceholder: requiredPhrase,
      confirmationValues: [requiredPhrase],
      confirmationCaseSensitive: true,
      action: (confirmationText) => handleDeleteRepositoryPermanently((confirmationText ?? "").trim()),
    })
  }

  const requestRemoveCollaborator = async (collaborator: ApiGitHubRepositoryCollaborator) => {
    openConfirmationDialog({
      title: `Remove @${collaborator.login} from this repository?`,
      description: "They will lose direct repository access until the team invites them again.",
      confirmLabel: "Remove collaborator",
      busyKey: `remove-collaborator-${collaborator.login}`,
      tone: "danger",
      notes: [
        collaborator.isOwner
          ? "Repository owners cannot be removed from this page."
          : "This change happens on GitHub, not only inside GPMS.",
        "Existing commits and pull requests stay in the repository history.",
      ],
      action: () => handleRemoveCollaborator(collaborator.login),
    })
  }

  const requestCancelInvitation = async (invitation: ApiGitHubRepositoryInvitation) => {
    const inviteeLabel = invitation.inviteeLogin ?? invitation.inviteeEmail ?? "this pending invite"
    openConfirmationDialog({
      title: `Cancel the invite for ${inviteeLabel}?`,
      description: "The person will no longer be able to accept this pending repository invitation.",
      confirmLabel: "Cancel invite",
      busyKey: `cancel-invitation-${invitation.id}`,
      tone: "warning",
      notes: [
        "You can always send a new invite later from the Access tab.",
        "Nothing changes for collaborators who already accepted access.",
      ],
      action: () => handleCancelInvitation(invitation.id),
    })
  }

  const requestUpdateSettings = async () => {
    if (!canRunLeaderWriteActions) return

    if (settingsDraft.visibility === currentRepositoryVisibility) {
      await handleUpdateSettings()
      return
    }

    const makingPublic = settingsDraft.visibility === "PUBLIC"
    openConfirmationDialog({
      title: makingPublic ? "Make this repository public?" : "Make this repository private?",
      description: makingPublic
        ? "Anyone on GitHub will be able to view the repository once this change is saved."
        : "Only invited collaborators will be able to access the repository after this change is saved.",
      confirmLabel: makingPublic ? "Make public" : "Make private",
      busyKey: "update-settings",
      tone: "warning",
      notes: [
        makingPublic
          ? "Public visibility lets anyone view the code, issues, and pull requests."
          : "Private visibility hides the repository from people who are not invited on GitHub.",
        "Changing visibility does not change who has write access inside GitHub.",
      ],
      confirmationLabel: `Type ${makingPublic ? "PUBLIC" : "PRIVATE"} to confirm`,
      confirmationPlaceholder: makingPublic ? "PUBLIC" : "PRIVATE",
      confirmationValues: [makingPublic ? "PUBLIC" : "PRIVATE"],
      confirmationCaseSensitive: true,
      action: (confirmationText) => handleUpdateSettings(confirmationText),
    })
  }

  const handleCopy = async (label: string, value?: string | null, actionKey?: string) => {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      if (actionKey) {
        setCopiedActionKey(actionKey)
        window.setTimeout(() => {
          setCopiedActionKey((current) => (current === actionKey ? null : current))
        }, 1200)
      }
      toast.success(`${label} copied.`)
    } catch {
      toast.error(`Couldn't copy ${label.toLowerCase()}.`)
    }
  }

  const handleCompareBranches = async () => {
    if (!compareState.base || !compareState.head) {
      setCompareState((current) => ({ ...current, error: "Choose both branches to compare." }))
      return
    }

    try {
      setCompareState((current) => ({ ...current, loading: true, error: "", success: "", result: null }))
      const result = await githubApi.compare({
        teamId: activeTeamId,
        base: compareState.base,
        head: compareState.head,
      })
      setCompareState((current) => ({ ...current, loading: false, result }))
    } catch (error) {
      setCompareState((current) => ({
        ...current,
        loading: false,
        error: friendlyError(error, "Couldn't compare the selected branches."),
      }))
    }
  }

  const openFile = (path: string) => {
    setSelectedFilePath(path)
    setIsEditingCode(false)
    setCodeActionNotice(null)
    void loadPathActivity(path)
  }

  const openDirectory = (path: string) => {
    setCurrentPath(path)
    setSelectedFilePath("")
    setSelectedBlob(null)
    setBlobError("")
    setIsEditingCode(false)
    setCodeActionNotice(null)
    void loadPathActivity(path)
  }

  const handleOpenBranchDialog = () => {
    setCodeActionNotice(null)
    setBranchDialogError("")
    setBranchForm({
      name: "",
      fromBranch: branchForm.fromBranch || selectedBranch || defaultBranchName,
      startEmpty: false,
      confirmEmptyStart: false,
    })
    setBranchDialogOpen(true)
  }

  const handleOpenEditor = () => {
    if (!selectedBlob) return
    setCodeActionNotice(null)
    setSaveDialogError("")
    setEditorValue(selectedBlob.content ?? "")
    setSaveCommitMessage(`Update ${selectedBlob.name}`)
    setIsEditingCode(true)
  }

  const handleOpenSaveDialog = () => {
    if (!selectedBlob) return
    setCodeActionNotice(null)
    setSaveDialogError("")
    setSaveCommitMessage(`Update ${selectedBlob.name}`)
    setSaveDialogOpen(true)
  }

  const handleNewFilePathChange = (value: string) => {
    setNewFileDialogError("")
    setNewFileForm((current) => {
      const previousSuggestion = buildSuggestedCreateFileMessage(current.path)
      const nextSuggestion = buildSuggestedCreateFileMessage(value)
      const shouldSyncMessage = !current.message.trim() || current.message === previousSuggestion

      return {
        ...current,
        path: value,
        message: shouldSyncMessage ? nextSuggestion : current.message,
      }
    })
  }

  const handleOpenNewFileDialog = () => {
    const suggestedPath = buildSuggestedNewFilePath(currentPath)
    setCodeActionNotice(null)
    setNewFileDialogError("")
    setNewFileForm({
      path: suggestedPath,
      content: "",
      message: buildSuggestedCreateFileMessage(suggestedPath),
      branch: selectedBranch || defaultBranchName,
    })
    setNewFileDialogOpen(true)
  }

  const handleOpenUploadFolderDialog = () => {
    const targetBranch = selectedBranch || defaultBranchName
    const targetBasePath = currentPath || ""
    setCodeActionNotice(null)
    setUploadFolderError("")
    setUploadResultCommitUrl(null)
    setUploadFolderMode("create")
    setUploadProgress({ done: 0, total: 0 })
    setUploadFolderEntries([])
    setUploadFolderRejectedEntries([])
    setUploadFolderBranch(targetBranch)
    setUploadFolderBasePath(targetBasePath)
    setUploadFolderCommitMessage(targetBasePath ? `Upload folder into ${targetBasePath}` : "Upload folder")
    setUploadFolderDialogOpen(true)
  }

  const handleFolderFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    event.currentTarget.value = ""
    setUploadFolderError("")
    setUploadProgress({ done: 0, total: 0 })

    if (!selectedFiles.length) {
      setUploadFolderEntries([])
      setUploadFolderRejectedEntries([])
      return
    }

    const acceptedEntries: FolderUploadEntry[] = []
    const rejectedEntries: FolderUploadRejectedEntry[] = []
    const seenPaths = new Set<string>()

    for (const file of selectedFiles) {
      const rawRelativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
      const normalizedRelativePath = normalizeUploadRelativePath(rawRelativePath)
      if (!normalizedRelativePath) {
        rejectedEntries.push({
          relativePath: rawRelativePath || "(unknown file)",
          reason: "Invalid relative path.",
        })
        continue
      }

      if (seenPaths.has(normalizedRelativePath)) {
        rejectedEntries.push({
          relativePath: normalizedRelativePath,
          reason: "Duplicate path in selected folder.",
        })
        continue
      }

      if (file.size > MAX_FOLDER_UPLOAD_FILE_SIZE_BYTES) {
        rejectedEntries.push({
          relativePath: normalizedRelativePath,
          reason: "File is larger than 1MB limit.",
        })
        continue
      }

      if (isSensitiveUploadPath(normalizedRelativePath)) {
        rejectedEntries.push({
          relativePath: normalizedRelativePath,
          reason: "Sensitive file blocked (.env/keys/secrets) to prevent credential leaks.",
        })
        continue
      }

      try {
        const content = await readFileAsUtf8(file)
        if (detectSecretLikeContent(content)) {
          rejectedEntries.push({
            relativePath: normalizedRelativePath,
            reason: "Potential secret detected in content. Remove secrets before upload.",
          })
          continue
        }

        acceptedEntries.push({
          relativePath: normalizedRelativePath,
          content,
          size: file.size,
        })
        seenPaths.add(normalizedRelativePath)
      } catch {
        rejectedEntries.push({
          relativePath: normalizedRelativePath,
          reason: "Binary or unsupported encoding (text UTF-8 files only).",
        })
      }
    }

    setUploadFolderEntries(acceptedEntries)
    setUploadFolderRejectedEntries(rejectedEntries)

    if (!acceptedEntries.length) {
      setUploadFolderError("No valid text files were found in this folder selection.")
      return
    }

    const firstRootFolder = acceptedEntries[0]?.relativePath.split("/")[0] || "folder"
    setUploadFolderCommitMessage(`Upload ${firstRootFolder} folder`)
  }

  const handleUploadFolder = async () => {
    const targetBranch = uploadFolderBranch || selectedBranch || defaultBranchName
    const commitMessage = uploadFolderCommitMessage.trim()
    const normalizedBasePath = String(uploadFolderBasePath ?? "").trim().replace(/^\/+|\/+$/g, "")

    if (!targetBranch) {
      setUploadFolderError("Choose a branch before uploading files.")
      return
    }

    if (commitMessage.length < 3) {
      setUploadFolderError("Write a commit message with at least 3 characters.")
      return
    }

    if (!uploadFolderEntries.length) {
      setUploadFolderError("Select a local folder first.")
      return
    }

    const changes = uploadFolderEntries
      .map((entry) => ({
        action: (uploadFolderMode === "upsert" ? "update" : "create") as "create" | "update",
        path: joinRepositoryPath(normalizedBasePath, entry.relativePath),
        content: entry.content,
      }))
      .filter((entry) => Boolean(entry.path))

    if (!changes.length) {
      setUploadFolderError("No valid file paths were generated from this upload.")
      return
    }

    const chunks = chunkArray(changes, MAX_FILES_PER_COMMIT)

    try {
      setBusyAction("upload-folder")
      setUploadFolderError("")
      setUploadProgress({ done: 0, total: chunks.length })
      let expectedHeadShaForNextChunk = selectedBranchMeta?.commitSha ?? undefined
      let lastCommitUrl: string | null = null

      for (const [index, chunk] of chunks.entries()) {
        const chunkMessage = chunks.length > 1 ? `${commitMessage} (part ${index + 1}/${chunks.length})` : commitMessage
        const result = (await githubApi.saveChanges({
          teamId: activeTeamId,
          branch: targetBranch,
          expectedHeadSha: expectedHeadShaForNextChunk,
          message: chunkMessage,
          changes: chunk,
        })) as unknown as { commitSha?: string; compareUrl?: string | null; commit?: { sha?: string; url?: string | null } }
        expectedHeadShaForNextChunk = result?.commitSha || result?.commit?.sha || expectedHeadShaForNextChunk
        lastCommitUrl = result?.commit?.url ?? result?.compareUrl ?? lastCommitUrl
        setUploadProgress({ done: index + 1, total: chunks.length })
      }

      setUploadFolderDialogOpen(false)
      setUploadFolderEntries([])
      setUploadFolderRejectedEntries([])
      setUploadFolderError("")
      setUploadProgress({ done: 0, total: 0 })
      setSelectedBranch(targetBranch)
      setCurrentPath(normalizedBasePath)
      setSelectedFilePath("")
      setSelectedBlob(null)
      setIsEditingCode(false)

      const skippedCount = uploadFolderRejectedEntries.length
      const successMessage =
        skippedCount > 0
          ? `${changes.length} file(s) uploaded to ${targetBranch}. ${skippedCount} file(s) were skipped.`
          : `${changes.length} file(s) uploaded to ${targetBranch}.`
      setUploadResultCommitUrl(lastCommitUrl)

      setCodeActionNotice({
        tone: skippedCount > 0 ? "warning" : "success",
        title: skippedCount > 0 ? "Folder uploaded with skipped files" : "Folder uploaded",
        message: successMessage,
      })
      toast.success(successMessage)

      await Promise.all([refreshRepositoryData(), loadTree(normalizedBasePath, targetBranch)])
    } catch (error) {
      const message = friendlyWriteConflictAwareError(error, "Couldn't upload this folder to GitHub.")
      setUploadFolderError(message)
      setCodeActionNotice({
        tone: "error",
        title: "Couldn't upload this folder",
        message,
      })
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleConfirmFolderPicker = () => {
    setUploadFolderPickerConfirmOpen(false)
    window.setTimeout(() => {
      folderInputRef.current?.click()
    }, 120)
  }

  const handleSaveEditedFile = async () => {
    if (!selectedBlob) return

    const targetBranch = selectedBranch || defaultBranchName
    const commitMessage = saveCommitMessage.trim()

    if (!targetBranch) {
      setSaveDialogError("Choose a branch before saving this file.")
      return
    }

    if (commitMessage.length < 3) {
      setSaveDialogError("Write a commit message with at least 3 characters.")
      return
    }

    if (editorValue === (selectedBlob.content ?? "")) {
      setSaveDialogError("Make a change in the editor before committing it.")
      return
    }

    try {
      setBusyAction("save-code")
      setSaveDialogError("")
      await githubApi.saveChanges({
        teamId: activeTeamId,
        branch: targetBranch,
        expectedHeadSha: selectedBranchMeta?.commitSha ?? undefined,
        message: commitMessage,
        changes: [
          {
            action: "update",
            path: selectedBlob.path,
            content: editorValue,
          },
        ],
      })
      toast.success(`Changes committed to ${targetBranch}.`)
      setSaveDialogOpen(false)
      setIsEditingCode(false)
      setCodeActionNotice({
        tone: "success",
        title: "Commit saved",
        message: `${selectedBlob.name} was committed to ${targetBranch} and the preview is now refreshed.`,
      })
      await Promise.all([refreshRepositoryData(), loadTree(currentPath, targetBranch), loadBlob(selectedBlob.path, targetBranch)])
    } catch (error) {
      const message = friendlyWriteConflictAwareError(error, "Couldn't save your changes to GitHub.")
      setSaveDialogError(message)
      setCodeActionNotice({
        tone: "error",
        title: "Couldn't save this file",
        message,
      })
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleCreateFile = async () => {
    const targetBranch = newFileForm.branch || selectedBranch || defaultBranchName
    const normalizedPath = newFileForm.path.trim().replace(/^\/+/, "")
    const commitMessage = newFileForm.message.trim()

    if (!targetBranch) {
      setNewFileDialogError("Choose a branch before creating the file.")
      return
    }

    if (!normalizedPath) {
      setNewFileDialogError("Enter a full file path before creating the file.")
      return
    }

    if (normalizedPath.endsWith("/")) {
      setNewFileDialogError("Add a file name at the end of the path, not only a folder.")
      return
    }

    if (commitMessage.length < 3) {
      setNewFileDialogError("Write a commit message with at least 3 characters.")
      return
    }

    const nextDirectory = getParentPath(normalizedPath)

    try {
      setBusyAction("create-file")
      setNewFileDialogError("")
      await githubApi.saveChanges({
        teamId: activeTeamId,
        branch: targetBranch,
        expectedHeadSha: selectedBranchMeta?.commitSha ?? undefined,
        message: commitMessage,
        changes: [
          {
            action: "create",
            path: normalizedPath,
            content: newFileForm.content,
          },
        ],
      })
      toast.success(`Created ${normalizedPath} on ${targetBranch}.`)
      setActiveTab("code")
      setNewFileDialogOpen(false)
      setNewFileForm({ path: "", content: "", message: "", branch: targetBranch })
      setSelectedBranch(targetBranch)
      setCurrentPath(nextDirectory)
      setSelectedFilePath(normalizedPath)
      setSelectedBlob(null)
      setIsEditingCode(false)
      setCodeActionNotice({
        tone: "success",
        title: "File created",
        message: `${normalizedPath} is ready on ${targetBranch}. You can keep editing it right away.`,
      })
      await Promise.all([refreshRepositoryData(), loadTree(nextDirectory, targetBranch), loadBlob(normalizedPath, targetBranch)])
    } catch (error) {
      const message = friendlyWriteConflictAwareError(error, "Couldn't create the file in GitHub.")
      setNewFileDialogError(message)
      setCodeActionNotice({
        tone: "error",
        title: "Couldn't create this file",
        message,
      })
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  const handleRenameFile = async () => {
    if (!selectedBranch) {
      toast.error("Choose a branch before renaming this file.")
      return
    }

    try {
      setBusyAction("rename-file")
      await githubApi.saveChanges({
        teamId: activeTeamId,
        branch: selectedBranch,
        expectedHeadSha: selectedBranchMeta?.commitSha ?? undefined,
        message: renameForm.message,
        changes: [
          {
            action: "rename",
            path: renameForm.nextPath,
            previousPath: renameForm.path,
            content: selectedBlob?.content ?? editorValue,
          },
        ],
      })
      toast.success("File renamed.")
      setRenameDialogOpen(false)
      setSelectedFilePath(renameForm.nextPath)
      await Promise.all([refreshRepositoryData(), loadTree(getParentPath(renameForm.nextPath), selectedBranch)])
    } catch (error) {
      toast.error(friendlyWriteConflictAwareError(error, "Couldn't rename the file."))
    } finally {
      setBusyAction(null)
    }
  }

  const handleDeleteFile = async () => {
    if (!selectedBlob) return
    if (!selectedBranch) {
      toast.error("Choose a branch before deleting this file.")
      return
    }

    try {
      setBusyAction("delete-file")
      await githubApi.saveChanges({
        teamId: activeTeamId,
        branch: selectedBranch,
        expectedHeadSha: selectedBranchMeta?.commitSha ?? undefined,
        message: deleteCommitMessage,
        changes: [
          {
            action: "delete",
            path: selectedBlob.path,
          },
        ],
      })
      toast.success("File deleted from the selected branch.")
      const nextPath = getParentPath(selectedBlob.path)
      setDeleteDialogOpen(false)
      setSelectedFilePath("")
      setSelectedBlob(null)
      setCurrentPath(nextPath)
      await Promise.all([refreshRepositoryData(), loadTree(nextPath, selectedBranch)])
    } catch (error) {
      toast.error(friendlyWriteConflictAwareError(error, "Couldn't delete the file."))
    } finally {
      setBusyAction(null)
    }
  }

  const collectDirectoryFiles = useCallback(
    async (directoryPath: string, branch: string, visited = new Set<string>()) => {
      if (visited.has(directoryPath)) return []
      visited.add(directoryPath)

      const response = await githubApi.getTree({
        teamId: activeTeamId,
        ref: branch,
        path: directoryPath || undefined,
      })

      const nestedFiles: string[] = []
      for (const item of response.items) {
        if (item.type === "dir") {
          const children = await collectDirectoryFiles(item.path, branch, visited)
          nestedFiles.push(...children)
        } else {
          nestedFiles.push(item.path)
        }
      }

      return nestedFiles
    },
    [activeTeamId],
  )

  const handleDeleteTreeFile = useCallback(
    async (filePath: string, commitMessage?: string) => {
      if (!selectedBranch) {
        toast.error("Choose a branch before deleting this file.")
        return
      }

      const busyKey = toPathBusyKey("delete-item", filePath)
      try {
        setBusyAction(busyKey)
        await githubApi.saveChanges({
          teamId: activeTeamId,
          branch: selectedBranch,
          expectedHeadSha: selectedBranchMeta?.commitSha ?? undefined,
          message: commitMessage?.trim() || `Delete ${filePath}`,
          changes: [{ action: "delete", path: filePath }],
        })
        toast.success(`${filePath} deleted.`)
        if (selectedFilePath === filePath) {
          setSelectedFilePath("")
          setSelectedBlob(null)
        }
        await Promise.all([refreshRepositoryData(), loadTree(currentPath, selectedBranch), loadPathActivity(currentPath)])
      } catch (error) {
        toast.error(friendlyWriteConflictAwareError(error, "Couldn't delete this file."))
      } finally {
        setBusyAction(null)
      }
    },
    [activeTeamId, currentPath, loadPathActivity, loadTree, refreshRepositoryData, selectedBranch, selectedBranchMeta?.commitSha, selectedFilePath],
  )

  const handleDeleteDirectory = useCallback(
    async (directoryPath: string, commitMessage?: string) => {
      if (!selectedBranch) {
        toast.error("Choose a branch before deleting this folder.")
        return
      }

      const busyKey = toPathBusyKey("delete-item", directoryPath)
      try {
        setBusyAction(busyKey)
        const filePaths = await collectDirectoryFiles(directoryPath, selectedBranch)
        if (!filePaths.length) {
          toast.error("This folder has no files to delete.")
          return
        }

        let expectedHeadShaForNextChunk = selectedBranchMeta?.commitSha ?? undefined
        const deleteChunks = chunkArray(
          filePaths.map((path) => ({ action: "delete" as const, path })),
          MAX_FILES_PER_COMMIT,
        )

        for (const [index, chunk] of deleteChunks.entries()) {
          const message =
            deleteChunks.length > 1
              ? `${commitMessage?.trim() || `Delete folder ${directoryPath}`} (part ${index + 1}/${deleteChunks.length})`
              : commitMessage?.trim() || `Delete folder ${directoryPath}`
          const result = (await githubApi.saveChanges({
            teamId: activeTeamId,
            branch: selectedBranch,
            expectedHeadSha: expectedHeadShaForNextChunk,
            message,
            changes: chunk,
          })) as unknown as { commitSha?: string; commit?: { sha?: string } }
          expectedHeadShaForNextChunk = result?.commitSha || result?.commit?.sha || expectedHeadShaForNextChunk
        }

        toast.success(`${directoryPath} and ${filePaths.length} file(s) were deleted.`)
        if (selectedFilePath.startsWith(`${directoryPath}/`)) {
          setSelectedFilePath("")
          setSelectedBlob(null)
        }
        const safePath = currentPath.startsWith(`${directoryPath}/`) || currentPath === directoryPath ? getParentPath(directoryPath) : currentPath
        setCurrentPath(safePath)
        await Promise.all([refreshRepositoryData(), loadTree(safePath, selectedBranch), loadPathActivity(safePath)])
      } catch (error) {
        toast.error(friendlyWriteConflictAwareError(error, "Couldn't delete this folder."))
      } finally {
        setBusyAction(null)
      }
    },
    [
      activeTeamId,
      collectDirectoryFiles,
      currentPath,
      loadPathActivity,
      loadTree,
      refreshRepositoryData,
      selectedBranch,
      selectedBranchMeta?.commitSha,
      selectedFilePath,
    ],
  )

  const requestDeleteTreeItem = useCallback(
    (item: { path: string; type: string; name: string }) => {
      const isDirectory = item.type === "dir"
      setTreeDeleteDialog({
        open: true,
        path: item.path,
        isDirectory,
        message: isDirectory ? `Delete folder ${item.path}` : `Delete ${item.path}`,
      })
    },
    [],
  )

  const handleConfirmTreeDelete = useCallback(async () => {
    if (!treeDeleteDialog.path || !treeDeleteDialog.message.trim()) return
    if (treeDeleteDialog.isDirectory) {
      await handleDeleteDirectory(treeDeleteDialog.path, treeDeleteDialog.message)
    } else {
      await handleDeleteTreeFile(treeDeleteDialog.path, treeDeleteDialog.message)
    }
    setTreeDeleteDialog({
      open: false,
      path: "",
      isDirectory: false,
      message: "",
    })
  }, [handleDeleteDirectory, handleDeleteTreeFile, treeDeleteDialog])

  const handleOpenLogs = async (runId: string) => {
    try {
      setBusyAction(`logs-${runId}`)
      const result = await githubApi.getWorkflowLogs(Number(runId), activeTeamId)
      if (result.logsUrl) {
        window.open(result.logsUrl, "_blank", "noopener,noreferrer")
        return
      }
      toast.error("GitHub did not return a downloadable log link for this run.")
    } catch (error) {
      toast.error(friendlyError(error, "Couldn't open the workflow logs."))
    } finally {
      setBusyAction(null)
    }
  }

  const openIssueEditor = (issue: ApiGitHubIssue) => {
    setEditingIssue(issue)
    setIssueForm({
      title: issue.title,
      body: issue.body ?? "",
      assignees: (issue.assignees ?? []).map((assignee) => assignee.login).join(", "),
      labels: (issue.labels ?? []).map((label) => label.name).join(", "),
    })
    setIssueDialogOpen(true)
  }

  const selectedBlobIsEditable = isEditableBlob(selectedBlob, selectedBranchMeta, canAuthorRepositoryChanges)

  if (!hasHydrated) return <WorkspaceSkeleton />

  if (!accessToken || !currentUser) {
    return (
      <div className="min-h-[60vh] rounded-[28px] border border-dashed border-border bg-muted/10 p-10">
        <div className="mx-auto max-w-xl text-center">
          <Github className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to open the GitHub workspace</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            GPMS needs your active session to load the connected repository, file tree, and team GitHub activity.
          </p>
          <div className="mt-6">
            <Link href="/login">
              <Button>Go to Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (shouldLoadMyTeamState && myTeamLoading) {
    return <TeamRequiredLoadingState />
  }

  if (shouldLoadMyTeamState && myTeamError) {
    return (
      <div className="min-h-[60vh] rounded-[28px] border border-destructive/30 bg-destructive/[0.04] p-10">
        <div className="mx-auto max-w-xl text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-semibold tracking-tight">Could not verify your team access</h1>
          <p className="mt-3 text-sm text-muted-foreground">{myTeamError}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => void refreshMyTeamState()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/my-team">Open My Team</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isStudentRole && !myTeamState?.team) {
    return (
      <TeamRequiredState
        pageName="GitHub Workspace"
        pageDescription="Browse your team's repository, code, issues, pull requests, and releases."
        icon={<Github className="h-10 w-10 text-primary" />}
      />
    )
  }

  if (workspaceLoading) return <WorkspaceSkeleton />

  const showSupportTeamPicker = SUPPORT_ROLES.has(currentUser.role)
  const shouldShowNoTeamState = workspaceNeedsTeam || Boolean(workspace?.setup.needsTeam)

  const workspaceShellActions = showSupportTeamPicker ? (
    <div className="flex w-full flex-col gap-2 sm:w-[300px]">
      <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Support view</Label>
      <Select value={requestedTeamId ?? workspace?.team?.id ?? ""} onValueChange={handleTeamSelection}>
        <SelectTrigger className="h-11 rounded-2xl">
          <SelectValue placeholder={teamOptionsLoading ? "Loading teams..." : supportNeedsTeamState ? "Choose an assigned team" : "Choose a team"} />
        </SelectTrigger>
        <SelectContent>
          {teamOptions.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={teamOptionsSearch}
        onChange={(event) => { setTeamOptionsSearch(event.target.value); setTeamOptionsPage(1) }}
        placeholder={supportNeedsTeamState ? "Search assigned teams" : "Search teams"}
        className="h-10 rounded-2xl"
      />
      {!supportNeedsTeamState ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 rounded-2xl"
          onClick={() => setTeamOptionsPage((current) => current + 1)}
          disabled={teamOptionsLoading || teamOptionsPage >= teamOptionsTotalPages}
        >
          {teamOptionsPage < teamOptionsTotalPages ? "Load more teams" : "All teams loaded"}
        </Button>
      ) : null}
    </div>
  ) : null

  if (shouldShowNoTeamState) {
    if (isStudentRole) {
      return (
        <TeamRequiredState
          pageName="GitHub Workspace"
          pageDescription="Browse your team's repository, code, issues, pull requests, and releases."
          icon={<Github className="h-10 w-10 text-primary" />}
        />
      )
    }

    return (
      <WorkspaceShell
        title="GitHub Workspace"
        subtitle="One connected repository for code, pull requests, releases, and repository-backed project delivery."
        actions={workspaceShellActions}
      >
        <NoTeamGitHubState
          currentRole={currentUser.role}
          teamOptions={teamOptions}
          teamOptionsLoading={teamOptionsLoading}
          teamOptionsSearch={teamOptionsSearch}
          onTeamOptionsSearchChange={(value) => { setTeamOptionsSearch(value); setTeamOptionsPage(1) }}
          canLoadMoreTeams={teamOptionsPage < teamOptionsTotalPages}
          onLoadMoreTeams={() => setTeamOptionsPage((current) => current + 1)}
          onSelectTeam={handleTeamSelection}
        />
      </WorkspaceShell>
    )
  }

  if (workspaceError) {
    return (
      <WorkspaceShell title="GitHub Workspace" subtitle="Real repository operations for your team codebase.">
        <Card className="rounded-[28px] border border-destructive/20 bg-destructive/5 shadow-sm dark:border-destructive/30 dark:bg-destructive/10">
          <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Could not load the GitHub workspace</span>
              </div>
              <p className="text-sm text-destructive/80">{workspaceError}</p>
            </div>
            <Button onClick={() => void refreshWorkspace()} className="min-w-36">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </WorkspaceShell>
    )
  }

  if (!workspace) return <WorkspaceSkeleton />

  const repositoryConnected = workspace.repositoryRecord?.connectionStatus === "ACTIVE"
  const defaultBranchName = workspace.repositoryRecord?.defaultBranch ?? workspace.repository?.defaultBranch ?? "main"
  const repositoryIsPublic = normalizeGitHubVisibility(workspace.repository?.visibility ?? workspace.repositoryRecord?.visibility) === "public"
  const connectedGitHubIdentity = workspace.githubConnection.login ?? workspace.githubConnection.displayName ?? "Not connected"

  return (
    <WorkspaceShell
      title="GitHub Workspace"
      subtitle="One connected repository for code, pull requests, releases, and repository-backed project delivery."
      actions={workspaceShellActions}
      variant={repositoryConnected ? (showSupportTeamPicker ? "compact" : "hidden") : "hidden"}
    >
      {callbackNotice ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-[24px] border p-5 mb-6 shadow-sm",
            callbackNotice.tone === "error"
              ? "border-destructive/20 bg-destructive/5 text-destructive dark:border-destructive/30 dark:bg-destructive/10"
              : "border-emerald-200/70 bg-emerald-50/80 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-400",
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                callbackNotice.tone === "error"
                  ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
              )}
            >
              {callbackNotice.tone === "error" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-1.5 pt-1">
              <p className="text-lg font-bold tracking-tight">{callbackNotice.title}</p>
              <p className="leading-6 opacity-90">{callbackNotice.message}</p>
              {callbackNotice.actionLabel && callbackNotice.onAction && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "rounded-xl border bg-background/50 transition-all",
                      callbackNotice.tone === "error"
                        ? "border-destructive/20 text-destructive hover:bg-destructive/10 dark:border-destructive/30 dark:bg-background/10 dark:hover:bg-destructive/20"
                        : "border-emerald-200 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-background/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20",
                    )}
                    onClick={callbackNotice.onAction}
                  >
                    {callbackNotice.actionLabel}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}

      {repositoryConnected && (missingGitHubCount || teamInviteCandidates.length || pendingInvitationCount || !workspace.githubConnection.isConnected) ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[24px] border border-rose-500/20 bg-rose-500/5 p-6 mb-6 dark:border-rose-500/30 dark:bg-rose-500/10"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-3 pt-1">
              <p className="text-lg font-bold tracking-tight text-rose-700 dark:text-rose-400">Action required for full setup</p>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-muted-foreground">
                {!workspace.githubConnection.isConnected ? (
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-foreground/90 dark:text-rose-200/90">You still need to link your personal GitHub account to this workspace.</span>
                  </li>
                ) : null}
                {missingGitHubCount > (workspace.githubConnection.isConnected ? 0 : 1) ? (
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span>{workspace.githubConnection.isConnected ? missingGitHubCount : missingGitHubCount - 1} other team member{(workspace.githubConnection.isConnected ? missingGitHubCount : missingGitHubCount - 1) === 1 ? "" : "s"} still need to link their GitHub accounts.</span>
                  </li>
                ) : null}
                {teamInviteCandidates.length ? (
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span>{teamInviteCandidates.length} teammate{teamInviteCandidates.length === 1 ? "" : "s"} are waiting for repository invitations.</span>
                  </li>
                ) : null}
                {pendingInvitationCount ? (
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    <span>{pendingInvitationCount} pending invitation{pendingInvitationCount === 1 ? "" : "s"} need acceptance on GitHub.</span>
                  </li>
                ) : null}
              </ul>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!workspace.githubConnection.isConnected ? (
                  <Button size="sm" className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-sm dark:bg-rose-600 dark:hover:bg-rose-500" onClick={() => void handleGitHubUserConnect()} disabled={busyAction === "connect-user"}>
                    {busyAction === "connect-user" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                    Connect Personal GitHub
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" className="rounded-xl border-rose-500/20 bg-background/50 text-rose-700 hover:bg-rose-500/10 transition-all dark:border-rose-500/30 dark:bg-background/10 dark:text-rose-400 dark:hover:bg-rose-500/20" onClick={() => setActiveTab("members")}>
                  Manage Access
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}

      {!repositoryConnected ? (
        <NoRepositoryState
          workspace={workspace}
          currentRole={currentUser.role}
          setupDialogError={setupDialogError}
          setupDialogOpen={setupDialogOpen}
          setSetupDialogOpen={setSetupDialogOpen}
          setupMode={setupMode}
          setSetupMode={setSetupMode}
          createRepositoryForm={createRepositoryForm}
          setCreateRepositoryForm={setCreateRepositoryForm}
          connectRepositoryForm={connectRepositoryForm}
          setConnectRepositoryForm={setConnectRepositoryForm}
          busyAction={busyAction}
          workspaceLoading={workspaceLoading}
          onConnectGitHub={handleGitHubUserConnect}
          onInstallGitHubApp={handleGitHubInstall}
          onCheckInstallationStatus={handleInstallationStatusCheck}
          onCreateRepository={handleCreateRepository}
          onConnectRepository={handleConnectRepository}
        />
      ) : (
        <>
          <Card className="relative overflow-hidden rounded-[30px] border border-border/70 bg-linear-to-b from-primary/12 via-background/95 to-background/95 shadow-[0_26px_72px_-56px_rgba(15,23,42,0.34)] transition-all duration-300 motion-reduce:transform-none hover:-translate-y-0.5 hover:shadow-[0_34px_84px_-56px_rgba(15,23,42,0.42)]">
            <CardContent className="relative space-y-6 p-5 sm:p-6 lg:p-7">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-start">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none hover:bg-primary/10">
                      <Github className="mr-1.5 h-3.5 w-3.5" />
                      Team: {workspace?.team?.name}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1.5 rounded-full px-3 py-1 capitalize">
                      {workspace?.repository?.visibility === "PRIVATE" ? (
                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      Visibility: {normalizeGitHubVisibility(workspace?.repository?.visibility)}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1.5 rounded-full px-3 py-1">
                      <GitBranch className="h-3.5 w-3.5 text-primary" />
                      Branch: {selectedBranch || defaultBranchName}
                    </Badge>
                    {workspace?.permissions.canReadAsSupervisor ? (
                      <Badge className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 shadow-none hover:bg-amber-100">
                        Read-only view
                      </Badge>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Connected repository</p>
                      <div className="flex flex-col gap-1.5">
                        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background shadow-sm">
                            <Github className="h-6 w-6 text-foreground" />
                          </span>
                          {repositoryPathLabel.includes("/") ? (
                            <Link
                              href={`https://github.com/${repositoryPathLabel}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors"
                            >
                              {repositoryDisplayName}
                            </Link>
                          ) : (
                            repositoryDisplayName
                          )}
                        </h1>
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80 sm:text-[15px]">
                          <span>GitHub path:</span>
                          {repositoryPathLabel.includes("/") ? (
                            <Link
                              href={`https://github.com/${repositoryPathLabel}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-1.5 transition-colors hover:text-primary"
                            >
                              <span className="underline decoration-border/50 decoration-1 underline-offset-[3px] transition-all group-hover:decoration-primary/50 group-hover:underline-offset-[4px]">
                                {repositoryPathLabel}
                              </span>
                              <ExternalLink className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-100" />
                            </Link>
                          ) : (
                            <span>{repositoryPathLabel}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                      {workspace?.repository?.description ||
                        workspace?.team?.bio ||
                        "Connected repository for code, pull requests, releases, and day-to-day team delivery."}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <MetaCard label="Default branch" value={defaultBranchName} hint="Primary branch for new PRs" />
                    <MetaCard label="Last sync" value={lastSyncLabel} hint={syncStatusLabel} />
                    <MetaCard label="Latest push" value={lastPushLabel} hint="Newest commit received" />
                  </div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-3 rounded-[24px] border border-border/70 bg-muted/4 p-4 transition-all duration-200 hover:border-primary/25 hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-11 w-11 border border-border/70 bg-background shadow-sm">
                        <AvatarImage
                          src={workspace.githubConnection.avatarUrl ?? workspace.repository?.owner.avatarUrl ?? undefined}
                          alt={connectedGitHubIdentity}
                        />
                        <AvatarFallback>{getInitials(connectedGitHubIdentity)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          Connected as{" "}
                          <Link
                            href={`https://github.com/${workspace.githubConnection.login}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            {connectedGitHubIdentity}
                          </Link>
                        </p>
                        <p className="truncate text-xs leading-5 text-muted-foreground">
                          Owner{" "}
                          <Link
                            href={`https://github.com/${repositoryOwnerLogin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            {repositoryOwnerLogin}
                          </Link>{" "}
                          | Last push {lastPushLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {connectedAccessLabel}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-3 py-1">
                        {syncStatusLabel}
                      </Badge>
                    </div>
                  </motion.div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <WorkspaceFact
                      label="Team members"
                      value={`${teamMemberCount}`}
                      detail={`${teamMemberCount === 1 ? "Member" : "Members"} in this repo team`}
                    />
                    <WorkspaceFact
                      label="GitHub profiles"
                      value={`${teamMembersWithGitHubCount} ready`}
                      detail={
                        missingGitHubCount
                          ? `${missingGitHubCount} teammate${missingGitHubCount === 1 ? "" : "s"} still missing`
                          : "Everyone mapped to GitHub"
                      }
                    />
                    <WorkspaceFact
                      label="Collaborators"
                      value={`${collaboratorCount}`}
                      detail={`${collaboratorWriteCount} with write access`}
                    />
                    <WorkspaceFact
                      label="Pending invites"
                      value={`${pendingInvitationCount}`}
                      detail={pendingInvitationCount ? "Waiting on GitHub acceptance" : "No invitations waiting"}
                    />
                    <WorkspaceFact
                      label="Issues & PRs"
                      value={`${openIssueCount} / ${openPullRequestCount}`}
                      detail="Open work in GitHub"
                    />
                    <WorkspaceFact
                      label="Branches"
                      value={`${branchCount || 1}`}
                      detail={`Default branch: ${defaultBranchName}`}
                    />
                    <WorkspaceFact
                      label="Task sync"
                      value={`${repoBackedTaskCount}`}
                      detail={
                        workspaceTasksLoading
                          ? "Loading GPMS tasks"
                          : settingsDraft.syncIssuesToTasks
                            ? `${linkedTaskCount} GitHub issue link${linkedTaskCount === 1 ? "" : "s"}`
                            : "Issue sync is off"
                      }
                    />
                    <WorkspaceFact
                      label="Workflow runs"
                      value={`${workflowRunCount}`}
                      detail={`Last sync ${lastSyncLabel}`}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4 rounded-[24px] border border-border/70 bg-muted/6 p-4 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quick actions</p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Jump into the next repository task without leaving the main workspace card.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    {canAuthorRepositoryChanges ? (
                      <>
                        <Button className={cn(quickActionButtonClass, "bg-primary text-primary-foreground border-primary/30 hover:bg-primary/90 hover:text-primary-foreground")} onClick={handleOpenBranchDialog}>
                          <GitBranch className="mr-2 h-4 w-4" />
                          Create branch
                        </Button>
                        <Button
                          className={quickActionButtonClass}
                          variant="outline"
                          onClick={() => {
                            setActiveTab("code")
                            handleOpenNewFileDialog()
                          }}
                        >
                          <FilePlus2 className="mr-2 h-4 w-4" />
                          Add new file
                        </Button>
                      </>
                    ) : !workspace?.githubConnection.isConnected ? (
                      <Button className={cn(quickActionButtonClass, "bg-primary text-primary-foreground border-primary/30 hover:bg-primary/90 hover:text-primary-foreground")} onClick={() => void handleGitHubUserConnect()} disabled={busyAction === "connect-user"}>
                        {busyAction === "connect-user" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                        Connect Personal GitHub
                      </Button>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      {canManagePullRequestActions ? (
                        <Button
                          className={quickActionButtonClass}
                          variant="outline"
                          onClick={() => {
                            setActiveTab("pulls")
                            setPullRequestForm((current) => ({
                              ...current,
                              base: defaultBranchName,
                              head: selectedBranch || "",
                            }))
                            setPullRequestDialogOpen(true)
                          }}
                        >
                          <GitPullRequest className="mr-2 h-4 w-4" />
                          New PR
                        </Button>
                      ) : null}

                      {canSyncWorkspace ? (
                        <Button className={quickActionButtonClass} variant="outline" onClick={() => void handleSyncRepository()} disabled={busyAction === "sync"}>
                          {busyAction === "sync" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                          Sync now
                        </Button>
                      ) : null}

                      {workspace?.repository?.url ? (
                        <Button className={quickActionButtonClass} variant="outline" asChild>
                          <a href={workspace.repository.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            GitHub
                          </a>
                        </Button>
                      ) : null}

                      {workspace?.repositoryRecord?.cloneUrlHttps ? (
                        <Button className={quickActionButtonClass} variant="outline" onClick={() => void handleCopy("HTTPS clone URL", workspace?.repositoryRecord?.cloneUrlHttps, "copy-clone")}>
                          <motion.span
                            key={copiedActionKey === "copy-clone" ? "copied-clone" : "copy-clone"}
                            initial={{ scale: 0.92, opacity: 0.85 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.16 }}
                            className="mr-2 inline-flex"
                          >
                            {copiedActionKey === "copy-clone" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </motion.span>
                          {copiedActionKey === "copy-clone" ? "Copied" : "Copy clone"}
                        </Button>
                      ) : null}

                      {workspace?.githubConnection.isConnected ? (
                        <Button className={cn(quickActionButtonClass, "border-transparent bg-transparent text-muted-foreground hover:border-red-300/60 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300")} variant="ghost" onClick={() => void requestDisconnectUserConnection()} disabled={busyAction === "disconnect-user"}>
                          {busyAction === "disconnect-user" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
                          Disconnect
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border/70 bg-muted/6 p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tasks ↔ GitHub</p>
                      <Badge variant="outline" className="h-5 rounded-full border-primary/20 bg-primary/5 px-2 text-[10px] font-bold text-primary">
                        {repoBackedTaskCount} Linked
                      </Badge>
                    </div>

                    {workspaceTasksLoading ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Syncing tasks...
                      </div>
                    ) : workspaceTasksError ? (
                      <p className="mt-2 text-[11px] text-destructive">{workspaceTasksError}</p>
                    ) : repoBackedTaskCount > 0 ? (
                      <div className="mt-4 space-y-4">
                        {/* Compact Stats Row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/50 p-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                              <AlertCircle className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-foreground">{repoBackedTasksBlocked}</p>
                              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Blocked</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/50 p-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                              <Clock className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-foreground">{repoBackedTasksWaitingAcceptance}</p>
                              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Pending</p>
                            </div>
                          </div>
                        </div>

                        {/* Next Task - Streamlined Row */}
                        {nextRepoTask && (
                          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                  <p className="truncate text-xs font-bold text-foreground">{nextRepoTask.title}</p>
                                </div>
                                <p className="truncate text-[10px] text-muted-foreground">
                                  {humanizeStateLabel(nextRepoTask.status)} · {nextRepoTask.assignee?.fullName || "Unassigned"}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 w-7 rounded-lg p-0 hover:bg-primary/10 hover:text-primary" asChild>
                                <a href={`/dashboard/tasks?teamId=${activeTeamId}${nextRepoTask?.id ? `&taskId=${nextRepoTask.id}` : ""}`}>
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}

                        <Button variant="ghost" size="sm" className="h-8 w-full rounded-xl text-[11px] text-muted-foreground hover:text-primary" asChild>
                          <a href={`/dashboard/tasks?teamId=${activeTeamId}`}>
                            Open Task Board <ChevronRight className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <p className="text-xs text-muted-foreground">No GitHub-tracked tasks found for this team.</p>
                        <Button variant="outline" size="sm" className="h-8 w-full rounded-xl text-[11px]" asChild>
                          <a href={`/dashboard/tasks?teamId=${activeTeamId ?? ""}`}>Setup Tracking</a>
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkspaceTab)} className="space-y-8">
            <div className="sticky top-0 z-20 -mx-4 mb-2 overflow-x-auto no-scrollbar bg-background/80 px-4 py-3 backdrop-blur-md transition-all duration-300 md:-mx-8 md:px-8">
              <TabsList className="flex h-auto w-max items-center justify-start gap-1.5 bg-transparent p-0 pr-2">
                <TabsTrigger value="overview" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Overview</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="code" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <FileCode2 className="h-4 w-4" />
                    <span>Code</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="commits" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <GitCommitHorizontal className="h-4 w-4" />
                    <span>Commits</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="issues" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Issues</span>
                    {openIssueCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] rounded-full bg-primary/10 px-1 text-[10px] text-primary">
                        {openIssueCount}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="pulls" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="h-4 w-4" />
                    <span>Pull Requests</span>
                    {openPullRequestCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] rounded-full bg-primary/10 px-1 text-[10px] text-primary">
                        {openPullRequestCount}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="branches" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    <span>Branches</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="actions" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    <span>Actions</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="releases" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Releases</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="members" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Members</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="settings" className={workspaceTabTriggerClass}>
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    <span>Settings</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-0 space-y-8 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid gap-8 xl:grid-cols-[1fr_minmax(320px,360px)]"
              >
                <div className="space-y-8">

                  {/* Quick Stats Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard 
                      icon={<GitCommitHorizontal className="h-5 w-5" />} 
                      label="Commits" 
                      value={String(commits.length)} 
                      color="blue"
                      onClick={() => setActiveTab("commits")}
                    />
                    <StatCard 
                      icon={<AlertCircle className="h-5 w-5" />} 
                      label="Open Issues" 
                      value={String(openIssueCount)} 
                      color="amber"
                      onClick={() => setActiveTab("issues")}
                    />
                    <StatCard 
                      icon={<GitPullRequest className="h-5 w-5" />} 
                      label="Pull Requests" 
                      value={String(openPullRequestCount)} 
                      color="emerald"
                      onClick={() => setActiveTab("pulls")}
                    />
                    <StatCard 
                      icon={<Users className="h-5 w-5" />} 
                      label="Collaborators" 
                      value={String(collaboratorCount)} 
                      color="indigo"
                      onClick={() => setActiveTab("members")}
                    />
                  </div>

                  {/* Integration Health Section */}
                  <SectionCard
                    title="Integration health"
                    description="Live monitoring of the connection between GitHub and your GPMS team workspace."
                    className="overflow-hidden border-border/50 shadow-sm"
                  >
                    <div className="space-y-6">
                      <div className="flex flex-col gap-6 md:flex-row">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Connection Status</p>
                              <p className="text-sm text-muted-foreground">GPMS App connection to GitHub</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-border/40 bg-muted/5 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Status</span>
                              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none shadow-none font-bold uppercase tracking-wider text-[10px]">
                                Active
                              </Badge>
                            </div>
                            <Separator className="my-3 opacity-40" />
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Webhook</span>
                              <span className="text-sm font-bold text-foreground/80">{lastWebhookLabel}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                              <UserRound className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Your Access</p>
                              <p className="text-sm text-muted-foreground">Personal GitHub permissions</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-border/40 bg-muted/5 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Account</span>
                              <span className="text-sm font-bold text-foreground/80">@{workspace?.githubConnection.login || "Not connected"}</span>
                            </div>
                            <Separator className="my-3 opacity-40" />
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Write Access</span>
                              <Badge className={cn(
                                "border-none shadow-none font-bold uppercase tracking-wider text-[10px]",
                                hasConnectedGitHubWriteAccess 
                                  ? "bg-emerald-500/10 text-emerald-600" 
                                  : "bg-amber-500/10 text-amber-600"
                              )}>
                                {hasConnectedGitHubWriteAccess ? "Granted" : "Limited"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Recent activity"
                    description="Latest commits with quick context on who changed what."
                    className="border-border/50 shadow-sm"
                  >
                    {commits.length ? (
                      <div className="space-y-5">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <MetaCard label="Recent commits" value={String(commits.length)} hint="Loaded in current timeline" />
                          <MetaCard label="Open work" value={`${openIssueCount + openPullRequestCount}`} hint={`${openIssueCount} issues + ${openPullRequestCount} PRs`} />
                          <MetaCard label="Sync health" value={syncStatusLabel} hint={`Last sync ${lastSyncLabel}`} />
                        </div>
                        <div className="space-y-2.5">
                          {commits.slice(0, 3).map((commit) => (
                            <motion.button
                              key={`overview-${commit.sha}`}
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.995 }}
                              onClick={() => {
                                setSelectedCommitSha(commit.sha)
                                setActiveTab("commits")
                              }}
                              className="group w-full rounded-2xl border border-border/60 bg-background/60 p-3 text-left transition-all hover:border-primary/25 hover:bg-primary/6"
                            >
                              <div className="flex items-start gap-3">
                                <Avatar className="mt-0.5 h-8 w-8 border border-border/60">
                                  <AvatarImage src={commit.author.avatarUrl ?? undefined} alt={commit.author.login ?? undefined} />
                                  <AvatarFallback className="text-[10px] font-semibold">
                                    {getInitials(commit.author.login ?? commit.author.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="truncate text-sm font-semibold text-foreground/90 group-hover:text-primary transition-colors">
                                    {getCommitSubject(commit.message)}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                    <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px] font-semibold">
                                      {commit.sha.slice(0, 7)}
                                    </Badge>
                                    <span>{formatRelative(commit.author.date)}</span>
                                    <span>·</span>
                                    <span>@{commit.author.login || "unknown"}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="w-full rounded-xl border-border/50 text-foreground/85 hover:bg-primary/10 hover:text-primary hover:border-primary/30 dark:hover:bg-primary/20 transition-all" onClick={() => setActiveTab("commits")}>
                          View All History
                        </Button>
                      </div>
                    ) : (
                      <p className="text-center py-6 text-sm text-muted-foreground italic">No recent activity detected.</p>
                    )}
                  </SectionCard>
                </div>

                <div className="space-y-8">
                  <SectionCard
                    title="Active automation"
                    description="How this repository syncs with your GPMS project."
                    className="border-border/50 shadow-sm"
                  >
                    <div className="space-y-3">
                      <AutomationRow 
                        icon={<CheckSquare className="h-4 w-4" />} 
                        label="Issues to Tasks" 
                        active={settingsDraft.syncIssuesToTasks} 
                      />
                      <AutomationRow 
                        icon={<Calendar className="h-4 w-4" />} 
                        label="Weekly Progress" 
                        active={settingsDraft.syncActivityToWeeklyReports} 
                      />
                      <AutomationRow 
                        icon={<Upload className="h-4 w-4" />} 
                        label="Release Tracking" 
                        active={settingsDraft.syncReleasesToSubmissions} 
                      />
                    </div>
                    <div className="mt-6 pt-4 border-t border-border/40">
                      <Button variant="ghost" size="sm" className="w-full rounded-xl text-muted-foreground hover:text-primary transition-all" onClick={() => setActiveTab("settings")}>
                        Configure Sync Settings
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </SectionCard>

                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="commits" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="flex flex-col gap-4 rounded-[24px] border border-border/60 bg-muted/4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">Commit timeline</h3>
                    <p className="text-sm text-muted-foreground">Review recent changes and inspect file-level diffs quickly.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                      {filteredCommits.length}/{commits.length} shown
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                      {selectedCommit ? "1 selected" : "No selection"}
                    </Badge>
                  </div>
                </div>
                {commitDetailError && selectedCommit ? (
                  <InlineNotice
                    tone="error"
                    title="Couldn't load full commit details"
                    message={commitDetailError}
                    actionLabel="Retry"
                    onAction={() => void loadCommitDetails(selectedCommit.sha)}
                  />
                ) : null}

                <div className="grid gap-8 xl:grid-cols-[minmax(320px,400px)_1fr]">
                <SectionCard
                  title="Commit history"
                  description={`Inspect the timeline of changes on ${selectedBranch || defaultBranchName}.`}
                  stackHeader
                  className="xl:sticky xl:top-24 xl:self-start border-border/50 bg-background/80 shadow-sm rounded-[28px] backdrop-blur-sm"
                >
                  <div className="mb-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Select
                        value={selectedBranch}
                        onValueChange={(value) => {
                          setSelectedBranch(value)
                          setCurrentPath("")
                          setSelectedFilePath("")
                          setSelectedBlob(null)
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-border/40 bg-background/80 sm:w-[180px]">
                          <SelectValue placeholder="Branch" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                          {branches.map((branch) => (
                            <SelectItem key={`commit-branch-${branch.name}`} value={branch.name} className="rounded-lg">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-3.5 w-3.5 opacity-60" />
                                <span className="text-sm font-medium">{branch.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                        <Input
                          value={commitSearch}
                          onChange={(event) => setCommitSearch(event.target.value)}
                          placeholder="Filter commits by message, author, or SHA..."
                          aria-label="Filter commits"
                          className="h-10 rounded-xl border-border/40 bg-background/80 pl-9 transition-all focus:bg-background"
                        />
                      </div>
                    </div>
                  </div>
                  {commitFeedError ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="space-y-3">
                          <p>{commitFeedError}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-amber-200 bg-background hover:bg-amber-100"
                            onClick={() => void loadCommitPage(commitPage)}
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : commitFeedLoading && !commits.length ? (
                    <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/5">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary/30" />
                      <span className="text-sm font-medium text-muted-foreground/60">Loading history...</span>
                    </div>
                  ) : filteredCommits.length ? (
                    <div className="space-y-4">
                      <ScrollArea className="h-[52vh] min-h-[320px] sm:h-[calc(100vh-22rem)] sm:min-h-[400px]">
                        <div className="space-y-3 p-2">
                          {visibleCommits.map((commit) => {
                            const isSelected = selectedCommitSha === commit.sha

                            return (
                              <button
                                key={commit.sha}
                                type="button"
                                onClick={() => setSelectedCommitSha(commit.sha)}
                                className={cn(
                                  "group relative w-full rounded-2xl border p-4 text-left transition-all duration-250",
                                  isSelected
                                    ? "border-primary/35 bg-primary/12 shadow-xl shadow-primary/15 ring-1 ring-primary/30 dark:border-primary/45 dark:bg-primary/20 dark:ring-primary/40"
                                    : "border-border/40 bg-muted/2 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/4 hover:shadow-md",
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                                    <AvatarImage src={commit.author.avatarUrl ?? undefined} alt={commit.author.login ?? undefined} />
                                    <AvatarFallback className="text-[10px] font-bold">{getInitials(commit.author.login ?? commit.author.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <Badge variant="outline" className="h-5 rounded-full border-border/50 bg-background/50 px-2 text-[10px] font-bold text-muted-foreground shadow-none">
                                        {commit.sha.slice(0, 7)}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className="h-5 rounded-full border-primary/20 bg-primary/8 px-2 text-[10px] font-bold text-primary shadow-none"
                                      >
                                        {selectedBranch || defaultBranchName}
                                      </Badge>
                                      <span className="text-[10px] font-semibold text-muted-foreground/60">{formatRelative(commit.author.date)}</span>
                                    </div>
                                    <p className={cn(
                                      "line-clamp-2 text-sm font-bold leading-snug tracking-tight transition-colors",
                                      isSelected ? "text-primary" : "text-foreground/90 group-hover:text-foreground"
                                    )}>
                                      {getCommitSubject(commit.message)}
                                    </p>
                                    <p className="truncate text-[11px] font-medium text-muted-foreground/70">
                                      by <span className="text-foreground/60">@{commit.author.login || commit.author.name}</span>
                                    </p>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                          {hasMoreCommits ? (
                            <div className="px-2 pb-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-full rounded-xl text-xs"
                                onClick={() => setCommitRenderLimit((current) => current + 60)}
                              >
                                Load more commits ({visibleCommits.length}/{filteredCommits.length})
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </ScrollArea>
                      <CommitPaginationControls
                        pageStart={commitPageStart}
                        pageEnd={commitPageEnd}
                        page={commitPage}
                        loading={commitFeedLoading}
                        hasPreviousPage={commitHasPreviousPage}
                        hasNextPage={commitHasNextPage}
                        onPrevious={() => void loadCommitPage(commitPage - 1)}
                        onNext={() => void loadCommitPage(commitPage + 1)}
                      />
                    </div>
                  ) : commitSearch.trim() ? (
                    <EmptySection
                      title="No matching commits"
                      description="Try another keyword, author name, or partial commit SHA."
                      icon={<Search className="h-5 w-5" />}
                    />
                  ) : (
                    <EmptySection
                      title="No commits yet"
                      description="The repository history is currently empty."
                      icon={<GitCommitHorizontal className="h-5 w-5" />}
                    />
                  )}
                </SectionCard>

                <SectionCard
                  title={selectedCommit ? selectedCommitSubject : "Commit details"}
                  description={
                    selectedCommit
                      ? `Authored ${formatRelative(selectedCommit.author.date)} on ${selectedBranch || defaultBranchName}`
                      : "Select a commit to view full diff and metadata."
                  }
                  className="min-w-0 border-border/50 shadow-sm rounded-[28px]"
                  action={
                    selectedCommit ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/60 bg-background/50 text-foreground/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all" asChild>
                          <a href={selectedCommit.htmlUrl ?? "#"} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            GitHub
                          </a>
                        </Button>
                      </div>
                    ) : undefined
                  }
                >
                  {commitDetailLoading ? (
                    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                      <span className="text-sm font-medium text-muted-foreground/60">Loading commit details...</span>
                    </div>
                  ) : selectedCommit ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                      <div className="rounded-2xl border border-border/50 bg-muted/10 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border/60">
                              <AvatarImage src={selectedCommit.author.avatarUrl ?? undefined} alt={selectedCommit.author.login ?? undefined} />
                              <AvatarFallback className="text-[10px] font-bold">{getInitials(selectedCommit.author.login ?? selectedCommit.author.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold text-foreground">@{selectedCommit.author.login || selectedCommit.author.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedCommit.sha.slice(0, 12)}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg"
                            onClick={() => void handleCopy("Commit SHA", selectedCommit.sha, "copy-commit-sha")}
                          >
                            {copiedActionKey === "copy-commit-sha" ? <Check className="mr-2 h-3.5 w-3.5" /> : <Copy className="mr-2 h-3.5 w-3.5" />}
                            {copiedActionKey === "copy-commit-sha" ? "Copied" : "Copy SHA"}
                          </Button>
                        </div>
                        {selectedCommitBody ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{selectedCommitBody}</p>
                        ) : null}
                      </div>
                      {/* Commit Metadata Grid */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-border/40 bg-muted/[0.03] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Total Changes</p>
                          <p className="mt-1 text-xl font-bold text-foreground">{selectedCommit.stats.total}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-400/25 dark:bg-emerald-500/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/70 dark:text-emerald-300/80">Additions</p>
                          <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">+{selectedCommit.stats.additions}</p>
                        </div>
                        <div className="rounded-2xl border border-red-200/70 bg-red-50/40 p-4 dark:border-red-400/25 dark:bg-red-500/10">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-red-700/70 dark:text-red-300/80">Deletions</p>
                          <p className="mt-1 text-xl font-bold text-red-700 dark:text-red-300">-{selectedCommit.stats.deletions}</p>
                        </div>
                        <div className="rounded-2xl border border-border/40 bg-muted/[0.03] p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Files Changed</p>
                          <p className="mt-1 text-xl font-bold text-foreground">{selectedCommit.files.length}</p>
                        </div>
                      </div>

                      {/* File Diffs */}
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Changed Files</h4>
                          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                            <Badge variant="outline" className="rounded-full border-emerald-300/70 bg-emerald-50/70 px-2 py-0 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">Added</Badge>
                            <Badge variant="outline" className="rounded-full border-red-300/70 bg-red-50/70 px-2 py-0 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-300">Deleted</Badge>
                            <Badge variant="outline" className="rounded-full border-border/60 bg-muted/30 px-2 py-0 text-muted-foreground">Context</Badge>
                          </div>
                        </div>
                        {selectedCommit.files.map((file: any) => (
                          <div key={file.filename} className="overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm">
                            <div className="flex items-center justify-between border-b border-border/40 bg-muted/5 px-5 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <FileCode2 className="h-4 w-4 text-primary/60 shrink-0" />
                                <span className="truncate text-sm font-bold text-foreground/80">{file.filename}</span>
                                <Badge className={cn("rounded-full px-2 py-0 border-none shadow-none text-[10px] font-bold uppercase tracking-wider", getCommitChangeBadgeClass(file.status))}>
                                  {file.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
                                <span className="text-emerald-600">+{file.additions}</span>
                                <span className="text-red-600">-{file.deletions}</span>
                              </div>
                            </div>
                            {file.patch ? (
                              <div className={cn("p-3 overflow-x-auto no-scrollbar", isDarkTheme ? "bg-slate-950/70" : "bg-slate-50")}>
                                <div className="min-w-full space-y-0.5 font-mono text-xs leading-6">
                                  {file.patch.split("\n").map((line: string, index: number) => {
                                    const isAdded = line.startsWith("+") && !line.startsWith("+++")
                                    const isDeleted = line.startsWith("-") && !line.startsWith("---")
                                    const isHunk = line.startsWith("@@")
                                    const isMeta = line.startsWith("diff ") || line.startsWith("index ") || line.startsWith("+++ ") || line.startsWith("--- ")

                                    return (
                                      <div
                                        key={`${file.filename}-patch-${index}`}
                                        className={cn(
                                          "grid grid-cols-[52px_20px_1fr] items-start rounded-md px-2",
                                          isAdded && "bg-emerald-500/12",
                                          isDeleted && "bg-red-500/12",
                                          isHunk && "bg-primary/10",
                                          isMeta && "bg-muted/30",
                                        )}
                                      >
                                        <span className={cn("select-none text-right tabular-nums text-[10px]", isDarkTheme ? "text-slate-500" : "text-slate-400")}>
                                          {index + 1}
                                        </span>
                                        <span
                                          className={cn(
                                            "text-center text-[10px] font-bold",
                                            isAdded && "text-emerald-600 dark:text-emerald-300",
                                            isDeleted && "text-red-600 dark:text-red-300",
                                            isHunk && "text-primary",
                                            !isAdded && !isDeleted && !isHunk && "text-muted-foreground/70",
                                          )}
                                        >
                                          {isAdded ? "+" : isDeleted ? "-" : isHunk ? "@" : "·"}
                                        </span>
                                        <code
                                          className={cn(
                                            "whitespace-pre-wrap break-words",
                                            isAdded && "text-emerald-700 dark:text-emerald-200",
                                            isDeleted && "text-red-700 dark:text-red-200",
                                            isHunk && "font-semibold text-primary",
                                            isMeta && "text-muted-foreground",
                                            !isAdded && !isDeleted && !isHunk && !isMeta && (isDarkTheme ? "text-slate-300" : "text-slate-700"),
                                          )}
                                        >
                                          {line || " "}
                                        </code>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="p-6 text-center text-xs text-muted-foreground italic bg-muted/5">
                                No patch data available for this file.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
                      <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-primary/10 text-primary/35 ring-1 ring-primary/20">
                        <GitCommitHorizontal className="h-12 w-12" />
                      </div>
                      <h4 className="text-xl font-bold tracking-tight text-foreground/80">Select a commit</h4>
                      <p className="mx-auto mt-2 max-w-[280px] text-sm text-muted-foreground/60">
                        Choose a commit from the history on the left to inspect its changes, metadata, and full file diffs.
                      </p>
                    </div>
                  )}
                </SectionCard>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="code" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileCode2 className="h-5 w-5" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">Code workspace</h3>
                      <Badge variant="outline" className="rounded-full border-border/50 px-3 py-1 font-medium text-muted-foreground">
                        <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                        {selectedBranch}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Browse, edit, and manage files in your team repository directly from GPMS.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {canAuthorRepositoryChanges && (
                      <Button variant="outline" size="sm" className={tabActionButtonClass} onClick={handleOpenNewFileDialog}>
                        <FilePlus2 className="mr-2 h-4 w-4" />
                        New File
                      </Button>
                    )}
                    {canAuthorRepositoryChanges && (
                      <Button variant="outline" size="sm" className={tabActionButtonClass} onClick={handleOpenUploadFolderDialog}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Folder
                      </Button>
                    )}
                    {canAuthorRepositoryChanges && (
                      <Button variant="outline" size="sm" className={tabActionButtonClass} onClick={() => setBranchDialogOpen(true)}>
                        <GitBranch className="mr-2 h-4 w-4" />
                        New Branch
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className={tabActionButtonClass} onClick={() => void handleSyncRepository()} disabled={busyAction === "sync"}>
                      {busyAction === "sync" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Refresh
                    </Button>
                  </div>
                </div>

                {codeActionNotice && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <InlineNotice tone={codeActionNotice.tone} title={codeActionNotice.title} message={codeActionNotice.message} />
                  </motion.div>
                )}
                {treeError ? (
                  <InlineNotice
                    tone="error"
                    title="Couldn't load repository tree"
                    message={treeError}
                    actionLabel="Retry"
                    onAction={() => void loadTree(currentPath)}
                  />
                ) : null}
                {blobError && selectedFilePath ? (
                  <InlineNotice
                    tone="error"
                    title="Couldn't open this file"
                    message={blobError}
                    actionLabel="Retry"
                    onAction={() => void openFile(selectedFilePath)}
                  />
                ) : null}
                <input
                  ref={folderInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                  onChange={(event) => {
                    void handleFolderFileSelection(event)
                  }}
                />

                <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
                  <div className="flex flex-col gap-6 xl:sticky xl:top-24 xl:self-start">
                    {/* Modern Explorer */}
                    <div className="flex flex-col overflow-hidden rounded-[28px] border border-border/50 bg-background/50 shadow-sm backdrop-blur-sm transition-all hover:border-border/80 hover:shadow-md">
                      <div className="border-b border-border/40 bg-muted/5 px-6 py-5">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Explorer</span>
                            <Badge variant="secondary" className="h-5 rounded-full bg-primary/5 px-2 text-[10px] font-bold text-primary border-none shadow-none">
                              {treeItems.length} items
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Select
                              value={selectedBranch}
                              onValueChange={(value) => {
                                setSelectedBranch(value)
                                setCurrentPath("")
                                setSelectedFilePath("")
                                setSelectedBlob(null)
                                setCodeSearch("")
                              }}
                            >
                              <SelectTrigger className="h-10 rounded-xl border-border/40 bg-background/80 hover:bg-background transition-colors">
                                <SelectValue placeholder="Branch" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                {branches.map((branch) => (
                                  <SelectItem key={branch.name} value={branch.name} className="rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <GitBranch className="h-3.5 w-3.5 opacity-60" />
                                      <span className="text-sm font-medium">{branch.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                              <Input
                                value={codeSearch}
                                onChange={(event) => setCodeSearch(event.target.value)}
                                placeholder="Search files..."
                                aria-label="Search files in explorer"
                                className="h-10 rounded-xl border-border/40 bg-background/80 pl-9 transition-all focus:bg-background"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Improved Breadcrumbs */}
                      <div className="border-b border-border/40 bg-muted/[0.02] px-4 py-3">
                        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-0.5">
                          <button
                            type="button"
                            onClick={() => openDirectory("")}
                            className={cn(
                              "flex items-center gap-2 shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                              currentPathSegments.length === 0
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                            )}
                          >
                            <FolderGit2 className="h-3.5 w-3.5" />
                            root
                          </button>
                          {currentPathSegments.map((segment) => (
                            <div key={segment.value} className="flex items-center gap-1">
                              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                              <button
                                type="button"
                                onClick={() => openDirectory(segment.value)}
                                className={cn(
                                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
                                  segment.value === currentPath
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                                )}
                              >
                                {segment.label}
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/70">
                          <span>{currentDirectoryTitle}</span>
                          <span>•</span>
                          <span>{visibleTreeItemLabel}</span>
                          <span>•</span>
                          <span>{totalTreeItemLabel}</span>
                          {pathActivity.loading && pathActivity.path === currentPath ? (
                            <>
                              <span>•</span>
                              <span>Checking last update...</span>
                            </>
                          ) : pathActivity.lastUpdatedAt && pathActivity.path === currentPath ? (
                            <>
                              <span>•</span>
                              <span>Last updated {formatRelative(pathActivity.lastUpdatedAt)}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* Tree List */}
                      <ScrollArea className="h-[52vh] min-h-[320px] sm:h-[460px] lg:h-[600px]">
                        <div className="p-2">
                          <AnimatePresence mode="wait">
                            {treeLoading ? (
                              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-32 flex-col items-center justify-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-primary/30" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Reading tree...</span>
                              </motion.div>
                            ) : filteredTreeItems.length ? (
                              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0.5">
                                {visibleTreeItems.map((item, index) => {
                                  const isDirectory = item.type === "dir"
                                  const isSelected = selectedFilePath === item.path
                                  const isLastRow = index === visibleTreeItems.length - 1
                                  return (
                                    <div key={item.path} className={cn("group relative flex items-center gap-1 rounded-xl transition-all duration-200", !isLastRow && "border-b border-border/35")}>
                                      <button
                                        type="button"
                                        onClick={() => (isDirectory ? openDirectory(item.path) : openFile(item.path))}
                                        className={cn(
                                          "flex flex-1 items-center gap-3 rounded-xl border border-transparent px-4 py-2.5 text-left transition-all duration-200 [content-visibility:auto]",
                                          isSelected
                                            ? "bg-primary/12 text-primary ring-1 ring-primary/25 dark:bg-primary/20"
                                            : "text-foreground/90 hover:border-border/50 hover:bg-muted/45 hover:text-foreground dark:text-foreground/85 dark:hover:bg-muted/35",
                                        )}
                                      >
                                        <div className={cn(
                                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                                          isSelected ? "border-primary/25 bg-background dark:bg-background/80" : "border-transparent group-hover:bg-background group-hover:border-border/60 dark:group-hover:bg-background/80"
                                        )}>
                                          {isDirectory ? (
                                            <Folder className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                          ) : (
                                            <FileCode2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                          )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm font-semibold tracking-tight text-foreground/95 dark:text-foreground/90">{item.name}</p>
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 dark:text-muted-foreground/80">{isDirectory ? "Folder" : "File"}</p>
                                        </div>
                                        <ChevronRight className={cn(
                                          "h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:opacity-100 text-muted-foreground/65",
                                          isSelected && "opacity-100 text-primary"
                                        )} />
                                      </button>

                                      {canAuthorRepositoryChanges && (
                                        <div className="absolute right-10 flex items-center pr-2">
                                          <button
                                            type="button"
                                            className={cn(
                                              "inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors opacity-0 group-hover:opacity-100",
                                              busyAction === toPathBusyKey("delete-item", item.path)
                                                ? "cursor-not-allowed opacity-70"
                                                : "cursor-pointer hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10",
                                            )}
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              if (busyAction === toPathBusyKey("delete-item", item.path)) return
                                              void requestDeleteTreeItem(item)
                                            }}
                                            aria-label={`Delete ${isDirectory ? "folder" : "file"} ${item.name}`}
                                            disabled={busyAction === toPathBusyKey("delete-item", item.path)}
                                          >
                                            {busyAction === toPathBusyKey("delete-item", item.path) ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                                {hasMoreTreeItems ? (
                                  <div className="flex items-center justify-center py-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 rounded-lg text-xs"
                                      onClick={() => setTreeRenderLimit((current) => current + 200)}
                                    >
                                      Load 200 more ({visibleTreeItems.length}/{filteredTreeItems.length})
                                    </Button>
                                  </div>
                                ) : null}
                              </motion.div>
                            ) : (
                              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-32 flex-col items-center justify-center text-center p-6">
                                <Search className="h-8 w-8 text-muted-foreground/10 mb-2" />
                                <p className="text-xs font-medium text-muted-foreground/50">No items found</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <SectionCard
                      title={selectedBlob ? selectedBlob.name : "Code preview"}
                      description={selectedBlob ? selectedBlob.path : "Select a file from the explorer to view its contents."}
                      className="flex-1 overflow-hidden border-border/50 bg-background/50 shadow-sm backdrop-blur-sm rounded-[28px] hover:border-border/80 transition-all"
                      action={
                        selectedBlob ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {selectedBlobIsEditable && !isEditingCode && (
                              <Button size="sm" className="h-9 rounded-xl bg-primary px-5 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90" onClick={handleOpenEditor}>
                                <WandSparkles className="mr-2 h-4 w-4" />
                                Edit Code
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/50 bg-background/70 text-foreground/85 hover:border-primary/25 hover:bg-primary/10 hover:text-primary transition-all" asChild>
                              <a href={selectedBlob.htmlUrl ?? "#"} target="_blank" rel="noreferrer">
                                <Github className="mr-2 h-4 w-4" />
                                Open on GitHub
                              </a>
                            </Button>
                          </div>
                        ) : undefined
                      }
                    >
                      <AnimatePresence mode="wait">
                        {blobLoading ? (
                          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
                            <span className="text-sm font-medium text-muted-foreground/60">Loading file contents...</span>
                          </motion.div>
                        ) : selectedBlob ? (
                          <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* File Metadata */}
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge variant="outline" className="rounded-full border-border/50 bg-muted/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                {getFileLanguage(selectedBlob.path)}
                              </Badge>
                              <Badge variant="outline" className="rounded-full border-border/50 bg-muted/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                {formatRepoSize(selectedBlob.size / 1024)}
                              </Badge>
                              {selectedBlob.readOnly ? (
                                <Badge className="rounded-full bg-amber-500/10 text-amber-600 border-none shadow-none font-bold text-[10px] uppercase tracking-wider">
                                  <Lock className="mr-1.5 h-3 w-3" /> Read Only
                                </Badge>
                              ) : (
                                <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 border-none shadow-none font-bold text-[10px] uppercase tracking-wider">
                                  <ShieldCheck className="mr-1.5 h-3 w-3" /> Editable
                                </Badge>
                              )}
                              {pathActivity.loading && pathActivity.path === selectedBlob.path ? (
                                <Badge variant="outline" className="rounded-full border-border/50 bg-muted/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Checking update time...
                                </Badge>
                              ) : pathActivity.lastUpdatedAt && pathActivity.path === selectedBlob.path ? (
                                <Badge variant="outline" className="rounded-full border-border/50 bg-muted/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Updated {formatRelative(pathActivity.lastUpdatedAt)}
                                </Badge>
                              ) : null}
                            </div>

                            {isEditingCode ? (
                              <div className="space-y-4">
                                <div className="overflow-hidden rounded-2xl border border-border/50 bg-background shadow-[0_20px_40px_-34px_rgba(15,23,42,0.35)]">
                                  <div className="flex items-center justify-between border-b border-border/40 bg-muted/5 px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 w-2 rounded-full bg-red-500/45" />
                                      <div className="h-2 w-2 rounded-full bg-amber-500/45" />
                                      <div className="h-2 w-2 rounded-full bg-emerald-500/45" />
                                      <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">Editor</span>
                                    </div>
                                    <Badge variant="outline" className="h-6 rounded-full px-2 text-[10px] font-semibold uppercase tracking-wider">
                                      {getFileLanguage(selectedBlob.path)}
                                    </Badge>
                                  </div>
                                  <MonacoEditor
                                    height="520px"
                                    language={getFileLanguage(selectedBlob.path)}
                                    theme={monacoTheme}
                                    value={editorValue}
                                    onChange={(value) => setEditorValue(value ?? "")}
                                    options={{
                                      minimap: { enabled: false },
                                      fontSize: 14,
                                      wordWrap: "on",
                                      scrollBeyondLastLine: false,
                                      automaticLayout: true,
                                      padding: { top: 16, bottom: 16 },
                                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button className="rounded-xl px-6 h-10 bg-primary shadow-lg shadow-primary/20 transition-all hover:bg-primary/90" onClick={handleOpenSaveDialog} disabled={editorValue === (selectedBlob.content ?? "") || busyAction === "save-code"}>
                                      {busyAction === "save-code" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                      Commit Changes
                                    </Button>
                                    <Button variant="outline" className="h-10 rounded-xl border-border/50 bg-background/70 px-6 text-foreground/85 transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary" onClick={() => setIsEditingCode(false)}>
                                      Cancel
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2 sm:justify-end">
                                    <Button variant="ghost" size="sm" className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/15 dark:hover:text-red-300 transition-all" onClick={() => { setDeleteCommitMessage(`Delete ${selectedBlob.name}`); setDeleteDialogOpen(true) }}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete File
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "overflow-hidden rounded-3xl border shadow-[0_26px_54px_-34px_rgba(2,6,23,0.78)]",
                                  isDarkTheme
                                    ? "border-slate-800/80 bg-[#0d1117]"
                                    : "border-border/70 bg-muted/10 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.24)]",
                                )}
                              >
                                <div
                                  className={cn(
                                    "flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-3",
                                    isDarkTheme ? "border-b border-white/8 bg-white/2" : "border-b border-border/50 bg-background/85",
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500/50" />
                                    <div className="h-2 w-2 rounded-full bg-amber-500/50" />
                                    <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
                                    <span className={cn("ml-1 truncate text-[10px] font-bold uppercase tracking-[0.18em]", isDarkTheme ? "text-slate-400" : "text-muted-foreground/80")}>
                                      {selectedBlob.path}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8",
                                      isDarkTheme
                                        ? "text-slate-400 hover:text-white hover:bg-white/5"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                    )}
                                    onClick={() => void handleCopy("File content", selectedBlobContent, "copy-file-content")}
                                  >
                                    <motion.span
                                      key={copiedActionKey === "copy-file-content" ? "copied-file" : "copy-file"}
                                      initial={{ scale: 0.9, opacity: 0.85 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ duration: 0.16 }}
                                      className="inline-flex"
                                    >
                                      {copiedActionKey === "copy-file-content" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </motion.span>
                                  </Button>
                                </div>
                                <div className="h-[58vh] min-h-[320px] max-h-[560px] overflow-auto no-scrollbar">
                                  <div className="min-w-full p-4 font-mono text-sm leading-relaxed sm:p-6">
                                    {(selectedBlobContent ? selectedBlobLines : ["This file is empty."]).map((line, index) => (
                                      <div key={`line-${index}`} className="grid grid-cols-[auto_1fr] items-start gap-4">
                                        <span
                                          className={cn(
                                            "select-none text-right text-xs tabular-nums leading-6",
                                            isDarkTheme ? "text-slate-500" : "text-slate-400",
                                          )}
                                        >
                                          {index + 1}
                                        </span>
                                        <code className={cn("whitespace-pre-wrap break-words leading-6", isDarkTheme ? "text-slate-300" : "text-slate-700")}>
                                          {line}
                                        </code>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ) : (
                          <div className="flex min-h-[500px] flex-col items-center justify-center p-12 text-center">
                            <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-[32px] bg-primary/10 text-primary/35 ring-1 ring-primary/20">
                              <FolderGit2 className="h-12 w-12" />
                            </div>
                            <h4 className="text-xl font-bold tracking-tight text-foreground/80">Select a file to begin</h4>
                            <p className="mx-auto mt-2 max-w-[280px] text-sm text-muted-foreground/60">
                              Choose any file from the repository explorer on the left to view its contents, history, or make direct edits.
                            </p>
                            <div className="mt-8">
                              <Button variant="outline" className="rounded-xl border-border/60 bg-background/50 px-8 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all" onClick={() => openDirectory("")}>
                                Browse Root Directory
                              </Button>
                            </div>
                          </div>
                        )}
                      </AnimatePresence>
                    </SectionCard>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="issues" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">Issues</h3>
                      <Badge variant="secondary" className="rounded-full bg-amber-500/10 px-3 py-1 font-bold text-amber-600 border-none shadow-none">
                        {openIssueCount} Open
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Track bugs, tasks, and feature requests from GitHub.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" className="h-10 rounded-xl border-border/50 hover:bg-muted/50 transition-all" onClick={() => void handleSyncRepository()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Issues
                    </Button>
                    {canManageIssueActions && (
                      <Button className="h-10 rounded-xl bg-primary px-6 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90" onClick={() => { setEditingIssue(null); setIssueForm(initialIssueForm); setIssueDialogOpen(true) }}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Issue
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                        <Input 
                          value={issueSearch} 
                          onChange={(event) => setIssueSearch(event.target.value)} 
                          placeholder="Filter issues by title or number..." 
                            aria-label="Filter issues"
                          className="h-12 rounded-2xl border-border/40 bg-background/50 pl-10 backdrop-blur-sm transition-all focus:bg-background" 
                        />
                      </div>
                      <div className="flex items-center gap-1 rounded-2xl border border-border/40 bg-background/50 p-1 backdrop-blur-sm">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "h-9 rounded-xl px-4 text-xs font-bold transition-all", 
                            issueStateFilter === "all" 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          onClick={() => { setIssueStateFilter("all"); setIssuePage(1) }}
                        >
                          All
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "h-9 rounded-xl px-4 text-xs font-bold transition-all", 
                            issueStateFilter === "open" 
                              ? "bg-emerald-600 text-white shadow-sm" 
                              : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"
                          )}
                          onClick={() => { setIssueStateFilter("open"); setIssuePage(1) }}
                        >
                          Open
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "h-9 rounded-xl px-4 text-xs font-bold transition-all", 
                            issueStateFilter === "closed" 
                              ? "bg-purple-600 text-white shadow-sm" 
                              : "text-muted-foreground hover:bg-purple-50 hover:text-purple-700"
                          )}
                          onClick={() => { setIssueStateFilter("closed"); setIssuePage(1) }}
                        >
                          Closed
                        </Button>
                      </div>
                    </div>

                    {filteredIssues.length ? (
                      <div className="grid gap-4">
                        {filteredIssues.map((issue) => (
                          <motion.div
                            key={issue.id}
                            whileHover={{ y: -2 }}
                            className="group relative overflow-hidden rounded-[24px] border border-border/50 bg-background p-6 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                          >
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                                issue.state === "open" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-purple-50 text-purple-600 border-purple-100"
                              )}>
                                <AlertCircle className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground/50">#{issue.number}</span>
                                    <Badge variant="outline" className="rounded-full border-border/50 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                      {issue.state}
                                    </Badge>
                                    {issue.linkedTask && (
                                      <a href={`/dashboard/tasks?taskId=${issue.linkedTask.id}`} className="inline-flex">
                                        <Badge className="rounded-full border-none bg-primary/10 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-primary shadow-none hover:bg-primary/15">
                                          Linked Task
                                        </Badge>
                                      </a>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-muted-foreground/60">{formatRelative(issue.createdAt)}</span>
                                </div>
                                <h4 className="text-lg font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                                  {issue.title}
                                </h4>
                                {issue.body && (
                                  <p className="line-clamp-2 text-sm text-muted-foreground/80 leading-relaxed">
                                    {issue.body}
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 pt-1">
                                  {issue.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                      {issue.labels.map(label => (
                                        <Badge 
                                          key={label.name} 
                                          style={{ 
                                            backgroundColor: isDarkTheme ? `#${label.color}15` : `#${label.color}25`, 
                                            color: isDarkTheme ? `#${label.color}` : "rgba(0,0,0,0.8)", 
                                            borderColor: isDarkTheme ? `#${label.color}30` : `#${label.color}50` 
                                          }}
                                          className={cn(
                                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all shadow-sm ring-1 ring-inset",
                                            isDarkTheme ? "ring-white/5" : "ring-black/5"
                                          )}
                                        >
                                          <span 
                                            className="mr-1.5 h-1.5 w-1.5 rounded-full shadow-sm" 
                                            style={{ backgroundColor: `#${label.color}` }}
                                          />
                                          <span className="tracking-tight">
                                            {label.name}
                                          </span>
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                  <a href={issue.htmlUrl} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                                {canManageIssueActions && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openIssueEditor(issue)}>
                                      <Settings2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      title={issue.state === "open" ? "Close issue" : "Reopen issue"}
                                      className={cn(
                                        "h-9 w-9 rounded-xl transition-all",
                                        issue.state === "open" 
                                          ? "text-red-600 hover:bg-red-100/80 hover:text-red-700" 
                                          : "text-emerald-600 hover:bg-emerald-100/80 hover:text-emerald-700",
                                        busyAction === `issue-${issue.number}` ? "opacity-100" : "opacity-40 group-hover:opacity-100"
                                      )} 
                                      onClick={() => requestToggleIssueState(issue)} 
                                      disabled={busyAction === `issue-${issue.number}`}
                                    >
                                      {busyAction === `issue-${issue.number}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : issue.state === "open" ? (
                                        <XCircle className="h-4 w-4" />
                                      ) : (
                                        <RefreshCw className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <EmptySection
                        title="No issues found"
                        description="There are currently no issues matching your search."
                        icon={<AlertCircle className="h-6 w-6" />}
                      />
                    )}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl"
                        onClick={() => void loadIssuePage(issuePage - 1)}
                        disabled={!issueHasPreviousPage}
                      >
                        Previous
                      </Button>
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                        Page {issuePage}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl"
                        onClick={() => void loadIssuePage(issuePage + 1)}
                        disabled={!issueHasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <SectionCard
                      title="Insights"
                      description="Repository health metrics."
                      className="border-border/50 shadow-sm rounded-[28px]"
                    >
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Open Issues</span>
                            <span className="text-sm font-bold text-foreground">{openIssueCount}</span>
                          </div>
                          <Progress value={issues.length ? (openIssueCount / issues.length) * 100 : 0} className="h-1.5 bg-muted/50" />
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Collaborators</span>
                            <span className="text-sm font-bold text-foreground">{collaboratorCount} active</span>
                          </div>
                          <div className="flex -space-x-2 overflow-hidden">
                            {issues.slice(0, 5).map((issue, i) => (
                              <Avatar key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-background border border-border/50">
                                <AvatarImage src={issue.author.avatarUrl ?? undefined} />
                                <AvatarFallback className="text-[10px] font-bold">{getInitials(issue.author.login)}</AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="pulls" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <GitPullRequest className="h-5 w-5" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">Pull requests</h3>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary border-none shadow-none">
                        {openPullRequestCount} Active
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Review, discuss, and merge code changes.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" className="h-10 rounded-xl border-border/50 hover:bg-muted/50 transition-all" onClick={() => void handleSyncRepository()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync PRs
                    </Button>
                    {canManagePullRequestActions && (
                      <Button className="h-10 rounded-xl bg-primary px-6 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90" onClick={() => { setPullRequestForm((current) => ({ ...current, base: workspace?.repositoryRecord?.defaultBranch ?? "main", head: selectedBranch || "" })); setPullRequestDialogOpen(true) }}>
                        <GitPullRequest className="mr-2 h-4 w-4" />
                        New PR
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                      <Input 
                        value={pullSearch} 
                        onChange={(event) => setPullSearch(event.target.value)} 
                        placeholder="Filter pull requests by title, number or author..." 
                          aria-label="Filter pull requests"
                        className="h-12 rounded-2xl border-border/40 bg-background/50 pl-10 backdrop-blur-sm transition-all focus:bg-background" 
                      />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl border border-border/40 bg-background/50 p-1 backdrop-blur-sm">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "h-9 rounded-xl px-4 text-xs font-bold transition-all", 
                          pullStateFilter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        onClick={() => { setPullStateFilter("all"); setPullPage(1) }}
                      >
                        All
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "h-9 rounded-xl px-4 text-xs font-bold transition-all", 
                          pullStateFilter === "open" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"
                        )}
                        onClick={() => { setPullStateFilter("open"); setPullPage(1) }}
                      >
                        Open
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "h-9 rounded-xl px-4 text-xs font-bold transition-all", 
                          pullStateFilter === "closed" ? "bg-purple-600 text-white shadow-sm" : "text-muted-foreground hover:bg-purple-50 hover:text-purple-700"
                        )}
                        onClick={() => { setPullStateFilter("closed"); setPullPage(1) }}
                      >
                        Closed
                      </Button>
                    </div>
                  </div>

                  {filteredPullRequests.length ? (
                    <div className="grid gap-4">
                      {filteredPullRequests.map((pullRequest) => {
                        const mergeGuidance = getPullRequestMergeGuidance(pullRequest)
                        return (
                          <motion.div
                            key={pullRequest.id}
                            whileHover={{ y: -2 }}
                            className="group relative overflow-hidden rounded-[24px] border border-border/50 bg-background p-6 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                          >
                          <div className="flex flex-col gap-6 md:flex-row md:items-start">
                            <div className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors",
                              pullRequest.state === "open" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-purple-50 text-purple-600 border-purple-100"
                            )}>
                              <GitPullRequest className="h-6 w-6" />
                            </div>
                            
                            <div className="min-w-0 flex-1 space-y-4">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-muted-foreground/50">#{pullRequest.number}</span>
                                    <Badge variant="outline" className={cn(
                                      "rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-wider",
                                      pullRequest.merged 
                                        ? "bg-purple-600 text-white border-purple-200 shadow-sm" 
                                        : pullRequest.state === "open"
                                          ? "bg-emerald-600 text-white border-emerald-200 shadow-sm"
                                          : "bg-red-600 text-white border-red-200 shadow-sm"
                                    )}>
                                      {pullRequest.merged ? "merged" : pullRequest.state}
                                    </Badge>
                                    {pullRequest.draft && (
                                      <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                                        Draft
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-muted-foreground/60">{formatRelative(pullRequest.createdAt)}</span>
                                </div>
                                <h4 className="text-xl font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                                  {pullRequest.title}
                                </h4>
                                {pullRequest.body && (
                                  <p className="line-clamp-2 text-sm text-muted-foreground/80 leading-relaxed">
                                    {pullRequest.body}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6 border border-border/50">
                                    <AvatarImage src={pullRequest.author.avatarUrl ?? undefined} />
                                    <AvatarFallback className="text-[8px]">{getInitials(pullRequest.author.login)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-bold text-foreground/70">@{pullRequest.author.login}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                  <GitBranch className="h-3.5 w-3.5" />
                                  <span className="rounded-md bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">{pullRequest.head}</span>
                                  <ArrowRight className="h-3 w-3" />
                                  <span className="rounded-md bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">{pullRequest.base}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                  <span className="flex items-center gap-1.5">
                                    <FileCode2 className="h-3.5 w-3.5" />
                                    {pullRequest.changedFiles} files
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <GitCommitHorizontal className="h-3.5 w-3.5" />
                                    {pullRequest.commits} commits
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 md:items-end">
                              <div className="flex flex-col items-end gap-2">
                                <div
                                  className={cn(
                                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                                    mergeGuidance.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300",
                                    mergeGuidance.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300",
                                    mergeGuidance.tone === "danger" && "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-300",
                                    mergeGuidance.tone === "muted" && "border-border/60 bg-muted/40 text-muted-foreground",
                                  )}
                                >
                                  {mergeGuidance.label}
                                </div>
                                <p className="max-w-[220px] text-right text-[11px] text-muted-foreground">
                                  {mergeGuidance.detail}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-xl border-border/50 transition-all shadow-sm hover:bg-slate-200 hover:text-slate-900 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                  onClick={() => void refreshPullRequest(pullRequest.number)}
                                  disabled={busyAction === `pull-refresh-${pullRequest.number}`}
                                  title="Refresh PR status"
                                >
                                  <RefreshCw className={cn("h-4 w-4", busyAction === `pull-refresh-${pullRequest.number}` && "animate-spin")} />
                                </Button>

                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-9 rounded-xl border-border/50 transition-all shadow-sm px-4 font-bold hover:bg-slate-200 hover:text-slate-900 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 text-foreground/80" 
                                  asChild
                                >
                                  <a href={pullRequest.htmlUrl} target="_blank" rel="noreferrer">
                                    <Github className="mr-2 h-4 w-4" />
                                    View
                                  </a>
                                </Button>

                                {canManagePullRequestActions && pullRequest.state === "open" && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-9 rounded-xl border-border/60 bg-background/50 text-foreground/80 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all" 
                                    onClick={() => setReviewingPullRequest(pullRequest)}
                                  >
                                    Review
                                  </Button>
                                )}

                                {canRunLeaderWriteActions && !pullRequest.merged && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    title={pullRequest.state === "open" ? "Close PR" : "Reopen PR"}
                                    className={cn(
                                      "h-9 rounded-xl transition-all",
                                      pullRequest.state === "open" 
                                        ? "text-red-600 hover:bg-red-100 hover:text-red-700 hover:border-red-200" 
                                        : "text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-200",
                                    )} 
                                    onClick={() => requestTogglePullRequestState(pullRequest)} 
                                    disabled={busyAction === `pull-${pullRequest.number}`}
                                  >
                                    {busyAction === `pull-${pullRequest.number}` ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : pullRequest.state === "open" ? (
                                      <XCircle className="mr-2 h-4 w-4" />
                                    ) : (
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    {pullRequest.state === "open" ? "Close" : "Reopen"}
                                  </Button>
                                )}

                                {canRunLeaderWriteActions && pullRequest.state === "open" && !pullRequest.draft && (
                                  <Button
                                    size="sm"
                                    className="h-9 rounded-xl bg-emerald-600 px-4 text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/30"
                                    onClick={() => openMergeDialog(pullRequest)}
                                    disabled={busyAction === `merge-${pullRequest.number}` || !mergeGuidance.canMerge}
                                  >
                                    {busyAction === `merge-${pullRequest.number}` ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <GitMerge className="mr-2 h-4 w-4" />
                                    )}
                                    {mergeGuidance.canMerge ? "Merge" : "Can't Merge"}
                                  </Button>
                                )}
                              </div>

                              {mergeGuidance.tone === "danger" ? (
                                <div className="max-w-[240px] rounded-xl border border-red-200/60 bg-red-50/70 p-2 text-left text-[11px] text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100">
                                  <p className="font-semibold">How to unblock:</p>
                                  <ul className="mt-1 list-inside list-disc space-y-0.5 opacity-80">
                                    <li>Resolve branch conflicts</li>
                                    <li>Complete required checks</li>
                                    <li>Wait for required approvals</li>
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptySection
                      title="No pull requests found"
                      description="There are currently no pull requests matching your search."
                      icon={<GitPullRequest className="h-6 w-6" />}
                    />
                  )}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl"
                      onClick={() => void loadPullPage(pullPage - 1)}
                      disabled={!pullHasPreviousPage}
                    >
                      Previous
                    </Button>
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                      Page {pullPage}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl"
                      onClick={() => void loadPullPage(pullPage + 1)}
                      disabled={!pullHasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="branches" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <GitBranch className="h-5 w-5" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">Branches</h3>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary border-none shadow-none">
                        {branches.length} Total
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manage working branches and compare changes across your repository.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {canAuthorRepositoryChanges && (
                      <Button className="h-10 rounded-xl bg-primary px-6 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90" onClick={handleOpenBranchDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Branch
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-8">
                    {canWriteCode && !hasConnectedGitHubWriteAccess && (
                      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                        <InlineNotice 
                          tone="warning" 
                          title="Limited write access" 
                          message={workspace.githubConnection.isConnected
                            ? "Your connected GitHub account can view this repository, but it still cannot create branches. Please ask your team leader to invite you as a collaborator."
                            : "Connect your personal GitHub account in settings to enable branch management."} 
                        />
                      </motion.div>
                    )}

                    <div className="grid gap-4">
                      {branches.map((branch) => (
                        <motion.div
                          key={branch.name}
                          whileHover={{ y: -2 }}
                          className={cn(
                            "group relative overflow-hidden rounded-[24px] border p-6 transition-all",
                            selectedBranch === branch.name 
                              ? "border-primary/30 bg-primary/[0.02] shadow-lg shadow-primary/5 ring-1 ring-primary/10" 
                              : "border-border/50 bg-background hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                          )}
                        >
                          <div className="flex flex-col gap-6 md:flex-row md:items-center">
                            <div className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                              selectedBranch === branch.name ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border/50"
                            )}>
                              <GitBranch className="h-5 w-5" />
                            </div>
                            
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="text-lg font-bold tracking-tight text-foreground/90">{branch.name}</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {branch.name === defaultBranchName && (
                                    <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 border-none shadow-none font-bold text-[10px] uppercase tracking-wider">
                                      Default
                                    </Badge>
                                  )}
                                  {branch.protected && (
                                    <Badge variant="outline" className="rounded-full border-border/50 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                      <Lock className="mr-1.5 h-3 w-3" /> Protected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="font-mono text-[11px] text-muted-foreground/60">
                                {branch.commitSha ? `Latest commit: ${branch.commitSha.slice(0, 7)}` : "No commits found"}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              {isTeamLeader && branch.name !== defaultBranchName && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-9 rounded-xl px-5 transition-all border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                  onClick={() => void handleSetDefaultBranch(branch.name)}
                                  disabled={busyAction === `set-default-${branch.name}`}
                                >
                                  {busyAction === `set-default-${branch.name}` ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                  )}
                                  Make Default
                                </Button>
                              )}

                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 rounded-xl border-border/50 hover:bg-muted/50 transition-all"
                                onClick={() => {
                                  setCompareState((current) => ({
                                    ...current,
                                    base: defaultBranchName,
                                    head: branch.name,
                                    error: "",
                                  }))
                                }}
                              >
                                Compare
                              </Button>
                              {canAuthorRepositoryChanges && isTeamLeader && !branch.protected && branch.name !== defaultBranchName && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                                  onClick={() => {
                                    setBranchDeleteConfirmationText("")
                                    setBranchToDelete(branch)
                                  }}
                                  disabled={busyAction === `delete-branch-${branch.name}`}
                                >
                                  {busyAction === `delete-branch-${branch.name}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <SectionCard title="Merge Branches" description="Combine changes from one branch into another directly." className="border-border/50 shadow-sm rounded-[28px]">
                      <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr_auto_1fr] items-center">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                              Base Branch
                              <span className="text-[9px] font-medium lowercase text-muted-foreground/40 italic">(target)</span>
                            </label>
                            <Select value={compareState.base} onValueChange={(value) => setCompareState((current) => ({ ...current, base: value }))}>
                              <SelectTrigger className="h-11 rounded-2xl border-border/40 bg-background/50"><SelectValue placeholder="Base branch" /></SelectTrigger>
                              <SelectContent className="rounded-xl">{branches.map((branch) => <SelectItem key={`base-${branch.name}`} value={branch.name}>{branch.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>

                          <div className="hidden lg:flex flex-col items-center gap-1 opacity-40 mt-4">
                            <ArrowRight className="h-5 w-5" />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                              Head Branch
                              <span className="text-[9px] font-medium lowercase text-muted-foreground/40 italic">(source)</span>
                            </label>
                            <Select value={compareState.head} onValueChange={(value) => setCompareState((current) => ({ ...current, head: value }))}>
                              <SelectTrigger className="h-11 rounded-2xl border-border/40 bg-background/50"><SelectValue placeholder="Head branch" /></SelectTrigger>
                              <SelectContent className="rounded-xl">{branches.map((branch) => <SelectItem key={`head-${branch.name}`} value={branch.name}>{branch.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button className="w-full h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 transition-all font-bold text-base" onClick={() => void handleCompareBranches()} disabled={compareState.loading}>
                          {compareState.loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                          Check Merge Status
                        </Button>

                        {compareState.result && (
                          <div className="space-y-4 pt-2">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 transition-all dark:border-emerald-500/10 dark:bg-emerald-500/5">
                                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20">
                                  <ArrowRight className="h-4 w-4 -rotate-45" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Ahead by {compareState.result.aheadBy} commits</p>
                                  <p className="text-xs leading-relaxed text-muted-foreground">
                                    {compareState.head} has new changes for {compareState.base}.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/30 p-4 transition-all dark:border-red-500/10 dark:bg-red-500/5">
                                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20">
                                  <ArrowRight className="h-4 w-4 rotate-[135deg]" />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-red-700 dark:text-red-400">Behind by {compareState.result.behindBy} commits</p>
                                  <p className="text-xs leading-relaxed text-muted-foreground">
                                    {compareState.base} has changes missing in {compareState.head}.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <Button 
                              variant="outline" 
                              className="w-full h-10 rounded-xl border-border/60 transition-all shadow-sm font-bold hover:bg-slate-200 hover:text-slate-900 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                              onClick={() => setShowCompareDetails(true)}
                            >
                              <BookOpen className="mr-2 h-4 w-4" />
                              View Detailed Changes
                            </Button>

                            {isTeamLeader && compareState.result.aheadBy > 0 && (
                              <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Button 
                                  className="w-full h-12 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/30 font-bold text-base"
                                  onClick={() => requestMergeBranch(compareState.base, compareState.head)}
                                  disabled={busyAction === "merge-branch"}
                                >
                                  {busyAction === "merge-branch" ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                  ) : (
                                    <GitMerge className="mr-2 h-5 w-5" />
                                  )}
                                  Merge {compareState.head} into {compareState.base}
                                </Button>
                                <p className="mt-3 text-center text-xs text-muted-foreground px-4">
                                  This will bring all {compareState.result.aheadBy} new commits from <span className="font-semibold text-foreground">{compareState.head}</span> into <span className="font-semibold text-foreground">{compareState.base}</span>.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </SectionCard>
                  </div>

                  <div className="lg:col-span-1 space-y-8">
                    <SectionCard
                      title="Branch policy"
                      description="GPMS enforces safety rules for branch management."
                      className="border-border/50 shadow-sm rounded-[28px]"
                    >
                      <ul className="space-y-4 text-sm text-muted-foreground">
                        <li className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>Protected branches cannot be deleted or renamed.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>Default branch is always protected by GPMS.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>Only teammates with write access can create branches.</span>
                        </li>
                      </ul>
                    </SectionCard>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="actions" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Rocket className="h-5 w-5" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">Actions</h3>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary border-none shadow-none">
                        {workflowRuns.length} Runs
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Monitor your CI/CD pipelines and automated workflows.
                    </p>
                  </div>
                </div>

                <SectionCard 
                  title="Workflow history" 
                  description="Recent automated runs on GitHub."
                  className="border-border/50 shadow-sm rounded-[28px]"
                >
                  {workflowRuns.length ? (
                    <div className="grid gap-3">
                      {workflowRuns.map((run) => (
                        <div key={run.id} className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-muted/[0.03] p-5 lg:flex-row lg:items-center lg:justify-between transition-all hover:border-border/60 hover:bg-muted/[0.06]">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                              run.status === "completed" && run.conclusion === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              run.status === "completed" && run.conclusion === "failure" ? "bg-red-50 text-red-600 border-red-100" :
                              "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                            )}>
                              <Rocket className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground/90 truncate">{run.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <GitBranch className="h-3 w-3" />
                                <span className="font-medium">{run.branch || "unknown"}</span>
                                <span>·</span>
                                <span>{formatRelative(run.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/50 hover:bg-muted/50" onClick={() => void handleOpenLogs(run.id)} disabled={busyAction === `logs-${run.id}`}>
                              View Logs
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/50 hover:bg-muted/50" asChild>
                              <a href={run.htmlUrl} target="_blank" rel="noreferrer">
                                <Github className="mr-2 h-4 w-4" />
                                GitHub
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptySection 
                      title="No workflows found" 
                      description="Workflows will appear here once they are triggered on GitHub." 
                      icon={<Rocket className="h-6 w-6" />} 
                    />
                  )}
                </SectionCard>
              </motion.div>
            </TabsContent>

            <TabsContent value="releases" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <Plus className="h-5 w-5" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">Releases</h3>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary border border-primary/20 shadow-none">
                        {releases.length} Total
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Track production-ready versions and project milestones.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {canRunLeaderWriteActions && (
                      <Button className="h-10 rounded-xl bg-primary px-6 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90" onClick={() => setReleaseDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Release
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-6">
                  {releases.length ? (
                    releases.map((release) => (
                      <motion.div
                        key={release.id}
                        whileHover={{ y: -2 }}
                        className="group relative overflow-hidden rounded-[28px] border border-border/50 bg-background p-8 transition-all hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10"
                      >
                        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-4 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="text-2xl font-bold tracking-tight text-foreground/90">{release.name}</h4>
                              <Badge variant="outline" className="rounded-full border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                {release.tagName}
                              </Badge>
                              <span className="text-xs font-semibold text-muted-foreground/60">{formatRelative(release.createdAt)}</span>
                            </div>
                            {release.body ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                                {release.body}
                              </div>
                            ) : (
                              <p className="text-sm italic text-muted-foreground/50">No release notes provided.</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" className="h-10 rounded-xl border-border/50 hover:bg-muted/50 transition-all" asChild>
                              <a href={release.htmlUrl} target="_blank" rel="noreferrer">
                                <Github className="mr-2 h-4 w-4" />
                                View on GitHub
                              </a>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <EmptySection 
                      title="No releases yet" 
                      description="Create your first release to mark a project milestone." 
                      icon={<Rocket className="h-6 w-6" />} 
                    />
                  )}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="members" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <Users className="h-5 w-5" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-foreground">Team access</h3>
                      <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary border border-primary/20 shadow-none">
                        {collaboratorCount} Collaborators
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manage repository permissions and GitHub account links for your team.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                      <Input 
                        value={memberSearch} 
                        onChange={(event) => setMemberSearch(event.target.value)} 
                        placeholder="Search team members..." 
                        aria-label="Search team members"
                        className="h-10 rounded-xl border-border/40 bg-background/50 pl-10 backdrop-blur-sm transition-all focus:bg-background w-full sm:w-[240px]" 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetaCard label="Team members" value={String(teamMemberCount)} hint="In this workspace team" />
                  <MetaCard label="Linked GitHub" value={String(teamMembersWithGitHubCount)} hint={missingGitHubCount ? `${missingGitHubCount} still missing` : "All members linked"} />
                  <MetaCard label="Collaborators" value={String(collaboratorCount)} hint={`${collaboratorWriteCount} with write access`} />
                  <MetaCard label="Pending invites" value={String(pendingInvitationCount)} hint="Awaiting acceptance on GitHub" />
                </div>

                <div className="grid gap-4">
                  {filteredMembers.length ? visibleMembers.map((member) => {
                    const githubUsername = member.user?.githubUsername ?? null
                    const collaborator = githubUsername
                      ? collaboratorByLogin.get(normalizeGitHubMatchValue(githubUsername))
                      : undefined
                    const invitation = githubUsername
                      ? invitationByLogin.get(normalizeGitHubMatchValue(githubUsername))
                      : undefined
                    const accessState = getMemberRepositoryAccessState({
                      githubUsername,
                      repositoryOwnerLogin: workspace?.repositoryRecord?.ownerLogin,
                      repositoryVisibility: workspace?.repository?.visibility ?? workspace?.repositoryRecord?.visibility,
                      collaborator,
                      invitation,
                    })
                    const canInviteMember =
                      canRunLeaderWriteActions &&
                      Boolean(githubUsername) &&
                      !collaborator &&
                      !invitation &&
                      normalizeGitHubMatchValue(githubUsername) !== normalizeGitHubMatchValue(workspace?.repositoryRecord?.ownerLogin)

                    return (
                      <motion.div
                        key={member.id}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="group relative overflow-hidden rounded-[24px] border border-border/50 bg-background p-5 transition-all hover:border-primary/25 hover:shadow-lg hover:shadow-primary/8"
                      >
                        <div className="flex flex-col gap-6 md:flex-row md:items-center">
                          <Avatar className="h-12 w-12 border border-border/50 shadow-sm">
                            <AvatarImage src={member.user?.avatarUrl || undefined} />
                            <AvatarFallback className="font-bold">{getInitials(member.user?.fullName)}</AvatarFallback>
                          </Avatar>
                          
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground/90 truncate">{member.user?.fullName}</h4>
                              <Badge variant="outline" className="rounded-full border-border/50 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {member.teamRole === "LEADER" ? "Team leader" : "Team member"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {githubUsername ? (
                                <div className="flex items-center gap-1.5">
                                  <Github className="h-3.5 w-3.5" />
                                  <span className="font-medium">@{githubUsername}</span>
                                </div>
                              ) : (
                                <span className="italic text-amber-600/60 flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  No GitHub account linked
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 text-right">Access Status</span>
                              <Badge className={cn(
                                "rounded-full px-3 py-0.5 border-none shadow-none font-bold text-[10px] uppercase tracking-wider",
                                accessState.tone === "success" ? "bg-emerald-500/10 text-emerald-600" :
                                accessState.tone === "warning" ? "bg-amber-500/10 text-amber-600" :
                                accessState.tone === "danger" ? "bg-red-500/10 text-red-600" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {accessState.label}
                              </Badge>
                            </div>
                            
                            {canInviteMember && (
                              <Button 
                                size="sm" 
                                className="h-9 rounded-xl bg-primary px-5 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90" 
                                onClick={() => void handleInviteCollaborator(githubUsername!)} 
                                disabled={busyAction === `invite-${githubUsername}`}
                              >
                                {busyAction === `invite-${githubUsername}` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                Invite
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  }) : (
                    <EmptySection
                      title="No members found"
                      description="Try a different search keyword or clear the current filter."
                      icon={<Users className="h-5 w-5" />}
                      compact
                    />
                  )}
                  {filteredMembers.length && hasMoreMembers ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-xl text-xs"
                      onClick={() => setMemberRenderLimit((current) => current + 30)}
                    >
                      Load more members ({visibleMembers.length}/{filteredMembers.length})
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <SectionCard
                    title="Invite contributors"
                    description={
                      repositoryIsPublic
                        ? "Public repositories are still read-only for other accounts. Invite collaborators here when teammates should create branches, commit, or open pull requests from GPMS."
                        : "Private repositories need collaborator invitations before teammates can contribute from GPMS."
                    }
                    className="border-border/50 shadow-sm rounded-[28px]"
                  >

                    {canRunLeaderWriteActions ? (
                      <div className="space-y-4">
                        <div className="rounded-[22px] border border-border/70 bg-muted/15 p-4 text-sm leading-6 text-muted-foreground">
                          Invite by GitHub username, or use the quick team suggestions below. GitHub will handle the acceptance step for private repositories.
                        </div>
                        <div
                          className={cn(
                            "grid gap-4",
                            workspace?.repositoryRecord?.ownerType === "ORGANIZATION"
                              ? "md:grid-cols-[minmax(0,1fr)_180px_auto]"
                              : "md:grid-cols-[minmax(0,1fr)_auto]",
                          )}
                        >
                          <Field
                            label="GitHub username"
                            description="Enter the exact GitHub login that should get write access to this repository."
                          >
                            <Input
                              value={inviteForm.login}
                              onChange={(event) =>
                                setInviteForm((current) => ({ ...current, login: event.target.value }))
                              }
                              placeholder="teammate-github-login"
                              className="h-11 rounded-2xl"
                            />
                          </Field>
                          {workspace?.repositoryRecord?.ownerType === "ORGANIZATION" ? (
                            <Field label="Permission" description="Choose the repository role for this organization invitation.">
                              <Select
                                value={inviteForm.permission}
                                onValueChange={(value: "pull" | "triage" | "push" | "maintain" | "admin") =>
                                  setInviteForm((current) => ({ ...current, permission: value }))
                                }
                              >
                                <SelectTrigger className="h-11 rounded-2xl">
                                  <SelectValue placeholder="Choose permission" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pull">Read</SelectItem>
                                  <SelectItem value="triage">Triage</SelectItem>
                                  <SelectItem value="push">Write</SelectItem>
                                  <SelectItem value="maintain">Maintain</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          ) : null}
                          <div className="flex items-end">
                            <Button
                              className="h-11 w-full md:w-auto"
                              onClick={() => void handleInviteCollaborator()}
                              disabled={!inviteForm.login.trim() || busyAction === "invite-collaborator"}
                            >
                              {busyAction === "invite-collaborator" ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <UserPlus className="mr-2 h-4 w-4" />
                              )}
                              Send Invite
                            </Button>
                          </div>
                        </div>
                        {repositoryAccessLoading ? (
                          <div className="flex items-center rounded-[22px] border border-dashed border-border/70 bg-muted/10 px-4 py-5 text-sm text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Checking current collaborator access...
                          </div>
                        ) : teamInviteCandidates.length ? (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Quick invite from team
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {teamInviteCandidates.slice(0, 8).map((member) => {
                                const githubUsername = member.user?.githubUsername
                                if (!githubUsername) return null
                                return (
                                  <Button
                                    key={`invite-${member.id}`}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void handleInviteCollaborator(githubUsername)}
                                    disabled={busyAction === "invite-collaborator"}
                                  >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {member.user?.fullName ?? githubUsername}
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <EmptySection
                            title="Everyone is already covered"
                            description="Team members with GitHub usernames already have collaborator access, a pending invitation, or they own the repository."
                            icon={<CheckCircle2 className="h-5 w-5" />}
                            compact
                          />
                        )}
                      </div>
                    ) : (
                      <EmptySection
                        title="Invite access needs verified GitHub write access"
                        description="The team leader or an admin must also have write access to the connected repository before sending invitations from this page."
                        icon={<UserPlus className="h-5 w-5" />}
                        compact
                      />
                    )}
                  </SectionCard>

                  <div className="space-y-6">
                    <SectionCard title="Who already has access" description="People GitHub currently recognizes as collaborators on this repository.">
                    {repositoryAccessLoading ? (
                      <div className="flex items-center justify-center rounded-[24px] border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading collaborator access...
                      </div>
                    ) : repositoryAccessError ? (
                      <div className="rounded-[24px] border border-red-200 bg-red-50/50 p-4 text-sm text-red-900 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-200">{repositoryAccessError}</div>
                    ) : repositoryAccessState.collaborators.length ? (
                      <div className="space-y-3">
                        {repositoryAccessState.collaborators.map((collaborator) => (
                          <div key={collaborator.id} className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-11 w-11 border border-border/70">
                                  <AvatarImage src={collaborator.avatarUrl ?? undefined} alt={collaborator.login} />
                                  <AvatarFallback>{getInitials(collaborator.login)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{collaborator.login}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {collaborator.isOwner
                                      ? "Repository owner"
                                      : collaborator.roleName || collaborator.permission || "Collaborator"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {collaborator.profileUrl ? (
                                  <Button variant="ghost" size="icon" asChild>
                                    <a href={collaborator.profileUrl} target="_blank" rel="noreferrer">
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                ) : null}
                                {canRunLeaderWriteActions && !collaborator.isOwner ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void requestRemoveCollaborator(collaborator)}
                                    disabled={busyAction === `remove-collaborator-${collaborator.login}`}
                                  >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    Remove
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptySection title="No collaborators yet" description="Invite teammates here if they should contribute directly from GPMS." icon={<Users className="h-5 w-5" />} compact />
                    )}
                  </SectionCard>

                    <SectionCard title="Pending invites" description="Collaborator invites waiting to be accepted on GitHub.">
                    {repositoryAccessLoading ? (
                      <div className="flex items-center justify-center rounded-[24px] border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading invitations...
                      </div>
                    ) : repositoryAccessState.invitations.length ? (
                      <div className="space-y-3">
                        {repositoryAccessState.invitations.map((invitation) => {
                          const inviteeLabel = invitation.inviteeLogin ?? invitation.inviteeEmail ?? "Pending invite"
                          return (
                            <div key={invitation.id} className="rounded-[24px] border border-border/70 bg-muted/20 p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                  <p className="font-medium">{inviteeLabel}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {invitation.permission || "write"} access · sent {formatRelative(invitation.createdAt)}
                                  </p>
                                </div>
                                {canRunLeaderWriteActions ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void requestCancelInvitation(invitation)}
                                    disabled={busyAction === `cancel-invitation-${invitation.id}`}
                                  >
                                    Cancel invite
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <EmptySection title="No pending invites" description="Once you send collaborator invitations, they will appear here until the target account accepts them." icon={<Link2 className="h-5 w-5" />} compact />
                    )}
                    </SectionCard>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetaCard label="Visibility" value={humanizeStateLabel(settingsDraft.visibility)} hint="Who can view this repository" />
                  <MetaCard label="Default branch" value={settingsDraft.defaultBranch || "main"} hint="Used for pull request base" />
                  <MetaCard label="Sync status" value={syncStatusLabel} hint={`Last sync ${lastSyncLabel}`} />
                  <MetaCard label="Invite backlog" value={String(pendingInvitationCount)} hint="Pending collaborator invitations" />
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-8">
                  <SectionCard 
                    title="Repository settings" 
                    description="Control visibility, branch defaults, and automation behavior."
                    className="border-border/50 bg-background/90 shadow-sm rounded-[28px]"
                  >
                    <div className="space-y-8">
                      <div className="rounded-[24px] border border-primary/20 bg-primary/7 p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/20">
                            <Globe className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground">Visibility & Access</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              Changing visibility affects who can see the code. Private repositories require explicit collaborator invitations for team members to contribute.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-3">
                          <label className="px-1 text-xs font-semibold text-muted-foreground">Visibility</label>
                          <Select
                            value={settingsDraft.visibility}
                            onValueChange={(value) =>
                              setSettingsDraft((current) => ({
                                ...current,
                                visibility: value as Extract<ApiGitHubRepositoryVisibility, "PUBLIC" | "PRIVATE">,
                              }))
                            }
                            disabled={!canRunLeaderWriteActions}
                          >
                            <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-background/90 transition-all hover:border-primary/25">
                              <SelectValue placeholder="Choose visibility" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="PRIVATE" className="rounded-xl">Private</SelectItem>
                              <SelectItem value="PUBLIC" className="rounded-xl">Public</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <label className="px-1 text-xs font-semibold text-muted-foreground">Default branch</label>
                          <Select
                            value={settingsDraft.defaultBranch}
                            onValueChange={(value) =>
                              setSettingsDraft((current) => ({
                                ...current,
                                defaultBranch: value,
                              }))
                            }
                            disabled={!canRunLeaderWriteActions || !branches.length}
                          >
                            <SelectTrigger className="h-12 rounded-2xl border-border/50 bg-background/90 transition-all hover:border-primary/25">
                              <SelectValue placeholder="Choose default branch" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              {branches.length ? (
                                branches.map((branch) => (
                                  <SelectItem key={branch.name} value={branch.name} className="rounded-xl">
                                    {branch.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value={settingsDraft.defaultBranch || "main"} className="rounded-xl">
                                  {settingsDraft.defaultBranch || "main"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator className="opacity-40" />

                      <div className="space-y-6">
                        <h4 className="px-1 text-xs font-semibold text-muted-foreground">Automation & sync</h4>
                        <div className="grid gap-4">
                          <ToggleRow 
                            title="Issue Synchronization" 
                            description="Automatically map GitHub issues to GPMS tasks and keep status in sync." 
                            checked={settingsDraft.syncIssuesToTasks} 
                            onCheckedChange={(checked) => setSettingsDraft((current) => ({ ...current, syncIssuesToTasks: checked }))} 
                            disabled={!canRunLeaderWriteActions}
                          />
                          <ToggleRow 
                            title="Activity Reporting" 
                            description="Prefill weekly progress reports with recent commits and repository activity." 
                            checked={settingsDraft.syncActivityToWeeklyReports} 
                            onCheckedChange={(checked) => setSettingsDraft((current) => ({ ...current, syncActivityToWeeklyReports: checked }))} 
                            disabled={!canRunLeaderWriteActions}
                          />
                          <ToggleRow 
                            title="Release Tracking" 
                            description="Track GitHub releases as project milestones in your delivery history." 
                            checked={settingsDraft.syncReleasesToSubmissions} 
                            onCheckedChange={(checked) => setSettingsDraft((current) => ({ ...current, syncReleasesToSubmissions: checked }))} 
                            disabled={!canRunLeaderWriteActions}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">Changes apply to your connected GitHub repository immediately after saving.</p>
                        <Button 
                          className="h-11 rounded-xl bg-primary px-8 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90" 
                          onClick={() => void requestUpdateSettings()} 
                          disabled={!canRunLeaderWriteActions || busyAction === "update-settings"}
                        >
                          {busyAction === "update-settings" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          Save Configuration
                        </Button>
                        {!canRunLeaderWriteActions && (
                          <p className="text-xs text-muted-foreground italic">
                            * Team leaders and admins need verified write access on the connected repository before changing this configuration.
                          </p>
                        )}
                      </div>
                    </div>
                  </SectionCard>

                  {canDisconnectConnectedRepository && (
                    <SectionCard 
                      title="Danger zone" 
                      description="Irreversible actions for this repository connection."
                      className="overflow-hidden rounded-[28px] border-red-200/70 shadow-sm"
                    >
                      <div className="rounded-[24px] border border-red-200/60 bg-red-50/55 p-6 dark:border-red-400/20 dark:bg-red-500/10">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-2">
                            <h5 className="text-lg font-bold text-red-900 dark:text-red-200">Disconnect repository</h5>
                            <p className="max-w-md text-sm leading-relaxed text-red-800/75 dark:text-red-200/80">
                              This will remove the link between GPMS and this GitHub repository. 
                              Your code on GitHub will not be affected.
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            className="h-11 shrink-0 rounded-xl border-red-300/70 bg-background text-red-700 transition-all hover:bg-red-600 hover:text-white dark:border-red-400/40 dark:bg-background/80 dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-red-50" 
                            onClick={() => void requestDisconnectRepository()} 
                            disabled={busyAction === "disconnect-repository"}
                          >
                            <Unplug className="mr-2 h-4 w-4" />
                            Disconnect
                          </Button>
                        </div>
                        {isTeamLeader ? (
                          <div className="mt-5 rounded-2xl border border-red-300/70 bg-red-100/70 p-4 dark:border-red-400/30 dark:bg-red-500/15">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-red-900 dark:text-red-100">Delete repository permanently</p>
                                <p className="text-xs text-red-800/90 dark:text-red-200/90">
                                  Permanently removes this repository from GitHub. This action cannot be undone.
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                className="h-10 rounded-xl"
                                onClick={() => void requestDeleteRepositoryPermanently()}
                                disabled={busyAction === "delete-repository-permanent"}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete permanently
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 text-xs italic text-red-700/80 dark:text-red-200/80">
                            Only the team leader can permanently delete the repository.
                          </p>
                        )}
                      </div>
                    </SectionCard>
                  )}
                </div>

                <div className="space-y-8">
                  <SectionCard 
                    title="Resources" 
                    description="Reference links and clone URLs for this repository."
                    className="border-border/50 bg-background/90 shadow-sm rounded-[28px]"
                  >
                    <div className="space-y-4">
                      <ActionRow 
                        title="GitHub Web" 
                        description="View on github.com" 
                        actionLabel="Open" 
                        href={workspace?.repositoryRecord?.repoUrl ?? undefined} 
                      />
                      <ActionRow 
                        title="HTTPS Clone" 
                        description="Clone via HTTPS" 
                        actionLabel={copiedActionKey === "copy-https-url" ? "Copied" : "Copy"} 
                        isCopied={copiedActionKey === "copy-https-url"}
                        onAction={() => void handleCopy("HTTPS URL", workspace?.repositoryRecord?.cloneUrlHttps, "copy-https-url")} 
                      />
                      <ActionRow 
                        title="SSH Clone" 
                        description="Clone via SSH" 
                        actionLabel={copiedActionKey === "copy-ssh-url" ? "Copied" : "Copy"} 
                        isCopied={copiedActionKey === "copy-ssh-url"}
                        onAction={() => void handleCopy("SSH URL", workspace?.repositoryRecord?.cloneUrlSsh, "copy-ssh-url")} 
                      />
                    </div>
                  </SectionCard>

                  {canSyncWorkspace && (
                    <SectionCard 
                      title="System sync" 
                      description="Trigger a fresh fetch from GitHub when needed."
                      className="border-border/50 bg-background/90 shadow-sm rounded-[28px]"
                    >
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Last synchronized {formatRelative(workspace?.repositoryRecord?.lastSyncAt)}. 
                          GPMS normally syncs automatically, but you can trigger it manually.
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full h-10 rounded-xl border-border/50 hover:bg-muted/50 transition-all" 
                          onClick={() => void handleSyncRepository()} 
                          disabled={busyAction === "sync"}
                        >
                          {busyAction === "sync" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                          Sync Now
                        </Button>
                      </div>
                    </SectionCard>
                  )}
                </div>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>

          <Dialog
            open={branchDialogOpen}
            onOpenChange={(open) => {
              setBranchDialogOpen(open)
              if (!open) setBranchDialogError("")
            }}
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create branch</DialogTitle>
                <DialogDescription>
                  Start a new working branch from an existing branch, or create an empty branch with no project files.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="Branch name">
                  <Input
                    value={branchForm.name}
                    onChange={(event) => {
                      setBranchDialogError("")
                      setBranchForm((current) => ({ ...current, name: event.target.value }))
                    }}
                    placeholder="feature/team-dashboard"
                    className="h-11 rounded-2xl"
                  />
                </Field>
                <Field label="Start from">
                  <Select
                    value={
                      branchForm.startEmpty
                        ? "__empty__"
                        : branchForm.fromBranch || selectedBranch || workspace?.repositoryRecord?.defaultBranch || ""
                    }
                    onValueChange={(value) => {
                      setBranchDialogError("")
                      if (value === "__empty__") {
                        setBranchForm((current) => ({
                          ...current,
                          startEmpty: true,
                          fromBranch: "",
                          confirmEmptyStart: false,
                        }))
                        return
                      }
                      setBranchForm((current) => ({
                        ...current,
                        startEmpty: false,
                        fromBranch: value,
                        confirmEmptyStart: false,
                      }))
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Choose base branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">Start from empty branch (no files)</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={`branch-base-${branch.name}`} value={branch.name}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Empty branch creates a clean branch with no repository files copied from other branches.
                  </p>
                  {branchForm.startEmpty ? (
                    <div className="space-y-2 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      <p>You are creating an empty branch. It starts with no project files and no copied branch history.</p>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-amber-300 accent-amber-600"
                          checked={branchForm.confirmEmptyStart}
                          onChange={(event) =>
                            setBranchForm((current) => ({ ...current, confirmEmptyStart: event.target.checked }))
                          }
                        />
                        I understand this branch starts empty.
                      </label>
                    </div>
                  ) : null}
                </Field>
              </div>
              {branchDialogError ? <InlineNotice tone="error" title="Couldn't create branch" message={branchDialogError} compact /> : null}
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setBranchDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void handleCreateBranch()}
                  disabled={
                    !branchForm.name.trim() ||
                    busyAction === "create-branch" ||
                    (branchForm.startEmpty && !branchForm.confirmEmptyStart)
                  }
                >
                  {busyAction === "create-branch" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitBranch className="mr-2 h-4 w-4" />}
                  Create Branch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={confirmationDialog.open} onOpenChange={(open) => (!open ? closeConfirmationDialog() : null)}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{confirmationDialog.title}</DialogTitle>
                <DialogDescription>{confirmationDialog.description}</DialogDescription>
              </DialogHeader>
              <div
                className={cn(
                  "rounded-[22px] border p-4",
                  confirmationDialog.tone === "danger"
                    ? "border-red-200/70 bg-red-50/80"
                    : "border-amber-200/70 bg-amber-50/80",
                )}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className={cn(
                      "mt-0.5 h-5 w-5 shrink-0",
                      confirmationDialog.tone === "danger" ? "text-red-700" : "text-amber-700",
                    )}
                  />
                  <div className="space-y-3">
                    <p
                      className={cn(
                        "text-sm leading-6",
                        confirmationDialog.tone === "danger" ? "text-red-900" : "text-amber-900",
                      )}
                    >
                      Review this change before you continue.
                    </p>
                    {confirmationDialog.notes.length ? (
                      <ul
                        className={cn(
                          "space-y-2 text-sm leading-6",
                          confirmationDialog.tone === "danger" ? "text-red-800" : "text-amber-800",
                        )}
                      >
                        {confirmationDialog.notes.map((note) => (
                          <li key={note} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-current" />
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
              {confirmationDialog.confirmationValues?.length ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    {confirmationDialog.confirmationLabel ?? "Type confirmation text"}
                  </Label>
                  {confirmationDialog.confirmationValues[0] ? (
                    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 font-mono text-xs text-foreground">
                      {confirmationDialog.confirmationValues[0]}
                    </div>
                  ) : null}
                  <Input
                    value={confirmationInputValue}
                    onChange={(event) => setConfirmationInputValue(event.target.value)}
                    placeholder={confirmationDialog.confirmationPlaceholder ?? ""}
                    className="h-11 rounded-xl"
                  />
                </div>
              ) : null}
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={closeConfirmationDialog}>
                  Cancel
                </Button>
                <Button
                  className={cn(
                    "w-full sm:w-auto",
                    confirmationDialog.tone === "danger" && "bg-red-600 text-white hover:bg-red-700",
                    confirmationDialog.tone === "warning" && "bg-amber-500 text-amber-950 hover:bg-amber-400",
                  )}
                  onClick={() => void runConfirmedAction()}
                  disabled={
                    !confirmationDialog.action ||
                    busyAction === confirmationDialog.busyKey ||
                    (confirmationDialog.confirmationValues?.length
                      ? !confirmationDialog.confirmationValues.some((value) =>
                          (confirmationDialog.confirmationCaseSensitive
                            ? value.trim()
                            : value.trim().toLowerCase()) ===
                          (confirmationDialog.confirmationCaseSensitive
                            ? confirmationInputValue.trim()
                            : confirmationInputValue.trim().toLowerCase()),
                        )
                      : false)
                  }
                >
                  {busyAction === confirmationDialog.busyKey ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : confirmationDialog.tone === "danger" ? (
                    <Trash2 className="mr-2 h-4 w-4" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  {confirmationDialog.confirmLabel}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={Boolean(branchToDelete)}
            onOpenChange={(open) => {
              if (!open) {
                setBranchToDelete(null)
                setBranchDeleteConfirmationText("")
              }
            }}
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Delete branch</DialogTitle>
                <DialogDescription>
                  This removes the branch from GitHub. Default and protected branches stay blocked for safety.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-[22px] border border-red-200 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                <p className="font-medium text-red-900 dark:text-red-200">{branchToDelete?.name ?? "Unknown branch"}</p>
                <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-200/80">
                  Make sure this branch is no longer needed before deleting it. The branch history will stay in GitHub commits and pull requests, but the branch name itself will be removed.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Type the branch name to confirm</Label>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 font-mono text-xs text-foreground">
                  {branchToDelete?.name ?? ""}
                </div>
                <Input
                  value={branchDeleteConfirmationText}
                  onChange={(event) => setBranchDeleteConfirmationText(event.target.value)}
                  placeholder={branchToDelete?.name ?? ""}
                  className="h-11 rounded-xl"
                />
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setBranchToDelete(null)}>
                  Cancel
                </Button>
                <Button
                  className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
                  onClick={() => void handleDeleteBranch()}
                  disabled={
                    !branchToDelete ||
                    busyAction === `delete-branch-${branchToDelete?.name ?? ""}` ||
                    branchDeleteConfirmationText.trim() !== (branchToDelete?.name ?? "")
                  }
                >
                  {busyAction === `delete-branch-${branchToDelete?.name ?? ""}` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Branch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={issueDialogOpen}
            onOpenChange={(open) => {
              setIssueDialogOpen(open)
              if (!open) {
                setEditingIssue(null)
                setIssueForm(initialIssueForm)
                setIssueDialogError("")
              }
            }}
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingIssue ? "Edit issue" : "Create issue"}</DialogTitle>
                <DialogDescription>
                  Capture real repository work items and keep GPMS task sync available for the connected repo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="Title">
                  <Input
                    value={issueForm.title}
                    onChange={(event) => setIssueForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Add role-based dashboard permissions"
                    className="h-11 rounded-2xl"
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    value={issueForm.body}
                    onChange={(event) => setIssueForm((current) => ({ ...current, body: event.target.value }))}
                    placeholder="Describe the engineering work, expected behavior, or bug details."
                    className="min-h-[140px] rounded-2xl"
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Assignees" hint="Comma-separated GitHub logins">
                    <Input
                      value={issueForm.assignees}
                      onChange={(event) => setIssueForm((current) => ({ ...current, assignees: event.target.value }))}
                      placeholder="omar, hassan"
                      className="h-11 rounded-2xl"
                    />
                  </Field>
                  <Field label="Labels" hint="Comma-separated labels">
                    <Input
                      value={issueForm.labels}
                      onChange={(event) => setIssueForm((current) => ({ ...current, labels: event.target.value }))}
                      placeholder="backend, urgent"
                      className="h-11 rounded-2xl"
                    />
                  </Field>
                </div>
              </div>

              {issueDialogError ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm leading-relaxed">{issueDialogError}</p>
                </div>
              ) : null}

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIssueDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void handleCreateOrUpdateIssue()}
                  disabled={!issueForm.title.trim() || busyAction === "save-issue"}
                >
                  {busyAction === "save-issue" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
                  {editingIssue ? "Save Issue" : "Create Issue"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog 
            open={pullRequestDialogOpen} 
            onOpenChange={(open) => {
              setPullRequestDialogOpen(open)
              if (!open) {
                setPullRequestForm(initialPullRequestForm)
                setPullRequestDialogError("")
              }
            }}
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Open pull request</DialogTitle>
                <DialogDescription>
                  Create a real GitHub pull request from the selected source branch and optional reviewers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="Title">
                  <Input
                    value={pullRequestForm.title}
                    onChange={(event) => setPullRequestForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Prepare GPMS GitHub workspace release"
                    className="h-11 rounded-2xl"
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    value={pullRequestForm.body}
                    onChange={(event) => setPullRequestForm((current) => ({ ...current, body: event.target.value }))}
                    placeholder="Summarize the change, review context, and any deployment notes."
                    className="min-h-[140px] rounded-2xl"
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Head branch">
                    <Select
                      value={pullRequestForm.head}
                      onValueChange={(value) => setPullRequestForm((current) => ({ ...current, head: value }))}
                    >
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder="Choose source branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={`pull-head-${branch.name}`} value={branch.name}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Base branch">
                    <Select
                      value={pullRequestForm.base}
                      onValueChange={(value) => setPullRequestForm((current) => ({ ...current, base: value }))}
                    >
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder="Choose destination branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={`pull-base-${branch.name}`} value={branch.name}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                  <Field label="Reviewers" hint="Comma-separated GitHub logins">
                    <Input
                      value={pullRequestForm.reviewers}
                      onChange={(event) =>
                        setPullRequestForm((current) => ({ ...current, reviewers: event.target.value }))
                      }
                      placeholder="doctor-reviewer"
                      className="h-11 rounded-2xl"
                    />
                  </Field>
                  <ToggleRow
                    title="Draft pull request"
                    description="Open it as draft first."
                    checked={pullRequestForm.draft}
                    onCheckedChange={(checked) => setPullRequestForm((current) => ({ ...current, draft: checked }))}
                  />
                  </div>
                </div>

                {pullRequestDialogError ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-sm leading-relaxed">{pullRequestDialogError}</p>
                  </div>
                ) : null}

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setPullRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void handleCreatePullRequest()}
                  disabled={
                    !pullRequestForm.title.trim() ||
                    !pullRequestForm.head ||
                    !pullRequestForm.base ||
                    busyAction === "create-pull-request"
                  }
                >
                  {busyAction === "create-pull-request" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GitPullRequest className="mr-2 h-4 w-4" />
                  )}
                  Create Pull Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={Boolean(reviewingPullRequest)}
            onOpenChange={(open) => {
              if (!open) {
                setReviewingPullRequest(null)
                setReviewForm({ event: "COMMENT", body: "" })
              }
            }}
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Review pull request</DialogTitle>
                <DialogDescription>
                  Submit a GitHub review from your connected account for the selected pull request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="Review action">
                  <Select
                    value={reviewForm.event}
                    onValueChange={(value: "APPROVE" | "REQUEST_CHANGES" | "COMMENT") =>
                      setReviewForm((current) => ({ ...current, event: value }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Choose review outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMMENT">Comment only</SelectItem>
                      <SelectItem value="APPROVE">Approve</SelectItem>
                      <SelectItem value="REQUEST_CHANGES">Request changes</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Review message">
                  <Textarea
                    value={reviewForm.body}
                    onChange={(event) => setReviewForm((current) => ({ ...current, body: event.target.value }))}
                    placeholder="Share review notes, required changes, or approval context."
                    className="min-h-[140px] rounded-2xl"
                  />
                </Field>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setReviewingPullRequest(null)}>
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void handleSubmitReview()}
                  disabled={!reviewingPullRequest || busyAction === "review-pull-request"}
                >
                  {busyAction === "review-pull-request" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  Submit Review
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={Boolean(mergeDialogPullRequest)} onOpenChange={(open) => (!open ? closeMergeDialog() : null)}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Merge pull request</DialogTitle>
                <DialogDescription>
                  Choose how you want to combine the changes from the source branch into the base branch.
                </DialogDescription>
              </DialogHeader>

              {mergeDialogPullRequest ? (
                <div className="space-y-5">
                  {mergeDialogGuidance ? (
                    <div
                      className={cn(
                        "rounded-2xl border p-3 text-sm",
                        mergeDialogGuidance.tone === "success" && "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100",
                        mergeDialogGuidance.tone === "warning" && "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100",
                        mergeDialogGuidance.tone === "danger" && "border-red-200 bg-red-50/80 text-red-900 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-100",
                        mergeDialogGuidance.tone === "muted" && "border-border/70 bg-muted/20 text-foreground/90",
                      )}
                    >
                      <p className="font-semibold">{mergeDialogGuidance.label}</p>
                      <p className="mt-1 leading-6">{mergeDialogGuidance.detail}</p>
                      {mergeDialogGuidance.tone === "danger" ? (
                        <div className="mt-2 rounded-xl border border-red-200/70 bg-red-50/80 p-3 text-[13px] dark:border-red-400/30 dark:bg-red-500/12">
                          <p className="font-semibold">How to unblock merge:</p>
                          <ul className="mt-1 space-y-1 list-disc pl-4">
                            <li>Resolve merge conflicts in GitHub or update the branch.</li>
                            <li>Ensure all required status checks pass.</li>
                            <li>Ask reviewers to approve if branch rules require approvals.</li>
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                    <p className="text-sm font-semibold text-foreground">{mergeDialogPullRequest.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      #{mergeDialogPullRequest.number} · {mergeDialogPullRequest.head} {"->"} {mergeDialogPullRequest.base}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-foreground/90">Merge method</Label>
                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={() => setMergeMethod("squash")}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all",
                          mergeMethod === "squash"
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/60 hover:border-border hover:bg-muted/5",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-bold text-foreground">Squash and merge</span>
                          {mergeMethod === "squash" && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          Combines all commits from this branch into a single commit on the base branch. 
                          <span className="ml-1 font-semibold text-primary/80">Recommended for a clean history.</span>
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMergeMethod("merge")}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all",
                          mergeMethod === "merge"
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/60 hover:border-border hover:bg-muted/5",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-bold text-foreground">Create a merge commit</span>
                          {mergeMethod === "merge" && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          All commits from this branch will be added to the base branch via a merge commit.
                          Preserves the full history of changes.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMergeMethod("rebase")}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all",
                          mergeMethod === "rebase"
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/60 hover:border-border hover:bg-muted/5",
                        )}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-bold text-foreground">Rebase and merge</span>
                          {mergeMethod === "rebase" && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          All commits from this branch will be re-applied onto the base branch individually.
                          No merge commit is created.
                        </p>
                      </button>
                    </div>
                  </div>

                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <Label className="text-sm font-bold text-foreground/90">Commit message</Label>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Optional</span>
                     </div>
                     <Textarea
                       value={mergeCommitMessage}
                       onChange={(event) => setMergeCommitMessage(event.target.value)}
                       placeholder="Leave empty to use the default message..."
                       className="min-h-[100px] rounded-2xl border-border/60 bg-muted/5 transition-all focus:bg-background"
                     />
                   </div>
                </div>
              ) : null}

              <DialogFooter>
                <Button variant="outline" className="w-full sm:w-auto" onClick={closeMergeDialog}>
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  onClick={() => void confirmMergePullRequest()}
                  disabled={
                    !mergeDialogPullRequest ||
                    !mergeDialogGuidance?.canMerge ||
                    busyAction === `merge-${mergeDialogPullRequest?.number ?? ""}`
                  }
                >
                  {busyAction === `merge-${mergeDialogPullRequest?.number ?? ""}` ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <GitMerge className="mr-2 h-4 w-4" />
                  )}
                  Confirm Merge
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog 
            open={releaseDialogOpen} 
            onOpenChange={(open) => {
              setReleaseDialogOpen(open)
              if (!open) {
                setReleaseForm(initialReleaseForm)
                setReleaseDialogError("")
              }
            }}
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create release</DialogTitle>
                <DialogDescription>
                  Publish a milestone-ready GitHub release and keep GPMS submissions in sync with the artifact history.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Tag name">
                    <Input
                      value={releaseForm.tagName}
                      onChange={(event) => {
                        setReleaseDialogError("")
                        setReleaseForm((current) => ({ ...current, tagName: event.target.value }))
                      }}
                      placeholder="v1.0.0"
                      className="h-11 rounded-2xl"
                    />
                  </Field>
                  <Field label="Release title">
                    <Input
                      value={releaseForm.name}
                      onChange={(event) => setReleaseForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Semester milestone release"
                      className="h-11 rounded-2xl"
                    />
                  </Field>
                </div>
                <Field label="Target branch or commit">
                  <Input
                    value={releaseForm.targetCommitish}
                    onChange={(event) =>
                      setReleaseForm((current) => ({ ...current, targetCommitish: event.target.value }))
                    }
                    placeholder={workspace?.repositoryRecord?.defaultBranch ?? "main"}
                    className="h-11 rounded-2xl"
                  />
                </Field>
                <Field label="Release notes">
                  <Textarea
                    value={releaseForm.body}
                    onChange={(event) => setReleaseForm((current) => ({ ...current, body: event.target.value }))}
                    placeholder="List the major changes, fixes, and submission-ready notes."
                    className="min-h-[140px] rounded-2xl"
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <ToggleRow
                    title="Draft release"
                    description="Keep it private until ready."
                    checked={releaseForm.draft}
                    onCheckedChange={(checked) => setReleaseForm((current) => ({ ...current, draft: checked }))}
                  />
                  <ToggleRow
                    title="Prerelease"
                    description="Mark it as a preview release."
                    checked={releaseForm.prerelease}
                    onCheckedChange={(checked) =>
                      setReleaseForm((current) => ({ ...current, prerelease: checked }))
                    }
                  />
                </div>
              </div>

              {releaseDialogError ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm leading-relaxed">{releaseDialogError}</p>
                </div>
              ) : null}

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setReleaseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void handleCreateRelease()}
                  disabled={!releaseForm.tagName.trim() || busyAction === "create-release"}
                >
                  {busyAction === "create-release" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="mr-2 h-4 w-4" />
                  )}
                  Create Release
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showCompareDetails} onOpenChange={setShowCompareDetails}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-4xl">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle>Comparison Details</DialogTitle>
                    <DialogDescription>
                      Review all changes between <span className="font-semibold text-foreground">{compareState.head}</span> and <span className="font-semibold text-foreground">{compareState.base}</span>.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {compareState.result && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border/50 bg-muted/5 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Ahead</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-600">{compareState.result.aheadBy}</p>
                      <p className="text-[10px] text-muted-foreground">New commits</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-muted/5 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Behind</p>
                      <p className="mt-1 text-2xl font-bold text-red-600">{compareState.result.behindBy}</p>
                      <p className="text-[10px] text-muted-foreground">Missing commits</p>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-muted/5 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Files</p>
                      <p className="mt-1 text-2xl font-bold text-primary">{compareState.result.files.length}</p>
                      <p className="text-[10px] text-muted-foreground">Modified files</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-foreground/90 px-1">Files Changed</h4>
                    <div className="grid gap-3">
                      {compareState.result.files.map((file) => (
                        <div key={file.filename} className="overflow-hidden rounded-2xl border border-border/40 bg-background shadow-sm">
                          <div className="flex items-center justify-between border-b border-border/40 bg-muted/5 px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileCode2 className="h-4 w-4 text-primary/60 shrink-0" />
                              <span className="truncate text-xs font-bold text-foreground/80">{file.filename}</span>
                              <Badge className={cn("rounded-full px-2 py-0 border-none shadow-none text-[9px] font-bold uppercase tracking-wider", getCommitChangeBadgeClass(file.status))}>
                                {file.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-mono font-bold">
                              <span className="text-emerald-600">+{file.additions}</span>
                              <span className="text-red-600">-{file.deletions}</span>
                            </div>
                          </div>
                          {file.patch ? (
                            <div className={cn("p-3 overflow-x-auto no-scrollbar text-[11px]", isDarkTheme ? "bg-slate-950/70" : "bg-slate-50")}>
                              <div className="min-w-full space-y-0.5 font-mono leading-5">
                                {file.patch.split("\n").map((line, index) => {
                                  const isAdded = line.startsWith("+") && !line.startsWith("+++")
                                  const isDeleted = line.startsWith("-") && !line.startsWith("---")
                                  const isHunk = line.startsWith("@@")
                                  return (
                                    <div 
                                      key={index} 
                                      className={cn(
                                        "px-2 whitespace-pre rounded",
                                        isAdded && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                                        isDeleted && "bg-red-500/15 text-red-700 dark:text-red-400",
                                        isHunk && "bg-primary/5 text-primary/60 italic"
                                      )}
                                    >
                                      {line}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-xs italic text-muted-foreground bg-muted/5">
                              No patch available for this file (it might be too large or binary).
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setShowCompareDetails(false)}>
                  Close
                </Button>
                {isTeamLeader && (compareState.result?.aheadBy ?? 0) > 0 && (
                  <Button
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setShowCompareDetails(false)
                      requestMergeBranch(compareState.base, compareState.head)
                    }}
                  >
                    <GitMerge className="mr-2 h-4 w-4" />
                    Merge branches
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={saveDialogOpen}
            onOpenChange={(open) => {
              setSaveDialogOpen(open)
              if (!open) setSaveDialogError("")
            }}
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Commit file changes</DialogTitle>
                <DialogDescription>
                  Save your code edits to the selected branch with a clear commit message.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field
                  label="Commit message"
                  description="A short, descriptive message explaining what this file adds to the repository."
                >
                  <Input
                    value={saveCommitMessage}
                    onChange={(event) => {
                      setSaveDialogError("")
                      setSaveCommitMessage(event.target.value)
                    }}
                    placeholder="Update GitHub workspace route guards"
                    className="h-11 rounded-2xl"
                  />
                </Field>
                <div className="rounded-[24px] border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                  Changes will be committed on <span className="font-medium text-foreground">{selectedBranch}</span>.
                </div>
              </div>
              {saveDialogError ? <InlineNotice tone="error" title="Couldn't save this file" message={saveDialogError} compact /> : null}
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void handleSaveEditedFile()}
                  disabled={!saveCommitMessage.trim() || busyAction === "save-code"}
                >
                  {busyAction === "save-code" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Commit to Branch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={uploadFolderDialogOpen}
            onOpenChange={(open) => {
              if (!open && isUploadInProgress) return
              setUploadFolderDialogOpen(open)
              if (!open) {
                setUploadFolderError("")
                setUploadProgress({ done: 0, total: 0 })
              }
            }}
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload local folder
                </DialogTitle>
                <DialogDescription>
                  Push a local folder into <span className="font-semibold text-foreground">{repositoryDisplayName}</span> as commits on a selected branch.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="rounded-[20px] border border-primary/10 bg-primary/3 p-4 text-sm">
                  <p className="font-semibold text-foreground">Upload rules</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                    <li>Only UTF-8 text files are accepted (binary files are skipped).</li>
                    <li>Max file size: 1MB per file.</li>
                    <li>No file count cap (files are batched automatically per commit).</li>
                    <li>Commits are automatically split every {MAX_FILES_PER_COMMIT} files.</li>
                    <li>Sensitive files and secret-like content are auto-blocked before upload.</li>
                  </ul>
                </div>

                <Field label="Target branch" description="The branch where uploaded files will be committed.">
                  <Select
                    value={uploadFolderBranch}
                    onValueChange={(value) => {
                      setUploadFolderError("")
                      setUploadFolderBranch(value)
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.name} value={branch.name}>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                            {branch.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Target path in repository" description="Leave empty to upload into repository root.">
                  <Input
                    value={uploadFolderBasePath}
                    onChange={(event) => {
                      setUploadFolderError("")
                      setUploadFolderBasePath(event.target.value)
                    }}
                    placeholder="src/features"
                    className="h-11 rounded-2xl"
                  />
                </Field>

                <Field label="Commit message" description="Used as the base message for commit batch parts.">
                  <Input
                    value={uploadFolderCommitMessage}
                    onChange={(event) => {
                      setUploadFolderError("")
                      setUploadFolderCommitMessage(event.target.value)
                    }}
                    placeholder="Upload initial feature folder"
                    className="h-11 rounded-2xl"
                  />
                </Field>
                <Field
                  label="Upload mode"
                  description="Create-only prevents accidental overwrites. Upsert updates existing files and creates missing files."
                >
                  <Select
                    value={uploadFolderMode}
                    onValueChange={(value: FolderUploadMode) => {
                      setUploadFolderError("")
                      setUploadFolderMode(value)
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Select upload mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">Create only (safer)</SelectItem>
                      <SelectItem value="upsert">Upsert (create + update)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-2xl border-dashed"
                  aria-label="Choose local folder for upload"
                  disabled={isUploadInProgress}
                  onClick={() => setUploadFolderPickerConfirmOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Folder
                </Button>
                <p className="text-xs text-muted-foreground">
                  The system folder picker may only show folders while choosing. After selection, the full file list appears below.
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/60 bg-muted/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ready files</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{uploadFolderEntries.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Skipped files</p>
                    <p className="mt-1 text-xl font-bold text-foreground">{uploadFolderRejectedEntries.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/10 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Commit parts</p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                      {uploadFolderEntries.length ? chunkArray(uploadFolderEntries, MAX_FILES_PER_COMMIT).length : 0}
                    </p>
                  </div>
                </div>

                {uploadProgress.total > 0 ? (
                  <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploading commit parts...</span>
                      <span>
                        {uploadProgress.done}/{uploadProgress.total}
                      </span>
                    </div>
                    <Progress value={(uploadProgress.done / uploadProgress.total) * 100} />
                  </div>
                ) : null}

                {uploadFolderEntries.length ? (
                  <div className="rounded-2xl border border-border/60">
                    <div className="border-b border-border/50 bg-muted/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Files to upload
                    </div>
                    <ScrollArea className="h-40">
                      <div className="space-y-1 p-2">
                        {uploadFolderEntries.map((entry) => (
                          <div key={entry.relativePath} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs">
                            <span className="truncate pr-3 text-foreground/90">{entry.relativePath}</span>
                            <span className="shrink-0 text-muted-foreground">{formatRepoSize(entry.size / 1024)}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : null}

                {uploadFolderRejectedEntries.length ? (
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                    <p className="font-semibold">Skipped files</p>
                    <ScrollArea className="mt-2 h-32">
                      <div className="space-y-1">
                        {uploadFolderRejectedEntries.map((entry) => (
                          <p key={`${entry.relativePath}-${entry.reason}`} className="leading-5">
                            <span className="font-medium">{entry.relativePath}</span>: {entry.reason}
                          </p>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : null}
                {uploadFolderEntries.length ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dry run summary</p>
                    <div className="mt-2 space-y-1 text-sm text-foreground/90">
                      <p>
                        {uploadFolderMode === "create"
                          ? "Will create new files only."
                          : "Will create missing files and update existing files."}
                      </p>
                      <p>{uploadFolderEntries.length} file(s) ready to commit in {Math.max(chunkArray(uploadFolderEntries, MAX_FILES_PER_COMMIT).length, 1)} part(s).</p>
                    </div>
                  </div>
                ) : null}
                {uploadFolderEntries.length > 0 &&
                !uploadFolderEntries.some((entry) => ["/.env", "/.env.example", "/.gitignore"].some((needle) => entry.relativePath.endsWith(needle))) ? (
                  <InlineNotice
                    tone="warning"
                    title="Important dotfiles may be missing"
                    message="We could not detect .env/.env.example/.gitignore in the selected files. If you expected them, check hidden files settings and select the folder again."
                    compact
                  />
                ) : null}
                {uploadResultCommitUrl ? (
                  <InlineNotice
                    tone="success"
                    title="Latest upload commit"
                    message="Open the latest commit generated by this upload."
                    actionLabel="View commit"
                    onAction={() => window.open(uploadResultCommitUrl, "_blank", "noopener,noreferrer")}
                    compact
                  />
                ) : null}
              </div>

              {uploadFolderError ? <InlineNotice tone="error" title="Couldn't upload this folder" message={uploadFolderError} compact /> : null}

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setUploadFolderDialogOpen(false)} disabled={isUploadInProgress}>
                  {isUploadInProgress ? "Uploading..." : "Cancel"}
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void handleUploadFolder()}
                  disabled={!uploadFolderEntries.length || isUploadInProgress}
                >
                  {isUploadInProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload Folder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={uploadFolderPickerConfirmOpen} onOpenChange={setUploadFolderPickerConfirmOpen}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Select local folder
                </DialogTitle>
                <DialogDescription>
                  You are about to choose a folder from your device. GPMS only reads files you confirm and uploads them to the selected GitHub branch.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-2xl border border-primary/20 bg-primary/6 p-4 text-sm">
                <p className="font-semibold text-foreground">Upload target</p>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <p>
                    Branch: <span className="font-medium text-foreground">{uploadFolderBranch || selectedBranch || defaultBranchName}</span>
                  </p>
                  <p>
                    Path: <span className="font-medium text-foreground">{uploadFolderBasePath.trim() ? uploadFolderBasePath.trim() : "/"}</span>
                  </p>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Note: the native folder picker may show only directories. Your files will be listed in GPMS after selection for review before upload.
                </p>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setUploadFolderPickerConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button className="w-full sm:w-auto" onClick={handleConfirmFolderPicker}>
                  Continue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={newFileDialogOpen}
            onOpenChange={(open) => {
              setNewFileDialogOpen(open)
              if (!open) setNewFileDialogError("")
            }}
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FilePlus2 className="h-5 w-5 text-primary" />
                  Create file
                </DialogTitle>
                <DialogDescription>
                  Adding a new file to{" "}
                  <span className="font-semibold text-foreground">{repositoryDisplayName}</span> on branch{" "}
                  <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px] font-medium">
                    <GitBranch className="mr-1 h-3 w-3" />
                    {newFileForm.branch || selectedBranch || defaultBranchName}
                  </Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="rounded-[20px] border border-primary/10 bg-primary/3 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <WandSparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">Pro tip: Creating folders</p>
                      <p className="leading-6 text-muted-foreground">
                        You can create new folders by including them in the path. For example, typing{" "}
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground">
                          src/utils/new-file.js
                        </code>{" "}
                        will create both the <code className="font-mono text-xs">src</code> and{" "}
                        <code className="font-mono text-xs">utils</code> folders if they do not exist.
                      </p>
                    </div>
                  </div>
                </div>

                <Field label="Target branch" description="The branch where the new file will be committed.">
                  <Select
                    value={newFileForm.branch}
                    onValueChange={(value) => {
                      setNewFileDialogError("")
                      setNewFileForm((current) => ({ ...current, branch: value }))
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-2xl">
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.name} value={branch.name}>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                            {branch.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="File path" description="The full path relative to the repository root.">
                  <Input
                    value={newFileForm.path}
                    onChange={(event) => handleNewFilePathChange(event.target.value)}
                    placeholder={currentPath ? `${currentPath}/README.md` : "docs/README.md"}
                    className="h-11 rounded-2xl"
                  />
                </Field>
                <Field
                  label="Commit message"
                  description="A short, descriptive message explaining what this file adds to the repository."
                >
                  <Input
                    value={newFileForm.message}
                    onChange={(event) => {
                      setNewFileDialogError("")
                      setNewFileForm((current) => ({ ...current, message: event.target.value }))
                    }}
                    placeholder="Create docs/README.md"
                    className="h-11 rounded-2xl"
                  />
                </Field>
                <Field label="File content">
                  <Textarea
                    value={newFileForm.content}
                    onChange={(event) => {
                      setNewFileDialogError("")
                      setNewFileForm((current) => ({ ...current, content: event.target.value }))
                    }}
                    placeholder="Start writing the file content here..."
                    className="min-h-[220px] rounded-2xl font-mono text-sm"
                  />
                </Field>
              </div>
              {newFileDialogError ? <InlineNotice tone="error" title="Couldn't create this file" message={newFileDialogError} compact /> : null}
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setNewFileDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void handleCreateFile()}
                  disabled={!newFileForm.path.trim() || !newFileForm.message.trim() || busyAction === "create-file"}
                >
                  {busyAction === "create-file" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FilePlus2 className="mr-2 h-4 w-4" />
                  )}
                  Create File
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Rename file</DialogTitle>
                <DialogDescription>
                  Move or rename the selected file and commit the new path on the current branch.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="New file path">
                  <Input
                    value={renameForm.nextPath}
                    onChange={(event) => setRenameForm((current) => ({ ...current, nextPath: event.target.value }))}
                    className="h-11 rounded-2xl"
                  />
                </Field>
                <Field label="Commit message">
                  <Input
                    value={renameForm.message}
                    onChange={(event) => setRenameForm((current) => ({ ...current, message: event.target.value }))}
                    className="h-11 rounded-2xl"
                  />
                </Field>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setRenameDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void handleRenameFile()}
                  disabled={!renameForm.nextPath.trim() || !renameForm.message.trim() || busyAction === "rename-file"}
                >
                  {busyAction === "rename-file" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                  Rename File
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={treeDeleteDialog.open}
            onOpenChange={(open) =>
              setTreeDeleteDialog((current) => ({ ...current, open }))
            }
          >
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{treeDeleteDialog.isDirectory ? "Delete folder" : "Delete file"}</DialogTitle>
                <DialogDescription>
                  {treeDeleteDialog.isDirectory
                    ? "This removes all files inside this folder from the selected branch."
                    : "This removes this file from the selected branch."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-[24px] border border-red-200 bg-red-50/50 p-4 text-sm text-red-900 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-200">
                  You are deleting <span className="font-medium">{treeDeleteDialog.path || "the selected item"}</span>.
                </div>
                <Field label="Commit message">
                  <Input
                    value={treeDeleteDialog.message}
                    onChange={(event) =>
                      setTreeDeleteDialog((current) => ({ ...current, message: event.target.value }))
                    }
                    className="h-11 rounded-2xl"
                    placeholder={treeDeleteDialog.isDirectory ? "Delete folder recursively" : "Delete file"}
                  />
                </Field>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setTreeDeleteDialog((current) => ({ ...current, open: false }))}>
                  Cancel
                </Button>
                <Button
                  className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
                  onClick={() => void handleConfirmTreeDelete()}
                  disabled={!treeDeleteDialog.message.trim() || busyAction === toPathBusyKey("delete-item", treeDeleteDialog.path)}
                >
                  {busyAction === toPathBusyKey("delete-item", treeDeleteDialog.path) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {treeDeleteDialog.isDirectory ? "Delete Folder" : "Delete File"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-[28px] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Delete file</DialogTitle>
                <DialogDescription>
                  This removes the file from the selected branch and records the action in GitHub history.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-[24px] border border-red-200 bg-red-50/50 p-4 text-sm text-red-900 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-200">
                  You are deleting <span className="font-medium">{selectedBlob?.path ?? "the selected file"}</span>.
                </div>
                <Field label="Commit message">
                  <Input
                    value={deleteCommitMessage}
                    onChange={(event) => setDeleteCommitMessage(event.target.value)}
                    className="h-11 rounded-2xl"
                  />
                </Field>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
                  onClick={() => void handleDeleteFile()}
                  disabled={!deleteCommitMessage.trim() || busyAction === "delete-file"}
                >
                  {busyAction === "delete-file" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete File
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </WorkspaceShell>
  )
}

function WorkspaceShell({
  title,
  subtitle,
  actions,
  children,
  variant = "hero",
}: {
  title: string
  subtitle: string
  actions?: ReactNode
  children: ReactNode
  variant?: "hero" | "compact" | "hidden"
}) {
  return (
    <div className={cn("pb-8", variant === "hidden" ? "space-y-0" : "space-y-6")}>
      {variant === "hero" ? (
        <Card className="overflow-hidden rounded-[32px] border border-border/70 bg-background shadow-[0_26px_80px_-56px_rgba(15,23,42,0.42)]">
          <CardContent className="flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-start lg:justify-between lg:p-8">
            <div className="max-w-3xl space-y-3">
              <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none hover:bg-primary/10">
                <Github className="mr-2 h-3.5 w-3.5" />
                Real Team Repository Workspace
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{subtitle}</p>
              </div>
            </div>
            {actions ? <div className="w-full lg:w-auto">{actions}</div> : null}
          </CardContent>
        </Card>
      ) : variant === "compact" ? (
        <div className="flex flex-col gap-4 rounded-[24px] border border-border/70 bg-background px-5 py-4 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.16)] sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>
            <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
          {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
        </div>
      ) : actions ? (
        <div className="flex justify-end">{actions}</div>
      ) : null}
      {children}
    </div>
  )
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-44 rounded-[32px] border border-border/60 bg-muted/30" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 rounded-[28px] border border-border/60 bg-muted/20" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="h-[360px] rounded-[28px] border border-border/60 bg-muted/20 sm:h-[420px] xl:h-[520px]" />
        <div className="h-[360px] rounded-[28px] border border-border/60 bg-muted/20 sm:h-[420px] xl:h-[520px]" />
      </div>
    </div>
  )
}

function NoTeamGitHubState({
  currentRole,
  teamOptions,
  teamOptionsLoading,
  teamOptionsSearch,
  onTeamOptionsSearchChange,
  canLoadMoreTeams,
  onLoadMoreTeams,
  onSelectTeam,
}: {
  currentRole: string
  teamOptions: ApiTeamSummary[]
  teamOptionsLoading: boolean
  teamOptionsSearch: string
  onTeamOptionsSearchChange: (value: string) => void
  canLoadMoreTeams: boolean
  onLoadMoreTeams: () => void
  onSelectTeam: (teamId: string) => void
}) {
  const isSupportRole = SUPPORT_ROLES.has(currentRole)
  const supportNeedsTeamState = currentRole === "doctor" || currentRole === "ta"

  return (
    <Card className="rounded-[32px] border border-border/70 bg-background shadow-[0_24px_70px_-48px_rgba(15,23,42,0.28)]">
      <CardContent className="space-y-8 p-6 sm:p-7 lg:p-8">
        <div className="max-w-3xl space-y-3">
          <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none hover:bg-primary/10">
            <FolderGit2 className="mr-2 h-3.5 w-3.5" />
            Team required first
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {isSupportRole ? "Choose a team to inspect its GitHub workspace" : "Create or join a team before opening GitHub"}
          </h2>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            {isSupportRole
              ? supportNeedsTeamState
                ? "GitHub is scoped to teams assigned to you. Pick one of your supervised teams first to load its connected repository, pull requests, releases, and code tree."
                : "GitHub is scoped to a real team workspace. Pick a team first to load its connected repository, pull requests, releases, and code tree."
              : "GPMS keeps one shared GitHub workspace per team. Once your team exists, the repository, code browser, issues, pull requests, and releases all become available here."}
          </p>
        </div>

        {isSupportRole ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Available teams
            </p>
            <Input
              value={teamOptionsSearch}
              onChange={(event) => onTeamOptionsSearchChange(event.target.value)}
              placeholder="Search teams by name"
              className="h-11 rounded-2xl"
            />
            {teamOptionsLoading ? (
              <div className="rounded-[24px] border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
                Loading team list...
              </div>
            ) : teamOptions.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {teamOptions.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => onSelectTeam(team.id)}
                    className="rounded-[24px] border border-border/70 bg-muted/15 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/[0.04]"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{team.name}</p>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                          {team.memberCount} members
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {team.bio || "No team bio added yet."}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptySection
                title="No teams available yet"
                description="Once teams exist in GPMS, you can open their connected GitHub workspaces from here."
                icon={<Users className="h-5 w-5" />}
              />
            )}
            {teamOptions.length > 0 && !supportNeedsTeamState ? (
              <Button variant="outline" onClick={onLoadMoreTeams} disabled={!canLoadMoreTeams || teamOptionsLoading}>
                {canLoadMoreTeams ? "Load more teams" : "All matching teams loaded"}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <SetupCard
              icon={<Users className="h-5 w-5 text-primary" />}
              title="One repo per team"
              description="GitHub becomes available when your team workspace exists and can own a shared repository."
            />
            <SetupCard
              icon={<GitPullRequest className="h-5 w-5 text-primary" />}
              title="Real collaboration"
              description="Issues, pull requests, releases, and code changes are all tied to your team instead of personal repos."
            />
            <SetupCard
              icon={<ShieldCheck className="h-5 w-5 text-primary" />}
              title="Academic oversight"
              description="Assigned doctors and TAs can review the same connected repository through the team workspace."
            />
          </div>
        )}

        {!isSupportRole ? (
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard/my-team">Go to My Team</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/teams">Browse Teams</Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function NoRepositoryState({
  workspace,
  currentRole,
  setupDialogError,
  setupDialogOpen,
  setSetupDialogOpen,
  setupMode,
  setSetupMode,
  createRepositoryForm,
  setCreateRepositoryForm,
  connectRepositoryForm,
  setConnectRepositoryForm,
  busyAction,
  workspaceLoading,
  onConnectGitHub,
  onInstallGitHubApp,
  onCheckInstallationStatus,
  onCreateRepository,
  onConnectRepository,
}: {
  workspace: ApiGitHubWorkspaceSummary
  currentRole: string
  setupDialogError: string
  setupDialogOpen: boolean
  setSetupDialogOpen: Dispatch<SetStateAction<boolean>>
  setupMode: RepositorySetupMode
  setSetupMode: Dispatch<SetStateAction<RepositorySetupMode>>
  createRepositoryForm: typeof initialCreateRepoForm
  setCreateRepositoryForm: Dispatch<SetStateAction<typeof initialCreateRepoForm>>
  connectRepositoryForm: typeof initialConnectRepoForm
  setConnectRepositoryForm: Dispatch<SetStateAction<typeof initialConnectRepoForm>>
  busyAction: string | null
  workspaceLoading: boolean
  onConnectGitHub: () => Promise<void>
  onInstallGitHubApp: () => Promise<void>
  onCheckInstallationStatus: () => Promise<void>
  onCreateRepository: () => Promise<void>
  onConnectRepository: () => Promise<void>
}) {
  const availableInstallations = workspace.availableInstallations ?? []
  const selectedCreateInstallation = availableInstallations.find(
    (installation) => installation.id === createRepositoryForm.installationId,
  )
  const selectedConnectInstallation = availableInstallations.find(
    (installation) => installation.id === connectRepositoryForm.installationId,
  )
  const installationReady = Boolean(
    availableInstallations.length || createRepositoryForm.installationId || connectRepositoryForm.installationId,
  )
  const installationStatusHint =
    availableInstallations.length > 0
      ? `${availableInstallations.length} installation${availableInstallations.length === 1 ? "" : "s"} found`
      : installationReady
        ? "Installation selected"
        : "Install required first"
  const canConfigureWorkspace =
    currentRole === "leader" || currentRole === "admin" || Boolean(workspace.permissions.canManageRepository)
  const isMemberRole = currentRole === "member"
  const teamLeader = workspace.team?.members?.find((member) => member.teamRole === "LEADER")
  const teamLeaderLabel = teamLeader?.user?.fullName || teamLeader?.user?.email || "your team leader"
  const personalConnectionReady = workspace.githubConnection.isConnected
  const createRepositoryReady = personalConnectionReady && installationReady
  const connectExistingReady = installationReady
  const setupReadyCount = Number(personalConnectionReady) + Number(installationReady)
  const nextSetupStep = !personalConnectionReady
    ? "Connect your personal GitHub account"
    : !installationReady
      ? "Install GPMS GitHub App"
      : "Open setup and choose create/connect"
  const templateModeEnabled =
    Boolean(createRepositoryForm.templateOwner.trim()) || Boolean(createRepositoryForm.templateRepo.trim())
  const connectedGitHubIdentity =
    workspace.githubConnection.login ?? workspace.githubConnection.displayName ?? "Not connected yet"
  const setupTeamName = workspace.team?.name ?? "Current team"
  const createOwnerLockedToInstallation =
    createRepositoryForm.ownerType === "USER" && Boolean(selectedCreateInstallation?.accountLogin)

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-6">
          <Card className="rounded-[32px] border border-border/70 bg-background shadow-[0_24px_70px_-48px_rgba(15,23,42,0.3)]">
            <CardContent className="space-y-6 p-6 sm:p-7 lg:p-8">
              <div className="max-w-3xl space-y-3">
                <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none hover:bg-primary/10">
                  <Github className="mr-2 h-3.5 w-3.5" />
                  GitHub setup
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {isMemberRole
                    ? `Repository setup is managed by ${teamLeaderLabel}`
                    : `Connect one shared repository for ${workspace.team?.name ?? "this team"}`}
                </h2>
                <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                  {isMemberRole
                    ? "A team leader must create or connect the shared GitHub repository first. Once it is connected, you can browse code, create branches, and contribute from this workspace."
                    : "This page links one real GitHub repository to your team. After setup, code, pull requests, issues, releases, and sync all happen here."}
                </p>
              </div>

              <div className="rounded-[24px] border border-border/70 bg-muted/15 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Setup progress</p>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                    {setupReadyCount}/2 requirements completed
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Personal account</p>
                    <p className="mt-1 text-sm font-semibold">{personalConnectionReady ? connectedGitHubIdentity : "Not connected"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {personalConnectionReady ? "Ready for create flow and author actions." : "Required for creating a repository and writing code from GPMS."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/85 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">GitHub App</p>
                    <p className="mt-1 text-sm font-semibold">{installationReady ? "Installed" : "Install needed"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {installationReady ? installationStatusHint : "Install GPMS GitHub App on the repo owner account or organization."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/7 px-4 py-3 text-sm text-foreground/90">
                  <span className="font-medium">Next step:</span>{" "}
                  {isMemberRole ? `Wait for ${teamLeaderLabel} to create or connect the team repository.` : nextSetupStep}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {canConfigureWorkspace ? (
                  <Button onClick={() => setSetupDialogOpen(true)}>
                    <Github className="mr-2 h-4 w-4" />
                    Open setup
                  </Button>
                ) : null}
                {!workspace.githubConnection.isConnected && canConfigureWorkspace ? (
                  <Button variant="outline" onClick={() => void onConnectGitHub()} disabled={busyAction === "connect-user"}>
                    {busyAction === "connect-user" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    Connect Personal GitHub
                  </Button>
                ) : null}
              </div>

              {!canConfigureWorkspace ? (
                <div className="rounded-[20px] border border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-semibold">Waiting for leader action</p>
                  <p className="mt-1 leading-6">
                    Repository setup is restricted to leaders/admins. Please wait for {teamLeaderLabel} to complete the connection.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={setupDialogOpen && canConfigureWorkspace} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] !max-w-none gap-0 overflow-y-auto overscroll-contain rounded-[30px] border border-border/70 bg-background p-0 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.42)] sm:w-[min(960px,calc(100vw-2rem))] sm:!max-w-[960px]">
          <Tabs
            value={setupMode}
            onValueChange={(value) => setSetupMode(value as RepositorySetupMode)}
            className="flex min-h-full flex-col gap-0"
          >
            <div className="flex-1">
              <div className="space-y-4 border-b border-border/70 px-5 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7">
                <DialogHeader className="space-y-3 pr-10 text-left">
                  <DialogTitle className="text-2xl tracking-tight">Repository setup</DialogTitle>
                  <DialogDescription className="max-w-3xl text-sm leading-6">
                    Finish the two requirements, then choose either create a new repository or connect an existing one.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap gap-2.5">
                  <MetaCard label="Team" value={setupTeamName} />
                  <MetaCard
                    label="GitHub"
                    value={workspace.githubConnection.isConnected ? connectedGitHubIdentity : "Not connected"}
                    hint={personalConnectionReady ? "Ready for create flow" : "Needed for create flow"}
                  />
                  <MetaCard
                    label="App"
                    value={installationReady ? "Installed" : "Install needed"}
                    hint={installationReady ? installationStatusHint : "Install required first"}
                  />
                </div>

                <div className="space-y-4 rounded-[24px] border border-border/70 bg-muted/20 p-4 sm:p-5">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Requirements first: connect your personal GitHub account and install GPMS GitHub App. After that, choose the setup mode below.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[20px] border border-border/60 bg-background/90 p-4">
                      <p className="text-sm font-medium text-foreground">Create repository mode</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {createRepositoryReady ? "Ready to create and connect a new team repository." : "Needs personal account + app installation."}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-border/60 bg-background/90 p-4">
                      <p className="text-sm font-medium text-foreground">Connect existing mode</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {connectExistingReady ? "Ready to connect an existing GitHub repository." : "Needs app installation first."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {!workspace.githubConnection.isConnected ? (
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => void onConnectGitHub()}
                        disabled={busyAction === "connect-user"}
                      >
                        {busyAction === "connect-user" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Link2 className="mr-2 h-4 w-4" />
                        )}
                        Connect Personal GitHub
                      </Button>
                    ) : null}
                    {!installationReady ? (
                      <>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => void onInstallGitHubApp()}
                          disabled={busyAction === "install-app"}
                        >
                          {busyAction === "install-app" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Bot className="mr-2 h-4 w-4" />
                          )}
                          Install GPMS GitHub App
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => void onCheckInstallationStatus()}
                          disabled={workspaceLoading}
                        >
                          {workspaceLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Check installation status
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Setup mode</p>
                  <TabsList className="grid h-auto w-full grid-cols-1 rounded-2xl bg-muted/30 p-1 sm:h-12 sm:max-w-md sm:grid-cols-2">
                    <TabsTrigger value="create" className="rounded-xl">
                      Create repository
                    </TabsTrigger>
                    <TabsTrigger value="connect" className="rounded-xl">
                      Connect existing
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-8 sm:py-7">
                <TabsContent value="create" className="mt-0">
                  <div className="space-y-6">
                    {!personalConnectionReady ? (
                      <div className="flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                        <div className="space-y-1">
                          <p className="font-medium">Create repository is locked until personal GitHub is connected.</p>
                          <p className="leading-6 text-amber-900/80">
                            You can still test the GitHub App installation right now by switching to `Connect existing`
                            after the app is installed.
                          </p>
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-6">
                    <SetupSection
                      title="GitHub access"
                      description="Choose the GitHub account or organization that should receive the new repository."
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label={availableInstallations.length > 0 ? "Installed account" : "Installation ID"}
                          hint="Required"
                          description={
                            availableInstallations.length > 0
                              ? "Choose the GitHub account or organization where the GPMS app is installed. GPMS will use the correct installation ID for you."
                              : "This is usually filled in for you right after a successful GPMS GitHub App installation."
                          }
                        >
                          {availableInstallations.length > 0 ? (
                            <Select
                              value={createRepositoryForm.installationId}
                              onValueChange={(value) => {
                                const selectedInstallation = availableInstallations.find(
                                  (installation) => installation.id === value,
                                )
                                setCreateRepositoryForm((current) => ({
                                  ...current,
                                  installationId: value,
                                  owner: selectedInstallation?.accountLogin ?? current.owner,
                                  ownerType: selectedInstallation?.accountType ?? current.ownerType,
                                }))
                              }}
                            >
                              <SelectTrigger className="h-11 rounded-2xl">
                                <SelectValue placeholder="Choose an installed GitHub account" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableInstallations.map((installation) => (
                                  <SelectItem key={installation.id} value={installation.id}>
                                    {(installation.accountLogin ?? "Unknown owner") + ` · #${installation.id}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={createRepositoryForm.installationId}
                              onChange={(event) =>
                                setCreateRepositoryForm((current) => ({ ...current, installationId: event.target.value }))
                              }
                              placeholder="GitHub App installation ID"
                              className="h-11 rounded-2xl"
                            />
                          )}
                        </Field>
                        <Field
                          label="Owner login"
                          hint="Required"
                          description={
                            createOwnerLockedToInstallation
                              ? "Personal repositories are created under the selected GitHub account. Switch Owner type to Organization if the repo should live inside a GitHub organization."
                              : "Enter the exact GitHub username or organization name that should own the new repository."
                          }
                        >
                          <Input
                            value={createRepositoryForm.owner}
                            onChange={(event) =>
                              setCreateRepositoryForm((current) => ({ ...current, owner: event.target.value }))
                            }
                            placeholder="team-org or owner account"
                            className="h-11 rounded-2xl"
                            disabled={createOwnerLockedToInstallation}
                          />
                        </Field>
                      </div>
                      {selectedCreateInstallation ? (
                        <p className="text-xs leading-5 text-muted-foreground">
                          Using installation #{selectedCreateInstallation.id} on{" "}
                          {selectedCreateInstallation.accountLogin ?? "the selected GitHub account"}.
                        </p>
                      ) : null}

                      <div className="grid gap-4 md:grid-cols-3">
                        <Field
                          label="Owner type"
                          description="Choose `Organization` only if the repository should live inside a GitHub organization."
                        >
                          <Select
                            value={createRepositoryForm.ownerType}
                            onValueChange={(value: "USER" | "ORGANIZATION") =>
                              setCreateRepositoryForm((current) => ({
                                ...current,
                                ownerType: value,
                                owner:
                                  value === "USER" && selectedCreateInstallation?.accountLogin
                                    ? selectedCreateInstallation.accountLogin
                                    : current.owner,
                              }))
                            }
                          >
                            <SelectTrigger className="h-11 rounded-2xl">
                              <SelectValue placeholder="Owner type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USER">User</SelectItem>
                              <SelectItem value="ORGANIZATION">Organization</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field
                          label="Visibility"
                          description="Most student teams should keep the repository private."
                        >
                          <Select
                            value={createRepositoryForm.visibility}
                            onValueChange={(value: ApiGitHubRepositoryVisibility) =>
                              setCreateRepositoryForm((current) => ({ ...current, visibility: value }))
                            }
                          >
                            <SelectTrigger className="h-11 rounded-2xl">
                              <SelectValue placeholder="Repository visibility" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRIVATE">Private</SelectItem>
                              <SelectItem value="PUBLIC">Public</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field
                          label="Default branch"
                          hint="Optional"
                          description="Most teams keep this as `main` unless you already follow a different branch naming rule."
                        >
                          <Input
                            value={createRepositoryForm.defaultBranch}
                            onChange={(event) =>
                              setCreateRepositoryForm((current) => ({ ...current, defaultBranch: event.target.value }))
                            }
                            placeholder="main"
                            className="h-11 rounded-2xl"
                          />
                        </Field>
                      </div>
                    </SetupSection>

                    <SetupSection
                      title="Repository details"
                      description="Pick a clear repository name, then set visibility and an optional description."
                    >
                      <Field
                        label="Repository name"
                        hint="Required"
                        description="Use a short slug like `gpms-team-alpha`. Only letters, numbers, `.`, `_`, and `-` are accepted."
                      >
                        <Input
                          value={createRepositoryForm.repoName}
                          onChange={(event) =>
                            setCreateRepositoryForm((current) => ({ ...current, repoName: event.target.value }))
                          }
                          placeholder="gpms-smart-campus"
                          className="h-11 rounded-2xl"
                        />
                      </Field>

                      <Field
                        label="Description"
                        hint="Optional"
                        description="Write one or two sentences about the project goal, scope, or product name."
                      >
                        <Textarea
                          value={createRepositoryForm.description}
                          onChange={(event) =>
                            setCreateRepositoryForm((current) => ({ ...current, description: event.target.value }))
                          }
                          placeholder="Describe the project codebase, scope, and primary goal."
                          className="min-h-[120px] rounded-2xl"
                        />
                      </Field>
                    </SetupSection>

                  </div>

                  </div>
                </TabsContent>

                <TabsContent value="connect" className="mt-0">
                  <div className="space-y-6">
                    {!installationReady ? (
                      <div className="flex items-start gap-3 rounded-[22px] border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-950">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                        <div className="space-y-1">
                          <p className="font-medium">Install the GPMS GitHub App first.</p>
                          <p className="leading-6 text-sky-900/80">
                            Once installation finishes, this dialog usually lists the installed GitHub account so you only
                            need the owner login and repository name.
                          </p>
                        </div>
                      </div>
                    ) : null}
                    <div className="space-y-6">
                      <SetupSection
                        title="Existing repository link"
                        description="Use this only for a repository that already exists and already has the GPMS GitHub App installed."
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field
                            label={availableInstallations.length > 0 ? "Installed account" : "Installation ID"}
                            hint="Required"
                            description={
                              availableInstallations.length > 0
                                ? "Choose the installed GitHub account or organization that already has the GPMS app."
                                : "Filled automatically after app installation, or paste it manually if you already know it."
                            }
                          >
                            {availableInstallations.length > 0 ? (
                              <Select
                                value={connectRepositoryForm.installationId}
                                onValueChange={(value) => {
                                  const selectedInstallation = availableInstallations.find(
                                    (installation) => installation.id === value,
                                  )
                                  setConnectRepositoryForm((current) => ({
                                    ...current,
                                    installationId: value,
                                    owner: selectedInstallation?.accountLogin ?? current.owner,
                                  }))
                                }}
                              >
                                <SelectTrigger className="h-11 rounded-2xl">
                                  <SelectValue placeholder="Choose an installed GitHub account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableInstallations.map((installation) => (
                                    <SelectItem key={installation.id} value={installation.id}>
                                      {(installation.accountLogin ?? "Unknown owner") + ` · #${installation.id}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={connectRepositoryForm.installationId}
                                onChange={(event) =>
                                  setConnectRepositoryForm((current) => ({
                                    ...current,
                                    installationId: event.target.value,
                                  }))
                                }
                                placeholder="GitHub App installation ID"
                                className="h-11 rounded-2xl"
                              />
                            )}
                          </Field>
                          <Field
                            label="Owner login"
                            hint="Required"
                            description="Use the exact GitHub username or organization slug that owns the existing repository."
                          >
                            <Input
                              value={connectRepositoryForm.owner}
                              onChange={(event) =>
                                setConnectRepositoryForm((current) => ({ ...current, owner: event.target.value }))
                              }
                              placeholder="team-org or owner account"
                              className="h-11 rounded-2xl"
                            />
                          </Field>
                        </div>

                        <Field
                          label="Repository name"
                          hint="Required"
                          description="Enter the exact existing GitHub repository name, for example `graduation-project-frontend`."
                        >
                          <Input
                            value={connectRepositoryForm.repoName}
                            onChange={(event) =>
                              setConnectRepositoryForm((current) => ({ ...current, repoName: event.target.value }))
                            }
                            placeholder="existing-gpms-repository"
                            className="h-11 rounded-2xl"
                          />
                        </Field>
                        {selectedConnectInstallation ? (
                          <p className="text-xs leading-5 text-muted-foreground">
                            Using installation #{selectedConnectInstallation.id} on{" "}
                            {selectedConnectInstallation.accountLogin ?? "the selected GitHub account"}.
                          </p>
                        ) : null}

                        <div className="rounded-[24px] border border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                          Use this mode only when the repository already exists on GitHub. GPMS will attach it to this team
                          and start syncing code, issues, pull requests, and releases from that repo.
                        </div>
                      </SetupSection>
                    </div>

                  </div>
                </TabsContent>
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 border-t border-border/70 bg-background/95 px-5 py-4 backdrop-blur sm:px-8">
              {setupDialogError ? (
                <div className="mr-auto flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-950 sm:w-auto sm:max-w-[540px]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="leading-6">{setupDialogError}</p>
                </div>
              ) : null}
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setSetupDialogOpen(false)}>
                Cancel
              </Button>
              {setupMode === "create" ? (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void onCreateRepository()}
                  disabled={
                    !personalConnectionReady ||
                    !createRepositoryForm.installationId ||
                    !createRepositoryForm.owner.trim() ||
                    !createRepositoryForm.repoName.trim() ||
                    busyAction === "create-repository"
                  }
                >
                  {busyAction === "create-repository" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Github className="mr-2 h-4 w-4" />
                  )}
                  Create and Connect
                </Button>
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => void onConnectRepository()}
                  disabled={
                    !connectRepositoryForm.installationId ||
                    !connectRepositoryForm.owner.trim() ||
                    !connectRepositoryForm.repoName.trim() ||
                    busyAction === "connect-repository"
                  }
                >
                  {busyAction === "connect-repository" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  Connect Repository
                </Button>
              )}
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SectionCard({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
  stackHeader = false,
}: {
  title: string
  description: string
  action?: ReactNode
  className?: string
  contentClassName?: string
  children: ReactNode
  stackHeader?: boolean
}) {
  return (
    <Card className={cn("rounded-[24px] border border-border/70 bg-background shadow-[0_18px_46px_-38px_rgba(15,23,42,0.16)]", className)}>
      <CardHeader className="space-y-3 p-5 sm:p-6">
        <div className={cn("flex flex-col gap-4", !stackHeader && "lg:flex-row lg:items-start lg:justify-between")}>
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-[1.15rem]">{title}</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          {action ? <div className={cn("w-full", !stackHeader && "lg:w-auto")}>{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("p-5 pt-0 sm:p-6 sm:pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  )
}

function CommitPaginationControls({
  pageStart,
  pageEnd,
  page,
  loading,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
  className,
}: {
  pageStart: number
  pageEnd: number
  page: number
  loading: boolean
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPrevious: () => void
  onNext: () => void
  className?: string
}) {
  return (
    <div className={cn("grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs text-muted-foreground">
          Showing {pageStart}-{pageEnd}
        </Badge>
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          <span>Page {page}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={!hasPreviousPage || loading} onClick={onPrevious}>
          Previous
        </Button>
        <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={!hasNextPage || loading} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  )
}

function InlineNotice({
  tone,
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
}: GitHubCallbackNotice & { compact?: boolean }) {
  const isError = tone === "error"
  const isWarning = tone === "warning"

  return (
    <div
      className={cn(
        "rounded-[22px] border px-4 py-3",
        compact ? "text-sm" : "text-sm shadow-[0_16px_36px_-32px_rgba(15,23,42,0.2)]",
        isError
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : isWarning
          ? "border-primary/20 bg-primary/5 text-primary"
          : "border-emerald-200/70 bg-emerald-50/80 text-emerald-900",
      )}
    >
      <div className="flex items-start gap-3">
        {isError ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        ) : isWarning ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        )}
        <div className="space-y-1">
          <p className="font-semibold leading-6">{title}</p>
          <p className={cn("leading-6", isError ? "text-destructive/80" : isWarning ? "text-primary/80" : "text-emerald-800")}>{message}</p>
          {actionLabel ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 h-8"
              onClick={onAction}
              disabled={!onAction}
            >
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  description,
  children,
}: {
  label: string
  hint?: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {description ? <p className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  )
}

function SetupSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-background shadow-[0_14px_36px_-30px_rgba(15,23,42,0.16)] p-5 sm:p-6">
      <div className="mb-5 space-y-1">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  )
}

function WorkspaceFact({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[20px] border border-border/70 bg-muted/6 px-4 py-3 shadow-[0_12px_32px_-32px_rgba(15,23,42,0.14)] transition-all duration-200 hover:border-primary/20 hover:bg-primary/4 hover:shadow-[0_18px_38px_-30px_rgba(15,23,42,0.2)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 wrap-break-word text-[15px] font-semibold tracking-tight text-foreground">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p> : null}
    </motion.div>
  )
}

function MetaCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="min-w-0 rounded-[18px] border border-border/70 bg-background px-4 py-3 shadow-[0_10px_24px_-24px_rgba(15,23,42,0.12)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function EmptySection({
  title,
  description,
  icon,
  compact = false,
}: {
  title: string
  description: string
  icon: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-dashed border-border/70 bg-muted/15 text-center",
        compact ? "px-5 py-7" : "px-6 py-12",
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  )
}

function SetupCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-muted/15 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/[0.03]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background shadow-sm">{icon}</div>
      <p className="mt-4 text-lg font-semibold tracking-tight">{title}</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[22px] border border-border/70 bg-muted/15 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-primary/4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="font-semibold tracking-tight text-foreground/95">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

function ActionRow({
  title,
  description,
  actionLabel,
  isCopied = false,
  onAction,
  href,
}: {
  title: string
  description: string
  actionLabel: string
  isCopied?: boolean
  onAction?: () => void
  href?: string
}) {
  return (
    <div className="rounded-[18px] border border-border/70 bg-muted/5 px-4 py-3.5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="font-medium tracking-tight">{title}</p>
          <p className="wrap-break-word text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
        {href ? (
          <Button className="w-full sm:w-auto" variant="ghost" size="sm" asChild>
            <a href={href} target="_blank" rel="noreferrer">
              {actionLabel}
            </a>
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" variant="ghost" size="sm" onClick={onAction}>
            {!href && (
              <motion.span
                key={isCopied ? "copied-action-row" : "copy-action-row"}
                initial={{ scale: 0.92, opacity: 0.85 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.16 }}
                className="mr-2 inline-flex"
              >
                {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </motion.span>
            )}
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}


