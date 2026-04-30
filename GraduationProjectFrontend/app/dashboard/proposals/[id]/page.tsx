"use server"
import { proposals } from "@/data/proposals"
import { teams } from "@/data/teams"
import ProposalDetailClient from "./proposal-detail-client"

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const proposal = proposals.find((p) => p.id === id)

  if (!proposal) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Proposal not found</p>
      </div>
    )
  }

  const team = teams.find((t) => t.id === proposal.teamId)

  return <ProposalDetailClient proposal={proposal} team={team} />
}
