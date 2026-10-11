import { NextResponse } from 'next/server'
import { runAgentTurn, sanitizeSlots } from '@/lib/voyage/agent'
import type { AgentReply } from '@/lib/voyage/types'

export const dynamic = 'force-dynamic'

const MAX_MESSAGE_LENGTH = 500

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * POST /api/voyage/agent
 * Body: `{ message: string, slots?: Slots }`. The server is stateless: the client sends back the
 * `slots` it received in the previous reply (the Python service persisted these in SQLite).
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', message: 'Request body must be valid JSON.' }, { status: 400 })
  }
  if (!isRecord(body) || typeof body.message !== 'string') {
    return NextResponse.json({ status: 'error', message: '`message` must be a string.' }, { status: 422 })
  }

  const message = body.message.slice(0, MAX_MESSAGE_LENGTH)
  const slots = sanitizeSlots(body.slots)

  const started = performance.now()
  const turn = await runAgentTurn(slots, message)
  const reply: AgentReply = { ...turn, elapsedMs: Math.round((performance.now() - started) * 10) / 10 }
  return NextResponse.json(reply)
}

