import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("p-3 sm:p-4 md:p-6 glass-card", className)}>
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        {trend && (
          <span
            className={cn("text-xs sm:text-sm font-medium", trend.isPositive ? "text-emerald-500" : "text-destructive")}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold truncate">{value}</h3>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5 sm:mt-1">{title}</p>
        {description && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">{description}</p>
        )}
      </div>
    </Card>
  )
}
