"use client"

import { motion } from "framer-motion"
import { Timer, Play, Pause, Square, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { teams } from "@/data/teams"
import { TeamRequiredGuard } from "@/components/team-required-guard"

export default function TimeTrackerPage() {
  const { currentUser } = useAuthStore()
  const [isTracking, setIsTracking] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentTask, setCurrentTask] = useState("")

  const isStudent = currentUser?.role === "member" || currentUser?.role === "leader"
  const myTeam = isStudent
    ? teams.find((t) => t.leaderId === currentUser?.id || t.memberIds.includes(currentUser?.id || ""))
    : null

  const mockTimeEntries = [
    { id: "1", task: "Database Schema Design", duration: 7200, date: "2025-01-14", project: "Smart Campus" },
    { id: "2", task: "User Authentication", duration: 10800, date: "2025-01-14", project: "Smart Campus" },
    { id: "3", task: "Dashboard UI", duration: 5400, date: "2025-01-13", project: "Smart Campus" },
    { id: "4", task: "API Testing", duration: 3600, date: "2025-01-13", project: "Smart Campus" },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTracking) {
      interval = setInterval(() => {
        setCurrentTime((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTracking])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const totalTimeToday = mockTimeEntries
    .filter((entry) => entry.date === "2025-01-14")
    .reduce((sum, entry) => sum + entry.duration, 0)

  const totalTimeWeek = mockTimeEntries.reduce((sum, entry) => sum + entry.duration, 0)

  if (isStudent && !myTeam) {
    return (
      <TeamRequiredGuard
        pageName="Time Tracker"
        pageDescription="Track your project work hours and monitor productivity"
        icon={<Timer className="h-12 w-12" />}
      >
        <>
        </>
      </TeamRequiredGuard>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Time Tracker
        </h1>
        <p className="text-muted-foreground mt-1">Track your project work hours</p>
      </motion.div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="space-y-6">
          <Card className="p-8 border-2">
            <div className="text-center space-y-6">
              <motion.div
                className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20"
                animate={{
                  scale: isTracking ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: isTracking ? Number.POSITIVE_INFINITY : 0,
                }}
              >
                <Timer className="h-16 w-16 text-primary" />
              </motion.div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Current Session</p>
                <motion.p
                  className="text-6xl font-bold font-mono bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
                  animate={{
                    scale: isTracking ? [1, 1.02, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: isTracking ? Number.POSITIVE_INFINITY : 0,
                  }}
                >
                  {formatTime(currentTime)}
                </motion.p>
              </div>

              <div className="flex gap-3 justify-center">
                {!isTracking ? (
                  <Button size="lg" className="rounded-xl" onClick={() => setIsTracking(true)}>
                    <Play className="h-5 w-5 mr-2" />
                    Start Timer
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-xl bg-transparent"
                      onClick={() => setIsTracking(false)}
                    >
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="rounded-xl"
                      onClick={() => {
                        setIsTracking(false)
                        setCurrentTime(0)
                      }}
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Time Entries
            </h3>
            <div className="space-y-3">
              {mockTimeEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  whileHover={{ x: 4 }}
                  className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{entry.task}</p>
                      <p className="text-sm text-muted-foreground mt-1">{entry.project}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold">{formatTime(entry.duration)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{entry.date}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-2">
            <h3 className="font-semibold text-lg mb-4">Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="font-mono font-semibold">{formatTime(totalTimeToday)}</span>
                </div>
                <Progress value={(totalTimeToday / 28800) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Goal: 8 hours</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="font-mono font-semibold">{formatTime(totalTimeWeek)}</span>
                </div>
                <Progress value={(totalTimeWeek / 144000) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Goal: 40 hours</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Productivity Insights
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Great Progress!</p>
                <p className="text-xs text-muted-foreground mt-1">You're 25% ahead of your weekly goal</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-sm">Most Productive Day</span>
                <Badge>Monday</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <span className="text-sm">Average Session</span>
                <Badge variant="secondary">2h 15m</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
