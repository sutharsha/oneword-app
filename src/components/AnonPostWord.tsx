'use client'

import { useState, useRef } from 'react'
import { validateWord } from '@/lib/validation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import Link from 'next/link'

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
            disabled={!word.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold px-6 py-3 rounded-full transition-colors"
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

          {/* Google sign-in */}
          <button
            onClick={async () => {
              const supabase = createClient()
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              })
              if (error) setAuthError(error.message)
            }}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 disabled:bg-zinc-700 disabled:text-zinc-500 py-2.5 rounded-lg font-semibold transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google & post
          </button>
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 border-t border-zinc-700"></div>
            <span className="text-xs text-zinc-500">or</span>
            <div className="flex-1 border-t border-zinc-700"></div>
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

          <p className="text-xs text-zinc-500 text-center">
            By signing up, you confirm you are at least 13 years old and agree to our{' '}
            <Link href="/terms" className="text-purple-400 hover:underline" target="_blank">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-purple-400 hover:underline" target="_blank">Privacy Policy</Link>.
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
