'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useTransform } from 'framer-motion'
import { ArrowDown, BookOpen, Cpu, Layers, TerminalSquare } from 'lucide-react'
import { useLaptopProgress } from '@/components/laptop/use-laptop-progress'
import { VoyageDashboard } from '@/components/laptop/voyage-dashboard'
import { SocialBadges } from '@/components/social-badges'
import { TerminalCta } from '@/components/terminal-cta'

// WebGL scene, client only.
const LaptopScene = dynamic(() => import('@/components/laptop/laptop-scene'), {
  ssr: false,
  loading: () => null,
})

/** One grid cell in CSS px. Change this if your background grid uses another size. */
const GRID_PX = 32
/** Required gap between the laptop chassis and the scroll cue at 0% scroll. */
const GAP_CELLS = 1.5

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const eventsFor = (v: number): 'auto' | 'none' => (v > 0.05 ? 'auto' : 'none')

export function StoryLaptop() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  /** Distance from the viewport bottom to the chassis bottom edge at 0% scroll. */
  const bottomInsetRef = useRef<number>(140)

  const [hasWebGL, setHasWebGL] = useState(true)
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

  // Keep the chassis exactly 1.5 grid cells above the top edge of the scroll cue.
  const useFallback = reducedMotion || !hasWebGL
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

  // Initial scroll cue (0% to 12%).
  const scrollCueOpacity = useTransform(progress, [0, 0.08, 0.12], [1, 0.6, 0])

  // Stage 1: outer lid and profile.
  const stage1Opacity = useTransform(progress, [0.12, 0.18, 0.28, 0.33], [0, 1, 1, 0])
  const stage1Y = useTransform(progress, [0.12, 0.18, 0.28, 0.33], [20, 0, 0, -20])
  const stage1Events = useTransform(stage1Opacity, eventsFor)

  // Stage 2 and 3: bottom chassis and architecture.
  const stage2Opacity = useTransform(progress, [0.35, 0.41, 0.52, 0.58], [0, 1, 1, 0])
  const stage2Y = useTransform(progress, [0.35, 0.41, 0.52, 0.58], [20, 0, 0, -20])
  const stage2Events = useTransform(stage2Opacity, eventsFor)

  // Stage 4: seamless transition into interactive Voyage AI dashboard
  const stage4Opacity = useTransform(progress, [0.72, 0.78, 0.88, 0.92], [0, 1, 1, 0])
  const stage4Scale = useTransform(progress, [0.72, 0.78, 0.88, 0.92], [0.96, 1, 1, 0.96])
  const stage4Events = useTransform(stage4Opacity, (v) => (v > 0.4 ? 'auto' : 'none'))

  // Stage 5: laptop closes, canvas fades, contact label appears.
  const sceneOpacity = useTransform(progress, [0.93, 0.99], [1, 0])
  const contactOpacity = useTransform(progress, [0.94, 0.99], [0, 1])
  const contactEvents = useTransform(contactOpacity, eventsFor)

  // Static fallback for reduced motion or missing WebGL.
  if (useFallback) {
    return (
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-4 py-24">
        <div id="about" className="flex flex-col items-start gap-6 pt-12">
          <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs text-neutral-300">
            <span className="size-2 rounded-full bg-lime-400" />
            Astana, Kazakhstan · Undergraduate Student
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl md:text-6xl">
            17-year-old AI & ML Engineer <span className="whitespace-nowrap">Amir Nagiyev</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-neutral-400">
            Building neural networks on top of a low-level mindset: from tensor graphs in PyTorch to
            zero-allocation hot paths in Go.
          </p>
          <div className="flex gap-4">
            <SocialBadges />
          </div>
        </div>

        <div id="architecture" className="grid gap-6 md:grid-cols-3">
          <div className="glass rounded-2xl border border-neutral-800 p-6">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-lime-400">
              <Cpu className="size-4" />
              <span>AI & Machine Learning</span>
            </div>
            <h3 className="mt-2 text-base font-medium text-neutral-100">Neural Modeling & Ranking</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              PyTorch deep learning pipelines, loss convergence optimization, neural embeddings, and
              destination ranking models.
            </p>
          </div>
          <div className="glass rounded-2xl border border-neutral-800 p-6">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-red-400">
              <Layers className="size-4" />
              <span>Systems Engineering</span>
            </div>
            <h3 className="mt-2 text-base font-medium text-neutral-100">Low-Level Stack & Runtime</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Go memory mechanics, struct field padding, zero-alloc hot paths, escape analysis, and
              SQLite WAL concurrent transactions.
            </p>
          </div>
          <div className="glass rounded-2xl border border-neutral-800 p-6">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-neutral-300">
              <BookOpen className="size-4" />
              <span>Academic & Languages</span>
            </div>
            <h3 className="mt-2 text-base font-medium text-neutral-100">Astana Node & Linguistics</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              17-year-old undergraduate in Astana. Fluent in Russian and English. Japanese JLPT N2
              study with Genki & Renshuu.
            </p>
          </div>
        </div>

        <div id="voyage" className="h-[720px] w-full lg:h-[640px]">
          <VoyageDashboard />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-[480vh]">
      {/* Anchors, placed where each stage sits in the scroll range */}
      <div id="top" className="absolute top-0" />
      <div id="about" className="absolute top-[14%]" />
      <div id="architecture" className="absolute top-[34%]" />
      <div id="voyage" className="absolute top-[72%]" />

      <div
        ref={viewportRef}
        className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden"
      >
        {/* 3D WebGL scene with realistic physical materials, lighting, and textures */}
        {mounted && (
          <motion.div
            style={{ opacity: sceneOpacity }}
            className="pointer-events-none absolute inset-0 z-10"
          >
            <LaptopScene
              progress={progress}
              active
              onContextLost={handleContextLost}
              bottomInsetRef={bottomInsetRef}
            />
          </motion.div>
        )}

        {/* Story overlays. Each is only interactive while it is visible, so none of them
            can sit invisibly on top of the laptop screen and swallow clicks or scrolls. */}
        <div className="pointer-events-none relative z-20 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-between px-4 py-8 sm:px-6 sm:py-10">
          {/* Initial state: only the scroll cue */}
          <motion.div
            ref={cueRef}
            style={{ opacity: scrollCueOpacity }}
            className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 text-neutral-400"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 sm:text-[11px]">
              SCROLL TO EXPLORE
            </span>
            <div className="flex flex-col items-center gap-0.5">
              <span className="size-1 animate-ping rounded-full bg-lime-400" />
              <ArrowDown className="size-3.5 animate-bounce text-lime-400 sm:size-4" />
            </div>
          </motion.div>

          {/* Stage 1: outer lid and profile */}
          <motion.div
            style={{ opacity: stage1Opacity, y: stage1Y, pointerEvents: stage1Events }}
            className="absolute inset-x-4 top-8 mx-auto flex max-w-2xl flex-col items-center gap-2.5 text-center sm:top-12 sm:gap-3"
          >
            <span className="rounded border border-lime-400/20 bg-lime-400/10 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-lime-400">
              HARDWARE PROFILE | STAGE 1
            </span>

            <h1 className="text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl md:text-4xl">
              17-year-old AI & ML Engineer <span className="whitespace-nowrap">Amir Nagiyev</span>
            </h1>

            <p className="max-w-lg text-xs leading-relaxed text-neutral-400 sm:text-sm">
              Astana, Kazakhstan · Neural network architectures, loss optimization, and low-level
              systems engineering.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-0.5">
              <div className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] text-neutral-300">
                <span className="size-2 rounded-full bg-lime-400" />
                <span>Astana Architecture Node</span>
              </div>
              <TerminalCta className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[11px] text-red-300 transition hover:border-red-400/50 hover:text-red-200">
                <TerminalSquare className="size-3" />
                <span>Terminal Session</span>
              </TerminalCta>
            </div>
          </motion.div>

          {/* Stage 2 and 3: bottom chassis and 3-column architecture */}
          <motion.div
            style={{ opacity: stage2Opacity, y: stage2Y, pointerEvents: stage2Events }}
            className="absolute inset-x-4 top-6 mx-auto flex w-full max-w-6xl flex-col items-center gap-3 sm:top-8 md:top-10"
          >
            <span className="rounded border border-red-400/20 bg-red-400/10 px-3 py-0.5 font-mono text-[11px] uppercase tracking-wider text-red-300">
              STAGE 02 & 03 | SYSTEM ARCHITECTURE & HARDWARE CHASSIS
            </span>

            <h2 className="text-center text-2xl font-semibold tracking-tight text-neutral-100 sm:text-3xl">
              Physical Rigor & System Architecture
            </h2>

            <div className="grid w-full grid-cols-1 gap-3.5 pt-1 text-left md:grid-cols-3">
              {/* Left: AI & Machine Learning */}
              <div className="glass flex flex-col justify-between rounded-2xl border border-neutral-800/80 p-4 sm:p-5">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-lime-400 sm:text-[13px]">
                    <Cpu className="size-4" />
                    <span>AI & MACHINE LEARNING</span>
                  </div>
                  <h3 className="mt-2 text-base font-medium text-neutral-50 sm:text-lg">
                    Neural Modeling & Ranking
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-200 sm:text-[15px]">
                    PyTorch tensor pipelines, loss convergence optimization, deep representations,
                    embeddings, and destination ranking engines.
                  </p>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-1.5 font-mono text-xs text-neutral-300">
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5">PyTorch</span>
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5">Vector Math</span>
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5">Rank Loss</span>
                </div>
              </div>

              {/* Center: Systems Engineering & Stack */}
              <div className="glass flex flex-col justify-between rounded-2xl border border-neutral-800/80 p-4 sm:p-5">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-red-400 sm:text-[13px]">
                    <Layers className="size-4" />
                    <span>SYSTEMS ENGINEERING & STACK</span>
                  </div>
                  <h3 className="mt-2 text-base font-medium text-neutral-50 sm:text-lg">
                    Low-Level Stack & Runtime
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-200 sm:text-[15px]">
                    Go pointer mechanics, struct field padding, zero-alloc hot paths, escape analysis,
                    and SQLite WAL mode concurrent transactions.
                  </p>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-1.5 font-mono text-xs text-neutral-300">
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5">Go Runtime</span>
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5">SQLite WAL</span>
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5">Zero-Alloc</span>
                </div>
              </div>

              {/* Right: Academic focus & Languages */}
              <div className="glass flex flex-col justify-between rounded-2xl border border-neutral-800/80 p-4 sm:p-5">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-300 sm:text-[13px]">
                    <BookOpen className="size-4" />
                    <span>ACADEMIC & LANGUAGES</span>
                  </div>
                  <h3 className="mt-2 text-base font-medium text-neutral-50 sm:text-lg">
                    Astana Node & Linguistics
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-200 sm:text-[15px]">
                    17-year-old undergraduate in AI & ML based in Astana. Bilingual fluency in Russian
                    and English. Japanese JLPT N2 study (Genki & Renshuu).
                  </p>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-1.5 font-mono text-xs text-neutral-300">
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5">RU (Native)</span>
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5">EN (Fluent)</span>
                  <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5">JA (JLPT N2)</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stage 4: seamless transition into interactive Voyage AI */}
          <motion.div
            style={{
              opacity: stage4Opacity,
              scale: stage4Scale,
              pointerEvents: stage4Events,
            }}
            className="absolute inset-x-2 top-4 bottom-4 z-30 mx-auto flex w-full max-w-5xl items-center justify-center sm:inset-x-6 sm:top-6 sm:bottom-6 lg:max-w-6xl"
          >
            <div className="h-full max-h-[740px] w-full">
              <VoyageDashboard />
            </div>
          </motion.div>

          {/* Stage 5: outro, hands off to the contact section */}
          <motion.a
            href="#contact"
            style={{ opacity: contactOpacity, pointerEvents: contactEvents }}
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 font-mono text-xs tracking-widest text-neutral-300 transition hover:text-lime-400"
          >
            <span>contact</span>
            <ArrowDown className="size-4 text-lime-400" />
          </motion.a>
        </div>
      </div>
    </div>
  )
}
