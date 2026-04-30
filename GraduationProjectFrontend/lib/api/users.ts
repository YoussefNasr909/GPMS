import { apiRequest } from "./http"
import type {
  AcademicYear,
  AccountStatus,
  ApiDirectoryUser,
  ApiPublicUserProfile,
  ApiUser,
  Department,
  Paginated,
  Role,
  Track,
  UsersSummary,
} from "./types"

type ListUsersParams = {
  page?: number
  limit?: number
  search?: string
  role?: Role
  status?: AccountStatus
}

type ListDirectoryUsersParams = {
  page?: number
  limit?: number
  search?: string
  role?: Role
}

type SelfSelectableRole = Extract<Role, "STUDENT" | "LEADER">

type AdminUserPayload = {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: Role
  password: string
  academicId: string
  accountStatus: AccountStatus
  department?: Department | null
  academicYear?: AcademicYear | null
  preferredTrack?: Track | null
}

type UpdateAdminUserPayload = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string | null
  role?: Role
  password?: string
  academicId?: string
  accountStatus?: AccountStatus
  department?: Department | null
  academicYear?: AcademicYear | null
  preferredTrack?: Track | null
  avatarUrl?: string | null
  bio?: string | null
  linkedinUrl?: string | null
  githubUsername?: string | null
}

function buildUsersQuery(params: ListUsersParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.search) searchParams.set("search", params.search)
  if (params.role) searchParams.set("role", params.role)
  if (params.status) searchParams.set("status", params.status)

  const query = searchParams.toString()
  return query ? `/users?${query}` : "/users"
}

function buildDirectoryUsersQuery(params: ListDirectoryUsersParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.set("page", String(params.page))
  if (params.limit) searchParams.set("limit", String(params.limit))
  if (params.search) searchParams.set("search", params.search)
  if (params.role) searchParams.set("role", params.role)

  const query = searchParams.toString()
  return query ? `/users/directory?${query}` : "/users/directory"
}

export const usersApi = {
  list: (params?: ListUsersParams) => apiRequest<Paginated<ApiUser>>(buildUsersQuery(params)),
  directory: (params?: ListDirectoryUsersParams) =>
    apiRequest<Paginated<ApiDirectoryUser>>(buildDirectoryUsersQuery(params)),
  getPublicProfile: (id: string) => apiRequest<ApiPublicUserProfile>(`/users/directory/${id}`),
  summary: () => apiRequest<UsersSummary>("/users/summary"),
  getById: (id: string) => apiRequest<ApiUser>(`/users/${id}`),
  create: (payload: AdminUserPayload) =>
    apiRequest<ApiUser>("/users", {
      method: "POST",
      body: payload,
    }),
  updateById: (id: string, payload: UpdateAdminUserPayload) =>
    apiRequest<ApiUser>(`/users/${id}`, {
      method: "PATCH",
      body: payload,
    }),
  deleteById: (id: string) =>
    apiRequest<ApiUser>(`/users/${id}`, {
      method: "DELETE",
    }),

  /** Update the logged-in user's profile */
  updateMe: (
    payload: {
      firstName?: string
      lastName?: string
      phone?: string | null
      department?: Department | null
      preferredTrack?: Track | null
      avatarUrl?: string | null
      bio?: string | null
      linkedinUrl?: string | null
      githubUsername?: string | null
    },
    token?: string,
  ) =>
    apiRequest<ApiUser>("/users/me", {
      method: "PATCH",
      body: payload,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
  updateMyRole: (role: SelfSelectableRole) =>
    apiRequest<ApiUser>("/users/me/role", {
      method: "PATCH",
      body: { role },
    }),
}
