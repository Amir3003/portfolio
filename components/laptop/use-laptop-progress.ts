'use client'

import { useMotionValue, type MotionValue } from 'framer-motion'
import { useEffect, type RefObject } from 'react'
import { subscribeScroll } from '@/lib/lenis'

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))

/**
 * 0 -> 1 progress of the tall laptop storytelling section while pinned.
 * Driven by the Lenis smooth scroll stream (native scroll events when Lenis is idle or off).
 *
 * The pinned length is measured against the sticky stage (`pinRef`, 100vh) rather than
 * `window.innerHeight`: on iOS Safari the latter changes while the toolbar collapses and
 * expands mid-scroll, which made the story jump.
 */
export function useLaptopProgress(
  ref: RefObject<HTMLElement | null>,
  enabled = true,
  pinRef?: RefObject<HTMLElement | null>,
): MotionValue<number> {
  const progress = useMotionValue(0)

  useEffect(() => {
    if (!enabled) return
    const update = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Tablets only: phones and desktops keep measuring against the window.
      const tablet = window.matchMedia('(pointer: coarse) and (min-width: 768px)').matches
      const pinH = (tablet && pinRef?.current?.offsetHeight) || window.innerHeight
      const range = rect.height - pinH
      progress.set(range > 0 ? clamp01(-rect.top / range) : 0)
    }
    update()
    return subscribeScroll(update)
  }, [ref, pinRef, progress, enabled])

  return progress
}

