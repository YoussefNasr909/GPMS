import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <Card key={item} className="p-4">
            <Skeleton className="h-20 w-full" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((column) => (
          <Card key={column} className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-8" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((task) => (
                <Skeleton key={task} className="h-28 w-full" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
