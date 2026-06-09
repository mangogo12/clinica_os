export default function LoadingClientes() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-9 w-32 bg-primary/30 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl shadow-card h-16" />
      <div className="bg-white rounded-2xl shadow-card h-[480px]" />
    </div>
  )
}
