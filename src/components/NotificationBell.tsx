'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'

interface NotificationItem {
  id: string
  type: 'reaction' | 'follow'
  emoji: string | null
  read: boolean
  created_at: string
  word: { word: string } | null
  actor: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface NotificationBellProps {
  userId: string
  initialCount: number
}

export default function NotificationBell({ userId, initialCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const fetchNotifications = async () => {
    if (loaded) return
    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('notifications')
      .select(`
        id, type, emoji, read, created_at, word_id,
        word:words(word),
        actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(
        data.map((n) => ({
          ...n,
          word: Array.isArray(n.word) ? n.word[0] : n.word,
          actor: Array.isArray(n.actor) ? n.actor[0] : n.actor,
        })) as NotificationItem[]
      )
      setLoaded(true)
    }
    setLoading(false)
  }

  const handleOpen = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      await fetchNotifications()
      // Mark all as read
      if (unreadCount > 0) {
        const supabase = createClient()
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('read', false)
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      }
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative text-zinc-400 hover:text-white transition-colors p-1"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h3 className="font-semibold text-sm">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && !loaded ? (
              <div className="p-4 text-center text-zinc-500 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.type === 'follow' ? `/profile/${n.actor.username}` : '/'}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors ${
                    !n.read ? 'bg-purple-500/5' : ''
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {n.actor.avatar_url ? (
                    <Image
                      src={n.actor.avatar_url}
                      alt={n.actor.username}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {(n.actor.display_name || n.actor.username || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{n.actor.display_name || n.actor.username}</span>{' '}
                      {n.type === 'follow'
                        ? 'followed you'
                        : <>reacted {n.emoji} to <span className="font-semibold">&quot;{n.word?.word}&quot;</span></>}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
