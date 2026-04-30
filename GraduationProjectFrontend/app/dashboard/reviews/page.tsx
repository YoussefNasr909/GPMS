"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Star,
  Download,
  MessageSquare,
  Send,
  XCircle,
  TrendingUp,
} from "lucide-react"
import { submissions } from "@/data/proposals"
import { teams } from "@/data/teams"
import { useAuthStore, getUserById } from "@/lib/stores/auth-store"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

export default function ReviewsPage() {
  const { currentUser } = useAuthStore()
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)

  const myTeams = teams.filter((t) => t.taId === currentUser?.id)
  const mySubmissions = submissions.filter((s) => myTeams.some((t) => t.id === s.teamId))

  const pendingReviews = mySubmissions.filter((s) => !s.grade)
  const completedReviews = mySubmissions.filter((s) => s.grade)
  const needsRevision = mySubmissions.filter((s) => s.feedback?.toLowerCase().includes("revision"))

  const avgGrade =
    completedReviews.length > 0
      ? completedReviews.reduce((acc, s) => acc + (s.grade || 0), 0) / completedReviews.length
      : 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Review Work
        </h1>
        <p className="text-muted-foreground mt-2">Review student submissions and provide detailed feedback</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-6 glass-card group hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-warning/10 group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-3xl font-bold">{pendingReviews.length}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Requires immediate attention
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-6 glass-card group hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-success/10 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">{completedReviews.length}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              <Star className="h-3 w-3 inline mr-1 fill-warning text-warning" />
              Avg Grade: {avgGrade.toFixed(1)}%
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 glass-card group hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-destructive/10 group-hover:scale-110 transition-transform">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Needs Revision</p>
                <p className="text-3xl font-bold">{needsRevision.length}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Submitted revisions pending</div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-6 glass-card group hover:shadow-xl transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-3xl font-bold">{mySubmissions.length}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Across {myTeams.length} teams</div>
          </Card>
        </motion.div>
      </div>

      {/* Tabs for different review categories */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="glass-card grid w-full grid-cols-3 p-1">
          <TabsTrigger value="pending" className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning">
            Pending ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-success/10 data-[state=active]:text-success">
            Completed ({completedReviews.length})
          </TabsTrigger>
          <TabsTrigger
            value="revision"
            className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive"
          >
            Revision ({needsRevision.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <SubmissionsList
            submissions={pendingReviews}
            onReview={(id) => {
              setSelectedSubmission(id)
              setReviewDialogOpen(true)
            }}
            showActions
          />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <SubmissionsList submissions={completedReviews} onReview={() => {}} showActions={false} />
        </TabsContent>

        <TabsContent value="revision" className="mt-6">
          <SubmissionsList
            submissions={needsRevision}
            onReview={(id) => {
              setSelectedSubmission(id)
              setReviewDialogOpen(true)
            }}
            showActions
          />
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        submissionId={selectedSubmission}
        onSubmit={() => {
          toast.success("Review submitted successfully!")
          setReviewDialogOpen(false)
        }}
      />
    </motion.div>
  )
}

function SubmissionsList({
  submissions: submissionsList,
  onReview,
  showActions,
}: {
  submissions: typeof submissions
  onReview: (id: string) => void
  showActions: boolean
}) {
  if (submissionsList.length === 0) {
    return (
      <Card className="p-12 text-center glass-card">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">No submissions found</h3>
        <p className="text-sm text-muted-foreground">Check back later for new submissions to review</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {submissionsList.map((submission, index) => {
        const team = teams.find((t) => t.id === submission.teamId)
        const leader = team ? getUserById(team.leaderId) : null

        return (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-6 glass-card hover:shadow-xl transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Team Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                      <AvatarImage src={leader?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{team?.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{team?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {leader?.name} • {team?.memberIds.length} members
                      </p>
                    </div>
                  </div>

                  {/* Submission Details */}
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="capitalize">
                      {submission.deliverableType?.replace("-", " ")}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Submitted {new Date(submission.submittedAt).toLocaleDateString()}</span>
                    </div>
                    {submission.late && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Late Submission
                      </Badge>
                    )}
                  </div>

                  {/* Grade if exists */}
                  {submission.grade && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 font-semibold text-lg">
                        <Star className="h-5 w-5 fill-warning text-warning" />
                        <span>{submission.grade}%</span>
                      </div>
                      <Progress value={submission.grade} className="flex-1 h-2" />
                    </div>
                  )}

                  {/* Feedback if exists */}
                  {submission.feedback && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Feedback:</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  {showActions && (
                    <Button onClick={() => onReview(submission.id)} size="sm" className="gap-2 glow">
                      {submission.grade ? "Update Review" : "Review Now"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

function ReviewDialog({
  open,
  onOpenChange,
  submissionId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  submissionId: string | null
  onSubmit: () => void
}) {
  const [grade, setGrade] = useState("")
  const [feedback, setFeedback] = useState("")
  const [status, setStatus] = useState<"approved" | "revision" | "rejected">("approved")

  const submission = submissions.find((s) => s.id === submissionId)
  const team = submission ? teams.find((t) => t.id === submission.teamId) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
    setGrade("")
    setFeedback("")
    setStatus("approved")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl glass-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Review Submission</DialogTitle>
          <p className="text-muted-foreground">
            {team?.name} • {submission?.deliverableType?.replace("-", " ")}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Submission Preview */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">submission_document.pdf</span>
              </div>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Submitted: {submission && new Date(submission.submittedAt).toLocaleDateString()}
            </div>
          </Card>

          {/* Grading Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade (0-100)</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max="100"
                placeholder="Enter grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="glass-card text-lg font-semibold"
                required
              />
              {grade && (
                <div className="mt-2">
                  <Progress value={Number(grade)} className="h-2" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger id="status" className="glass-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Approved
                    </div>
                  </SelectItem>
                  <SelectItem value="revision">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Needs Revision
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Rejected
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Detailed Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Provide detailed feedback on the submission..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="glass-card min-h-[150px]"
              required
            />
            <p className="text-xs text-muted-foreground">Be specific and constructive in your feedback</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2 glow">
              <Send className="h-4 w-4" />
              Submit Review
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
