import { apiRequest } from "./http"
import type { ApiRisk, ApiRiskApprovalStatus, ApiRiskChance, ApiRiskSeverity, ApiRiskStatus } from "./types"

type ListRisksParams = {
  teamId?: string
  status?: ApiRiskStatus
  approvalStatus?: ApiRiskApprovalStatus
  severity?: ApiRiskSeverity
}

type CreateRiskPayload = {
  teamId?: string
  title: string
  description: string
  category: string
  chance: ApiRiskChance
  impact: ApiRiskChance
  mitigation?: string
  monitorUserId?: string
}

type UpdateRiskPayload = Partial<{
  title: string
  description: string
  category: string
  chance: ApiRiskChance
  impact: ApiRiskChance
  status: ApiRiskStatus
  mitigation: string
  monitoringNotes: string
  resolutionNotes: string
  monitorUserId: string | null
}>

function buildRisksQuery(params: ListRisksParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.teamId) searchParams.set("teamId", params.teamId)
  if (params.status) searchParams.set("status", params.status)
  if (params.approvalStatus) searchParams.set("approvalStatus", params.approvalStatus)
  if (params.severity) searchParams.set("severity", params.severity)

  const query = searchParams.toString()
  return query ? `/risks?${query}` : "/risks"
}

export const risksApi = {
  list: (params?: ListRisksParams) => apiRequest<ApiRisk[]>(buildRisksQuery(params)),
  create: (payload: CreateRiskPayload) =>
    apiRequest<ApiRisk>("/risks", {
      method: "POST",
      body: payload,
    }),
  update: (id: string, payload: UpdateRiskPayload) =>
    apiRequest<ApiRisk>(`/risks/${id}`, {
      method: "PATCH",
      body: payload,
    }),
  approve: (id: string, payload: { severity: ApiRiskSeverity; approvalNote?: string }) =>
    apiRequest<ApiRisk>(`/risks/${id}/approve`, {
      method: "POST",
      body: payload,
    }),
  requestRevision: (id: string, payload: { approvalNote: string }) =>
    apiRequest<ApiRisk>(`/risks/${id}/request-revision`, {
      method: "POST",
      body: payload,
    }),
}
