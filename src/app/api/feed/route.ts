import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFeedData, getTodaysPrompt, normalizeFilter } from '@/lib/feed'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = normalizeFilter(searchParams.get('filter'))
  const supabase = await createClient()

  const [{ data: { user } }, todaysPrompt] = await Promise.all([
    supabase.auth.getUser(),
    getTodaysPrompt(),
  ])

  const data = await getFeedData({ filter, user, todaysPrompt })

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=15',
    },
  })
}
