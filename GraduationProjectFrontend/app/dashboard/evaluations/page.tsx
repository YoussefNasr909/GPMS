"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, CheckCircle2, Clock, FileText, Award } from "lucide-react"
import { teams } from "@/data/teams"
import { users } from "@/data/users"
import { useAuthStore } from "@/lib/stores/auth-store"
import { motion } from "framer-motion"
import { TeamRequiredGuard } from "@/components/team-required-guard"

interface Evaluation {
  id: string
  teamId: string
  evaluatorId: string
  type: "proposal" | "milestone" | "deliverable" | "final"
  title: string
  date: string
  criteria: { name: string; score: number; maxScore: number }[]
  overallScore: number
  feedback: string
  status: "pending" | "completed"
}

const mockEvaluations: Evaluation[] = [
  {
    id: "e1",
    teamId: "t1",
    evaluatorId: "u5",
    type: "proposal",
    title: "Project Proposal Evaluation",
    date: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    criteria: [
      { name: "Problem Definition", score: 18, maxScore: 20 },
      { name: "Solution Approach", score: 22, maxScore: 25 },
      { name: "Technical Feasibility", score: 19, maxScore: 20 },
      { name: "Innovation", score: 14, maxScore: 15 },
      { name: "Presentation", score: 17, maxScore: 20 },
    ],
    overallScore: 90,
    feedback:
      "Excellent proposal with clear problem definition. The technical approach is solid. Consider expanding on the scalability aspects.",
    status: "completed",
  },
  {
    id: "e2",
    teamId: "t1",
    evaluatorId: "u5",
    type: "milestone",
    title: "Sprint 1 Milestone Review",
    date: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
    criteria: [
      { name: "Progress vs Plan", score: 17, maxScore: 20 },
      { name: "Code Quality", score: 18, maxScore: 20 },
      { name: "Documentation", score: 15, maxScore: 20 },
      { name: "Team Collaboration", score: 19, maxScore: 20 },
      { name: "Testing", score: 16, maxScore: 20 },
    ],
    overallScore: 85,
    feedback: "Good progress overall. Documentation needs improvement. Code quality is excellent.",
    status: "completed",
  },
  {
    id: "e3",
    teamId: "t1",
    evaluatorId: "u5",
    type: "deliverable",
    title: "SRS Document Review",
    date: new Date().toISOString(),
    criteria: [
      { name: "Completeness", score: 0, maxScore: 25 },
      { name: "Clarity", score: 0, maxScore: 25 },
      { name: "Technical Detail", score: 0, maxScore: 25 },
      { name: "Formatting", score: 0, maxScore: 25 },
    ],
    overallScore: 0,
    feedback: "",
    status: "pending",
  },
]

export default function EvaluationsPage() {
  const { currentUser } = useAuthStore()
  const isEvaluator = currentUser?.role === "doctor" || currentUser?.role === "ta"

  const myTeams = teams.filter(
    (t) =>
      t.memberIds.includes(currentUser?.id || "") ||
      t.leaderId === currentUser?.id ||
      t.doctorId === currentUser?.id ||
      t.taId === currentUser?.id,
  )

  const myEvaluations = mockEvaluations.filter((e) => myTeams.some((t) => t.id === e.teamId))

  const completedEvaluations = myEvaluations.filter((e) => e.status === "completed")
  const pendingEvaluations = myEvaluations.filter((e) => e.status === "pending")
  const avgScore =
    completedEvaluations.length > 0
      ? Math.round(completedEvaluations.reduce((acc, e) => acc + e.overallScore, 0) / completedEvaluations.length)
      : 0

  return (
    <TeamRequiredGuard
      pageName="Evaluations"
      pageDescription="Track project evaluations and feedback from your supervisors."
      icon={<Award className="h-10 w-10 text-primary" />}
    >
      <div className="space-y-6 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Evaluations
            </h1>
            <p className="text-muted-foreground mt-1">Track project evaluations and feedback</p>
          </div>
          {isEvaluator && pendingEvaluations.length > 0 && (
            <Badge variant="secondary" className="text-base px-4 py-2">
              {pendingEvaluations.length} Pending
            </Badge>
          )}
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Completed</span>
            </div>
            <p className="text-3xl font-bold">{completedEvaluations.length}</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Pending</span>
            </div>
            <p className="text-3xl font-bold">{pendingEvaluations.length}</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-2">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-medium">Average Score</span>
            </div>
            <p className="text-3xl font-bold">{avgScore}%</p>
          </Card>
        </div>

        <Tabs defaultValue="completed" className="w-full">
          <TabsList>
            <TabsTrigger value="completed">Completed ({completedEvaluations.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingEvaluations.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedEvaluations.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No completed evaluations yet</p>
              </Card>
            ) : (
              completedEvaluations.map((evaluation) => (
                <EvaluationCard key={evaluation.id} evaluation={evaluation} isEvaluator={isEvaluator} />
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingEvaluations.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-muted-foreground">No pending evaluations</p>
              </Card>
            ) : (
              pendingEvaluations.map((evaluation) => (
                <EvaluationCard key={evaluation.id} evaluation={evaluation} isEvaluator={isEvaluator} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TeamRequiredGuard>
  )
}

function EvaluationCard({ evaluation, isEvaluator }: { evaluation: Evaluation; isEvaluator: boolean }) {
  const team = teams.find((t) => t.id === evaluation.teamId)
  const evaluator = users.find((u) => u.id === evaluation.evaluatorId)

  const typeColors = {
    proposal: "default",
    milestone: "secondary",
    deliverable: "outline",
    final: "default",
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{evaluation.title}</h3>
              <Badge variant={typeColors[evaluation.type] as any}>{evaluation.type}</Badge>
              {evaluation.status === "pending" && <Badge variant="secondary">Pending Review</Badge>}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{team?.name}</span>
              <span>-</span>
              <span>Evaluated by {evaluator?.name}</span>
              <span>-</span>
              <span>{new Date(evaluation.date).toLocaleDateString()}</span>
            </div>
          </div>

          {evaluation.status === "completed" && (
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{evaluation.overallScore}%</p>
              <p className="text-xs text-muted-foreground">Overall Score</p>
            </div>
          )}
        </div>

        {evaluation.status === "completed" ? (
          <>
            <div className="space-y-3 mb-4">
              {evaluation.criteria.map((criterion) => (
                <div key={criterion.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{criterion.name}</span>
                    <span className="text-muted-foreground">
                      {criterion.score}/{criterion.maxScore}
                    </span>
                  </div>
                  <Progress value={(criterion.score / criterion.maxScore) * 100} />
                </div>
              ))}
            </div>

            {evaluation.feedback && (
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-2">Feedback:</p>
                <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
              </div>
            )}
          </>
        ) : (
          isEvaluator && (
            <div className="border-t border-border pt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">Complete Evaluation</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Complete Evaluation: {evaluation.title}</DialogTitle>
                  </DialogHeader>
                  <EvaluationForm evaluation={evaluation} />
                </DialogContent>
              </Dialog>
            </div>
          )
        )}
      </Card>
    </motion.div>
  )
}

function EvaluationForm({ evaluation }: { evaluation: Evaluation }) {
  return (
    <form className="space-y-4">
      {evaluation.criteria.map((criterion) => (
        <div key={criterion.name}>
          <Label htmlFor={criterion.name}>
            {criterion.name} (Max: {criterion.maxScore})
          </Label>
          <Select>
            <SelectTrigger id={criterion.name}>
              <SelectValue placeholder={`Select score out of ${criterion.maxScore}`} />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: criterion.maxScore + 1 }, (_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {i} / {criterion.maxScore}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      <div>
        <Label htmlFor="feedback">Feedback</Label>
        <Textarea id="feedback" placeholder="Provide detailed feedback..." rows={5} />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Submit Evaluation
        </Button>
      </div>
    </form>
  )
}
