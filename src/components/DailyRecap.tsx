import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { startOfDay, subDays, format } from 'date-fns'

interface RecapData {
  topWord: { word: string; username: string; reactionCount: number } | null
  totalParticipants: number
  mostCommonWord: { word: string; count: number } | null
  promptQuestion: string | null
  promptId: string | null
}

async function getYesterdayRecap(): Promise<RecapData | null> {
  const supabase = await createClient()

  const yesterday = subDays(new Date(), 1)
  const yesterdayStart = startOfDay(yesterday).toISOString()
  const todayStart = startOfDay(new Date()).toISOString()

  // Get yesterday's prompt
  const { data: prompt } = await supabase
    .from('prompts')
    .select('id, question')
    .eq('active_date', format(yesterday, 'yyyy-MM-dd'))
    .maybeSingle()

  if (!prompt) return null

  // Get all words from yesterday's prompt
  const { data: words } = await supabase
    .from('words')
    .select('id, word, user_id, profiles (username)')
    .eq('prompt_id', prompt.id)
    .gte('created_at', yesterdayStart)
    .lt('created_at', todayStart)

  if (!words || words.length === 0) return null

  // Get reactions for yesterday's words
  const wordIds = words.map((w) => w.id)
  const { data: reactions } = await supabase
    .from('reactions')
    .select('word_id')
    .in('word_id', wordIds)

  // Count reactions per word
  const reactionCounts: Record<string, number> = {}
  reactions?.forEach((r) => {
    reactionCounts[r.word_id] = (reactionCounts[r.word_id] || 0) + 1
  })

  // Find top word by reactions
  let topWord: RecapData['topWord'] = null
  let maxReactions = 0
  words.forEach((w) => {
    const count = reactionCounts[w.id] || 0
    if (count > maxReactions) {
      maxReactions = count
      const profile = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles
      topWord = {
        word: w.word,
        username: profile?.username || 'anonymous',
        reactionCount: count,
      }
    }
  })

  // Find most common word
  const wordFrequency: Record<string, number> = {}
  words.forEach((w) => {
    const lower = w.word.toLowerCase()
    wordFrequency[lower] = (wordFrequency[lower] || 0) + 1
  })
  let mostCommonWord: RecapData['mostCommonWord'] = null
  let maxFreq = 1 // Only show if at least 2 people said the same word
  Object.entries(wordFrequency).forEach(([word, count]) => {
    if (count > maxFreq) {
      maxFreq = count
      mostCommonWord = { word, count }
    }
  })

  return {
    topWord,
    totalParticipants: words.length,
    mostCommonWord,
    promptQuestion: prompt.question,
    promptId: prompt.id,
  }
}

export default async function DailyRecap() {
  const recap = await getYesterdayRecap()

  if (!recap) return null

  return (
    <div className="border-b border-zinc-800 p-4 animate-fade-in">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Yesterday&apos;s Recap</span>
          {recap.promptId && (
            <Link
              href={`/prompts/${recap.promptId}`}
              className="ml-auto text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              View all
            </Link>
          )}
        </div>

        {recap.promptQuestion && (
          <p className="text-sm text-zinc-400 mb-3">&ldquo;{recap.promptQuestion}&rdquo;</p>
        )}

        <div className="grid grid-cols-3 gap-3 text-center">
          {/* Total participants */}
          <div>
            <p className="text-xl font-bold text-white">{recap.totalParticipants}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Answered</p>
          </div>

          {/* Top word */}
          {recap.topWord ? (
            <div>
              <p className="text-xl font-bold text-purple-400">{recap.topWord.word}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Top word</p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-bold text-zinc-600">—</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Top word</p>
            </div>
          )}

          {/* Most common word */}
          {recap.mostCommonWord ? (
            <div>
              <p className="text-xl font-bold text-white">{recap.mostCommonWord.word}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{recap.mostCommonWord.count}x said</p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-bold text-zinc-600">—</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Common</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
