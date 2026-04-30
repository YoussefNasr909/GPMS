"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, FileText, Target, AlertTriangle, Calendar } from "lucide-react"
import { getUserById, useAuthStore } from "@/lib/stores/auth-store"
import { formatDistanceToNow } from "date-fns"
import { TeamRequiredGuard } from "@/components/team-required-guard"

export default function ProposalDetailClient({ proposal, team }: { proposal: any; team: any }) {
  const { currentUser } = useAuthStore()
  const canReview = currentUser?.role === "doctor" || currentUser?.role === "ta" || currentUser?.role === "admin"
  const canEdit = currentUser?.id === team?.leaderId

  return (
    <TeamRequiredGuard
      pageName="Proposal Details"
      pageDescription="Open and manage your team proposal once the team workspace has been created."
      icon={<FileText className="h-10 w-10 text-primary" />}
    >
      <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{team?.name} - Proposal</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline">Version {proposal.version}</Badge>
            <ProposalStatusBadge status={proposal.status} />
            {proposal.submittedAt && (
              <span className="text-sm text-muted-foreground">
                Submitted {formatDistanceToNow(new Date(proposal.submittedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && proposal.status !== "approved" && <Button variant="outline">Edit Proposal</Button>}
          {canReview && proposal.status === "submitted" && (
            <div className="flex gap-2">
              <Button variant="outline">Request Changes</Button>
              <Button>Approve</Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Problem Statement</h2>
            <p className="text-muted-foreground leading-relaxed">{proposal.problemStatement}</p>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Project Objectives</h2>
            <ul className="space-y-2">
              {proposal.objectives.map((objective: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{objective}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Scope</h2>
            <p className="text-muted-foreground leading-relaxed">{proposal.scope}</p>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Technology Stack</h2>
            <div className="flex flex-wrap gap-2">
              {proposal.stack.map((tech: string) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Risks & Mitigation</h2>
            <ul className="space-y-3">
              {proposal.risks.map((risk: string, index: number) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{risk}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4">Project Timeline</h2>
            <div className="space-y-4">
              {proposal.milestones.map(
                (milestone: { title: string; date: string }, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{milestone.title}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(milestone.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Review Comments</h3>
            <div className="space-y-4">
              {proposal.reviewComments.length > 0 ? (
                proposal.reviewComments.map(
                  (comment: { id: string; authorId: string; content: string; resolved: boolean; createdAt: string }) => {
                    const author = getUserById(comment.authorId)
                    return (
                      <div key={comment.id} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={author?.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{author?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{author?.name}</span>
                              {comment.resolved && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  },
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
              )}
            </div>

            {canReview && (
              <div className="mt-4 pt-4 border-t border-border">
                <Textarea placeholder="Add a comment..." rows={3} />
                <div className="flex justify-end gap-2 mt-2">
                  <Button size="sm" variant="outline">
                    Save as Draft
                  </Button>
                  <Button size="sm">Post Comment</Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Version History</h3>
            <div className="space-y-3">
              {Array.from({ length: proposal.version }, (_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Version {proposal.version - i}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  {i === 0 && <Badge variant="default">Current</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
    </TeamRequiredGuard>
  )
}

function ProposalStatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    draft: { variant: "outline", text: "Draft" },
    submitted: { variant: "secondary", text: "Submitted" },
    "feedback-requested": { variant: "secondary", text: "Feedback Requested" },
    revised: { variant: "secondary", text: "Revised" },
    approved: { variant: "default", text: "Approved" },
    rejected: { variant: "destructive", text: "Rejected" },
  }

  const config = variants[status] || variants.draft

  return <Badge variant={config.variant}>{config.text}</Badge>
}
