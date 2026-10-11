'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'
import { setLenis } from '@/lib/lenis'

/**
 * Enables inertial smooth scrolling via Lenis for the whole app.
 * - Drives Lenis from a single requestAnimationFrame loop.
 * - Disabled entirely when the user prefers reduced motion (and reacts to changes live).
 * - Nested scroll containers (e.g. the terminal) opt out with `data-lenis-prevent`.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lenis: Lenis | null = null
    let rafId = 0

    const raf = (time: number) => {
      lenis?.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    const start = () => {
      if (lenis) return
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        anchors: true,
      })
      setLenis(lenis)
      rafId = requestAnimationFrame(raf)
    }

    const stop = () => {
      cancelAnimationFrame(rafId)
      lenis?.destroy()
      lenis = null
      setLenis(null)
    }

    const sync = () => (mql.matches ? stop() : start())
    sync()
    mql.addEventListener('change', sync)

    return () => {
      mql.removeEventListener('change', sync)
      stop()
    }
  }, [])

  return <>{children}</>
}

