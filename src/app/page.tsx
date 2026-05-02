import { createClient } from '@/lib/supabase/server'
import WordPost from '@/components/WordPost'
import PostWord from '@/components/PostWord'
import AnonPostWord from '@/components/AnonPostWord'
import Header from '@/components/Header'
import FeedSkeleton from '@/components/FeedSkeleton'
import DailyRecap from '@/components/DailyRecap'
import { Suspense } from 'react'
import Link from 'next/link'
import { startOfDay, subDays } from 'date-fns'
import type { Metadata } from 'next'
import type { User } from '@supabase/supabase-js'
import PromptTimer from '@/components/PromptTimer'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: prompts } = await supabase.rpc('get_todays_prompt')
  const todaysPrompt = prompts?.[0] || null

  const ogImage = todaysPrompt
    ? `/api/og/${todaysPrompt.id}`
    : undefined

  return {
    title: 'OneWord — Say one word.',
    description: 'A social feed where you can only say one word. Answer the daily prompt with a single word and react to others.',
    openGraph: {
      title: 'OneWord — Say one word.',
      description: 'A social feed where you can only say one word.',
      type: 'website',
      siteName: 'OneWord',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'OneWord — Say one word.',
      description: 'A social feed where you can only say one word.',
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

type FilterType = 'today' | 'week' | 'all' | 'following' | 'popular'
type TodayPrompt = { id: string; question: string; active_date: string } | null

const FILTERS: { key: FilterType; label: string; authOnly?: boolean }[] = [
  { key: 'today', label: 'Today' },
  { key: 'popular', label: 'Popular' },
  { key: 'week', label: 'This Week' },
  { key: 'following', label: 'Following', authOnly: true },
  { key: 'all', label: 'All Time' },
]

async function Feed({
  filter,
  user,
  todaysPrompt,
}: {
  filter: FilterType
  user: User | null
  todaysPrompt: TodayPrompt
}) {
  const supabase = await createClient()

  const hasPostedTodayPromise = user && todaysPrompt
    ? supabase
        .from('words')
        .select('id')
        .eq('user_id', user.id)
        .eq('prompt_id', todaysPrompt.id)
        .limit(1)
        .maybeSingle()
    : Promise.resolve({ data: null })

  const followsPromise = filter === 'following' && user
    ? supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
    : Promise.resolve({ data: [] })

  const [{ data: existingPost }, { data: follows }] = await Promise.all([
    hasPostedTodayPromise,
    followsPromise,
  ])

  const hasPostedToday = !!existingPost
  const followingIds = follows?.map((f) => f.following_id) || []

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

  if (filter === 'today' || filter === 'popular') {
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

  // Sort by total reactions for the "popular" tab
  let sortedWords = words || []
  if (filter === 'popular' && sortedWords.length > 0) {
    sortedWords = [...sortedWords].sort((a, b) => {
      const aTotal = Object.values(reactionMap[a.id] || {}).reduce((sum, n) => sum + n, 0)
      const bTotal = Object.values(reactionMap[b.id] || {}).reduce((sum, n) => sum + n, 0)
      return bTotal - aTotal
    })
  }

  // Find today's "Word of the Day" — the word with the most reactions today
  let crownWordId: string | null = null
  if (filter === 'today' || filter === 'popular') {
    let maxReactions = 0
    sortedWords.forEach((w) => {
      const total = Object.values(reactionMap[w.id] || {}).reduce((sum, n) => sum + n, 0)
      if (total > maxReactions) {
        maxReactions = total
        crownWordId = w.id
      }
    })
    // Only crown if at least 1 reaction
    if (maxReactions === 0) crownWordId = null
  }

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

      {/* Anonymous post form for logged-out users */}
      {!user && todaysPrompt && (
        <AnonPostWord
          promptId={todaysPrompt.id}
          promptQuestion={todaysPrompt.question}
        />
      )}

      {/* FOMO timer — only on Today tab where it's relevant */}
      {filter === 'today' && todaysPrompt && (
        <div className="px-4 pb-2 flex justify-end">
          <PromptTimer />
        </div>
      )}

      {/* Feed */}
      <div>
        {sortedWords.length > 0 ? (
          sortedWords.map((w) => {
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
                isCrowned={w.id === crownWordId}
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
  const filter = (['today', 'week', 'all', 'following', 'popular'].includes(params.filter || '') ? params.filter : 'today') as FilterType
  const supabase = await createClient()

  const [{ data: { user } }, { data: prompts }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc('get_todays_prompt'),
  ])
  const todaysPrompt = prompts?.[0] || null

  const [{ count: unreadCount }, { data: profile }] = user
    ? await Promise.all([
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false),
        supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single(),
      ])
    : [{ count: 0 }, { data: null }]

  const isAdmin = profile?.is_admin || false

  return (
    <main className="max-w-lg mx-auto min-h-screen border-x border-zinc-800">
      <Header
        user={user ? { id: user.id, email: user.email } : null}
        unreadNotifications={unreadCount || 0}
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

      {filter === 'today' && (
        <Suspense fallback={null}>
          <DailyRecap />
        </Suspense>
      )}

      <Suspense fallback={<FeedSkeleton />}>
        <Feed filter={filter} user={user} todaysPrompt={todaysPrompt} />
      </Suspense>

      <Footer />
    </main>
  )
}
