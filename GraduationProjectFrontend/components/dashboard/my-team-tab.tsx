"use client"

import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Crown,
  AlertCircle,
  UserPlus,
  ArrowRight,
  CheckSquare,
  TrendingUp,
  Calendar,
  MessageSquare,
  FileText,
} from "lucide-react"
import { teams } from "@/data/teams"
import { getUserById } from "@/lib/stores/auth-store"
import { tasks } from "@/data/tasks"
import Link from "next/link"
import type { User } from "@/types"

const isUser = (u: unknown): u is User => !!u && typeof (u as User).id === "string"

export function MyTeamTab() {
  const { currentUser } = useAuthStore()
  const isLeader = currentUser?.role === "leader"

  const myTeams = teams.filter((t) => currentUser?.id && t.memberIds?.includes(currentUser.id))
  const myTeam = myTeams[0]

  if (!myTeam) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20"
      >
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Team Yet</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {isLeader
            ? "Create a team to start collaborating with other students"
            : "Join a team to collaborate on your graduation project"}
        </p>
        <Button asChild className="glow">
          <Link href="/dashboard/teams">
            <UserPlus className="h-4 w-4 mr-2" />
            {isLeader ? "Create Team" : "Browse Teams"}
          </Link>
        </Button>
      </motion.div>
    )
  }

  const members = myTeam.memberIds.map((id) => getUserById(id)).filter(isUser)
  const teamTasks = tasks.filter((t) => t.teamId === myTeam.id)
  const completedTasks = teamTasks.filter((t) => t.status === "done").length
  const completionRate = teamTasks.length > 0 ? Math.round((completedTasks / teamTasks.length) * 100) : 0

  const memberPerformance = members
    .map((member) => {
      const memberTasks = teamTasks.filter((t) => {
        if ("assigneeIds" in t && Array.isArray(t.assigneeIds)) {
          return t.assigneeIds.includes(member.id)
        }
        if ("assigneeId" in t) {
          return t.assigneeId === member.id
        }
        return false
      })
      const completed = memberTasks.filter((t) => t.status === "done").length
      const total = memberTasks.length
      return {
        member,
        tasksCompleted: completed,
        tasksTotal: total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.completionRate - a.completionRate)

  const quickActions = [
    {
      title: "Manage Tasks",
      icon: CheckSquare,
      href: `/dashboard/tasks?team=${myTeam.id}`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Team Chat",
      icon: MessageSquare,
      href: `/dashboard/chat?team=${myTeam.id}`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Schedule Meeting",
      icon: Calendar,
      href: `/dashboard/meetings?team=${myTeam.id}`,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Submissions",
      icon: FileText,
      href: "/dashboard/submissions",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{myTeam.name}</h2>
              <p className="text-muted-foreground">{myTeam.description}</p>
            </div>
          </div>
          <Badge>{myTeam.stage}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Team Progress</p>
            <div className="flex items-center gap-2">
              <Progress value={myTeam.progress} className="flex-1" />
              <span className="text-sm font-medium">{myTeam.progress}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Completion Rate</p>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks}/{teamTasks.length} tasks
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Team Size</p>
            <div className="text-2xl font-bold">
              {members.length}/{myTeam.maxMembers || 5}
            </div>
            <p className="text-xs text-muted-foreground">members</p>
          </div>
        </div>

        {isLeader && (
          <Button asChild className="w-full sm:w-auto glow">
            <Link href="/dashboard/my-team">
              <Crown className="h-4 w-4 mr-2" />
              Team Leader Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.03, y: -4 }}
              >
                <Link href={action.href}>
                  <Card className="glass-card p-4 cursor-pointer group hover:border-primary/50 transition-all">
                    <div
                      className={`p-3 rounded-lg ${action.bgColor} w-fit mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">{action.title}</p>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Team Members */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="text-lg font-semibold mb-4">Team Members</h3>
        <Card className="glass-card p-6">
          <div className="space-y-3">
            {memberPerformance.map((data, index) => {
              const member = data.member
              const isTeamLeader = member.id === myTeam.leaderId

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted/30 transition-all"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{member.name}</p>
                      {isTeamLeader && (
                        <Badge variant="default" className="gap-1">
                          <Crown className="h-3 w-3" />
                          Leader
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {data.tasksCompleted}/{data.tasksTotal} tasks
                      </span>
                      <span>•</span>
                      <span>{data.completionRate}% completion</span>
                    </div>
                    <Progress value={data.completionRate} className="mt-2 h-1.5" />
                  </div>

                  {index === 0 && (
                    <Badge variant="outline" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Top Performer
                    </Badge>
                  )}
                </motion.div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      {/* Tech Stack */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3 className="text-lg font-semibold mb-4">Tech Stack</h3>
        <Card className="glass-card p-6">
          <div className="flex flex-wrap gap-2">
            {myTeam.stack.map((tech, index) => (
              <motion.div
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.03 }}
                whileHover={{ scale: 1.1 }}
              >
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {tech}
                </Badge>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
