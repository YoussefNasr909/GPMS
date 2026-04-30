"use client"

import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CheckSquare,
  Users,
  AlertCircle,
  Calendar,
  Trophy,
  Award,
  FileText,
  ArrowRight,
  AlertTriangle,
  Bell,
  MessageSquare,
  Settings,
  CheckCircle,
  Video,
  Sparkles,
  Flame,
  Clock,
  Activity,
  BarChart3,
  Crown,
  Shield,
  GraduationCap,
  BookOpen,
  Server,
  Target,
  Zap,
  GitBranch,
  FolderOpen,
  Database,
  Download,
  Upload,
  ChevronRight,
  Plus,
  HelpCircle,
  Check,
  ClipboardList,
  ClipboardCheck,
  UserPlus,
  Users2,
  HardDrive,
  Coins,
  Megaphone,
  MessageCircle,
} from "lucide-react"
import { teams } from "@/data/teams"
import { users, getUserById } from "@/data/users"
import { proposals } from "@/data/proposals"
import { tasks } from "@/data/tasks"
import { meetings } from "@/data/meetings"
import { usersApi } from "@/lib/api/users"
import { teamsApi } from "@/lib/api/teams"
import { useMyTeamState } from "@/lib/hooks/use-my-team-state"
import { getFullName, getTeamProgressFallback } from "@/lib/team-display"
import type { UsersSummary } from "@/lib/api/types"
import NextLink from "next/link"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { currentUser } = useAuthStore()

  if (!currentUser) {
    return null
  }

  // Student (member)
  if (currentUser.role === "member") {
    return <StudentMemberDashboard />
  }

  // Team Leader
  if (currentUser.role === "leader") {
    return <TeamLeaderDashboard />
  }

  // Doctor/Professor
  if (currentUser.role === "doctor") {
    return <DoctorDashboard />
  }

  // Teaching Assistant
  if (currentUser.role === "ta") {
    return <TADashboard />
  }

  // Admin
  if (currentUser.role === "admin") {
    return <AdminDashboard />
  }

  return null
}

// ============================================
// STUDENT MEMBER DASHBOARD
// ============================================
function StudentMemberDashboard() {
  const { currentUser } = useAuthStore()
  const { data: myTeamState } = useMyTeamState()
  const [greeting, setGreeting] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [availableTeamCount, setAvailableTeamCount] = useState(0)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 17) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (myTeamState?.team) return

    let cancelled = false
    teamsApi
      .list({ limit: 1, availability: "open" })
      .then((result) => {
        if (!cancelled) setAvailableTeamCount(result.meta.total)
      })
      .catch(() => {
        if (!cancelled) setAvailableTeamCount(0)
      })

    return () => {
      cancelled = true
    }
  }, [myTeamState?.team])

  const liveTeam = myTeamState?.team ?? null
  const teamMembersPreview =
    liveTeam?.members.map((member) => ({
      id: member.user.id,
      name: getFullName(member.user),
      avatar: member.user.avatarUrl,
    })) ?? []
  const myTeam = liveTeam
    ? {
        id: liveTeam.id,
        name: liveTeam.name,
        description: liveTeam.bio,
        progress: getTeamProgressFallback(liveTeam),
        memberIds: liveTeam.members.map((member) => member.user.id),
        stage: liveTeam.stage.toLowerCase().replaceAll("_", "-"),
        health: liveTeam.isFull ? "at-risk" : "healthy",
        stack: liveTeam.stack,
      }
    : null
  const hasTeam = !!myTeam

  const myTasks = tasks.filter((t) => {
    if (!currentUser?.id) return false
    if ("assigneeId" in t) return t.assigneeId === currentUser.id
    if ("assigneeIds" in t && Array.isArray(t.assigneeIds)) return t.assigneeIds.includes(currentUser.id)
    return false
  })
  const activeTasks = myTasks.filter((t) => t.status !== "done")
  const completedTasks = myTasks.filter((t) => t.status === "done")
  const upcomingMeetings = meetings.filter((m) => new Date(m.date) > new Date()).slice(0, 3)

  const quickLinks = hasTeam
    ? [
        {
          title: "My Tasks",
          icon: CheckSquare,
          href: "/dashboard/tasks",
          count: activeTasks.length,
          color: "from-blue-600 to-indigo-600",
          description: "View and manage your tasks",
        },
        {
          title: "My Team",
          icon: Users,
          href: "/dashboard/my-team",
          count: myTeam?.memberIds.length || 0,
          color: "from-purple-600 to-pink-600",
          description: "Team collaboration",
        },
        {
          title: "Calendar",
          icon: Calendar,
          href: "/dashboard/calendar",
          count: upcomingMeetings.length,
          color: "from-orange-500 to-amber-500",
          description: "Upcoming events",
        },
        {
          title: "Chat",
          icon: MessageSquare,
          href: "/dashboard/chat",
          count: 3,
          color: "from-emerald-600 to-green-600",
          description: "Team messages",
        },
        {
          title: "Files",
          icon: FolderOpen,
          href: "/dashboard/files",
          count: 24,
          color: "from-indigo-600 to-violet-600",
          description: "Project documents",
        },
        {
          title: "GitHub",
          icon: GitBranch,
          href: "/dashboard/github",
          count: 12, // Changed from 8
          color: "from-slate-600 to-slate-800",
          description: "Code repository",
        },
        {
          title: "Submissions",
          icon: Upload, // Changed from FileText
          href: "/dashboard/submissions",
          count: 2,
          color: "from-sky-600 to-blue-600",
          description: "Submit deliverables", // Changed description
        },
        {
          title: "Gamification",
          icon: Trophy,
          href: "/dashboard/gamification",
          count: currentUser?.xp || 0,
          color: "from-yellow-500 to-orange-500",
          description: "XP & achievements", // Changed description
        },
      ]
    : [
        // Student without team - show join team options
        {
          title: "Join Team",
          icon: UserPlus,
          href: "/dashboard/teams",
          count: availableTeamCount,
          color: "from-purple-500 to-pink-500",
          description: "Browse & join a team",
        },
        {
          title: "Browse Teams",
          icon: Users,
          href: "/dashboard/teams",
          count: availableTeamCount,
          color: "from-blue-600 to-indigo-600",
          description: "View available teams",
        },
        {
          title: "Calendar",
          icon: Calendar,
          href: "/dashboard/calendar",
          count: upcomingMeetings.length,
          color: "from-orange-500 to-amber-500",
          description: "Academic calendar",
        },
        {
          title: "Chat",
          icon: MessageSquare,
          href: "/dashboard/chat",
          count: 0,
          color: "from-emerald-600 to-green-600",
          description: "Messages",
        },
        {
          title: "Resources",
          icon: BookOpen,
          href: "/dashboard/resources",
          count: 15,
          color: "from-indigo-500 to-violet-500",
          description: "Learning materials",
        },
        {
          title: "Discussions",
          icon: MessageCircle, // Added icon
          href: "/dashboard/discussions",
          count: 8,
          color: "from-sky-600 to-blue-600",
          description: "Community forums",
        },
        {
          title: "Gamification",
          icon: Trophy,
          href: "/dashboard/gamification",
          count: currentUser?.xp || 0,
          color: "from-yellow-500 to-orange-500",
          description: "XP & achievements",
        },
        {
          title: "Settings",
          icon: Settings,
          href: "/dashboard/settings",
          count: 0,
          color: "from-gray-500 to-gray-700", // Changed color
          description: "Profile settings",
        },
      ]

  const recentActivities = [
    {
      id: 1,
      type: "task",
      message: "Completed 'Database Schema Design'",
      time: "2 hours ago",
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      id: 2,
      type: "comment",
      message: "New comment on your submission",
      time: "4 hours ago",
      icon: MessageSquare,
      color: "text-blue-500",
    },
    {
      id: 3,
      type: "meeting",
      message: "Meeting scheduled with Dr. Ahmed",
      time: "6 hours ago",
      icon: Video,
      color: "text-purple-500",
    },
    {
      id: 4,
      type: "achievement",
      message: "Earned 'Code Warrior' badge",
      time: "1 day ago",
      icon: Award,
      color: "text-amber-500",
    },
    {
      id: 5,
      type: "xp",
      message: "Gained 150 XP for task completion",
      time: "1 day ago",
      icon: Sparkles,
      color: "text-pink-500",
    },
  ]

  const upcomingDeadlines = myTasks
    .filter((t) => t.dueDate && new Date(t.dueDate) > new Date() && t.status !== "done")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass-card p-6 md:p-8 border border-border/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 items-center justify-between">
            <div className="flex items-start gap-4">
              <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="relative">
                <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-xl">
                  <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                    {currentUser?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-green-500 border-2 border-background">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              </motion.div>

              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground mb-1"
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <span className="font-mono text-primary">{currentTime.toLocaleTimeString()}</span>
                </motion.div>

                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {greeting}, <span className="text-primary">{currentUser?.name}</span>!
                </h1>
                <p className="text-muted-foreground">Ready to continue your learning journey today?</p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge variant="outline" className="gap-1 border-orange-500/50 text-orange-600">
                    <Flame className="h-3 w-3" /> {currentUser?.streak || 15} Day Streak
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                    <Sparkles className="h-3 w-3" /> Level {currentUser?.level || 8}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-600">
                    <Trophy className="h-3 w-3" /> {currentUser?.xp || 1800} XP
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-yellow-500/50 text-yellow-600">
                    <Coins className="h-3 w-3" /> {currentUser?.gold || 290} Gold
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-3">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-blue-500/20"
              >
                <div className="text-3xl font-bold text-blue-500">{activeTasks.length}</div>
                <div className="text-xs text-muted-foreground">Active Tasks</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-green-500/20"
              >
                <div className="text-3xl font-bold text-green-500">{completedTasks.length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-purple-500/20"
              >
                <div className="text-3xl font-bold text-purple-500">{myTeam?.progress || 0}%</div>
                <div className="text-xs text-muted-foreground">Progress</div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Access Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Access
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <NextLink href="/dashboard/settings">
              <Settings className="h-4 w-4 mr-1" /> Customize
            </NextLink>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <NextLink href={link.href}>
                <Card className="glass-card p-4 h-full cursor-pointer group hover:border-primary/50 transition-all overflow-hidden relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${link.color} group-hover:scale-110 transition-transform`}
                      >
                        <link.icon className="h-5 w-5 text-white" />
                      </div>
                      {link.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {link.count}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{link.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                  </div>
                  <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Card>
              </NextLink>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Tasks & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Progress Card */}
          {myTeam && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass-card p-6 rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{myTeam.name}</h3>
                        <p className="text-sm text-muted-foreground">{myTeam.description?.slice(0, 50)}...</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="bg-transparent">
                      <NextLink href="/dashboard/my-team">
                        View Team <ArrowRight className="h-4 w-4 ml-1" />
                      </NextLink>
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <div className="text-2xl font-bold">{myTeam.progress}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <div className="text-2xl font-bold">{myTeam.memberIds.length}</div>
                      <div className="text-xs text-muted-foreground">Members</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <div className="text-2xl font-bold capitalize">{myTeam.stage}</div>
                      <div className="text-xs text-muted-foreground">Stage</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/30">
                      <Badge
                        variant={
                          myTeam.health === "healthy"
                            ? "default"
                            : myTeam.health === "at-risk"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {myTeam.health}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">Health</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Overall Progress</span>
                      <span className="font-medium">{myTeam.progress}%</span>
                    </div>
                    <Progress value={myTeam.progress} className="h-2" />
                  </div>

                  {/* Team Members Preview */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                    <div className="flex -space-x-2">
                      {teamMembersPreview.slice(0, 5).map((member) => {
                        return (
                          <TooltipProvider key={member.id}>
                            <Tooltip>
                              <TooltipTrigger>
                                <Avatar className="h-8 w-8 border-2 border-background">
                                  <AvatarImage src={member.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent>{member.name}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Tech Stack:</span>
                      {myTeam.stack?.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Upcoming Deadlines */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" /> Upcoming Deadlines
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <NextLink href="/dashboard/tasks">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </NextLink>
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
                        transition={{ delay: 0.4 + index * 0.05 }}
                        whileHover={{ x: 4 }}
                        className={cn(
                          "p-4 rounded-xl border transition-all cursor-pointer",
                          isUrgent
                            ? "bg-destructive/5 border-destructive/30 hover:border-destructive/50"
                            : "bg-muted/30 border-border/50 hover:border-primary/50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", isUrgent ? "bg-destructive/10" : "bg-orange-500/10")}>
                              {isUrgent ? (
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                              ) : (
                                <Clock className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{task.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{new Date(task.dueDate!).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className={isUrgent ? "text-destructive font-medium" : ""}>
                                  {daysUntilDue === 0
                                    ? "Due Today"
                                    : daysUntilDue === 1
                                      ? "Due Tomorrow"
                                      : `${daysUntilDue} days left`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={isUrgent ? "destructive" : "outline"} className="capitalize">
                            {task.priority}
                          </Badge>
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="text-muted-foreground">No upcoming deadlines. Great job!</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right Column - Activity & Meetings */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" /> Recent Activity
                </h3>
                <Badge variant="secondary" className="animate-pulse">
                  Live
                </Badge>
              </div>

              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all cursor-pointer"
                  >
                    <div className={cn("p-2 rounded-lg", `bg-${activity.color.replace("text-", "")}/10`)}>
                      <activity.icon className={cn("h-4 w-4", activity.color)} />
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

          {/* Upcoming Meetings */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" /> Upcoming Meetings
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <NextLink href="/dashboard/calendar">
                    <Calendar className="h-4 w-4" />
                  </NextLink>
                </Button>
              </div>

              <div className="space-y-3">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((meeting, index) => (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-purple-500/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Video className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{meeting.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {meeting.type}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* XP Progress */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" /> Level Progress
                </h3>
                <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                  Level {currentUser?.level || 8}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{currentUser?.xp || 1800} XP</span>
                  <span className="text-muted-foreground">2000 XP to Level {(currentUser?.level || 8) + 1}</span>
                </div>
                <Progress value={((currentUser?.xp || 1800) % 500) / 5} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {500 - ((currentUser?.xp || 1800) % 500)} XP until next level
                </p>
              </div>

              <Button className="w-full mt-4 gap-2 bg-transparent" variant="outline" asChild>
                <NextLink href="/dashboard/gamification">
                  <Sparkles className="h-4 w-4" /> View Achievements
                </NextLink>
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TEAM LEADER DASHBOARD
// ============================================
function TeamLeaderDashboard() {
  const { currentUser } = useAuthStore()
  const { data: myTeamState } = useMyTeamState()
  const [greeting, setGreeting] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 17) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const liveTeam = myTeamState?.team ?? null
  const myTeam = liveTeam
    ? {
        id: liveTeam.id,
        name: liveTeam.name,
        description: liveTeam.bio,
        progress: getTeamProgressFallback(liveTeam),
        memberIds: liveTeam.members.map((member) => member.user.id),
        stage: liveTeam.stage.toLowerCase().replaceAll("_", "-"),
        health: liveTeam.isFull ? "at-risk" : "healthy",
        stack: liveTeam.stack,
      }
    : null
  const teamMembers =
    liveTeam?.members.map((member) => ({
      id: member.user.id,
      name: getFullName(member.user),
      email: member.user.email,
      avatar: member.user.avatarUrl,
      bio: member.user.bio,
    })) || []
  const teamTasks = myTeam ? tasks.filter((t) => t.teamId === myTeam.id) : []
  const activeTasks = teamTasks.filter((t) => t.status !== "done")
  const completedTasks = teamTasks.filter((t) => t.status === "done")
  const overdueTasks = teamTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done")
  const upcomingMeetings = meetings
    .filter((m) => myTeam && m.teamId === myTeam.id && new Date(m.date) > new Date())
    .slice(0, 3)

  const quickLinks = [
    {
      title: "Team Tasks",
      icon: CheckSquare,
      href: "/dashboard/tasks",
      count: activeTasks.length,
      color: "from-blue-500 to-cyan-500",
      description: "Manage team tasks",
      urgent: overdueTasks.length > 0,
    },
    {
      title: "My Team",
      icon: Users,
      href: "/dashboard/my-team",
      count: teamMembers.length,
      color: "from-purple-500 to-pink-500",
      description: "Team management",
    },
    {
      title: "Calendar",
      icon: Calendar,
      href: "/dashboard/calendar",
      count: upcomingMeetings.length,
      color: "from-orange-500 to-amber-500",
      description: "Schedule & meetings",
    },
    {
      title: "Chat",
      icon: MessageSquare,
      href: "/dashboard/chat",
      count: 5,
      color: "from-green-500 to-emerald-500",
      description: "Team communication",
    },
    {
      title: "Files",
      icon: FolderOpen,
      href: "/dashboard/files",
      count: 32,
      color: "from-indigo-500 to-violet-500",
      description: "Project documents",
    },
    {
      title: "GitHub",
      icon: GitBranch,
      href: "/dashboard/github",
      count: 15,
      color: "from-gray-600 to-gray-800",
      description: "Repository & PRs",
    },
    {
      title: "Submissions",
      icon: FileText,
      href: "/dashboard/submissions",
      count: 3,
      color: "from-teal-500 to-cyan-500",
      description: "Project deliverables",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      count: 0,
      color: "from-rose-500 to-pink-500",
      description: "Team performance",
    },
  ]

  const memberPerformance = teamMembers.map((member) => {
    const memberTasks = teamTasks.filter((t) => {
      if ("assigneeId" in t) return t.assigneeId === member?.id
      if ("assigneeIds" in t && Array.isArray(t.assigneeIds)) return t.assigneeIds.includes(member?.id || "")
      return false
    })
    const completed = memberTasks.filter((t) => t.status === "done").length
    return {
      ...member,
      totalTasks: memberTasks.length,
      completedTasks: completed,
      completionRate: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0,
    }
  })

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass-card p-6 md:p-8 border border-border/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-orange-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 items-center justify-between">
            <div className="flex items-start gap-4">
              <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="relative">
                <Avatar className="h-20 w-20 border-4 border-purple-500/20 shadow-xl">
                  <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {currentUser?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-purple-500 border-2 border-background">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              </motion.div>

              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground mb-1"
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <span className="font-mono text-primary">{currentTime.toLocaleTimeString()}</span>
                </motion.div>

                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {greeting}, <span className="text-primary">{currentUser?.name}</span>!
                </h1>
                <p className="text-muted-foreground">Lead your team to success and track progress</p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    <Crown className="h-3 w-3" /> Team Leader
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-orange-500/50 text-orange-600">
                    <Flame className="h-3 w-3" /> {currentUser?.streak || 7} Day Streak
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-600">
                    <Trophy className="h-3 w-3" /> {currentUser?.xp || 2850} XP
                  </Badge>
                </div>
              </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-3">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-purple-500/20"
              >
                <div className="text-2xl font-bold text-purple-500">{teamMembers.length}</div>
                <div className="text-xs text-muted-foreground">Members</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-blue-500/20"
              >
                <div className="text-2xl font-bold text-blue-500">{activeTasks.length}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-green-500/20"
              >
                <div className="text-2xl font-bold text-green-500">{completedTasks.length}</div>
                <div className="text-xs text-muted-foreground">Done</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-orange-500/20"
              >
                <div className="text-2xl font-bold text-orange-500">{myTeam?.progress || 0}%</div>
                <div className="text-xs text-muted-foreground">Progress</div>
              </motion.div>
            </div>
          </div>

          {/* Team Health Banner */}
          {myTeam && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "mt-6 p-4 rounded-xl flex items-center justify-between",
                myTeam.health === "healthy"
                  ? "bg-green-500/10 border border-green-500/30"
                  : myTeam.health === "at-risk"
                    ? "bg-yellow-500/10 border border-yellow-500/30"
                    : "bg-red-500/10 border border-red-500/30",
              )}
            >
              <div className="flex items-center gap-3">
                {myTeam.health === "healthy" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : myTeam.health === "at-risk" ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <h4 className="font-medium">{myTeam.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {myTeam.health === "healthy"
                      ? "Team is performing well!"
                      : myTeam.health === "at-risk"
                        ? "Some tasks need attention"
                        : "Immediate action required"}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  myTeam.health === "healthy" ? "default" : myTeam.health === "at-risk" ? "secondary" : "destructive"
                }
              >
                {myTeam.health}
              </Badge>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Quick Access Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Access
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <NextLink href={link.href}>
                <Card
                  className={cn(
                    "glass-card p-4 h-full cursor-pointer group hover:border-primary/50 transition-all overflow-hidden relative",
                    link.urgent && "border-destructive/50",
                  )}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${link.color} group-hover:scale-110 transition-transform`}
                      >
                        <link.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        {link.urgent && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                          </span>
                        )}
                        {link.count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {link.count}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{link.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                  </div>
                </Card>
              </NextLink>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Team Members Performance */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" /> Team Performance
                </h3>
                <Button variant="outline" size="sm" asChild className="bg-transparent">
                  <NextLink href="/dashboard/my-team">
                    Manage Team <ArrowRight className="h-4 w-4 ml-1" />
                  </NextLink>
                </Button>
              </div>

              <div className="space-y-4">
                {memberPerformance.map((member, index) => (
                  <motion.div
                    key={member?.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-background">
                        <AvatarImage src={member?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{member?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{member?.name}</h4>
                          {member?.id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member?.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{member?.completionRate}%</div>
                        <div className="text-xs text-muted-foreground">
                          {member?.completedTasks}/{member?.totalTasks} tasks
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={member?.completionRate} className="h-2" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Overdue Tasks Alert */}
          {overdueTasks.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <Card className="glass-card p-6 rounded-2xl bg-destructive/5 border-destructive/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" /> Overdue Tasks
                  </h3>
                  <Badge variant="destructive">{overdueTasks.length} overdue</Badge>
                </div>

                <div className="space-y-3">
                  {overdueTasks.slice(0, 3).map((task) => {
                    const assignee = "assigneeId" in task ? getUserById(task.assigneeId || "") : null
                    return (
                      <div key={task.id} className="p-3 rounded-lg bg-background/50 border border-destructive/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(task.dueDate!).toLocaleDateString()} • Assigned to:{" "}
                              {assignee?.name || "Unassigned"}
                            </p>
                          </div>
                          <Button size="sm" variant="destructive">
                            Resolve
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Project Progress */}
          {myTeam && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
              <Card className="glass-card p-6 rounded-2xl">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" /> Project Progress
                </h3>

                <div className="space-y-4">
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall</span>
                      <span className="text-sm font-bold">{myTeam.progress}%</span>
                    </div>
                    <Progress value={myTeam.progress} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                      <div className="text-xl font-bold text-blue-500">{activeTasks.length}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 text-center">
                      <div className="text-xl font-bold text-green-500">{completedTasks.length}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Stage</span>
                      <Badge variant="outline" className="capitalize">
                        {myTeam.stage}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Upcoming Meetings */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" /> Upcoming Meetings
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <NextLink href="/dashboard/meetings">
                    <Plus className="h-4 w-4" />
                  </NextLink>
                </Button>
              </div>

              <div className="space-y-3">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Video className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{meeting.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(meeting.date).toLocaleDateString()} • {meeting.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                    <Button size="sm" className="mt-2" asChild>
                      <NextLink href="/dashboard/meetings">Schedule Meeting</NextLink>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DOCTOR/PROFESSOR DASHBOARD
// ============================================
function DoctorDashboard() {
  const { currentUser } = useAuthStore()
  const [greeting, setGreeting] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 17) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { data: myTeamState } = useMyTeamState()
  const supervisedTeams = myTeamState?.supervisedTeams || []
  
  // Calculate analytics securely from real API data
  const healthyTeams = supervisedTeams.filter((t) => !t.isFull).length // Fallback heuristic
  const atRiskTeams = supervisedTeams.filter((t) => t.isFull && t.stage === "REQUIREMENTS").length
  const criticalTeams = 0
  const totalStudents = supervisedTeams.reduce((sum, t) => sum + t.memberCount, 0)
  const avgProgress = supervisedTeams.reduce((sum, t) => sum + getTeamProgressFallback(t), 0) / (supervisedTeams.length || 1)

  const pendingProposals = (myTeamState?.supervisorRequestsReceived || []).filter(
    (r) => r.status === "PENDING"
  )
  
  // Fake meetings using empty array context
  const upcomingMeetings = meetings
    .filter((m) => supervisedTeams.some((t) => t.id === m.teamId) && new Date(m.date) > new Date())
    .slice(0, 5)

  const quickLinks = [
    {
      title: "All Teams",
      icon: Users,
      href: "/dashboard/teams",
      count: supervisedTeams.length,
      color: "from-blue-500 to-cyan-500",
      description: "Supervised teams",
    },
    {
      title: "Proposals",
      icon: FileText,
      href: "/dashboard/proposals",
      count: pendingProposals.length,
      color: "from-orange-500 to-amber-500",
      description: "Review submissions",
      urgent: pendingProposals.length > 0,
    },
    {
      title: "Evaluations",
      icon: ClipboardCheck,
      href: "/dashboard/evaluations",
      count: 4,
      color: "from-purple-500 to-pink-500",
      description: "Grade & feedback",
    },
    {
      title: "Calendar",
      icon: Calendar,
      href: "/dashboard/calendar",
      count: upcomingMeetings.length,
      color: "from-green-500 to-emerald-500",
      description: "Schedule",
    },
    {
      title: "Discussions",
      icon: MessageSquare,
      href: "/dashboard/discussions",
      count: 8,
      color: "from-indigo-500 to-violet-500",
      description: "Team discussions",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      count: 0,
      color: "from-rose-500 to-pink-500",
      description: "Performance metrics",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      count: 0,
      color: "from-gray-500 to-slate-500",
      description: "Preferences",
    },
    {
      title: "Help",
      icon: HelpCircle,
      href: "/dashboard/help",
      count: 0,
      color: "from-teal-500 to-cyan-500",
      description: "Support & FAQ",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass-card p-6 md:p-8 border border-border/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 items-center justify-between">
            <div className="flex items-start gap-4">
              <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="relative">
                <Avatar className="h-20 w-20 border-4 border-blue-500/20 shadow-xl">
                  <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    {currentUser?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-500 border-2 border-background">
                  <GraduationCap className="w-3 h-3 text-white" />
                </div>
              </motion.div>

              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground mb-1"
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <span className="font-mono text-primary">{currentTime.toLocaleTimeString()}</span>
                </motion.div>

                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {greeting}, <span className="text-primary">{currentUser?.name}</span>!
                </h1>
                <p className="text-muted-foreground">Monitor and guide your supervised teams to excellence</p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge className="gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                    <GraduationCap className="h-3 w-3" /> Professor
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    {currentUser?.department}
                  </Badge>
                  {currentUser?.expertise?.slice(0, 2).map((exp) => (
                    <Badge key={exp} variant="secondary" className="text-xs">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-3">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-blue-500/20"
              >
                <div className="text-2xl font-bold text-blue-500">{supervisedTeams.length}</div>
                <div className="text-xs text-muted-foreground">Teams</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-purple-500/20"
              >
                <div className="text-2xl font-bold text-purple-500">{totalStudents}</div>
                <div className="text-xs text-muted-foreground">Students</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-orange-500/20"
              >
                <div className="text-2xl font-bold text-orange-500">{pendingProposals.length}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-green-500/20"
              >
                <div className="text-2xl font-bold text-green-500">{Math.round(avgProgress)}%</div>
                <div className="text-xs text-muted-foreground">Avg Progress</div>
              </motion.div>
            </div>
          </div>

          {/* Alert Banner */}
          {(pendingProposals.length > 0 || atRiskTeams > 0 || criticalTeams > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <h4 className="font-medium">Action Required</h4>
                  <p className="text-sm text-muted-foreground">
                    {pendingProposals.length > 0 && `${pendingProposals.length} proposals pending review. `}
                    {(atRiskTeams > 0 || criticalTeams > 0) && `${atRiskTeams + criticalTeams} teams need attention.`}
                  </p>
                </div>
              </div>
              <Button size="sm" asChild>
                <NextLink href="/dashboard/proposals">Review Now</NextLink>
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Quick Access Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Access
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <NextLink href={link.href}>
                <Card
                  className={cn(
                    "glass-card p-4 h-full cursor-pointer group hover:border-primary/50 transition-all overflow-hidden relative",
                    link.urgent && "border-orange-500/50",
                  )}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${link.color} group-hover:scale-110 transition-transform`}
                      >
                        <link.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex items-center gap-1">
                        {link.urgent && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                          </span>
                        )}
                        {link.count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {link.count}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{link.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                  </div>
                </Card>
              </NextLink>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Teams List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" /> Supervised Teams
              </h3>
              <Button variant="outline" size="sm" asChild className="bg-transparent">
                <NextLink href="/dashboard/teams">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </NextLink>
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {supervisedTeams.map((team, index) => {
                  const leader = team.leader
                  const progress = getTeamProgressFallback(team)
                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={leader?.avatarUrl || "/placeholder.svg"} />
                            <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{team.name}</h4>
                            <p className="text-xs text-muted-foreground">Led by {leader?.fullName}</p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            !team.isFull
                              ? "default"
                              : team.stage === "REQUIREMENTS"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {!team.isFull ? "healthy" : "at-risk"}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>{team.memberCount} members</span>
                        <Badge variant="outline" className="capitalize">
                          {team.stage}
                        </Badge>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </ScrollArea>
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Team Health Overview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" /> Team Health
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Healthy</span>
                  </div>
                  <span className="font-bold text-green-500">{healthyTeams}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>At Risk</span>
                  </div>
                  <span className="font-bold text-yellow-500">{atRiskTeams}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>Critical</span>
                  </div>
                  <span className="font-bold text-red-500">{criticalTeams}</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Upcoming Meetings */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" /> Schedule
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <NextLink href="/dashboard/calendar">
                    <Plus className="h-4 w-4" />
                  </NextLink>
                </Button>
              </div>

              <div className="space-y-3">
                {upcomingMeetings.slice(0, 4).map((meeting) => {
                  const team = teams.find((t) => t.id === meeting.teamId)
                  return (
                    <div key={meeting.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Video className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{meeting.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {team?.name} • {new Date(meeting.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TEACHING ASSISTANT DASHBOARD
// ============================================
function TADashboard() {
  const { currentUser } = useAuthStore()
  const [greeting, setGreeting] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 17) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const { data: myTeamState } = useMyTeamState()
  const supervisedTeams = myTeamState?.supervisedTeams || []
  
  const totalStudents = supervisedTeams.reduce((sum, t) => sum + t.memberCount, 0)
  const healthyTeams = supervisedTeams.filter((t) => !t.isFull).length // Fallback heuristic
  const avgProgress = supervisedTeams.reduce((sum, t) => sum + getTeamProgressFallback(t), 0) / (supervisedTeams.length || 1)
  
  // Fake meetings using empty array context
  const upcomingMeetings = meetings
    .filter((m) => supervisedTeams.some((t) => t.id === m.teamId) && new Date(m.date) > new Date())
    .slice(0, 5)

  const quickLinks = [
    {
      title: "My Teams",
      icon: Users,
      href: "/dashboard/teams",
      count: supervisedTeams.length,
      color: "from-blue-500 to-cyan-500",
      description: "Assigned teams",
    },
    {
      title: "Calendar",
      icon: Calendar,
      href: "/dashboard/calendar",
      count: upcomingMeetings.length,
      color: "from-green-500 to-emerald-500",
      description: "Schedule & meetings",
    },
    {
      title: "Discussions",
      icon: MessageSquare,
      href: "/dashboard/discussions",
      count: 12,
      color: "from-purple-500 to-pink-500",
      description: "Team discussions",
    },
    {
      title: "Evaluations",
      icon: ClipboardCheck,
      href: "/dashboard/evaluations",
      count: 3,
      color: "from-orange-500 to-amber-500",
      description: "Grade submissions",
    },
    {
      title: "Files",
      icon: FolderOpen,
      href: "/dashboard/files",
      count: 45,
      color: "from-indigo-500 to-violet-500",
      description: "Team documents",
    },
    {
      title: "Chat",
      icon: MessageSquare,
      href: "/dashboard/chat",
      count: 8,
      color: "from-teal-500 to-cyan-500",
      description: "Direct messages",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      count: 0,
      color: "from-rose-500 to-pink-500",
      description: "Performance",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      count: 0,
      color: "from-gray-500 to-slate-500",
      description: "Preferences",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass-card p-6 md:p-8 border border-border/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-blue-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/20 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 items-center justify-between">
            <div className="flex items-start gap-4">
              <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="relative">
                <Avatar className="h-20 w-20 border-4 border-teal-500/20 shadow-xl">
                  <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
                    {currentUser?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-teal-500 border-2 border-background">
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
              </motion.div>

              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground mb-1"
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <span className="font-mono text-primary">{currentTime.toLocaleTimeString()}</span>
                </motion.div>

                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {greeting}, <span className="text-primary">{currentUser?.name}</span>!
                </h1>
                <p className="text-muted-foreground">Support your teams and help students succeed</p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge className="gap-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0">
                    <BookOpen className="h-3 w-3" /> Teaching Assistant
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    {currentUser?.department}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {currentUser?.officeHours}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-3">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-teal-500/20"
              >
                <div className="text-2xl font-bold text-teal-500">{supervisedTeams.length}</div>
                <div className="text-xs text-muted-foreground">Teams</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-blue-500/20"
              >
                <div className="text-2xl font-bold text-blue-500">{totalStudents}</div>
                <div className="text-xs text-muted-foreground">Students</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-green-500/20"
              >
                <div className="text-2xl font-bold text-green-500">{healthyTeams}</div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-purple-500/20"
              >
                <div className="text-2xl font-bold text-purple-500">{Math.round(avgProgress)}%</div>
                <div className="text-xs text-muted-foreground">Progress</div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Access Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Quick Access
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <NextLink href={link.href}>
                <Card className="glass-card p-4 h-full cursor-pointer group hover:border-primary/50 transition-all overflow-hidden relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${link.color} group-hover:scale-110 transition-transform`}
                      >
                        <link.icon className="h-5 w-5 text-white" />
                      </div>
                      {link.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {link.count}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{link.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                  </div>
                </Card>
              </NextLink>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Teams List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-500" /> Assigned Teams
              </h3>
              <Button variant="outline" size="sm" asChild className="bg-transparent">
                <NextLink href="/dashboard/teams">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </NextLink>
              </Button>
            </div>

            <div className="space-y-4">
              {supervisedTeams.map((team, index) => {
                const leader = team.leader
                const doctor = team.doctor
                const progress = getTeamProgressFallback(team)
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={leader?.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{team.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Supervisor: Dr. {doctor?.fullName?.split(" ").slice(1).join(" ")}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          !team.isFull
                            ? "default"
                            : team.stage === "REQUIREMENTS"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {!team.isFull ? "healthy" : "at-risk"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>{team.memberCount} members</span>
                      <Badge variant="outline" className="capitalize">
                        {team.stage}
                      </Badge>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Office Hours */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <Card className="glass-card p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-teal-500" /> Office Hours
              </h3>
              <div className="text-center py-4">
                <div className="text-2xl font-bold mb-2">{currentUser?.officeHours}</div>
                <p className="text-sm text-muted-foreground">Available for student consultations</p>
              </div>
              <Button className="w-full mt-2 bg-transparent" variant="outline">
                <Calendar className="h-4 w-4 mr-2" /> Schedule Meeting
              </Button>
            </Card>
          </motion.div>

          {/* Upcoming Meetings */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" /> Meetings
                </h3>
                <Button variant="ghost" size="sm" asChild>
                  <NextLink href="/dashboard/calendar">
                    <Plus className="h-4 w-4" />
                  </NextLink>
                </Button>
              </div>

              <div className="space-y-3">
                {upcomingMeetings.slice(0, 4).map((meeting) => {
                  const team = teams.find((t) => t.id === meeting.teamId)
                  return (
                    <div key={meeting.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Video className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{meeting.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {team?.name} • {new Date(meeting.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ADMIN DASHBOARD
// ============================================
function AdminDashboard() {
  const { currentUser, hasHydrated } = useAuthStore()
  const [greeting, setGreeting] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [usersSummary, setUsersSummary] = useState<UsersSummary | null>(null)
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState("")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 17) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!hasHydrated || currentUser?.role !== "admin") return

    let cancelled = false
    setIsSummaryLoading(true)
    setSummaryError("")

    usersApi
      .summary()
      .then((result) => {
        if (cancelled) return
        setUsersSummary(result)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setSummaryError(error instanceof Error ? error.message : "Couldn't load real user counters.")
      })
      .finally(() => {
        if (!cancelled) setIsSummaryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentUser?.role, hasHydrated])

  const totalUsers = usersSummary?.totalUsers
  const totalTeams = teams.length
  const totalDoctors = usersSummary?.byRole.doctors
  const totalTAs = usersSummary?.byRole.tas
  const totalStudents = usersSummary?.byRole.students
  const totalLeaders = usersSummary?.byRole.leaders
  const totalAdmins = usersSummary?.byRole.admins
  const healthyTeams = teams.filter((t) => t.health === "healthy").length
  const atRiskTeams = teams.filter((t) => t.health === "at-risk").length
  const criticalTeams = teams.filter((t) => t.health === "critical").length
  const userSummaryStatus = isSummaryLoading
    ? "Syncing users..."
    : summaryError
      ? "User counters unavailable"
      : "User counters live from database"

  const formatSummaryValue = (value?: number) => {
    if (isSummaryLoading) return "..."
    if (summaryError) return "--"
    return value ?? 0
  }

  const quickLinks = [
    {
      title: "User Management",
      icon: Users,
      href: "/dashboard/admin",
      count: isSummaryLoading || summaryError ? undefined : (totalUsers ?? 0),
      color: "from-blue-500 to-cyan-500",
      description: "Manage all users",
    },
    {
      title: "Team Management",
      icon: Users2,
      href: "/dashboard/teams",
      count: totalTeams,
      color: "from-purple-500 to-pink-500",
      description: "All teams",
    },
    {
      title: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      count: 0,
      color: "from-green-500 to-emerald-500",
      description: "System analytics",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      count: 0,
      color: "from-orange-500 to-amber-500",
      description: "System settings",
    },
    {
      title: "Audit Logs",
      icon: ClipboardList,
      href: "/dashboard/admin/logs",
      count: 156,
      color: "from-indigo-500 to-violet-500",
      description: "Activity logs",
    },
    {
      title: "Reports",
      icon: FileText,
      href: "/dashboard/admin/reports",
      count: 12,
      color: "from-rose-500 to-pink-500",
      description: "System reports",
    },
    {
      title: "Notifications",
      icon: Bell,
      href: "/dashboard/admin/notifications",
      count: 5,
      color: "from-teal-500 to-cyan-500",
      description: "Announcements",
    },
    {
      title: "Backup",
      icon: Database,
      href: "/dashboard/admin/backup",
      count: 0,
      color: "from-gray-500 to-slate-500",
      description: "Data backup",
    },
  ]

  const systemHealth = [
    { label: "Server Status", value: "Online", status: "healthy", icon: Server },
    { label: "Database", value: "Connected", status: "healthy", icon: Database },
    { label: "API Response", value: "45ms", status: "healthy", icon: Zap },
    { label: "Storage", value: "67%", status: "warning", icon: HardDrive },
  ]

  const recentActivities = [
    { id: 1, user: "Dr. Ahmed Hassan", action: "Created new team", time: "5 min ago", icon: Plus },
    { id: 2, user: "Layla Ibrahim", action: "Approved proposal", time: "15 min ago", icon: Check },
    { id: 3, user: "Youssef Ahmed", action: "Submitted milestone", time: "1 hour ago", icon: Upload },
    { id: 4, user: "System", action: "Backup completed", time: "2 hours ago", icon: Database },
    { id: 5, user: "Dr. Fatima Ali", action: "Scheduled meeting", time: "3 hours ago", icon: Calendar },
  ]

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl glass-card p-6 md:p-8 border border-border/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-amber-500/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/20 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 items-center justify-between">
            <div className="flex items-start gap-4">
              <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="relative">
                <Avatar className="h-20 w-20 border-4 border-rose-500/20 shadow-xl">
                  <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white">
                    {currentUser?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-rose-500 border-2 border-background">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              </motion.div>

              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 text-sm text-muted-foreground mb-1"
                >
                  <Clock className="h-4 w-4" />
                  <span>
                    {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                  <span className="font-mono text-primary">{currentTime.toLocaleTimeString()}</span>
                </motion.div>

                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {greeting}, <span className="text-primary">{currentUser?.name}</span>!
                </h1>
                <p className="text-muted-foreground">System administration and monitoring dashboard</p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge className="gap-1 bg-gradient-to-r from-rose-500 to-orange-500 text-white border-0">
                    <Shield className="h-3 w-3" /> System Administrator
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-green-600 border-green-500/50">
                    <CheckCircle className="h-3 w-3" /> All Systems Online
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1",
                      isSummaryLoading
                        ? "text-blue-600 border-blue-500/40"
                        : summaryError
                          ? "text-red-600 border-red-500/40"
                          : "text-sky-600 border-sky-500/40",
                    )}
                  >
                    <Database className="h-3 w-3" /> {userSummaryStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-3">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-blue-500/20"
              >
                <div className="text-2xl font-bold text-blue-500">{formatSummaryValue(totalUsers)}</div>
                <div className="text-xs text-muted-foreground">Users</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-purple-500/20"
              >
                <div className="text-2xl font-bold text-purple-500">{totalTeams}</div>
                <div className="text-xs text-muted-foreground">Teams</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-green-500/20"
              >
                <div className="text-2xl font-bold text-green-500">{healthyTeams}</div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-4 rounded-xl text-center border border-orange-500/20"
              >
                <div className="text-2xl font-bold text-orange-500">{atRiskTeams + criticalTeams}</div>
                <div className="text-xs text-muted-foreground">At Risk</div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Access Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Admin Controls
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <NextLink href={link.href}>
                <Card className="glass-card p-4 h-full cursor-pointer group hover:border-primary/50 transition-all overflow-hidden relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${link.color} group-hover:scale-110 transition-transform`}
                      >
                        <link.icon className="h-5 w-5 text-white" />
                      </div>
                      {typeof link.count === "number" && link.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {link.count}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{link.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                  </div>
                </Card>
              </NextLink>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" /> System Health
              </h3>
              <Badge variant="outline" className="text-green-600 border-green-500/50">
                All Systems Operational
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {systemHealth.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl border",
                    item.status === "healthy"
                      ? "bg-green-500/10 border-green-500/30"
                      : item.status === "warning"
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-red-500/10 border-red-500/30",
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon
                      className={cn(
                        "h-4 w-4",
                        item.status === "healthy"
                          ? "text-green-500"
                          : item.status === "warning"
                            ? "text-yellow-500"
                            : "text-red-500",
                      )}
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="text-lg font-bold">{item.value}</div>
                </motion.div>
              ))}
            </div>

            {/* User Distribution */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">User Distribution</h4>
                <p className={cn("text-xs", summaryError ? "text-red-500" : "text-muted-foreground")}>
                  {summaryError || "Live role counts from the backend database"}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <div className="text-2xl font-bold text-blue-500">{formatSummaryValue(totalDoctors)}</div>
                  <div className="text-xs text-muted-foreground">Doctors</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <div className="text-2xl font-bold text-teal-500">{formatSummaryValue(totalTAs)}</div>
                  <div className="text-xs text-muted-foreground">TAs</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <div className="text-2xl font-bold text-purple-500">{formatSummaryValue(totalStudents)}</div>
                  <div className="text-xs text-muted-foreground">Students</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <div className="text-2xl font-bold text-amber-500">{formatSummaryValue(totalLeaders)}</div>
                  <div className="text-xs text-muted-foreground">Team Leaders</div>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <div className="text-2xl font-bold text-rose-500">{formatSummaryValue(totalAdmins)}</div>
                  <div className="text-xs text-muted-foreground">Admins</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" /> Recent Activity
                </h3>
                <Badge variant="secondary" className="animate-pulse">
                  Live
                </Badge>
              </div>

              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-all"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <activity.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </motion.div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4 bg-transparent" asChild>
                <NextLink href="/dashboard/admin/logs">View All Logs</NextLink>
              </Button>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card p-6 rounded-2xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" /> Quick Actions
              </h3>
              <div className="space-y-2">
                <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                  <UserPlus className="h-4 w-4" /> Add New User
                </Button>
                <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                  <Users2 className="h-4 w-4" /> Create Team
                </Button>
                <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                  <Megaphone className="h-4 w-4" /> Send Announcement
                </Button>
                <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                  <Download className="h-4 w-4" /> Export Data
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
