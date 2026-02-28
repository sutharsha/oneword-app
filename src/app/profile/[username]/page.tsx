import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import WordPost from '@/components/WordPost'
import ProfileEdit from '@/components/ProfileEdit'
import FollowButton from '@/components/FollowButton'
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

  // Fetch counts in parallel
  const [
    { count: totalPosts },
    { count: followerCount },
    { count: followingCount },
  ] = await Promise.all([
    supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
  ])

  // Check if current user follows this profile
  let isFollowing = false
  if (user && !isOwnProfile) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle()
    isFollowing = !!follow
  }

  // Get unread notification count for header
  let unreadCount = 0
  if (user) {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    unreadCount = count || 0
  }

  // Fetch user's words
  const { data: words } = await supabase
    .from('words')
    .select(`
      id,
      word,
      user_id,
      prompt_id,
      created_at,
      profiles (id, username, display_name, avatar_url, current_streak)
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
      <Header
        user={user ? { id: user.id, email: user.email } : null}
        unreadNotifications={unreadCount}
      />

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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold truncate">{profile.display_name || profile.username}</h2>
              {profile.current_streak >= 2 && (
                <span className="text-orange-400 text-sm font-semibold" title={`${profile.current_streak}-day streak`}>
                  {profile.current_streak}d
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-sm">@{profile.username}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
              <span><strong className="text-white">{totalPosts ?? 0}</strong> posts</span>
              <span>Joined {format(new Date(profile.created_at), 'MMM yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Streak display */}
        {profile.current_streak >= 1 && (
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="text-orange-400 font-semibold">
              {profile.current_streak}-day streak
            </span>
            {profile.longest_streak > profile.current_streak && (
              <span className="text-zinc-500">
                Best: {profile.longest_streak}d
              </span>
            )}
          </div>
        )}

        {/* Follow button for other users */}
        {user && !isOwnProfile && (
          <FollowButton
            currentUserId={user.id}
            profileId={profile.id}
            isFollowing={isFollowing}
            followerCount={followerCount ?? 0}
            followingCount={followingCount ?? 0}
          />
        )}

        {/* Stats for own profile or logged-out */}
        {(isOwnProfile || !user) && (
          <div className="flex items-center gap-3 mt-3 text-sm text-zinc-400">
            <span><strong className="text-white">{followerCount ?? 0}</strong> followers</span>
            <span><strong className="text-white">{followingCount ?? 0}</strong> following</span>
          </div>
        )}

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
                promptId={w.prompt_id}
                streakCount={p?.current_streak || 0}
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
