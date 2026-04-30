import { apiRequest } from "./http"
import type {
  AcademicYear,
  Department,
  Track,
  Role,
  AuthResponse,
  RegisterResponse,
  ApiUser,
} from "./types"

export const authApi = {
  register: (payload: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    role?: Role
    academicId: string
    department: Department
    academicYear: AcademicYear
    preferredTrack: Track
    password: string
    confirmPassword: string
    acceptTerms: boolean
  }) => apiRequest<RegisterResponse>("/auth/register", { method: "POST", body: payload, auth: false }),

  login: (payload: { email: string; password: string; rememberMe?: boolean }) =>
    apiRequest<AuthResponse>("/auth/login", { method: "POST", body: payload, auth: false }),

  me: () => apiRequest<ApiUser>("/auth/me"),

  sendVerification: (payload: { email: string }) =>
    apiRequest<{ sent: boolean; message?: string }>("/auth/send-verification", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  verifyEmail: (payload: { email: string; code: string }) =>
    apiRequest<{ verified: boolean }>("/auth/verify-email", {
      method: "POST",
      body: payload,
      auth: false,
    }),
    forgotPassword: (payload: { email: string }) =>
  apiRequest<{ sent: boolean; message?: string }>("/auth/forgot-password", {
    method: "POST",
    body: payload,
    auth: false,
  }),

/** step 2 */
verifyResetCode: (payload: { email: string; code: string }) =>
  apiRequest<{ valid: boolean }>("/auth/verify-reset-code", {
    method: "POST",
    body: payload,
    auth: false,
  }),

/** step 3 */
resetPassword: (payload: { email: string; code: string; password: string; confirmPassword: string }) =>
  apiRequest<{ reset: boolean }>("/auth/reset-password", {
    method: "POST",
    body: payload,
    auth: false,
  }),
oauthComplete: (payload: {
  phone: string
  academicId: string
  department: any
  academicYear: any
  preferredTrack: any
  password: string
  confirmPassword: string
}) =>
  apiRequest("/auth/oauth-complete", {
    method: "POST",
    body: payload,
    auth: true,
  }),

}
