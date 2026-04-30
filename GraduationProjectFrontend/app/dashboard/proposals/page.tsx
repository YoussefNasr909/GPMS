"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, FileText, Clock, CheckCircle2, AlertCircle, MessageSquare, Lightbulb } from "lucide-react"
import { proposals } from "@/data/proposals"
import { teams } from "@/data/teams"
import { getUserById, useAuthStore } from "@/lib/stores/auth-store"
import Link from "next/link"
import { motion } from "framer-motion"
import { TeamRequiredGuard } from "@/components/team-required-guard"

export default function ProposalsPage() {
  const { currentUser } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const myTeams = teams.filter(
    (t) =>
      t.memberIds.includes(currentUser?.id || "") ||
      t.leaderId === currentUser?.id ||
      t.doctorId === currentUser?.id ||
      t.taId === currentUser?.id,
  )
  const myProposals = proposals.filter((p) => myTeams.some((t) => t.id === p.teamId))

  const filteredProposals = myProposals.filter((proposal) => {
    const team = teams.find((t) => t.id === proposal.teamId)
    const matchesSearch = team?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || proposal.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const canSubmit = currentUser?.role === "leader"

  return (
    <TeamRequiredGuard
      pageName="Proposals"
      pageDescription="Submit and track your graduation project proposals."
      icon={<Lightbulb className="h-10 w-10 text-primary" />}
    >
      <div className="space-y-6 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
              Proposal Pipeline
            </h1>
            <p className="text-muted-foreground mt-1">Submit and track your graduation project proposals</p>
          </div>
          {canSubmit && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Proposal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Project Proposal</DialogTitle>
                </DialogHeader>
                <ProposalForm />
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="feedback-requested">Feedback Requested</SelectItem>
              <SelectItem value="revised">Revised</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="pipeline">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="revisions">Need Revisions</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProposals.map((proposal) => {
                const team = teams.find((t) => t.id === proposal.teamId)
                const leader = getUserById(team?.leaderId || "")
                return (
                  <motion.div key={proposal.id} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold mb-1">{team?.name}</h3>
                          <p className="text-sm text-muted-foreground">Version {proposal.version}</p>
                        </div>
                        <ProposalStatusBadge status={proposal.status} />
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{proposal.problemStatement}</p>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{proposal.objectives.length} objectives</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {proposal.submittedAt
                              ? `Submitted ${new Date(proposal.submittedAt).toLocaleDateString()}`
                              : "Not submitted"}
                          </span>
                        </div>
                        {proposal.reviewComments.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{proposal.reviewComments.length} comments</span>
                          </div>
                        )}
                      </div>

                      <Button asChild className="w-full bg-transparent" variant="outline">
                        <Link href={`/dashboard/proposals/${proposal.id}`}>View Details</Link>
                      </Button>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProposals
                .filter((p) => p.status === "approved")
                .map((proposal) => {
                  const team = teams.find((t) => t.id === proposal.teamId)
                  return (
                    <motion.div
                      key={proposal.id}
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card className="p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold">{team?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Approved on {new Date(proposal.submittedAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{proposal.problemStatement}</p>
                        <Button asChild className="w-full bg-transparent" variant="outline">
                          <Link href={`/dashboard/proposals/${proposal.id}`}>View Proposal</Link>
                        </Button>
                      </Card>
                    </motion.div>
                  )
                })}
            </div>
          </TabsContent>

          <TabsContent value="revisions" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProposals
                .filter((p) => p.status === "feedback-requested" || p.status === "revised")
                .map((proposal) => {
                  const team = teams.find((t) => t.id === proposal.teamId)
                  const unresolvedComments = proposal.reviewComments.filter((c) => !c.resolved)
                  return (
                    <motion.div
                      key={proposal.id}
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card className="p-6 border-yellow-500/50">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold">{team?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {unresolvedComments.length} unresolved comments
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{proposal.problemStatement}</p>
                        <Button asChild className="w-full bg-transparent" variant="outline">
                          <Link href={`/dashboard/proposals/${proposal.id}`}>Address Feedback</Link>
                        </Button>
                      </Card>
                    </motion.div>
                  )
                })}
            </div>
          </TabsContent>
        </Tabs>
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

function ProposalForm() {
  return (
    <form className="space-y-6">
      <div>
        <Label htmlFor="team">Team</Label>
        <Select>
          <SelectTrigger id="team">
            <SelectValue placeholder="Select your team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="t1">Smart Campus</SelectItem>
            <SelectItem value="t2">AI Study Assistant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="problem">Problem Statement</Label>
        <Textarea id="problem" placeholder="Describe the problem your project addresses..." rows={4} />
      </div>

      <div>
        <Label htmlFor="objectives">Objectives</Label>
        <Textarea id="objectives" placeholder="List your project objectives (one per line)..." rows={5} />
      </div>

      <div>
        <Label htmlFor="scope">Project Scope</Label>
        <Textarea id="scope" placeholder="Define the scope of your project..." rows={3} />
      </div>

      <div>
        <Label htmlFor="stack">Technology Stack</Label>
        <Input id="stack" placeholder="React, Node.js, MongoDB..." />
      </div>

      <div>
        <Label htmlFor="risks">Risks & Challenges</Label>
        <Textarea id="risks" placeholder="Identify potential risks and mitigation strategies..." rows={4} />
      </div>

      <div>
        <Label>Project Milestones</Label>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <Input placeholder={`Milestone ${i}`} />
              <Input type="date" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" className="bg-transparent">
          Save as Draft
        </Button>
        <Button type="submit">Submit Proposal</Button>
      </div>
    </form>
  )
}
