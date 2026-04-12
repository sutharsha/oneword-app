import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import WordMap from '@/components/WordMap'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Word Map',
  description: 'See where in the world people are posting their words on OneWord.',
}

export default async function MapPage() {
  const supabase = await createClient()

  // Get user info for header
  const { data: { user } } = await supabase.auth.getUser()
  let unreadCount = 0
  let isAdmin = false
  if (user) {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)
    unreadCount = count || 0
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin || false
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: words } = await supabase
    .from('words')
    .select('word, city, country_code, latitude, longitude, created_at')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(500)

  const pins = (words ?? []).map((w) => ({
    word: w.word,
    city: w.city,
    country_code: w.country_code,
    latitude: w.latitude as number,
    longitude: w.longitude as number,
  }))

  return (
    <main className="max-w-5xl mx-auto min-h-screen border-x border-zinc-800">
      <Header
        user={user ? { id: user.id, email: user.email } : null}
        unreadNotifications={unreadCount}
        isAdmin={isAdmin}
      />
      <div className="px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            🗺️ Word Map
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Words posted in the last 7 days, plotted by location.
            {pins.length > 0 && (
              <span className="ml-1 text-purple-400">{pins.length} word{pins.length !== 1 ? 's' : ''} on the map.</span>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <WordMap pins={pins} />
        </div>
      </div>
    </main>
  )
}
