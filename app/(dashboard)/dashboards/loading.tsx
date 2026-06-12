export default function LoadingDashboards() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="bg-white rounded-lg h-6 w-40" />
          <div className="bg-white rounded-lg h-4 w-72" />
        </div>
        <div className="bg-white rounded-xl shadow-card h-9 w-64" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card h-[96px]" />
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-card h-[260px]" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card h-[240px]" />
        <div className="bg-white rounded-2xl shadow-card h-[240px]" />
      </div>
    </div>
  )
}
