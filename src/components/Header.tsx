import Link from 'next/link'
import AuthButton from '@/components/AuthButton'
import NotificationBell from '@/components/NotificationBell'

interface HeaderProps {
  user: { id: string; email?: string } | null
  unreadNotifications?: number
  isAdmin?: boolean
}

export default function Header({ user, unreadNotifications = 0, isAdmin = false }: HeaderProps) {
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
        {isAdmin && (
          <Link
            href="/admin"
            className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            Admin
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <NotificationBell userId={user.id} initialCount={unreadNotifications} />
        )}
        <AuthButton user={user} />
      </div>
    </header>
  )
}
