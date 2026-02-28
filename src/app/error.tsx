'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <main className="max-w-lg mx-auto min-h-screen border-x border-zinc-800 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-4xl mb-4">💥</p>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-zinc-400 text-sm mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
