import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRateLimiter } from './rate-limit'

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows actions within the limit', () => {
    const limiter = createRateLimiter(3, 60_000)
    expect(limiter.check()).toBe(true)
    expect(limiter.check()).toBe(true)
    expect(limiter.check()).toBe(true)
  })

  it('blocks actions beyond the limit', () => {
    const limiter = createRateLimiter(2, 60_000)
    expect(limiter.check()).toBe(true)
    expect(limiter.check()).toBe(true)
    expect(limiter.check()).toBe(false)
  })

  it('allows actions again after the window expires', () => {
    const limiter = createRateLimiter(1, 1_000)
    expect(limiter.check()).toBe(true)
    expect(limiter.check()).toBe(false)

    vi.advanceTimersByTime(1_000)
    expect(limiter.check()).toBe(true)
  })

  it('retryAfter returns 0 when not rate-limited', () => {
    const limiter = createRateLimiter(3, 60_000)
    expect(limiter.retryAfter()).toBe(0)
  })

  it('retryAfter returns seconds until next allowed action', () => {
    const limiter = createRateLimiter(1, 10_000)
    limiter.check()
    // Right after hitting the limit, retryAfter should be ~10s
    expect(limiter.retryAfter()).toBe(10)
  })

  it('retryAfter decreases as time passes', () => {
    const limiter = createRateLimiter(1, 10_000)
    limiter.check()

    vi.advanceTimersByTime(5_000)
    expect(limiter.retryAfter()).toBe(5)
  })
})
