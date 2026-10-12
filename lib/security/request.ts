import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rate-limit'

export interface ApiError {
  status: 'error'
  message: string
}

export function jsonError(message: string, status: number, headers?: Record<string, string>): NextResponse<ApiError> {
  return NextResponse.json({ status: 'error', message }, { status, headers })
}

/**
 * Client IP as seen by the platform proxy. On Vercel `x-forwarded-for` is overwritten by the
 * edge, so its first entry is trustworthy. Behind your own proxy, make sure it strips
 * client-supplied values before trusting this.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Same-origin guard for state-changing requests (CSRF defence, and the CORS policy: this API
 * is not meant to be called from other sites, so cross-origin browsers requests are refused).
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) {
    // Non-browser clients send no Origin. Browsers always do on cross-site POSTs.
    return request.headers.get('sec-fetch-site') !== 'cross-site'
  }
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export type Guard = { ok: true } | { ok: false; response: NextResponse<ApiError> }

/** Origin check plus per-IP rate limit. `scope` namespaces the counter per endpoint. */
export function guard(request: Request, scope: string, limit: number, windowMs: number, requireSameOrigin: boolean): Guard {
  if (requireSameOrigin && !isSameOrigin(request)) {
    return { ok: false, response: jsonError('Cross-origin requests are not allowed.', 403) }
  }
  const result = rateLimit(`${scope}:${clientIp(request)}`, limit, windowMs)
  if (!result.ok) {
    return {
      ok: false,
      response: jsonError('Too many requests. Please slow down.', 429, {
        'Retry-After': String(result.retryAfterSeconds),
      }),
    }
  }
  return { ok: true }
}

/** Reads a JSON body with a hard byte cap. Returns null when invalid, wrong type or too large. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown | null> {
  const type = request.headers.get('content-type') ?? ''
  if (!type.toLowerCase().startsWith('application/json')) return null
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > maxBytes) return null
  const text = await request.text()
  if (new TextEncoder().encode(text).length > maxBytes) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Strips control characters and collapses whitespace. Output encoding stays React's job. */
export function cleanText(value: string, maxLength: number): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}
