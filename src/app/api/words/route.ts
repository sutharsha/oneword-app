import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateWord } from '@/lib/validation'
import { extractIP, resolveIP } from '@/lib/geoip'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, prompt_id } = body

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 })
    }

    const trimmed = word.trim().toLowerCase()
    const validationError = validateWord(trimmed)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (!prompt_id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }

    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract and resolve IP (non-blocking — word posts even if geo fails)
    const ip = extractIP(request.headers)
    let geo = null
    try {
      if (ip) {
        geo = await resolveIP(ip)
      }
    } catch (geoError) {
      console.error('GeoIP lookup failed (non-fatal):', geoError)
      // Continue without geo data — the word still gets posted
    }

    // Insert the word with location data
    const insertData: Record<string, unknown> = {
      user_id: user.id,
      word: trimmed,
      prompt_id,
      ip_address: ip,
      latitude: geo?.latitude || null,
      longitude: geo?.longitude || null,
      city: geo?.city || null,
      country_code: geo?.country_code || null,
    }

    const { data: insertedWord, error: insertError } = await supabase
      .from('words')
      .insert(insertData)
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'You already answered this prompt.' }, { status: 409 })
      }
      console.error('Word insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      id: insertedWord?.id,
      location: geo ? { city: geo.city, country_code: geo.country_code } : null,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
