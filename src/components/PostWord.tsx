'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createRateLimiter } from '@/lib/rate-limit'
import { validateWord } from '@/lib/validation'
import { useToast } from '@/components/Toast'
import Link from 'next/link'

interface SameWordMatch {
  username: string
  display_name: string | null
}

interface PostWordProps {
  userId: string
  promptId: string | null
  promptQuestion: string | null
  hasPostedToday: boolean
}

export default function PostWord({ userId, promptId, promptQuestion, hasPostedToday }: PostWordProps) {
  const [word, setWord] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [answered, setAnswered] = useState(hasPostedToday)
  const [devBypass, setDevBypass] = useState(false)
  const [sameWordMatches, setSameWordMatches] = useState<SameWordMatch[]>([])
  const [postedWord, setPostedWord] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const rateLimiter = useRef(createRateLimiter(3, 60_000))

  // Sync with server prop
  useEffect(() => {
    setAnswered(hasPostedToday)
  }, [hasPostedToday])

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

    const supabase = createClient()

    // Dev bypass: delete existing word for this prompt so re-post succeeds
    if (devBypass && promptId) {
      await supabase
        .from('words')
        .delete()
        .eq('user_id', userId)
        .eq('prompt_id', promptId)
    }

    const { error: insertError } = await supabase.from('words').insert({
      user_id: userId,
      word: trimmed,
      prompt_id: promptId,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('You already answered today.')
        setAnswered(true)
      } else {
        setError(insertError.message)
        toast(insertError.message, 'error')
      }
      setPosting(false)
      return
    }

    toast(`"${trimmed}" — said.`)

    setPostedWord(trimmed)
    setWord('')
    setPosting(false)
    setAnswered(true)

    // Find others who posted the same word for this prompt
    if (promptId) {
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
              display_name: profile?.display_name || null,
            }
          })
        )
      }
    }

    try {
      router.refresh()
    } catch {
      // Refresh failed — post was saved, page will update on next load
    }
  }

  const showForm = !answered || devBypass

  return (
    <div className="border-b border-zinc-800 p-4">
      {promptQuestion && (
        <div className="mb-3 text-center">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Today&apos;s prompt</span>
          <p className="text-lg font-semibold text-purple-400 mt-1">{promptQuestion}</p>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-center">
          <input
            type="text"
            value={word}
            onChange={(e) => {
              setWord(e.target.value)
              setError(null)
            }}
            placeholder="One word..."
            maxLength={45}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-5 py-3 text-lg font-bold focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder:text-zinc-600"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={posting || !word.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold px-6 py-3 rounded-full transition-colors"
          >
            {posting ? '...' : 'Say'}
          </button>
        </form>
      ) : (
        <div className="text-center py-3">
          <p className="text-zinc-400 text-sm">You already answered today.</p>
          <p className="text-zinc-600 text-xs mt-1">Come back tomorrow for a new prompt.</p>

          {/* Same Word connection */}
          {sameWordMatches.length > 0 && postedWord && (
            <div className="mt-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl animate-fade-in">
              <p className="text-sm text-purple-400 font-medium">
                You and {sameWordMatches.length} {sameWordMatches.length === 1 ? 'other' : 'others'} said &ldquo;{postedWord}&rdquo;
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {sameWordMatches.slice(0, 5).map((m) => (
                  <Link
                    key={m.username}
                    href={`/profile/${m.username}`}
                    className="text-xs text-zinc-400 hover:text-purple-400 transition-colors"
                  >
                    @{m.username}
                  </Link>
                ))}
                {sameWordMatches.length > 5 && (
                  <span className="text-xs text-zinc-500">+{sameWordMatches.length - 5} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}

      {/* Dev toggle — allows re-posting during development */}
      {answered && (
        <div className="mt-2 flex justify-center">
          <button
            onClick={() => {
              setDevBypass(!devBypass)
              setError(null)
            }}
            className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            {devBypass ? '[dev: bypass on]' : '[dev: allow repost]'}
          </button>
        </div>
      )}
    </div>
  )
}
