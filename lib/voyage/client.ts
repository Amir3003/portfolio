import type { AgentReply, Slots } from '@/lib/voyage/types'

function isAgentReply(value: unknown): value is AgentReply {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Partial<Record<keyof AgentReply, unknown>>
  return (
    (v.state === 'COMPLETE' || v.state === 'INCOMPLETE' || v.state === 'BUDGET_MISMATCH') &&
    typeof v.reply === 'string' &&
    Array.isArray(v.results) &&
    Array.isArray(v.missing) &&
    typeof v.slots === 'object' &&
    v.slots !== null
  )
}

/** Sends one conversational turn to the Voyage agent route. Throws on transport or shape errors. */
export async function postAgentTurn(message: string, slots: Slots, signal?: AbortSignal): Promise<AgentReply> {
  const response = await fetch('/api/voyage/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, slots }),
    signal,
  })
  if (!response.ok) throw new Error(`Voyage agent request failed (${response.status})`)
  const data: unknown = await response.json()
  if (!isAgentReply(data)) throw new Error('Unexpected response from the Voyage agent.')
  return data
}

