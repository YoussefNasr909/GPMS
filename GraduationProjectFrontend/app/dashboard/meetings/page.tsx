"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Video, MapPin, Clock, Plus, Users } from "lucide-react"
import { meetings } from "@/data/meetings"
import { teams } from "@/data/teams"
import { users } from "@/data/users"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { TeamRequiredGuard } from "@/components/team-required-guard"

export default function MeetingsPage() {
  const { currentUser } = useAuthStore()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const myMeetings = meetings.filter((m) => m.attendeeIds.includes(currentUser?.id || ""))
  const upcomingMeetings = myMeetings.filter((m) => m.status === "scheduled" && new Date(m.startTime) > new Date())
  const pastMeetings = myMeetings.filter((m) => m.status === "completed" || new Date(m.startTime) < new Date())
  const todaysMeetings = upcomingMeetings.filter((m) => {
    const meetingDate = new Date(m.startTime)
    const today = new Date()
    return meetingDate.toDateString() === today.toDateString()
  })

  return (
    <TeamRequiredGuard
      pageName="Meetings"
      pageDescription="Schedule and manage team meetings with your supervisors and teammates."
      icon={<Calendar className="h-10 w-10 text-primary" />}
    >
      <div className="space-y-6 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Meetings
            </h1>
            <p className="text-muted-foreground mt-1">Schedule and manage team meetings</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Meeting</DialogTitle>
                <DialogDescription>Fill in the details below to schedule a team meeting.</DialogDescription>
              </DialogHeader>
              <MeetingForm onClose={() => setShowAddDialog(false)} />
            </DialogContent>
          </Dialog>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-6 border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">Upcoming</span>
            </div>
            <p className="text-3xl font-bold">{upcomingMeetings.length}</p>
          </Card>

          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <span className="font-medium">Today</span>
            </div>
            <p className="text-3xl font-bold text-blue-500">{todaysMeetings.length}</p>
          </Card>

          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <span className="font-medium">This Week</span>
            </div>
            <p className="text-3xl font-bold text-green-500">
              {
                upcomingMeetings.filter((m) => {
                  const meetingDate = new Date(m.startTime)
                  const weekFromNow = new Date()
                  weekFromNow.setDate(weekFromNow.getDate() + 7)
                  return meetingDate < weekFromNow
                }).length
              }
            </p>
          </Card>

          <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-purple-500" />
              </div>
              <span className="font-medium">Virtual</span>
            </div>
            <p className="text-3xl font-bold text-purple-500">{upcomingMeetings.filter((m) => m.isVirtual).length}</p>
          </Card>
        </div>

        {todaysMeetings.length > 0 && (
          <Card className="p-6 border-primary/50">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Meetings
            </h3>
            <div className="grid gap-3">
              {todaysMeetings.map((meeting) => {
                const startTime = new Date(meeting.startTime)
                const now = new Date()
                const isHappening = startTime <= now && new Date(meeting.endTime) >= now

                return (
                  <motion.div
                    key={meeting.id}
                    whileHover={{ scale: 1.01 }}
                    className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{meeting.title}</h4>
                        {isHappening && <Badge className="animate-pulse bg-green-500">Live Now</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        {meeting.isVirtual ? " - Virtual" : ` - ${meeting.location}`}
                      </p>
                    </div>
                    {meeting.isVirtual && meeting.meetingLink && (
                      <Button size="sm" asChild>
                        <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4 mr-2" />
                          Join Meeting
                        </a>
                      </Button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </Card>
        )}

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="upcoming">Upcoming ({upcomingMeetings.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastMeetings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {upcomingMeetings.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming meetings scheduled</p>
              </Card>
            ) : (
              upcomingMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onViewDetails={() => {
                    setSelectedMeeting(meeting)
                    setShowDetailsDialog(true)
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-6">
            {pastMeetings.length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No past meetings found</p>
              </Card>
            ) : (
              pastMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onViewDetails={() => {
                    setSelectedMeeting(meeting)
                    setShowDetailsDialog(true)
                  }}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedMeeting?.title}</DialogTitle>
              <DialogDescription>Meeting information, agenda, and attendees.</DialogDescription>
            </DialogHeader>
            {selectedMeeting && <MeetingDetails meeting={selectedMeeting} />}
          </DialogContent>
        </Dialog>
      </div>
    </TeamRequiredGuard>
  )
}

function MeetingCard({ meeting, onViewDetails }: { meeting: (typeof meetings)[0]; onViewDetails: () => void }) {
  const team = teams.find((t) => t.id === meeting.teamId)
  const organizer = users.find((u) => u.id === meeting.organizerId)
  const startDate = new Date(meeting.startTime)
  const endDate = new Date(meeting.endTime)

  const meetingTypeColors = {
    planning: "default",
    supervision: "secondary",
    standup: "outline",
    review: "default",
    presentation: "default",
    other: "outline",
  } as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{meeting.title}</h3>
              <Badge variant={meetingTypeColors[meeting.type]}>{meeting.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{meeting.description}</p>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                {meeting.isVirtual ? (
                  <>
                    <Video className="h-4 w-4" />
                    <span>Virtual Meeting</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>{meeting.location}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{meeting.attendeeIds.length} attendees</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {meeting.isVirtual && meeting.meetingLink && (
              <Button size="sm" asChild className="w-full sm:w-auto">
                <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onViewDetails} className="w-full sm:w-auto bg-transparent">
              View Details
            </Button>
          </div>
        </div>

        {meeting.agenda && meeting.agenda.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium mb-2">Agenda:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {meeting.agenda.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {meeting.notes && (
          <div className="border-t border-border pt-4 mt-4">
            <p className="text-sm font-medium mb-2">Meeting Notes:</p>
            <p className="text-sm text-muted-foreground">{meeting.notes}</p>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

function MeetingDetails({ meeting }: { meeting: any }) {
  const startDate = new Date(meeting.startTime)
  const endDate = new Date(meeting.endTime)
  const attendees = users.filter((u) => meeting.attendeeIds.includes(u.id))

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label className="text-muted-foreground">Description</Label>
          <p className="mt-2">{meeting.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Date & Time</Label>
            <p className="mt-2">
              {startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              <br />
              {startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} -
              {endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div>
            <Label className="text-muted-foreground">Location</Label>
            <p className="mt-2 flex items-center gap-2">
              {meeting.isVirtual ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              {meeting.isVirtual ? "Virtual Meeting" : meeting.location}
            </p>
          </div>
        </div>

        {meeting.agenda && meeting.agenda.length > 0 && (
          <div>
            <Label className="text-muted-foreground">Agenda</Label>
            <ul className="mt-2 space-y-2">
              {meeting.agenda.map((item: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <Label className="text-muted-foreground">Attendees ({meeting.attendeeIds.length})</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {attendees.map((attendee) => (
              <Badge key={attendee.id} variant="secondary">
                {attendee.name}
              </Badge>
            ))}
          </div>
        </div>

        {meeting.notes && (
          <div>
            <Label className="text-muted-foreground">Meeting Notes</Label>
            <div className="mt-2 p-4 rounded-xl bg-muted/50">
              <p>{meeting.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MeetingForm({ onClose }: { onClose: () => void }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Meeting scheduled successfully!")
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Meeting Title</Label>
          <Input id="title" placeholder="Sprint Planning" />
        </div>
        <div>
          <Label htmlFor="type">Meeting Type</Label>
          <Select>
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="supervision">Supervision</SelectItem>
              <SelectItem value="standup">Daily Standup</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Meeting description..." rows={3} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="start-time">Start Time</Label>
          <Input id="start-time" type="datetime-local" />
        </div>
        <div>
          <Label htmlFor="end-time">End Time</Label>
          <Input id="end-time" type="datetime-local" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="location-type">Location Type</Label>
          <Select>
            <SelectTrigger id="location-type">
              <SelectValue placeholder="Select location type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="virtual">Virtual</SelectItem>
              <SelectItem value="in-person">In Person</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Location / Meeting Link</Label>
          <Input id="location" placeholder="Conference Room A or https://meet.google.com/..." />
        </div>
      </div>

      <div>
        <Label htmlFor="attendees">Attendees</Label>
        <Select>
          <SelectTrigger id="attendees">
            <SelectValue placeholder="Select attendees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="team">Entire Team</SelectItem>
            <SelectItem value="custom">Custom Selection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Schedule Meeting
        </Button>
      </div>
    </form>
  )
}
