"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { format } from "date-fns"
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Eye,
  Filter,
  Info,
  Lock,
  RefreshCw,
  Search,
  Server,
  Shield,
  Trash2,
  User,
  XCircle,
  FileText,
  Globe,
  HardDrive,
  Cpu,
  Zap,
  AlertCircle,
  Terminal,
  ChevronRight,
  MoreVertical,
  Copy,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/stores/auth-store"

// Mock log data
const systemLogs = [
  {
    id: "log-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    level: "info",
    category: "system",
    message: "Server health check completed successfully",
    details: { server: "main-01", responseTime: "45ms", status: "healthy" },
    source: "HealthMonitor",
  },
  {
    id: "log-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    level: "warning",
    category: "security",
    message: "Multiple failed login attempts detected",
    details: { ip: "192.168.1.45", attempts: 5, user: "unknown" },
    source: "AuthService",
  },
  {
    id: "log-003",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    level: "error",
    category: "database",
    message: "Database connection timeout",
    details: { database: "mongodb-primary", timeout: "30s", retries: 3 },
    source: "DBConnector",
  },
  {
    id: "log-004",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    level: "success",
    category: "backup",
    message: "Daily backup completed successfully",
    details: { size: "2.4GB", duration: "12m 34s", destination: "s3://backups" },
    source: "BackupService",
  },
  {
    id: "log-005",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    level: "info",
    category: "user",
    message: "New user registration",
    details: { userId: "usr-12345", email: "newuser@university.edu", role: "member" },
    source: "UserService",
  },
  {
    id: "log-006",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    level: "warning",
    category: "performance",
    message: "High memory usage detected",
    details: { usage: "87%", threshold: "80%", server: "app-02" },
    source: "ResourceMonitor",
  },
  {
    id: "log-007",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    level: "info",
    category: "api",
    message: "API rate limit reached for client",
    details: { clientId: "client-789", limit: "1000/hour", endpoint: "/api/teams" },
    source: "RateLimiter",
  },
  {
    id: "log-008",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    level: "success",
    category: "deployment",
    message: "New version deployed successfully",
    details: { version: "2.4.1", environment: "production", duration: "3m 21s" },
    source: "DeploymentPipeline",
  },
  {
    id: "log-009",
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    level: "error",
    category: "email",
    message: "Email delivery failed",
    details: { recipient: "user@example.com", reason: "SMTP timeout", retryCount: 2 },
    source: "EmailService",
  },
  {
    id: "log-010",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    level: "info",
    category: "security",
    message: "SSL certificate renewed",
    details: { domain: "projecthub.edu", validUntil: "2026-01-15", issuer: "Let's Encrypt" },
    source: "CertManager",
  },
]

const activityLogs = [
  {
    id: "act-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 1),
    user: { name: "Dr. Ahmed Hassan", role: "doctor", avatar: "AH" },
    action: "evaluated",
    target: "Team Alpha proposal",
    details: "Grade: A, Score: 92/100",
    ip: "192.168.1.100",
  },
  {
    id: "act-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    user: { name: "Sarah Mohamed", role: "leader", avatar: "SM" },
    action: "submitted",
    target: "Week 8 Progress Report",
    details: "File size: 2.4MB",
    ip: "192.168.1.101",
  },
  {
    id: "act-003",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    user: { name: "Admin User", role: "admin", avatar: "AU" },
    action: "created",
    target: "New user account",
    details: "Email: newstudent@university.edu",
    ip: "192.168.1.1",
  },
  {
    id: "act-004",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    user: { name: "Omar Ali", role: "member", avatar: "OA" },
    action: "joined",
    target: "Team Beta",
    details: "Invite code: BETA2024",
    ip: "192.168.1.102",
  },
  {
    id: "act-005",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
    user: { name: "Eng. Fatima Nour", role: "ta", avatar: "FN" },
    action: "scheduled",
    target: "Office Hours Meeting",
    details: "Duration: 1 hour",
    ip: "192.168.1.103",
  },
  {
    id: "act-006",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    user: { name: "Dr. Mohamed Ali", role: "doctor", avatar: "MA" },
    action: "approved",
    target: "Team Gamma Project Proposal",
    details: "Status changed to: Approved",
    ip: "192.168.1.104",
  },
  {
    id: "act-007",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    user: { name: "Admin User", role: "admin", avatar: "AU" },
    action: "modified",
    target: "System Settings",
    details: "Changed: Email notifications enabled",
    ip: "192.168.1.1",
  },
  {
    id: "act-008",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    user: { name: "Youssef Ahmed", role: "leader", avatar: "YA" },
    action: "created",
    target: "New Team: Innovation Squad",
    details: "Members: 4",
    ip: "192.168.1.105",
  },
]

const auditLogs = [
  {
    id: "audit-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actor: "Admin User",
    action: "DELETE",
    resource: "User Account",
    resourceId: "usr-old-123",
    before: { status: "active", role: "member" },
    after: { status: "deleted" },
    reason: "User request",
  },
  {
    id: "audit-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    actor: "System",
    action: "UPDATE",
    resource: "Team Status",
    resourceId: "team-456",
    before: { status: "active", progress: 75 },
    after: { status: "active", progress: 80 },
    reason: "Automatic progress update",
  },
  {
    id: "audit-003",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    actor: "Admin User",
    action: "CREATE",
    resource: "Deadline",
    resourceId: "deadline-789",
    before: null,
    after: { name: "Final Submission", date: "2025-01-15" },
    reason: "New academic deadline",
  },
  {
    id: "audit-004",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    actor: "Admin User",
    action: "UPDATE",
    resource: "User Role",
    resourceId: "usr-555",
    before: { role: "member" },
    after: { role: "leader" },
    reason: "Team leader promotion",
  },
]

const getLevelIcon = (level: string) => {
  switch (level) {
    case "info":
      return <Info className="h-4 w-4" />
    case "warning":
      return <AlertTriangle className="h-4 w-4" />
    case "error":
      return <XCircle className="h-4 w-4" />
    case "success":
      return <CheckCircle2 className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

const getLevelColor = (level: string) => {
  switch (level) {
    case "info":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20"
    case "warning":
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
    case "error":
      return "text-red-500 bg-red-500/10 border-red-500/20"
    case "success":
      return "text-green-500 bg-green-500/10 border-green-500/20"
    default:
      return "text-muted-foreground bg-muted"
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "system":
      return <Server className="h-4 w-4" />
    case "security":
      return <Shield className="h-4 w-4" />
    case "database":
      return <Database className="h-4 w-4" />
    case "backup":
      return <HardDrive className="h-4 w-4" />
    case "user":
      return <User className="h-4 w-4" />
    case "performance":
      return <Cpu className="h-4 w-4" />
    case "api":
      return <Globe className="h-4 w-4" />
    case "deployment":
      return <Zap className="h-4 w-4" />
    case "email":
      return <FileText className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

export default function AdminLogsPage() {
  const { currentUser } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLog, setSelectedLog] = useState<(typeof systemLogs)[0] | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  if (currentUser?.role !== "admin") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[60vh] flex items-center justify-center"
      >
        <Card className="p-12 text-center max-w-md border-border/50">
          <Lock className="h-20 w-20 mx-auto mb-6 text-red-500" />
          <h2 className="text-3xl font-bold mb-3">Access Denied</h2>
          <p className="text-muted-foreground text-lg">You don't have permission to access the system logs.</p>
        </Card>
      </motion.div>
    )
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const filteredSystemLogs = systemLogs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = selectedLevel === "all" || log.level === selectedLevel
    const matchesCategory = selectedCategory === "all" || log.category === selectedCategory
    return matchesSearch && matchesLevel && matchesCategory
  })

  const logStats = {
    total: systemLogs.length,
    info: systemLogs.filter((l) => l.level === "info").length,
    warning: systemLogs.filter((l) => l.level === "warning").length,
    error: systemLogs.filter((l) => l.level === "error").length,
    success: systemLogs.filter((l) => l.level === "success").length,
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 border border-border/50 relative overflow-hidden bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
        <motion.div
          className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 0] }}
          transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <motion.h1
              className="text-3xl font-bold mb-2 flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Terminal className="h-8 w-8 text-purple-500" />
              System Logs & Audit Trail
            </motion.h1>
            <p className="text-muted-foreground">Monitor system activity, security events, and user actions</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(autoRefresh && "bg-green-500/10 text-green-500 border-green-500/20")}
            >
              <Activity className={cn("h-4 w-4 mr-2", autoRefresh && "animate-pulse")} />
              {autoRefresh ? "Live" : "Auto-refresh"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Total Logs", value: logStats.total, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Info", value: logStats.info, icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
          {
            label: "Warnings",
            value: logStats.warning,
            icon: AlertTriangle,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
          },
          { label: "Errors", value: logStats.error, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
          {
            label: "Success",
            value: logStats.success,
            icon: CheckCircle2,
            color: "text-green-500",
            bg: "bg-green-500/10",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 border-border/50">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="system" className="w-full">
        <TabsList className="p-1 bg-muted/50">
          <TabsTrigger value="system" className="data-[state=active]:bg-background">
            <Server className="h-4 w-4 mr-2" />
            System Logs
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-background">
            <Activity className="h-4 w-4 mr-2" />
            User Activity
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-background">
            <Shield className="h-4 w-4 mr-2" />
            Audit Trail
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-background">
            <Lock className="h-4 w-4 mr-2" />
            Security Events
          </TabsTrigger>
        </TabsList>

        {/* System Logs Tab */}
        <TabsContent value="system" className="space-y-4 mt-4">
          {/* Filters */}
          <Card className="p-4 border-border/50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs by message or source..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Log List */}
          <Card className="border-border/50 overflow-hidden">
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border/50">
                {filteredSystemLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-lg border", getLevelColor(log.level))}>
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {getCategoryIcon(log.category)}
                            <span className="ml-1">{log.category}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">{log.source}</span>
                        </div>
                        <p className="font-medium mb-1">{log.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(log.timestamp, "MMM d, yyyy HH:mm:ss")}
                          </span>
                          <span className="font-mono">{log.id}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <Card className="border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent User Activity
              </h3>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border/50">
                {activityLogs.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {activity.user.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{activity.user.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.user.role}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-primary font-medium">{activity.action}</span>
                          <span className="text-muted-foreground">{activity.target}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{activity.details}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(activity.timestamp, "MMM d, yyyy HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {activity.ip}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <Card className="border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Audit Trail
              </h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Audit Log
              </Button>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="divide-y divide-border/50">
                {auditLogs.map((audit, index) => (
                  <motion.div
                    key={audit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          audit.action === "DELETE"
                            ? "bg-red-500/10 text-red-500"
                            : audit.action === "CREATE"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-blue-500/10 text-blue-500",
                        )}
                      >
                        {audit.action === "DELETE" ? (
                          <Trash2 className="h-4 w-4" />
                        ) : audit.action === "CREATE" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              audit.action === "DELETE"
                                ? "border-red-500/20 text-red-500"
                                : audit.action === "CREATE"
                                  ? "border-green-500/20 text-green-500"
                                  : "border-blue-500/20 text-blue-500",
                            )}
                          >
                            {audit.action}
                          </Badge>
                          <span className="font-medium">{audit.resource}</span>
                          <span className="text-muted-foreground text-sm">by {audit.actor}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                          {audit.before && (
                            <div className="p-2 rounded bg-red-500/5 border border-red-500/10">
                              <p className="text-xs text-muted-foreground mb-1">Before</p>
                              <pre className="text-xs font-mono">{JSON.stringify(audit.before, null, 2)}</pre>
                            </div>
                          )}
                          {audit.after && (
                            <div className="p-2 rounded bg-green-500/5 border border-green-500/10">
                              <p className="text-xs text-muted-foreground mb-1">After</p>
                              <pre className="text-xs font-mono">{JSON.stringify(audit.after, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(audit.timestamp, "MMM d, yyyy HH:mm:ss")}
                          </span>
                          <span>Reason: {audit.reason}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 border-border/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">Failed Login Attempts</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </Card>
            <Card className="p-4 border-border/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">152</p>
                  <p className="text-xs text-muted-foreground">Successful Logins</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </Card>
            <Card className="p-4 border-border/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Lock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Blocked IPs</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </Card>
          </div>

          <Card className="border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <h3 className="font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Security Events
              </h3>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="divide-y divide-border/50">
                {systemLogs
                  .filter((log) => log.category === "security")
                  .map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg border", getLevelColor(log.level))}>
                          {getLevelIcon(log.level)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium mb-1">{log.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(log.timestamp, "MMM d, yyyy HH:mm:ss")}
                            </span>
                            <span>{log.source}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getLevelIcon(selectedLog.level)}
              Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Log ID</p>
                  <p className="font-mono text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                  <p className="text-sm">{format(selectedLog.timestamp, "MMM d, yyyy HH:mm:ss.SSS")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Level</p>
                  <Badge className={cn("capitalize", getLevelColor(selectedLog.level))}>{selectedLog.level}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <Badge variant="outline" className="capitalize">
                    {selectedLog.category}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Source</p>
                  <p className="text-sm">{selectedLog.source}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <p className="text-sm">{selectedLog.message}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Details</p>
                  <pre className="p-3 rounded-lg bg-muted text-xs font-mono overflow-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy JSON
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View in Console
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
