"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarIcon,
  MapPin,
  Clock,
  Users,
  Video,
  Link2,
  Bell,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  Share2,
  Search,
  Grid3X3,
  List,
  LayoutGrid,
  CalendarPlusIcon as CalendarLucide,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Palette,
  Globe,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { TeamRequiredGuard } from "@/components/team-required-guard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/lib/stores/auth-store"
import { meetings } from "@/data/meetings"
import { tasks } from "@/data/tasks"
import { users } from "@/data/users"
import { toast } from "sonner"
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from "date-fns"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const daysOfWeekShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const daysOfWeekMobile = ["S", "M", "T", "W", "T", "F", "S"]
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

type CalendarEvent = {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  type: "meeting" | "virtual-meeting" | "deadline" | "reminder" | "milestone" | "presentation" | "review"
  priority?: "low" | "medium" | "high" | "critical"
  location?: string
  meetingLink?: string
  attendees?: { id: string; name: string; avatar?: string; status: "accepted" | "declined" | "pending" }[]
  organizer?: { id: string; name: string; avatar?: string }
  recurring?: { type: "daily" | "weekly" | "monthly"; interval: number; endDate?: string }
  reminders?: { type: "email" | "push" | "sms"; minutes: number }[]
  color?: string
  isAllDay?: boolean
  status?: "scheduled" | "in-progress" | "completed" | "cancelled"
  attachments?: { name: string; url: string }[]
  notes?: string
  tags?: string[]
  visibility?: "public" | "private" | "team"
}

const generateMockEvents = (currentUser: any): CalendarEvent[] => {
  const events: CalendarEvent[] = []

  // Convert meetings to calendar events
  meetings
    .filter((m) => m.attendeeIds?.includes(currentUser?.id || ""))
    .forEach((meeting) => {
      const startDate = new Date(meeting.startTime)
      const endDate = new Date(meeting.endTime)
      events.push({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        date: format(startDate, "yyyy-MM-dd"),
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        type: meeting.isVirtual ? "virtual-meeting" : "meeting",
        location: meeting.location,
        meetingLink: meeting.meetingLink,
        attendees: meeting.attendeeIds?.map((id) => {
          const user = users.find((u) => u.id === id)
          return { id, name: user?.name || "Unknown", avatar: user?.avatar, status: "accepted" as const }
        }),
        organizer: users.find((u) => u.id === meeting.organizerId)
          ? { id: meeting.organizerId, name: users.find((u) => u.id === meeting.organizerId)!.name }
          : undefined,
        status: "scheduled",
        color: meeting.isVirtual ? "#8b5cf6" : "#3b82f6",
        visibility: "team",
      })
    })

  // Convert task deadlines to calendar events
  tasks
    .filter((t) => t.assigneeId === currentUser?.id && t.dueDate)
    .forEach((task) => {
      events.push({
        id: `task-${task.id}`,
        title: `Deadline: ${task.title}`,
        description: task.description,
        date: task.dueDate!,
        startTime: "23:59",
        endTime: "23:59",
        type: "deadline",
        priority: task.priority,
        status: task.status === "done" ? "completed" : "scheduled",
        color: task.priority === "critical" ? "#ef4444" : task.priority === "high" ? "#f97316" : "#eab308",
        tags: task.tags,
        visibility: "private",
      })
    })

  // Add some additional mock events for demonstration
  const additionalEvents: CalendarEvent[] = [
    {
      id: "ev1",
      title: "Project Presentation",
      description: "Final presentation to the evaluation committee",
      date: "2025-01-25",
      startTime: "10:00",
      endTime: "12:00",
      type: "presentation",
      location: "Conference Hall A",
      attendees: [
        { id: "u1", name: "Dr. Ahmed Hassan", status: "accepted" },
        { id: "u2", name: "Dr. Sara Ali", status: "pending" },
      ],
      priority: "critical",
      status: "scheduled",
      color: "#ec4899",
      reminders: [
        { type: "email", minutes: 1440 },
        { type: "push", minutes: 60 },
      ],
      visibility: "public",
    },
    {
      id: "ev2",
      title: "Code Review Session",
      description: "Weekly code review with the team",
      date: "2025-01-20",
      startTime: "14:00",
      endTime: "15:30",
      type: "review",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      attendees: [
        { id: "u3", name: "Ahmed Mohamed", status: "accepted" },
        { id: "u4", name: "Fatima Hassan", status: "accepted" },
      ],
      recurring: { type: "weekly", interval: 1 },
      status: "scheduled",
      color: "#10b981",
      visibility: "team",
    },
    {
      id: "ev3",
      title: "Sprint Planning",
      description: "Plan tasks for the upcoming sprint",
      date: "2025-01-21",
      startTime: "09:00",
      endTime: "10:30",
      type: "meeting",
      location: "Room 301",
      status: "scheduled",
      color: "#6366f1",
      visibility: "team",
    },
    {
      id: "ev4",
      title: "Milestone: Alpha Release",
      description: "Complete alpha version of the application",
      date: "2025-01-28",
      startTime: "00:00",
      endTime: "23:59",
      type: "milestone",
      isAllDay: true,
      priority: "high",
      status: "scheduled",
      color: "#f59e0b",
      visibility: "public",
    },
    {
      id: "ev5",
      title: "Team Standup",
      description: "Daily standup meeting",
      date: "2025-01-15",
      startTime: "09:00",
      endTime: "09:15",
      type: "virtual-meeting",
      meetingLink: "https://zoom.us/j/123456789",
      recurring: { type: "daily", interval: 1, endDate: "2025-06-30" },
      status: "scheduled",
      color: "#8b5cf6",
      visibility: "team",
    },
  ]

  return [...events, ...additionalEvents]
}

export default function CalendarPage() {
  const { currentUser } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 15))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "agenda">("month")
  const [filterType, setFilterType] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showSyncDialog, setShowSyncDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // New event form state
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    type: "meeting",
    location: "",
    meetingLink: "",
    isAllDay: false,
    visibility: "team",
    reminders: [{ type: "push", minutes: 15 }],
  })

  const allEvents = useMemo(() => generateMockEvents(currentUser), [currentUser])

  const filteredEvents = useMemo(() => {
    let events = allEvents
    if (filterType !== "all") {
      events = events.filter((e) => e.type === filterType)
    }
    if (searchQuery) {
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }
    return events
  }, [allEvents, filterType, searchQuery])

  // Calendar calculations
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()
    return { firstDay, daysInMonth, prevMonthDays }
  }

  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return filteredEvents.filter((e) => e.date === dateStr)
  }

  const { firstDay, daysInMonth, prevMonthDays } = getDaysInMonth(currentDate)
  const weekDays = getWeekDays(currentDate)

  // Navigation handlers
  const goToToday = () => setCurrentDate(new Date())
  const goToPrevious = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1))
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, -1))
  }
  const goToNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1))
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  // Event handlers
  const handleCreateEvent = () => {
    if (!newEvent.title?.trim()) {
      toast.error("Event title is required")
      return
    }
    toast.success("Event created successfully")
    setShowAddDialog(false)
    setNewEvent({
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
      type: "meeting",
      location: "",
      meetingLink: "",
      isAllDay: false,
      visibility: "team",
    })
  }

  const handleDeleteEvent = (event: CalendarEvent) => {
    toast.success("Event deleted successfully")
    setShowEventDialog(false)
    setSelectedEvent(null)
  }

  const handleExportCalendar = (format: "ics" | "csv") => {
    toast.success(`Calendar exported as ${format.toUpperCase()}`)
  }

  const handleSyncCalendar = (provider: string) => {
    toast.success(`Calendar synced with ${provider}`)
    setShowSyncDialog(false)
  }

  const getEventColor = (type: string, priority?: string) => {
    if (priority === "critical") return "bg-red-500"
    if (priority === "high") return "bg-orange-500"
    switch (type) {
      case "meeting":
        return "bg-blue-500"
      case "virtual-meeting":
        return "bg-purple-500"
      case "deadline":
        return "bg-red-500"
      case "reminder":
        return "bg-yellow-500"
      case "milestone":
        return "bg-amber-500"
      case "presentation":
        return "bg-pink-500"
      case "review":
        return "bg-emerald-500"
      default:
        return "bg-primary"
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Users className="h-3 w-3" />
      case "virtual-meeting":
        return <Video className="h-3 w-3" />
      case "deadline":
        return <AlertCircle className="h-3 w-3" />
      case "reminder":
        return <Bell className="h-3 w-3" />
      case "milestone":
        return <CheckCircle2 className="h-3 w-3" />
      case "presentation":
        return <CalendarLucide className="h-3 w-3" />
      case "review":
        return <Edit className="h-3 w-3" />
      default:
        return <CalendarIcon className="h-3 w-3" />
    }
  }

  const upcomingEvents = filteredEvents
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8)

  return (
    <TeamRequiredGuard
      pageName="Calendar & Schedule"
      pageDescription="Track team meetings, deadlines, and project events in one shared calendar."
      icon={<CalendarLucide className="h-10 w-10 text-primary" />}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Calendar</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your schedule, meetings, and deadlines</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>

            {/* Sync Calendar Dialog */}
            <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Sync</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sync Calendar</DialogTitle>
                  <DialogDescription>Connect your calendar with external services</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">Connect your calendar with external services:</p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 bg-transparent"
                      onClick={() => handleSyncCalendar("Google Calendar")}
                    >
                      <div className="h-5 w-5 rounded bg-gradient-to-br from-blue-500 to-green-500" />
                      Google Calendar
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 bg-transparent"
                      onClick={() => handleSyncCalendar("Outlook")}
                    >
                      <div className="h-5 w-5 rounded bg-gradient-to-br from-blue-600 to-blue-400" />
                      Microsoft Outlook
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 bg-transparent"
                      onClick={() => handleSyncCalendar("Apple Calendar")}
                    >
                      <div className="h-5 w-5 rounded bg-gradient-to-br from-gray-700 to-gray-500" />
                      Apple Calendar
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Export Calendar</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleExportCalendar("ics")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ICS File
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleExportCalendar("csv")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        CSV File
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Event Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Event</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                  <DialogDescription>Fill in the details to create a new calendar event</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      placeholder="Event title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newEvent.type} onValueChange={(v: any) => setNewEvent({ ...newEvent, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="virtual-meeting">Virtual Meeting</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="presentation">Presentation</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newEvent.isAllDay}
                      onCheckedChange={(c) => setNewEvent({ ...newEvent, isAllDay: c })}
                    />
                    <Label>All day event</Label>
                  </div>

                  {!newEvent.isAllDay && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={newEvent.startTime}
                          onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={newEvent.endTime}
                          onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="Location or meeting room"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    />
                  </div>

                  {(newEvent.type === "virtual-meeting" || newEvent.type === "meeting") && (
                    <div className="space-y-2">
                      <Label>Meeting Link</Label>
                      <Input
                        placeholder="https://meet.google.com/..."
                        value={newEvent.meetingLink}
                        onChange={(e) => setNewEvent({ ...newEvent, meetingLink: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Event description..."
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <Select
                      value={newEvent.visibility}
                      onValueChange={(v: any) => setNewEvent({ ...newEvent, visibility: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Public
                          </div>
                        </SelectItem>
                        <SelectItem value="team">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Team Only
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Private
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Reminder</Label>
                    <Select defaultValue="15">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes before</SelectItem>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                        <SelectItem value="1440">1 day before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch />
                    <Label>Recurring event</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEvent}>Create Event</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToPrevious} className="h-9 w-9 touch-target-sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base sm:text-lg font-semibold min-w-[180px] sm:min-w-[200px] text-center">
              {viewMode === "day"
                ? format(currentDate, "EEEE, MMMM d, yyyy")
                : viewMode === "week"
                  ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`
                  : format(currentDate, "MMMM yyyy")}
            </h2>
            <Button variant="ghost" size="icon" onClick={goToNext} className="h-9 w-9 touch-target-sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Make tabs scrollable on mobile */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <TabsList className="h-9">
                <TabsTrigger value="month" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <Grid3X3 className="h-3.5 w-3.5 hidden xs:block" />
                  Month
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <LayoutGrid className="h-3.5 w-3.5 hidden xs:block" />
                  Week
                </TabsTrigger>
                <TabsTrigger value="day" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <CalendarIcon className="h-3.5 w-3.5 hidden xs:block" />
                  Day
                </TabsTrigger>
                <TabsTrigger value="agenda" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <List className="h-3.5 w-3.5 hidden xs:block" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  className="pl-9 w-[150px] sm:w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="meeting">Meetings</SelectItem>
                  <SelectItem value="virtual-meeting">Virtual</SelectItem>
                  <SelectItem value="deadline">Deadlines</SelectItem>
                  <SelectItem value="milestone">Milestones</SelectItem>
                  <SelectItem value="presentation">Presentations</SelectItem>
                  <SelectItem value="review">Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Main Calendar */}
        <Card className="lg:col-span-3">
          <CardContent className="p-4 md:p-6">
            {/* Month View */}
            {viewMode === "month" && (
              <>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeekShort.map((day, i) => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{daysOfWeekMobile[i]}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Previous month days */}
                  {Array.from({ length: firstDay }).map((_, i) => {
                    const day = prevMonthDays - firstDay + i + 1
                    return (
                      <div key={`prev-${i}`} className="aspect-square p-1 text-muted-foreground/40">
                        <span className="text-xs">{day}</span>
                      </div>
                    )
                  })}
                  {/* Current month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                    const events = getEventsForDate(date)
                    const isCurrentDay = isToday(date)
                    const isSelected = selectedDate && isSameDay(date, selectedDate)

                    return (
                      <motion.button
                        key={day}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedDate(date)}
                        className={`aspect-square p-1 rounded-lg transition-all relative flex flex-col ${
                          isCurrentDay
                            ? "bg-primary text-primary-foreground"
                            : isSelected
                              ? "bg-primary/20 ring-2 ring-primary"
                              : "hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-xs font-medium">{day}</span>
                        {events.length > 0 && (
                          <div className="flex-1 overflow-hidden mt-1">
                            <div className="flex flex-col gap-0.5">
                              {events.slice(0, 2).map((event) => (
                                <div
                                  key={event.id}
                                  className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate text-white ${getEventColor(event.type, event.priority)}`}
                                >
                                  <span className="hidden sm:inline">{event.title}</span>
                                  <span className="sm:hidden">{getEventIcon(event.type)}</span>
                                </div>
                              ))}
                              {events.length > 2 && (
                                <span className="text-[9px] text-muted-foreground">+{events.length - 2} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </>
            )}

            {/* Week View */}
            {viewMode === "week" && (
              <div className="space-y-2">
                <div className="grid grid-cols-8 gap-1">
                  <div className="text-xs text-muted-foreground py-2">Time</div>
                  {weekDays.map((date) => (
                    <div
                      key={date.toString()}
                      className={`text-center py-2 rounded-lg ${isToday(date) ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      <div className="text-xs font-medium">{format(date, "EEE")}</div>
                      <div className="text-lg font-bold">{format(date, "d")}</div>
                    </div>
                  ))}
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    {Array.from({ length: 12 }).map((_, hour) => {
                      const time = hour + 8
                      return (
                        <div key={hour} className="grid grid-cols-8 gap-1 min-h-[60px]">
                          <div className="text-xs text-muted-foreground py-2">{`${time}:00`}</div>
                          {weekDays.map((date) => {
                            const dayEvents = getEventsForDate(date).filter((e) => {
                              const eventHour = Number.parseInt(e.startTime.split(":")[0])
                              return eventHour === time
                            })
                            return (
                              <div key={date.toString()} className="border-t p-1 min-h-[60px]">
                                {dayEvents.map((event) => (
                                  <div
                                    key={event.id}
                                    className={`text-xs p-1 rounded text-white mb-1 cursor-pointer ${getEventColor(event.type)}`}
                                    onClick={() => {
                                      setSelectedEvent(event)
                                      setShowEventDialog(true)
                                    }}
                                  >
                                    <div className="font-medium truncate">{event.title}</div>
                                    <div className="opacity-75">{event.startTime}</div>
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Day View */}
            {viewMode === "day" && (
              <ScrollArea className="h-[500px]">
                <div className="space-y-1">
                  {Array.from({ length: 14 }).map((_, hour) => {
                    const time = hour + 7
                    const dayEvents = getEventsForDate(currentDate).filter((e) => {
                      const eventHour = Number.parseInt(e.startTime.split(":")[0])
                      return eventHour === time
                    })
                    return (
                      <div key={hour} className="grid grid-cols-[80px_1fr] gap-4 min-h-[60px]">
                        <div className="text-sm text-muted-foreground py-2 text-right">{`${time}:00`}</div>
                        <div className="border-t p-2 min-h-[60px]">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`p-3 rounded-lg text-white mb-2 cursor-pointer ${getEventColor(event.type)}`}
                              onClick={() => {
                                setSelectedEvent(event)
                                setShowEventDialog(true)
                              }}
                            >
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm opacity-75 mt-1">
                                {event.startTime} - {event.endTime}
                                {event.location && ` • ${event.location}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Agenda View */}
            {viewMode === "agenda" && (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowEventDialog(true)
                      }}
                    >
                      <div className={`p-2 rounded-lg ${getEventColor(event.type)} text-white`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(event.date), "EEEE, MMMM d")} • {event.startTime} - {event.endTime}
                            </p>
                          </div>
                          <Badge variant="outline">{event.type.replace("-", " ")}</Badge>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex -space-x-2">
                              {event.attendees.slice(0, 3).map((attendee, i) => (
                                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                                  <AvatarImage src={attendee.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">{attendee.name[0]}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            {event.attendees.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{event.attendees.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Mini Calendar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Quick Navigate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center">
                {daysOfWeekMobile.map((d, i) => (
                  <div key={`dow-${i}`} className="text-[10px] text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                  const hasEvents = getEventsForDate(date).length > 0
                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setCurrentDate(date)
                        setViewMode("day")
                      }}
                      className={`aspect-square flex items-center justify-center text-xs rounded-full transition-colors ${
                        isToday(date)
                          ? "bg-primary text-primary-foreground"
                          : hasEvents
                            ? "bg-primary/20 font-medium"
                            : "hover:bg-muted"
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowEventDialog(true)
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${getEventColor(event.type)}`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{event.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.date), "MMM d")} • {event.startTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No upcoming events</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Event Types Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Event Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { type: "meeting", label: "Meeting", color: "bg-blue-500" },
                  { type: "virtual-meeting", label: "Virtual Meeting", color: "bg-purple-500" },
                  { type: "deadline", label: "Deadline", color: "bg-red-500" },
                  { type: "milestone", label: "Milestone", color: "bg-amber-500" },
                  { type: "presentation", label: "Presentation", color: "bg-pink-500" },
                  { type: "review", label: "Review", color: "bg-emerald-500" },
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded ${item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getEventColor(selectedEvent.type)} text-white`}>
                      {getEventIcon(selectedEvent.type)}
                    </div>
                    <div>
                      <DialogTitle>{selectedEvent.title}</DialogTitle>
                      <Badge variant="outline" className="mt-1">
                        {selectedEvent.type.replace("-", " ")}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteEvent(selectedEvent)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <DialogDescription>View event details and perform actions</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(selectedEvent.date), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.meetingLink && (
                  <div className="flex items-center gap-3 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={selectedEvent.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      Join Meeting
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {selectedEvent.description && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                    </div>
                  </>
                )}
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Attendees ({selectedEvent.attendees.length})</h4>
                      <div className="space-y-2">
                        {selectedEvent.attendees.map((attendee, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={attendee.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">{attendee.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{attendee.name}</span>
                            </div>
                            <Badge
                              variant={
                                attendee.status === "accepted"
                                  ? "default"
                                  : attendee.status === "declined"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {attendee.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                  Close
                </Button>
                {selectedEvent.meetingLink && (
                  <Button asChild>
                    <a href={selectedEvent.meetingLink} target="_blank" rel="noopener noreferrer">
                      <Video className="h-4 w-4 mr-2" />
                      Join Meeting
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
    </TeamRequiredGuard>
  )
}
