'use client'

import { useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AuthView = 'signIn' | 'signUp' | 'forgotPassword'

interface AuthButtonProps {
  user: { id: string; email?: string } | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [view, setView] = useState<AuthView>('signIn')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const router = useRouter()
  const supabase = createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

  const closeModal = () => {
    setShowLogin(false)
    setView('signIn')
    setError(null)
    setMessage(null)
  }

  const switchView = (newView: AuthView) => {
    setView(newView)
    setError(null)
    setMessage(null)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (view === 'signUp') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: { username: username || `user_${Date.now().toString(36)}` },
        },
      })
      if (error) setError(error.message)
      else {
        setMessage('Check your email to confirm your account!')
        closeModal()
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
        closeModal()
        router.refresh()
      }
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a password reset link.')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
    router.refresh()
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
      >
        {loading ? 'Signing out...' : 'Sign out'}
      </button>
    )
  }

  const title = view === 'signUp' ? 'Create account' : view === 'forgotPassword' ? 'Reset password' : 'Sign in'

  return (
    <>
      <button
        onClick={() => setShowLogin(true)}
        className="text-sm bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-full font-semibold transition-colors"
      >
        Sign in
      </button>

      {showLogin && mounted && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm my-auto relative">
            <h2 className="text-xl font-bold mb-4">{title}</h2>

            {view !== 'forgotPassword' && (
              <>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-zinc-900 disabled:bg-zinc-700 disabled:text-zinc-500 py-2.5 rounded-lg font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 border-t border-zinc-700"></div>
                  <span className="text-xs text-zinc-500">or</span>
                  <div className="flex-1 border-t border-zinc-700"></div>
                </div>
              </>
            )}

            {view === 'forgotPassword' ? (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  required
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {message && <p className="text-green-400 text-sm">{message}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 py-2 rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-3">
                {view === 'signUp' && (
                  <input
                    type="text"
                    placeholder="Username"
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
                {view === 'signIn' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => switchView('forgotPassword')}
                      className="text-sm text-purple-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {message && <p className="text-green-400 text-sm">{message}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 py-2 rounded-lg font-semibold transition-colors"
                >
                  {loading ? (view === 'signUp' ? 'Creating...' : 'Signing in...') : view === 'signUp' ? 'Create account' : 'Sign in'}
                </button>
              </form>
            )}

            <p className="text-sm text-zinc-400 mt-3 text-center">
              {view === 'forgotPassword' ? (
                <button
                  onClick={() => switchView('signIn')}
                  className="text-purple-400 hover:underline"
                >
                  Back to sign in
                </button>
              ) : (
                <>
                  {view === 'signUp' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    onClick={() => switchView(view === 'signUp' ? 'signIn' : 'signUp')}
                    className="text-purple-400 hover:underline"
                  >
                    {view === 'signUp' ? 'Sign in' : 'Sign up'}
                  </button>
                </>
              )}
            </p>
            <button
              onClick={closeModal}
              className="absolute top-3 right-4 text-zinc-400 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
