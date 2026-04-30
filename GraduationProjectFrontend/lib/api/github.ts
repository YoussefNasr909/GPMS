import { apiRequest } from "./http"
import type {
  ApiGitHubBlob,
  ApiGitHubBranch,
  ApiGitHubCommitDetail,
  ApiGitHubCommitPage,
  ApiGitHubCommitResult,
  ApiGitHubCompare,
  ApiGitHubConnectionState,
  ApiGitHubContributor,
  ApiGitHubIssue,
  ApiGitHubPullRequest,
  ApiGitHubRelease,
  ApiGitHubRepository,
  ApiGitHubRepositoryAccessState,
  ApiGitHubRepositoryRecord,
  ApiGitHubRepositoryVisibility,
  ApiGitHubTree,
  ApiGitHubWorkflowLogs,
  ApiGitHubWorkflowRun,
  ApiGitHubWorkspaceSummary,
} from "./types"

type TeamScopedParams = {
  teamId?: string | null
}

type RepositoryQueryParams = TeamScopedParams & {
  ref?: string
  path?: string
  page?: number
  perPage?: number
  state?: string
  q?: string
  branch?: string
  base?: string
  head?: string
}

type CreateRepositoryPayload = {
  teamId?: string
  installationId: string | number
  owner: string
  ownerType?: "USER" | "ORGANIZATION"
  repoName: string
  description?: string
  visibility?: "PUBLIC" | "PRIVATE" | "INTERNAL"
  defaultBranch?: string
  templateOwner?: string
  templateRepo?: string
}

type ConnectRepositoryPayload = {
  teamId?: string
  installationId: string | number
  owner: string
  repoName: string
}

type DeleteRepositoryPermanentlyPayload = {
  teamId?: string
  confirmationText: string
}

type DisconnectRepositoryPayload = {
  teamId?: string
  confirmationText: string
}

type UpdateWorkspaceSettingsPayload = {
  teamId?: string
  defaultBranch?: string
  visibility?: Extract<ApiGitHubRepositoryVisibility, "PUBLIC" | "PRIVATE">
  confirmationText?: string
  syncSettings?: {
    syncIssuesToTasks?: boolean
    syncActivityToWeeklyReports?: boolean
    syncReleasesToSubmissions?: boolean
  }
}

type InviteCollaboratorPayload = {
  teamId?: string
  login: string
  permission?: "pull" | "triage" | "push" | "maintain" | "admin"
}

type CommitFileChange = {
  action: "create" | "update" | "delete" | "rename"
  path: string
  previousPath?: string
  content?: string
}

type SaveRepositoryChangesPayload = {
  teamId?: string
  branch: string
  expectedHeadSha?: string
  message: string
  changes: CommitFileChange[]
}

type CreateBranchPayload = {
  teamId?: string
  name: string
  fromBranch?: string
  fromSha?: string
  startEmpty?: boolean
}

type MergeBranchPayload = {
  teamId?: string
  base: string
  head: string
  commitMessage?: string
}

type CreateIssuePayload = {
  teamId?: string
  title: string
  body?: string
  assignees?: string[]
  labels?: string[]
}

type UpdateIssuePayload = {
  teamId?: string
  title?: string
  body?: string
  state?: "open" | "closed"
  assignees?: string[]
  labels?: string[]
}

type CreatePullRequestPayload = {
  teamId?: string
  title: string
  body?: string
  head: string
  base: string
  draft?: boolean
  reviewerLogins?: string[]
}

type ReviewPullRequestPayload = {
  teamId?: string
  body?: string
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT"
}

type MergePullRequestPayload = {
  teamId?: string
  commitTitle?: string
  commitMessage?: string
  mergeMethod?: "merge" | "squash" | "rebase"
}

type CreateReleasePayload = {
  teamId?: string
  tagName: string
  targetCommitish?: string
  name?: string
  body?: string
  draft?: boolean
  prerelease?: boolean
}

function buildQuery(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    search.set(key, String(value))
  }

  const query = search.toString()
  return query ? `?${query}` : ""
}

export const githubApi = {
  getConnectionState: () => apiRequest<ApiGitHubConnectionState>("/github/user/connection"),
  getUserConnectUrl: (teamId?: string | null) =>
    apiRequest<{ url: string }>(`/github/user/connect-url${buildQuery({ teamId })}`),
  disconnectUserConnection: () =>
    apiRequest<{ disconnected: boolean }>("/github/user/connection", {
      method: "DELETE",
    }),
  getInstallUrl: (teamId?: string | null) =>
    apiRequest<{ url: string }>(`/github/install-url${buildQuery({ teamId })}`),
  getWorkspace: (teamId?: string | null) =>
    apiRequest<ApiGitHubWorkspaceSummary>(`/github/workspace${buildQuery({ teamId })}`),
  createRepository: (payload: CreateRepositoryPayload) =>
    apiRequest<{
      repositoryRecord: ApiGitHubRepositoryRecord
      repository: ApiGitHubRepository
      sync: unknown
    }>("/github/repository/create", {
      method: "POST",
      body: payload,
    }),
  connectRepository: (payload: ConnectRepositoryPayload) =>
    apiRequest<{
      repositoryRecord: ApiGitHubRepositoryRecord
      repository: ApiGitHubRepository
      sync: unknown
    }>("/github/repository/connect", {
      method: "POST",
      body: payload,
    }),
  disconnectRepository: (payload: DisconnectRepositoryPayload) =>
    apiRequest<{ disconnected: boolean }>("/github/repository", {
      method: "DELETE",
      body: payload,
    }),
  deleteRepositoryPermanently: (payload: DeleteRepositoryPermanentlyPayload) =>
    apiRequest<{ deleted: boolean; repository: string }>("/github/repository/permanent", {
      method: "DELETE",
      body: payload,
    }),
  updateSettings: (payload: UpdateWorkspaceSettingsPayload) =>
    apiRequest<ApiGitHubRepositoryRecord>("/github/settings", {
      method: "PATCH",
      body: payload,
    }),
  syncWorkspace: (teamId?: string | null) =>
    apiRequest<{
      repositoryRecord: ApiGitHubRepositoryRecord | null
      sync: unknown
    }>(`/github/sync${buildQuery({ teamId })}`, {
      method: "POST",
    }),
  getTree: (params: RepositoryQueryParams) =>
    apiRequest<ApiGitHubTree>(`/github/tree${buildQuery(params)}`),
  getBlob: (params: RepositoryQueryParams) =>
    apiRequest<ApiGitHubBlob>(`/github/blob${buildQuery(params)}`),
  saveChanges: (payload: SaveRepositoryChangesPayload) =>
    apiRequest<ApiGitHubCommitResult>("/github/files/commit", {
      method: "POST",
      body: payload,
    }),
  getBranches: (params: TeamScopedParams = {}) =>
    apiRequest<ApiGitHubBranch[]>(`/github/branches${buildQuery(params)}`),
  createBranch: (payload: CreateBranchPayload) =>
    apiRequest<ApiGitHubBranch>("/github/branches", {
      method: "POST",
      body: payload,
    }),
  mergeBranch: (payload: MergeBranchPayload) =>
    apiRequest<unknown>("/github/branches/merge", {
      method: "POST",
      body: payload,
    }),
  deleteBranch: (name: string, teamId?: string | null) =>
    apiRequest<{ deleted: boolean; name: string }>(`/github/branches/${encodeURIComponent(name)}${buildQuery({ teamId })}`, {
      method: "DELETE",
    }),
  getCommits: (params: RepositoryQueryParams = {}) =>
    apiRequest<ApiGitHubCommitPage>(`/github/commits${buildQuery(params)}`),
  getCommit: (sha: string, teamId?: string | null) =>
    apiRequest<ApiGitHubCommitDetail>(`/github/commits/${encodeURIComponent(sha)}${buildQuery({ teamId })}`),
  compare: (params: RepositoryQueryParams) =>
    apiRequest<ApiGitHubCompare>(`/github/compare${buildQuery(params)}`),
  getIssues: (params: RepositoryQueryParams = {}) =>
    apiRequest<ApiGitHubIssue[]>(`/github/issues${buildQuery(params)}`),
  createIssue: (payload: CreateIssuePayload) =>
    apiRequest<ApiGitHubIssue>("/github/issues", {
      method: "POST",
      body: payload,
    }),
  updateIssue: (number: number, payload: UpdateIssuePayload) =>
    apiRequest<ApiGitHubIssue>(`/github/issues/${number}`, {
      method: "PATCH",
      body: payload,
    }),
  getPullRequests: (params: RepositoryQueryParams = {}) =>
    apiRequest<ApiGitHubPullRequest[]>(`/github/pulls${buildQuery(params)}`),
  getPullRequest: (number: number, teamId?: string | null) =>
    apiRequest<ApiGitHubPullRequest>(`/github/pulls/${number}${buildQuery({ teamId })}`),
  createPullRequest: (payload: CreatePullRequestPayload) =>
    apiRequest<ApiGitHubPullRequest>("/github/pulls", {
      method: "POST",
      body: payload,
    }),
  reviewPullRequest: (number: number, payload: ReviewPullRequestPayload) =>
    apiRequest<{
      id: string
      state: string | null
      body: string
      htmlUrl: string | null
      submittedAt: string | null
    }>(`/github/pulls/${number}/reviews`, {
      method: "POST",
      body: payload,
    }),
  mergePullRequest: (number: number, payload: MergePullRequestPayload) =>
    apiRequest<{
      sha?: string
      merged?: boolean
      message?: string
    }>(`/github/pulls/${number}/merge`, {
      method: "POST",
      body: payload,
    }),
  getActions: (params: RepositoryQueryParams = {}) =>
    apiRequest<{
      totalCount: number
      items: ApiGitHubWorkflowRun[]
    }>(`/github/actions${buildQuery(params)}`),
  getWorkflowLogs: (runId: number, teamId?: string | null) =>
    apiRequest<ApiGitHubWorkflowLogs>(`/github/actions/${runId}/logs${buildQuery({ teamId })}`),
  getReleases: (params: RepositoryQueryParams = {}) =>
    apiRequest<ApiGitHubRelease[]>(`/github/releases${buildQuery(params)}`),
  createRelease: (payload: CreateReleasePayload) =>
    apiRequest<ApiGitHubRelease>("/github/releases", {
      method: "POST",
      body: payload,
    }),
  getContributors: (teamId?: string | null) =>
    apiRequest<ApiGitHubContributor[]>(`/github/contributors${buildQuery({ teamId })}`),
  getRepositoryAccessState: (teamId?: string | null) =>
    apiRequest<ApiGitHubRepositoryAccessState>(`/github/access${buildQuery({ teamId })}`),
  inviteCollaborator: (payload: InviteCollaboratorPayload) =>
    apiRequest<{
      login: string
      invitationCreated: boolean
      alreadyHasAccess: boolean
    }>("/github/collaborators", {
      method: "POST",
      body: payload,
    }),
  removeCollaborator: (username: string, teamId?: string | null) =>
    apiRequest<{ removed: boolean; login: string }>(`/github/collaborators/${encodeURIComponent(username)}${buildQuery({ teamId })}`, {
      method: "DELETE",
    }),
  cancelInvitation: (invitationId: string | number, teamId?: string | null) =>
    apiRequest<{ cancelled: boolean; invitationId: string }>(`/github/invitations/${invitationId}${buildQuery({ teamId })}`, {
      method: "DELETE",
    }),
}
