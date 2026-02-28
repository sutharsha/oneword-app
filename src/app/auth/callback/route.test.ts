import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase server client
const mockExchangeCodeForSession = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}))

// We need to dynamically import the route after mocks are set up
import { GET } from './route'
import { NextRequest } from 'next/server'

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to / when code exchange succeeds and no next param', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const request = makeRequest('/auth/callback?code=valid-code')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/')
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code')
  })

  it('redirects to next param when code exchange succeeds', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const request = makeRequest('/auth/callback?code=valid-code&next=/profile/me')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/profile/me')
  })

  it('redirects to next on code exchange failure', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: new Error('invalid') })
    const request = makeRequest('/auth/callback?code=bad-code&next=/auth/reset-password')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/auth/reset-password')
  })

  it('redirects to / when no code is provided', async () => {
    const request = makeRequest('/auth/callback')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/')
  })

  it('redirects to / when code is missing and next is /', async () => {
    const request = makeRequest('/auth/callback?next=/')
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(new URL(response.headers.get('location')!).pathname).toBe('/')
  })
})
