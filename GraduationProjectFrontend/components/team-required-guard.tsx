"use client"

import type React from "react"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Search, Shield, Sparkles, UserPlus, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useMyTeamState } from "@/lib/hooks/use-my-team-state"

interface TeamRequiredStateProps {
  pageName: string
  pageDescription?: string
  icon?: React.ReactNode
}

interface TeamRequiredGuardProps extends TeamRequiredStateProps {
  children: React.ReactNode
}

export function TeamRequiredLoadingState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <h2 className="text-lg font-semibold">Checking your team access</h2>
        <p className="mt-2 text-sm text-muted-foreground">Loading your real team membership from the backend.</p>
      </Card>
    </div>
  )
}

export function TeamRequiredState({ pageName, pageDescription, icon }: TeamRequiredStateProps) {
  const { currentUser } = useAuthStore()
  const isLeader = currentUser?.role === "leader"

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full">
        <Card className="p-8 text-center border-dashed border-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6"
          >
            {icon || <Users className="h-10 w-10 text-primary" />}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold mb-2"
          >
            Team Required
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mb-6"
          >
            You need to {isLeader ? "create" : "join"} a team to access{" "}
            <span className="font-semibold text-foreground">{pageName}</span>.
            {pageDescription && <span className="block mt-1 text-sm">{pageDescription}</span>}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-muted/50 rounded-lg p-4 mb-6"
          >
            <p className="text-sm font-medium mb-3">What you unlock with a real team:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-green-500" />
                <span>Live member access</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span>Real invitations</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                <span>Connected team pages</span>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-amber-500" />
                <span>Directory visibility</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            {isLeader ? (
              <Link href="/dashboard/my-team">
                <Button className="gap-2 w-full sm:w-auto">
                  <UserPlus className="h-4 w-4" />
                  Create Your Team
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/dashboard/teams">
                  <Button className="gap-2 w-full sm:w-auto">
                    <Search className="h-4 w-4" />
                    Browse Teams
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard/my-team">
                  <Button variant="outline" className="gap-2 w-full sm:w-auto bg-transparent">
                    <UserPlus className="h-4 w-4" />
                    Join with Code
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 pt-6 border-t"
          >
            <p className="text-xs text-muted-foreground">
              {isLeader
                ? "Team leaders can create one team, share invite codes, and manage requests."
                : "Students can browse public teams, use invite codes, or accept direct invitations."}
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}

export function TeamRequiredGuard({ children, pageName, pageDescription, icon }: TeamRequiredGuardProps) {
  const { currentUser, hasHydrated } = useAuthStore()
  const { data, isLoading, error, refresh } = useMyTeamState()

  if (!hasHydrated) {
    return <TeamRequiredLoadingState />
  }

  const isStudent = currentUser?.role === "member" || currentUser?.role === "leader"

  if (!isStudent) {
    return <>{children}</>
  }

  if (isLoading) {
    return <TeamRequiredLoadingState />
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-destructive/25 bg-destructive/[0.04] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold">Couldn't verify your team access</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => void refresh()}>Try Again</Button>
            <Link href="/dashboard/my-team">
              <Button variant="outline" className="bg-transparent">Open My Team</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (data?.team) {
    return <>{children}</>
  }

  return <TeamRequiredState pageName={pageName} pageDescription={pageDescription} icon={icon} />
}
