import { NextResponse } from 'next/server'
import { runAgentTurn, sanitizeSlots } from '@/lib/voyage/agent'
import { cleanText, guard, isRecord, jsonError, readJson } from '@/lib/security/request'
import type { AgentReply, Lang } from '@/lib/voyage/types'

export const dynamic = 'force-dynamic'

const MAX_MESSAGE_LENGTH = 500
const MAX_BODY_BYTES = 8 * 1024
const LIMIT = 20
const WINDOW_MS = 60_000
const CYRILLIC = /[а-яёА-ЯЁ]/

/** Explicit `lang` wins (as in the Python `main.py`); otherwise Cyrillic script means Russian. */
function resolveLang(value: unknown, message: string): Lang {
  if (value === 'ru' || value === 'en') return value
  return CYRILLIC.test(message) ? 'ru' : 'en'
}

/**
 * POST /api/voyage/agent
 * Body: `{ message: string, slots?: Slots, lang?: 'en' | 'ru' }`. Stateless: the client returns the `slots` it was
 * given. Nothing is stored. Same-origin only, rate limited, body size capped.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const gate = guard(request, 'voyage-agent', LIMIT, WINDOW_MS, true)
  if (!gate.ok) return gate.response

  const body = await readJson(request, MAX_BODY_BYTES)
  if (!isRecord(body) || typeof body.message !== 'string') {
    const ru = isRecord(body) && body.lang === 'ru'
    return jsonError(ru ? 'Запрос должен быть JSON со строковым полем `message`.' : 'Request must be JSON with a string `message`.', 422)
  }

  const message = cleanText(body.message, MAX_MESSAGE_LENGTH)
  const lang = resolveLang(body.lang, message)
  if (!message) return jsonError(lang === 'ru' ? 'Поле `message` не должно быть пустым.' : '`message` must not be empty.', 422)

  const slots = sanitizeSlots(body.slots)

  const started = performance.now()
  const turn = await runAgentTurn(slots, message, lang)
  const reply: AgentReply = { ...turn, elapsedMs: Math.round((performance.now() - started) * 10) / 10 }
  return NextResponse.json(reply, { headers: { 'Cache-Control': 'no-store' } })
}
