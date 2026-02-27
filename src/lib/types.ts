export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
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
