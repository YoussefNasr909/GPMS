"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Upload,
  CheckCircle2,
  Clock,
  Star,
  FileUp,
  AlertTriangle,
  XCircle,
  Download,
  Trash2,
  Eye,
  RotateCcw,
  FileText,
  MessageSquare,
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { motion } from "framer-motion"
import { TeamRequiredGuard } from "@/components/team-required-guard"
import {
  submissionsApi,
  type ApiSubmission,
  type ApiDeliverableType,
  type ApiSubmissionStatus,
} from "@/lib/api/submissions"
import type { ApiTeamStage } from "@/lib/api/types"
import { toast } from "sonner"

const DELIVERABLE_META: Record<
  ApiDeliverableType,
  { label: string; phase: ApiTeamStage; description: string }
> = {
  SRS: {
    label: "SRS Document",
    phase: "REQUIREMENTS",
    description: "Software Requirements Specification with functional and non-functional requirements",
  },
  UML: {
    label: "UML Diagrams",
    phase: "DESIGN",
    description: "Class, sequence, and activity diagrams covering the system design",
  },
  PROTOTYPE: {
    label: "Prototype",
    phase: "IMPLEMENTATION",
    description: "Working prototype demonstrating core system functionality",
  },
  CODE: {
    label: "Source Code",
    phase: "IMPLEMENTATION",
    description: "Complete source code repository or archive",
  },
  TEST_PLAN: {
    label: "Test Plan",
    phase: "TESTING",
    description: "Test plan, test cases, and QA results",
  },
  FINAL_REPORT: {
    label: "Final Report",
    phase: "DEPLOYMENT",
    description: "Comprehensive final project report",
  },
  PRESENTATION: {
    label: "Presentation",
    phase: "DEPLOYMENT",
    description: "Final project presentation slides",
  },
}

const PHASE_META: Record<ApiTeamStage, { label: string; color: string }> = {
  REQUIREMENTS: { label: "Requirements", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  DESIGN: { label: "Design", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  IMPLEMENTATION: { label: "Implementation", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  TESTING: { label: "Testing", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  DEPLOYMENT: { label: "Deployment", color: "bg-green-500/10 text-green-600 border-green-200" },
  MAINTENANCE: { label: "Maintenance", color: "bg-slate-500/10 text-slate-600 border-slate-200" },
}

const STATUS_META: Record<ApiSubmissionStatus, { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending Review", icon: Clock, variant: "secondary" },
  UNDER_REVIEW: { label: "Under Review", icon: Eye, variant: "secondary" },
  REVISION_REQUIRED: { label: "Needs Revision", icon: RotateCcw, variant: "destructive" },
  APPROVED: { label: "Approved", icon: CheckCircle2, variant: "default" },
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Submission Detail Dialog ────────────────────────────────────────────────
function SubmissionDetailDialog({
  submissions,
  initialVersionId,
  canGrade,
  canSubmit,
  onGraded,
  onDeleted,
}: {
  submissions: ApiSubmission[]
  initialVersionId?: string
  canGrade: boolean
  canSubmit?: boolean
  onGraded: (updated: ApiSubmission) => void
  onDeleted?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(initialVersionId || null)

  useEffect(() => {
    if (open) {
      setSelectedVersionId(initialVersionId || submissions[0]?.id || null)
    }
  }, [open, initialVersionId, submissions])

  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [grade, setGrade] = useState("")
  const [gradeFeedback, setGradeFeedback] = useState("")
  const [revisionFeedback, setRevisionFeedback] = useState("")
  const [loading, setLoading] = useState(false)

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const submission = submissions.find(s => s.id === selectedVersionId) || submissions[0]

  if (!submission) return null

  const meta = DELIVERABLE_META[submission.deliverableType]
  const statusInfo = STATUS_META[submission.status]
  const StatusIcon = statusInfo.icon

  const isLatest = submission.id === submissions[0]?.id
  const hasMultipleVersions = submissions.length > 1;

  async function handleDeleteSingle() {
    setIsDeleting(true)
    try {
      await submissionsApi.delete(submission.id)
      if (onDeleted) onDeleted(submission.id)
      setDeleteAlertOpen(false)
      toast.success("Version deleted successfully")
      if (submissions.length <= 1) {
        setOpen(false)
      } else {
        const remaining = submissions.filter(s => s.id !== submission.id)
        setSelectedVersionId(remaining[0]?.id || null)
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to delete submission")
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleGrade() {
    const g = parseInt(grade)
    if (isNaN(g) || g < 0 || g > 100) {
      toast.error("Grade must be between 0 and 100")
      return
    }
    setLoading(true)
    try {
      const updated = await submissionsApi.grade(submission.id, {
        grade: g,
        feedback: gradeFeedback || undefined,
      })
      onGraded(updated)
      setGradeDialogOpen(false)
      setOpen(false)
      toast.success("Submission graded successfully")
    } catch (e: any) {
      toast.error(e.message || "Failed to grade submission")
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestRevision() {
    if (revisionFeedback.trim().length < 10) {
      toast.error("Please provide at least 10 characters of feedback")
      return
    }
    setLoading(true)
    try {
      const updated = await submissionsApi.requestRevision(submission.id, {
        feedback: revisionFeedback,
      })
      onGraded(updated)
      setRevisionDialogOpen(false)
      setOpen(false)
      toast.success("Revision requested")
    } catch (e: any) {
      toast.error(e.message || "Failed to request revision")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View Details
          </Button>
        </DialogTrigger>
        <DialogContent className={hasMultipleVersions ? "sm:max-w-[1000px] w-[95vw] sm:w-[90vw] p-0 gap-0 overflow-hidden" : "sm:max-w-[700px] w-[95vw] sm:w-[90vw] p-0 gap-0 overflow-hidden"}>
          <div className="flex h-full max-h-[85vh] bg-background">
            {/* Version Sidebar */}
            {hasMultipleVersions && (
              <div className="w-[240px] md:w-[300px] shrink-0 border-r bg-muted/10 flex flex-col hidden md:flex">
                <div className="p-5 border-b bg-muted/30 font-semibold text-sm flex items-center justify-between">
                  <span>Version History</span>
                  <Badge variant="outline" className="text-[10px] font-medium">{submissions.length} versions</Badge>
                </div>
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                  {submissions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedVersionId(s.id)}
                      className={`p-4 rounded-xl border text-sm cursor-pointer transition-all ${
                        selectedVersionId === s.id
                          ? "bg-primary/5 border-primary/50 shadow-sm ring-1 ring-primary/20"
                          : "bg-background hover:bg-muted/50 border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`font-semibold text-base ${selectedVersionId === s.id ? "text-primary" : ""}`}>v{s.version}</span>
                        <Badge variant={STATUS_META[s.status].variant} className="text-[10px] px-1.5 py-0 font-medium">
                          {STATUS_META[s.status].label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-70" />
                          {new Date(s.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
             <div className="flex-1 flex flex-col overflow-y-auto min-w-0 p-6 md:p-8">
              <DialogHeader className="pb-6 border-b flex flex-row flex-wrap items-start justify-between gap-4 mb-4">
                <div className="space-y-2">
                  <Badge variant="secondary" className="font-medium bg-secondary/50 text-secondary-foreground mb-1">Version {submission.version}</Badge>
                  <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{meta.label}</DialogTitle>
                </div>
                
                {canSubmit && submission.status !== "APPROVED" && (
                  <div>
                    <Button
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2"
                      onClick={() => setDeleteAlertOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete Version
                    </Button>

                    <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Version
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete v{submission.version} of this submission? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDeleteSingle() }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </DialogHeader>

              <div className="space-y-8">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusInfo.variant} className="gap-1.5 py-1.5 px-3 text-sm font-medium">
                    <StatusIcon className="h-4 w-4" />
                    {statusInfo.label}
                  </Badge>
                  {submission.late && <Badge variant="destructive" className="py-1.5 px-3 text-sm font-medium">Late Submission</Badge>}
                  {submission.grade !== null && (
                    <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-sm font-medium border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      Score: {submission.grade}%
                    </Badge>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2 bg-muted/20 p-5 rounded-2xl border">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Submitted By</p>
                    <p className="text-sm font-medium">{submission.submittedBy?.fullName || "System"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Submitted On</p>
                    <p className="text-sm font-medium">{new Date(submission.submittedAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(submission.submittedAt).toLocaleTimeString()}</p>
                  </div>
                  {submission.deadline && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deadline</p>
                      <p className="text-sm font-medium">{new Date(submission.deadline).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(submission.deadline).toLocaleTimeString()}</p>
                    </div>
                  )}
                  {submission.reviewedBy && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Reviewed By</p>
                      <p className="text-sm font-medium">{submission.reviewedBy.fullName}</p>
                    </div>
                  )}
                </div>

                {submission.title && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Title</h4>
                    <p className="text-sm">{submission.title}</p>
                  </div>
                )}

                {submission.notes && (
                  <div>
                    <h4 className="text-base font-semibold mb-3">Submission Notes</h4>
                    <p className="text-sm text-foreground bg-muted/30 p-4 rounded-xl italic leading-relaxed border">
                      "{submission.notes}"
                    </p>
                  </div>
               )}

                {submission.fileName && (
                  <div>
                    <h4 className="text-base font-semibold mb-3 flex items-center gap-2">
                       <FileUp className="h-4 w-4 text-muted-foreground" /> Deliverable File
                    </h4>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:border-primary/50 transition-all gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{submission.fileName}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="uppercase font-medium tracking-wider">{submission.fileType?.split('/')[1] || submission.fileType || "unknown"}</span>
                            <span>•</span>
                            <span>{formatFileSize(submission.fileSize)}</span>
                          </p>
                        </div>
                      </div>
                      {submission.fileUrl && (
                        <Button size="sm" className="w-full sm:w-auto shrink-0 shadow-sm" variant="secondary" asChild>
                          <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {submission.feedback && (
                  <div className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl">
                    <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400">
                      <MessageSquare className="h-4 w-4" />
                      <h4 className="text-sm font-semibold">Supervisor Feedback</h4>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{submission.feedback}</p>
                  </div>
                )}

                {canGrade && submission.status !== "APPROVED" && isLatest && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-8">
                    <Button
                      size="lg"
                      className="flex-1 shadow-sm font-semibold"
                      onClick={() => { setOpen(false); setGradeDialogOpen(true) }}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Grade Submission
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 font-semibold border-destructive/20 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                      onClick={() => { setOpen(false); setRevisionDialogOpen(true) }}
                    >
                      <RotateCcw className="h-5 w-5 mr-2" />
                      Request Revision
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Grade (0–100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 85"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Feedback (optional)</Label>
              <Textarea
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Add feedback for the team..."
                className="mt-1.5 resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGrade} disabled={loading} className="flex-1">
                {loading ? "Grading..." : "Submit Grade"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setGradeDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Feedback</Label>
              <Textarea
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="Describe what needs to be revised..."
                className="mt-1.5 resize-none"
                rows={5}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleRequestRevision}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Requesting..." : "Request Revision"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRevisionDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── New Submission Dialog ───────────────────────────────────────────────────
function NewSubmissionDialog({ onCreated }: { onCreated: (s: ApiSubmission) => void }) {
  const [open, setOpen] = useState(false)
  const [deliverableType, setDeliverableType] = useState<ApiDeliverableType | "">("")
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ type?: string; file?: string }>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const selectedPhase = deliverableType
    ? DELIVERABLE_META[deliverableType as ApiDeliverableType].phase
    : null

  function resetForm() {
    setDeliverableType("")
    setTitle("")
    setNotes("")
    setFile(null)
    setFormErrors({})
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const errors: { type?: string; file?: string } = {}
    if (!deliverableType) errors.type = "Please select a deliverable type."
    if (!file) errors.file = "Please upload a file."
    
    if (Object.keys(errors).length > 0 || !file) {
      setFormErrors(errors)
      return
    }

    setLoading(true)
    try {
      const created = await submissionsApi.create(
        {
          deliverableType: deliverableType as ApiDeliverableType,
          sdlcPhase: DELIVERABLE_META[deliverableType as ApiDeliverableType].phase,
          title: title || undefined,
          notes: notes || undefined,
        },
        file,
      )
      onCreated(created)
      resetForm()
      setOpen(false)
      toast.success("Deliverable submitted successfully")
    } catch (e: any) {
      toast.error(e.message || "Submission failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          New Submission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Deliverable</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label className={formErrors.type ? "text-destructive" : ""}>Deliverable Type *</Label>
            <Select
              value={deliverableType}
              onValueChange={(v) => {
                setDeliverableType(v as ApiDeliverableType)
                if (formErrors.type) setFormErrors((prev) => ({ ...prev, type: undefined }))
              }}
            >
              <SelectTrigger className={`mt-1.5 ${formErrors.type ? "border-destructive focus:ring-destructive" : ""}`}>
                <SelectValue placeholder="Select deliverable..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DELIVERABLE_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    <span>{meta.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({meta.phase})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPhase && (
              <p className="text-xs text-muted-foreground mt-1">
                SDLC phase: <strong>{PHASE_META[selectedPhase].label}</strong>
              </p>
            )}
            {formErrors.type && <p className="text-[10px] font-medium text-destructive mt-1">{formErrors.type}</p>}
          </div>

          <div>
            <Label>Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SRS v2 – Final"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for your supervisor..."
              rows={3}
              className="mt-1.5 resize-none"
            />
          </div>
          <div>
            <Label className={formErrors.file ? "text-destructive" : ""}>File *</Label>
            <div
              className={`mt-1.5 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                formErrors.file ? "border-destructive bg-destructive/5 hover:border-destructive" : "border-border hover:border-primary"
              }`}
              onClick={() => fileRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-7 w-7 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX, PPT, ZIP, etc. (max 50 MB)
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.png,.jpg,.jpeg"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                if (formErrors.file) setFormErrors((prev) => ({ ...prev, file: undefined }))
              }}
            />
            {formErrors.file && <p className="text-[10px] font-medium text-destructive mt-1">{formErrors.file}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Submitting..." : "Submit"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { resetForm(); setOpen(false) }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Deliverable Row ─────────────────────────────────────────────────────────
function DeliverableRow({
  deliverableType,
  submissions,
  canSubmit,
  canGrade,
  onCreated,
  onUpdated,
  onDeleted,
}: {
  deliverableType: ApiDeliverableType
  submissions: ApiSubmission[]
  canSubmit: boolean
  canGrade: boolean
  onCreated: (s: ApiSubmission) => void
  onUpdated: (s: ApiSubmission) => void
  onDeleted: (id: string) => void
}) {
  const meta = DELIVERABLE_META[deliverableType]
  const latest = submissions[0] ?? null
  const hasSubmission = !!latest
  const isApproved = latest?.status === "APPROVED"
  const needsRevision = latest?.status === "REVISION_REQUIRED"

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(id: string) {
    setIsDeleting(true)
    try {
      await submissionsApi.delete(id)
      onDeleted(id)
      setIsDeleteDialogOpen(false)
      toast.success("Submission deleted")
    } catch (e: any) {
      toast.error(e.message || "Failed to delete")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <motion.div
      className={`border rounded-lg p-4 transition-colors ${
        isApproved
          ? "border-green-200 bg-green-50/30 dark:bg-green-950/10"
          : needsRevision
          ? "border-red-200 bg-red-50/30 dark:bg-red-950/10"
          : "border-border"
      }`}
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-medium">{meta.label}</h3>
            <Badge variant="outline" className={`text-xs ${PHASE_META[meta.phase].color}`}>
              {PHASE_META[meta.phase].label}
            </Badge>
            {latest && (
              <Badge
                variant={STATUS_META[latest.status].variant}
                className="gap-1 text-xs"
              >
                {(() => {
                  const S = STATUS_META[latest.status].icon
                  return <S className="h-3 w-3" />
                })()}
                {STATUS_META[latest.status].label}
              </Badge>
            )}
            {latest?.late && <Badge variant="destructive" className="text-xs">Late</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
          {latest && (
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>v{latest.version}</span>
              <span>·</span>
              <span>
                {new Date(latest.submittedAt).toLocaleDateString()}
              </span>
              {latest.grade !== null && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 font-medium text-foreground">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {latest.grade}%
                  </span>
                </>
              )}
              {latest.submittedBy && (
                <>
                  <span>·</span>
                  <span>{latest.submittedBy.fullName}</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {latest && (
            <SubmissionDetailDialog
              submissions={submissions}
              canGrade={canGrade}
              canSubmit={canSubmit}
              onGraded={onUpdated}
              onDeleted={onDeleted}
            />
          )}
          {latest && (canSubmit || canGrade) && !isApproved && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Submission
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground mt-2">
                    Are you sure you want to delete this submission? This action cannot be undone.
                  </p>
                  <div className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(latest.id)} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {latest?.feedback && (
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-1 text-muted-foreground">Supervisor Feedback</p>
          <p className="text-sm">{latest.feedback}</p>
        </div>
      )}

      {!hasSubmission && (
        <div className="mt-3">
          <Progress value={0} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">Not submitted yet</p>
        </div>
      )}

      {submissions.length > 1 && (
        <p className="text-xs text-muted-foreground mt-2">
          {submissions.length} versions submitted
        </p>
      )}
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function SubmissionsPage() {
  const { currentUser } = useAuthStore()
  const [submissions, setSubmissions] = useState<ApiSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")

  const userRole = currentUser?.role?.toUpperCase() || ""
  const isLeader = userRole === "LEADER"
  const isSupervisor = userRole === "DOCTOR" || userRole === "TA"
  const isAdmin = userRole === "ADMIN"

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    setLoading(true)
    setError(null)
    try {
      const data = await submissionsApi.list()
      setSubmissions(data)
    } catch (e: any) {
      setError(e.message || "Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  function handleCreated(s: ApiSubmission) {
    setSubmissions((prev) => [s, ...prev])
  }

  function handleUpdated(s: ApiSubmission) {
    setSubmissions((prev) => prev.map((x) => (x.id === s.id ? s : x)))
  }

  function handleDeleted(id: string) {
    setSubmissions((prev) => prev.filter((x) => x.id !== id))
  }

  const uniqueTeams = useMemo(() => {
    const teams = new Map<string, {id: string, name: string}>()
    submissions.forEach(s => {
      if (s.team) teams.set(s.teamId, s.team)
    })
    return Array.from(teams.values())
  }, [submissions])

  useEffect(() => {
    if ((isSupervisor || isAdmin) && uniqueTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(uniqueTeams[0].id)
    }
  }, [uniqueTeams, selectedTeamId, isSupervisor, isAdmin])

  const displaySubmissions = (isSupervisor || isAdmin) && selectedTeamId
    ? submissions.filter(s => s.teamId === selectedTeamId)
    : submissions

  // Group by deliverable type (keep latest first within each type)
  const byDeliverable = Object.keys(DELIVERABLE_META).reduce(
    (acc, key) => {
      const dt = key as ApiDeliverableType
      acc[dt] = displaySubmissions
        .filter((s) => s.deliverableType === dt)
        .sort((a, b) => b.version - a.version)
      return acc
    },
    {} as Record<ApiDeliverableType, ApiSubmission[]>,
  )

  const totalCount = submissions.length
  const gradedCount = submissions.filter((s) => s.grade !== null).length
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length
  const lateCount = submissions.filter((s) => s.late).length
  const avgGrade =
    gradedCount > 0
      ? Math.round(
          submissions.filter((s) => s.grade !== null).reduce((acc, s) => acc + (s.grade ?? 0), 0) /
            gradedCount,
        )
      : 0

  const pendingReviews = submissions.filter(
    (s) => s.status === "PENDING" || s.status === "UNDER_REVIEW",
  )

  return (
    <TeamRequiredGuard
      pageName="Submissions"
      pageDescription="Submit and track your project deliverables."
      icon={<FileUp className="h-10 w-10 text-primary" />}
    >
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              Submissions
            </h1>
            <p className="text-muted-foreground mt-1">Track project deliverables across SDLC phases</p>
          </div>
          {isLeader && <NewSubmissionDialog onCreated={handleCreated} />}
        </motion.div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-1">
              <Upload className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Submissions</span>
            </div>
            <p className="text-3xl font-bold">{totalCount}</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <p className="text-3xl font-bold">{approvedCount}</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-yellow-500">
            <div className="flex items-center gap-3 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Average Grade</span>
            </div>
            <p className="text-3xl font-bold">{gradedCount > 0 ? `${avgGrade}%` : "—"}</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Late Submissions</span>
            </div>
            <p className="text-3xl font-bold">{lateCount}</p>
          </Card>
        </div>

        {/* Error / Loading */}
        {error && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={loadSubmissions} className="ml-auto">
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Pending reviews (supervisors) */}
        {(isSupervisor || isAdmin) && pendingReviews.length > 0 && (
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Reviews
              <Badge variant="secondary">{pendingReviews.length}</Badge>
            </h2>
            <div className="space-y-3">
              {pendingReviews.map((s) => {
                const meta = DELIVERABLE_META[s.deliverableType]
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {s.team?.name} — {meta.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        v{s.version} · Submitted {new Date(s.submittedAt).toLocaleDateString()}
                        {s.late && " · "}
                        {s.late && <span className="text-destructive">Late</span>}
                      </p>
                    </div>
                    <SubmissionDetailDialog 
                      submissions={submissions.filter(x => x.deliverableType === s.deliverableType && x.teamId === s.teamId).sort((a,b)=>b.version - a.version)} 
                      initialVersionId={s.id}
                      canGrade={true} 
                      onGraded={handleUpdated} 
                    />
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Deliverables by phase */}
        <div className="flex items-center justify-between mt-8 mb-4 border-t pt-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Team SDLC Progress</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Track deliverables phase by phase</p>
            </div>
          </div>
          {(isSupervisor || isAdmin) && uniqueTeams.length > 0 && (
            <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-lg border">
               <span className="text-sm font-medium text-muted-foreground whitespace-nowrap px-2">View Team:</span>
               <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                 <SelectTrigger className="w-[240px] bg-background">
                   <SelectValue placeholder="Select team..." />
                 </SelectTrigger>
                 <SelectContent>
                   {uniqueTeams.map(t => (
                     <SelectItem key={t.id} value={t.id} className="font-medium">{t.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {(["REQUIREMENTS", "DESIGN", "IMPLEMENTATION", "TESTING", "DEPLOYMENT"] as ApiTeamStage[]).map(
              (phase) => {
                const phaseDeliverables = Object.entries(DELIVERABLE_META)
                  .filter(([, m]) => m.phase === phase)
                  .map(([key]) => key as ApiDeliverableType)

                return (
                  <Card key={phase} className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className={`${PHASE_META[phase].color} border`}>
                        {PHASE_META[phase].label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {phaseDeliverables.filter((dt) => byDeliverable[dt]?.[0]?.status === "APPROVED").length}
                        /{phaseDeliverables.length} approved
                      </span>
                    </div>
                    <div className="space-y-3">
                      {phaseDeliverables.map((dt) => (
                        <DeliverableRow
                          key={dt}
                          deliverableType={dt}
                          submissions={byDeliverable[dt]}
                          canSubmit={isLeader}
                          canGrade={isSupervisor || isAdmin}
                          onCreated={handleCreated}
                          onUpdated={handleUpdated}
                          onDeleted={handleDeleted}
                        />
                      ))}
                    </div>
                  </Card>
                )
              },
            )}
          </>
        )}
      </div>
    </TeamRequiredGuard>
  )
}
