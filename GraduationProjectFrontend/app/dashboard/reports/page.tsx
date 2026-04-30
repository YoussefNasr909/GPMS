"use client"

import { SelectItem } from "@/components/ui/select"

import { SelectContent } from "@/components/ui/select"

import { SelectValue } from "@/components/ui/select"

import { SelectTrigger } from "@/components/ui/select"

import { Select } from "@/components/ui/select"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Download, TrendingUp, Target, Clock, BarChart3, CheckCircle2, Users, Activity } from "lucide-react"
import { teams } from "@/data/teams"
import { tasks } from "@/data/tasks"
import { useAuthStore, getUserById } from "@/lib/stores/auth-store"
import { motion } from "framer-motion"
import { TeamRequiredGuard } from "@/components/team-required-guard"

export default function ReportsPage() {
  const { currentUser } = useAuthStore()

  const myTeam = currentUser?.role === "leader" ? teams.find((t) => t.leaderId === currentUser?.id) : null

  const isAdmin = currentUser?.role === "admin"
  const isSupervisor = currentUser?.role === "doctor" || currentUser?.role === "ta"
  const isLeader = currentUser?.role === "leader"

  const teamTasks = isLeader && myTeam ? tasks.filter((t) => t.teamId === myTeam.id) : tasks

  const completedTasks = teamTasks.filter((t) => t.status === "done").length
  const avgProgress = myTeam?.progress || 0

  return (
    <TeamRequiredGuard
      pageName="Reports & Analytics"
      pageDescription="Review team progress, delivery status, and project reporting once your team workspace is ready."
      icon={<BarChart3 className="h-10 w-10 text-primary" />}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            {isLeader ? "Team Reports & Analytics" : "Reports & Analytics"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLeader && myTeam ? `Comprehensive insights for ${myTeam.name}` : "Generate insights and export data"}
          </p>
        </div>
        <Button className="gap-2 glow">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {isLeader && myTeam ? (
          <>
            <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50 hover:border-primary/50 transition-all group hover:shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold">{myTeam.memberIds.length}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </Card>
            <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50 hover:border-primary/50 transition-all group hover:shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold">{completedTasks}</p>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </Card>
            <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50 hover:border-primary/50 transition-all group hover:shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg group-hover:scale-110 transition-transform">
                  <Target className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold">{avgProgress}%</p>
              <p className="text-sm text-muted-foreground">Project Progress</p>
            </Card>
            <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50 hover:border-primary/50 transition-all group hover:shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold">
                {myTeam.health === "healthy" ? "Good" : myTeam.health === "at-risk" ? "Fair" : "Poor"}
              </p>
              <p className="text-sm text-muted-foreground">Team Health</p>
            </Card>
          </>
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Active Teams</span>
              </div>
              <p className="text-3xl font-bold">{teams.length}</p>
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                12% from last month
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-success" />
                <span className="font-medium">Tasks Completed</span>
              </div>
              <p className="text-3xl font-bold">247</p>
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                18% from last week
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="font-medium">Avg Response Time</span>
              </div>
              <p className="text-3xl font-bold">2.4h</p>
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                20% faster
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Avg Grade</span>
              </div>
              <p className="text-3xl font-bold">87%</p>
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />5 pts increase
              </p>
            </Card>
          </>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isLeader && <TabsTrigger value="members">Member Performance</TabsTrigger>}
          {isLeader && <TabsTrigger value="tasks">Task Analytics</TabsTrigger>}
          {!isLeader && <TabsTrigger value="teams">Team Reports</TabsTrigger>}
          <TabsTrigger value="performance">Performance</TabsTrigger>
          {(isAdmin || isSupervisor) && <TabsTrigger value="custom">Custom Reports</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {isLeader && myTeam ? (
            <>
              <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  {myTeam.name} - Project Overview
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Project Completion</span>
                      <span className="text-sm text-muted-foreground">{myTeam.progress}%</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${myTeam.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary to-accent"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Task Completion Rate</span>
                        <span className="text-sm text-muted-foreground">
                          {teamTasks.length > 0 ? Math.round((completedTasks / teamTasks.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success"
                          style={{
                            width: teamTasks.length > 0 ? `${(completedTasks / teamTasks.length) * 100}%` : "0%",
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Team Engagement</span>
                        <span className="text-sm text-muted-foreground">85%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: "85%" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50">
                  <h3 className="font-semibold text-lg mb-4">Current Sprint Status</h3>
                  <div className="space-y-4">
                    {["Backlog", "In Progress", "Review", "Done"].map((status, index) => {
                      const count = teamTasks.filter((t) =>
                        status === "Backlog"
                          ? t.status === "backlog" || t.status === "todo"
                          : status === "In Progress"
                            ? t.status === "in-progress"
                            : status === "Review"
                              ? t.status === "review"
                              : t.status === "done",
                      ).length

                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                status === "Done"
                                  ? "bg-success"
                                  : status === "Review"
                                    ? "bg-warning"
                                    : status === "In Progress"
                                      ? "bg-primary"
                                      : "bg-muted-foreground"
                              }`}
                            />
                            <span className="font-medium">{status}</span>
                          </div>
                          <Badge variant="outline">{count} tasks</Badge>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50">
                  <h3 className="font-semibold text-lg mb-4">Recent Achievements</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-success mt-1.5" />
                      <div>
                        <p className="font-medium">Completed 10 tasks this week</p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      <div>
                        <p className="font-medium">All members attended team meeting</p>
                        <p className="text-xs text-muted-foreground">3 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-warning mt-1.5" />
                      <div>
                        <p className="font-medium">Reached 75% project milestone</p>
                        <p className="text-xs text-muted-foreground">1 week ago</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <>
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">System Overview</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Project Completion</span>
                      <span className="text-sm text-muted-foreground">68%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "68%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Average Team Progress</span>
                      <span className="text-sm text-muted-foreground">72%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-success" style={{ width: "72%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Submission Rate</span>
                      <span className="text-sm text-muted-foreground">95%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-warning" style={{ width: "95%" }} />
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Top Performing Teams</h3>
                  <div className="space-y-3">
                    {teams.slice(0, 5).map((team, index) => (
                      <div key={team.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                          <span className="font-medium">{team.name}</span>
                        </div>
                        <Badge>{team.progress}%</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-success mt-1.5" />
                      <div>
                        <p className="font-medium">Smart Campus submitted SRS Document</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      <div>
                        <p className="font-medium">AI Study Assistant completed Sprint 2</p>
                        <p className="text-xs text-muted-foreground">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <div className="h-2 w-2 rounded-full bg-warning mt-1.5" />
                      <div>
                        <p className="font-medium">Green Energy Monitor updated proposal</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {isLeader && myTeam && (
          <TabsContent value="members" className="space-y-4 mt-6">
            <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50">
              <h3 className="font-semibold text-lg mb-6">Member Performance Analysis</h3>
              <div className="space-y-4">
                {myTeam.memberIds.map((memberId) => {
                  const member = getUserById(memberId)
                  const memberTasks = teamTasks.filter((t) => t.assigneeId === memberId)
                  const completedCount = memberTasks.filter((t) => t.status === "done").length
                  const completionRate =
                    memberTasks.length > 0 ? Math.round((completedCount / memberTasks.length) * 100) : 0

                  if (!member) return null

                  return (
                    <div
                      key={memberId}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{member.name}</h4>
                            <p className="text-sm text-muted-foreground">{member.track || "General"} Track</p>
                          </div>
                        </div>
                        <Badge
                          variant={completionRate >= 80 ? "default" : completionRate >= 50 ? "secondary" : "outline"}
                        >
                          {completionRate}% Complete
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{memberTasks.length}</p>
                          <p className="text-xs text-muted-foreground">Total Tasks</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-success">{completedCount}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-warning">
                            {memberTasks.filter((t) => t.status === "in-progress").length}
                          </p>
                          <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </TabsContent>
        )}

        {isLeader && myTeam && (
          <TabsContent value="tasks" className="space-y-4 mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50">
                <h3 className="font-semibold text-lg mb-4">Priority Distribution</h3>
                <div className="space-y-3">
                  {["critical", "high", "medium", "low"].map((priority) => {
                    const count = teamTasks.filter((t) => t.priority === priority).length
                    const percentage = teamTasks.length > 0 ? (count / teamTasks.length) * 100 : 0

                    return (
                      <div key={priority} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize font-medium">{priority}</span>
                          <span className="text-muted-foreground">{count} tasks</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              priority === "critical"
                                ? "bg-red-500"
                                : priority === "high"
                                  ? "bg-orange-500"
                                  : priority === "medium"
                                    ? "bg-blue-500"
                                    : "bg-gray-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="p-6 backdrop-blur-xl bg-card/50 border-border/50">
                <h3 className="font-semibold text-lg mb-4">Workload Distribution</h3>
                <div className="space-y-3">
                  {myTeam.memberIds.map((memberId) => {
                    const member = getUserById(memberId)
                    const memberTasks = teamTasks.filter((t) => t.assigneeId === memberId)
                    const percentage = teamTasks.length > 0 ? (memberTasks.length / teamTasks.length) * 100 : 0

                    if (!member) return null

                    return (
                      <div key={memberId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.name.split(" ")[0]}</span>
                          </div>
                          <span className="text-muted-foreground">{memberTasks.length} tasks</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="teams" className="space-y-4 mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Team Performance Comparison</h3>
              <div className="flex items-center">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="top">Top Performers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{team.name}</h4>
                      <p className="text-sm text-muted-foreground">{team.memberIds.length} members</p>
                    </div>
                    <Badge>{team.progress}% Complete</Badge>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${team.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Performance Metrics</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Task Completion Rate</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">On-Time Submission</p>
                <p className="text-2xl font-bold">88%</p>
              </div>
              <div className="border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Meeting Attendance</p>
                <p className="text-2xl font-bold">95%</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {(isAdmin || isSupervisor) && (
          <TabsContent value="custom" className="mt-6">
            <Card className="p-8 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Custom Report Builder</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create customized reports with specific metrics and date ranges
              </p>
              <Button>Create Custom Report</Button>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
    </TeamRequiredGuard>
  )
}
