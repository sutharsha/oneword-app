'use client'

import { useState } from 'react'

interface ShareButtonProps {
  word: string
  username: string
  wordId: string
}

export default function ShareButton({ word, username, wordId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/prompts/${wordId}`
    const text = `"${word}" — @${username} on OneWord`

    // Try native share on mobile
    if (navigator.share) {
      try {
        await navigator.share({ text, url })
        return
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard failed silently
    }
  }

  return (
    <button
      onClick={handleShare}
      className="text-sm px-2 py-1 rounded-full text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
      title="Share"
    >
      {copied ? (
        <span className="text-green-400 text-xs">Copied!</span>
      ) : (
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
