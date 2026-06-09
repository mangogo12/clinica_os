export default function LoadingFinanceiro() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="flex gap-3">
          <div className="h-9 w-36 bg-gray-200 rounded-lg" />
          <div className="h-9 w-32 bg-primary/30 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card h-[96px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        <div className="bg-white rounded-2xl shadow-card h-[280px]" />
        <div className="bg-white rounded-2xl shadow-card h-[280px]" />
      </div>
      <div className="bg-white rounded-2xl shadow-card h-[300px]" />
    </div>
  )
}
