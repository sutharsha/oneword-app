import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFeedData, normalizeFilter } from '@/lib/feed'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filter = normalizeFilter(searchParams.get('filter'))
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const data = await getFeedData({ filter, user })

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=15',
    },
  })
}
