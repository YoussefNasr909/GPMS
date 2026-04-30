import { apiRequest } from "./http"
import type {
  ApiMyTeamState,
  ApiSupervisorRequest,
  ApiTeamDetail,
  ApiTeamInvitation,
  ApiTeamJoinRequest,
  ApiTeamStage,
  ApiTeamSummary,
  ApiTeamVisibility,
  Paginated,
} from "./types"

type ListTeamsParams = {
  page?: number
  limit?: number
  search?: string
  stage?: ApiTeamStage
  visibility?: ApiTeamVisibility
  availability?: "open" | "full"
}

type CreateTeamPayload = {
  name: string
  bio: string
  stack: string[]
  maxMembers: number
  visibility: ApiTeamVisibility
  allowJoinRequests?: boolean
  stage?: ApiTeamStage
}

type UpdateTeamPayload = Partial<CreateTeamPayload>

type CreateJoinRequestPayload = {
  message?: string
}

type CreateInvitationPayload =
  | {
      email: string
      academicId?: never
    }
  | {
      academicId: string
      email?: never
    }

type CreateSupervisorRequestPayload = {
  supervisorId: string
  projectName: string
  projectDescription: string
  technologies: string[]
}

function buildTeamsQuery(params: ListTeamsParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.search) searchParams.set("search", params.search)
  if (params.stage) searchParams.set("stage", params.stage)
  if (params.visibility) searchParams.set("visibility", params.visibility)
  if (params.availability) searchParams.set("availability", params.availability)

  const query = searchParams.toString()
  return query ? `/teams?${query}` : "/teams"
}

export const teamsApi = {
  list: (params?: ListTeamsParams) => apiRequest<Paginated<ApiTeamSummary>>(buildTeamsQuery(params)),
  my: () => apiRequest<ApiMyTeamState>("/teams/my"),
  getById: (id: string) => apiRequest<ApiTeamDetail>(`/teams/${id}`),
  create: (payload: CreateTeamPayload) =>
    apiRequest<ApiTeamDetail>("/teams", {
      method: "POST",
      body: payload,
    }),
  update: (id: string, payload: UpdateTeamPayload) =>
    apiRequest<ApiTeamDetail>(`/teams/${id}`, {
      method: "PATCH",
      body: payload,
    }),
  delete: (id: string) =>
    apiRequest<ApiTeamDetail>(`/teams/${id}`, {
      method: "DELETE",
    }),
  joinByCode: (inviteCode: string) =>
    apiRequest<ApiTeamDetail>("/teams/join-by-code", {
      method: "POST",
      body: { inviteCode },
    }),
  requestToJoin: (teamId: string, payload: CreateJoinRequestPayload) =>
    apiRequest<ApiTeamJoinRequest>(`/teams/${teamId}/join-requests`, {
      method: "POST",
      body: payload,
    }),
  approveJoinRequest: (joinRequestId: string) =>
    apiRequest<ApiTeamJoinRequest>(`/teams/join-requests/${joinRequestId}/approve`, {
      method: "POST",
    }),
  rejectJoinRequest: (joinRequestId: string) =>
    apiRequest<ApiTeamJoinRequest>(`/teams/join-requests/${joinRequestId}/reject`, {
      method: "POST",
    }),
  invite: (teamId: string, payload: CreateInvitationPayload) =>
    apiRequest<ApiTeamInvitation>(`/teams/${teamId}/invitations`, {
      method: "POST",
      body: payload,
    }),
  createSupervisorRequest: (teamId: string, payload: CreateSupervisorRequestPayload) =>
    apiRequest<ApiSupervisorRequest>(`/teams/${teamId}/supervisor-requests`, {
      method: "POST",
      body: payload,
    }),
  acceptSupervisorRequest: (requestId: string) =>
    apiRequest<ApiSupervisorRequest>(`/teams/supervisor-requests/${requestId}/accept`, {
      method: "POST",
    }),
  declineSupervisorRequest: (requestId: string) =>
    apiRequest<ApiSupervisorRequest>(`/teams/supervisor-requests/${requestId}/decline`, {
      method: "POST",
    }),
  acceptInvitation: (invitationId: string) =>
    apiRequest<ApiTeamInvitation>(`/teams/invitations/${invitationId}/accept`, {
      method: "POST",
    }),
  declineInvitation: (invitationId: string) =>
    apiRequest<ApiTeamInvitation>(`/teams/invitations/${invitationId}/decline`, {
      method: "POST",
    }),
  cancelInvitation: (invitationId: string) =>
    apiRequest<ApiTeamInvitation>(`/teams/invitations/${invitationId}/cancel`, {
      method: "POST",
    }),
  leave: (teamId: string) =>
    apiRequest<{ teamId: string; leftAt: string }>(`/teams/${teamId}/leave`, {
      method: "POST",
    }),
  removeMember: (teamId: string, userId: string) =>
    apiRequest<{ teamId: string; removedAt: string }>(`/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    }),
  removeSupervisor: (teamId: string, supervisorRole: "DOCTOR" | "TA") =>
    apiRequest<ApiTeamDetail>(`/teams/${teamId}/supervisors/${supervisorRole}`, {
      method: "DELETE",
    }),
}

