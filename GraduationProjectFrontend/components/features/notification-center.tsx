"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  MessageSquare,
  FileText,
  Award,
  CheckCheck,
  Trash2,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { notificationsApi, type ApiNotification } from "@/lib/api/notifications"

const POLL_INTERVAL_MS = 30_000 // poll unread count every 30s

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Fetch unread count (lightweight, used for badge polling) ────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsApi.getUnreadCount()
      setUnreadCount(data.unreadCount)
    } catch {
      // Silently ignore — don't show errors for background polling
    }
  }, [])

  // ─── Fetch full notification list (only when panel opens) ────────────────
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await notificationsApi.list({ limit: 20 })
      setNotifications(data.notifications)
      setUnreadCount(data.notifications.filter((n) => !n.read).length)
    } catch {
      // Keep existing state on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ─── Poll unread count every 30s ─────────────────────────────────────────
  useEffect(() => {
    fetchUnreadCount()
    pollRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchUnreadCount])

  // ─── Fetch full list whenever the panel opens ────────────────────────────
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // ─── Close on outside click ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest("[data-notification-panel]") &&
        !target.closest("[data-notification-trigger]")
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [isOpen])

  // ─── Lock body scroll on mobile when open ───────────────────────────────
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 640) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const displayedNotifications = useMemo(
    () => (activeTab === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [notifications, activeTab],
  )

  // ─── Actions ─────────────────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await notificationsApi.markRead(id)
    } catch {
      // Revert on failure
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)))
      setUnreadCount((prev) => prev + 1)
    }
  }

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await notificationsApi.markAllRead()
    } catch {
      // Re-fetch to get real state
      fetchNotifications()
    }
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const wasUnread = notifications.find((n) => n.id === id)?.read === false
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await notificationsApi.delete(id)
    } catch {
      // Re-fetch to restore real state
      fetchNotifications()
    }
  }

  const handleNotificationClick = (notification: ApiNotification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setIsOpen(false)
    }
  }

  // ─── Icon & badge helpers ─────────────────────────────────────────────────
  const getIcon = (type: string) => {
    const iconClass = "h-4 w-4 sm:h-5 sm:w-5"
    if (type.startsWith("TASK_ASSIGNED"))       return <CheckCircle className={`${iconClass} text-emerald-500`} />
    if (type.startsWith("TASK_APPROVED"))        return <CheckCircle className={`${iconClass} text-green-500`} />
    if (type.startsWith("TASK_CHANGES"))         return <AlertCircle className={`${iconClass} text-orange-500`} />
    if (type.startsWith("TASK_REVIEWED"))        return <FileText    className={`${iconClass} text-indigo-500`} />
    if (type.startsWith("TEAM_INVITE"))          return <MessageSquare className={`${iconClass} text-blue-500`} />
    if (type.startsWith("TEAM_JOIN"))            return <Award       className={`${iconClass} text-purple-500`} />
    if (type.startsWith("SUPERVISOR"))           return <Calendar    className={`${iconClass} text-amber-500`} />
    if (type.startsWith("SUBMISSION"))           return <FileText    className={`${iconClass} text-indigo-500`} />
    if (type === "SYSTEM")                       return <AlertCircle className={`${iconClass} text-red-500`} />
    return <Info className={`${iconClass} text-slate-500`} />
  }

  const getTypeBadge = (type: string) => {
    let label = "Info"
    let variant = "bg-slate-500/10 text-slate-700 dark:text-slate-400"

    if (type.startsWith("TASK"))       { label = "Task";       variant = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" }
    if (type.startsWith("TEAM_INVITE")){ label = "Invitation"; variant = "bg-blue-500/10 text-blue-700 dark:text-blue-400" }
    if (type.startsWith("TEAM_JOIN"))  { label = "Team";       variant = "bg-purple-500/10 text-purple-700 dark:text-purple-400" }
    if (type.startsWith("SUPERVISOR")) { label = "Supervisor"; variant = "bg-amber-500/10 text-amber-700 dark:text-amber-400" }
    if (type.startsWith("SUBMISSION")) { label = "Submission"; variant = "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" }
    if (type === "SYSTEM")             { label = "System";     variant = "bg-red-500/10 text-red-700 dark:text-red-400" }

    return <span className={`text-xs px-2 py-0.5 rounded-full ${variant} font-medium`}>{label}</span>
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          data-notification-trigger
          variant="ghost"
          size="icon"
          className="relative rounded-xl h-9 w-9 sm:h-10 sm:w-10"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-destructive flex items-center justify-center"
            >
              <span className="text-[10px] sm:text-xs font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </motion.span>
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-destructive animate-ping opacity-75" />
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/90 backdrop-blur-sm z-40 sm:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              data-notification-panel
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed sm:absolute right-0 left-0 sm:left-auto top-14 sm:top-full sm:mt-2 sm:w-96 z-50 bg-card sm:glass-card sm:rounded-2xl border shadow-2xl overflow-hidden mx-0 sm:mx-0 h-[calc(100dvh-3.5rem)] sm:h-auto sm:max-h-[500px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base sm:text-lg">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-8 px-2 sm:px-3">
                      <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Mark all read</span>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-lg">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="p-2 sm:p-3 border-b bg-muted/20">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")}>
                  <TabsList className="w-full h-9 sm:h-10">
                    <TabsTrigger value="all" className="flex-1 text-xs sm:text-sm">All</TabsTrigger>
                    <TabsTrigger value="unread" className="flex-1 text-xs sm:text-sm">
                      Unread ({unreadCount})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 sm:max-h-[320px] scroll-smooth-touch bg-background/50">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : displayedNotifications.length > 0 ? (
                  <div className="divide-y">
                    {displayedNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 sm:p-4 cursor-pointer transition-all hover:bg-muted/80 active:bg-muted group relative ${
                          !notification.read ? "bg-primary/10" : "bg-background/80"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="p-2 rounded-lg bg-muted shrink-0">{getIcon(notification.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs sm:text-sm ${!notification.read ? "font-semibold text-foreground" : "text-foreground/90"} line-clamp-2`}>
                                {notification.message}
                              </p>
                              {!notification.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              {getTypeBadge(notification.type)}
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            onClick={(e) => deleteNotification(notification.id, e)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 sm:p-12 text-center">
                    <Bell className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-2 sm:p-3 border-t bg-muted/30 safe-area-bottom">
                <Button
                  variant="ghost"
                  className="w-full justify-center gap-2 h-10 sm:h-9 text-sm"
                  onClick={() => {
                    router.push("/dashboard/notifications")
                    setIsOpen(false)
                  }}
                >
                  View all notifications
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
