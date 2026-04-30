export default function Loading() {
  return (
    <div className="container max-w-7xl py-6">
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-muted rounded-lg w-1/3" />
        <div className="h-32 bg-muted rounded-lg" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
        </div>
      </div>
    </div>
  )
}
