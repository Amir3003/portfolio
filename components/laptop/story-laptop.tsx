'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useTransform } from 'framer-motion'
import type { ScreenRect } from '@/components/laptop/laptop-scene'
import { QadamShowcase } from '@/components/laptop/qadam-showcase'
import {
  POSE_KEYS,
  QADAM_WINDOW,
  STORY_HEIGHT_VH,
  VOYAGE_WINDOW,
  expandAmount,
  panelOpacity,
  type PanelWindow,
} from '@/components/laptop/story-timeline'
import { useLaptopProgress } from '@/components/laptop/use-laptop-progress'
import { VoyageDashboard } from '@/components/laptop/voyage-dashboard'
import { getLenis } from '@/lib/lenis'

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

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Scroll progress at which an anchor sits, as a share of the section height. */
const anchorTop = (p: number): string => `${((p * (STORY_HEIGHT_VH - 100)) / STORY_HEIGHT_VH) * 100}%`

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
  school: 'Qazaq AI Research University (QAIRU), AI & ML',
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

/**
 * Touch screens only. While the panel sits in the story it is a preview; this opens it as a
 * full screen overlay with its own scroll, and the same control closes it again.
 */
function FullscreenToggle({
  open,
  label,
  onOpen,
  onClose,
}: {
  open: boolean
  label: string
  onOpen: () => void
  onClose: () => void
}) {
  if (open) {
    return (
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${label}`}
        className="fixed left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-neutral-950/90 px-5 py-2.5 font-mono text-xs font-medium text-white shadow-lg transition-transform duration-150 ease-out active:scale-[0.97]"
        style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <span aria-hidden="true">✕</span> Close
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="absolute bottom-4 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-neutral-950/85 px-5 py-2.5 font-mono text-xs font-medium text-white shadow-lg transition-transform duration-150 ease-out active:scale-[0.97] pointer-coarse:flex"
    >
      Open {label} full screen
      <span aria-hidden="true">↗</span>
    </button>
  )
}

export function StoryLaptop() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const voyageRef = useRef<HTMLDivElement>(null)
  const qadamRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  /** Distance from the viewport bottom to the chassis bottom edge at 0% scroll. */
  const bottomInsetRef = useRef<number>(140)
  /** Written by the WebGL scene every frame: where the laptop display is on screen. */
  const screenRectRef = useRef<ScreenRect>({ x: 0, y: 0, w: 0, h: 0, valid: false })

  const [hasWebGL, setHasWebGL] = useState(true)
  /** True while the pinned section is on screen; the WebGL and DOM loops idle otherwise. */
  const [inView, setInView] = useState(true)
  /**
   * Phones: the panels do not scroll inside the story (a swipe always moves the page), and
   * "Open full screen" shows the same panel as a fixed overlay with its own scroll instead.
   */
  const [fullscreen, setFullscreen] = useState<'voyage' | 'qadam' | null>(null)
  const fullscreenRef = useRef<'voyage' | 'qadam' | null>(null)
  fullscreenRef.current = fullscreen

  useEffect(() => {
    if (!fullscreen) return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    getLenis()?.stop()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = previous
      getLenis()?.start()
      window.removeEventListener('keydown', onKey)
    }
  }, [fullscreen])
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
    const hint = hintRef.current
    const panels: Array<{ id: 'voyage' | 'qadam'; el: HTMLDivElement; window: PanelWindow; visible: boolean }> = []
    if (voyageRef.current) panels.push({ id: 'voyage', el: voyageRef.current, window: VOYAGE_WINDOW, visible: false })
    if (qadamRef.current) panels.push({ id: 'qadam', el: qadamRef.current, window: QADAM_WINDOW, visible: false })
    if (panels.length === 0) return

    let raf = 0

    const hide = (panel: (typeof panels)[number]) => {
      if (!panel.visible) return
      panel.visible = false
      panel.el.style.visibility = 'hidden'
      panel.el.style.pointerEvents = 'none'
      panel.el.style.opacity = '0'
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const viewport = viewportRef.current
      const rect = screenRectRef.current
      if (!viewport || !rect.valid) return

      const p = progress.get()
      const vw = viewport.clientWidth
      const vh = viewport.clientHeight

      // Final (expanded) box, shared by both panels.
      const { gutter, topClear, bottomBand } = panelGeometry(vw)
      const fw = Math.min(vw - gutter * 2, PANEL_MAX_WIDTH)
      const fh = Math.max(PANEL_MIN_HEIGHT, vh - topClear - bottomBand)
      const fx = (vw - fw) / 2
      const fy = topClear
      // Uniform scale that covers the laptop display, cropped to the display rectangle.
      const s0 = Math.max(rect.w / fw, rect.h / fh)

      let hintOpacity = 0
      for (const panel of panels) {
        const el = panel.el
        if (fullscreenRef.current === panel.id) {
          // Full screen overlay: fixed to the viewport, ignores the scroll story.
          panel.visible = true
          el.style.position = 'fixed'
          el.style.zIndex = '80'
          el.style.width = '100%'
          el.style.height = '100dvh'
          el.style.transform = 'none'
          el.style.clipPath = 'none'
          el.style.visibility = 'visible'
          el.style.opacity = '1'
          el.style.pointerEvents = 'auto'
          continue
        }
        el.style.position = ''
        el.style.zIndex = ''

        const opacity = panelOpacity(panel.window, p)
        if (opacity < 0.001) {
          hide(panel)
          continue
        }
        panel.visible = true
        const e = expandAmount(panel.window, p)
        const s = lerp(s0, 1, e)
        const x = lerp(rect.x, fx, e)
        const y = lerp(rect.y, fy, e)
        const visW = lerp(rect.w, fw, e)
        const visH = lerp(rect.h, fh, e)

        el.style.width = `${fw}px`
        el.style.height = `${fh}px`
        el.style.visibility = 'visible'
        el.style.opacity = String(opacity)

        if (e >= 0.999) {
          el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
          el.style.clipPath = 'none'
        } else {
          const clipRight = Math.max(0, fw - visW / s)
          const clipBottom = Math.max(0, fh - visH / s)
          el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`
          el.style.clipPath = `inset(0px ${clipRight}px ${clipBottom}px 0px round ${12 / s}px)`
        }

        // Interactive only when fully expanded: no pointer interception at any other time.
        el.style.pointerEvents = e > 0.98 && opacity > 0.98 ? 'auto' : 'none'
        hintOpacity = Math.max(hintOpacity, e * opacity)
      }
      if (hint) hint.style.opacity = String(hintOpacity)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      panels.forEach(hide)
      if (hint) hint.style.opacity = '0'
    }
  }, [useFallback, inView, progress])

  // Initial scroll cue.
  const scrollCueOpacity = useTransform(progress, [0, 0.046, 0.077], [1, 0.6, 0])

  // Stage 1: outer lid and profile.
  const stage1Opacity = useTransform(progress, [0.077, 0.123, 0.2, 0.23], [0, 1, 1, 0])
  const stage1Y = useTransform(progress, [0.077, 0.123, 0.2, 0.23], [20, 0, 0, -20])
  const stage1Events = useTransform(stage1Opacity, eventsFor)

  // Stage 2 and 3: bottom chassis and architecture.
  const stage2Opacity = useTransform(progress, [0.245, 0.29, 0.368, 0.4], [0, 1, 1, 0])
  const stage2Y = useTransform(progress, [0.245, 0.29, 0.368, 0.4], [20, 0, 0, -20])
  const stage2Events = useTransform(stage2Opacity, eventsFor)

  // The 3D scene steps aside while a project panel is expanded, comes back between the two
  // projects and for the closing sequence, and fades out for the hand-off to Contact.
  const sceneOpacity = useTransform(
    progress,
    [
      0,
      VOYAGE_WINDOW.expand[0] + 0.01,
      VOYAGE_WINDOW.expand[1],
      VOYAGE_WINDOW.collapse[0],
      VOYAGE_WINDOW.collapse[1],
      QADAM_WINDOW.expand[0] + 0.01,
      QADAM_WINDOW.expand[1],
      QADAM_WINDOW.collapse[0],
      QADAM_WINDOW.collapse[1],
      0.985,
      1,
    ],
    [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0],
  )

  // Stage 5: contact label appears as the lid closes.
  const contactOpacity = useTransform(progress, [POSE_KEYS.closed - 0.01, 0.995], [0, 1])
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

        <div id="qadam" className="h-[720px] w-full lg:h-[640px]">
          <QadamShowcase />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative" style={{ height: `${STORY_HEIGHT_VH}vh` }}>
      {/* Anchors, placed where each stage holds in the scroll range. */}
      <div id="top" className="absolute top-0" />
      <div id="about" className="absolute" style={{ top: anchorTop(0.17) }} />
      <div id="architecture" className="absolute" style={{ top: anchorTop(0.33) }} />
      <div id="voyage" className="absolute" style={{ top: anchorTop((VOYAGE_WINDOW.expand[1] + VOYAGE_WINDOW.collapse[0]) / 2) }} />
      <div id="qadam" className="absolute" style={{ top: anchorTop((QADAM_WINDOW.expand[1] + QADAM_WINDOW.collapse[0]) / 2) }} />

      {/* Sticky creates a stacking context: lift it above the site header while a panel is full screen. */}
      <div
        ref={viewportRef}
        className={`sticky top-0 h-screen w-full overflow-hidden ${fullscreen ? 'z-[70]' : ''}`}
      >
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
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-neutral-300">
              Astana, Kazakhstan · Studying at {PROFILE.school}. {PROFILE.focus}
            </p>
            <p className="max-w-2xl text-pretty text-xs leading-relaxed text-neutral-400 sm:text-sm">
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

        {/* Layer 30: native project panels (Voyage AI, then QADAM). Normal DOM subtrees (no portal, no CSS 3D),
            positioned and scaled from the rAF loop above. Hidden and non-interactive until
            the laptop is open and the panel has fully expanded. */}
        <div
          ref={voyageRef}
          id="voyage-panel"
          data-fullscreen={fullscreen === 'voyage'}
          className="story-panel absolute left-0 top-0 z-30 origin-top-left"
          style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}
        >
          <VoyageDashboard />
          <FullscreenToggle
            open={fullscreen === 'voyage'}
            label="Voyage AI"
            onOpen={() => setFullscreen('voyage')}
            onClose={() => setFullscreen(null)}
          />
        </div>
        <div
          ref={qadamRef}
          id="qadam-panel"
          data-fullscreen={fullscreen === 'qadam'}
          className="story-panel absolute left-0 top-0 z-30 origin-top-left"
          style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}
        >
          <QadamShowcase />
          <FullscreenToggle
            open={fullscreen === 'qadam'}
            label="QADAM"
            onOpen={() => setFullscreen('qadam')}
            onClose={() => setFullscreen(null)}
          />
        </div>

        {/* Layer 30: scroll hint in the band below the dashboard. The page scrolls normally
            wherever the cursor is outside a dashboard scroll pane. */}
        <div
          ref={hintRef}
          className="pointer-events-none absolute inset-x-0 bottom-5 z-30 text-center font-mono text-[11px] text-neutral-400"
          style={{ opacity: 0 }}
        >
          <span className="pointer-coarse:hidden">Scroll here, outside the panel, to continue</span>
          <span className="hidden pointer-coarse:inline">Swipe to continue</span>
        </div>
      </div>
    </div>
  )
}
