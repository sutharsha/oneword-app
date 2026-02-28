'use client'

import { useState, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { REACTION_EMOJIS, type ReactionEmoji } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { createRateLimiter } from '@/lib/rate-limit'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ShareButton from '@/components/ShareButton'

interface WordPostProps {
  id: string
  word: string
  username: string
  displayName: string | null
  avatarUrl?: string | null
  createdAt: string
  reactionCounts: Record<string, number>
  userReaction: string | null
  currentUserId: string | null
  wordUserId?: string
  promptId?: string | null
  streakCount?: number
}

export default function WordPost({
  id,
  word,
  username,
  displayName,
  avatarUrl,
  createdAt,
  reactionCounts: initialCounts,
  userReaction: initialReaction,
  currentUserId,
  wordUserId,
  promptId,
  streakCount,
}: WordPostProps) {
  const [reactionCounts, setReactionCounts] = useState(initialCounts)
  const [userReaction, setUserReaction] = useState(initialReaction)
  const [showReactions, setShowReactions] = useState(false)
  const [reacting, setReacting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const rateLimiter = useRef(createRateLimiter(10, 30_000))
  const deleteRateLimiter = useRef(createRateLimiter(3, 60_000))
  const router = useRouter()

  const isOwner = currentUserId && wordUserId && currentUserId === wordUserId

  const handleReact = async (emoji: ReactionEmoji) => {
    if (!currentUserId || reacting) return
    if (!rateLimiter.current.check()) return
    setReacting(true)
    const supabase = createClient()

    const prevCounts = { ...reactionCounts }
    const prevReaction = userReaction

    try {
      if (userReaction === emoji) {
        // Optimistic update
        setReactionCounts((prev) => ({
          ...prev,
          [emoji]: Math.max(0, (prev[emoji] || 0) - 1),
        }))
        setUserReaction(null)

        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('word_id', id)
          .eq('user_id', currentUserId)

        if (error) throw error
      } else {
        // Optimistic update
        if (userReaction) {
          setReactionCounts((prev) => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1),
          }))
        }
        setReactionCounts((prev) => ({
          ...prev,
          [emoji]: (prev[emoji] || 0) + 1,
        }))
        setUserReaction(emoji)

        // Remove old reaction if exists
        if (userReaction) {
          const { error } = await supabase
            .from('reactions')
            .delete()
            .eq('word_id', id)
            .eq('user_id', currentUserId)

          if (error) throw error
        }

        // Add new reaction
        const { error } = await supabase.from('reactions').insert({
          word_id: id,
          user_id: currentUserId,
          emoji,
        })

        if (error) throw error

        // Send notification to post owner (don't block)
        if (wordUserId && wordUserId !== currentUserId) {
          supabase
            .from('notifications')
            .insert({
              user_id: wordUserId,
              actor_id: currentUserId,
              type: 'reaction',
              word_id: id,
              emoji,
            })
            .then(() => {})
        }
      }
    } catch {
      // Rollback on failure
      setReactionCounts(prevCounts)
      setUserReaction(prevReaction)
    } finally {
      setReacting(false)
    }
    setShowReactions(false)
  }

  const handleDelete = async () => {
    if (!isOwner || deleting) return
    if (!deleteRateLimiter.current.check()) return

    setDeleting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', id)

    if (error) {
      setDeleting(false)
      setShowDeleteConfirm(false)
      return
    }

    setDeleted(true)
    router.refresh()
  }

  if (deleted) return null

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="border-b border-zinc-800 px-4 py-5 hover:bg-zinc-950 transition-colors">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${username}`} className="shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
              {(displayName || username || '?')[0].toUpperCase()}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${username}`} className="font-semibold text-sm hover:underline">
              {displayName || username}
            </Link>
            <Link href={`/profile/${username}`} className="text-zinc-500 text-sm hover:underline">
              @{username}
            </Link>
            <span className="text-zinc-600 text-xs">·</span>
            <span className="text-zinc-500 text-xs">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            {streakCount && streakCount >= 2 ? (
              <span className="text-orange-400 text-xs font-semibold" title={`${streakCount}-day streak`}>
                {streakCount}d
              </span>
            ) : null}
          </div>
          <p className="text-3xl font-bold mt-2 mb-3">{word}</p>
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => currentUserId && !reacting && setShowReactions(!showReactions)}
              disabled={reacting}
              className={`text-sm px-2 py-1 rounded-full transition-colors ${
                currentUserId && !reacting
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer'
                  : 'text-zinc-600 cursor-default'
              }`}
            >
              {userReaction || (totalReactions > 0 ? '😶' : '+')}
              {totalReactions > 0 && (
                <span className="ml-1 text-zinc-500">{totalReactions}</span>
              )}
            </button>

            <ShareButton word={word} username={username} wordId={promptId || id} />

            {isOwner && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm px-2 py-1 rounded-full text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors ml-auto"
                title="Delete"
              >
                🗑
              </button>
            )}

            {showDeleteConfirm && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-zinc-400">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {deleting ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-medium transition-colors"
                >
                  No
                </button>
              </div>
            )}

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
