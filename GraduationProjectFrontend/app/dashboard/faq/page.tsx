"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  HelpCircle,
  Search,
  ChevronDown,
  Users,
  CheckSquare,
  Upload,
  Award,
  GitBranch,
  Calendar,
  Settings,
  Shield,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/lib/stores/auth-store"
import Link from "next/link"

const faqCategories = [
  { id: "getting-started", label: "Getting Started", icon: HelpCircle },
  { id: "teams", label: "Teams", icon: Users },
  { id: "tasks", label: "Tasks & Projects", icon: CheckSquare },
  { id: "submissions", label: "Submissions", icon: Upload },
  { id: "gamification", label: "Gamification", icon: Award },
  { id: "github", label: "GitHub", icon: GitBranch },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "account", label: "Account & Settings", icon: Settings },
  { id: "security", label: "Security", icon: Shield },
]

const faqData: Record<string, Array<{ question: string; answer: string; helpful?: number }>> = {
  "getting-started": [
    {
      question: "What is ProjectHub?",
      answer:
        "ProjectHub is a comprehensive graduation project management system designed to help students, supervisors, and administrators collaborate effectively on academic projects. It provides tools for team management, task tracking, SDLC workflow, file sharing, and more.",
      helpful: 156,
    },
    {
      question: "How do I get started with ProjectHub?",
      answer:
        "After logging in, you'll see your dashboard. If you're a student, you can either create a team (if you're a team leader) or join an existing team. Once you're part of a team, you can access all features like tasks, submissions, and communication tools.",
      helpful: 142,
    },
    {
      question: "What are the different user roles?",
      answer:
        "ProjectHub has 5 user roles: Student Member (can join teams and work on tasks), Team Leader (can create and manage teams), Doctor/Professor (supervises teams and reviews work), Teaching Assistant (assists doctors and reviews submissions), and Admin (manages the entire system).",
      helpful: 128,
    },
    {
      question: "How do I navigate the dashboard?",
      answer:
        "The sidebar on the left contains all navigation options organized by category. The main dashboard shows your overview with quick stats, recent activity, and shortcuts to important features. Use the top bar to access notifications, profile settings, and quick search.",
      helpful: 98,
    },
  ],
  teams: [
    {
      question: "How do I create a team?",
      answer:
        "Only Team Leaders can create teams. Go to 'My Team' in the sidebar, then click 'Create Team'. Fill in the team name, description, and other details. Once created, you can invite members using invite codes or direct invitations.",
      helpful: 134,
    },
    {
      question: "How do I join an existing team?",
      answer:
        "Student Members can join teams by going to 'Join Team' in the sidebar. You can either browse available teams and send join requests, or enter an invite code provided by the team leader.",
      helpful: 121,
    },
    {
      question: "Can I be part of multiple teams?",
      answer:
        "No, each student can only be part of one team at a time. Team Leaders can only lead one team, and Student Members can only join one team. This ensures focused collaboration on your graduation project.",
      helpful: 89,
    },
    {
      question: "How do I find and select a supervisor?",
      answer:
        "Team Leaders can go to 'Find Supervisors' to browse available doctors and teaching assistants. You can filter by expertise, view profiles, and send supervision requests. Once accepted, the supervisor will be assigned to your team.",
      helpful: 112,
    },
  ],
  tasks: [
    {
      question: "How do I create a task?",
      answer:
        "Go to 'Tasks & Boards' in the sidebar. Click 'Add Task' and fill in the task details including title, description, assignee, due date, and priority. Tasks can be organized in a Kanban board view or list view.",
      helpful: 145,
    },
    {
      question: "What are SDLC phases?",
      answer:
        "SDLC (Software Development Life Cycle) phases help organize your project workflow. The phases include: Requirements, Design, Development, Testing, and Deployment. Each phase has specific deliverables and milestones.",
      helpful: 167,
    },
    {
      question: "How do I track task progress?",
      answer:
        "Tasks have status indicators: To Do, In Progress, Review, and Done. Update task status by dragging cards on the Kanban board or using the status dropdown. The dashboard shows overall progress statistics.",
      helpful: 98,
    },
    {
      question: "Can I set task dependencies?",
      answer:
        "Yes, you can set task dependencies to ensure tasks are completed in the correct order. When creating or editing a task, use the 'Dependencies' field to link related tasks.",
      helpful: 76,
    },
  ],
  submissions: [
    {
      question: "How do I submit my work?",
      answer:
        "Go to 'Submissions' in the sidebar. Click 'New Submission', select the submission type (proposal, report, code, etc.), upload your files, and add any required comments. Your supervisor will be notified automatically.",
      helpful: 156,
    },
    {
      question: "What file formats are supported?",
      answer:
        "ProjectHub supports various file formats including PDF, DOC, DOCX, PPT, PPTX, ZIP, RAR, and common code file extensions. Maximum file size is 50MB per file.",
      helpful: 89,
    },
    {
      question: "How do I know if my submission was reviewed?",
      answer:
        "You'll receive a notification when your submission is reviewed. You can also check the submission status in the Submissions page. Statuses include: Pending, Under Review, Approved, Needs Revision, and Rejected.",
      helpful: 134,
    },
    {
      question: "Can I resubmit after receiving feedback?",
      answer:
        "Yes, if your submission needs revision, you can resubmit by clicking 'Resubmit' on the submission details page. Make sure to address all feedback points before resubmitting.",
      helpful: 112,
    },
  ],
  gamification: [
    {
      question: "How does the XP system work?",
      answer:
        "You earn XP (Experience Points) by completing tasks, making submissions, attending meetings, and engaging with the platform. XP contributes to your level progression and unlocks achievements.",
      helpful: 178,
    },
    {
      question: "What are achievements?",
      answer:
        "Achievements are badges you unlock by completing specific goals, like 'First Task Completed' or 'Team Player'. They're displayed on your profile and contribute to your overall score.",
      helpful: 145,
    },
    {
      question: "How do daily quests work?",
      answer:
        "Daily quests are small challenges that reset every 24 hours. Complete them to earn bonus XP and coins. Examples include 'Complete 3 tasks today' or 'Send a message in team chat'.",
      helpful: 123,
    },
    {
      question: "What can I do with coins?",
      answer:
        "Coins can be spent in the Reward Store to unlock cosmetic items like profile themes, avatar frames, and badges. They're earned through quests, achievements, and consistent activity.",
      helpful: 98,
    },
  ],
  github: [
    {
      question: "How do I connect my GitHub repository?",
      answer:
        "Go to 'GitHub' in the sidebar and click 'Connect Repository'. You'll need to authorize ProjectHub to access your GitHub account, then select the repository you want to link to your project.",
      helpful: 167,
    },
    {
      question: "What GitHub features are available?",
      answer:
        "You can view commits, branches, pull requests, and issues directly in ProjectHub. The integration provides a streamlined view of your repository activity without leaving the platform.",
      helpful: 134,
    },
    {
      question: "Can supervisors see our GitHub activity?",
      answer:
        "Yes, supervisors can view the connected repository's activity including commits, branches, and pull requests. This helps them track your development progress.",
      helpful: 89,
    },
    {
      question: "Is my GitHub data secure?",
      answer:
        "Yes, we only request necessary permissions and never store your GitHub credentials. The connection uses OAuth for secure authentication.",
      helpful: 112,
    },
  ],
  calendar: [
    {
      question: "How do I schedule a meeting?",
      answer:
        "Go to 'Calendar' and click on a date or use the 'New Event' button. Fill in the meeting details, invite participants, and optionally add a video call link. Participants will receive notifications.",
      helpful: 145,
    },
    {
      question: "Can I sync with Google Calendar or Outlook?",
      answer:
        "Yes, go to Calendar settings and click 'Sync Calendar'. You can connect your Google Calendar, Outlook, or Apple Calendar for two-way synchronization.",
      helpful: 178,
    },
    {
      question: "How do I set reminders for events?",
      answer:
        "When creating or editing an event, use the 'Reminders' section to set email or push notification reminders. You can set multiple reminders at different intervals.",
      helpful: 98,
    },
    {
      question: "Can I export my calendar?",
      answer:
        "Yes, you can export your calendar in ICS format by clicking the export button in the calendar settings. This file can be imported into any calendar application.",
      helpful: 76,
    },
  ],
  account: [
    {
      question: "How do I update my profile?",
      answer:
        "Go to 'Profile' or 'Settings' from your user menu. You can update your personal information, profile picture, bio, and contact details.",
      helpful: 112,
    },
    {
      question: "How do I change my password?",
      answer:
        "Go to Settings > Security tab. Click 'Change Password' and enter your current password followed by your new password. For security, passwords must be at least 8 characters.",
      helpful: 156,
    },
    {
      question: "How do I enable dark mode?",
      answer:
        "Go to Settings > Appearance tab. You can choose between Light, Dark, or System theme. The change applies immediately across the entire platform.",
      helpful: 189,
    },
    {
      question: "Can I change my notification preferences?",
      answer:
        "Yes, go to Settings > Notifications tab. You can customize which notifications you receive via email, push, or in-app, and set quiet hours.",
      helpful: 98,
    },
  ],
  security: [
    {
      question: "How do I enable two-factor authentication?",
      answer:
        "Go to Settings > Security tab and click 'Enable 2FA'. You can use an authenticator app like Google Authenticator or receive codes via SMS.",
      helpful: 145,
    },
    {
      question: "What should I do if I suspect unauthorized access?",
      answer:
        "Immediately change your password and enable 2FA if not already enabled. Go to Settings > Security > Active Sessions to review and revoke any suspicious sessions. Contact support if needed.",
      helpful: 167,
    },
    {
      question: "How is my data protected?",
      answer:
        "ProjectHub uses industry-standard encryption for data in transit and at rest. We follow best practices for security and regularly audit our systems. Your data is never shared with third parties.",
      helpful: 134,
    },
    {
      question: "Can I delete my account?",
      answer:
        "Yes, go to Settings > Account > Danger Zone. Click 'Delete Account' and confirm. Note that this action is irreversible and will remove all your data.",
      helpful: 78,
    },
  ],
}

export default function FAQPage() {
  const { currentUser } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("getting-started")
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([])
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, "up" | "down" | null>>({})

  const toggleQuestion = (question: string) => {
    setExpandedQuestions((prev) => (prev.includes(question) ? prev.filter((q) => q !== question) : [...prev, question]))
  }

  const handleVote = (question: string, vote: "up" | "down") => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [question]: prev[question] === vote ? null : vote,
    }))
  }

  const allFAQs = Object.entries(faqData).flatMap(([category, questions]) => questions.map((q) => ({ ...q, category })))

  const filteredFAQs: Array<{ question: string; answer: string; helpful?: number; category?: string }> = searchQuery
    ? allFAQs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : faqData[activeCategory] || []

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-background border p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <HelpCircle className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h1>
              <p className="text-muted-foreground">Find answers to common questions</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl bg-background/80 backdrop-blur-sm"
            />
          </div>
        </div>
      </motion.div>

      {searchQuery ? (
        /* Search Results */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Search Results ({filteredFAQs.length})</h2>
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          </div>
          {filteredFAQs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">Try different keywords or browse categories</p>
                <Link href="/dashboard/support">
                  <Button>Contact Support</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  helpful={faq.helpful}
                  isExpanded={expandedQuestions.includes(faq.question)}
                  onToggle={() => toggleQuestion(faq.question)}
                  vote={helpfulVotes[faq.question]}
                  onVote={(vote) => handleVote(faq.question, vote)}
                  showCategory
                  category={faqCategories.find((c) => c.id === faq.category)?.label}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Category View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {faqCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                        activeCategory === category.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <category.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{category.label}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {faqData[category.id]?.length || 0}
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              {(() => {
                const category = faqCategories.find((c) => c.id === activeCategory)
                if (!category) return null
                return (
                  <>
                    <div className="p-2 rounded-lg bg-primary/10">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">{category.label}</h2>
                  </>
                )
              })()}
            </div>

            <div className="space-y-3">
              {(faqData[activeCategory] || []).map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <FAQItem
                    question={faq.question}
                    answer={faq.answer}
                    helpful={faq.helpful}
                    isExpanded={expandedQuestions.includes(faq.question)}
                    onToggle={() => toggleQuestion(faq.question)}
                    vote={helpfulVotes[faq.question]}
                    onVote={(vote) => handleVote(faq.question, vote)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Still need help? */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Can't find what you're looking for?</h3>
                  <p className="text-muted-foreground">Our support team is ready to help you</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/dashboard/help">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <HelpCircle className="h-4 w-4" />
                    Help Center
                  </Button>
                </Link>
                <Link href="/dashboard/support">
                  <Button className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function FAQItem({
  question,
  answer,
  helpful,
  isExpanded,
  onToggle,
  vote,
  onVote,
  showCategory,
  category,
}: {
  question: string
  answer: string
  helpful?: number
  isExpanded: boolean
  onToggle: () => void
  vote: "up" | "down" | null | undefined
  onVote: (vote: "up" | "down") => void
  showCategory?: boolean
  category?: string
}) {
  return (
    <Card className={`transition-all duration-200 ${isExpanded ? "ring-2 ring-primary/20" : ""}`}>
      <button onClick={onToggle} className="w-full p-4 text-left flex items-start justify-between gap-4">
        <div className="flex-1">
          {showCategory && category && (
            <Badge variant="secondary" className="mb-2 text-xs">
              {category}
            </Badge>
          )}
          <h3 className="font-medium pr-4">{question}</h3>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 mt-1">
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t">
              <p className="text-muted-foreground mt-4 leading-relaxed">{answer}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Was this helpful?</span>
                  <Button
                    variant={vote === "up" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      onVote("up")
                    }}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={vote === "down" ? "default" : "ghost"}
                    size="sm"
                    className="h-8 px-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      onVote("down")
                    }}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
                {helpful && <span className="text-sm text-muted-foreground">{helpful} found this helpful</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
