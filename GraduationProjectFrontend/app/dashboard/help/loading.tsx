export default function HelpLoading() {
  return (
    <div className="space-y-6">
      <div className="h-48 rounded-2xl bg-muted animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  )
}
