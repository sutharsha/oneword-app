export default function FeedSkeleton() {
  return (
    <div>
      {/* Post box skeleton */}
      <div className="border-b border-zinc-800 p-4">
        <div className="mb-3 flex flex-col items-center gap-2">
          <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
          <div className="h-5 w-48 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex-1 h-12 bg-zinc-900 border border-zinc-800 rounded-full animate-pulse" />
          <div className="h-12 w-20 bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Feed skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b border-zinc-800 px-4 py-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3.5 w-20 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-16 bg-zinc-900 rounded animate-pulse" />
                <div className="h-3 w-12 bg-zinc-900 rounded animate-pulse" />
              </div>
              <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse mb-3" />
              <div className="h-6 w-8 bg-zinc-900 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
