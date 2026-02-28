import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import WordPost from '@/components/WordPost'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: prompt } = await supabase
    .from('prompts')
    .select('question')
    .eq('id', id)
    .maybeSingle()

  return {
    title: prompt?.question || 'Prompt',
  }
}

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the prompt
  const { data: prompt } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!prompt) notFound()

  // Fetch words for this prompt
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
    .eq('prompt_id', id)
    .order('created_at', { ascending: false })

  // Get reactions
  const wordIds = words?.map((w) => w.id) || []
  const { data: reactions } = wordIds.length
    ? await supabase
        .from('reactions')
        .select('word_id, emoji, user_id')
        .in('word_id', wordIds)
    : { data: [] }

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
    <main className="max-w-lg mx-auto min-h-screen border-x border-zinc-800">
      <Header user={user ? { id: user.id, email: user.email } : null} />

      {/* Prompt header */}
      <div className="p-4 border-b border-zinc-800">
        <Link
          href="/prompts"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; All prompts
        </Link>
        <p className="text-lg font-semibold text-purple-400 mt-2">{prompt.question}</p>
        <p className="text-xs text-zinc-500 mt-1">
          {format(new Date(prompt.active_date + 'T00:00:00'), 'MMMM d, yyyy')}
          {' · '}
          {words?.length || 0} {(words?.length || 0) === 1 ? 'answer' : 'answers'}
        </p>
      </div>

      {/* Answers */}
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
              />
            )
          })
        ) : (
          <div className="p-8 text-center text-zinc-500">
            <p className="text-4xl mb-3">🤫</p>
            <p className="text-lg font-semibold">No answers yet.</p>
            <p className="text-sm mt-1">Nobody answered this prompt.</p>
          </div>
        )}
      </div>
    </main>
  )
}
