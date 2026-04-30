import { apiRequest } from "./http"
import type {
  ApiTask,
  ApiTaskIntegrationMode,
  ApiTaskPriority,
  ApiTaskStatus,
  ApiTaskType,
} from "./types"

type ListTasksParams = {
  teamId?: string
  search?: string
  status?: ApiTaskStatus
  priority?: ApiTaskPriority
  taskType?: ApiTaskType
  integrationMode?: ApiTaskIntegrationMode
}

type TaskPayload = {
  teamId?: string
  title: string
  description?: string
  priority: ApiTaskPriority
  startDate: string
  endDate: string
  assigneeUserId: string
  taskType?: ApiTaskType
  integrationMode?: ApiTaskIntegrationMode
}

type UpdateTaskPayload = Partial<Omit<TaskPayload, "teamId">>

type ApproveTaskPayload = {
  reviewComment?: string
  mergePullRequest?: boolean
  mergeMethod?: "merge" | "squash" | "rebase"
}

type RejectTaskPayload = {
  reviewComment: string
}

type OpenTaskPullRequestPayload = {
  title?: string
  body?: string
  base?: string
  draft?: boolean
  reviewerLogins?: string[]
}

function buildTasksQuery(params: ListTasksParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.teamId) searchParams.set("teamId", params.teamId)
  if (params.search) searchParams.set("search", params.search)
  if (params.status) searchParams.set("status", params.status)
  if (params.priority) searchParams.set("priority", params.priority)
  if (params.taskType) searchParams.set("taskType", params.taskType)
  if (params.integrationMode) searchParams.set("integrationMode", params.integrationMode)

  const query = searchParams.toString()
  return query ? `/tasks?${query}` : "/tasks"
}

export const tasksApi = {
  list: (params?: ListTasksParams) => apiRequest<ApiTask[]>(buildTasksQuery(params)),
  create: (payload: TaskPayload) =>
    apiRequest<ApiTask>("/tasks", {
      method: "POST",
      body: payload,
    }),
  update: (id: string, payload: UpdateTaskPayload) =>
    apiRequest<ApiTask>(`/tasks/${id}`, {
      method: "PATCH",
      body: payload,
    }),
  accept: (id: string) =>
    apiRequest<ApiTask>(`/tasks/${id}/accept`, {
      method: "POST",
    }),
  submitForReview: (id: string) =>
    apiRequest<ApiTask>(`/tasks/${id}/submit-review`, {
      method: "POST",
    }),
  approve: (id: string, payload?: ApproveTaskPayload) =>
    apiRequest<ApiTask>(`/tasks/${id}/approve`, {
      method: "POST",
      body: payload,
    }),
  reject: (id: string, payload: RejectTaskPayload) =>
    apiRequest<ApiTask>(`/tasks/${id}/reject`, {
      method: "POST",
      body: payload,
    }),
  bootstrapGithub: (id: string) =>
    apiRequest<ApiTask>(`/tasks/${id}/github/bootstrap`, {
      method: "POST",
    }),
  openPullRequest: (id: string, payload?: OpenTaskPullRequestPayload) =>
    apiRequest<ApiTask>(`/tasks/${id}/github/open-pr`, {
      method: "POST",
      body: payload,
    }),
  resyncGithub: (id: string) =>
    apiRequest<ApiTask>(`/tasks/${id}/github/resync`, {
      method: "POST",
    }),
}
