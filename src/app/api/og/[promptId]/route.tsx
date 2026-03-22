import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  const { promptId } = await params
  const { searchParams } = request.nextUrl
  const word = searchParams.get('word') || null
  const username = searchParams.get('username') || null

  const supabase = await createClient()
  const { data: prompt } = await supabase
    .from('prompts')
    .select('question')
    .eq('id', promptId)
    .maybeSingle()

  const question = prompt?.question || 'Say one word.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 60%, #0a0a0a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Branding top-left */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '48px',
            display: 'flex',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          <span style={{ color: '#a855f7' }}>One</span>
          <span style={{ color: '#ffffff' }}>Word</span>
        </div>

        {/* Centered content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 80px',
            textAlign: 'center',
            gap: '20px',
          }}
        >
          <p
            style={{
              fontSize: word ? '32px' : '42px',
              fontWeight: 500,
              color: '#a1a1aa',
              margin: 0,
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            {question}
          </p>

          {word ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <p
                style={{
                  fontSize: '120px',
                  fontWeight: 900,
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: 1,
                  letterSpacing: '-3px',
                }}
              >
                {word}
              </p>
              {username && (
                <p
                  style={{
                    fontSize: '32px',
                    fontWeight: 400,
                    color: '#a855f7',
                    margin: 0,
                  }}
                >
                  — @{username}
                </p>
              )}
            </div>
          ) : (
            <p
              style={{
                fontSize: '56px',
                fontWeight: 700,
                color: '#a855f7',
                margin: 0,
                letterSpacing: '-1px',
              }}
            >
              Say one word.
            </p>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
