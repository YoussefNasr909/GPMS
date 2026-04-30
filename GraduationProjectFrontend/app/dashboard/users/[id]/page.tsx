"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Github, Linkedin, Loader2 } from "lucide-react"
import { FallbackState } from "@/components/feedback/fallback-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usersApi } from "@/lib/api/users"
import type { ApiPublicUserProfile } from "@/lib/api/types"
import { useAuthStore } from "@/lib/stores/auth-store"
import { formatRoleLabel, formatTeamVisibility, getAvatarInitial, getFullName } from "@/lib/team-display"

export default function PublicUserProfilePage() {
  const params = useParams()
  const { currentUser } = useAuthStore()
  const userId = String(params?.id || "")
  const [profile, setProfile] = useState<ApiPublicUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    usersApi
      .getPublicProfile(userId)
      .then((result) => {
        if (!cancelled) setProfile(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load this profile.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  if (isLoading) {
    return <ProfileLoadingState />
  }

  if (error || !profile) {
    return (
      <FallbackState
        kind="not-found"
        mode="panel"
        eyebrow="Profile"
        title="We could not open this profile"
        description={error || "This user profile is unavailable or no longer exists."}
        helperText="Return to search to look for another person or try opening the profile again."
        actions={[
          { label: "Back to Search", kind: "link", href: "/dashboard/search" },
          { label: "Go Back", kind: "back", variant: "outline" },
        ]}
      />
    )
  }

  const isSelf = currentUser?.id === profile.id
  const roleLabel = formatRoleLabel(profile.role)
  const departmentLabel = formatEnumLabel(profile.department) || "Not shared"
  const academicYearLabel = formatAcademicYear(profile.academicYear) || "Not shared"
  const preferredTrackLabel = formatEnumLabel(profile.preferredTrack) || "Not shared"
  const academicIdLabel = profile.academicId || "Not shared"
  const bioText = profile.bio?.trim() || "No public bio has been added yet."
  const identityMeta = [departmentLabel, academicYearLabel].filter((value) => value !== "Not shared").join(" / ")

  return (
    <div className="mx-auto w-full max-w-[72rem] p-4 md:p-6 xl:p-8">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={reduceMotion ? undefined : { duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="overflow-hidden rounded-[30px] border-border/70 bg-background shadow-[0_18px_50px_-32px_rgba(15,23,42,0.28)]">
          <CardContent className="p-0">
            {isSelf ? (
              <div className="flex justify-end border-b border-border/60 px-5 py-4 sm:px-7">
                <Button variant="outline" className="h-10 rounded-xl border-primary/20 bg-transparent px-4 hover:border-primary/30 hover:bg-primary/[0.05]" asChild>
                  <Link href="/dashboard/profile">Edit My Profile</Link>
                </Button>
              </div>
            ) : null}

            <div className="space-y-8 px-5 py-6 sm:px-7 sm:py-7">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={reduceMotion ? undefined : { duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-5 sm:flex-row sm:items-start"
              >
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={reduceMotion ? undefined : { duration: 0.34, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Avatar className="h-20 w-20 border-4 border-primary/10">
                    <AvatarImage src={profile.avatarUrl || "/placeholder.svg"} />
                    <AvatarFallback className="text-xl font-semibold">{getAvatarInitial(profile)}</AvatarFallback>
                  </Avatar>
                </motion.div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full bg-primary/[0.08] px-3 py-1 text-primary">
                      {roleLabel}
                    </Badge>
                    {isSelf ? <Badge variant="outline" className="rounded-full">You</Badge> : null}
                  </div>

                  <div className="space-y-2">
                    <h1 className="break-words text-3xl font-semibold tracking-tight text-foreground sm:text-[2.15rem]">
                      {getFullName(profile)}
                    </h1>
                    {identityMeta ? <p className="text-sm text-muted-foreground">{identityMeta}</p> : null}
                    <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-[15px]">{bioText}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={reduceMotion ? undefined : { duration: 0.42, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="grid gap-8 border-t border-border/60 pt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]"
              >
                <div className="space-y-8">
                  <div className="space-y-4">
                    <SectionTitle>Profile details</SectionTitle>
                    <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
                      <DetailRow label="Email" value={profile.email} />
                      <DetailRow label="Role" value={roleLabel} />
                      <DetailRow label="Academic ID" value={academicIdLabel} />
                      <DetailRow label="Department" value={departmentLabel} />
                      <DetailRow label="Academic Year" value={academicYearLabel} />
                      <DetailRow label="Preferred Track" value={preferredTrackLabel} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle>Current team</SectionTitle>
                    {profile.currentTeam ? (
                      <div className="space-y-4">
                        <div className="space-y-2 border-b border-border/60 pb-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Team name</p>
                          <div className="space-y-1.5">
                            <p className="text-base font-semibold text-foreground">{profile.currentTeam.name}</p>
                            <p className="text-sm leading-7 text-muted-foreground">
                              {profile.currentTeam.bio?.trim() || "No public team description has been added yet."}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
                          <DetailRow
                            label="Role in team"
                            value={profile.currentTeam.teamRole === "LEADER" ? "Team Leader" : "Team Member"}
                          />
                          <DetailRow label="Visibility" value={formatTeamVisibility(profile.currentTeam.visibility)} />
                          <DetailRow label="Members" value={`${profile.currentTeam.memberCount} members`} />
                        </div>

                        <Button
                          variant="outline"
                          className="h-11 rounded-xl border-border/70 bg-transparent px-4 text-foreground transition-[border-color,background-color,color,transform] duration-200 hover:border-primary/30 hover:bg-primary/[0.05] hover:text-primary"
                          asChild
                        >
                          <Link href={`/dashboard/teams/${profile.currentTeam.id}`}>
                            Open Team
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <PlainNotice>
                        This user is not currently part of any team.
                      </PlainNotice>
                    )}
                  </div>
                </div>

                <div className="space-y-8 lg:border-l lg:border-border/60 lg:pl-8">
                  <div className="space-y-4">
                    <SectionTitle>Public links</SectionTitle>
                    {profile.linkedinUrl || profile.githubUsername ? (
                      <div className="space-y-3">
                        {profile.linkedinUrl ? (
                          <ExternalLinkRow
                            href={profile.linkedinUrl}
                            label="LinkedIn"
                            detail={profile.linkedinUrl}
                            icon={<Linkedin className="h-4 w-4" />}
                            reduceMotion={Boolean(reduceMotion)}
                          />
                        ) : null}

                        {profile.githubUsername ? (
                          <ExternalLinkRow
                            href={`https://github.com/${profile.githubUsername}`}
                            label="GitHub"
                            detail={`github.com/${profile.githubUsername}`}
                            icon={<Github className="h-4 w-4" />}
                            reduceMotion={Boolean(reduceMotion)}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <PlainNotice>
                        No public LinkedIn or GitHub links have been shared yet.
                      </PlainNotice>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold tracking-tight text-foreground">{children}</h2>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border/60 py-3 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-sm leading-6 text-foreground">{value}</p>
    </div>
  )
}

function PlainNotice({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-border/60 py-3">
      <p className="text-sm leading-7 text-muted-foreground">{children}</p>
    </div>
  )
}

function ExternalLinkRow({
  href,
  label,
  detail,
  icon,
  reduceMotion,
}: {
  href: string
  label: string
  detail: string
  icon: ReactNode
  reduceMotion: boolean
}) {
  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.995 }}
      transition={reduceMotion ? undefined : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <Button
        variant="outline"
        asChild
        className="group h-auto w-full justify-between rounded-xl border-border/70 bg-background px-4 py-3 text-foreground shadow-none transition-[border-color,background-color,color] duration-200 hover:border-primary/30 hover:bg-primary/[0.05] hover:text-foreground"
      >
        <a href={href} target="_blank" rel="noreferrer">
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary">
              {icon}
            </span>
            <span className="min-w-0 text-left">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block truncate text-xs text-muted-foreground transition-colors duration-200 group-hover:text-foreground/70">
                {detail}
              </span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
        </a>
      </Button>
    </motion.div>
  )
}

function ProfileLoadingState() {
  return (
    <div className="mx-auto w-full max-w-[72rem] p-4 md:p-6 xl:p-8">
      <Card className="overflow-hidden rounded-[30px] border-border/70 bg-background shadow-[0_18px_50px_-32px_rgba(15,23,42,0.28)]">
        <CardContent className="p-0">
          <div className="flex justify-end border-b border-border/60 px-5 py-4 sm:px-7">
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>

          <div className="space-y-8 px-5 py-6 sm:px-7 sm:py-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
                <Skeleton className="h-10 w-72 rounded-2xl" />
                <Skeleton className="h-4 w-44 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-5/6 rounded-full" />
              </div>
            </div>

            <div className="grid gap-8 border-t border-border/60 pt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
              <div className="space-y-8">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-36 rounded-full" />
                  <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="border-b border-border/60 py-3">
                        <Skeleton className="h-3 w-20 rounded-full" />
                        <Skeleton className="mt-2 h-5 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Skeleton className="h-6 w-32 rounded-full" />
                  <div className="space-y-4">
                    <div className="border-b border-border/60 pb-4">
                      <Skeleton className="h-3 w-20 rounded-full" />
                      <Skeleton className="mt-3 h-5 w-40 rounded-full" />
                      <Skeleton className="mt-3 h-4 w-full rounded-full" />
                    </div>
                    <div className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="border-b border-border/60 py-3">
                          <Skeleton className="h-3 w-20 rounded-full" />
                          <Skeleton className="mt-2 h-5 w-full rounded-full" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-11 w-36 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 lg:border-l lg:border-border/60 lg:pl-8">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-5 flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Loading public profile...
      </div>
    </div>
  )
}

function formatEnumLabel(value: string | null | undefined) {
  if (!value) return null

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatAcademicYear(value: string | null | undefined) {
  if (!value) return null
  return value.replace("YEAR_", "Year ")
}
