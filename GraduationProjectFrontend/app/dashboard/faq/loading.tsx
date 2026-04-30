export default function FAQLoading() {
  return (
    <div className="space-y-6">
      <div className="h-48 rounded-2xl bg-muted animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <div className="lg:col-span-3 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
