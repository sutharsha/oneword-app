'use client'

interface DailyActiveUsers {
  day: string
  active_users: number
}

interface PostsPerPrompt {
  prompt_id: string
  question: string
  active_date: string
  post_count: number
}

interface MostReacted {
  word_id: string
  word: string
  username: string
  prompt_question: string | null
  reaction_count: number
}

interface AnalyticsProps {
  dailyActiveUsers: DailyActiveUsers[]
  postsPerPrompt: PostsPerPrompt[]
  mostReacted: MostReacted[]
}

export default function Analytics({ dailyActiveUsers, postsPerPrompt, mostReacted }: AnalyticsProps) {
  const todayDAU = dailyActiveUsers[0]?.active_users || 0
  const totalPosts = postsPerPrompt.reduce((sum, p) => sum + p.post_count, 0)
  const avgPostsPerPrompt = postsPerPrompt.length
    ? Math.round(totalPosts / postsPerPrompt.length)
    : 0

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{todayDAU}</p>
          <p className="text-xs text-zinc-500 mt-1">Active today</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{totalPosts}</p>
          <p className="text-xs text-zinc-500 mt-1">Total posts</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{avgPostsPerPrompt}</p>
          <p className="text-xs text-zinc-500 mt-1">Avg per prompt</p>
        </div>
      </div>

      {/* Daily Active Users */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Daily Active Users (last 30 days)
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {dailyActiveUsers.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {dailyActiveUsers.slice(0, 14).map((row) => {
                const maxUsers = Math.max(...dailyActiveUsers.map((d) => d.active_users))
                const barWidth = maxUsers > 0 ? (row.active_users / maxUsers) * 100 : 0
                return (
                  <div key={row.day} className="flex items-center gap-3 px-4 py-2">
                    <span className="text-xs text-zinc-500 w-24 shrink-0">{row.day}</span>
                    <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{row.active_users}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-6">No data yet.</p>
          )}
        </div>
      </section>

      {/* Posts Per Prompt */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Posts Per Prompt
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {postsPerPrompt.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {postsPerPrompt.slice(0, 10).map((row) => (
                <div key={row.prompt_id} className="px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{row.question}</p>
                    <p className="text-xs text-zinc-500">{row.active_date}</p>
                  </div>
                  <span className="text-sm font-bold text-purple-400 ml-3">{row.post_count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-6">No prompts yet.</p>
          )}
        </div>
      </section>

      {/* Most Reacted Words */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Most Reacted Words
        </h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {mostReacted.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {mostReacted.slice(0, 10).map((row, i) => (
                <div key={row.word_id} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs text-zinc-600 w-5">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold">{row.word}</p>
                    <p className="text-xs text-zinc-500">
                      @{row.username}
                      {row.prompt_question && <span> &middot; {row.prompt_question}</span>}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-purple-400">{row.reaction_count} reactions</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm text-center py-6">No reactions yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
