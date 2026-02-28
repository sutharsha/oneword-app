import { createClient } from '@/lib/supabase/server'
import WordPost from '@/components/WordPost'
import PostWord from '@/components/PostWord'
import Header from '@/components/Header'
import FeedSkeleton from '@/components/FeedSkeleton'
import { Suspense } from 'react'
import Link from 'next/link'
import { startOfDay, subDays } from 'date-fns'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'OneWord — Say one word.',
  description: 'A social feed where you can only say one word. Answer the daily prompt with a single word and react to others.',
  openGraph: {
    title: 'OneWord — Say one word.',
    description: 'A social feed where you can only say one word.',
    type: 'website',
    siteName: 'OneWord',
  },
  twitter: {
    card: 'summary',
    title: 'OneWord — Say one word.',
    description: 'A social feed where you can only say one word.',
  },
}

type FilterType = 'today' | 'week' | 'all' | 'following'

const FILTERS: { key: FilterType; label: string; authOnly?: boolean }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'following', label: 'Following', authOnly: true },
  { key: 'all', label: 'All Time' },
]

async function Feed({ filter }: { filter: FilterType }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get today's prompt
  const { data: prompts } = await supabase.rpc('get_todays_prompt')
  const todaysPrompt = prompts?.[0] || null

  // Check if user already posted to today's prompt
  let hasPostedToday = false
  if (user && todaysPrompt) {
    const { data: existingPost } = await supabase
      .from('words')
      .select('id')
      .eq('user_id', user.id)
      .eq('prompt_id', todaysPrompt.id)
      .limit(1)
      .maybeSingle()
    hasPostedToday = !!existingPost
  }

  // For "following" filter, get list of followed user IDs
  let followingIds: string[] = []
  if (filter === 'following' && user) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    followingIds = follows?.map((f) => f.following_id) || []
  }

  // Build words query with filter
  let query = supabase
    .from('words')
    .select(`
      id,
      word,
      user_id,
      prompt_id,
      created_at,
      profiles (id, username, display_name, avatar_url, current_streak)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (filter === 'today') {
    query = query.gte('created_at', startOfDay(new Date()).toISOString())
  } else if (filter === 'week') {
    query = query.gte('created_at', startOfDay(subDays(new Date(), 7)).toISOString())
  } else if (filter === 'following') {
    if (followingIds.length === 0) {
      // No one followed — show empty state
      return (
        <>
          {user && (
            <PostWord
              userId={user.id}
              promptId={todaysPrompt?.id || null}
              promptQuestion={todaysPrompt?.question || null}
              hasPostedToday={hasPostedToday}
            />
          )}
          <div className="p-8 text-center text-zinc-500">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-lg font-semibold">No one followed yet.</p>
            <p className="text-sm mt-1">Follow people to see their words here.</p>
          </div>
        </>
      )
    }
    query = query.in('user_id', followingIds)
  }

  const { data: words } = await query

  // Get reactions for these words
  const wordIds = words?.map((w) => w.id) || []
  const { data: reactions } = wordIds.length
    ? await supabase
        .from('reactions')
        .select('word_id, emoji, user_id')
        .in('word_id', wordIds)
    : { data: [] }

  // Build reaction maps
  const reactionMap: Record<string, Record<string, number>> = {}
  const userReactionMap: Record<string, string | null> = {}

  reactions?.forEach((r) => {
    if (!reactionMap[r.word_id]) reactionMap[r.word_id] = {}
    reactionMap[r.word_id][r.emoji] = (reactionMap[r.word_id][r.emoji] || 0) + 1
    if (user && r.user_id === user.id) {
      userReactionMap[r.word_id] = r.emoji
    }
  })

  return (
    <>
      {/* Post box */}
      {user && (
        <PostWord
          userId={user.id}
          promptId={todaysPrompt?.id || null}
          promptQuestion={todaysPrompt?.question || null}
          hasPostedToday={hasPostedToday}
        />
      )}

      {/* Prompt banner for logged-out users */}
      {!user && todaysPrompt && (
        <div className="border-b border-zinc-800 p-4 text-center">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Today&apos;s prompt</span>
          <p className="text-lg font-semibold text-purple-400 mt-1">{todaysPrompt.question}</p>
          <p className="text-sm text-zinc-500 mt-2">Sign in to answer</p>
        </div>
      )}

      {/* Feed */}
      <div>
        {words && words.length > 0 ? (
          words.map((w) => {
            const profile = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles
            return (
              <WordPost
                key={w.id}
                id={w.id}
                word={w.word}
                username={profile?.username || 'anonymous'}
                displayName={profile?.display_name || null}
                avatarUrl={profile?.avatar_url || null}
                createdAt={w.created_at}
                reactionCounts={reactionMap[w.id] || {}}
                userReaction={userReactionMap[w.id] || null}
                currentUserId={user?.id || null}
                wordUserId={w.user_id}
                promptId={w.prompt_id}
                streakCount={profile?.current_streak || 0}
              />
            )
          })
        ) : (
          <div className="p-8 text-center text-zinc-500">
            <p className="text-4xl mb-3">🤫</p>
            <p className="text-lg font-semibold">Silence.</p>
            <p className="text-sm mt-1">Be the first to say something.</p>
          </div>
        )}
      </div>
    </>
  )
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const filter = (['today', 'week', 'all', 'following'].includes(params.filter || '') ? params.filter : 'today') as FilterType
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get unread notification count and admin status
  let unreadCount = 0
  let isAdmin = false
  if (user) {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    unreadCount = count || 0

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin || false
  }

  return (
    <main className="max-w-lg mx-auto min-h-screen border-x border-zinc-800">
      <Header
        user={user ? { id: user.id, email: user.email } : null}
        unreadNotifications={unreadCount}
        isAdmin={isAdmin}
      />

      {/* Filter Tabs */}
      <div className="flex border-b border-zinc-800">
        {FILTERS.map(({ key, label, authOnly }) => {
          if (authOnly && !user) return null
          return (
            <Link
              key={key}
              href={key === 'today' ? '/' : `/?filter=${key}`}
              className={`flex-1 text-center py-3 text-sm font-medium transition-colors ${
                filter === key
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      <Suspense fallback={<FeedSkeleton />}>
        <Feed filter={filter} />
      </Suspense>
    </main>
  )
}
