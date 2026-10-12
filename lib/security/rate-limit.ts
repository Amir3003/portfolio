/**
 * Fixed-window rate limiter held in process memory.
 *
 * Good enough to stop casual abuse of a single instance. On serverless platforms every
 * instance has its own counter, so for hard guarantees put the same limits in front of the
 * app (Vercel WAF rate limiting, Cloudflare, or a shared store such as Redis/Upstash).
 */
interface Bucket {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSeconds: number
}

const buckets = new Map<string, Bucket>()
const MAX_TRACKED_KEYS = 10_000

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  // Hard cap: if an attacker rotates keys, drop the oldest entries instead of growing forever.
  if (buckets.size > MAX_TRACKED_KEYS) {
    const overflow = buckets.size - MAX_TRACKED_KEYS
    let dropped = 0
    for (const key of buckets.keys()) {
      buckets.delete(key)
      if (++dropped >= overflow) break
    }
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  if (buckets.size > MAX_TRACKED_KEYS / 2) sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }
  existing.count += 1
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
  return {
    ok: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds,
  }
}
