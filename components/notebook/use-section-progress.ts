'use client'

import { useMotionValue, type MotionValue } from 'framer-motion'
import { useEffect, type RefObject } from 'react'
import { subscribeScroll } from '@/lib/lenis'
import { clamp01 } from '@/components/notebook/timeline'

/**
 * 0 → 1 progress of a tall section while its sticky stage is pinned.
 * Driven by the Lenis scroll stream (see `lib/lenis.ts`), so it tracks the *smoothed* scroll
 * position exactly; falls back to native scroll events when Lenis is disabled.
 * Returns a MotionValue so consumers update without re-rendering React.
 */
export function useSectionProgress(ref: RefObject<HTMLElement | null>, enabled = true): MotionValue<number> {
  const progress = useMotionValue(0)

  useEffect(() => {
    if (!enabled) return
    const update = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const range = rect.height - window.innerHeight
      progress.set(range > 0 ? clamp01(-rect.top / range) : 0)
    }
    update()
    return subscribeScroll(update)
  }, [ref, progress, enabled])

  return progress
}

