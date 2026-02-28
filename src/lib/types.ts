export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  current_streak: number
  longest_streak: number
  last_post_date: string | null
  is_admin: boolean
}

export interface Prompt {
  id: string
  question: string
  active_date: string
}

export interface Word {
  id: string
  user_id: string
  word: string
  prompt_id: string | null
  created_at: string
  profiles: Profile
  reaction_counts: ReactionCount[]
  user_reaction?: string | null
}

export interface ReactionCount {
  emoji: string
  count: number
}

export type ReactionEmoji = '🔥' | '👀' | '💀' | '❤️' | '🤔'

export const REACTION_EMOJIS: ReactionEmoji[] = ['🔥', '👀', '💀', '❤️', '🤔']

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: 'reaction' | 'follow'
  word_id: string | null
  emoji: string | null
  read: boolean
  created_at: string
  actor?: Profile
  word?: { word: string } | null
}
