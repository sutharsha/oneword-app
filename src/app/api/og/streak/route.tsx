import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const username = searchParams.get('username') || 'anonymous'
  const streak = searchParams.get('streak') || '0'
  const longestStreak = searchParams.get('longestStreak') || null

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
            gap: '16px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '96px', lineHeight: 1 }}>🔥</span>

          <div
            style={{
              fontSize: '140px',
              fontWeight: 900,
              color: '#fb923c',
              lineHeight: 1,
              letterSpacing: '-4px',
            }}
          >
            {streak}
          </div>

          <div
            style={{
              fontSize: '36px',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            day streak
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 400,
              color: '#a855f7',
              marginTop: '8px',
            }}
          >
            @{username}
          </div>

          {longestStreak && Number(longestStreak) > Number(streak) && (
            <div
              style={{
                fontSize: '20px',
                color: '#71717a',
                marginTop: '4px',
              }}
            >
              Best: {longestStreak} days
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
