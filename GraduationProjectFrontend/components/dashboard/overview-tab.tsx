"use client"

import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/stores/auth-store"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  CheckSquare,
  Users,
  TrendingUp,
  Trophy,
  Target,
  Clock,
  FolderOpen,
  FileText,
  Calendar,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Flame,
  Sparkles,
  Zap,
  GitBranch,
  Rocket,
  Activity,
} from "lucide-react"
import { teams } from "@/data/teams"
import { tasks } from "@/data/tasks"
import { getUserById } from "@/data/users"
import Link from "next/link"
import { useState } from "react"

export function OverviewTab() {
  const { currentUser } = useAuthStore()
  const isLeader = currentUser?.role === "leader"
  const [showAllTasks, setShowAllTasks] = useState(false)

  const myTeams = teams.filter((t) => currentUser?.id && t.memberIds?.includes(currentUser.id))
  const myTeam = myTeams[0]

  const myTasks = tasks.filter((t) => {
    if (!currentUser?.id) return false
    if ("assigneeIds" in t && Array.isArray(t.assigneeIds)) {
      return t.assigneeIds.includes(currentUser.id)
    }
    if ("assigneeId" in t) {
      return t.assigneeId === currentUser.id
    }
    return false
  })

  const myActiveTasks = myTasks.filter((t) => t.status !== "done")
  const myCompletedTasks = myTasks.filter((t) => t.status === "done")
  const teamTasks = myTeam ? tasks.filter((t) => t.teamId === myTeam.id) : []

  const myContribution = myTeam
    ? {
        totalTasks: myTasks.length,
        completedTasks: myCompletedTasks.length,
        completionRate: myTasks.length > 0 ? Math.round((myCompletedTasks.length / myTasks.length) * 100) : 0,
      }
    : null

  const upcomingDeadlines = myTasks
    .filter((t) => t.dueDate && new Date(t.dueDate) > new Date() && t.status !== "done")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, showAllTasks ? 10 : 3)

  const quickAccessCards = [
    {
      title: "My Tasks",
      count: myActiveTasks.length,
      icon: CheckSquare,
      href: "/dashboard/tasks",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Submissions",
      count: 3,
      icon: FileText,
      href: "/dashboard/submissions",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Meetings",
      count: 2,
      icon: Calendar,
      href: "/dashboard/meetings",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Files",
      count: 24,
      icon: FolderOpen,
      href: "/dashboard/files",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      title: "GitHub",
      count: 12,
      icon: GitBranch,
      href: "/dashboard/github",
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      gradient: "from-gray-500 to-slate-500",
    },
    {
      title: "Chat",
      count: 5,
      icon: MessageSquare,
      href: "/dashboard/chat",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      gradient: "from-pink-500 to-rose-500",
    },
  ]

  const recentActivity = [
    {
      id: "1",
      type: "task_completed",
      message: "Completed 'Database Schema Design'",
      time: "2 hours ago",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      id: "2",
      type: "task_assigned",
      message: "New task assigned: 'API Integration'",
      time: "5 hours ago",
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "3",
      type: "comment",
      message: "Team leader commented on your submission",
      time: "1 day ago",
      icon: MessageSquare,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      id: "4",
      type: "achievement",
      message: "Earned 'Code Warrior' badge",
      time: "2 days ago",
      icon: Trophy,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      id: "5",
      type: "milestone",
      message: "Milestone 2 completed successfully",
      time: "3 days ago",
      icon: Rocket,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
  ]

  const productivityStats = {
    tasksThisWeek: 8,
    tasksLastWeek: 5,
    hoursLogged: 32,
    codeCommits: 15,
    reviewsCompleted: 3,
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass-card p-6 md:p-8 border border-border/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Welcome back, <span className="gradient-text">{currentUser?.name?.split(" ")[0]}</span>
              </h2>
              <p className="text-muted-foreground mb-4">
                {isLeader
                  ? "Keep your team on track and motivated"
                  : "Continue your learning journey and achieve your goals"}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-orange-500/30"
                >
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{currentUser?.streak || 15} Day Streak</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-primary/30"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Level {currentUser?.level || 1}</span>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-green-500/30"
                >
                  <Zap className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{productivityStats.tasksThisWeek} tasks this week</span>
                </motion.div>
              </div>
            </div>

            {/* Mini Progress Ring */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted/20"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 251.2" }}
                    animate={{ strokeDasharray: `${(myContribution?.completionRate || 0) * 2.512} 251.2` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--secondary))" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{myContribution?.completionRate || 0}%</div>
                    <div className="text-xs text-muted-foreground">Done</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Active Tasks",
            value: myActiveTasks.length,
            icon: CheckSquare,
            description: `${myCompletedTasks.length} completed`,
            trend: { value: 12, isPositive: true },
          },
          {
            title: myTeam ? "Team Progress" : "Team Status",
            value: myTeam ? `${myTeam.progress}%` : "No Team",
            icon: Users,
            description: myTeam ? myTeam.name : "Join a team",
          },
          {
            title: "Contribution",
            value: myContribution ? `${myContribution.completionRate}%` : "0%",
            icon: TrendingUp,
            description: myContribution
              ? `${myContribution.completedTasks}/${myContribution.totalTasks} tasks`
              : "No tasks yet",
            trend: { value: 8, isPositive: true },
          },
          {
            title: "XP Earned",
            value: currentUser?.xp || 0,
            icon: Trophy,
            description: `Level ${currentUser?.level || 1}`,
            trend: { value: 150, isPositive: true },
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Quick Access</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {quickAccessCards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={card.href}>
                  <Card className="glass-card p-4 cursor-pointer group hover:border-primary/50 transition-all h-full">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} w-fit mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{card.title}</p>
                    <p className="text-2xl font-bold">{card.count}</p>
                  </Card>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Upcoming Deadlines
              </h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tasks">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((task, index) => {
                  const daysUntilDue = Math.ceil(
                    (new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                  )
                  const isUrgent = daysUntilDue <= 2

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${isUrgent ? "bg-destructive/5 border-destructive/30 hover:border-destructive/50" : "bg-muted/30 border-border/50 hover:border-primary/50"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isUrgent ? "bg-destructive/10" : "bg-orange-500/10"}`}>
                          <Clock className={`h-4 w-4 ${isUrgent ? "text-destructive" : "text-orange-500"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.dueDate!).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span
                              className={`text-xs font-medium ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}
                            >
                              {daysUntilDue === 0
                                ? "Due Today"
                                : daysUntilDue === 1
                                  ? "Due Tomorrow"
                                  : `${daysUntilDue} days left`}
                            </span>
                          </div>
                        </div>
                        <Badge variant={isUrgent ? "destructive" : "outline"} className="text-xs capitalize shrink-0">
                          {task.priority}
                        </Badge>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Recent Activity
              </h3>
              <Badge variant="secondary" className="animate-pulse">
                Live
              </Badge>
            </div>

            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {myTeam && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="glass-card p-6 rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{myTeam.name}</h3>
                  <p className="text-sm text-muted-foreground">{myTeam.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{myTeam.stage}</Badge>
                <Badge
                  variant={
                    myTeam.health === "healthy" ? "default" : myTeam.health === "at-risk" ? "secondary" : "destructive"
                  }
                >
                  {myTeam.health}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold">{myTeam.progress}%</div>
                <div className="text-xs text-muted-foreground">Progress</div>
                <Progress value={myTeam.progress} className="mt-2 h-1.5" />
              </div>
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold">{myTeam.memberIds.length}</div>
                <div className="text-xs text-muted-foreground">Members</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold">{teamTasks.length}</div>
                <div className="text-xs text-muted-foreground">Total Tasks</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 text-center">
                <div className="text-2xl font-bold">{teamTasks.filter((t) => t.status === "done").length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>

            {/* Team Members Avatars */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Team Members:</span>
                <div className="flex -space-x-2">
                  {myTeam.memberIds.slice(0, 5).map((memberId) => {
                    const member = getUserById(memberId)
                    return (
                      <Avatar key={memberId} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={member?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{member?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )
                  })}
                  {myTeam.memberIds.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                      +{myTeam.memberIds.length - 5}
                    </div>
                  )}
                </div>
              </div>
              <Button asChild>
                <Link href="/dashboard/my-team">
                  View Team Details
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
