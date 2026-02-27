'use client'

import { useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthButtonProps {
  user: { id: string; email?: string } | null
}

export default function AuthButton({ user }: AuthButtonProps) {
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username || `user_${Date.now().toString(36)}` },
        },
      })
      if (error) setError(error.message)
      else {
        setMessage('Check your email to confirm your account!')
        setShowLogin(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else {
        setShowLogin(false)
        router.refresh()
      }
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="text-sm text-zinc-400 hover:text-white transition-colors"
      >
        Sign out
      </button>
    )
  }

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
            <h2 className="text-xl font-bold mb-4">{isSignUp ? 'Create account' : 'Sign in'}</h2>
            <form onSubmit={handleAuth} className="space-y-3">
              {isSignUp && (
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
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {message && <p className="text-green-400 text-sm">{message}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 py-2 rounded-lg font-semibold transition-colors"
              >
                {loading ? '...' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>
            <p className="text-sm text-zinc-400 mt-3 text-center">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
                className="text-purple-400 hover:underline"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
            <button
              onClick={() => setShowLogin(false)}
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
