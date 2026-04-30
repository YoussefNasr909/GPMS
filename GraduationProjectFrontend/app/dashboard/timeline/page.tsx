"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ChevronLeft, ChevronRight, GanttChart } from "lucide-react"
import { tasks } from "@/data/tasks"
import { teams } from "@/data/teams"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useState } from "react"
import { TeamRequiredGuard } from "@/components/team-required-guard"

export default function TimelinePage() {
  const { currentUser } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const myTeams = teams.filter((t) => t.memberIds.includes(currentUser?.id || "") || t.leaderId === currentUser?.id)
  const myTasks = tasks.filter((task) => myTeams.some((t) => t.id === task.teamId))

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  return (
    <TeamRequiredGuard
      pageName="Timeline & Calendar"
      pageDescription="Track deadlines and project milestones with your team."
      icon={<GanttChart className="h-10 w-10 text-primary" />}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Timeline & Calendar</h1>
          <p className="text-muted-foreground mt-1">Track deadlines and project milestones</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg sm:text-xl font-semibold">
              {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-4 sm:p-6">
            <h3 className="font-semibold mb-4">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {myTasks
                .filter((t) => t.dueDate)
                .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                .slice(0, 8)
                .map((task) => {
                  const team = teams.find((t) => t.id === task.teamId)
                  const daysUntilDue = Math.ceil(
                    (new Date(task.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                  )
                  const isOverdue = daysUntilDue < 0
                  const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0

                  return (
                    <div key={task.id} className="flex items-start gap-4 p-3 sm:p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-medium text-sm sm:text-base">{task.title}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">{team?.name}</p>
                          </div>
                          <Badge variant={isOverdue ? "destructive" : isUrgent ? "secondary" : "outline"}>
                            {isOverdue ? "Overdue" : isUrgent ? "Urgent" : "Upcoming"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(task.dueDate!).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {isOverdue
                                ? `${Math.abs(daysUntilDue)} days overdue`
                                : daysUntilDue === 0
                                  ? "Due today"
                                  : `${daysUntilDue} days left`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              {myTasks.filter((t) => t.dueDate).length === 0 && (
                <p className="text-center text-muted-foreground py-8">No upcoming deadlines</p>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-4 sm:p-6">
              <h3 className="font-semibold mb-4">Task Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-medium">
                      {myTasks.length > 0
                        ? Math.round((myTasks.filter((t) => t.status === "done").length / myTasks.length) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      myTasks.length > 0
                        ? (myTasks.filter((t) => t.status === "done").length / myTasks.length) * 100
                        : 0
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold">{myTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Total Tasks</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold">{myTasks.filter((t) => t.status === "done").length}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold">
                      {myTasks.filter((t) => t.status === "in-progress").length}
                    </p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xl sm:text-2xl font-bold">
                      {
                        myTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done")
                          .length
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <h3 className="font-semibold mb-4">Workload Distribution</h3>
              <div className="space-y-3">
                {myTeams.map((team) => {
                  const teamTasks = myTasks.filter((t) => t.teamId === team.id)
                  const completedTasks = teamTasks.filter((t) => t.status === "done").length
                  const progress = teamTasks.length > 0 ? (completedTasks / teamTasks.length) * 100 : 0

                  return (
                    <div key={team.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium truncate">{team.name}</span>
                        <span className="text-muted-foreground">
                          {completedTasks}/{teamTasks.length}
                        </span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )
                })}
                {myTeams.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No team data available</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </TeamRequiredGuard>
  )
}
