"use client"

import type { ReactNode } from "react"
import { CheckCircle2, Loader2, Send, X } from "lucide-react"
import type { ApiTeamSummary } from "@/lib/api/types"
import { formatTeamStage, formatTeamVisibility, getAvatarInitial, getFullName } from "@/lib/team-display"
import { useIsMobile } from "@/hooks/use-mobile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type JoinRequestTeam = Pick<
  ApiTeamSummary,
  "name" | "bio" | "stage" | "visibility" | "isFull" | "memberCount" | "maxMembers" | "slotsRemaining" | "leader" | "stack"
>

type TeamJoinRequestDialogProps = {
  team: JoinRequestTeam | null
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  onMessageChange: (message: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  title: string
  description: string
  submitLabel?: string
  messageLabel?: string
  messageId?: string
  placeholder?: string
  helperTitle?: string
}

const guidanceItems = [
  "Lead with your strongest skill or preferred track.",
  "Mention one area where you can start contributing right away.",
  "Keep it concise so the team leader can review it quickly.",
]

function JoinRequestPanel({
  team,
  titleNode,
  descriptionNode,
  onOpenChange,
  message,
  onMessageChange,
  onSubmit,
  isSubmitting,
  submitLabel,
  messageLabel,
  messageId,
  placeholder,
  helperTitle,
}: {
  team: JoinRequestTeam
  titleNode: ReactNode
  descriptionNode: ReactNode
  onOpenChange: (open: boolean) => void
  message: string
  onMessageChange: (message: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  submitLabel: string
  messageLabel: string
  messageId: string
  placeholder: string
  helperTitle: string
}) {
  const messageLength = message.trim().length
  const messageHint =
    messageLength === 0
      ? "Optional, but a short note gives the leader more context."
      : messageLength < 70
        ? "Add one concrete skill or task area so your request is easier to evaluate."
        : "This already gives the team leader enough context to review quickly."

  return (
    <div className="flex max-h-[92vh] flex-col bg-background">
      <div className="relative shrink-0 overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/[0.08] via-background to-background px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 rounded-full text-muted-foreground hover:bg-background/80 hover:text-foreground sm:right-4 sm:top-4"
          onClick={() => onOpenChange(false)}
          aria-label="Close join request"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4 pr-10">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-primary/12 text-primary shadow-sm ring-1 ring-primary/10">
            <Send className="h-6 w-6" />
          </div>
          <div className="min-w-0 space-y-2">
            {titleNode}
            {descriptionNode}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
        <div className="space-y-4">
          <section className="rounded-[26px] border border-border/60 bg-background/95 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full border-border/70 bg-background px-3 py-1 text-xs font-medium">
                    {formatTeamStage(team.stage)}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                    {formatTeamVisibility(team.visibility)}
                  </Badge>
                </div>
                <div className="rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary">
                  {team.isFull ? "Team is full" : `${team.slotsRemaining} open ${team.slotsRemaining === 1 ? "spot" : "spots"}`}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight sm:text-xl">{team.name}</h3>
                <p className="text-sm leading-6 text-muted-foreground sm:text-[15px]">{team.bio}</p>
              </div>

              {team.stack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {team.stack.slice(0, 4).map((technology) => (
                    <span
                      key={technology}
                      className="rounded-full border border-border/60 bg-muted/25 px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {technology}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
                    <AvatarImage src={team.leader.avatarUrl || "/placeholder.svg"} />
                    <AvatarFallback>{getAvatarInitial(team.leader)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{getFullName(team.leader)}</p>
                    <p className="text-sm text-muted-foreground">Team Leader</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:w-[180px]">
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Members</p>
                    <p className="mt-2 text-sm font-semibold">
                      {team.memberCount}/{team.maxMembers}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Open</p>
                    <p className="mt-2 text-sm font-semibold">{team.isFull ? "0" : String(team.slotsRemaining)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor={messageId} className="text-sm font-semibold">
                {messageLabel}
              </Label>
              <span className="text-xs text-muted-foreground">{messageLength === 0 ? "Optional" : `${messageLength} characters`}</span>
            </div>
            <Textarea
              id={messageId}
              rows={6}
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              placeholder={placeholder}
              className="min-h-[150px] rounded-[22px] border-border/70 bg-background px-4 py-3 shadow-sm focus-visible:ring-4"
            />
            <p className="text-sm leading-6 text-muted-foreground">{messageHint}</p>
          </section>

          <section className="rounded-[24px] border border-primary/15 bg-primary/[0.05] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">{helperTitle}</p>
                <div className="space-y-2">
                  {guidanceItems.map((item) => (
                    <p key={item} className="text-sm leading-6 text-muted-foreground">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:px-6 sm:py-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl sm:min-w-[120px]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-12 rounded-2xl px-5 sm:min-w-[170px]"
            disabled={isSubmitting}
            onClick={onSubmit}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TeamJoinRequestDialog({
  team,
  open,
  onOpenChange,
  message,
  onMessageChange,
  onSubmit,
  isSubmitting,
  title,
  description,
  submitLabel = "Send Request",
  messageLabel = "Your message",
  messageId = "team-join-request-message",
  placeholder = "Share how you can contribute, what you enjoy building, or where you can support the team first.",
  helperTitle = "What to include",
}: TeamJoinRequestDialogProps) {
  const isMobile = useIsMobile()

  if (!team) return null

  const titleNode = isMobile ? (
    <DrawerTitle className="text-left text-2xl font-semibold tracking-tight">{title}</DrawerTitle>
  ) : (
    <DialogTitle className="text-2xl tracking-tight">{title}</DialogTitle>
  )

  const descriptionNode = isMobile ? (
    <DrawerDescription className="text-left text-sm leading-6 text-muted-foreground">{description}</DrawerDescription>
  ) : (
    <DialogDescription className="leading-6">{description}</DialogDescription>
  )

  const panel = (
    <JoinRequestPanel
      team={team}
      titleNode={titleNode}
      descriptionNode={descriptionNode}
      onOpenChange={onOpenChange}
      message={message}
      onMessageChange={onMessageChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitLabel={submitLabel}
      messageLabel={messageLabel}
      messageId={messageId}
      placeholder={placeholder}
      helperTitle={helperTitle}
    />
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh] rounded-t-[28px] border-border/70 bg-background p-0">
          {panel}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-[42rem] overflow-hidden rounded-[32px] border border-border/70 p-0 shadow-2xl"
      >
        {panel}
      </DialogContent>
    </Dialog>
  )
}
