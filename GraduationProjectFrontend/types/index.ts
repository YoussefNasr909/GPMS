export type UserRole = "admin" | "doctor" | "ta" | "leader" | "member"

export type User = {
  id: string
  firstName?: string
  lastName?: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatar?: string
  department?: string
  academicYear?: string
  academicId?: string
  track?: string
  preferredTrack?: string
  xp?: number
  gold?: number
  level?: number
  teamId?: string
  teamName?: string
  specialization?: string
  skills?: string[]
  joinDate?: string
  socialLinks?: {
    linkedin?: string
    github?: string
    twitter?: string
  }
  bio?: string
  studentCode?: string
  streak?: number
  expertise?: string[]
  officeHours?: string
  capacity?: number
  maxTeams?: number
  linkedinUrl?: string
  githubUsername?: string
}

export type JoinRequest = {
  id: string
  userId: string
  teamId: string
  message: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

export type Team = {
  id: string
  name: string
  description: string
  leaderId: string
  memberIds: string[]
  doctorId?: string
  taId?: string
  logo?: string
  cover?: string
  stack: string[]
  stage: SDLCStage
  visibility: "public" | "private"
  progress: number
  health: "healthy" | "at-risk" | "critical"
  createdAt: string
  inviteCode?: string
  maxMembers?: number
  joinRequests?: JoinRequest[]
}

export type SDLCStage = "requirements" | "design" | "implementation" | "testing" | "deployment" | "maintenance"

export type Task = {
  id: string
  title: string
  description: string
  teamId: string
  assigneeId?: string
  status: "backlog" | "todo" | "in-progress" | "review" | "done"
  priority: "low" | "medium" | "high" | "critical"
  estimate?: number
  tags: string[]
  dependencies?: string[]
  createdAt: string
  dueDate?: string
}

export type Meeting = {
  id: string
  title: string
  teamId: string
  description?: string
  type: "planning" | "supervision" | "standup" | "review" | "presentation" | "other"
  date: string
  time?: string
  startTime: string
  endTime: string
  duration?: number
  location?: string
  isVirtual?: boolean
  meetingLink?: string
  attendees?: string[]
  attendeeIds: string[]
  organizerId: string
  status?: "scheduled" | "in-progress" | "completed" | "cancelled"
  agenda: string[]
  notes?: string
  decisions?: string[]
  actionItems?: string[]
  recurring?: boolean
}

export type Message = {
  id: string
  senderId: string
  recipientId?: string
  channelId?: string
  content: string
  timestamp: string
  reactions?: { emoji: string; userIds: string[] }[]
}

export type Question = {
  id: string
  title: string
  content: string
  authorId: string
  tags: string[]
  answers: Answer[]
  acceptedAnswerId?: string
  createdAt: string
}

export type Answer = {
  id: string
  questionId: string
  content: string
  authorId: string
  createdAt: string
}

export type Proposal = {
  id: string
  teamId: string
  version: number
  status: "draft" | "submitted" | "feedback-requested" | "revised" | "approved" | "rejected"
  problemStatement: string
  objectives: string[]
  scope: string
  stack: string[]
  risks: string[]
  milestones: { title: string; date: string }[]
  submittedAt?: string
  reviewComments: ReviewComment[]
}

export type ReviewComment = {
  id: string
  authorId: string
  content: string
  resolved: boolean
  createdAt: string
}

export type Submission = {
  id: string
  teamId: string
  deliverableType: "srs" | "uml" | "prototype" | "code" | "test-plan" | "final-report" | "presentation"
  version: number
  submittedAt: string
  deadline: string
  late: boolean
  feedback?: string
  grade?: number
}

export type Rubric = {
  id: string
  name: string
  type: "proposal" | "midterm" | "final"
  criteria: RubricCriterion[]
  totalWeight: number
}

export type RubricCriterion = {
  id: string
  name: string
  description: string
  weight: number
  maxScore: number
}

export type Evaluation = {
  id: string
  submissionId: string
  rubricId: string
  evaluatorId: string
  scores: { criterionId: string; score: number; comment: string }[]
  finalGrade: number
  status: "draft" | "submitted" | "finalized"
  createdAt: string
}

export type Notification = {
  id: string
  userId: string
  type: "task" | "meeting" | "submission" | "evaluation" | "message" | "system"
  title: string
  message?: string
  content: string
  read: boolean
  actionUrl?: string
  timestamp?: string
  createdAt: string
}

export type Announcement = {
  id: string
  title: string
  content: string
  authorId: string
  pinned: boolean
  reactions?: { emoji: string; count: number }[]
  createdAt: string
}

export type KnowledgeArticle = {
  id: string
  title: string
  content: string
  category: "sdlc" | "tools" | "testing" | "deployment" | "reports"
  tags: string[]
  helpful: number
  createdAt: string
}

export type Activity = {
  id: string
  userId: string
  type: "task" | "meeting" | "submission" | "comment" | "approval"
  description: string
  metadata?: Record<string, any>
  createdAt: string
}

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string
  category: "tasks" | "collaboration" | "learning" | "leadership" | "quality" | "streak"
  rarity: "common" | "rare" | "epic" | "legendary"
  points: number
  unlocked: boolean
  progress: number
  unlockedAt?: string
}

export type Quest = {
  id: string
  title: string
  description: string
  type: "daily" | "weekly" | "seasonal"
  status: "active" | "completed" | "expired"
  requirements: { description: string; progress: number; target: number }[]
  rewards: { xp: number; coins: number; items?: string[] }
  expiresAt?: string
  completedAt?: string
}

export type Challenge = {
  id: string
  title: string
  description: string
  type: "team" | "individual" | "global"
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "completed"
  participants: { userId: string; teamId?: string; score: number }[]
  prizes: { position: number; reward: string }[]
  leaderboard: { rank: number; name: string; score: number; avatar?: string }[]
}

export type SkillBadge = {
  id: string
  name: string
  category: string
  level: number
  maxLevel: number
  description: string
  icon: string
  earnedAt?: string
}

export type RewardItem = {
  id: string
  name: string
  description: string
  type: "theme" | "avatar" | "badge" | "perk"
  price: number
  owned: boolean
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
}

export type UserTheme = {
  id: string
  name: string
  preview: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
  }
  isPremium: boolean
  isDefault: boolean
}

export type DashboardWidget = {
  id: string
  type: "tasks" | "calendar" | "stats" | "activity" | "team" | "gamification" | "analytics"
  position: { x: number; y: number; w: number; h: number }
  visible: boolean
  settings?: Record<string, any>
}

export type NotificationPreference = {
  category: "tasks" | "meetings" | "submissions" | "chat" | "system"
  email: boolean
  push: boolean
  inApp: boolean
}

export type UserPreferences = {
  userId: string
  theme: string
  dashboardWidgets: DashboardWidget[]
  notifications: NotificationPreference[]
  language: "en" | "ar"
  timezone: string
  emailDigest: "daily" | "weekly" | "never"
}
