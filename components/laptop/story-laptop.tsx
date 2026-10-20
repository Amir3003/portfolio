'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useTransform } from 'framer-motion'
import type { ScreenRect } from '@/components/laptop/laptop-scene'
import { useLaptopProgress } from '@/components/laptop/use-laptop-progress'
import { VoyageDashboard } from '@/components/laptop/voyage-dashboard'

// WebGL scene, client only.
function SceneSkeleton() {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex items-end justify-center pb-40">
      <div className="h-56 w-[min(70vw,34rem)] animate-pulse border border-neutral-800 bg-neutral-900/60" />
    </div>
  )
}

const LaptopScene = dynamic(() => import('@/components/laptop/laptop-scene'), {
  ssr: false,
  loading: () => <SceneSkeleton />,
})

/* -------------------------------------------------------------------------- */
/*  Layout constants                                                          */
/* -------------------------------------------------------------------------- */

/** Cell size of the `bg-grid` utility in globals.css. */
const GRID_PX = 48
/** Gap between the chassis bottom and the scroll cue at 0% scroll, in grid cells. */
const GAP_CELLS = 1.5

/** Expanded dashboard geometry (CSS px). Leaves the header and a scroll band clear. */
const PANEL_MAX_WIDTH = 1440
const PANEL_MIN_HEIGHT = 360
/** Below this viewport width the panel uses the tighter phone geometry. */
const PANEL_NARROW = 640

function panelGeometry(vw: number) {
  return vw < PANEL_NARROW
    ? { gutter: 8, topClear: 60, bottomBand: 48 }
    : { gutter: 16, topClear: 84, bottomBand: 72 }
}

/* -------------------------------------------------------------------------- */
/*  Timeline helpers (progress 0 to 1 over the sticky section)                */
/* -------------------------------------------------------------------------- */

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x))
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** 0 = dashboard sits on the laptop display, 1 = fully expanded. */
const expandAmount = (p: number): number => smoothstep(0.76, 0.84, p) * (1 - smoothstep(0.9, 0.94, p))
/** Dashboard layer opacity: it appears as the display "switches on" and leaves as the lid closes. */
const panelOpacity = (p: number): number => smoothstep(0.745, 0.765, p) * (1 - smoothstep(0.93, 0.95, p))

const eventsFor = (v: number): 'auto' | 'none' => (v > 0.05 ? 'auto' : 'none')

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface Column {
  label: string
  title: string
  body: string
  tags: string
}

/** Content for the architecture stage, shared by the 3D story and the static fallback. */
const COLUMNS: readonly Column[] = [
  {
    label: 'AI & Machine Learning',
    title: 'Neural modeling and ranking',
    body: 'PyTorch tensor pipelines, loss convergence optimization, deep representations, embeddings and destination ranking.',
    tags: 'PyTorch, vector math, rank loss',
  },
  {
    label: 'Systems Engineering & Stack',
    title: 'Low-level stack and runtime',
    body: 'Go pointer mechanics, struct field padding, zero-alloc hot paths, escape analysis and SQLite WAL concurrent transactions.',
    tags: 'Go runtime, SQLite WAL, zero-alloc',
  },
  {
    label: 'Academic & Languages',
    title: 'Astana node and linguistics',
    body: 'Undergraduate in AI & Machine Learning based in Astana. Fluent in Russian and English. Targeting Japanese JLPT N2 (currently studying via Genki and Renshuu).',
    tags: 'RU native, EN fluent, Targeting JA JLPT N2',
  },
]

/** Profile copy, shared by the 3D story and the static fallback. */
const PROFILE = {
  school: 'QAIRU AI&ML',
  focus:
    'Interested in systems engineering, software development and the design of autonomous AI systems.',
  reading: 'Haruki Murakami, Stephen Hawking, Michio Kaku, basketball and Japanese.',
} as const

/**
 * Three columns, one ruled sheet: hairline dividers instead of three floating cards, no icons,
 * no blur. The columns still read left to right as AI, systems, academic.
 */
function SpecSheet({ id }: { id?: string }) {
  return (
    <div
      id={id}
      className="grid w-full grid-cols-1 divide-y divide-neutral-800 border-y border-neutral-700 bg-neutral-950/95 text-left md:grid-cols-3 md:divide-x md:divide-y-0"
    >
      {COLUMNS.map((c) => (
        <section key={c.label} className="flex flex-col gap-1 px-4 py-3 sm:gap-2 sm:p-6">
          <p className="font-mono text-[11px] text-lime-400 sm:text-xs">{c.label}</p>
          <h3 className="text-[15px] font-medium text-neutral-50 sm:text-lg">{c.title}</h3>
          <p className="text-[13px] leading-snug text-neutral-300 sm:text-[15px] sm:leading-relaxed">{c.body}</p>
          <p className="mt-auto pt-1 font-mono text-[11px] text-neutral-500 sm:pt-2 sm:text-xs">{c.tags}</p>
        </section>
      ))}
    </div>
  )
}

export function StoryLaptop() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  /** Distance from the viewport bottom to the chassis bottom edge at 0% scroll. */
  const bottomInsetRef = useRef<number>(140)
  /** Written by the WebGL scene every frame: where the laptop display is on screen. */
  const screenRectRef = useRef<ScreenRect>({ x: 0, y: 0, w: 0, h: 0, valid: false })

  const [hasWebGL, setHasWebGL] = useState(true)
  /** True while the pinned section is on screen; the WebGL and DOM loops idle otherwise. */
  const [inView, setInView] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setHasWebGL(detectWebGL())
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const handleContextLost = useCallback(() => setHasWebGL(false), [])

  const useFallback = reducedMotion || !hasWebGL

  useEffect(() => {
    const el = containerRef.current
    if (useFallback || !el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '200px 0px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [useFallback])

  // Keep the chassis exactly 1.5 grid cells above the top edge of the scroll cue.
  useEffect(() => {
    if (useFallback) return
    const measure = () => {
      const viewport = viewportRef.current
      const cue = cueRef.current
      if (!viewport || !cue) return
      const v = viewport.getBoundingClientRect()
      const c = cue.getBoundingClientRect()
      bottomInsetRef.current = v.bottom - c.top + GAP_CELLS * GRID_PX
    }
    measure()
    window.addEventListener('resize', measure)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (observer && viewportRef.current) observer.observe(viewportRef.current)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
    }
  }, [useFallback])

  // Section scroll progress, 0 to 1.
  const progress = useLaptopProgress(containerRef, !reducedMotion)

  // Hybrid transition: a native DOM dashboard starts exactly on the projected laptop display
  // and expands to a full-width, fully interactive panel. Everything is written straight to
  // the element style from one rAF loop, so React never re-renders while scrolling.
  useEffect(() => {
    if (useFallback || !inView) return
    const panel = panelRef.current
    const hint = hintRef.current
    if (!panel) return

    let raf = 0
    let wasVisible = false

    const hide = () => {
      if (!wasVisible) return
      wasVisible = false
      panel.style.visibility = 'hidden'
      panel.style.pointerEvents = 'none'
      panel.style.opacity = '0'
      if (hint) hint.style.opacity = '0'
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const viewport = viewportRef.current
      const rect = screenRectRef.current
      if (!viewport || !rect.valid) return

      const p = progress.get()
      const opacity = panelOpacity(p)
      if (opacity < 0.001) {
        hide()
        return
      }
      wasVisible = true

      const e = expandAmount(p)
      const vw = viewport.clientWidth
      const vh = viewport.clientHeight

      // Final (expanded) box.
      const { gutter, topClear, bottomBand } = panelGeometry(vw)
      const fw = Math.min(vw - gutter * 2, PANEL_MAX_WIDTH)
      const fh = Math.max(PANEL_MIN_HEIGHT, vh - topClear - bottomBand)
      const fx = (vw - fw) / 2
      const fy = topClear

      // Uniform scale that covers the laptop display, cropped to the display rectangle.
      const s0 = Math.max(rect.w / fw, rect.h / fh)
      const s = lerp(s0, 1, e)
      const x = lerp(rect.x, fx, e)
      const y = lerp(rect.y, fy, e)
      const visW = lerp(rect.w, fw, e)
      const visH = lerp(rect.h, fh, e)

      panel.style.width = `${fw}px`
      panel.style.height = `${fh}px`
      panel.style.visibility = 'visible'
      panel.style.opacity = String(opacity)

      if (e >= 0.999) {
        panel.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
        panel.style.clipPath = 'none'
      } else {
        const clipRight = Math.max(0, fw - visW / s)
        const clipBottom = Math.max(0, fh - visH / s)
        panel.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`
        panel.style.clipPath = `inset(0px ${clipRight}px ${clipBottom}px 0px round ${12 / s}px)`
      }

      // Interactive only when fully expanded: no pointer interception at any other time.
      panel.style.pointerEvents = e > 0.98 && opacity > 0.98 ? 'auto' : 'none'
      if (hint) hint.style.opacity = String(e * opacity)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      hide()
    }
  }, [useFallback, inView, progress])

  // Initial scroll cue.
  const scrollCueOpacity = useTransform(progress, [0, 0.06, 0.1], [1, 0.6, 0])

  // Stage 1: outer lid and profile.
  const stage1Opacity = useTransform(progress, [0.1, 0.16, 0.26, 0.3], [0, 1, 1, 0])
  const stage1Y = useTransform(progress, [0.1, 0.16, 0.26, 0.3], [20, 0, 0, -20])
  const stage1Events = useTransform(stage1Opacity, eventsFor)

  // Stage 2 and 3: bottom chassis and architecture.
  const stage2Opacity = useTransform(progress, [0.32, 0.38, 0.48, 0.52], [0, 1, 1, 0])
  const stage2Y = useTransform(progress, [0.32, 0.38, 0.48, 0.52], [20, 0, 0, -20])
  const stage2Events = useTransform(stage2Opacity, eventsFor)

  // The 3D scene steps aside while the dashboard is expanded, returns for the closing
  // sequence, and fades out for the hand-off to the Contact section.
  const sceneOpacity = useTransform(
    progress,
    [0, 0.78, 0.84, 0.9, 0.94, 0.985, 1],
    [1, 1, 0, 0, 1, 1, 0],
  )

  // Stage 5: contact label appears as the lid closes.
  const contactOpacity = useTransform(progress, [0.965, 0.995], [0, 1])
  const contactEvents = useTransform(contactOpacity, eventsFor)

  // Static fallback for reduced motion or missing WebGL.
  if (useFallback) {
    return (
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-4 py-24">
        <div id="about" className="flex flex-col items-start gap-6 pt-12">
          <p className="font-mono text-xs text-neutral-400">Astana, Kazakhstan · Undergraduate student</p>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl md:text-6xl">
            17-year-old AI & ML Engineer <span className="whitespace-nowrap">Amir Nagiyev</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-neutral-400">
            Building neural networks on top of a low-level mindset: from tensor graphs in PyTorch to
            zero-allocation hot paths in Go.
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-neutral-300">
            Studying at {PROFILE.school}. {PROFILE.focus}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-400">
            <span className="font-mono text-neutral-300">Interests: </span>
            {PROFILE.reading}
          </p>
        </div>

        <SpecSheet id="architecture" />

        <div id="voyage" className="h-[720px] w-full lg:h-[640px]">
          <VoyageDashboard />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-[560vh]">
      {/* Anchors, placed where each stage sits in the scroll range (p * 460 / 560). */}
      <div id="top" className="absolute top-0" />
      <div id="about" className="absolute top-[10%]" />
      <div id="architecture" className="absolute top-[33%]" />
      <div id="voyage" className="absolute top-[67%]" />

      <div ref={viewportRef} className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Layer 10: WebGL laptop. Never receives pointer events. */}
        {mounted && (
          <motion.div
            style={{ opacity: sceneOpacity }}
            className="pointer-events-none absolute inset-0 z-10"
          >
            <LaptopScene
              progress={progress}
              active={inView}
              onContextLost={handleContextLost}
              bottomInsetRef={bottomInsetRef}
              screenRectRef={screenRectRef}
            />
          </motion.div>
        )}

        {/* Layer 20: story overlays. Each one is interactive only while it is visible. */}
        <div className="pointer-events-none absolute inset-0 z-20 mx-auto flex w-full max-w-6xl flex-col items-center justify-between px-4 py-8 sm:px-6 sm:py-10">
          {/* Initial state: only the scroll cue */}
          <motion.div
            ref={cueRef}
            style={{ opacity: scrollCueOpacity }}
            className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
          >
            <span className="font-mono text-[11px] text-neutral-400">Scroll to explore</span>
            <span className="h-5 w-px bg-neutral-600" aria-hidden="true" />
          </motion.div>

          {/* Stage 1: outer lid and profile */}
          <motion.div
            style={{ opacity: stage1Opacity, y: stage1Y, pointerEvents: stage1Events }}
            className="absolute inset-x-4 top-[13vh] mx-auto flex max-w-3xl flex-col items-center gap-3 text-center sm:top-[19vh]"
          >
            <p className="font-mono text-xs text-lime-400">Profile</p>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl md:text-4xl">
              17-year-old AI &amp; ML Engineer <span className="whitespace-nowrap">Amir Nagiyev</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-neutral-300">
              Astana, Kazakhstan · Studying at {PROFILE.school}. {PROFILE.focus}
            </p>
            <p className="max-w-2xl text-xs leading-relaxed text-neutral-400 sm:text-sm">
              <span className="font-mono text-neutral-300">Interests: </span>
              {PROFILE.reading}
            </p>
          </motion.div>

          {/* Stage 2 and 3: bottom chassis and architecture */}
          <motion.div
            style={{ opacity: stage2Opacity, y: stage2Y, pointerEvents: stage2Events }}
            className="absolute inset-x-4 top-[11vh] mx-auto flex max-w-6xl flex-col items-center gap-3 sm:top-[19vh] sm:gap-4"
          >
            <h2 className="text-balance text-center text-xl font-semibold tracking-tight text-neutral-100 sm:text-3xl">
              Physical rigor, system architecture
            </h2>
            <SpecSheet />
          </motion.div>

          {/* Stage 5: outro, hands off to the contact section */}
          <motion.a
            href="#contact"
            style={{ opacity: contactOpacity, pointerEvents: contactEvents }}
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-xs text-neutral-300 hover:text-lime-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-400"
          >
            <span>contact</span>
            <span className="h-5 w-px bg-neutral-600" aria-hidden="true" />
          </motion.a>
        </div>

        {/* Layer 30: native Voyage AI dashboard. A normal DOM subtree (no portal, no CSS 3D),
            positioned and scaled from the rAF loop above. Hidden and non-interactive until
            the laptop is open and the panel has fully expanded. */}
        <div
          ref={panelRef}
          id="voyage-panel"
          className="absolute left-0 top-0 z-30 origin-top-left"
          style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}
        >
          <VoyageDashboard />
        </div>

        {/* Layer 30: scroll hint in the band below the dashboard. The page scrolls normally
            wherever the cursor is outside a dashboard scroll pane. */}
        <div
          ref={hintRef}
          className="pointer-events-none absolute inset-x-0 bottom-5 z-30 text-center font-mono text-[11px] text-neutral-400"
          style={{ opacity: 0 }}
        >
          <span className="pointer-coarse:hidden">Scroll here, outside the panel, to continue</span>
          <span className="hidden pointer-coarse:inline">Swipe here to continue</span>
        </div>
      </div>
    </div>
  )
}
