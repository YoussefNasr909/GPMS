import type { ApiUser, Department, Role, Track } from "./types"
import type { User } from "@/types"

function humanizeEnum(v?: string | null) {
  if (!v) return ""
  return v
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ")
}

function mapApiRoleToUiRole(role: Role): User["role"] {
  switch (role) {
    case "ADMIN":
      return "admin"
    case "LEADER":
      return "leader"
    case "DOCTOR":
      return "doctor"
    case "TA":
      return "ta"
    case "STUDENT":
    default:
      return "member"
  }
}

function mapApiTrackToUiTrack(track: Track | null): User["track"] | undefined {
  switch (track) {
    case "FRONTEND_DEVELOPMENT":
      return "frontend"
    case "BACKEND_DEVELOPMENT":
      return "backend"
    case "FULLSTACK_DEVELOPMENT":
      return "fullstack"
    case "MOBILE_APP_DEVELOPMENT":
      return "mobile"
    case "DEVOPS":
      return "devops"
    case "CLOUD_ENGINEERING":
      return "cloud"
    case "SOFTWARE_ARCHITECTURE":
      return "architecture"
    case "QUALITY_ASSURANCE":
      return "qa"
    case "GAME_DEVELOPMENT":
      return "gamedev"
    default:
      return undefined
  }
}

function mapApiDepartmentToLabel(dep: Department | null): string | undefined {
  if (!dep) return undefined

  // Make sure it matches your dropdown labels
  if (dep === "CYBERSECURITY_INFOSEC") return "Cybersecurity / Information Security"

  return humanizeEnum(dep)
}

export function mapApiUserToUiUser(u: ApiUser): User {
  const fullName =
    `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
    (u as any).fullName ||
    String(u.email ?? "User").split("@")[0]

  return {
    id: u.id,
    name: fullName,

    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,

    email: u.email,
    role: mapApiRoleToUiRole(u.role),

    // ✅ keep avatar under BOTH names so any component works
    avatar: (u as any).avatarUrl ?? (u as any).avatar_url ?? undefined,
    avatarUrl: (u as any).avatarUrl ?? (u as any).avatar_url ?? undefined,

    // ✅ keep academicId under BOTH names
    studentCode: (u as any).academicId ?? undefined,
    academicId: (u as any).academicId ?? undefined,

    // ✅ keep RAW values for auth checks (VERY IMPORTANT)
    departmentRaw: (u as any).department ?? null,
    academicYearRaw: (u as any).academicYear ?? null,
    preferredTrackRaw: (u as any).preferredTrack ?? null,
    phone: (u as any).phone ?? undefined,
    bio: (u as any).bio ?? undefined,
    linkedinUrl: (u as any).linkedinUrl ?? undefined,
    githubUsername: (u as any).githubUsername ?? undefined,

    // ✅ keep the UI-friendly values you already had (for dropdown labels etc.)
    department: mapApiDepartmentToLabel((u as any).department),
    academicYear: (u as any).academicYear ?? null, // keep raw string (don’t humanize)
    track: mapApiTrackToUiTrack((u as any).preferredTrack),
    preferredTrack: (u as any).preferredTrack ?? null, // keep raw enum too
  } as any
}

