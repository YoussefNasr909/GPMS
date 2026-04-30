"use client"

import { useEffect, useState, useDeferredValue } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import {
  BookOpen,
  GraduationCap,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { usersApi } from "@/lib/api/users"
import type { ApiDirectoryUser } from "@/lib/api/types"
import { getAvatarInitial, getFullName } from "@/lib/team-display"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function getRevealMotion(reduceMotion: boolean, delay = 0) {
  if (reduceMotion) return {}
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.34, delay, ease: [0.22, 1, 0.36, 1] as const },
  }
}

function humanizeLabel(str: string) {
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function SupervisorCard({ user, delay, reduceMotion }: { user: ApiDirectoryUser; delay: number; reduceMotion: boolean }) {
  const name = getFullName(user)
  const roleLabel = user.role === "DOCTOR" ? "Doctor" : "Teaching Assistant"
  const roleColor = user.role === "DOCTOR"
    ? "border-violet-500/30 bg-violet-500/5 text-violet-700 dark:text-violet-400"
    : "border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-400"

  return (
    <motion.div
      {...getRevealMotion(reduceMotion, delay)}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group h-full overflow-hidden border-border/70 shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-md">
        <div className={`h-1 w-full ${user.role === "DOCTOR" ? "bg-gradient-to-r from-violet-500/70 to-violet-500/20" : "bg-gradient-to-r from-blue-500/70 to-blue-500/20"}`} />
        <CardContent className="flex h-full flex-col gap-4 p-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 shrink-0 border border-border/60 shadow-sm">
              <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
              <AvatarFallback className="text-base font-semibold">{getAvatarInitial(user)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold tracking-tight text-foreground">{name}</h3>
              </div>
              <Badge variant="outline" className={`mt-1.5 text-[10px] font-semibold ${roleColor}`}>
                {roleLabel}
              </Badge>
            </div>
          </div>

          {/* Bio */}
          {user.bio ? (
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{user.bio}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground/60">No bio provided yet.</p>
          )}

          {/* Details */}
          <div className="mt-auto space-y-2 rounded-2xl border border-border/60 bg-muted/15 p-3">
            {user.department && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground">{humanizeLabel(user.department)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">{user.email}</span>
            </div>
          </div>

          {/* CTA */}
          <Button variant="outline" size="sm" className="w-full rounded-xl border-border/60 bg-transparent text-sm" asChild>
            <Link href="/dashboard/my-team">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Request via My Team
              <ArrowRight className="ml-auto h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SupervisorGrid({
  role,
  reduceMotion,
}: {
  role: "DOCTOR" | "TA"
  reduceMotion: boolean
}) {
  const [users, setUsers] = useState<ApiDirectoryUser[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError("")

    usersApi
      .directory({ role, search: deferredSearch || undefined, page, limit: 12 })
      .then((result) => {
        if (cancelled) return
        setUsers(result.items)
        setTotalPages(result.meta.totalPages || 1)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Couldn't load supervisors right now.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [role, deferredSearch, page])

  useEffect(() => {
    setPage(1)
  }, [deferredSearch])

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder={`Search ${role === "DOCTOR" ? "doctors" : "teaching assistants"} by name or department…`}
          className="h-12 pl-10 rounded-2xl border-border/60"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading supervisors…</p>
          </div>
        </div>
      ) : error ? (
        <Card className="border-destructive/25 bg-destructive/[0.04]">
          <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : users.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border/60 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight">No results found</h3>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Try a different name or clear the search to see all {role === "DOCTOR" ? "doctors" : "teaching assistants"}.
          </p>
          {search && (
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setSearch("")}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role}-${page}-${deferredSearch}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {users.map((user, index) => (
              <SupervisorCard
                key={user.id}
                user={user}
                delay={index * 0.04}
                reduceMotion={reduceMotion}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DiscoverPage() {
  const reduceMotion = Boolean(useReducedMotion())
  const { currentUser } = useAuthStore()
  const isLeader = currentUser?.role === "leader"

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6 xl:p-8">
      {/* Hero */}
      <motion.section
        {...getRevealMotion(reduceMotion)}
        className="overflow-hidden rounded-[32px] border border-border/70 bg-[linear-gradient(135deg,oklch(var(--primary)/0.08),transparent_38%),linear-gradient(180deg,oklch(var(--background)),oklch(var(--background)))] shadow-sm"
      >
        <div className="grid gap-8 px-5 py-6 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,1.3fr)_280px] lg:px-8 lg:py-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-primary/20 bg-background/80 text-primary">
                Supervisor Directory
              </Badge>
              {isLeader && (
                <Badge variant="secondary">Leader View</Badge>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Browse Doctors & Teaching Assistants
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Explore available supervisors, review their departments and expertise, then head to{" "}
                <span className="font-medium text-foreground">My Team → Supervisors</span> to send a formal request.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {isLeader && (
                <Button className="h-11 rounded-2xl px-5 shadow-lg shadow-primary/15" asChild>
                  <Link href="/dashboard/my-team">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Request a Supervisor
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="h-11 rounded-2xl px-5 bg-background/75" asChild>
                <Link href="/dashboard/teams">
                  <Users className="mr-2 h-4 w-4" />
                  Browse Teams
                </Link>
              </Button>
            </div>
          </div>

          {/* Side info panel */}
          <div className="hidden space-y-3 rounded-[24px] border border-border/60 bg-background/88 p-5 shadow-sm lg:flex lg:flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">How it works</p>
            {[
              { icon: Search, title: "Browse supervisors", body: "Find doctors and TAs that match your project area." },
              { icon: GraduationCap, title: "Check expertise", body: "Review department and bio to find the best match." },
              { icon: ShieldCheck, title: "Send request", body: "Go to My Team → Supervisors tab to send a formal invite." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/15 p-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Tabs for Doctor / TA */}
      <motion.div {...getRevealMotion(reduceMotion, 0.06)}>
        <Tabs defaultValue="doctor" className="space-y-5">
          <TabsList className="h-12 rounded-2xl border border-border/60 bg-background/90 p-1 shadow-sm">
            <TabsTrigger value="doctor" className="flex h-full items-center gap-2 rounded-xl px-5 text-sm font-medium data-[state=active]:shadow-sm">
              <BookOpen className="h-4 w-4" />
              Doctors
            </TabsTrigger>
            <TabsTrigger value="ta" className="flex h-full items-center gap-2 rounded-xl px-5 text-sm font-medium data-[state=active]:shadow-sm">
              <GraduationCap className="h-4 w-4" />
              Teaching Assistants
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doctor" className="mt-0">
            <SupervisorGrid role="DOCTOR" reduceMotion={reduceMotion} />
          </TabsContent>

          <TabsContent value="ta" className="mt-0">
            <SupervisorGrid role="TA" reduceMotion={reduceMotion} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
