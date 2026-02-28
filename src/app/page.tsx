import { createClient } from '@/lib/supabase/server'
import WordPost from '@/components/WordPost'
import PostWord from '@/components/PostWord'
import AuthButton from '@/components/AuthButton'
import FeedSkeleton from '@/components/FeedSkeleton'
import { Suspense } from 'react'
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

async function Feed() {
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

  // Get words feed
  const { data: words } = await supabase
    .from('words')
    .select(`
      id,
      word,
      user_id,
      prompt_id,
      created_at,
      profiles (id, username, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

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
                createdAt={w.created_at}
                reactionCounts={reactionMap[w.id] || {}}
                userReaction={userReactionMap[w.id] || null}
                currentUserId={user?.id || null}
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

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="max-w-lg mx-auto min-h-screen border-x border-zinc-800">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-purple-400">One</span>Word
        </h1>
        <AuthButton user={user ? { id: user.id, email: user.email } : null} />
      </header>

      <Suspense fallback={<FeedSkeleton />}>
        <Feed />
      </Suspense>
    </main>
  )
}
