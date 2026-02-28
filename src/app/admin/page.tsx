import { requireAdmin } from '@/lib/admin'
import Link from 'next/link'
import PromptManager from './PromptManager'
import Analytics from './Analytics'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin',
}

export default async function AdminPage() {
  const { supabase } = await requireAdmin()

  const [
    { data: prompts },
    { data: dailyActiveUsers },
    { data: postsPerPrompt },
    { data: mostReacted },
  ] = await Promise.all([
    supabase
      .from('prompts')
      .select('*')
      .order('active_date', { ascending: false }),
    supabase
      .from('analytics_daily_active_users')
      .select('*'),
    supabase
      .from('analytics_posts_per_prompt')
      .select('*'),
    supabase
      .from('analytics_most_reacted')
      .select('*'),
  ])

  return (
    <main className="max-w-2xl mx-auto min-h-screen p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">
          <span className="text-purple-400">Admin</span> Panel
        </h1>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Back to feed
        </Link>
      </div>

      {/* Analytics */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Analytics</h2>
        <Analytics
          dailyActiveUsers={dailyActiveUsers || []}
          postsPerPrompt={postsPerPrompt || []}
          mostReacted={mostReacted || []}
        />
      </section>

      {/* Prompt Management */}
      <section>
        <h2 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Prompt Management</h2>
        <PromptManager prompts={prompts || []} />
      </section>
    </main>
  )
}
