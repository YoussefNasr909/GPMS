"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Lock, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface AchievementBadgeProps {
  name: string
  description: string
  icon: LucideIcon
  unlocked: boolean
  points: number
  rarity: "common" | "rare" | "epic" | "legendary"
  compact?: boolean
}

const rarityColors = {
  common: "border-gray-400",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-yellow-500",
}

const rarityBgColors = {
  common: "bg-gray-400/10",
  rare: "bg-blue-500/10",
  epic: "bg-purple-500/10",
  legendary: "bg-yellow-500/10",
}

export function AchievementBadge({
  name,
  description,
  icon: Icon,
  unlocked,
  points,
  rarity,
  compact = false,
}: AchievementBadgeProps) {
  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        className={cn(
          "glass-card p-3 rounded-xl border transition-all cursor-pointer",
          unlocked ? rarityColors[rarity] : "border-border/50 opacity-60",
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", unlocked ? rarityBgColors[rarity] : "bg-muted")}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h4 className="font-semibold text-sm truncate">{name}</h4>
              {unlocked ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize">
                {rarity}
              </Badge>
              <span className="text-xs text-muted-foreground">+{points} XP</span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className={cn(
        "glass-card p-6 rounded-2xl relative overflow-hidden transition-all cursor-pointer border",
        unlocked ? rarityColors[rarity] : "border-border/50 opacity-60",
      )}
    >
      {unlocked && (
        <motion.div
          className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl", rarityBgColors[rarity])}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      <div className="flex items-start gap-4 relative z-10">
        <motion.div
          className={cn("p-3 rounded-xl", unlocked ? rarityBgColors[rarity] : "bg-muted")}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          <Icon className="h-8 w-8" />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{name}</h3>
            {unlocked ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-3">{description}</p>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {rarity}
            </Badge>
            <div className="flex items-center gap-1 text-sm font-medium text-primary">
              <Star className="h-4 w-4 fill-primary" />
              <span>+{points} XP</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
