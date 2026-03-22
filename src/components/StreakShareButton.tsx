'use client'

import { useState } from 'react'

interface StreakShareButtonProps {
  username: string
  streak: number
  longestStreak?: number
}

export default function StreakShareButton({ username, streak, longestStreak }: StreakShareButtonProps) {
  const [copied, setCopied] = useState(false)

  if (streak < 3) return null

  const handleShare = async () => {
    const profileUrl = new URL(`/profile/${username}`, window.location.origin).toString()
    const best = longestStreak && longestStreak > streak ? ` (best: ${longestStreak}d)` : ''
    const text = `🔥 I'm on a ${streak}-day streak${best} on OneWord! Can you beat me? ${profileUrl}`

    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // cancelled or failed, fall through
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // silent fail
    }
  }

  return (
    <button
      onClick={handleShare}
      className="text-xs px-2 py-0.5 rounded-full border border-orange-400/40 text-orange-400 hover:bg-orange-400/10 transition-colors"
      title="Share streak"
    >
      {copied ? 'Copied!' : 'Share streak'}
    </button>
  )
}
