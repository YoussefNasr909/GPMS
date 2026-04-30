import { apiRequest } from "./http"
import type { ApiTeamStage } from "./types"

export type ApiSubmissionStatus = "PENDING" | "UNDER_REVIEW" | "REVISION_REQUIRED" | "APPROVED"
export type ApiDeliverableType =
  | "SRS"
  | "UML"
  | "PROTOTYPE"
  | "CODE"
  | "TEST_PLAN"
  | "FINAL_REPORT"
  | "PRESENTATION"
export type ApiSubmissionSourceType = "MANUAL_UPLOAD" | "GITHUB_RELEASE" | "GITHUB_ARTIFACT"

export type ApiSubmissionUser = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: string
  avatarUrl: string | null
}

export type ApiSubmission = {
  id: string
  teamId: string
  deliverableType: ApiDeliverableType
  sdlcPhase: ApiTeamStage
  sourceType: ApiSubmissionSourceType
  title: string | null
  notes: string | null
  status: ApiSubmissionStatus
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  fileUrl: string | null
  githubReleaseId: string | null
  githubReleaseTag: string | null
  githubReleaseUrl: string | null
  artifactUrl: string | null
  version: number
  submittedAt: string
  deadline: string | null
  late: boolean
  feedback: string | null
  grade: number | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  submittedBy: ApiSubmissionUser | null
  reviewedBy: ApiSubmissionUser | null
  team: { id: string; name: string; stage: ApiTeamStage }
}

export type ApiSDLCPhase = {
  phase: ApiTeamStage
  label: string
  description: string
  order: number
  status: "completed" | "in-progress" | "upcoming"
  progress: number
  requiredDeliverables: ApiDeliverableType[]
  optionalDeliverables: ApiDeliverableType[]
  requiredComplete: boolean
  submissions: ApiSubmission[]
  canAdvance: boolean
}

export type ApiSDLCSummary = {
  team: { id: string; name: string; stage: ApiTeamStage }
  currentPhase: ApiSDLCPhase | null
  overallProgress: number
  phases: ApiSDLCPhase[]
  canAdvanceStage: boolean
  nextStage: ApiTeamStage | null
}

export type ApiAdvanceStageResult = {
  team: { id: string; name: string; stage: ApiTeamStage }
  previousStage: ApiTeamStage
  newStage: ApiTeamStage
  message: string
}

export type CreateSubmissionPayload = {
  deliverableType: ApiDeliverableType
  sdlcPhase: ApiTeamStage
  title?: string
  notes?: string
  deadline?: string
}

export type GradeSubmissionPayload = {
  grade: number
  feedback?: string
}

export type RequestRevisionPayload = {
  feedback: string
}

type ListSubmissionsParams = {
  teamId?: string
  sdlcPhase?: ApiTeamStage
  deliverableType?: ApiDeliverableType
  status?: ApiSubmissionStatus
}

function buildQuery(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value)
  }
  return sp.toString()
}

export const submissionsApi = {
  list: (params: ListSubmissionsParams = {}) => {
    const q = buildQuery(params as Record<string, string | undefined>)
    return apiRequest<ApiSubmission[]>(q ? `/submissions?${q}` : "/submissions")
  },

  create: (payload: CreateSubmissionPayload, file: File) => {
    const form = new FormData()
    form.append("file", file)
    form.append("deliverableType", payload.deliverableType)
    form.append("sdlcPhase", payload.sdlcPhase)
    if (payload.title) form.append("title", payload.title)
    if (payload.notes) form.append("notes", payload.notes)
    if (payload.deadline) form.append("deadline", payload.deadline)
    return apiRequest<ApiSubmission>("/submissions", { method: "POST", body: form })
  },

  get: (id: string) => apiRequest<ApiSubmission>(`/submissions/${id}`),

  grade: (id: string, payload: GradeSubmissionPayload) =>
    apiRequest<ApiSubmission>(`/submissions/${id}/grade`, { method: "PATCH", body: payload }),

  requestRevision: (id: string, payload: RequestRevisionPayload) =>
    apiRequest<ApiSubmission>(`/submissions/${id}/request-revision`, { method: "PATCH", body: payload }),

  delete: (id: string) =>
    apiRequest<ApiSubmission>(`/submissions/${id}`, { method: "DELETE" }),

  getSDLCSummary: (teamId?: string) => {
    const q = teamId ? `?teamId=${teamId}` : ""
    return apiRequest<ApiSDLCSummary>(`/submissions/sdlc-summary${q}`)
  },

  advanceStage: (teamId?: string) => {
    const q = teamId ? `?teamId=${teamId}` : ""
    return apiRequest<ApiAdvanceStageResult>(`/submissions/advance-stage${q}`, { method: "POST" })
  },
}
