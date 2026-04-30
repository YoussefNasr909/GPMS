"use client"
import { motion } from "framer-motion"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  TrendingUp,
  Lock,
  Gift,
  ChevronRight,
  Clock,
  Coins,
} from "lucide-react"
import { users } from "@/data/users"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function GamificationTab() {
  const { currentUser } = useAuthStore()

  const leaderboardData = users
    .filter((u) => u.role === "leader" || u.role === "member")
    .map((user) => ({
      ...user,
      xp: user.xp || Math.floor(Math.random() * 5000) + 500,
      level: user.level || Math.floor(Math.random() * 20) + 1,
      achievements: Math.floor(Math.random() * 8) + 1,
      streak: user.streak || Math.floor(Math.random() * 30) + 1,
      coins: user.gold || Math.floor(Math.random() * 500) + 100,
    }))
    .sort((a, b) => b.xp - a.xp)

  const currentUserRank = leaderboardData.findIndex((u) => u.id === currentUser?.id) + 1
  const topStudents = leaderboardData.slice(0, 5)

  // Daily quests for dashboard preview
  const dailyQuests = [
    {
      id: "dq1",
      title: "Complete 3 Tasks",
      progress: 2,
      target: 3,
      xp: 50,
      coins: 15,
      icon: Target,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "dq2",
      title: "Push Code",
      progress: 1,
      target: 1,
      xp: 30,
      coins: 10,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      completed: true,
    },
    {
      id: "dq3",
      title: "Help Teammate",
      progress: 0,
      target: 2,
      xp: 40,
      coins: 12,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  const achievements = [
    {
      id: "first-submission",
      name: "First Steps",
      description: "Submit your first deliverable",
      icon: Star,
      unlocked: true,
      points: 10,
      rarity: "common",
    },
    {
      id: "team-player",
      name: "Team Player",
      description: "Complete 10 team tasks",
      icon: Target,
      unlocked: true,
      points: 25,
      rarity: "common",
    },
    {
      id: "code-warrior",
      name: "Code Warrior",
      description: "Write 1000+ lines of code",
      icon: Zap,
      unlocked: false,
      points: 50,
      rarity: "rare",
      progress: 65,
    },
    {
      id: "perfect-score",
      name: "Perfect Score",
      description: "Get 100% on a deliverable",
      icon: Trophy,
      unlocked: false,
      points: 100,
      rarity: "epic",
      progress: 0,
    },
    {
      id: "streak-master",
      name: "Streak Master",
      description: "Maintain a 30-day streak",
      icon: Flame,
      unlocked: false,
      points: 200,
      rarity: "legendary",
      progress: ((currentUser?.streak || 0) / 30) * 100,
    },
  ]

  const rarityColors = {
    common: { text: "text-gray-500", border: "border-gray-500/20", bg: "bg-gray-500/5" },
    rare: { text: "text-blue-500", border: "border-blue-500/20", bg: "bg-blue-500/5" },
    epic: { text: "text-purple-500", border: "border-purple-500/20", bg: "bg-purple-500/5" },
    legendary: { text: "text-amber-500", border: "border-amber-500/20", bg: "bg-amber-500/5" },
  }

  const stats = [
    {
      label: "Total XP",
      value: currentUser?.xp || 0,
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Level",
      value: currentUser?.level || 1,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Rank",
      value: `#${currentUserRank}`,
      icon: Trophy,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Streak",
      value: `${currentUser?.streak || 0}d`,
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  const xpForNextLevel = 200
  const xpProgress = (currentUser?.xp || 0) % xpForNextLevel
  const xpPercentage = (xpProgress / xpForNextLevel) * 100

  return (
    <div className="space-y-6">
      {/* XP Progress Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 relative overflow-hidden border-2 border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Trophy className="h-8 w-8 text-primary" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold">Your Progress</h3>
                  <p className="text-sm text-muted-foreground">Keep going to level up!</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                  <Coins className="h-3 w-3 mr-1" />
                  {currentUser?.gold || 0}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="p-3 rounded-xl bg-background/50 border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn("p-1.5 rounded-lg", stat.bgColor)}>
                        <Icon className={cn("h-4 w-4", stat.color)} />
                      </div>
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <div className="text-xl font-bold">{stat.value}</div>
                  </motion.div>
                )
              })}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Level {currentUser?.level || 1}</span>
                <span className="font-medium">
                  {xpProgress} / {xpForNextLevel} XP
                </span>
              </div>
              <Progress value={xpPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {xpForNextLevel - xpProgress} XP to reach Level {(currentUser?.level || 1) + 1}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Daily Quests Preview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Daily Quests</h3>
          </div>
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            4h 32m left
          </Badge>
        </div>

        <div className="grid gap-3">
          {dailyQuests.map((quest, index) => {
            const Icon = quest.icon
            const isComplete = quest.progress >= quest.target
            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card
                  className={cn(
                    "p-4 border transition-all",
                    isComplete ? "bg-green-500/5 border-green-500/30" : "border-border/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", quest.bgColor)}>
                      <Icon className={cn("h-5 w-5", quest.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{quest.title}</h4>
                        {isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={(quest.progress / quest.target) * 100} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {quest.progress}/{quest.target}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1 text-primary" />
                        {quest.xp}
                      </Badge>
                      {isComplete && (
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 h-7">
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
      </motion.div>

      {/* Achievements Preview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Achievements</h3>
          </div>
          <Badge variant="outline">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.slice(0, 4).map((achievement, index) => {
            const Icon = achievement.icon
            const colors = rarityColors[achievement.rarity as keyof typeof rarityColors]
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.03 }}
              >
                <Card
                  className={cn(
                    "p-4 relative overflow-hidden transition-all cursor-pointer border",
                    achievement.unlocked ? colors.border : "border-border/50 opacity-70",
                  )}
                >
                  {!achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg border", colors.border, colors.bg)}>
                      <Icon className={cn("h-5 w-5", colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{achievement.name}</h4>
                        {achievement.unlocked && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{achievement.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs capitalize", colors.text)}>
                          {achievement.rarity}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          +{achievement.points} XP
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {!achievement.unlocked && achievement.progress !== undefined && achievement.progress > 0 && (
                    <div className="mt-3">
                      <Progress value={achievement.progress} className="h-1.5" />
                    </div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Leaderboard Preview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold">Leaderboard</h3>
          </div>
          <Badge variant="outline">Top 5</Badge>
        </div>

        <Card className="p-4">
          <div className="space-y-2">
            {topStudents.map((student, index) => {
              const isCurrentUser = student.id === currentUser?.id
              const RankIcon = index === 0 ? Crown : index === 1 ? Medal : index === 2 ? Award : null

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                    isCurrentUser ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      index < 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {RankIcon ? (
                      <RankIcon
                        className={cn(
                          "h-4 w-4",
                          index === 0 ? "text-amber-500" : index === 1 ? "text-gray-400" : "text-orange-600",
                        )}
                      />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <Avatar className="h-8 w-8">
                    <AvatarImage src={student.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-sm truncate", isCurrentUser && "text-primary")}>
                      {student.name}
                      {isCurrentUser && " (You)"}
                    </p>
                    <p className="text-xs text-muted-foreground">Level {student.level}</p>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm">{student.xp.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">XP</div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {currentUserRank > 5 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Your rank: <span className="font-semibold text-foreground">#{currentUserRank}</span>
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* View Full Gamification Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Link href="/dashboard/gamification">
          <Button className="w-full" size="lg">
            <Gift className="h-5 w-5 mr-2" />
            View Full Gamification Hub
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
