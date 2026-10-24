'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'
import { emitScroll, setLenis } from '@/lib/lenis'

/**
 * Enables inertial smooth scrolling via Lenis for the whole app.
 * - Drives Lenis from a single requestAnimationFrame loop.
 * - Disabled entirely when the user prefers reduced motion (and reacts to changes live).
 * - Nested scroll containers (e.g. the terminal) opt out with `data-lenis-prevent`.
 * - Broadcasts every scroll tick through `subscribeScroll` (Lenis events, or native scroll events
 *   when Lenis is off) so scroll-driven scenes stay in lockstep with the smoothed position.
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

    const onNativeScroll = () => emitScroll()
    const onResize = () => emitScroll()

    const start = () => {
      if (lenis) return
      window.removeEventListener('scroll', onNativeScroll)
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // Touch screens (phones, iPad) always scroll natively: Lenis never hijacks a finger.
        syncTouch: false,
        anchors: true,
      })
      lenis.on('scroll', emitScroll)
      setLenis(lenis)
      rafId = requestAnimationFrame(raf)
      emitScroll()
    }

    const stop = () => {
      cancelAnimationFrame(rafId)
      lenis?.destroy()
      lenis = null
      setLenis(null)
    }

    const sync = () => {
      if (mql.matches) {
        stop()
        window.addEventListener('scroll', onNativeScroll, { passive: true })
        emitScroll()
      } else {
        start()
      }
    }
    sync()
    mql.addEventListener('change', sync)
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      mql.removeEventListener('change', sync)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onNativeScroll)
      stop()
    }
  }, [])

  return <>{children}</>
}
