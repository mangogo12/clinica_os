export default function LoadingDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-primary/80 rounded-2xl h-[120px]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card h-[96px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="bg-white rounded-2xl shadow-card h-[280px]" />
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card h-[140px]" />
          <div className="bg-white rounded-2xl shadow-card h-[120px]" />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-card h-[240px]" />
    </div>
  )
}
