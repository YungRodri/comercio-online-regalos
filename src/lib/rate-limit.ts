/**
 * Simple in-memory rate limiter.
 * Uses a sliding-window counter keyed by IP address.
 * NOT suitable for multi-instance deployments – use Redis there.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in seconds */
  windowSec: number
}

/**
 * Check whether a given key (e.g. IP address) has exceeded the rate limit.
 * Returns `{ allowed: true }` when the request should proceed,
 * or `{ allowed: false, retryAfter: number }` when it should be blocked.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const windowMs = options.windowSec * 1000

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= options.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count += 1
  return { allowed: true }
}

/**
 * Periodically purge expired entries to avoid memory leaks.
 * Guard against serverless environments where setInterval may not
 * be reliable – the cleanup is a best-effort optimisation only.
 */
if (
  typeof setInterval !== "undefined" &&
  typeof process !== "undefined" &&
  process.env.NODE_ENV !== "test"
) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key)
      }
    }
  }, 60_000).unref?.()
}
