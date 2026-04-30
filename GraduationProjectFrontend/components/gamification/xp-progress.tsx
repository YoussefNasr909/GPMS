"use client"

import { motion } from "framer-motion"
import { Trophy, Flame } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface XPProgressProps {
  currentXP: number
  level: number
  streak?: number
  compact?: boolean
}

export function XPProgress({ currentXP, level, streak, compact = false }: XPProgressProps) {
  const xpForNextLevel = 200
  const xpProgress = currentXP % xpForNextLevel
  const xpNeeded = xpForNextLevel - xpProgress
  const progressPercent = (xpProgress / xpForNextLevel) * 100

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="glass-card p-4 rounded-xl border border-primary/20"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Trophy className="h-5 w-5 text-primary" />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-lg font-bold gradient-text">{currentXP}</span>
              <span className="text-xs text-muted-foreground">XP</span>
              <span className="text-xs text-muted-foreground mx-1">•</span>
              <Badge variant="outline" className="text-xs">
                Level {level}
              </Badge>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
            <div className="text-xs text-muted-foreground mt-1">
              {xpNeeded} XP to level {level + 1}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <Card className="glass-card p-6 rounded-2xl border border-primary/20">
      <div className="text-center">
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 glow mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <Trophy className="h-10 w-10 text-primary" />
        </motion.div>

        <div className="mb-2">
          <span className="text-4xl font-bold gradient-text">{currentXP}</span>
          <span className="text-muted-foreground ml-2">XP</span>
        </div>

        <Badge variant="outline" className="mb-4">
          Level {level}
        </Badge>

        <div className="text-sm text-muted-foreground mb-3">{xpNeeded} XP to next level</div>

        <Progress value={progressPercent} className="mb-6" />

        {streak && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex items-center justify-center gap-2 p-3 rounded-xl glass-card border border-orange-500/20"
          >
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
              <div className="font-bold">{streak} Days</div>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  )
}
