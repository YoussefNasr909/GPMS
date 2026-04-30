"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useEffect } from "react"
import { usersApi } from "@/lib/api/users"
import { mapApiUserToUiUser } from "@/lib/api/mappers"
import type { Department, Track, UsersSummary } from "@/lib/api/types"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Mail,
  Calendar,
  Target,
  TrendingUp,
  Edit,
  Trophy,
  Star,
  Flame,
  Coins,
  Clock,
  Users,
  CheckCircle,
  FileText,
  MessageSquare,
  GitBranch,
  Briefcase,
  GraduationCap,
  Shield,
  Zap,
  Share2,
  Camera,
  Linkedin,
  Github,
  BarChart3,
  Activity,
} from "lucide-react"
import { teams } from "@/data/teams"
import { tasks } from "@/data/tasks"
import { getUserById } from "@/data/users"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const departmentOptions = [
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Computer Engineering",
  "Data Science",
  "Artificial Intelligence",
  "Cybersecurity",
  "Information Systems",
  "Bioinformatics",
] as const

const departmentsList = [
  { value: "Computer Science", label: "Computer Science (CS)" },
  { value: "Software Engineering", label: "Software Engineering (SE)" },
  { value: "Information Technology", label: "Information Technology (IT)" },
  { value: "Computer Engineering", label: "Computer Engineering (CE)" },
  { value: "Data Science", label: "Data Science" },
  { value: "Artificial Intelligence", label: "Artificial Intelligence" },
  { value: "Cybersecurity", label: "Cybersecurity / Information Security" },
  { value: "Information Systems", label: "Information Systems (IS)" },
  { value: "Bioinformatics", label: "Bioinformatics" },
] as const

const trackOptions = [
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "devops",
  "cloud",
  "architecture",
  "qa",
  "gamedev",
  "ai",
  "cyber",
] as const

const tracksList = [
  { value: "frontend", label: "Frontend Development" },
  { value: "backend", label: "Backend Development" },
  { value: "fullstack", label: "Full-Stack Development" },
  { value: "mobile", label: "Mobile App Development" },
  { value: "devops", label: "DevOps" },
  { value: "cloud", label: "Cloud Engineering" },
  { value: "architecture", label: "Software Architecture" },
  { value: "qa", label: "Quality Assurance (QA)" },
  { value: "gamedev", label: "Game Development" },
  { value: "ai", label: "Artificial Intelligence" },
  { value: "cyber", label: "Cybersecurity" },
] as const

export default function ProfilePage() {
  const { currentUser, accessToken, hasHydrated, setAuth } = useAuthStore()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [adminSummary, setAdminSummary] = useState<UsersSummary | null>(null)
  const [isAdminSummaryLoading, setIsAdminSummaryLoading] = useState(false)
  const [adminSummaryError, setAdminSummaryError] = useState("")
  const isStudent = currentUser?.role === "leader" || currentUser?.role === "member"

  const DEPARTMENT_TO_API: Record<(typeof departmentOptions)[number], Department> = {
    "Computer Science": "COMPUTER_SCIENCE",
    "Software Engineering": "SOFTWARE_ENGINEERING",
    "Information Technology": "INFORMATION_TECHNOLOGY",
    "Computer Engineering": "COMPUTER_ENGINEERING",
    "Data Science": "DATA_SCIENCE",
    "Artificial Intelligence": "ARTIFICIAL_INTELLIGENCE",
    Cybersecurity: "CYBERSECURITY_INFOSEC",
    "Information Systems": "INFORMATION_SYSTEMS",
    Bioinformatics: "BIOINFORMATICS",
  }

  const TRACK_TO_API: Record<(typeof trackOptions)[number], Track> = {
    frontend: "FRONTEND_DEVELOPMENT",
    backend: "BACKEND_DEVELOPMENT",
    fullstack: "FULLSTACK_DEVELOPMENT",
    mobile: "MOBILE_APP_DEVELOPMENT",
    devops: "DEVOPS",
    cloud: "CLOUD_ENGINEERING",
    architecture: "SOFTWARE_ARCHITECTURE",
    qa: "QUALITY_ASSURANCE",
    gamedev: "GAME_DEVELOPMENT",
    ai: "FRONTEND_DEVELOPMENT", // fallback to supported
    cyber: "BACKEND_DEVELOPMENT", // fallback to supported
  }
 const nameParts = currentUser?.name?.trim()?.split(/\s+/) ?? []
const defaultFirstName = currentUser?.firstName ?? nameParts[0] ?? ""
const defaultLastName = currentUser?.lastName ?? nameParts.slice(1).join(" ") ?? ""


  const baseSchema = z.object({
    firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
    lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^[+]?[\d\s\-()]{7,15}$/.test(v), { message: "Phone must be 7–15 digits" }),
    department: z.enum(departmentOptions),
    bio: z
      .string()
      .trim()
      .max(500, "Bio must be at most 500 characters")
      .optional(),
    linkedin: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^https?:\/\/[^\s/$.?#].[^\s]*$/.test(v), { message: "Enter a valid URL" }),
    github: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^(?!-)[a-zA-Z0-9-]{1,39}(?<!-)$/.test(v), {
        message: "Only letters, numbers, and hyphens allowed",
      }),
    track: z.enum(trackOptions).optional(),
  })
  const schema = baseSchema.superRefine((val, ctx) => {
    if (isStudent && !val.track) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["track"], message: "Please select a track" })
    }
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
  firstName: defaultFirstName,
  lastName: defaultLastName,
      email: currentUser?.email || "",
      phone: "",
      department: (currentUser?.department as (typeof departmentOptions)[number]) || undefined,
      track: (currentUser?.track as (typeof trackOptions)[number]) || undefined,
      bio: currentUser?.bio || "",
      linkedin: currentUser?.linkedinUrl || "",
      github: currentUser?.githubUsername || "",
    },
  })
  const bioValue = useWatch({ control: form.control, name: "bio" })
  const bioLength = bioValue?.length || 0

const displayName =
  `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim() ||
  currentUser?.name ||
  currentUser?.email ||
  "User"

const avatarInitial = (currentUser?.firstName || currentUser?.name || currentUser?.email || "U")
  .trim()
  .charAt(0)
  .toUpperCase()
useEffect(() => {
  if (!isEditDialogOpen || !currentUser) return

  const depValue =
    departmentsList.find((d) => d.label === currentUser.department)?.value ??
    (currentUser.department === "Cybersecurity Infosec" ? "Cybersecurity" : currentUser.department)

  form.reset({
    firstName: currentUser.firstName ?? defaultFirstName,
    lastName: currentUser.lastName ?? defaultLastName,
    email: currentUser.email ?? "",
    phone: currentUser.phone ?? "",
    department: (depValue as any) ?? undefined,
    track: (currentUser.track as any) ?? undefined,
    bio: currentUser.bio ?? "",
    linkedin: currentUser.linkedinUrl ?? "",
    github: currentUser.githubUsername ?? "",
  })
}, [isEditDialogOpen, currentUser, form, defaultFirstName, defaultLastName])

useEffect(() => {
  if (!hasHydrated || currentUser?.role !== "admin" || !accessToken) return

  let cancelled = false
  setIsAdminSummaryLoading(true)
  setAdminSummaryError("")

  usersApi
    .summary()
    .then((result) => {
      if (cancelled) return
      setAdminSummary(result)
    })
    .catch((error: unknown) => {
      if (cancelled) return
      setAdminSummaryError(error instanceof Error ? error.message : "Couldn't load real user counters.")
    })
    .finally(() => {
      if (!cancelled) setIsAdminSummaryLoading(false)
    })

  return () => {
    cancelled = true
  }
}, [accessToken, currentUser?.role, hasHydrated])


  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No User Selected</h2>
          <p className="text-muted-foreground">Please select a user to view their profile</p>
        </Card>
      </div>
    )
  }

  const myTeams = teams.filter((t) => t.memberIds.includes(currentUser.id))
  const myTeam = myTeams[0]
  const isSupervisor = currentUser.role === "doctor" || currentUser.role === "ta"
  const isAdmin = currentUser.role === "admin"
  const adminUsersCount = isAdminSummaryLoading ? "..." : adminSummaryError ? "--" : adminSummary?.totalUsers ?? 0

  // Calculate stats
  const myTasks = tasks.filter((t) => t.assigneeId === currentUser.id)
  const completedTasks = myTasks.filter((t) => t.status === "done").length
  const totalTasks = myTasks.length
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const supervisedTeams = isSupervisor
    ? teams.filter((t) => t.doctorId === currentUser.id || t.taId === currentUser.id)
    : []

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "doctor":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      case "ta":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "leader":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "member":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return ""
    }
  }

  const getRoleTitle = (role: string) => {
    switch (role) {
      case "admin":
        return "System Administrator"
      case "doctor":
        return "Supervisor Doctor"
      case "ta":
        return "Teaching Assistant"
      case "leader":
        return "Team Leader"
      case "member":
        return "Team Member"
      default:
        return role
    }
  }

  // Mock achievements for students
  const achievements = [
    {
      id: "1",
      name: "First Task",
      icon: "🎯",
      description: "Complete your first task",
      unlocked: true,
      date: "2024-01-15",
    },
    { id: "2", name: "Team Player", icon: "🤝", description: "Join a team", unlocked: true, date: "2024-01-10" },
    {
      id: "3",
      name: "Code Warrior",
      icon: "⚔️",
      description: "Complete 10 coding tasks",
      unlocked: true,
      date: "2024-02-20",
    },
    {
      id: "4",
      name: "Early Bird",
      icon: "🐦",
      description: "Submit 5 tasks before deadline",
      unlocked: true,
      date: "2024-02-25",
    },
    {
      id: "5",
      name: "Streak Master",
      icon: "🔥",
      description: "Maintain 7-day streak",
      unlocked: (currentUser?.streak || 0) >= 7,
      date: (currentUser?.streak || 0) >= 7 ? "2024-03-01" : undefined,
    },
    { id: "6", name: "Knowledge Seeker", icon: "📚", description: "Read 10 knowledge articles", unlocked: false },
  ]

  // Mock activity for all roles
  const recentActivity = [
    {
      id: "1",
      action: "Completed task",
      target: "User authentication flow",
      time: "2 hours ago",
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      id: "2",
      action: "Submitted",
      target: "SRS Document v2",
      time: "Yesterday",
      icon: FileText,
      color: "text-blue-500",
    },
    {
      id: "3",
      action: "Attended meeting",
      target: "Weekly Sprint Review",
      time: "2 days ago",
      icon: Users,
      color: "text-purple-500",
    },
    {
      id: "4",
      action: "Pushed code",
      target: "Feature: Dashboard UI",
      time: "3 days ago",
      icon: GitBranch,
      color: "text-orange-500",
    },
    {
      id: "5",
      action: "Commented on",
      target: "API Integration Discussion",
      time: "4 days ago",
      icon: MessageSquare,
      color: "text-cyan-500",
    },
  ]

  // Mock skills for students
  const skills = [
    { name: "React", level: 85, category: "Frontend" },
    { name: "TypeScript", level: 78, category: "Language" },
    { name: "Node.js", level: 72, category: "Backend" },
    { name: "MongoDB", level: 65, category: "Database" },
    { name: "Git", level: 88, category: "Tools" },
    { name: "UI/UX Design", level: 60, category: "Design" },
  ]

  

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Profile Header */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 relative">
            <div className="absolute inset-0 bg-grid-white/10" />
            <Button variant="ghost" size="sm" className="absolute top-4 right-4 bg-background/50 backdrop-blur-sm">
              <Camera className="h-4 w-4 mr-2" />
              Change Cover
            </Button>
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} />
                 <AvatarFallback className="text-4xl bg-primary/10 text-primary">
  {avatarInitial}
</AvatarFallback>

                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                {/* Level Badge for Students */}
                {isStudent && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    Lvl {currentUser.level || 1}
                  </div>
                )}
              </div>

              {/* Name and Info */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                  <Badge className={cn("w-fit", getRoleBadgeColor(currentUser.role))}>
                    {getRoleTitle(currentUser.role)}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {currentUser.email}
                  </span>
                  {currentUser.department && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {currentUser.department}
                    </span>
                  )}
                  {currentUser.studentCode && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      {currentUser.studentCode}
                    </span>
                  )}
                </div>

                {/* Quick Stats */}
                {isStudent && (
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full">
                      <Zap className="h-4 w-4" />
                      <span className="font-semibold">{currentUser.xp || 0} XP</span>
                    </div>
                    <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full">
                      <Coins className="h-4 w-4" />
                      <span className="font-semibold">{currentUser.gold || 0} Gold</span>
                    </div>
                    <div className="flex items-center gap-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full">
                      <Flame className="h-4 w-4" />
                      <span className="font-semibold">{currentUser.streak || 0} Day Streak</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 md:mt-0">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>Update your profile information</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        className="space-y-4 py-4"
                        onSubmit={form.handleSubmit(async (values) => {
  if (!accessToken) {
    toast.error("You are not logged in.")
    return
  }

  try {
    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone?.trim() || null,
      department: DEPARTMENT_TO_API[values.department],
      preferredTrack: values.track ? TRACK_TO_API[values.track] : null,
      bio: values.bio?.trim() || null,
      linkedinUrl: values.linkedin?.trim() || null,
      githubUsername: values.github?.trim() || null,
    } as const

    const updatedApiUser = await usersApi.updateMe(payload, accessToken)
    setAuth({ user: mapApiUserToUiUser(updatedApiUser), accessToken })

    toast.success("Profile updated successfully!")
    setIsEditDialogOpen(false)
  } catch (e: any) {
    toast.error(e?.message ?? "Failed to update profile.")
  }
})}

                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="First name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="name@example.com" {...field}  disabled />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="+20 123 456 7890"
                                    maxLength={16}
                                    value={field.value || ""}
                                    onChange={(e) => {
                                      const raw = e.target.value
                                      const cleaned = raw.startsWith("+")
                                        ? "+" + raw.slice(1).replace(/\D/g, "")
                                        : raw.replace(/\D/g, "")
                                      field.onChange(cleaned.slice(0, 16))
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {departmentsList.map((d) => (
                                      <SelectItem key={d.value} value={d.value}>
                                        {d.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {isStudent && (
                            <FormField
                              control={form.control}
                              name="track"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Track</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select track" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {tracksList.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                          {t.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea rows={4} placeholder="Tell us about yourself..." {...field} />
                              </FormControl>
                              <div className="text-xs text-muted-foreground text-right">{bioLength}/500</div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="space-y-2">
                          <Label>Social Links</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="linkedin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="LinkedIn URL" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="github"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="flex items-center gap-2">
                                      <Github className="h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="GitHub Username" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={form.formState.isSubmitting}>
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* About Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentUser.bio ? (
                <p className="text-sm text-muted-foreground">{currentUser.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No bio added yet</p>
              )}

              <div className="space-y-3 pt-2">
                {currentUser.track && (
                  <div className="flex items-center gap-3 text-sm">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="capitalize">{currentUser.track} Track</span>
                  </div>
                )}
                {isSupervisor && currentUser.officeHours && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{currentUser.officeHours}</span>
                  </div>
                )}
                {currentUser.expertise && currentUser.expertise.length > 0 && (
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.expertise.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(currentUser.linkedinUrl || currentUser.githubUsername) && (
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">Profile Links</p>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.linkedinUrl && (
                        <a
                          href={currentUser.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          <Linkedin className="h-3.5 w-3.5" />
                          LinkedIn
                        </a>
                      )}
                      {currentUser.githubUsername && (
                        <a
                          href={`https://github.com/${currentUser.githubUsername}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          <Github className="h-3.5 w-3.5" />
                          @{currentUser.githubUsername}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Card for Students */}
          {isStudent && myTeam && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  My Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">{myTeam.name}</h4>
                    <p className="text-sm text-muted-foreground">{myTeam.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{myTeam.progress}%</span>
                  </div>
                  <Progress value={myTeam.progress} />
                  <div className="flex -space-x-2">
                    {myTeam.memberIds.slice(0, 5).map((memberId) => {
                      const member = getUserById(memberId)
                      return member ? (
                        <Avatar key={memberId} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ) : null
                    })}
                    {myTeam.memberIds.length > 5 && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                        +{myTeam.memberIds.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supervised Teams for Doctors/TAs */}
          {isSupervisor && supervisedTeams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Supervised Teams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supervisedTeams.slice(0, 3).map((team) => (
                    <div key={team.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{team.name}</span>
                        <Badge
                          variant={
                            team.health === "healthy"
                              ? "default"
                              : team.health === "at-risk"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {team.health}
                        </Badge>
                      </div>
                      <Progress value={team.progress} className="h-1.5" />
                    </div>
                  ))}
                  {supervisedTeams.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{supervisedTeams.length - 3} more teams
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin System Overview */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-blue-500/10">
                    <p className="text-2xl font-bold text-blue-500">{adminUsersCount}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-500/10">
                    <p className="text-2xl font-bold text-green-500">{teams.length}</p>
                    <p className="text-xs text-muted-foreground">Total Teams</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">User Counters</span>
                    <span className={cn("font-medium", adminSummaryError ? "text-red-500" : "text-green-500")}>
                      {adminSummaryError || (isAdminSummaryLoading ? "Syncing..." : "Live from database")}
                    </span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-0">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  {isStudent && <TabsTrigger value="achievements">Achievements</TabsTrigger>}
                  {isStudent && <TabsTrigger value="skills">Skills</TabsTrigger>}
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* Quick Stats Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {isStudent && (
                      <>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                              <CheckCircle className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{completedTasks}</p>
                              <p className="text-xs text-muted-foreground">Tasks Done</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                              <TrendingUp className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{taskCompletionRate}%</p>
                              <p className="text-xs text-muted-foreground">Completion Rate</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                              <Trophy className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{achievements.filter((a) => a.unlocked).length}</p>
                              <p className="text-xs text-muted-foreground">Achievements</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                              <Star className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">4.8</p>
                              <p className="text-xs text-muted-foreground">Avg Rating</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {isSupervisor && (
                      <>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                              <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{supervisedTeams.length}</p>
                              <p className="text-xs text-muted-foreground">Teams</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">24</p>
                              <p className="text-xs text-muted-foreground">Reviews Done</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                              <Calendar className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">12</p>
                              <p className="text-xs text-muted-foreground">Meetings</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                              <Star className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">4.9</p>
                              <p className="text-xs text-muted-foreground">Rating</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                              <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{adminUsersCount}</p>
                              <p className="text-xs text-muted-foreground">Users</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                              <Activity className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">99.9%</p>
                              <p className="text-xs text-muted-foreground">Uptime</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                              <Shield className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">0</p>
                              <p className="text-xs text-muted-foreground">Security Issues</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/20">
                              <Zap className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">Fast</p>
                              <p className="text-xs text-muted-foreground">Performance</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Level Progress for Students */}
                  {isStudent && (
                    <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-secondary/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                            {currentUser.level || 1}
                          </div>
                          <div>
                            <p className="font-semibold">Level {currentUser.level || 1}</p>
                            <p className="text-sm text-muted-foreground">
                              {currentUser.xp || 0} / {((currentUser.level || 1) + 1) * 1000} XP
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {((currentUser.level || 1) + 1) * 1000 - (currentUser.xp || 0)} XP
                          </p>
                          <p className="text-xs text-muted-foreground">to next level</p>
                        </div>
                      </div>
                      <Progress value={((currentUser.xp || 0) % 1000) / 10} className="h-3" />
                    </div>
                  )}
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-0">
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn("p-2 rounded-lg bg-muted", activity.color)}>
                          <activity.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {activity.action} <span className="text-muted-foreground">&ldquo;{activity.target}&rdquo;</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                {/* Achievements Tab (Students Only) */}
                {isStudent && (
                  <TabsContent value="achievements" className="mt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {achievements.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "p-4 rounded-lg border transition-all",
                            achievement.unlocked
                              ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20"
                              : "bg-muted/30 opacity-60",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{achievement.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{achievement.name}</h4>
                                {achievement.unlocked && <CheckCircle className="h-4 w-4 text-green-500" />}
                              </div>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              {achievement.unlocked && achievement.date && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Unlocked on {new Date(achievement.date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* Skills Tab (Students Only) */}
                {isStudent && (
                  <TabsContent value="skills" className="mt-0">
                    <div className="space-y-4">
                      {skills.map((skill, index) => (
                        <motion.div
                          key={skill.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{skill.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {skill.category}
                              </Badge>
                            </div>
                            <span className="text-sm font-semibold">{skill.level}%</span>
                          </div>
                          <div className="relative">
                            <Progress value={skill.level} className="h-2" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* Stats Tab */}
                <TabsContent value="stats" className="mt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          {isStudent ? "Task Statistics" : isSupervisor ? "Review Statistics" : "System Statistics"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {isStudent ? "Total Tasks" : "Total Reviews"}
                            </span>
                            <span className="font-semibold">{isStudent ? totalTasks : 48}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Completed</span>
                            <span className="font-semibold text-green-500">{isStudent ? completedTasks : 45}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Pending</span>
                            <span className="font-semibold text-amber-500">
                              {isStudent ? totalTasks - completedTasks : 3}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          Activity Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">This Week</span>
                            <span className="font-semibold">23 activities</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">This Month</span>
                            <span className="font-semibold">89 activities</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">All Time</span>
                            <span className="font-semibold">342 activities</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
