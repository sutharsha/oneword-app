import FeedSkeleton from '@/components/FeedSkeleton'

export default function Loading() {
  return (
    <main className="max-w-lg mx-auto min-h-screen border-x border-zinc-800">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-purple-400">One</span>Word
        </h1>
        <div className="h-8 w-16 bg-zinc-800 rounded-full animate-pulse" />
      </header>
      <FeedSkeleton />
    </main>
  )
}
