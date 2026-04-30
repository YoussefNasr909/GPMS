"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  User,
  Bell,
  Palette,
  Shield,
  Mail,
  Phone,
  MapPin,
  Upload,
  Save,
  Lock,
  Eye,
  EyeOff,
  Layout,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Download,
  Smartphone,
  History,
  AlertTriangle,
  Database,
  Calendar,
  MessageSquare,
  FileText,
  Zap,
  CheckCircle,
  Users,
} from "lucide-react"
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

export default function SettingsPage() {
  const { currentUser } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { theme, setTheme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false)

  const isStudent = currentUser?.role === "leader" || currentUser?.role === "member"
  const isSupervisor = currentUser?.role === "doctor" || currentUser?.role === "ta"
  const isAdmin = currentUser?.role === "admin"

  const [profileData, setProfileData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    bio: currentUser?.bio || "",
    phone: "+20 123 456 7890",
    location: "Cairo, Egypt",
    department: currentUser?.department || "",
    language: "en",
    timezone: "Africa/Cairo",
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    meetingReminders: true,
    submissionAlerts: true,
    teamUpdates: true,
    weeklyDigest: false,
    soundEnabled: true,
    desktopNotifications: true,
    mentionNotifications: true,
    deadlineWarnings: true,
    gradeNotifications: true,
  })

  const [appearance, setAppearance] = useState({
    theme: theme,
    accentColor: "indigo",
    fontSize: 16,
    reducedMotion: false,
    compactMode: false,
    sidebarCollapsed: sidebarCollapsed,
    highContrast: false,
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showEmail: true,
    showActivity: true,
    showTeam: true,
    allowMessages: true,
    showOnlineStatus: true,
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
  })

  const presetThemes = [
    { id: "blue", name: "Ocean Blue", color: "bg-blue-600" },
    { id: "green", name: "Forest Green", color: "bg-emerald-600" },
    { id: "purple", name: "Royal Purple", color: "bg-indigo-600" },
    { id: "orange", name: "Sunset Orange", color: "bg-orange-500" },
    { id: "pink", name: "Rose Pink", color: "bg-rose-500" },
    { id: "indigo", name: "Modern Indigo", color: "bg-violet-600" },
  ]

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully!`)
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="p-6 sm:p-8 text-center max-w-sm w-full">
          <User className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold mb-2">No User Selected</h2>
          <p className="text-sm text-muted-foreground">Please login to access settings</p>
        </Card>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none">
            <TabsList className="inline-flex h-auto gap-1 sm:gap-2 bg-muted/50 p-1 min-w-max sm:min-w-0 sm:flex-wrap">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Notifications</span>
                <span className="xs:hidden">Notifs</span>
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Appearance</span>
              </TabsTrigger>
              <TabsTrigger
                value="privacy"
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Privacy</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
              >
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Security</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger
                  value="admin"
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                >
                  <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Profile Picture</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Update your profile photo</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-3 sm:space-y-4">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/20">
                    <AvatarImage src={currentUser?.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl sm:text-3xl bg-primary/10 text-primary">
                      {currentUser?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 bg-transparent">
                      <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Upload
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive h-8 sm:h-9 w-8 sm:w-9 p-0">
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                    JPG, PNG or GIF. Max size 5MB
                  </p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Profile Information</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="name" className="text-xs sm:text-sm">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="phone" className="text-xs sm:text-sm">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="location" className="text-xs sm:text-sm">
                        Location
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                          className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="department" className="text-xs sm:text-sm">
                        Department
                      </Label>
                      <Select
                        value={profileData.department}
                        onValueChange={(v) => setProfileData({ ...profileData, department: v })}
                      >
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                          <SelectItem value="Information Technology">Information Technology</SelectItem>
                          <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                          <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="language" className="text-xs sm:text-sm">
                        Language
                      </Label>
                      <Select
                        value={profileData.language}
                        onValueChange={(v) => setProfileData({ ...profileData, language: v })}
                      >
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="bio" className="text-xs sm:text-sm">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="text-sm resize-none"
                    />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {profileData.bio.length}/500 characters
                    </p>
                  </div>

                  {isSupervisor && (
                    <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                      <h4 className="font-medium text-sm sm:text-base">Supervisor Settings</h4>
                      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm">Office Hours</Label>
                          <Input defaultValue={currentUser.officeHours} className="h-9 sm:h-10 text-sm" />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm">Max Teams</Label>
                          <Input type="number" defaultValue={currentUser.maxTeams} className="h-9 sm:h-10 text-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={() => handleSave("Profile")} className="h-9 sm:h-10 text-xs sm:text-sm">
                      <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Configure email notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {[
                    {
                      key: "emailNotifications",
                      label: "Email Notifications",
                      desc: "Receive notifications via email",
                    },
                    { key: "weeklyDigest", label: "Weekly Digest", desc: "Get a weekly summary of activities" },
                    { key: "gradeNotifications", label: "Grade Updates", desc: "Notifications when grades are posted" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3 py-1">
                      <div className="min-w-0">
                        <Label className="text-xs sm:text-sm">{item.label}</Label>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    Push Notifications
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Configure push notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {[
                    { key: "pushNotifications", label: "Push Notifications", desc: "Browser push notifications" },
                    { key: "desktopNotifications", label: "Desktop Alerts", desc: "Show desktop notifications" },
                    { key: "soundEnabled", label: "Sound", desc: "Play sound for notifications" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3 py-1">
                      <div className="min-w-0">
                        <Label className="text-xs sm:text-sm">{item.label}</Label>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                    Activity Notifications
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Choose which activities trigger notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { key: "taskReminders", label: "Task Reminders", icon: CheckCircle },
                      { key: "meetingReminders", label: "Meeting Reminders", icon: Calendar },
                      { key: "submissionAlerts", label: "Submission Alerts", icon: FileText },
                      { key: "teamUpdates", label: "Team Updates", icon: Users },
                      { key: "mentionNotifications", label: "Mentions", icon: MessageSquare },
                      { key: "deadlineWarnings", label: "Deadline Warnings", icon: AlertTriangle },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg border gap-2"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                          <Label className="cursor-pointer text-xs sm:text-sm truncate">{item.label}</Label>
                        </div>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-4 sm:mt-6">
                    <Button onClick={() => handleSave("Notification")} className="h-9 sm:h-10 text-xs sm:text-sm">
                      <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                    Theme
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Choose your preferred theme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    {[
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "system", label: "System", icon: Monitor },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id)
                          setAppearance({ ...appearance, theme: t.id })
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-lg border-2 transition-all",
                          appearance.theme === t.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:border-muted-foreground/20",
                        )}
                      >
                        <t.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="text-xs sm:text-sm font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-xs sm:text-sm">Accent Color</Label>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {presetThemes.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setAppearance({ ...appearance, accentColor: preset.id })}
                          className={cn(
                            "h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all",
                            preset.color,
                            appearance.accentColor === preset.id
                              ? "ring-2 ring-offset-2 ring-primary"
                              : "hover:scale-110",
                          )}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Layout className="h-4 w-4 sm:h-5 sm:w-5" />
                    Layout
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Customize your layout preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { key: "compactMode", label: "Compact Mode", desc: "Reduce spacing and padding" },
                      {
                        key: "sidebarCollapsed",
                        label: "Collapsed Sidebar",
                        desc: "Start with sidebar collapsed",
                        action: toggleSidebar,
                      },
                      { key: "reducedMotion", label: "Reduced Motion", desc: "Minimize animations" },
                      { key: "highContrast", label: "High Contrast", desc: "Increase color contrast" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <Label className="text-xs sm:text-sm">{item.label}</Label>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.desc}</p>
                        </div>
                        <Switch
                          checked={appearance[item.key as keyof typeof appearance] as boolean}
                          onCheckedChange={(checked) => {
                            if (item.action) item.action()
                            setAppearance({ ...appearance, [item.key]: checked })
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs sm:text-sm">Font Size</Label>
                      <span className="text-xs sm:text-sm text-muted-foreground">{appearance.fontSize}px</span>
                    </div>
                    <Slider
                      value={[appearance.fontSize]}
                      onValueChange={([value]) => setAppearance({ ...appearance, fontSize: value })}
                      min={12}
                      max={20}
                      step={1}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSave("Appearance")} className="h-9 sm:h-10 text-xs sm:text-sm">
                      <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Control your privacy and visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">Profile Visibility</Label>
                  <Select
                    value={privacy.profileVisibility}
                    onValueChange={(v) => setPrivacy({ ...privacy, profileVisibility: v })}
                  >
                    <SelectTrigger className="w-full sm:w-64 h-9 sm:h-10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Everyone can see</SelectItem>
                      <SelectItem value="team">Team Only - Only team members</SelectItem>
                      <SelectItem value="private">Private - Only you</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3 sm:space-y-4">
                  {[
                    { key: "showEmail", label: "Show Email", desc: "Display email on your profile" },
                    { key: "showActivity", label: "Show Activity", desc: "Display your recent activity" },
                    { key: "showTeam", label: "Show Team", desc: "Display team membership" },
                    { key: "allowMessages", label: "Allow Messages", desc: "Let others send you messages" },
                    { key: "showOnlineStatus", label: "Online Status", desc: "Show when you're online" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Label className="text-xs sm:text-sm">{item.label}</Label>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.desc}</p>
                      </div>
                      <Switch
                        checked={privacy[item.key as keyof typeof privacy] as boolean}
                        onCheckedChange={(checked) => setPrivacy({ ...privacy, [item.key]: checked })}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3 sm:space-y-4">
                  <h4 className="font-medium text-sm sm:text-base">Data & Export</h4>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Button variant="outline" className="h-9 sm:h-10 text-xs sm:text-sm bg-transparent">
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Export My Data
                    </Button>
                    <Button variant="outline" className="h-9 sm:h-10 text-xs sm:text-sm bg-transparent">
                      <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Activity Log
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Privacy")} className="h-9 sm:h-10 text-xs sm:text-sm">
                    <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Update your password regularly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Current Password</Label>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} className="pr-10 h-9 sm:h-10 text-sm" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-9 sm:w-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">New Password</Label>
                    <div className="relative">
                      <Input type={showNewPassword ? "text" : "password"} className="pr-10 h-9 sm:h-10 text-sm" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-9 sm:w-10"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Confirm New Password</Label>
                    <Input type="password" className="h-9 sm:h-10 text-sm" />
                  </div>
                  <Button onClick={() => handleSave("Password")} className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Add an extra layer of security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm">Authenticator App</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {security.twoFactorEnabled ? "Enabled" : "Not enabled"}
                        </p>
                      </div>
                    </div>
                    <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant={security.twoFactorEnabled ? "outline" : "default"}
                          size="sm"
                          className="h-8 sm:h-9 text-xs sm:text-sm shrink-0"
                        >
                          {security.twoFactorEnabled ? "Manage" : "Enable"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-4 sm:mx-auto max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">Setup Two-Factor Authentication</DialogTitle>
                          <DialogDescription className="text-xs sm:text-sm">
                            Scan the QR code with your authenticator app
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center py-4 sm:py-6">
                          <div className="h-36 w-36 sm:h-48 sm:w-48 bg-muted rounded-lg flex items-center justify-center">
                            <p className="text-xs sm:text-sm text-muted-foreground">QR Code</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <Label className="text-xs sm:text-sm">Verification Code</Label>
                          <Input placeholder="Enter 6-digit code" className="h-9 sm:h-10 text-sm" />
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                          <Button
                            variant="outline"
                            onClick={() => setIs2FADialogOpen(false)}
                            className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              setSecurity({ ...security, twoFactorEnabled: true })
                              setIs2FADialogOpen(false)
                              toast.success("Two-factor authentication enabled!")
                            }}
                            className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                          >
                            Verify & Enable
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Label className="text-xs sm:text-sm">Login Alerts</Label>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        Get notified of new logins
                      </p>
                    </div>
                    <Switch
                      checked={security.loginAlerts}
                      onCheckedChange={(checked) => setSecurity({ ...security, loginAlerts: checked })}
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs sm:text-sm">Session Timeout</Label>
                      <span className="text-xs sm:text-sm text-muted-foreground">{security.sessionTimeout} min</span>
                    </div>
                    <Slider
                      value={[security.sessionTimeout]}
                      onValueChange={([value]) => setSecurity({ ...security, sessionTimeout: value })}
                      min={5}
                      max={120}
                      step={5}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="lg:col-span-2 border-destructive/50">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm">Delete Account</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 sm:h-9 text-xs sm:text-sm w-full sm:w-auto shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="mx-4 sm:mx-auto max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-base sm:text-lg">Delete Account</DialogTitle>
                          <DialogDescription className="text-xs sm:text-sm">
                            This action cannot be undone. This will permanently delete your account and remove all
                            associated data.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                          <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 text-destructive">
                            <p className="text-xs sm:text-sm font-medium">Warning: This will delete:</p>
                            <ul className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 list-disc list-inside">
                              <li>Your profile and settings</li>
                              <li>All tasks and submissions</li>
                              <li>Team memberships</li>
                              <li>All associated files</li>
                            </ul>
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <Label className="text-xs sm:text-sm">Type your email to confirm</Label>
                            <Input placeholder={currentUser.email} className="h-9 sm:h-10 text-sm" />
                          </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                          <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button variant="destructive" className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto">
                            Delete My Account
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          {isAdmin && (
            <TabsContent value="admin">
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Database className="h-4 w-4 sm:h-5 sm:w-5" />
                    Admin Settings
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">System-wide administration options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="p-3 sm:p-4 rounded-lg border">
                      <h4 className="font-medium text-sm sm:text-base mb-1.5 sm:mb-2">User Management</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">
                        Manage all users in the system
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm w-full bg-transparent"
                      >
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Manage Users
                      </Button>
                    </div>
                    <div className="p-3 sm:p-4 rounded-lg border">
                      <h4 className="font-medium text-sm sm:text-base mb-1.5 sm:mb-2">System Backup</h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">
                        Create a backup of all data
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm w-full bg-transparent"
                      >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Create Backup
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => handleSave("Admin")} className="h-9 sm:h-10 text-xs sm:text-sm">
                      <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Save Admin Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
