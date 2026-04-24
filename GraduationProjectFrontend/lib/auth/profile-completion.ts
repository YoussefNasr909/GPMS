type ProfileCompletionCandidate = {
  role?: string | null
  phone?: string | null
  department?: string | null
  departmentRaw?: string | null
  academicYear?: string | null
  academicYearRaw?: string | null
  preferredTrack?: string | null
  preferredTrackRaw?: string | null
  academicId?: string | null
  studentCode?: string | null
}

function normalizeRole(role: unknown) {
  const value = String(role ?? "")
    .trim()
    .toUpperCase()

  if (value === "MEMBER") return "STUDENT"
  return value
}

export function doesUserRequireStudentAcademicFields(user: unknown) {
  const role = normalizeRole((user as ProfileCompletionCandidate | null)?.role)
  return role === "STUDENT" || role === "LEADER"
}

export function isUserProfileIncomplete(user: unknown) {
  if (!user) return false

  const candidate = user as ProfileCompletionCandidate
  const isBlank = (value: unknown) => value === null || value === undefined || String(value).trim() === ""
  const academicId = String(candidate.academicId ?? candidate.studentCode ?? "")
  const preferredTrack = candidate.preferredTrackRaw ?? candidate.preferredTrack
  const academicYear = candidate.academicYearRaw ?? candidate.academicYear
  const department = candidate.departmentRaw ?? candidate.department
  const requiresStudentAcademicFields = doesUserRequireStudentAcademicFields(candidate)

  return (
    isBlank(candidate.phone) ||
    isBlank(department) ||
    isBlank(academicId) ||
    academicId.startsWith("OAUTH-") ||
    (requiresStudentAcademicFields &&
      (isBlank(academicYear) || isBlank(preferredTrack)))
  )
}
