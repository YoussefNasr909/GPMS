export type ApiOk<T> = { ok: true; data: T }

export type ApiErrorBody = {
  ok: false
  code: string
  message: string
  stack?: string
}

export type Department =
  | "COMPUTER_SCIENCE"
  | "SOFTWARE_ENGINEERING"
  | "INFORMATION_TECHNOLOGY"
  | "COMPUTER_ENGINEERING"
  | "DATA_SCIENCE"
  | "ARTIFICIAL_INTELLIGENCE"
  | "CYBERSECURITY_INFOSEC"
  | "INFORMATION_SYSTEMS"
  | "BIOINFORMATICS"

export type AcademicYear = "YEAR_1" | "YEAR_2" | "YEAR_3" | "YEAR_4" | "YEAR_5"

export type Track =
  | "FRONTEND_DEVELOPMENT"
  | "BACKEND_DEVELOPMENT"
  | "FULLSTACK_DEVELOPMENT"
  | "MOBILE_APP_DEVELOPMENT"
  | "DEVOPS"
  | "CLOUD_ENGINEERING"
  | "SOFTWARE_ARCHITECTURE"
  | "QUALITY_ASSURANCE"
  | "GAME_DEVELOPMENT"

export type Role = "STUDENT" | "LEADER" | "TA" | "DOCTOR" | "ADMIN"

export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

export type ApiUser = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  role: Role
  accountStatus: AccountStatus
  academicId: string | null
  department: Department | null
  academicYear: AcademicYear | null
  preferredTrack: Track | null
  avatarUrl: string | null
  bio: string | null
  linkedinUrl: string | null
  githubUsername: string | null
  googleId: string | null
  githubId: string | null
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

export type ApiTeamVisibility = "PUBLIC" | "PRIVATE"

export type ApiTeamStage =
  | "REQUIREMENTS"
  | "DESIGN"
  | "IMPLEMENTATION"
  | "TESTING"
  | "DEPLOYMENT"
  | "MAINTENANCE"

export type ApiTeamInvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED"

export type ApiTeamJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"

export type ApiSupervisorRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED"

export type ApiSupervisorRole = "DOCTOR" | "TA"

export type ApiTeamRole = "LEADER" | "MEMBER"

export type ApiTeamUser = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: Role
  accountStatus: AccountStatus
  academicId: string | null
  department: Department | null
  academicYear: AcademicYear | null
  preferredTrack: Track | null
  avatarUrl: string | null
  bio: string | null
  linkedinUrl: string | null
  githubUsername: string | null
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

export type ApiTeamSummary = {
  id: string
  name: string
  bio: string
  inviteCode: string | null
  maxMembers: number
  memberCount: number
  slotsRemaining: number
  visibility: ApiTeamVisibility
  allowJoinRequests: boolean
  stage: ApiTeamStage
  stack: string[]
  isFull: boolean
  isJoinable: boolean
  hasPendingInvitation: boolean
  hasPendingRequest: boolean
  isMember: boolean
  canManage: boolean
  leader: ApiTeamUser
  doctor: ApiTeamUser | null
  ta: ApiTeamUser | null
  createdAt: string
  updatedAt: string
}

export type ApiTeamMember = {
  id: string
  joinedAt: string
  teamRole: ApiTeamRole
  user: ApiTeamUser
}

export type ApiTeamDetail = ApiTeamSummary & {
  members: ApiTeamMember[]
  permissions: {
    canManage: boolean
    canLeave: boolean
    canJoinByCode: boolean
    canRequestToJoin: boolean
    canInviteMembers: boolean
    canRemoveMembers: boolean
  }
}

export type ApiTeamInvitation = {
  id: string
  status: ApiTeamInvitationStatus
  createdAt: string
  updatedAt: string
  team: ApiTeamSummary
  invitedUser: ApiTeamUser
  invitedBy: ApiTeamUser
}

export type ApiTeamJoinRequest = {
  id: string
  message: string | null
  status: ApiTeamJoinRequestStatus
  createdAt: string
  updatedAt: string
  team: ApiTeamSummary
  user: ApiTeamUser
}

export type ApiSupervisorRequest = {
  id: string
  supervisorRole: ApiSupervisorRole
  projectName: string
  projectDescription: string
  technologies: string[]
  status: ApiSupervisorRequestStatus
  respondedAt: string | null
  createdAt: string
  updatedAt: string
  team: ApiTeamSummary
  supervisor: ApiTeamUser
  requestedBy: ApiTeamUser
}

export type ApiMyTeamState = {
  teamRole: ApiTeamRole | null
  team: ApiTeamDetail | null
  receivedInvitations: ApiTeamInvitation[]
  sentInvitations: ApiTeamInvitation[]
  joinRequests: ApiTeamJoinRequest[]
  myJoinRequests: ApiTeamJoinRequest[]
  supervisorRequestsSent: ApiSupervisorRequest[]
  supervisorRequestsReceived: ApiSupervisorRequest[]
  supervisedTeams: ApiTeamSummary[]
}

export type ApiTaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "APPROVED" | "DONE"

export type ApiTaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export type ApiTaskType = "CODE" | "DOCUMENTATION" | "DESIGN" | "RESEARCH" | "MEETING" | "PRESENTATION" | "OTHER"

export type ApiTaskIntegrationMode = "MANUAL" | "GITHUB"

export type ApiTaskOrigin = "GPMS" | "GITHUB_IMPORT"

export type ApiTaskReviewDecision = "APPROVED" | "CHANGES_REQUESTED"

export type ApiTaskGitHubReviewGate = {
  ready: boolean
  hasIssue: boolean
  hasBranch: boolean
  hasOpenPullRequest: boolean
  hasCommits: boolean
  missing: string[]
}

export type ApiTaskGitHubState = {
  repository: {
    id: string
    fullName: string
    repoUrl: string
    defaultBranch: string
    connectionStatus: ApiGitHubRepositoryConnectionStatus
  } | null
  issue: {
    id: string | null
    number: number | null
    url: string | null
    state: string | null
  }
  branch: {
    name: string | null
    url: string | null
    compareUrl: string | null
    suggestedName: string | null
  }
  pullRequest: {
    id: string | null
    number: number | null
    url: string | null
    htmlUrl?: string | null
    state: string | null
    base: string | null
    head: string | null
    mergedAt: string | null
  }
  latestCommit: {
    sha: string | null
    shortSha: string | null
    url: string | null
  }
  commitCount: number
  lastSyncedAt: string | null
  reviewGate: ApiTaskGitHubReviewGate | null
}

export type ApiTask = {
  id: string
  team: {
    id: string
    name: string
  }
  taskType: ApiTaskType
  integrationMode: ApiTaskIntegrationMode
  origin: ApiTaskOrigin
  title: string
  description: string
  status: ApiTaskStatus
  rawStatus: string
  priority: ApiTaskPriority
  startDate: string | null
  endDate: string | null
  acceptedAt: string | null
  submittedForReviewAt: string | null
  reviewedAt: string | null
  reviewFeedback: string | null
  reviewComment: string | null
  reviewDecision: ApiTaskReviewDecision | null
  reviewSnapshot: Record<string, unknown> | null
  syncedFromGithub: boolean
  githubIssueNumber: number | null
  githubIssueUrl: string | null
  labels: string[]
  createdAt: string
  updatedAt: string
  assignee: ApiTeamUser | null
  createdBy: ApiTeamUser | null
  reviewedBy: ApiTeamUser | null
  awaitingAcceptance: boolean
  isPastEndDate: boolean
  github: ApiTaskGitHubState | null
  permissions: {
    canAccept: boolean
    canSubmitForReview: boolean
    canApprove: boolean
    canReject: boolean
    canEdit: boolean
    canBootstrapGithub: boolean
    canOpenPullRequest: boolean
    canResyncGithub: boolean
  }
}

export type ApiCurrentTeamSummary = {
  id: string
  name: string
  bio: string
  stage: ApiTeamStage
  visibility: ApiTeamVisibility
  memberCount: number
  teamRole: ApiTeamRole
  joinedAt: string | null
}

export type ApiDirectoryUser = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: Role
  academicId: string | null
  department: Department | null
  academicYear: AcademicYear | null
  preferredTrack: Track | null
  avatarUrl: string | null
  bio: string | null
  linkedinUrl: string | null
  githubUsername: string | null
  currentTeam: ApiCurrentTeamSummary | null
  createdAt: string
  updatedAt: string
}

export type ApiPublicUserProfile = ApiDirectoryUser

export type ApiGitHubOwnerType = "USER" | "ORGANIZATION"

export type ApiGitHubRepositoryVisibility = "PUBLIC" | "PRIVATE" | "INTERNAL"

export type ApiGitHubRepositoryConnectionStatus = "PENDING" | "ACTIVE" | "DISCONNECTED" | "ERROR"

export type ApiGitHubSyncStatus = "IDLE" | "SYNCING" | "ERROR"

export type ApiGitHubWorkspaceTeamSummary = {
  id: string
  name: string
  bio: string
  stage: ApiTeamStage
  visibility: ApiTeamVisibility
  memberCount: number
  leader: ApiTeamUser | null
  doctor: ApiTeamUser | null
  ta: ApiTeamUser | null
  members: Array<{
    id: string
    teamRole: ApiTeamRole
    joinedAt: string
    user: ApiTeamUser | null
  }>
}

export type ApiGitHubConnectionState = {
  isConnected: boolean
  login: string | null
  displayName: string | null
  avatarUrl: string | null
  scopes: string[]
  expiresAt: string | null
  repositoryAccess: ApiGitHubConnectedRepositoryAccess | null
}

export type ApiGitHubConnectedRepositoryAccessStatus =
  | "NOT_CONNECTED"
  | "OWNER"
  | "ADMIN"
  | "WRITE"
  | "READ_ONLY"
  | "NO_ACCESS"
  | "UNKNOWN"

export type ApiGitHubConnectedRepositoryAccess = {
  login: string | null
  status: ApiGitHubConnectedRepositoryAccessStatus
  permission: string | null
  roleName: string | null
  hasWriteAccess: boolean
  hasAdminAccess: boolean
}

export type ApiGitHubInstallation = {
  id: string
  accountLogin: string | null
  accountType: ApiGitHubOwnerType
  repositorySelection: string | null
  appSlug: string | null
}

export type ApiGitHubSyncSettings = {
  syncIssuesToTasks: boolean
  syncActivityToWeeklyReports: boolean
  syncReleasesToSubmissions: boolean
}

export type ApiGitHubRepositoryRecord = {
  id: string
  teamId: string
  ownerLogin: string
  ownerType: ApiGitHubOwnerType
  repoName: string
  fullName: string
  installationId: string | null
  defaultBranch: string
  visibility: ApiGitHubRepositoryVisibility
  repoUrl: string
  cloneUrlHttps: string | null
  cloneUrlSsh: string | null
  connectionStatus: ApiGitHubRepositoryConnectionStatus
  syncStatus: ApiGitHubSyncStatus
  lastSyncAt: string | null
  lastWebhookAt: string | null
  syncSettings: ApiGitHubSyncSettings
  createdAt: string
  updatedAt: string
}

export type ApiGitHubRepository = {
  id: number
  name: string
  fullName: string
  owner: {
    login: string | null
    avatarUrl: string | null
    type: string | null
  }
  description: string
  url: string
  defaultBranch: string
  visibility: ApiGitHubRepositoryVisibility
  stars: number
  forks: number
  watchers: number
  openIssues: number
  language: string | null
  topics: string[]
  size: number
  createdAt: string | null
  updatedAt: string | null
  pushedAt: string | null
}

export type ApiGitHubContributor = {
  id: string
  login: string
  avatarUrl: string | null
  profileUrl: string | null
  contributions: number
}

export type ApiGitHubRepositoryCollaborator = {
  id: string
  login: string
  avatarUrl: string | null
  profileUrl: string | null
  roleName: string | null
  permission: string | null
  hasWriteAccess: boolean
  hasAdminAccess: boolean
  isOwner: boolean
}

export type ApiGitHubRepositoryInvitation = {
  id: string
  inviteeLogin: string | null
  inviteeEmail: string | null
  avatarUrl: string | null
  profileUrl: string | null
  inviterLogin: string | null
  permission: string | null
  createdAt: string | null
}

export type ApiGitHubRepositoryAccessState = {
  collaborators: ApiGitHubRepositoryCollaborator[]
  invitations: ApiGitHubRepositoryInvitation[]
}

export type ApiGitHubPermissionMatrix = {
  canManageRepository: boolean
  canWriteCode: boolean
  canManageIssues: boolean
  canManagePullRequests: boolean
  canDisconnectRepository: boolean
  canSync: boolean
  canReadAsSupervisor: boolean
}

export type ApiGitHubWorkspaceSummary = {
  team: ApiGitHubWorkspaceTeamSummary | null
  repository: ApiGitHubRepository | null
  repositoryRecord: ApiGitHubRepositoryRecord | null
  githubConnection: ApiGitHubConnectionState
  availableInstallations: ApiGitHubInstallation[]
  permissions: ApiGitHubPermissionMatrix
  setup: {
    needsTeam: boolean
    needsRepositoryConnection: boolean
  }
  stats?: {
    openPullRequests: number
    topContributors: ApiGitHubContributor[]
  } | null
}

export type ApiResourceType = "file" | "video" | "link" | "github"
export type ApiResourceCategory = "documentation" | "tutorial" | "code" | "template" | "other"

export type ApiResource = {
  id: string
  title: string
  description: string
  category: ApiResourceCategory
  type: ApiResourceType
  authorName: string
  uploadedAt: string
  url: string
  tags: string[]
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export type ApiDocument = {
  id: string
  title: string
  description: string
  category: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
  tags: string[]
  teamId: string
  teamName: string
  uploadedByName: string
  uploadedByUserId: string
  uploadedAt: string
  createdAt: string
  updatedAt: string
}

export type ApiGitHubTreeNode = {
  name: string
  path: string
  type: "dir" | "file" | "symlink" | "submodule"
  size: number | null
  sha: string | null
  url: string | null
  downloadUrl: string | null
}

export type ApiGitHubTree = {
  ref: string
  path: string
  items: ApiGitHubTreeNode[]
}

export type ApiGitHubBlob = {
  path: string
  name: string
  sha: string
  size: number
  downloadUrl: string | null
  htmlUrl: string | null
  ref: string
  isLarge: boolean
  readOnly: boolean
  content: string | null
}

export type ApiGitHubCommit = {
  sha: string
  htmlUrl: string | null
  message: string
  author: {
    name: string
    login: string | null
    avatarUrl: string | null
    date: string | null
  }
  committer: {
    name: string
    login: string | null
    avatarUrl: string | null
    date: string | null
  }
}

export type ApiGitHubCommitDetail = ApiGitHubCommit & {
  stats: {
    total: number
    additions: number
    deletions: number
  }
  files: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    changes: number
    blobUrl: string | null
    patch: string | null
  }>
}

export type ApiGitHubCommitPage = {
  items: ApiGitHubCommit[]
  page: number
  perPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type ApiGitHubBranch = {
  name: string
  protected: boolean
  commitSha: string | null
  commitUrl: string | null
}

export type ApiGitHubLabel = {
  name: string
  color: string | null
}

export type ApiGitHubIssue = {
  id: string
  number: number
  title: string
  body: string
  state: string
  htmlUrl: string
  comments: number
  createdAt: string
  updatedAt: string
  closedAt: string | null
  author: {
    login: string | null
    avatarUrl: string | null
  }
  assignees: Array<{
    login: string
    avatarUrl: string | null
  }>
  labels: ApiGitHubLabel[]
  linkedTask: {
    id: string
    githubIssueNumber: number | null
    status: string
    priority: string
  } | null
}

export type ApiGitHubPullRequest = {
  id: string
  number: number
  title: string
  body: string
  state: string
  draft: boolean
  merged: boolean
  mergeable: boolean | null
  htmlUrl: string
  base: string | null
  head: string | null
  author: {
    login: string | null
    avatarUrl: string | null
  }
  labels: ApiGitHubLabel[]
  requestedReviewers: Array<{
    login: string
    avatarUrl: string | null
  }>
  comments: number
  reviewComments: number
  commits: number
  additions: number
  deletions: number
  changedFiles: number
  createdAt: string
  updatedAt: string
  closedAt: string | null
  mergedAt: string | null
}

export type ApiGitHubWorkflowRun = {
  id: string
  name: string
  status: string | null
  conclusion: string | null
  htmlUrl: string
  event: string | null
  branch: string | null
  commitSha: string | null
  createdAt: string
  updatedAt: string
  actor: {
    login: string | null
    avatarUrl: string | null
  }
}

export type ApiGitHubRelease = {
  id: string
  tagName: string
  name: string
  body: string
  htmlUrl: string
  tarballUrl: string | null
  zipballUrl: string | null
  draft: boolean
  prerelease: boolean
  publishedAt: string | null
  createdAt: string
  author: {
    login: string | null
    avatarUrl: string | null
  }
}

export type ApiGitHubCompare = {
  status: string
  aheadBy: number
  behindBy: number
  totalCommits: number
  htmlUrl: string
  commits: ApiGitHubCommit[]
  files: Array<{
    filename: string
    status: string
    additions: number
    deletions: number
    changes: number
    blobUrl: string | null
    patch: string | null
  }>
}

export type ApiGitHubWorkflowLogs = {
  runId: number
  logsUrl: string | null
  status: number
}

export type ApiGitHubCommitResult = {
  ref: string
  commitSha: string
  branchProtected: boolean
  compareUrl: string | null
}

export type UsersSummary = {
  totalUsers: number
  byRole: {
    students: number
    leaders: number
    doctors: number
    tas: number
    admins: number
  }
  byStatus: {
    active: number
    inactive: number
    suspended: number
  }
  unverified: number
}

export type AuthResponse = {
  token: string
  user: ApiUser
}

export type RegisterResponse = AuthResponse & {
  emailSent: boolean
}

export type Paginated<T> = {
  meta: { page: number; limit: number; total: number; totalPages: number }
  items: T[]
}

export type ApiDiscussionCategory = "technical" | "team" | "resources" | "general"

export type ApiDiscussionAuthor = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  avatarUrl: string | null
  role: Role
  roleLabel: string
}

export type ApiDiscussionComment = {
  id: string
  content: string
  parentCommentId: string | null
  replyCount: number
  replies: ApiDiscussionComment[]
  createdAt: string
  updatedAt: string
  author: ApiDiscussionAuthor
}

export type ApiDiscussionSummary = {
  id: string
  title: string
  content: string
  category: ApiDiscussionCategory
  tags: string[]
  likeCount: number
  viewCount: number
  commentCount: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
  author: ApiDiscussionAuthor
  viewerHasLiked: boolean
  viewerHasViewed: boolean
}

export type ApiDiscussionDetail = ApiDiscussionSummary & {
  comments: ApiDiscussionComment[]
}

export type ApiDiscussionStats = {
  totalDiscussions: number
  activeToday: number
  yourPosts: number
  replies: number
}

export type ApiDiscussionPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type ApiDiscussionFeed = {
  items: ApiDiscussionSummary[]
  stats: ApiDiscussionStats
  meta: ApiDiscussionPagination
}

