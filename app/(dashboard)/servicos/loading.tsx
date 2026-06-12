export default function LoadingServicos() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="h-9 w-40 bg-primary/30 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card h-[68px]" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-card h-[180px]" />
        ))}
      </div>
    </div>
  )
}
