/**
 * Simple client-side rate limiter.
 * Tracks timestamps of recent actions and rejects if too many in the window.
 */
export function createRateLimiter(maxActions: number, windowMs: number) {
  const timestamps: number[] = []

  return {
    /** Returns true if the action is allowed, false if rate-limited. */
    check(): boolean {
      const now = Date.now()
      // Remove expired timestamps
      while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
        timestamps.shift()
      }
      if (timestamps.length >= maxActions) {
        return false
      }
      timestamps.push(now)
      return true
    },

    /** Seconds until the next action is allowed (0 if allowed now). */
    retryAfter(): number {
      const now = Date.now()
      while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
        timestamps.shift()
      }
      if (timestamps.length < maxActions) return 0
      return Math.ceil((timestamps[0] + windowMs - now) / 1000)
    },
  }
}
