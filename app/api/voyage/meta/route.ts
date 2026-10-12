import { NextResponse } from 'next/server'
import { getMeta } from '@/lib/voyage/recommend'
import { guard } from '@/lib/security/request'
import type { VoyageMeta } from '@/lib/voyage/types'

/** GET /api/voyage/meta - catalog facts (destinations, board types, amenities). Rate limited. */
export function GET(request: Request): NextResponse<VoyageMeta> | NextResponse {
  const gate = guard(request, 'voyage-meta', 60, 60_000, false)
  if (!gate.ok) return gate.response
  return NextResponse.json(getMeta(), { headers: { 'Cache-Control': 'public, max-age=300' } })
}
