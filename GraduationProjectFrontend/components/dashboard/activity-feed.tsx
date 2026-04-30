"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { activities } from "@/data/activities"
import { getUserById } from "@/lib/stores/auth-store"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
import {
  CheckSquare,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react"

const getActivityIcon = (type: string) => {
  switch (type) {
    case "task":
      return CheckSquare
    case "submission":
      return FileText
    case "comment":
      return MessageSquare
    case "alert":
      return AlertCircle
    default:
      return CheckCircle2
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case "task":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20"
    case "submission":
      return "text-green-500 bg-green-500/10 border-green-500/20"
    case "comment":
      return "text-purple-500 bg-purple-500/10 border-purple-500/20"
    case "alert":
      return "text-orange-500 bg-orange-500/10 border-orange-500/20"
    default:
      return "text-primary bg-primary/10 border-primary/20"
  }
}

export function ActivityFeed() {
  return (
    <Card className="glass-card p-6 rounded-2xl glow overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <TrendingUp className="h-5 w-5 text-primary" />
          </motion.div>
          <h3 className="font-semibold text-lg">Recent Activity</h3>
        </div>
        <Badge variant="secondary" className="glass-card">
          Live
        </Badge>
      </div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const user = getUserById(activity.userId)
            const Icon = getActivityIcon(activity.type)
            const colorClass = getActivityColor(activity.type)

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="glass-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex gap-3">
                  <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="relative">
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">{user?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-background ${colorClass.split(" ")[1]}`}
                    >
                      <Icon className={`h-3 w-3 ${colorClass.split(" ")[0]}`} />
                    </div>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold text-foreground">{user?.name}</span>{" "}
                      <span className="text-muted-foreground">{activity.description}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                      <Badge variant="outline" className="text-xs h-5 glass-card">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
