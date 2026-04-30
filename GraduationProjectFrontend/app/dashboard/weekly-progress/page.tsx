"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Send,
  Calendar,
  TrendingUp,
  FileText,
  BarChart3,
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { tasks } from "@/data/tasks"
import { teams } from "@/data/teams"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { TeamRequiredGuard } from "@/components/team-required-guard"

export default function WeeklyProgressPage() {
  const { currentUser } = useAuthStore()
  const [reportText, setReportText] = useState("")
  const [showAINotice, setShowAINotice] = useState(false)
  const [reports, setReports] = useState([
    {
      id: "1",
      week: "Week 12 - Dec 8-14",
      date: "Dec 14, 2024",
      summary: "Completed authentication module, started database integration",
    },
    {
      id: "2",
      week: "Week 11 - Dec 1-7",
      date: "Dec 7, 2024",
      summary: "Finished UI design, implemented core components",
    },
  ])

  const myTeam = teams.find((t) => t.memberIds.includes(currentUser?.id || "") || t.leaderId === currentUser?.id)
  const myTasks = myTeam ? tasks.filter((t) => t.teamId === myTeam.id) : []

  // Calculate auto-generated summary
  const completedTasks = myTasks.filter((t) => t.status === "done").length
  const inProgressTasks = myTasks.filter((t) => t.status === "in-progress").length
  const pendingTasks = myTasks.filter((t) => t.status === "review" || t.status === "todo").length
  const blockedTasks = myTasks.filter((t) => t.status === "backlog").length

  const autoSummary = `This week, our team completed ${completedTasks} tasks with TA approval. We currently have ${inProgressTasks} tasks in progress and ${pendingTasks} tasks pending approval or in backlog. ${blockedTasks > 0 ? `${blockedTasks} tasks are currently blocked and need attention.` : "No blocked tasks this week."}`

  const handleImproveWithAI = () => {
    setShowAINotice(true)
  }

  const handleAIContinue = () => {
    setShowAINotice(false)
    const improvedText = `${reportText || autoSummary}\n\nKey Achievements:\n• Successfully implemented authentication system with JWT tokens\n• Integrated database layer with proper error handling\n• Conducted code review sessions with team members\n\nChallenges Faced:\n• Minor delay in API integration due to dependency issues\n• Resolved merge conflicts in collaborative features\n\nNext Week's Focus:\n• Complete remaining API endpoints\n• Begin integration testing phase\n• Prepare for mid-term presentation`

    setReportText(improvedText)
  }

  const handleSubmit = () => {
    const newReport = {
      id: Date.now().toString(),
      week: `Week ${reports.length + 11} - Current`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      summary: reportText || autoSummary,
    }
    setReports([newReport, ...reports])
    setReportText("")
  }

  return (
    <TeamRequiredGuard
      pageName="Weekly Progress"
      pageDescription="Track and submit your team's weekly achievements and reports."
      icon={<BarChart3 className="h-10 w-10 text-primary" />}
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-2">Weekly Progress Report</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track and submit your team's weekly achievements</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Auto-Generated Summary */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">This Week's Summary</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="glass-card p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Completed</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{completedTasks}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">TA Approved</div>
                </div>

                <div className="glass-card p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-xs sm:text-sm text-muted-foreground">In Progress</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{inProgressTasks}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Active Work</div>
                </div>

                <div className="glass-card p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Pending</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{pendingTasks}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Awaiting Review</div>
                </div>

                <div className="glass-card p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Blocked</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{blockedTasks}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Need Attention</div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-primary/5 rounded-xl">
                <p className="text-xs sm:text-sm leading-relaxed">{autoSummary}</p>
              </div>
            </Card>
          </motion.div>

          {/* Write Report */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Write Your Report</h3>
              </div>

              <Textarea
                placeholder="Add additional details, challenges, achievements..."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="min-h-[150px] sm:min-h-[200px] mb-4 text-sm"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleImproveWithAI} variant="outline" className="flex-1 bg-transparent">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Improve with AI
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  Submit Report
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Weekly History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Report History</h3>
            </div>

            <div className="space-y-4">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-3 sm:p-4 rounded-xl hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base">{report.week}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">{report.date}</p>
                    </div>
                    <Badge variant="outline">Submitted</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{report.summary}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* AI Notice Dialog */}
        <Dialog open={showAINotice} onOpenChange={setShowAINotice}>
          <DialogContent className="mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Enhancement Notice
              </DialogTitle>
              <DialogDescription className="pt-4">
                Your text will be sent to an external AI service to improve grammar, structure, and clarity.
              </DialogDescription>
              <DialogDescription className="text-sm">
                <strong>Please note:</strong> Your report content will be shared with our AI provider for processing. Do
                you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowAINotice(false)}>
                Cancel
              </Button>
              <Button onClick={handleAIContinue}>
                <Sparkles className="mr-2 h-4 w-4" />
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TeamRequiredGuard>
  )
}
