import { startOfDay, subDays } from 'date-fns'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type FilterType = 'today' | 'week' | 'all' | 'following' | 'popular'
export type TodayPrompt = { id: string; question: string; active_date: string } | null

export type FeedUser = {
  id: string
  email?: string
} | null

export type FeedWord = {
  id: string
  word: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  reactionCounts: Record<string, number>
  userReaction: string | null
  currentUserId: string | null
  wordUserId: string
  promptId: string | null
  streakCount: number
  isCrowned: boolean
}

export type FeedData = {
  filter: FilterType
  user: FeedUser
  todaysPrompt: TodayPrompt
  hasPostedToday: boolean
  followingEmpty: boolean
  words: FeedWord[]
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  current_streak: number | null
}

type WordRow = {
  id: string
  word: string
  user_id: string
  prompt_id: string | null
  created_at: string
  profiles: ProfileRow | ProfileRow[] | null
}

type ReactionRow = {
  word_id: string
  emoji: string
  user_id: string
}

export function normalizeFilter(filter?: string | null): FilterType {
  return (['today', 'week', 'all', 'following', 'popular'].includes(filter || '') ? filter : 'today') as FilterType
}

export function publicUser(user: User | null): FeedUser {
  return user ? { id: user.id, email: user.email } : null
}

export async function getTodaysPrompt(): Promise<TodayPrompt> {
  const supabase = await createClient()
  const { data: prompts } = await supabase.rpc('get_todays_prompt')
  return prompts?.[0] || null
}

export async function getFeedData({
  filter,
  user,
  todaysPrompt,
}: {
  filter: FilterType
  user: User | null
  todaysPrompt: TodayPrompt
}): Promise<FeedData> {
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
    : Promise.resolve({ data: [] as { following_id: string }[] })

  const [{ data: existingPost }, { data: follows }] = await Promise.all([
    hasPostedTodayPromise,
    followsPromise,
  ])

  const hasPostedToday = !!existingPost
  const followingIds = follows?.map((f) => f.following_id) || []

  if (filter === 'following' && followingIds.length === 0) {
    return {
      filter,
      user: publicUser(user),
      todaysPrompt,
      hasPostedToday,
      followingEmpty: true,
      words: [],
    }
  }

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
    query = query.in('user_id', followingIds)
  }

  const { data: words } = await query
  const wordRows = (words || []) as WordRow[]

  const wordIds = wordRows.map((w) => w.id)
  const { data: reactions } = wordIds.length
    ? await supabase
        .from('reactions')
        .select('word_id, emoji, user_id')
        .in('word_id', wordIds)
    : { data: [] as ReactionRow[] }

  const reactionRows = (reactions || []) as ReactionRow[]
  const reactionMap: Record<string, Record<string, number>> = {}
  const userReactionMap: Record<string, string | null> = {}

  reactionRows.forEach((r) => {
    if (!reactionMap[r.word_id]) reactionMap[r.word_id] = {}
    reactionMap[r.word_id][r.emoji] = (reactionMap[r.word_id][r.emoji] || 0) + 1
    if (user && r.user_id === user.id) {
      userReactionMap[r.word_id] = r.emoji
    }
  })

  let sortedWords = wordRows
  if (filter === 'popular' && sortedWords.length > 0) {
    sortedWords = [...sortedWords].sort((a, b) => {
      const aTotal = Object.values(reactionMap[a.id] || {}).reduce((sum, n) => sum + n, 0)
      const bTotal = Object.values(reactionMap[b.id] || {}).reduce((sum, n) => sum + n, 0)
      return bTotal - aTotal
    })
  }

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
    if (maxReactions === 0) crownWordId = null
  }

  return {
    filter,
    user: publicUser(user),
    todaysPrompt,
    hasPostedToday,
    followingEmpty: false,
    words: sortedWords.map((w) => {
      const profile = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles
      return {
        id: w.id,
        word: w.word,
        username: profile?.username || 'anonymous',
        displayName: profile?.display_name || null,
        avatarUrl: profile?.avatar_url || null,
        createdAt: w.created_at,
        reactionCounts: reactionMap[w.id] || {},
        userReaction: userReactionMap[w.id] || null,
        currentUserId: user?.id || null,
        wordUserId: w.user_id,
        promptId: w.prompt_id,
        streakCount: profile?.current_streak || 0,
        isCrowned: w.id === crownWordId,
      }
    }),
  }
}
