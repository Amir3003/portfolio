import { NextResponse } from 'next/server'
import { getMeta } from '@/lib/voyage/recommend'
import type { VoyageMeta } from '@/lib/voyage/types'

/** GET /api/voyage/meta - catalog facts (destinations, board types, amenities). */
export function GET(): NextResponse<VoyageMeta> {
  return NextResponse.json(getMeta())
}

