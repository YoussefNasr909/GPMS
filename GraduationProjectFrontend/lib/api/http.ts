import { useAuthStore } from "@/lib/stores/auth-store"
import type { ApiErrorBody } from "./types"

export class ApiRequestError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.code = code
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "")
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`
}

function joinUrl(baseUrl: string, path: string) {
  return `${normalizeBaseUrl(baseUrl)}${normalizePath(path)}`
}

function getRequestId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

const DEFAULT_BASE = process.env.NODE_ENV === "development" ? "http://localhost:4000/api/v1" : "/api/v1"
function resolveApiBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL
  const isAbsolute = typeof envBase === "string" && /^https?:\/\//.test(envBase)
  const isRelative = typeof envBase === "string" && envBase.startsWith("/")
  if (isAbsolute) return normalizeBaseUrl(envBase as string)
  if (isRelative && process.env.NODE_ENV === "development") return normalizeBaseUrl(DEFAULT_BASE)
  if (envBase) return normalizeBaseUrl(envBase as string)
  return normalizeBaseUrl(DEFAULT_BASE)
}
export const API_BASE_URL = resolveApiBaseUrl()

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  headers?: Record<string, string>
  body?: unknown
  signal?: AbortSignal
  auth?: boolean // default true
}

/**
 * Endpoints that are allowed to return 401 WITHOUT forcing logout/redirect.
 * (Because 401 is expected for "wrong password", "not verified", etc.)
 */
const AUTH_PUBLIC_401_ALLOWLIST = new Set<string>([
  "/auth/login",
  "/auth/register",
  "/auth/send-verification",
  "/auth/verify-email",
  "/auth/forgot-password",
"/auth/verify-reset-code",
"/auth/reset-password",
])

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, signal, auth = true } = options
  const token = useAuthStore.getState().accessToken

  const res = await fetch(joinUrl(API_BASE_URL, path), {
    method,
    headers: {
      "X-Request-Id": getRequestId(),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body instanceof FormData ? body : (body === undefined ? undefined : JSON.stringify(body)),
    credentials: "omit",
    signal,
  })

  const text = await res.text()
  const json = text ? (JSON.parse(text) as any) : undefined

  if (res.ok) {
    // Standard backend shape: { ok:true, data: ... }
    if (json && typeof json === "object" && "data" in json) {
      return json.data as T
    }
    return json as T
  }

  // Standard error shape: { ok:false, code, message }
  const err = (json as ApiErrorBody | undefined) ?? {
    ok: false,
    code: "UNKNOWN_ERROR",
    message: res.statusText || "Request failed",
  }

  // ✅ IMPORTANT FIX:
  // Only force logout/redirect on 401 for protected endpoints.
  // Do NOT redirect on login/register/verify endpoints.
  if (res.status === 401 && auth && !AUTH_PUBLIC_401_ALLOWLIST.has(normalizePath(path))) {
    useAuthStore.getState().logout()
    if (typeof window !== "undefined") window.location.href = "/login"
  }

  throw new ApiRequestError(err.message, res.status, err.code)
}
