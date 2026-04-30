import type { ApiDirectoryUser, ApiTeamDetail, ApiTeamStage, ApiTeamUser, ApiTeamVisibility, Role } from "@/lib/api/types"

function humanizeEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function formatTeamStage(stage: ApiTeamStage) {
  return humanizeEnum(stage)
}

export function formatTeamVisibility(visibility: ApiTeamVisibility) {
  return visibility === "PUBLIC" ? "Public" : "Private"
}

export function formatRoleLabel(role: Role) {
  switch (role) {
    case "ADMIN":
      return "Admin"
    case "DOCTOR":
      return "Doctor"
    case "TA":
      return "TA"
    case "LEADER":
      return "Team Leader"
    case "STUDENT":
    default:
      return "Student"
  }
}

export function getFullName(user: Pick<ApiTeamUser, "fullName" | "firstName" | "lastName" | "email"> | ApiDirectoryUser) {
  return user.fullName || `${user.firstName} ${user.lastName}`.trim() || user.email
}

export function getAvatarInitial(user: Pick<ApiTeamUser, "fullName" | "firstName" | "lastName" | "email"> | ApiDirectoryUser) {
  return getFullName(user).trim().charAt(0).toUpperCase()
}

export function getTeamProgressFallback(team: { stage: ApiTeamStage }) {
  const stageScores: Record<ApiTeamStage, number> = {
    REQUIREMENTS: 15,
    DESIGN: 30,
    IMPLEMENTATION: 60,
    TESTING: 80,
    DEPLOYMENT: 95,
    MAINTENANCE: 100,
  }

  return stageScores[team.stage]
}
