import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="max-w-lg mx-auto min-h-screen border-x border-zinc-800 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-4xl mb-4">🔇</p>
        <h2 className="text-xl font-bold mb-2">Page not found</h2>
        <p className="text-zinc-400 text-sm mb-6">
          This page doesn&apos;t exist. Maybe it said too many words.
        </p>
        <Link
          href="/"
          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-full transition-colors inline-block"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
