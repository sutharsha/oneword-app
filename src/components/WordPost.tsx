'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface WordPostProps {
  id: string
  word: string
  username: string
  displayName: string | null
  createdAt: string
  reactionCounts: Record<string, number>
  userReaction: string | null
  currentUserId: string | null
}

export default function WordPost({
  id,
  word,
  username,
  displayName,
  createdAt,
  reactionCounts: initialCounts,
  userReaction: initialReaction,
  currentUserId,
}: WordPostProps) {
  const [reactionCounts, setReactionCounts] = useState(initialCounts)
  const [userReaction, setUserReaction] = useState(initialReaction)
  const [showReactions, setShowReactions] = useState(false)

  const handleReact = async (emoji: ReactionEmoji) => {
    if (!currentUserId) return
    const supabase = createClient()

    if (userReaction === emoji) {
      // Remove reaction
      await supabase
        .from('reactions')
        .delete()
        .eq('word_id', id)
        .eq('user_id', currentUserId)

      setReactionCounts((prev) => ({
        ...prev,
        [emoji]: Math.max(0, (prev[emoji] || 0) - 1),
      }))
      setUserReaction(null)
    } else {
      // Remove old reaction if exists
      if (userReaction) {
        await supabase
          .from('reactions')
          .delete()
          .eq('word_id', id)
          .eq('user_id', currentUserId)

        setReactionCounts((prev) => ({
          ...prev,
          [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1),
        }))
      }

      // Add new reaction
      await supabase.from('reactions').insert({
        word_id: id,
        user_id: currentUserId,
        emoji,
      })

      setReactionCounts((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1,
      }))
      setUserReaction(emoji)
    }
    setShowReactions(false)
  }

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="border-b border-zinc-800 px-4 py-5 hover:bg-zinc-950 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold shrink-0">
          {(displayName || username)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{displayName || username}</span>
            <span className="text-zinc-500 text-sm">@{username}</span>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-zinc-500 text-xs">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-3xl font-bold mt-2 mb-3">{word}</p>
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => currentUserId && setShowReactions(!showReactions)}
              className={`text-sm px-2 py-1 rounded-full transition-colors ${
                currentUserId
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer'
                  : 'text-zinc-600 cursor-default'
              }`}
            >
              {userReaction || (totalReactions > 0 ? '😶' : '+')}
              {totalReactions > 0 && (
                <span className="ml-1 text-zinc-500">{totalReactions}</span>
              )}
            </button>

            {showReactions && (
              <div className="absolute bottom-full left-0 mb-1 bg-zinc-900 border border-zinc-700 rounded-full px-2 py-1 flex gap-1 shadow-lg z-10">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`text-lg px-1.5 py-0.5 rounded-full hover:bg-zinc-700 transition-colors ${
                      userReaction === emoji ? 'bg-zinc-700' : ''
                    }`}
                  >
                    {emoji}
                    {(reactionCounts[emoji] || 0) > 0 && (
                      <span className="text-xs ml-0.5">{reactionCounts[emoji]}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
