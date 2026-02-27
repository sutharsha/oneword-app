'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setHasSession(!!user)
      setSessionChecked(true)
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (!sessionChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </main>
    )
  }

  if (!hasSession) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm text-center">
          <h1 className="text-xl font-bold mb-3">Invalid or expired link</h1>
          <p className="text-sm text-zinc-400 mb-4">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-600 hover:bg-purple-500 py-2 px-6 rounded-lg font-semibold transition-colors"
          >
            Go home
          </button>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm text-center">
          <h1 className="text-xl font-bold mb-3">Password updated</h1>
          <p className="text-sm text-zinc-400">Redirecting you home...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">Set new password</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
            required
            minLength={6}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 py-2 rounded-lg font-semibold transition-colors"
          >
            {loading ? '...' : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  )
}
