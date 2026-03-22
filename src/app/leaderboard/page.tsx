import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Daily Leaderboard',
}

const MEDALS = ['🥇', '🥈', '🥉'] as const

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let unreadCount = 0
  if (user) {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    unreadCount = count || 0
  }

  const { data: prompts } = await supabase.rpc('get_todays_prompt')
  const todaysPrompt = prompts?.[0] || null

  const { data: words } = todaysPrompt
    ? await supabase
        .from('words')
        .select(`
          id,
          word,
          user_id,
          created_at,
          profiles (id, username, display_name, avatar_url)
        `)
        .eq('prompt_id', todaysPrompt.id)
        .limit(100)
    : { data: [] }

  const wordIds = words?.map((word) => word.id) || []
  const { data: reactions } = wordIds.length
    ? await supabase
        .from('reactions')
        .select('word_id')
        .in('word_id', wordIds)
    : { data: [] }

  const reactionCountMap: Record<string, number> = {}
  reactions?.forEach((reaction) => {
    reactionCountMap[reaction.word_id] = (reactionCountMap[reaction.word_id] || 0) + 1
  })

  const leaderboard = [...(words || [])]
    .sort((a, b) => {
      const reactionDiff = (reactionCountMap[b.id] || 0) - (reactionCountMap[a.id] || 0)
      if (reactionDiff !== 0) return reactionDiff
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    .slice(0, 20)

  return (
    <main className="max-w-lg mx-auto min-h-screen bg-black border-x border-zinc-800">
      <Header user={user ? { id: user.id, email: user.email } : null} unreadNotifications={unreadCount} />

      <div className="border-b border-zinc-800 px-4 py-5">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Daily Leaderboard</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Most reacted words today</h1>
        {todaysPrompt ? (
          <div className="mt-3 rounded-2xl border border-purple-500/30 bg-zinc-950 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-zinc-500">Today&apos;s prompt</p>
            <p className="mt-1 text-lg font-semibold text-purple-400">{todaysPrompt.question}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No active prompt today.</p>
        )}
      </div>

      <div>
        {leaderboard.length > 0 ? (
          leaderboard.map((entry, index) => {
            const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles
            const name = profile?.display_name || profile?.username || 'anonymous'
            const username = profile?.username || 'anonymous'
            const avatarInitial = name[0]?.toUpperCase() || '?'
            const reactionsTotal = reactionCountMap[entry.id] || 0

            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4 transition-colors hover:bg-zinc-950"
              >
                <div className="flex w-10 shrink-0 items-center justify-center text-lg font-bold text-white">
                  {index < 3 ? MEDALS[index] : `#${index + 1}`}
                </div>

                <Link href={`/profile/${username}`} className="shrink-0">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={username}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                      {avatarInitial}
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xl font-bold text-purple-400">{entry.word}</p>
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-300">
                      {reactionsTotal} {reactionsTotal === 1 ? 'reaction' : 'reactions'}
                    </span>
                  </div>
                  <Link
                    href={`/profile/${username}`}
                    className="mt-1 block truncate text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    by {name === username ? `@${username}` : `${name} · @${username}`}
                  </Link>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-8 text-center text-zinc-500">
            <p className="mb-3 text-4xl">🏁</p>
            <p className="text-lg font-semibold text-white">No words on the board yet.</p>
            <p className="mt-1 text-sm">Check back after people answer today&apos;s prompt.</p>
          </div>
        )}
      </div>
    </main>
  )
}
