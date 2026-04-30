import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
        <Card className="glass-card p-6">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    </div>
  )
}
