export function isUserProfileIncomplete(user: unknown) {
  if (!user) return false

  const candidate = user as {
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

  const isBlank = (value: unknown) => value === null || value === undefined || String(value).trim() === ""
  const academicId = String(candidate.academicId ?? candidate.studentCode ?? "")
  const preferredTrack = candidate.preferredTrackRaw ?? candidate.preferredTrack
  const academicYear = candidate.academicYearRaw ?? candidate.academicYear
  const department = candidate.departmentRaw ?? candidate.department

  return (
    isBlank(candidate.phone) ||
    isBlank(department) ||
    isBlank(academicYear) ||
    isBlank(preferredTrack) ||
    isBlank(academicId) ||
    academicId.startsWith("OAUTH-")
  )
}
