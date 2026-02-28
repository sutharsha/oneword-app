'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface PostWordProps {
  userId: string
  promptId: string | null
  promptQuestion: string | null
}

export default function PostWord({ userId, promptId, promptQuestion }: PostWordProps) {
  const [word, setWord] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const router = useRouter()

  const validate = (input: string): string | null => {
    const trimmed = input.trim()
    if (!trimmed) return 'Say something.'
    if (trimmed.includes(' ')) return 'One word only.'
    if (trimmed.length > 45) return 'Too long.'
    if (!/^[a-zA-Z'\-]+$/.test(trimmed)) return 'Letters only.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = word.trim().toLowerCase()
    const validationError = validate(trimmed)
    if (validationError) {
      setError(validationError)
      return
    }

    setPosting(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('words').insert({
      user_id: userId,
      word: trimmed,
      prompt_id: promptId,
    })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('You already posted today.')
      } else {
        setError(insertError.message)
      }
      setPosting(false)
      return
    }

    setWord('')
    setPosting(false)
    try {
      router.refresh()
    } catch {
      // Refresh failed — post was saved, page will update on next load
    }
  }

  return (
    <div className="border-b border-zinc-800 p-4">
      {promptQuestion && (
        <div className="mb-3 text-center">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Today&apos;s prompt</span>
          <p className="text-lg font-semibold text-purple-400 mt-1">{promptQuestion}</p>
        </div>
      )}
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
      {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
    </div>
  )
}
