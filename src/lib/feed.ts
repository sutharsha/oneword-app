import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type FilterType = 'today' | 'week' | 'all' | 'following' | 'popular'
export type TodayPrompt = { id: string; question: string; active_date: string } | null

export type FeedUser = {
  id: string
  email?: string
  username: string | null
} | null

export type SameWordMatch = {
  username: string
  displayName: string | null
}

export type TodaysReveal = {
  userWord: string
  totalAnswers: number
  sameWordCount: number
  sameWordMatches: SameWordMatch[]
  username: string | null
}

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
  todaysReveal: TodaysReveal | null
  words: FeedWord[]
}

type FeedRpcWord = {
  id: string
  word: string
  user_id: string
  prompt_id: string | null
  created_at: string
  profile?: {
    username?: string | null
    display_name?: string | null
    avatar_url?: string | null
    current_streak?: number | null
  } | null
  reaction_counts?: Record<string, number> | null
  reaction_total?: number | null
  user_reaction?: string | null
}

type FeedRpcPayload = {
  todaysPrompt?: TodayPrompt
  hasPostedToday?: boolean
  followingEmpty?: boolean
  words?: FeedRpcWord[]
}

export function normalizeFilter(filter?: string | null): FilterType {
  return (['today', 'week', 'all', 'following', 'popular'].includes(filter || '') ? filter : 'today') as FilterType
}

function mapSameWordMatches(matches: Array<{ profiles?: { username?: string | null; display_name?: string | null } | { username?: string | null; display_name?: string | null }[] | null }> | null | undefined): SameWordMatch[] {
  return (matches || []).map((match) => {
    const profile = Array.isArray(match.profiles) ? match.profiles[0] : match.profiles

    return {
      username: profile?.username || 'anonymous',
      displayName: profile?.display_name || null,
    }
  })
}

export function publicUser(user: User | null, username?: string | null): FeedUser {
  return user ? { id: user.id, email: user.email, username: username || null } : null
}

export async function getTodaysPrompt(): Promise<TodayPrompt> {
  const supabase = await createClient()
  const { data: prompts } = await supabase.rpc('get_todays_prompt')
  return prompts?.[0] || null
}

export async function getFeedData({
  filter,
  user,
}: {
  filter: FilterType
  user: User | null
  todaysPrompt?: TodayPrompt
}): Promise<FeedData> {
  const supabase = await createClient()

  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase.rpc('get_feed', {
      p_filter: filter,
      p_user_id: user?.id || null,
    }),
    user
      ? supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (error) {
    throw error
  }

  const payload = (data || {}) as FeedRpcPayload
  const words = payload.words || []
  let todaysReveal: TodaysReveal | null = null

  if (user && payload.hasPostedToday && payload.todaysPrompt?.id) {
    const promptId = payload.todaysPrompt.id
    const { data: currentWord } = await supabase
      .from('words')
      .select('word')
      .eq('user_id', user.id)
      .eq('prompt_id', promptId)
      .maybeSingle()

    if (currentWord?.word) {
      const [{ count: totalAnswers }, { count: sameWordCount }, { data: matches }] = await Promise.all([
        supabase
          .from('words')
          .select('id', { count: 'exact', head: true })
          .eq('prompt_id', promptId),
        supabase
          .from('words')
          .select('id', { count: 'exact', head: true })
          .eq('prompt_id', promptId)
          .ilike('word', currentWord.word),
        supabase
          .from('words')
          .select('profiles (username, display_name)')
          .eq('prompt_id', promptId)
          .ilike('word', currentWord.word)
          .neq('user_id', user.id)
          .limit(5),
      ])

      todaysReveal = {
        userWord: currentWord.word,
        totalAnswers: totalAnswers || 0,
        sameWordCount: sameWordCount || 0,
        sameWordMatches: mapSameWordMatches(matches),
        username: profile?.username || null,
      }
    }
  }

  let crownWordId: string | null = null
  if (filter === 'today' || filter === 'popular') {
    let maxReactions = 0
    words.forEach((w) => {
      const total = w.reaction_total ?? Object.values(w.reaction_counts || {}).reduce((sum, n) => sum + n, 0)
      if (total > maxReactions) {
        maxReactions = total
        crownWordId = w.id
      }
    })
    if (maxReactions === 0) crownWordId = null
  }

  return {
    filter,
    user: publicUser(user, profile?.username || null),
    todaysPrompt: payload.todaysPrompt || null,
    hasPostedToday: !!payload.hasPostedToday,
    followingEmpty: !!payload.followingEmpty,
    todaysReveal,
    words: words.map((w) => ({
      id: w.id,
      word: w.word,
      username: w.profile?.username || 'anonymous',
      displayName: w.profile?.display_name || null,
      avatarUrl: w.profile?.avatar_url || null,
      createdAt: w.created_at,
      reactionCounts: w.reaction_counts || {},
      userReaction: w.user_reaction || null,
      currentUserId: user?.id || null,
      wordUserId: w.user_id,
      promptId: w.prompt_id,
      streakCount: w.profile?.current_streak || 0,
      isCrowned: w.id === crownWordId,
    })),
  }
}
