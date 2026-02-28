'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Prompt } from '@/lib/types'

export default function PromptManager({ prompts }: { prompts: Prompt[] }) {
  const [question, setQuestion] = useState('')
  const [activeDate, setActiveDate] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !activeDate) return

    setSaving(true)
    setError(null)
    const supabase = createClient()

    const { error: insertError } = await supabase.from('prompts').insert({
      question: question.trim(),
      active_date: activeDate,
    })

    if (insertError) {
      setError(insertError.message.includes('unique')
        ? 'A prompt already exists for that date.'
        : insertError.message)
      setSaving(false)
      return
    }

    setQuestion('')
    setActiveDate('')
    setSaving(false)
    router.refresh()
  }

  const handleEdit = async (id: string) => {
    if (!editQuestion.trim() || !editDate) return

    setSaving(true)
    setError(null)
    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('prompts')
      .update({ question: editQuestion.trim(), active_date: editDate })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message.includes('unique')
        ? 'A prompt already exists for that date.'
        : updateError.message)
      setSaving(false)
      return
    }

    setEditingId(null)
    setSaving(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('prompts').delete().eq('id', id)
    setSaving(false)
    router.refresh()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Create Prompt */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Create Prompt</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What's your prompt question?"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
          />
          <div className="flex gap-3">
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 [color-scheme:dark]"
            />
            <button
              type="submit"
              disabled={saving || !question.trim() || !activeDate}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
            >
              {saving ? '...' : 'Create'}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {/* Prompt List */}
      <section>
        <h2 className="text-lg font-semibold mb-4">All Prompts ({prompts.length})</h2>
        <div className="space-y-2">
          {prompts.map((prompt) => {
            const isFuture = prompt.active_date > today
            const isToday = prompt.active_date === today
            const isEditing = editingId === prompt.id

            return (
              <div
                key={prompt.id}
                className={`border rounded-lg p-4 ${
                  isToday
                    ? 'border-purple-500 bg-purple-500/5'
                    : isFuture
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-zinc-800'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                      />
                      <button
                        onClick={() => handleEdit(prompt.id)}
                        disabled={saving}
                        className="text-xs px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{prompt.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500">{prompt.active_date}</span>
                        {isToday && (
                          <span className="text-xs text-purple-400 font-medium">Active today</span>
                        )}
                        {isFuture && (
                          <span className="text-xs text-blue-400 font-medium">Scheduled</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(prompt.id)
                          setEditQuestion(prompt.question)
                          setEditDate(prompt.active_date)
                        }}
                        className="text-xs px-2 py-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        disabled={saving}
                        className="text-xs px-2 py-1 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {prompts.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-8">
              No prompts yet. Create one above.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
