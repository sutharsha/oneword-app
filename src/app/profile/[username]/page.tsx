import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import WordPost from '@/components/WordPost'
import ProfileEdit from '@/components/ProfileEdit'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Image from 'next/image'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${username}`,
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  if (!profile) notFound()

  const isOwnProfile = user?.id === profile.id

  // Fetch word count
  const { count: totalPosts } = await supabase
    .from('words')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)

  // Fetch user's words
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
    .eq('user_id', profile.id)
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

      {/* Profile header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold shrink-0">
              {(profile.display_name || profile.username || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{profile.display_name || profile.username}</h2>
            <p className="text-zinc-500 text-sm">@{profile.username}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
              <span><strong className="text-white">{totalPosts ?? 0}</strong> posts</span>
              <span>Joined {format(new Date(profile.created_at), 'MMM yyyy')}</span>
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <ProfileEdit
            userId={profile.id}
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
          />
        )}
      </div>

      {/* Post history */}
      <div>
        {words && words.length > 0 ? (
          words.map((w) => {
            const p = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles
            return (
              <WordPost
                key={w.id}
                id={w.id}
                word={w.word}
                username={p?.username || profile.username}
                displayName={p?.display_name || profile.display_name}
                avatarUrl={p?.avatar_url || profile.avatar_url}
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
            <p className="text-lg font-semibold">No words yet.</p>
            <p className="text-sm mt-1">This user hasn&apos;t said anything.</p>
          </div>
        )}
      </div>
    </main>
  )
}
