'use client'

import { useState, useRef } from 'react'
import { validateWord } from '@/lib/validation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

interface AnonPostWordProps {
  promptId: string | null
  promptQuestion: string | null
}

const PENDING_WORD_KEY = 'oneword_pending'

export function getPendingWord(): { word: string; promptId: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PENDING_WORD_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearPendingWord() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PENDING_WORD_KEY)
}

export default function AnonPostWord({ promptId, promptQuestion }: AnonPostWordProps) {
  const [word, setWord] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showSignup, setShowSignup] = useState(false)
  const [pendingWord, setPendingWord] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authView, setAuthView] = useState<'signUp' | 'signIn'>('signUp')
  const [posted, setPosted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const submittedRef = useRef(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = word.trim().toLowerCase()
    const validationError = validateWord(trimmed)
    if (validationError) {
      setError(validationError)
      return
    }

    // Store in localStorage and show signup
    if (promptId) {
      localStorage.setItem(PENDING_WORD_KEY, JSON.stringify({ word: trimmed, promptId }))
    }
    setPendingWord(trimmed)
    setShowSignup(true)
    setError(null)
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittedRef.current) return
    submittedRef.current = true
    setAuthLoading(true)
    setAuthError(null)

    const supabase = createClient()
    const siteUrl = window.location.origin

    if (authView === 'signUp') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          // eslint-disable-next-line react-hooks/purity
          data: { username: username || `user_${Date.now().toString(36)}` },
        },
      })

      if (signUpError) {
        setAuthError(signUpError.message)
        setAuthLoading(false)
        submittedRef.current = false
        return
      }

      // If auto-confirmed (or session exists), post the word
      if (data.user && data.session) {
        await postPendingWord(supabase, data.user.id)
      } else {
        toast('Check your email to confirm, then your word will be saved!')
        clearPendingWord()
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setAuthError(signInError.message)
        setAuthLoading(false)
        submittedRef.current = false
        return
      }

      if (data.user) {
        await postPendingWord(supabase, data.user.id)
      }
    }

    setAuthLoading(false)
    submittedRef.current = false
  }

  const postPendingWord = async (supabase: ReturnType<typeof createClient>, userId: string) => {
    if (!pendingWord || !promptId) return

    const { error: insertError } = await supabase.from('words').insert({
      user_id: userId,
      word: pendingWord,
      prompt_id: promptId,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        toast('You already answered this prompt!')
      } else {
        toast(insertError.message, 'error')
      }
    } else {
      toast(`"${pendingWord}" — said.`)
    }

    clearPendingWord()
    setPosted(true)
    setShowSignup(false)
    router.refresh()
  }

  if (posted) {
    return (
      <div className="border-b border-zinc-800 p-4">
        {promptQuestion && (
          <div className="mb-3 text-center">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">Today&apos;s prompt</span>
            <p className="text-lg font-semibold text-purple-400 mt-1">{promptQuestion}</p>
          </div>
        )}
        <div className="text-center py-3">
          <p className="text-zinc-400 text-sm">Welcome to OneWord! 🎉</p>
          <p className="text-zinc-600 text-xs mt-1">Come back tomorrow for a new prompt.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-zinc-800 p-4">
      {promptQuestion && (
        <div className="mb-3 text-center">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Today&apos;s prompt</span>
          <p className="text-lg font-semibold text-purple-400 mt-1">{promptQuestion}</p>
        </div>
      )}

      {!showSignup ? (
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
            disabled={!word.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold px-6 py-3 rounded-full transition-colors"
          >
            Say
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Show their word */}
          <div className="text-center">
            <p className="text-3xl font-bold">{pendingWord}</p>
            <p className="text-zinc-500 text-sm mt-2">Sign up to save your answer & start a streak 🔥</p>
          </div>

          {/* Auth form */}
          <form onSubmit={handleAuth} className="space-y-3">
            {authView === 'signUp' && (
              <input
                type="text"
                placeholder="Pick a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              required
              minLength={6}
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 py-2.5 rounded-lg font-semibold transition-colors"
            >
              {authLoading
                ? 'Saving...'
                : authView === 'signUp'
                  ? 'Create account & post'
                  : 'Sign in & post'}
            </button>
          </form>

          <p className="text-sm text-zinc-400 text-center">
            {authView === 'signUp' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setAuthView(authView === 'signUp' ? 'signIn' : 'signUp')
                setAuthError(null)
              }}
              className="text-purple-400 hover:underline"
            >
              {authView === 'signUp' ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          <button
            onClick={() => {
              setShowSignup(false)
              setPendingWord(null)
              clearPendingWord()
            }}
            className="w-full text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Skip — just browsing
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
    </div>
  )
}
