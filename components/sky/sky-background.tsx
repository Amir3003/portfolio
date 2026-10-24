'use client'

import { useEffect, useRef } from 'react'
import { subscribeScroll } from '@/lib/lenis'
import { initSky, type SkyHandle } from '@/components/sky/sky-engine'
import './sky.css'

/**
 * The scroll is the flight. Keyframes in document px -> time of day:
 *   top of page / hero ............ 0    (day over Astana)
 *   ticket gone, laptop story ..... 0 -> 0.5
 *   Voyage AI panel ............... 0.5  (golden hour)
 *   Projects section .............. ~0.78 (dusk) -> 1
 *   Contact and footer ............ 1    (night over Tokyo), reached at the latest at the very bottom
 */
type Key = readonly [y: number, t: number]

const docTop = (el: Element | null): number | null =>
  el ? el.getBoundingClientRect().top + window.scrollY : null

function measure(): Key[] {
  const vh = window.innerHeight
  const max = Math.max(1, document.documentElement.scrollHeight - vh)
  const keys: Array<[number, number]> = []
  const hero = document.querySelector('[data-hero]')
  const heroEnd = hero ? hero.getBoundingClientRect().bottom + window.scrollY - vh * 0.5 : 0
  keys.push([Math.max(0, heroEnd), 0])
  const voyage = docTop(document.getElementById('voyage'))
  if (voyage != null) keys.push([voyage, 0.5])
  const projects = docTop(document.getElementById('projects'))
  if (projects != null) keys.push([projects - vh * 0.6, 0.78])
  const contact = docTop(document.getElementById('contact'))
  keys.push([contact != null ? Math.min(max, contact - vh * 0.4) : max, 1])
  // Monotonic in both y and t, and never past the bottom so t is exactly 1 there.
  const out: Array<[number, number]> = []
  for (const [y, t] of keys) {
    const prev = out[out.length - 1]
    const yy = Math.min(max, prev ? Math.max(y, prev[0] + 1) : y)
    if (prev && (yy <= prev[0] || t < prev[1])) continue
    out.push([yy, t])
  }
  const last = out[out.length - 1]
  if (!last || last[1] < 1) out.push([max, 1])
  return out
}

function timeAt(y: number, keys: Key[]): number {
  if (y <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [y1, t1] = keys[i]
    if (y <= y1) {
      const [y0, t0] = keys[i - 1]
      return t0 + (t1 - t0) * ((y - y0) / Math.max(1, y1 - y0))
    }
  }
  return 1
}

/**
 * The animated sky, fixed behind the page (z-index 0, content sits above it).
 * The sky engine is a plain DOM module; this wrapper mounts it once and feeds it the time of day
 * from the scroll stream (Lenis or native), written from requestAnimationFrame: no React renders.
 * Inner pages pass `fixedTime` for one calm time of day with no scroll binding.
 */
export function SkyBackground({ fixedTime }: { fixedTime?: number } = {}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const sky: SkyHandle = initSky(el)
    if (fixedTime !== undefined) {
      sky.setTime?.(fixedTime)
      return () => sky.destroy()
    }
    let keys: Key[] | null = null
    let raf = 0
    let last = -1

    const update = () => {
      raf = 0
      if (!keys) keys = measure()
      const t = Math.min(1, Math.max(0, timeAt(window.scrollY, keys)))
      if (Math.abs(t - last) < 1e-4) return
      last = t
      sky.setTime?.(t)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const remeasure = () => {
      keys = null
      last = -1
      schedule()
    }

    // iOS Safari fires `resize` whenever the toolbar shows or hides during a scroll. Only a
    // real resize (width, or a large height change such as rotation) re-measures the keys,
    // otherwise the time of day would jump mid-swipe. Content changes come via the observer.
    let lastW = window.innerWidth
    let lastH = window.innerHeight
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      if (w === lastW && Math.abs(h - lastH) < lastH * 0.2) return
      lastW = w
      lastH = h
      remeasure()
    }

    const unsubscribe = subscribeScroll(schedule)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(remeasure)
    ro?.observe(document.body)
    schedule()

    return () => {
      unsubscribe()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
      cancelAnimationFrame(raf)
      sky.destroy()
    }
  }, [fixedTime])

  return <div ref={ref} className="sky" aria-hidden="true" />
}
