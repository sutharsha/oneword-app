'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createRateLimiter } from '@/lib/rate-limit'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  currentUserId: string
  profileId: string
  isFollowing: boolean
  followerCount: number
  followingCount: number
}

export default function FollowButton({
  currentUserId,
  profileId,
  isFollowing: initialFollowing,
  followerCount: initialFollowers,
  followingCount,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowers)
  const [loading, setLoading] = useState(false)
  const [hovering, setHovering] = useState(false)
  const rateLimiter = useRef(createRateLimiter(5, 30_000))
  const router = useRouter()

  const handleToggle = async () => {
    if (loading) return
    if (!rateLimiter.current.check()) return

    setLoading(true)
    const supabase = createClient()

    const prevFollowing = isFollowing
    const prevCount = followerCount

    // Optimistic update
    setIsFollowing(!isFollowing)
    setFollowerCount(isFollowing ? followerCount - 1 : followerCount + 1)

    try {
      if (prevFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', profileId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: profileId })
        if (error) throw error

        // Create notification (don't block on it)
        supabase
          .from('notifications')
          .insert({
            user_id: profileId,
            actor_id: currentUserId,
            type: 'follow',
          })
          .then(() => {})
      }
      router.refresh()
    } catch {
      setIsFollowing(prevFollowing)
      setFollowerCount(prevCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4 mt-3">
      <button
        onClick={handleToggle}
        disabled={loading}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`text-sm px-4 py-1.5 rounded-full font-semibold transition-colors disabled:opacity-50 ${
          isFollowing
            ? hovering
              ? 'bg-red-600/20 text-red-400 border border-red-500/50'
              : 'bg-zinc-800 text-zinc-300 border border-zinc-600'
            : 'bg-purple-600 hover:bg-purple-500 text-white'
        }`}
      >
        {loading
          ? '...'
          : isFollowing
            ? hovering
              ? 'Unfollow'
              : 'Following'
            : 'Follow'}
      </button>
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <span><strong className="text-white">{followerCount}</strong> followers</span>
        <span><strong className="text-white">{followingCount}</strong> following</span>
      </div>
    </div>
  )
}
