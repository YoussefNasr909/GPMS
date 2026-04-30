"use client"

import { motion } from "framer-motion"
import { BarChart3, TrendingUp, Users, Target, Award, Calendar, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/lib/stores/auth-store"
import { teams } from "@/data/teams"
import { tasks } from "@/data/tasks"
import { users } from "@/data/users"
import { TeamRequiredGuard } from "@/components/team-required-guard"

export default function AnalyticsPage() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const userTeam = teams.find((t) => t.memberIds?.includes(currentUser?.id || "") || t.leaderId === currentUser?.id)
  const teamTasks = tasks.filter((t) => t.teamId === userTeam?.id)

  const completedTasks = teamTasks.filter((t) => t.status === "done").length
  const inProgressTasks = teamTasks.filter((t) => t.status === "in-progress").length
  const totalTasks = teamTasks.length
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const teamMembers = users.filter((u) => userTeam?.memberIds?.includes(u.id) || u.id === userTeam?.leaderId)
  const avgXP = teamMembers.reduce((sum, m) => sum + (m.xp || 0), 0) / (teamMembers.length || 1)

  const priorityStats = {
    critical: teamTasks.filter((t) => t.priority === "critical").length,
    high: teamTasks.filter((t) => t.priority === "high").length,
    medium: teamTasks.filter((t) => t.priority === "medium").length,
    low: teamTasks.filter((t) => t.priority === "low").length,
  }

  const statusStats = [
    { status: "Completed", count: completedTasks, color: "bg-green-500" },
    { status: "In Progress", count: inProgressTasks, color: "bg-blue-500" },
    { status: "Review", count: teamTasks.filter((t) => t.status === "review").length, color: "bg-yellow-500" },
    { status: "To Do", count: teamTasks.filter((t) => t.status === "todo").length, color: "bg-gray-500" },
  ]

  const performanceData = teamMembers
    .map((member) => {
      const memberTasks = teamTasks.filter((t) => t.assigneeId === member.id)
      const completed = memberTasks.filter((t) => t.status === "done").length
      return {
        name: member.name,
        tasks: memberTasks.length,
        completed,
        rate: memberTasks.length > 0 ? (completed / memberTasks.length) * 100 : 0,
        xp: member.xp || 0,
      }
    })
    .sort((a, b) => b.rate - a.rate)

  return (
    <TeamRequiredGuard
      pageName="Analytics"
      pageDescription="View detailed insights and performance metrics for your team's progress."
      icon={<BarChart3 className="h-10 w-10 text-primary" />}
    >
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Team Analytics
                </h1>
                <p className="text-muted-foreground">
                  Insights and performance metrics for {userTeam?.name || "your team"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {completionRate.toFixed(0)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500/30" />
                </div>
                <Progress value={completionRate} className="mt-3" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                    <p className="text-3xl font-bold">{totalTasks}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500/30" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{completedTasks} completed</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                    <p className="text-3xl font-bold">{teamMembers.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500/30" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Avg XP: {avgXP.toFixed(0)}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Project Progress</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {userTeam?.progress || 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500/30" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Stage: {userTeam?.stage || "N/A"}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Task Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Task Status Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {statusStats.map((stat) => (
                        <div key={stat.status} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{stat.status}</span>
                            <span className="text-muted-foreground">{stat.count} tasks</span>
                          </div>
                          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`absolute inset-y-0 left-0 ${stat.color} transition-all duration-500`}
                              style={{ width: `${totalTasks > 0 ? (stat.count / totalTasks) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Priority Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Priority Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="destructive">Critical</Badge>
                          <span className="font-semibold">{priorityStats.critical}</span>
                        </div>
                        <Progress
                          value={totalTasks > 0 ? (priorityStats.critical / totalTasks) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-orange-500">High</Badge>
                          <span className="font-semibold">{priorityStats.high}</span>
                        </div>
                        <Progress
                          value={totalTasks > 0 ? (priorityStats.high / totalTasks) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-yellow-500">Medium</Badge>
                          <span className="font-semibold">{priorityStats.medium}</span>
                        </div>
                        <Progress
                          value={totalTasks > 0 ? (priorityStats.medium / totalTasks) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Low</Badge>
                          <span className="font-semibold">{priorityStats.low}</span>
                        </div>
                        <Progress value={totalTasks > 0 ? (priorityStats.low / totalTasks) * 100 : 0} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Member Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {performanceData.map((member, index) => (
                        <motion.div
                          key={member.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 rounded-lg border bg-card/50"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{member.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {member.completed}/{member.tasks} tasks completed
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{member.rate.toFixed(0)}%</p>
                              <p className="text-xs text-muted-foreground">{member.xp} XP</p>
                            </div>
                          </div>
                          <Progress value={member.rate} className="h-2" />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Project Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {["Requirements", "Design", "Implementation", "Testing", "Deployment"].map((phase, index) => (
                        <div key={phase} className="relative pl-8 pb-8 border-l-2 border-muted last:border-0 last:pb-0">
                          <div
                            className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full ${
                              index <= 2 ? "bg-primary" : "bg-muted"
                            }`}
                          />
                          <div>
                            <h4 className="font-semibold mb-1">{phase}</h4>
                            <p className="text-sm text-muted-foreground">
                              {index <= 2 ? "Completed" : index === 3 ? "In Progress" : "Upcoming"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </TeamRequiredGuard>
  )
}
