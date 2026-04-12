'use client'

import { useState } from 'react'
import { validateWord } from '@/lib/validation'
import { useToast } from '@/components/Toast'
import AuthButton from '@/components/AuthButton'
import { useRouter } from 'next/navigation'

interface ChallengeResponseProps {
  promptId: string
  promptQuestion: string
  user: { id: string; email?: string } | null
  sharer: {
    username: string
    word: string
  } | null
  initialUserWord: string | null
}

export default function ChallengeResponse({
  promptId,
  promptQuestion,
  user,
  sharer,
  initialUserWord,
}: ChallengeResponseProps) {
  const [word, setWord] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userWord, setUserWord] = useState(initialUserWord)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = word.trim().toLowerCase()
    const validationError = validateWord(trimmed)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!user) {
      setError(null)
      setShowSignupPrompt(true)
      return
    }

    setSubmitting(true)
    setError(null)

    // Post via server API to capture IP + geolocation
    const res = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: trimmed, prompt_id: promptId }),
    })

    const result = await res.json()

    if (!res.ok) {
      if (res.status === 409) {
        setError('You already answered this prompt.')
      } else {
        setError(result.error || 'Something went wrong')
        toast(result.error || 'Something went wrong', 'error')
      }
      setSubmitting(false)
      return
    }

    setUserWord(trimmed)
    setWord('')
    setShowSignupPrompt(false)
    setSubmitting(false)
    toast(`"${trimmed}" — said.`)

    try {
      router.refresh()
    } catch {
      // Refresh failure should not block the posted state.
    }
  }

  const showComparison = !!userWord && !!sharer

  return (
    <section className="px-4 py-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Challenge</p>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-white">
          {sharer ? (
            <>
              <span className="text-purple-400">@{sharer.username}</span> said{' '}
              <span className="text-white">&ldquo;{sharer.word}&rdquo;</span>. What is your word?
            </>
          ) : (
            promptQuestion
          )}
        </h1>
        {!sharer && (
          <p className="mt-3 text-sm text-zinc-400">Say one word.</p>
        )}

        {!userWord ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="rounded-[28px] border border-zinc-800 bg-black p-3">
              <p className="px-2 text-xs uppercase tracking-[0.22em] text-zinc-600">Prompt</p>
              <p className="px-2 pt-2 text-lg font-semibold text-zinc-100">{promptQuestion}</p>
              <input
                type="text"
                value={word}
                onChange={(e) => {
                  setWord(e.target.value)
                  setError(null)
                }}
                placeholder="One word..."
                maxLength={45}
                autoComplete="off"
                spellCheck={false}
                className="mt-4 w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-3xl font-bold text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !word.trim()}
              className="w-full rounded-full bg-purple-600 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {submitting ? 'Posting...' : 'Say it'}
            </button>

            {error && <p className="text-center text-sm text-red-400">{error}</p>}

            {showSignupPrompt && (
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                <p className="text-sm font-semibold text-white">Create an account to post your word.</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Your answer is <span className="text-purple-300">&ldquo;{word.trim().toLowerCase()}&rdquo;</span>.
                </p>
                <div className="mt-4">
                  <AuthButton user={null} />
                </div>
              </div>
            )}
          </form>
        ) : showComparison ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-zinc-400">Same prompt. Two answers.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">You</p>
                <p className="mt-3 break-words text-3xl font-black text-white">{userWord}</p>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-purple-300">@{sharer.username}</p>
                <p className="mt-3 break-words text-3xl font-black text-white">{sharer.word}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
            <p className="text-sm font-semibold text-white">You said &ldquo;{userWord}&rdquo;.</p>
            <p className="mt-1 text-sm text-zinc-400">Now see what everyone else said on the prompt page.</p>
          </div>
        )}
      </div>
    </section>
  )
}
