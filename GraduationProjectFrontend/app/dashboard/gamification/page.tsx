"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Trophy,
  Star,
  Zap,
  Target,
  Users,
  Flame,
  Award,
  Medal,
  CheckCircle2,
  Crown,
  Swords,
  Calendar,
  Clock,
  ChevronRight,
  Coins,
  ShoppingBag,
  Gift,
  Sparkles,
  Lock,
  BookOpen,
  Code,
  GitBranch,
  MessageSquare,
  FileText,
  Rocket,
  Shield,
  Gem,
  Bell,
  HelpCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Palette,
  GraduationCap,
  Database,
  Globe,
  Server,
  Cloud,
  BarChart3,
  Video,
  Bug,
  Paintbrush,
  Edit,
  Home,
  Flag,
  CircleUser,
  History,
} from "lucide-react"
import { users } from "@/data/users"
import { cn } from "@/lib/utils"

export default function GamificationPage() {
  const { currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null)
  const [selectedReward, setSelectedReward] = useState<any>(null)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [showAchievementDialog, setShowAchievementDialog] = useState(false)

  const userXP = currentUser?.xp || 0
  const userCoins = currentUser?.gold || 0
  const userLevel = currentUser?.level || 1

  // Enhanced daily quests with more details
  const dailyQuests = [
    {
      id: "dq1",
      title: "Early Bird",
      description: "Complete 3 tasks before noon to start your day strong",
      progress: 2,
      target: 3,
      xp: 50,
      coins: 15,
      expiresIn: "4h 32m",
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      difficulty: "easy",
      category: "productivity",
    },
    {
      id: "dq2",
      title: "Code Contributor",
      description: "Push at least one commit to your repository",
      progress: 1,
      target: 1,
      xp: 30,
      coins: 10,
      expiresIn: "4h 32m",
      icon: GitBranch,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      difficulty: "easy",
      category: "development",
      completed: true,
    },
    {
      id: "dq3",
      title: "Team Collaborator",
      description: "Help 2 team members with their tasks or questions",
      progress: 0,
      target: 2,
      xp: 40,
      coins: 12,
      expiresIn: "4h 32m",
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      difficulty: "medium",
      category: "collaboration",
    },
    {
      id: "dq4",
      title: "Discussion Starter",
      description: "Post or reply in the team discussion forum",
      progress: 0,
      target: 1,
      xp: 20,
      coins: 8,
      expiresIn: "4h 32m",
      icon: MessageSquare,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      difficulty: "easy",
      category: "communication",
    },
    {
      id: "dq5",
      title: "Documentation Hero",
      description: "Update or create documentation for your project",
      progress: 0,
      target: 1,
      xp: 35,
      coins: 10,
      expiresIn: "4h 32m",
      icon: FileText,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      difficulty: "medium",
      category: "documentation",
    },
  ]

  const weeklyQuests = [
    {
      id: "wq1",
      title: "Sprint Champion",
      description: "Complete all your assigned tasks for this week",
      progress: 8,
      target: 12,
      xp: 200,
      coins: 75,
      expiresIn: "2d 14h",
      icon: Rocket,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      difficulty: "hard",
      category: "productivity",
    },
    {
      id: "wq2",
      title: "Knowledge Seeker",
      description: "Complete 5 learning modules or read technical articles",
      progress: 3,
      target: 5,
      xp: 150,
      coins: 50,
      expiresIn: "2d 14h",
      icon: BookOpen,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      difficulty: "medium",
      category: "learning",
    },
    {
      id: "wq3",
      title: "Code Reviewer",
      description: "Review and provide feedback on 3 pull requests",
      progress: 1,
      target: 3,
      xp: 120,
      coins: 40,
      expiresIn: "2d 14h",
      icon: Code,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      difficulty: "medium",
      category: "development",
    },
    {
      id: "wq4",
      title: "Meeting Master",
      description: "Attend all scheduled team meetings this week",
      progress: 2,
      target: 4,
      xp: 80,
      coins: 30,
      expiresIn: "2d 14h",
      icon: Video,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      difficulty: "easy",
      category: "collaboration",
    },
  ]

  const monthlyQuests = [
    {
      id: "mq1",
      title: "Project Milestone",
      description: "Complete a major project milestone or deliverable",
      progress: 0,
      target: 1,
      xp: 500,
      coins: 200,
      expiresIn: "18d 5h",
      icon: Flag,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      difficulty: "legendary",
      category: "project",
    },
    {
      id: "mq2",
      title: "Consistency King",
      description: "Maintain a 30-day activity streak",
      progress: currentUser?.streak || 0,
      target: 30,
      xp: 1000,
      coins: 500,
      expiresIn: "18d 5h",
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      difficulty: "legendary",
      category: "consistency",
    },
  ]

  // Comprehensive achievements system
  const achievements = [
    // Beginner achievements
    {
      id: "first-login",
      name: "Welcome Aboard",
      description: "Log in to the platform for the first time",
      icon: Home,
      unlocked: true,
      unlockedDate: "2024-01-15",
      points: 10,
      rarity: "common",
      category: "getting-started",
      howToUnlock: "Simply log in to the platform",
    },
    {
      id: "first-task",
      name: "First Steps",
      description: "Complete your first task",
      icon: CheckCircle,
      unlocked: true,
      unlockedDate: "2024-01-16",
      points: 20,
      rarity: "common",
      category: "productivity",
      howToUnlock: "Mark any task as complete",
    },
    {
      id: "profile-complete",
      name: "Identity Established",
      description: "Complete your profile with all information",
      icon: CircleUser,
      unlocked: true,
      unlockedDate: "2024-01-15",
      points: 15,
      rarity: "common",
      category: "getting-started",
      howToUnlock: "Fill in all profile fields including bio and avatar",
    },
    // Productivity achievements
    {
      id: "task-master-10",
      name: "Task Apprentice",
      description: "Complete 10 tasks",
      icon: Target,
      unlocked: true,
      unlockedDate: "2024-01-20",
      points: 30,
      rarity: "common",
      category: "productivity",
      howToUnlock: "Complete any 10 tasks",
      progress: 10,
      target: 10,
    },
    {
      id: "task-master-50",
      name: "Task Expert",
      description: "Complete 50 tasks",
      icon: Target,
      unlocked: false,
      points: 100,
      rarity: "rare",
      category: "productivity",
      howToUnlock: "Complete any 50 tasks",
      progress: 32,
      target: 50,
    },
    {
      id: "task-master-100",
      name: "Task Master",
      description: "Complete 100 tasks",
      icon: Target,
      unlocked: false,
      points: 250,
      rarity: "epic",
      category: "productivity",
      howToUnlock: "Complete any 100 tasks",
      progress: 32,
      target: 100,
    },
    {
      id: "task-master-500",
      name: "Task Legend",
      description: "Complete 500 tasks",
      icon: Target,
      unlocked: false,
      points: 1000,
      rarity: "legendary",
      category: "productivity",
      howToUnlock: "Complete any 500 tasks",
      progress: 32,
      target: 500,
    },
    // Development achievements
    {
      id: "first-commit",
      name: "Code Beginner",
      description: "Push your first commit",
      icon: GitBranch,
      unlocked: true,
      unlockedDate: "2024-01-17",
      points: 25,
      rarity: "common",
      category: "development",
      howToUnlock: "Push any commit to your repository",
    },
    {
      id: "commit-streak-7",
      name: "Code Warrior",
      description: "Commit code for 7 consecutive days",
      icon: GitBranch,
      unlocked: false,
      points: 75,
      rarity: "rare",
      category: "development",
      howToUnlock: "Push commits for 7 days in a row",
      progress: 4,
      target: 7,
    },
    {
      id: "code-reviewer",
      name: "Code Reviewer",
      description: "Review 10 pull requests",
      icon: Code,
      unlocked: false,
      points: 100,
      rarity: "rare",
      category: "development",
      howToUnlock: "Review and comment on 10 PRs",
      progress: 3,
      target: 10,
    },
    {
      id: "bug-hunter",
      name: "Bug Hunter",
      description: "Report and fix 5 bugs",
      icon: Bug,
      unlocked: false,
      points: 80,
      rarity: "rare",
      category: "development",
      howToUnlock: "Document and resolve 5 bugs",
      progress: 2,
      target: 5,
    },
    // Collaboration achievements
    {
      id: "team-player",
      name: "Team Player",
      description: "Help 5 team members",
      icon: Users,
      unlocked: true,
      unlockedDate: "2024-01-25",
      points: 50,
      rarity: "common",
      category: "collaboration",
      howToUnlock: "Assist teammates with their tasks or questions",
    },
    {
      id: "discussion-starter",
      name: "Discussion Starter",
      description: "Start 10 discussions",
      icon: MessageSquare,
      unlocked: false,
      points: 60,
      rarity: "rare",
      category: "collaboration",
      howToUnlock: "Create 10 discussion threads",
      progress: 4,
      target: 10,
    },
    {
      id: "mentor",
      name: "Mentor",
      description: "Help 20 different team members",
      icon: GraduationCap,
      unlocked: false,
      points: 200,
      rarity: "epic",
      category: "collaboration",
      howToUnlock: "Provide assistance to 20 unique teammates",
      progress: 8,
      target: 20,
    },
    // Streak achievements
    {
      id: "streak-3",
      name: "Getting Started",
      description: "Maintain a 3-day streak",
      icon: Flame,
      unlocked: true,
      unlockedDate: "2024-01-18",
      points: 15,
      rarity: "common",
      category: "consistency",
      howToUnlock: "Log in and complete tasks for 3 consecutive days",
    },
    {
      id: "streak-7",
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: Flame,
      unlocked: (currentUser?.streak || 0) >= 7,
      unlockedDate: (currentUser?.streak || 0) >= 7 ? "2024-01-22" : undefined,
      points: 50,
      rarity: "rare",
      category: "consistency",
      howToUnlock: "Stay active for 7 consecutive days",
      progress: currentUser?.streak || 0,
      target: 7,
    },
    {
      id: "streak-30",
      name: "Month Master",
      description: "Maintain a 30-day streak",
      icon: Flame,
      unlocked: false,
      points: 300,
      rarity: "epic",
      category: "consistency",
      howToUnlock: "Stay active for 30 consecutive days",
      progress: currentUser?.streak || 0,
      target: 30,
    },
    {
      id: "streak-100",
      name: "Streak Legend",
      description: "Maintain a 100-day streak",
      icon: Flame,
      unlocked: false,
      points: 1000,
      rarity: "legendary",
      category: "consistency",
      howToUnlock: "Stay active for 100 consecutive days",
      progress: currentUser?.streak || 0,
      target: 100,
    },
    // Special achievements
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Complete a task before 8 AM",
      icon: Clock,
      unlocked: false,
      points: 30,
      rarity: "rare",
      category: "special",
      howToUnlock: "Complete any task before 8:00 AM",
    },
    {
      id: "night-owl",
      name: "Night Owl",
      description: "Complete a task after midnight",
      icon: Clock,
      unlocked: false,
      points: 30,
      rarity: "rare",
      category: "special",
      howToUnlock: "Complete any task after 12:00 AM",
    },
    {
      id: "perfect-week",
      name: "Perfect Week",
      description: "Complete all tasks in a week",
      icon: Star,
      unlocked: false,
      points: 200,
      rarity: "epic",
      category: "special",
      howToUnlock: "Complete every assigned task within a week",
    },
    {
      id: "speedster",
      name: "Speedster",
      description: "Complete 5 tasks in one hour",
      icon: Zap,
      unlocked: false,
      points: 100,
      rarity: "epic",
      category: "special",
      howToUnlock: "Complete 5 tasks within 60 minutes",
    },
    // Leadership achievements (for team leaders)
    {
      id: "team-creator",
      name: "Team Founder",
      description: "Create your own team",
      icon: Users,
      unlocked: currentUser?.role === "leader",
      unlockedDate: currentUser?.role === "leader" ? "2024-01-15" : undefined,
      points: 100,
      rarity: "rare",
      category: "leadership",
      howToUnlock: "Create and lead a project team",
    },
    {
      id: "team-builder",
      name: "Team Builder",
      description: "Have 5 members in your team",
      icon: Users,
      unlocked: false,
      points: 150,
      rarity: "epic",
      category: "leadership",
      howToUnlock: "Grow your team to 5 members",
      progress: 3,
      target: 5,
    },
    {
      id: "project-complete",
      name: "Project Champion",
      description: "Complete a project successfully",
      icon: Trophy,
      unlocked: false,
      points: 500,
      rarity: "legendary",
      category: "leadership",
      howToUnlock: "Lead your team to complete the entire project",
    },
  ]

  // Active challenges
  const activeChallenges = [
    {
      id: "winter-sprint",
      title: "Winter Code Sprint 2024",
      description:
        "Complete the most tasks this month to win exclusive rewards! Show your dedication and climb the leaderboard.",
      type: "global",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      myRank: 23,
      myScore: 1240,
      totalParticipants: 156,
      prizes: [
        { position: 1, reward: "Premium Theme Pack + 1000 Coins + Exclusive Badge", icon: Crown },
        { position: 2, reward: "Exclusive Avatar Frame + 500 Coins", icon: Medal },
        { position: 3, reward: "Golden Badge + 250 Coins", icon: Award },
        { position: "4-10", reward: "100 Coins + Rare Badge", icon: Star },
      ],
      topScores: [
        { rank: 1, name: "Nour Hassan", score: 2850, avatar: "/placeholder.svg", change: 0 },
        { rank: 2, name: "Youssef Ahmed", score: 2720, avatar: "/placeholder.svg", change: 1 },
        { rank: 3, name: "Salma Youssef", score: 2540, avatar: "/placeholder.svg", change: -1 },
        { rank: 4, name: "Karim Mostafa", score: 2380, avatar: "/placeholder.svg", change: 2 },
        { rank: 5, name: "Mariam Salah", score: 2150, avatar: "/placeholder.svg", change: 0 },
      ],
      status: "active",
      daysLeft: 12,
    },
    {
      id: "team-challenge",
      title: "Team Productivity Challenge",
      description: "Compete as a team! The team with the highest combined productivity score wins.",
      type: "team",
      startDate: "2024-01-15",
      endDate: "2024-02-15",
      myTeamRank: 2,
      myTeamScore: 8450,
      totalTeams: 24,
      prizes: [
        { position: 1, reward: "Team Trophy + 500 Coins per member", icon: Trophy },
        { position: 2, reward: "300 Coins per member", icon: Medal },
        { position: 3, reward: "150 Coins per member", icon: Award },
      ],
      topTeams: [
        { rank: 1, name: "Team Alpha", score: 9200, members: 5 },
        { rank: 2, name: "Innovation Squad", score: 8450, members: 4 },
        { rank: 3, name: "Code Masters", score: 7890, members: 5 },
      ],
      status: "active",
      daysLeft: 28,
    },
  ]

  // Reward store items
  const rewardStore = [
    // Themes
    {
      id: "r1",
      name: "Midnight Dark",
      description: "A sleek dark theme with blue accents for night coding sessions",
      type: "theme",
      price: 150,
      rarity: "rare",
      icon: Palette,
      preview: "bg-gradient-to-br from-slate-900 to-blue-900",
      owned: false,
    },
    {
      id: "r2",
      name: "Neon Glow",
      description: "Vibrant neon colors that make your dashboard pop",
      type: "theme",
      price: 250,
      rarity: "epic",
      icon: Sparkles,
      preview: "bg-gradient-to-br from-purple-600 to-pink-500",
      owned: false,
    },
    {
      id: "r3",
      name: "Forest Green",
      description: "Calming green tones inspired by nature",
      type: "theme",
      price: 150,
      rarity: "rare",
      icon: Palette,
      preview: "bg-gradient-to-br from-green-800 to-green-600",
      owned: false,
    },
    {
      id: "r4",
      name: "Golden Sunset",
      description: "Warm golden and orange hues for a cozy feel",
      type: "theme",
      price: 300,
      rarity: "epic",
      icon: Palette,
      preview: "bg-gradient-to-br from-amber-500 to-orange-600",
      owned: true,
    },
    // Avatar frames
    {
      id: "r5",
      name: "Golden Crown",
      description: "A majestic golden crown frame for champions",
      type: "avatar",
      price: 500,
      rarity: "legendary",
      icon: Crown,
      preview: "border-4 border-amber-500 ring-2 ring-amber-300",
      owned: false,
    },
    {
      id: "r6",
      name: "Diamond Edge",
      description: "Sparkling diamond border that shows your prestige",
      type: "avatar",
      price: 400,
      rarity: "epic",
      icon: Gem,
      preview: "border-4 border-sky-400 ring-2 ring-sky-200",
      owned: false,
    },
    {
      id: "r7",
      name: "Fire Ring",
      description: "Blazing fire effect around your avatar",
      type: "avatar",
      price: 350,
      rarity: "epic",
      icon: Flame,
      preview: "border-4 border-orange-500 ring-2 ring-red-400",
      owned: false,
    },
    // Badges
    {
      id: "r8",
      name: "Pro Developer Badge",
      description: "Show everyone you mean business",
      type: "badge",
      price: 100,
      rarity: "rare",
      icon: Code,
      owned: false,
    },
    {
      id: "r9",
      name: "Top Contributor Badge",
      description: "Recognition for your outstanding contributions",
      type: "badge",
      price: 150,
      rarity: "rare",
      icon: Star,
      owned: true,
    },
    {
      id: "r10",
      name: "Legend Badge",
      description: "The ultimate badge for legendary performers",
      type: "badge",
      price: 1000,
      rarity: "legendary",
      icon: Trophy,
      owned: false,
    },
    // Perks
    {
      id: "r11",
      name: "Double XP (24h)",
      description: "Earn double XP for all activities for 24 hours",
      type: "perk",
      price: 200,
      rarity: "epic",
      icon: Zap,
      owned: false,
      consumable: true,
    },
    {
      id: "r12",
      name: "Streak Shield",
      description: "Protect your streak for one day if you miss activity",
      type: "perk",
      price: 100,
      rarity: "rare",
      icon: Shield,
      owned: false,
      consumable: true,
      quantity: 3,
    },
    {
      id: "r13",
      name: "Priority Support",
      description: "Get faster responses from TAs and supervisors",
      type: "perk",
      price: 300,
      rarity: "epic",
      icon: Rocket,
      owned: false,
    },
    {
      id: "r14",
      name: "Custom Title",
      description: "Create your own custom title displayed on your profile",
      type: "perk",
      price: 250,
      rarity: "epic",
      icon: Edit,
      owned: false,
    },
  ]

  // Skill badges with detailed progression
  const skillBadges = [
    {
      name: "React Master",
      category: "Frontend",
      level: 3,
      maxLevel: 5,
      progress: 60,
      icon: Code,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      description: "Proficiency in React.js development",
      requirements: [
        { level: 1, task: "Complete React basics tutorial", done: true },
        { level: 2, task: "Build 3 React components", done: true },
        { level: 3, task: "Implement state management", done: true },
        { level: 4, task: "Create custom hooks", done: false },
        { level: 5, task: "Optimize React performance", done: false },
      ],
    },
    {
      name: "Node.js Expert",
      category: "Backend",
      level: 2,
      maxLevel: 5,
      progress: 40,
      icon: Server,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      description: "Backend development with Node.js",
      requirements: [
        { level: 1, task: "Set up Node.js server", done: true },
        { level: 2, task: "Create REST APIs", done: true },
        { level: 3, task: "Implement authentication", done: false },
        { level: 4, task: "Database integration", done: false },
        { level: 5, task: "Deploy to production", done: false },
      ],
    },
    {
      name: "Database Wizard",
      category: "Data",
      level: 4,
      maxLevel: 5,
      progress: 80,
      icon: Database,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "Database design and management",
      requirements: [
        { level: 1, task: "Learn SQL basics", done: true },
        { level: 2, task: "Design database schema", done: true },
        { level: 3, task: "Write complex queries", done: true },
        { level: 4, task: "Implement indexing", done: true },
        { level: 5, task: "Database optimization", done: false },
      ],
    },
    {
      name: "DevOps Ninja",
      category: "Infrastructure",
      level: 1,
      maxLevel: 5,
      progress: 20,
      icon: Cloud,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      description: "CI/CD and deployment skills",
      requirements: [
        { level: 1, task: "Understand Git workflow", done: true },
        { level: 2, task: "Set up CI/CD pipeline", done: false },
        { level: 3, task: "Docker containerization", done: false },
        { level: 4, task: "Kubernetes basics", done: false },
        { level: 5, task: "Cloud deployment", done: false },
      ],
    },
    {
      name: "UI/UX Designer",
      category: "Design",
      level: 2,
      maxLevel: 5,
      progress: 45,
      icon: Paintbrush,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      description: "User interface and experience design",
      requirements: [
        { level: 1, task: "Learn design principles", done: true },
        { level: 2, task: "Create wireframes", done: true },
        { level: 3, task: "Build responsive layouts", done: false },
        { level: 4, task: "Implement animations", done: false },
        { level: 5, task: "Conduct user testing", done: false },
      ],
    },
    {
      name: "API Architect",
      category: "Backend",
      level: 3,
      maxLevel: 5,
      progress: 55,
      icon: Globe,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "RESTful API design and implementation",
      requirements: [
        { level: 1, task: "Understand REST principles", done: true },
        { level: 2, task: "Design API endpoints", done: true },
        { level: 3, task: "Implement authentication", done: true },
        { level: 4, task: "API documentation", done: false },
        { level: 5, task: "Rate limiting & caching", done: false },
      ],
    },
  ]

  const rarityColors = {
    common: { text: "text-gray-500", border: "border-gray-500/30", bg: "bg-gray-500/10" },
    rare: { text: "text-blue-500", border: "border-blue-500/30", bg: "bg-blue-500/10" },
    epic: { text: "text-purple-500", border: "border-purple-500/30", bg: "bg-purple-500/10" },
    legendary: { text: "text-amber-500", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  }

  const difficultyColors = {
    easy: "text-green-500 bg-green-500/10",
    medium: "text-amber-500 bg-amber-500/10",
    hard: "text-orange-500 bg-orange-500/10",
    legendary: "text-purple-500 bg-purple-500/10",
  }

  // Leaderboard data
  const leaderboardData = users
    .filter((u) => u.role === "leader" || u.role === "member")
    .map((user) => ({
      ...user,
      xp: user.xp || Math.floor(Math.random() * 5000) + 500,
      level: user.level || Math.floor(Math.random() * 20) + 1,
      achievements: Math.floor(Math.random() * 8) + 1,
      streak: user.streak || Math.floor(Math.random() * 30) + 1,
      coins: user.gold || Math.floor(Math.random() * 500) + 100,
      weeklyChange: Math.floor(Math.random() * 5) - 2,
    }))
    .sort((a, b) => b.xp - a.xp)

  const currentUserRank = leaderboardData.findIndex((u) => u.id === currentUser?.id) + 1
  const topStudents = leaderboardData.slice(0, 15)

  // Removed unused animated stats
  // const animatedXP = 0;
  // const animatedCoins = 0;
  // const animatedLevel = 0;

  // Calculate stats
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length
  const totalAchievements = achievements.length
  const completedQuests =
    dailyQuests.filter((q) => q.completed).length + weeklyQuests.filter((q) => q.progress >= q.target).length

  const xpForNextLevel = 200
  const xpProgress = userXP % xpForNextLevel
  const xpPercentage = (xpProgress / xpForNextLevel) * 100

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Gamification Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Complete quests, earn rewards, unlock achievements, and compete with your peers!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              How It Works
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          </div>
        </div>
      </motion.div>

      {/* User Stats Overview - Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
              animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>

          <div className="relative z-10">
            {/* Profile Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-purple-500 blur-md"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
                <Avatar className="h-24 w-24 border-4 border-background relative">
                  <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">{currentUser?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-bold">
                  Lv.{userLevel}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{currentUser?.name}</h2>
                  <Badge variant="outline" className="bg-primary/10">
                    {currentUser?.role === "leader" ? "Team Leader" : "Team Member"}
                  </Badge>
                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                    <Crown className="h-3 w-3 mr-1" />
                    Rank #{currentUserRank}
                  </Badge>
                </div>

                {/* Level Progress Bar */}
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Level {userLevel}</span>
                    <span className="font-medium">
                      {xpProgress} / {xpForNextLevel} XP
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={xpPercentage} className="h-4" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-full"
                      style={{ width: `${xpPercentage}%` }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {xpForNextLevel - xpProgress} XP needed to reach Level {userLevel + 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{userXP.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total XP</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-yellow-500/20">
                    <Coins className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{userCoins}</div>
                    <div className="text-sm text-muted-foreground">Coins</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-orange-500/20">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{currentUser?.streak || 0}</div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                    <Award className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{unlockedAchievements}</div>
                    <div className="text-sm text-muted-foreground">Achievements</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                className="p-4 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/20">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{completedQuests}</div>
                    <div className="text-sm text-muted-foreground">Quests Done</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="quests" className="flex items-center gap-2 py-3">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Quests</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2 py-3">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Achievements</span>
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2 py-3">
            <Swords className="h-4 w-4" />
            <span className="hidden sm:inline">Challenges</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2 py-3">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="flex items-center gap-2 py-3">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Store</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Daily Progress */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Today's Progress</h3>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Resets in 4h 32m
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {dailyQuests.slice(0, 4).map((quest, index) => {
                  const Icon = quest.icon
                  const isComplete = quest.progress >= quest.target
                  return (
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "p-4 rounded-xl border transition-all",
                        isComplete ? "bg-green-500/10 border-green-500/30" : "bg-muted/30 border-border/50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", quest.bgColor)}>
                          <Icon className={cn("h-5 w-5", quest.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">{quest.title}</h4>
                            {isComplete && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{quest.description}</p>
                          <div className="flex items-center gap-2">
                            <Progress value={(quest.progress / quest.target) * 100} className="h-2 flex-1" />
                            <span className="text-xs font-medium">
                              {quest.progress}/{quest.target}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <Button variant="link" className="mt-4 px-0" onClick={() => setActiveTab("quests")}>
                View all quests <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Card>

            {/* Active Challenge Preview */}
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-purple-500/10" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Active Challenge</h3>
                  <Badge className="animate-pulse bg-red-500/20 text-red-500 border-red-500/30">
                    <Swords className="h-3 w-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <h4 className="font-bold mb-2">{activeChallenges[0].title}</h4>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{activeChallenges[0].description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Your Rank</div>
                    <div className="text-2xl font-bold text-primary">#{activeChallenges[0].myRank}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <div className="text-xs text-muted-foreground mb-1">Days Left</div>
                    <div className="text-2xl font-bold">{activeChallenges[0].daysLeft}</div>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setActiveTab("challenges")}>
                  View Challenge <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Recent Achievements & Skills */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Achievements */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Recent Achievements</h3>
                <Badge variant="outline">
                  {unlockedAchievements}/{totalAchievements}
                </Badge>
              </div>
              <div className="space-y-3">
                {achievements
                  .filter((a) => a.unlocked)
                  .slice(0, 4)
                  .map((achievement, index) => {
                    const Icon = achievement.icon
                    const colors = rarityColors[achievement.rarity as keyof typeof rarityColors]
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={cn("p-3 rounded-xl border cursor-pointer", colors.border, colors.bg)}
                        onClick={() => {
                          setSelectedAchievement(achievement)
                          setShowAchievementDialog(true)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", colors.bg)}>
                            <Icon className={cn("h-5 w-5", colors.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{achievement.name}</h4>
                              <Badge variant="outline" className="text-xs capitalize">
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                          </div>
                          <div className="text-right">
                            <div className={cn("text-sm font-bold", colors.text)}>+{achievement.points} XP</div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
              </div>
              <Button variant="link" className="mt-4 px-0" onClick={() => setActiveTab("achievements")}>
                View all achievements <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Card>

            {/* Skill Progress */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Skill Progress</h3>
                <Badge variant="outline">{skillBadges.length} Skills</Badge>
              </div>
              <div className="space-y-4">
                {skillBadges.slice(0, 4).map((skill, index) => {
                  const Icon = skill.icon
                  return (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn("p-2 rounded-lg", skill.bgColor)}>
                          <Icon className={cn("h-4 w-4", skill.color)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{skill.name}</span>
                            <span className="text-xs text-muted-foreground">
                              Level {skill.level}/{skill.maxLevel}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Progress value={skill.progress} className="h-2" />
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">32</div>
                  <div className="text-sm text-muted-foreground">Tasks Completed</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <GitBranch className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">48</div>
                  <div className="text-sm text-muted-foreground">Commits Made</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <MessageSquare className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">15</div>
                  <div className="text-sm text-muted-foreground">Discussions</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Users className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-sm text-muted-foreground">Team Helps</div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Quests Tab */}
        <TabsContent value="quests" className="space-y-6">
          {/* Daily Quests */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Daily Quests</h3>
                  <p className="text-sm text-muted-foreground">Complete these quests every day for rewards</p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                <Clock className="h-3 w-3 mr-1" />
                Resets in 4h 32m
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dailyQuests.map((quest, index) => {
                const Icon = quest.icon
                const isComplete = quest.progress >= quest.target
                return (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <Card
                      className={cn(
                        "p-5 h-full border-2 transition-all",
                        isComplete ? "bg-green-500/5 border-green-500/30" : "border-border/50 hover:border-primary/30",
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn("p-3 rounded-xl", quest.bgColor)}>
                          <Icon className={cn("h-6 w-6", quest.color)} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              difficultyColors[quest.difficulty as keyof typeof difficultyColors],
                            )}
                          >
                            {quest.difficulty}
                          </Badge>
                          {isComplete && <CheckCircle className="h-5 w-5 text-green-500" />}
                        </div>
                      </div>

                      <h4 className="font-bold mb-2">{quest.title}</h4>
                      <p className="text-sm text-muted-foreground mb-4">{quest.description}</p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {quest.progress}/{quest.target}
                          </span>
                        </div>
                        <Progress value={(quest.progress / quest.target) * 100} className="h-2" />

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1 text-primary" />
                              {quest.xp} XP
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Coins className="h-3 w-3 mr-1 text-yellow-500" />
                              {quest.coins}
                            </Badge>
                          </div>
                          {isComplete && (
                            <Button size="sm" className="bg-green-500 hover:bg-green-600">
                              Claim
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </Card>

          {/* Weekly Quests */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Weekly Quests</h3>
                  <p className="text-sm text-muted-foreground">Bigger challenges with better rewards</p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                <Clock className="h-3 w-3 mr-1" />
                Resets in 2d 14h
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {weeklyQuests.map((quest, index) => {
                const Icon = quest.icon
                const isComplete = quest.progress >= quest.target
                return (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      className={cn(
                        "p-5 border-2 transition-all",
                        isComplete ? "bg-green-500/5 border-green-500/30" : "border-border/50 hover:border-primary/30",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-xl", quest.bgColor)}>
                          <Icon className={cn("h-6 w-6", quest.color)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold">{quest.title}</h4>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                difficultyColors[quest.difficulty as keyof typeof difficultyColors],
                              )}
                            >
                              {quest.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{quest.description}</p>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">
                                {quest.progress}/{quest.target}
                              </span>
                            </div>
                            <Progress value={(quest.progress / quest.target) * 100} className="h-3" />

                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary">
                                  <Zap className="h-3 w-3 mr-1 text-primary" />
                                  {quest.xp} XP
                                </Badge>
                                <Badge variant="secondary">
                                  <Coins className="h-3 w-3 mr-1 text-yellow-500" />
                                  {quest.coins}
                                </Badge>
                              </div>
                              {isComplete && (
                                <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                  Claim
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </Card>

          {/* Monthly Quests */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Star className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Monthly Quests</h3>
                  <p className="text-sm text-muted-foreground">Epic challenges for legendary rewards</p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                <Clock className="h-3 w-3 mr-1" />
                Resets in 18d 5h
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {monthlyQuests.map((quest, index) => {
                const Icon = quest.icon
                const isComplete = quest.progress >= quest.target
                return (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      className={cn(
                        "p-5 border-2 transition-all relative overflow-hidden",
                        "border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5",
                      )}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                      <div className="relative z-10">
                        <div className="flex items-start gap-4">
                          <div className={cn("p-3 rounded-xl", quest.bgColor)}>
                            <Icon className={cn("h-6 w-6", quest.color)} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold">{quest.title}</h4>
                              <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">Legendary</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">{quest.description}</p>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {quest.progress}/{quest.target}
                                </span>
                              </div>
                              <Progress value={(quest.progress / quest.target) * 100} className="h-3" />

                              <div className="flex items-center gap-3 pt-2">
                                <Badge variant="secondary">
                                  <Zap className="h-3 w-3 mr-1 text-primary" />
                                  {quest.xp} XP
                                </Badge>
                                <Badge variant="secondary">
                                  <Coins className="h-3 w-3 mr-1 text-yellow-500" />
                                  {quest.coins}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          {/* Achievement Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{unlockedAchievements}</div>
                <div className="text-sm text-muted-foreground">Unlocked</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalAchievements - unlockedAchievements}</div>
                <div className="text-sm text-muted-foreground">Locked</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500">
                  {achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.points, 0)}
                </div>
                <div className="text-sm text-muted-foreground">XP Earned</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">
                  {Math.round((unlockedAchievements / totalAchievements) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Completion</div>
              </div>
            </Card>
          </div>

          {/* Achievement Categories */}
          {[
            "getting-started",
            "productivity",
            "development",
            "collaboration",
            "consistency",
            "special",
            "leadership",
          ].map((category) => {
            const categoryAchievements = achievements.filter((a) => a.category === category)
            if (categoryAchievements.length === 0) return null

            const categoryNames: Record<string, string> = {
              "getting-started": "Getting Started",
              productivity: "Productivity",
              development: "Development",
              collaboration: "Collaboration",
              consistency: "Consistency",
              special: "Special",
              leadership: "Leadership",
            }

            return (
              <Card key={category} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">{categoryNames[category]}</h3>
                  <Badge variant="outline">
                    {categoryAchievements.filter((a) => a.unlocked).length}/{categoryAchievements.length}
                  </Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryAchievements.map((achievement, index) => {
                    const Icon = achievement.icon
                    const colors = rarityColors[achievement.rarity as keyof typeof rarityColors]
                    const hasProgress = achievement.progress !== undefined && achievement.target !== undefined

                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedAchievement(achievement)
                          setShowAchievementDialog(true)
                        }}
                      >
                        <Card
                          className={cn(
                            "p-5 h-full border-2 transition-all relative overflow-hidden",
                            achievement.unlocked ? cn(colors.border, colors.bg) : "border-border/50 opacity-70",
                          )}
                        >
                          {!achievement.unlocked && (
                            <div className="absolute top-3 right-3">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}

                          <div className="flex items-start gap-3 mb-3">
                            <motion.div
                              className={cn("p-3 rounded-xl border", colors.border, colors.bg)}
                              whileHover={{ rotate: achievement.unlocked ? 360 : 0 }}
                              transition={{ duration: 0.6 }}
                            >
                              <Icon className={cn("h-6 w-6", colors.text)} />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm truncate">{achievement.name}</h4>
                                {achievement.unlocked && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{achievement.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn("text-xs capitalize", colors.text)}>
                              {achievement.rarity}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                              {achievement.points} XP
                            </Badge>
                          </div>

                          {hasProgress && !achievement.unlocked && (
                            <div className="mt-3 space-y-1">
                              <Progress value={(achievement.progress! / achievement.target!) * 100} className="h-1.5" />
                              <p className="text-xs text-muted-foreground text-right">
                                {achievement.progress}/{achievement.target}
                              </p>
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          {activeChallenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5" />
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold">{challenge.title}</h3>
                        <Badge className="animate-pulse bg-red-500/20 text-red-500 border-red-500/30">
                          <Swords className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                        <Badge variant="outline">{challenge.type === "global" ? "Individual" : "Team"}</Badge>
                      </div>
                      <p className="text-muted-foreground">{challenge.description}</p>
                    </div>
                    <div className="text-center md:text-right">
                      <div className="text-sm text-muted-foreground">Days Remaining</div>
                      <div className="text-3xl font-bold text-primary">{challenge.daysLeft}</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card className="p-4 bg-background/50">
                      <div className="text-sm text-muted-foreground mb-1">
                        {challenge.type === "global" ? "Your Rank" : "Team Rank"}
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        #{challenge.type === "global" ? challenge.myRank : challenge.myTeamRank}
                      </div>
                    </Card>
                    <Card className="p-4 bg-background/50">
                      <div className="text-sm text-muted-foreground mb-1">
                        {challenge.type === "global" ? "Your Score" : "Team Score"}
                      </div>
                      <div className="text-3xl font-bold">
                        {(challenge.type === "global" ? challenge.myScore : challenge.myTeamScore)?.toLocaleString()}
                      </div>
                    </Card>
                    <Card className="p-4 bg-background/50">
                      <div className="text-sm text-muted-foreground mb-1">
                        {challenge.type === "global" ? "Participants" : "Teams"}
                      </div>
                      <div className="text-3xl font-bold">
                        {challenge.type === "global" ? challenge.totalParticipants : challenge.totalTeams}
                      </div>
                    </Card>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Prizes */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" />
                        Prizes
                      </h4>
                      <div className="space-y-3">
                        {challenge.prizes.map((prize, i) => {
                          const Icon = prize.icon
                          return (
                            <div
                              key={i}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg",
                                i === 0
                                  ? "bg-amber-500/10 border border-amber-500/30"
                                  : i === 1
                                    ? "bg-gray-400/10 border border-gray-400/30"
                                    : i === 2
                                      ? "bg-orange-600/10 border border-orange-600/30"
                                      : "bg-muted/50 border border-border/50",
                              )}
                            >
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  i === 0
                                    ? "bg-amber-500/20"
                                    : i === 1
                                      ? "bg-gray-400/20"
                                      : i === 2
                                        ? "bg-orange-600/20"
                                        : "bg-muted",
                                )}
                              >
                                <Icon
                                  className={cn(
                                    "h-5 w-5",
                                    i === 0
                                      ? "text-amber-500"
                                      : i === 1
                                        ? "text-gray-400"
                                        : i === 2
                                          ? "text-orange-600"
                                          : "text-muted-foreground",
                                  )}
                                />
                              </div>
                              <div>
                                <div className="font-semibold">
                                  {typeof prize.position === "number"
                                    ? `${prize.position}${prize.position === 1 ? "st" : prize.position === 2 ? "nd" : "rd"} Place`
                                    : `${prize.position} Place`}
                                </div>
                                <div className="text-sm text-muted-foreground">{prize.reward}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Leaderboard */}
                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Top {challenge.type === "global" ? "Performers" : "Teams"}
                      </h4>
                      <div className="space-y-2">
                        {(challenge.type === "global" ? challenge.topScores : challenge.topTeams)?.map(
                          (entry: any, i: number) => (
                            <div
                              key={i}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-all",
                                i === 0
                                  ? "bg-amber-500/10"
                                  : i === 1
                                    ? "bg-gray-400/10"
                                    : i === 2
                                      ? "bg-orange-600/10"
                                      : "bg-muted/30",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                  i === 0
                                    ? "bg-amber-500 text-white"
                                    : i === 1
                                      ? "bg-gray-400 text-white"
                                      : i === 2
                                        ? "bg-orange-600 text-white"
                                        : "bg-muted text-muted-foreground",
                                )}
                              >
                                {entry.rank}
                              </div>
                              {challenge.type === "global" && entry.avatar && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={entry.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{entry.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{entry.name}</div>
                                {challenge.type === "team" && (
                                  <div className="text-xs text-muted-foreground">{entry.members} members</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{entry.score.toLocaleString()}</div>
                                <div className="text-xs text-muted-foreground">points</div>
                              </div>
                              {challenge.type === "global" && entry.change !== undefined && (
                                <div
                                  className={cn(
                                    "flex items-center text-xs",
                                    entry.change > 0
                                      ? "text-green-500"
                                      : entry.change < 0
                                        ? "text-red-500"
                                        : "text-muted-foreground",
                                  )}
                                >
                                  {entry.change > 0 ? (
                                    <ArrowUp className="h-3 w-3" />
                                  ) : entry.change < 0 ? (
                                    <ArrowDown className="h-3 w-3" />
                                  ) : (
                                    <Minus className="h-3 w-3" />
                                  )}
                                </div>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Global Leaderboard</h3>
                  <p className="text-sm text-muted-foreground">Top performers across all teams</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-4 mb-8 pb-8 border-b">
              {[1, 0, 2].map((index) => {
                const student = topStudents[index]
                if (!student) return null
                const heights = ["h-32", "h-40", "h-28"]
                const bgColors = ["bg-gray-400", "bg-amber-500", "bg-orange-600"]
                const positions = [1, 0, 2]

                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <Avatar
                      className={cn(
                        "border-4 mb-2",
                        index === 1
                          ? "h-20 w-20 border-amber-500"
                          : index === 0
                            ? "h-16 w-16 border-gray-400"
                            : "h-14 w-14 border-orange-600",
                      )}
                    >
                      <AvatarImage src={student.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-center mb-2">
                      <div className="font-semibold text-sm">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.xp.toLocaleString()} XP</div>
                    </div>
                    <div
                      className={cn(
                        "w-20 rounded-t-lg flex items-center justify-center",
                        heights[index],
                        bgColors[positions[index]],
                      )}
                    >
                      <span className="text-white text-2xl font-bold">{positions[index] + 1}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Full Leaderboard */}
            <div className="space-y-2">
              {topStudents.map((student, index) => {
                const isCurrentUser = student.id === currentUser?.id
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.03 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all",
                      isCurrentUser ? "bg-primary/10 border-2 border-primary/30" : "hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold",
                        index < 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index < 3 ? (
                        index === 0 ? (
                          <Crown className="h-5 w-5 text-amber-500" />
                        ) : index === 1 ? (
                          <Medal className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Award className="h-5 w-5 text-orange-600" />
                        )
                      ) : (
                        index + 1
                      )}
                    </div>

                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-semibold truncate", isCurrentUser && "text-primary")}>
                          {student.name}
                          {isCurrentUser && " (You)"}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Level {student.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          {student.streak} days
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3 text-purple-500" />
                          {student.achievements} achievements
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold">{student.xp.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">XP</div>
                    </div>

                    <div
                      className={cn(
                        "flex items-center text-sm",
                        (student.weeklyChange || 0) > 0
                          ? "text-green-500"
                          : (student.weeklyChange || 0) < 0
                            ? "text-red-500"
                            : "text-muted-foreground",
                      )}
                    >
                      {(student.weeklyChange || 0) > 0 ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (student.weeklyChange || 0) < 0 ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                      <span className="ml-1">{Math.abs(student.weeklyChange || 0)}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {currentUserRank > 15 && (
              <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                      {currentUserRank}
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-primary">{currentUser?.name} (You)</p>
                      <p className="text-sm text-muted-foreground">Level {currentUser?.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{(currentUser?.xp || 0).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">XP</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Store Tab */}
        <TabsContent value="store" className="space-y-6">
          {/* Coins Balance */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-yellow-500/20">
                  <Coins className="h-8 w-8 text-yellow-500" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Your Balance</div>
                  <div className="text-3xl font-bold">{userCoins} Coins</div>
                </div>
              </div>
              <Button variant="outline">
                <History className="h-4 w-4 mr-2" />
                Transaction History
              </Button>
            </div>
          </Card>

          {/* Store Categories */}
          {["theme", "avatar", "badge", "perk"].map((type) => {
            const items = rewardStore.filter((r) => r.type === type)
            if (items.length === 0) return null

            const categoryNames: Record<string, string> = {
              theme: "Themes",
              avatar: "Avatar Frames",
              badge: "Badges",
              perk: "Perks & Boosts",
            }

            const categoryIcons: Record<string, any> = {
              theme: Palette,
              avatar: CircleUser,
              badge: Award,
              perk: Rocket,
            }

            const CategoryIcon = categoryIcons[type]

            return (
              <Card key={type} className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{categoryNames[type]}</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((item, index) => {
                    const colors = rarityColors[item.rarity as keyof typeof rarityColors]
                    const Icon = item.icon
                    const canAfford = userCoins >= item.price

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03, y: -4 }}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedReward(item)
                          setShowPurchaseDialog(true)
                        }}
                      >
                        <Card
                          className={cn(
                            "p-4 h-full border-2 transition-all relative overflow-hidden",
                            item.owned ? "border-green-500/30 bg-green-500/5" : colors.border,
                          )}
                        >
                          {item.owned && (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-green-500 text-white">Owned</Badge>
                            </div>
                          )}

                          {/* Preview */}
                          <div
                            className={cn(
                              "w-full h-24 rounded-lg mb-4 flex items-center justify-center",
                              item.preview || colors.bg,
                            )}
                          >
                            <Icon className={cn("h-10 w-10", colors.text)} />
                          </div>

                          <h4 className="font-semibold mb-1">{item.name}</h4>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn("text-xs capitalize", colors.text)}>
                              {item.rarity}
                            </Badge>
                            {!item.owned && (
                              <div
                                className={cn(
                                  "flex items-center gap-1 font-bold",
                                  canAfford ? "text-yellow-500" : "text-red-500",
                                )}
                              >
                                <Coins className="h-4 w-4" />
                                {item.price}
                              </div>
                            )}
                          </div>

                          {item.consumable && item.quantity && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {item.quantity}x Available
                            </Badge>
                          )}
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>

      {/* Achievement Detail Dialog */}
      <Dialog open={showAchievementDialog} onOpenChange={setShowAchievementDialog}>
        <DialogContent className="sm:max-w-md">
          {selectedAchievement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {(() => {
                    const Icon = selectedAchievement.icon
                    const colors = rarityColors[selectedAchievement.rarity as keyof typeof rarityColors]
                    return (
                      <div className={cn("p-3 rounded-xl", colors.bg)}>
                        <Icon className={cn("h-6 w-6", colors.text)} />
                      </div>
                    )
                  })()}
                  {selectedAchievement.name}
                </DialogTitle>
                <DialogDescription>{selectedAchievement.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">
                    {selectedAchievement.rarity}
                  </Badge>
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 mr-1 fill-primary text-primary" />
                    {selectedAchievement.points} XP
                  </Badge>
                </div>

                {selectedAchievement.unlocked ? (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 text-green-500">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Unlocked!</span>
                    </div>
                    {selectedAchievement.unlockedDate && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Achieved on {new Date(selectedAchievement.unlockedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-sm font-medium mb-2">How to unlock:</div>
                      <p className="text-sm text-muted-foreground">{selectedAchievement.howToUnlock}</p>
                    </div>
                    {selectedAchievement.progress !== undefined && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {selectedAchievement.progress}/{selectedAchievement.target}
                          </span>
                        </div>
                        <Progress value={(selectedAchievement.progress / selectedAchievement.target) * 100} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-md">
          {selectedReward && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedReward.owned ? "Already Owned" : "Purchase Item"}</DialogTitle>
                <DialogDescription>
                  {selectedReward.owned ? "You already own this item." : "Confirm your purchase below."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  {(() => {
                    const Icon = selectedReward.icon
                    const colors = rarityColors[selectedReward.rarity as keyof typeof rarityColors]
                    return (
                      <div className={cn("p-3 rounded-xl", colors.bg)}>
                        <Icon className={cn("h-8 w-8", colors.text)} />
                      </div>
                    )
                  })()}
                  <div>
                    <h4 className="font-semibold">{selectedReward.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                  </div>
                </div>

                {!selectedReward.owned && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <div className="flex items-center gap-2 font-bold text-yellow-500">
                        <Coins className="h-5 w-5" />
                        {selectedReward.price}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Your Balance</span>
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        {userCoins}
                      </div>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span>After Purchase</span>
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          userCoins >= selectedReward.price ? "text-green-500" : "text-red-500",
                        )}
                      >
                        <Coins className="h-5 w-5" />
                        {userCoins - selectedReward.price}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => setShowPurchaseDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button className="flex-1" disabled={userCoins < selectedReward.price}>
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Purchase
                      </Button>
                    </div>
                    {userCoins < selectedReward.price && (
                      <p className="text-sm text-red-500 text-center">
                        Not enough coins! Complete quests to earn more.
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
