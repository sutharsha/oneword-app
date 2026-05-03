'use client'

import { useState } from 'react'

interface ShareButtonProps {
  word: string
  username?: string | null
  promptId?: string | null
  promptQuestion?: string | null
  label?: string
  className?: string
}

export default function ShareButton({
  word,
  username,
  promptId,
  promptQuestion,
  label,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = promptId
      ? new URL(`/challenge/${promptId}`, window.location.origin)
      : new URL(`/profile/${username || 'anonymous'}`, window.location.origin)

    if (promptId && username) {
      shareUrl.searchParams.set('from', username)
    }

    const url = shareUrl.toString()
    const text = promptQuestion
      ? `Today on OneWord: "${promptQuestion}" I said "${word}". What would you say? ${url}`
      : `I said "${word}" on OneWord. What would you say? ${url}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OneWord',
          text,
          url,
        })
        return
      } catch {
        // Share cancelled or failed. Fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can fail in unsupported browsers.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={className || 'text-sm px-2 py-1 rounded-full text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors'}
      title={label || 'Share'}
    >
      {copied ? <span className="text-green-400 text-xs">Copied!</span> : label || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      )}
    </button>
  )
}
