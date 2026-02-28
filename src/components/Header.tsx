import Link from 'next/link'
import AuthButton from '@/components/AuthButton'

interface HeaderProps {
  user: { id: string; email?: string } | null
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-purple-400">One</span>Word
        </Link>
        <Link
          href="/prompts"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Archive
        </Link>
      </div>
      <AuthButton user={user} />
    </header>
  )
}
