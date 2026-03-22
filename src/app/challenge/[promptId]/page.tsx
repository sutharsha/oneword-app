import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import ChallengeResponse from '@/components/ChallengeResponse'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type ChallengePageProps = {
  params: Promise<{ promptId: string }>
  searchParams: Promise<{ from?: string }>
}

async function getChallengeData(promptId: string, from?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const promptQuery = supabase
    .from('prompts')
    .select('id, question')
    .eq('id', promptId)
    .maybeSingle()

  const userWordQuery = user
    ? supabase
        .from('words')
        .select('word')
        .eq('user_id', user.id)
        .eq('prompt_id', promptId)
        .maybeSingle()
    : Promise.resolve({ data: null })

  const unreadCountQuery = user
    ? supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
    : Promise.resolve({ count: 0 })

  const sharerProfileQuery = from
    ? supabase
        .from('profiles')
        .select('id, username')
        .eq('username', from)
        .maybeSingle()
    : Promise.resolve({ data: null })

  const [
    { data: prompt },
    { data: existingUserWord },
    unreadCountResult,
    { data: sharerProfile },
  ] = await Promise.all([
    promptQuery,
    userWordQuery,
    unreadCountQuery,
    sharerProfileQuery,
  ])

  if (!prompt) {
    notFound()
  }

  const sharerWord = sharerProfile
    ? await supabase
        .from('words')
        .select('word')
        .eq('user_id', sharerProfile.id)
        .eq('prompt_id', promptId)
        .maybeSingle()
    : { data: null }

  const sharer = sharerProfile && sharerWord.data
    ? {
        username: sharerProfile.username,
        word: sharerWord.data.word,
      }
    : null

  return {
    prompt,
    user,
    sharer,
    initialUserWord: existingUserWord?.word || null,
    unreadCount: unreadCountResult.count || 0,
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: ChallengePageProps): Promise<Metadata> {
  const { promptId } = await params
  const { from } = await searchParams
  const { prompt, sharer } = await getChallengeData(promptId, from)

  const title = sharer
    ? `@${sharer.username} said "${sharer.word}"`
    : prompt.question

  const description = sharer
    ? `${sharer.username} answered "${sharer.word}" on OneWord. What would you say to "${prompt.question}"?`
    : `Answer "${prompt.question}" on OneWord with a single word.`

  const ogImage = sharer
    ? `/api/og/${promptId}?word=${encodeURIComponent(sharer.word)}&username=${encodeURIComponent(sharer.username)}`
    : `/api/og/${promptId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'OneWord',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ChallengePage({
  params,
  searchParams,
}: ChallengePageProps) {
  const { promptId } = await params
  const { from } = await searchParams
  const { prompt, user, sharer, initialUserWord, unreadCount } = await getChallengeData(promptId, from)

  return (
    <main className="mx-auto min-h-screen max-w-lg border-x border-zinc-800 bg-black">
      <Header
        user={user ? { id: user.id, email: user.email } : null}
        unreadNotifications={unreadCount}
      />

      <div className="border-b border-zinc-900 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_transparent_55%)] px-4 pb-6 pt-8">
        <p className="text-sm text-zinc-400">One prompt. One word. Your turn.</p>
      </div>

      <ChallengeResponse
        promptId={prompt.id}
        promptQuestion={prompt.question}
        user={user ? { id: user.id, email: user.email } : null}
        sharer={sharer}
        initialUserWord={initialUserWord}
      />
    </main>
  )
}
