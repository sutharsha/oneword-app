import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Prompt Archive',
}

export default async function PromptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get unread notification count
  let unreadCount = 0
  if (user) {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    unreadCount = count || 0
  }

  // Fetch all prompts
  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, question, active_date')
    .order('active_date', { ascending: false })

  // Get word counts per prompt
  const promptIds = prompts?.map((p) => p.id) || []
  const { data: wordCounts } = promptIds.length
    ? await supabase
        .from('words')
        .select('prompt_id')
        .in('prompt_id', promptIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  wordCounts?.forEach((w) => {
    if (w.prompt_id) {
      countMap[w.prompt_id] = (countMap[w.prompt_id] || 0) + 1
    }
  })

  const today = new Date().toISOString().split('T')[0]

  return (
    <main className="max-w-lg mx-auto min-h-screen border-x border-zinc-800">
      <Header user={user ? { id: user.id, email: user.email } : null} unreadNotifications={unreadCount} />

      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-bold">Prompt Archive</h2>
        <p className="text-sm text-zinc-500 mt-1">Browse past prompts and see what people answered.</p>
      </div>

      <div>
        {prompts && prompts.length > 0 ? (
          prompts.map((prompt) => {
            const isToday = prompt.active_date === today
            const isFuture = prompt.active_date > today
            const count = countMap[prompt.id] || 0

            return (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.id}`}
                className="block border-b border-zinc-800 px-4 py-4 hover:bg-zinc-950 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg">{prompt.question}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-zinc-500">
                        {format(new Date(prompt.active_date + 'T00:00:00'), 'MMM d, yyyy')}
                      </span>
                      {isToday && (
                        <span className="text-xs text-purple-400 font-medium">Today</span>
                      )}
                      {isFuture && (
                        <span className="text-xs text-zinc-600 font-medium">Upcoming</span>
                      )}
                      {!isFuture && (
                        <span className="text-xs text-zinc-500">
                          {count} {count === 1 ? 'answer' : 'answers'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-zinc-600 text-sm mt-1">&rsaquo;</span>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="p-8 text-center text-zinc-500">
            <p className="text-lg font-semibold">No prompts yet.</p>
          </div>
        )}
      </div>
    </main>
  )
}
