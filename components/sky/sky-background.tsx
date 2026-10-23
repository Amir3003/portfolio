'use client'

import { useEffect, useRef } from 'react'
import { subscribeScroll } from '@/lib/lenis'
import { initSky, type SkyHandle } from '@/components/sky/sky-engine'
import './sky.css'

/**
 * Scroll positions (document px) where the sky reaches each time of day.
 * The flight: day over the hero, golden hour at the Voyage AI panel, night by QADAM and Contact.
 */
interface Keys {
  start: number
  voyage: number
  qadam: number
}

const docTop = (el: Element | null): number | null =>
  el ? el.getBoundingClientRect().top + window.scrollY : null

function measure(): Keys | null {
  const hero = document.querySelector('[data-hero]')
  const voyage = docTop(document.getElementById('voyage'))
  const qadam = docTop(document.getElementById('qadam'))
  if (!hero || voyage == null || qadam == null) return null
  const r = hero.getBoundingClientRect()
  // Day until the torn ticket has left the screen.
  const start = r.bottom + window.scrollY - window.innerHeight * 0.5
  return { start, voyage, qadam: Math.max(qadam, voyage + 1) }
}

const smooth = (x: number): number => x * x * (3 - 2 * x)

function timeAt(y: number, k: Keys): number {
  if (y <= k.start) return 0
  if (y <= k.voyage) return 0.5 * smooth((y - k.start) / Math.max(1, k.voyage - k.start))
  if (y <= k.qadam) return 0.5 + 0.5 * smooth((y - k.voyage) / Math.max(1, k.qadam - k.voyage))
  return 1
}

/**
 * The animated sky, fixed behind the whole home page (z-index 0, content sits above it).
 * The sky engine is a plain DOM module; this wrapper only mounts it once and feeds it the
 * time of day from the scroll stream, written from requestAnimationFrame (no React renders).
 */
export function SkyBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const sky: SkyHandle = initSky(el)
    let keys: Keys | null = null
    let raf = 0

    const update = () => {
      raf = 0
      if (!keys) keys = measure()
      if (!keys || !sky.setTime) return
      sky.setTime(timeAt(window.scrollY, keys))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const remeasure = () => {
      keys = null
      schedule()
    }

    const unsubscribe = subscribeScroll(schedule)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', remeasure, { passive: true })
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(remeasure)
    ro?.observe(document.body)
    schedule()

    return () => {
      unsubscribe()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', remeasure)
      ro?.disconnect()
      cancelAnimationFrame(raf)
      sky.destroy()
    }
  }, [])

  return <div ref={ref} className="sky" aria-hidden="true" />
}
