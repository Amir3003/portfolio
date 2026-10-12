'use client'

import { useMotionValue, type MotionValue } from 'framer-motion'
import { useEffect, type RefObject } from 'react'
import { subscribeScroll } from '@/lib/lenis'

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))

/**
 * 0 -> 1 progress of the tall laptop storytelling section while pinned.
 * Driven by the Lenis smooth scroll stream.
 */
export function useLaptopProgress(ref: RefObject<HTMLElement | null>, enabled = true): MotionValue<number> {
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

