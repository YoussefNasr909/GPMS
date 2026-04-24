import { apiRequest } from "./http"
import type { ApiDiscussionCategory, ApiDiscussionComment, ApiDiscussionDetail, ApiDiscussionFeed, ApiDiscussionSummary } from "./types"

type DiscussionFilters = {
  search?: string
  category?: "all" | ApiDiscussionCategory
  page?: number
}

export async function listDiscussions(filters: DiscussionFilters = {}, signal?: AbortSignal) {
  const params = new URLSearchParams()

  if (filters.search) params.append("search", filters.search)
  if (filters.category && filters.category !== "all") params.append("category", filters.category)
  if (filters.page && filters.page > 1) params.append("page", String(filters.page))

  const query = params.toString()

  return apiRequest<ApiDiscussionFeed>(query ? `/discussions?${query}` : "/discussions", {
    method: "GET",
    signal,
  })
}

export async function getDiscussionDetail(id: string, signal?: AbortSignal) {
  return apiRequest<ApiDiscussionDetail>(`/discussions/${id}`, {
    method: "GET",
    signal,
  })
}

export async function createDiscussion(data: {
  title: string
  category: ApiDiscussionCategory
  content: string
  tags: string[]
}) {
  return apiRequest<ApiDiscussionSummary>("/discussions", {
    method: "POST",
    body: data,
  })
}

export async function createDiscussionComment(id: string, content: string, parentCommentId?: string | null) {
  return apiRequest<ApiDiscussionComment>(`/discussions/${id}/comments`, {
    method: "POST",
    body: {
      content,
      ...(parentCommentId ? { parentCommentId } : {}),
    },
  })
}

export async function likeDiscussion(id: string) {
  return apiRequest<ApiDiscussionDetail>(`/discussions/${id}/like`, {
    method: "POST",
  })
}

export async function deleteDiscussion(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/discussions/${id}`, {
    method: "DELETE",
  })
}

export async function deleteDiscussionComment(discussionId: string, commentId: string) {
  return apiRequest<{ id: string; discussionId: string; parentCommentId: string | null; deleted: boolean }>(
    `/discussions/${discussionId}/comments/${commentId}`,
    {
      method: "DELETE",
    },
  )
}
