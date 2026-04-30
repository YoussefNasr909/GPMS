"use client"

import { cn } from "@/lib/utils"

import { motion } from "framer-motion"
import { Trophy, Medal, Award } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/types"

interface LeaderboardCardProps {
  users: User[]
  currentUserId?: string
  compact?: boolean
}

export function LeaderboardCard({ users, currentUserId, compact = false }: LeaderboardCardProps) {
  const sortedUsers = [...users].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, compact ? 3 : 5)

  const rankIcons = [
    { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { icon: Medal, color: "text-gray-400", bg: "bg-gray-400/10" },
    { icon: Medal, color: "text-orange-600", bg: "bg-orange-600/10" },
  ]

  return (
    <Card className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">Top Performers</h3>
        <Badge variant="outline" className="glass-card">
          <Trophy className="h-3 w-3 mr-1" />
          {sortedUsers.length} ranked
        </Badge>
      </div>

      <div className="space-y-3">
        {sortedUsers.map((user, index) => {
          const RankIcon = index < 3 ? rankIcons[index].icon : Award
          const rankColor = index < 3 ? rankIcons[index].color : "text-muted-foreground"
          const rankBg = index < 3 ? rankIcons[index].bg : "bg-muted"

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className={cn(
                "glass-card border rounded-xl p-4 transition-all cursor-pointer",
                user.id === currentUserId ? "border-primary/50 bg-primary/5" : "border-border/50",
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-2 rounded-lg", rankBg)}>
                  <RankIcon className={cn("h-5 w-5", rankColor)} />
                </div>

                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">{user.name}</h4>
                    {user.id === currentUserId && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Level {user.level || 1}</span>
                    <span>•</span>
                    <span>{user.streak || 0} day streak</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold gradient-text">{user.xp || 0}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
