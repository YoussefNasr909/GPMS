import { apiRequest } from "./http";
import { ApiResource, ApiResourceCategory, ApiResourceType, ApiDocument } from "./types";

/**
 * Resources API (Global Learning Resources — created by Doctors/TAs)
 */
export async function getResources(filters: { search?: string; category?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.category && filters.category !== "all") params.append("category", filters.category);

  return apiRequest<ApiResource[]>(`/resources?${params.toString()}`, {
    method: "GET",
  });
}

export async function createResource(data: {
  title: string;
  description: string;
  category: ApiResourceCategory;
  type: ApiResourceType;
  url?: string;
  tags: string[];
  file?: File;
}) {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("category", data.category);
  formData.append("type", data.type);
  if (data.url) formData.append("url", data.url);
  formData.append("tags", JSON.stringify(data.tags));

  if (data.file) {
    formData.append("file", data.file);
  }

  return apiRequest<ApiResource>("/resources", {
    method: "POST",
    body: formData,
  });
}

export async function deleteResource(id: string) {
  return apiRequest<void>(`/resources/${id}`, {
    method: "DELETE",
  });
}

/**
 * Documents API (Team-specific Documents)
 */
export async function getTeamDocuments(
  teamId: string,
  filters: { search?: string; category?: string } = {}
) {
  const params = new URLSearchParams();
  params.append("teamId", teamId);
  if (filters.search) params.append("search", filters.search);
  if (filters.category && filters.category !== "all") params.append("category", filters.category);

  return apiRequest<ApiDocument[]>(`/documents?${params.toString()}`, {
    method: "GET",
  });
}

export async function getDocumentsForSupervisor(filters: {
  teamId?: string;
  search?: string;
  category?: string;
} = {}) {
  const params = new URLSearchParams();
  if (filters.teamId) params.append("teamId", filters.teamId);
  if (filters.search) params.append("search", filters.search);
  if (filters.category && filters.category !== "all") params.append("category", filters.category);

  return apiRequest<ApiDocument[]>(`/documents?${params.toString()}`, {
    method: "GET",
  });
}

export async function createTeamDocument(data: {
  title: string;
  description: string;
  category: string;
  tags: string[];
  file: File;
}) {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("category", data.category);
  formData.append("tags", JSON.stringify(data.tags));
  formData.append("file", data.file);

  return apiRequest<ApiDocument>("/documents", {
    method: "POST",
    body: formData,
  });
}

export async function deleteTeamDocument(id: string) {
  return apiRequest<void>(`/documents/${id}`, {
    method: "DELETE",
  });
}
