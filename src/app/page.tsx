import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import DailyRecap from '@/components/DailyRecap'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import FeedTabs from '@/components/FeedTabs'
import { getFeedData, getTodaysPrompt, normalizeFilter } from '@/lib/feed'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const todaysPrompt = await getTodaysPrompt()

  const ogImage = todaysPrompt
    ? `/api/og/${todaysPrompt.id}`
    : undefined

  return {
    title: 'OneWord — Say one word.',
    description: 'A social feed where you can only say one word. Answer the daily prompt with a single word and react to others.',
    openGraph: {
      title: 'OneWord — Say one word.',
      description: 'A social feed where you can only say one word.',
      type: 'website',
      siteName: 'OneWord',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'OneWord — Say one word.',
      description: 'A social feed where you can only say one word.',
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const filter = normalizeFilter(params.filter)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [feedData, { count: unreadCount }, { data: profile }] = await Promise.all([
    getFeedData({ filter, user }),
    user
      ? supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false)
      : Promise.resolve({ count: 0 }),
    user
      ? supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const isAdmin = profile?.is_admin || false

  return (
    <main className="max-w-lg mx-auto min-h-screen border-x border-zinc-800">
      <Header
        user={user ? { id: user.id, email: user.email } : null}
        unreadNotifications={unreadCount || 0}
        isAdmin={isAdmin}
      />

      {filter === 'today' && (
        <Suspense fallback={null}>
          <DailyRecap />
        </Suspense>
      )}

      <FeedTabs initialData={feedData} />

      <Footer />
    </main>
  )
}
