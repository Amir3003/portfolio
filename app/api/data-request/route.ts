import { NextResponse } from 'next/server'
import { cleanText, guard, isRecord, jsonError, readJson } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 4 * 1024
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/
const KINDS = ['access', 'deletion', 'correction'] as const
type Kind = (typeof KINDS)[number]

const isKind = (v: unknown): v is Kind => typeof v === 'string' && (KINDS as readonly string[]).includes(v)

/**
 * POST /api/data-request
 * Accepts an access / deletion / correction request, validates it server-side and forwards it
 * to DATA_REQUEST_WEBHOOK_URL (server-only env var, never exposed to the browser). Nothing is
 * written to disk or a database. If the webhook is not configured the request is refused so a
 * visitor is never told a request was received when it was not.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const gate = guard(request, 'data-request', 3, 60 * 60_000, true)
  if (!gate.ok) return gate.response

  const body = await readJson(request, MAX_BODY_BYTES)
  if (!isRecord(body)) return jsonError('Invalid request.', 422)

  // Honeypot: real users never fill this hidden field.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ status: 'ok' })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!EMAIL.test(email) || email.length > 254) return jsonError('Enter a valid email address.', 422)
  if (!isKind(body.kind)) return jsonError('Choose a request type.', 422)
  if (body.consent !== true) return jsonError('You must confirm the consent statement.', 422)
  if (body.ageConfirmed !== true) return jsonError('You must confirm the age statement.', 422)
  const details = typeof body.details === 'string' ? cleanText(body.details, 1000) : ''

  const webhook = process.env.DATA_REQUEST_WEBHOOK_URL
  if (!webhook) {
    return jsonError('Requests are not available right now. Please contact the operator directly.', 503)
  }

  let url: URL
  try {
    url = new URL(webhook)
  } catch {
    return jsonError('Requests are not available right now. Please contact the operator directly.', 503)
  }
  if (url.protocol !== 'https:') {
    return jsonError('Requests are not available right now. Please contact the operator directly.', 503)
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Data request (${body.kind}) from ${email}${details ? `: ${details}` : ''}`,
        kind: body.kind,
        email,
        details,
        receivedAt: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return jsonError('Could not deliver the request. Please try again later.', 502)
  } catch {
    return jsonError('Could not deliver the request. Please try again later.', 502)
  }

  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
}
