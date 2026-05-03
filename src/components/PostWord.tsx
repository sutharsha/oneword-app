'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createRateLimiter } from '@/lib/rate-limit'
import { validateWord } from '@/lib/validation'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'

interface SameWordMatch {
  username: string
  displayName: string | null
}

interface PostReveal {
  word: string
  totalAnswers: number
  sameWordCount: number
  username: string | null
  sameWordMatches?: SameWordMatch[]
}

interface PostWordProps {
  userId: string
  promptId: string | null
  promptQuestion: string | null
  hasPostedToday: boolean
  initialReveal?: PostReveal | null
  onPosted?: () => void
}

export default function PostWord({
  userId,
  promptId,
  promptQuestion,
  hasPostedToday,
  initialReveal = null,
  onPosted,
}: PostWordProps) {
  const [word, setWord] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [answered, setAnswered] = useState(hasPostedToday)
  const [sameWordMatches, setSameWordMatches] = useState<SameWordMatch[]>([])
  const [reveal, setReveal] = useState<PostReveal | null>(initialReveal)
  const router = useRouter()
  const { toast } = useToast()
  const rateLimiter = useRef(createRateLimiter(3, 60_000))

  useEffect(() => {
    setAnswered(hasPostedToday)
  }, [hasPostedToday])

  useEffect(() => {
    setReveal(initialReveal)
    setSameWordMatches(initialReveal?.sameWordMatches || [])
  }, [initialReveal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = word.trim().toLowerCase()
    const validationError = validateWord(trimmed)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!rateLimiter.current.check()) {
      const wait = rateLimiter.current.retryAfter()
      setError(`Slow down. Try again in ${wait}s.`)
      return
    }

    setPosting(true)
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
        setError('You already answered today.')
        setAnswered(true)
      } else {
        setError(result.error || 'Something went wrong')
        toast(result.error || 'Something went wrong', 'error')
      }
      setPosting(false)
      return
    }

    const nextReveal: PostReveal = {
      word: result.reveal?.word || trimmed,
      totalAnswers: result.reveal?.totalAnswers || 0,
      sameWordCount: result.reveal?.sameWordCount || 1,
      username: result.reveal?.username || null,
    }

    toast(`"${trimmed}" — said.`)

    setReveal(nextReveal)
    setWord('')
    setPosting(false)
    setAnswered(true)
    onPosted?.()

    if (promptId && (nextReveal.sameWordCount || 0) > 1) {
      const supabase = createClient()
      const { data: matches } = await supabase
        .from('words')
        .select('user_id, profiles (username, display_name)')
        .eq('prompt_id', promptId)
        .ilike('word', trimmed)
        .neq('user_id', userId)
        .limit(10)

      if (matches && matches.length > 0) {
        setSameWordMatches(
          matches.map((m) => {
            const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
            return {
              username: profile?.username || 'anonymous',
              displayName: profile?.display_name || null,
            }
          })
        )
      } else {
        setSameWordMatches([])
      }
    } else {
      setSameWordMatches([])
    }

    try {
      router.refresh()
    } catch {
      // Refresh failed — post was saved, page will update on next load
    }
  }

  const showForm = !answered

  return (
    <div className="border-b border-zinc-800 p-4">
      {promptQuestion && (
        <div className="mb-3 text-center">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Today&apos;s prompt</span>
          <p className="text-lg font-semibold text-purple-400 mt-1">{promptQuestion}</p>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={word}
            onChange={(e) => {
              setWord(e.target.value)
              setError(null)
            }}
            placeholder="One word..."
            maxLength={45}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-lg font-bold focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-zinc-600"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={posting || !word.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold px-6 py-3 rounded-full transition-colors"
          >
            {posting ? '...' : 'Say'}
          </button>
        </form>
      ) : (
        <div className="text-center py-3">
          {reveal ? (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 text-left animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-purple-300">Unlocked</p>
                  <p className="mt-2 text-3xl font-black text-white break-words">{reveal.word}</p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {reveal.sameWordCount > 1
                      ? `${reveal.sameWordCount} people said it so far.`
                      : 'Unique so far.'}
                  </p>
                </div>
                <ShareButton
                  word={reveal.word}
                  username={reveal.username}
                  promptId={promptId}
                  promptQuestion={promptQuestion}
                  label="Share"
                  className="shrink-0 rounded-full border border-purple-400/30 px-4 py-2 text-sm font-semibold text-purple-200 transition-colors hover:bg-purple-400/10"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Answers</p>
                  <p className="mt-2 text-2xl font-bold text-white">{reveal.totalAnswers}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/30 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Compared to crowd</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {reveal.sameWordCount > 1 ? 'Common enough to echo.' : 'Standing alone.'}
                  </p>
                </div>
              </div>

              {sameWordMatches.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-purple-300">
                    Same word energy with {sameWordMatches.length} {sameWordMatches.length === 1 ? 'other person' : 'others'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sameWordMatches.map((m) => (
                      <Link
                        key={m.username}
                        href={`/profile/${m.username}`}
                        className="rounded-full bg-black/30 px-3 py-1 text-xs text-zinc-300 transition-colors hover:text-purple-300"
                      >
                        @{m.username}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-4 text-xs text-zinc-500">The feed is live below. Come back tomorrow for a new prompt.</p>
            </div>
          ) : (
            <>
              <p className="text-zinc-400 text-sm">You already answered today.</p>
              <p className="text-zinc-600 text-xs mt-1">Come back tomorrow for a new prompt.</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}

    </div>
  )
}
