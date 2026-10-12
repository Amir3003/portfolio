'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { motion, useTransform, useMotionValue } from 'framer-motion'
import { ArrowDown, Sparkles, BookOpen, Layers, Cpu } from 'lucide-react'
import { useSectionProgress } from '@/components/notebook/use-section-progress'
import { VoyageDashboard } from '@/components/notebook/voyage-dashboard'
import { SocialBadges } from '@/components/social-badges'

// Dynamic import for WebGL Three.js Scene (no SSR)
const NotebookScene = dynamic(() => import('@/components/notebook/notebook-scene'), {
  ssr: false,
  loading: () => null,
})

export function StoryNotebook() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasWebGL, setHasWebGL] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Track prefers-reduced-motion media query
  useEffect(() => {
    setMounted(true)
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mql.matches)
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  // Lenis-synchronized section scroll progress (0.0 -> 1.0)
  const progress = useSectionProgress(containerRef, !reducedMotion)

  // Sub-stage opacity transforms
  // 1. Stage 0 (0% - 25%): Intro & Hero Cover View
  const stage0Opacity = useTransform(progress, [0, 0.2, 0.28], [1, 1, 0])
  const stage0Y = useTransform(progress, [0, 0.2], [0, -30])

  // 2. Stage 1 (25% - 55%): Systems Architecture & About Profile View
  const stage1Opacity = useTransform(progress, [0.25, 0.33, 0.48, 0.56], [0, 1, 1, 0])
  const stage1Y = useTransform(progress, [0.25, 0.33, 0.48, 0.56], [40, 0, 0, -30])

  // 3. Stage 2 (60% - 94%): Opened Notebook -> Live Voyage AI Interactive Dashboard
  const stage2Opacity = useTransform(progress, [0.6, 0.68, 0.9, 0.98], [0, 1, 1, 0])
  const stage2Scale = useTransform(progress, [0.6, 0.72], [0.94, 1])

  // 3D Canvas overall fade out at the very end
  const sceneOpacity = useTransform(progress, [0.88, 0.98], [1, 0])

  // Static fallback for reduced motion users
  if (reducedMotion || !hasWebGL) {
    return (
      <div className="relative mx-auto flex max-w-5xl flex-col gap-16 px-4 py-24">
        {/* Intro Fallback */}
        <div className="flex flex-col items-start gap-6 pt-12">
          <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs text-neutral-300">
            <span className="size-2 rounded-full bg-lime-400" />
            17-year-old Undergraduate Student based in Astana, Kazakhstan
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-neutral-50 sm:text-6xl">
            Amir Nagiyev ·{' '}
            <span className="bg-gradient-to-r from-lime-400 to-red-400 bg-clip-text text-transparent">
              AI & ML Engineer
            </span>
          </h1>
          <p className="max-w-xl text-lg text-neutral-400 leading-relaxed">
            Building neural networks on top of a low-level mindset - from tensor graphs in PyTorch to zero-allocation hot paths in Go.
          </p>
          <div className="flex gap-4">
            <SocialBadges />
          </div>
        </div>

        {/* Architecture & About Fallback */}
        <div id="about" className="grid gap-6 md:grid-cols-3">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-medium text-neutral-100">Academic Focus</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Undergraduate in Artificial Intelligence & Machine Learning. Neural architectures, optimization and linear algebra.
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-medium text-neutral-100">Linguistic Profile</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Russian (Fluent), English (Fluent), Japanese (Targeting JLPT N2 with Genki & Renshuu).
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-medium text-neutral-100">Systems Mindset</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Go memory mechanics, struct alignment, zero-alloc patterns, escape analysis, and SQLite WAL concurrency.
            </p>
          </div>
        </div>

        {/* Live Project Dashboard Fallback */}
        <div id="project-dashboard" className="w-full">
          <VoyageDashboard />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-[420vh]">
      {/* Invisible anchor checkpoints to support header navigation smooth-scrolling */}
      <div id="top" className="absolute top-0" />
      <div id="about" className="absolute top-[33%]" />
      <div id="project-dashboard" className="absolute top-[66%]" />

      {/* Sticky Presentation Viewport */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* Interactive 3D WebGL Notebook Layer */}
        {mounted && (
          <motion.div
            style={{ opacity: sceneOpacity }}
            className="pointer-events-none absolute inset-0 z-10"
          >
            <NotebookScene
              progress={progress}
              active={true}
              onContextLost={() => setHasWebGL(false)}
            />
          </motion.div>
        )}

        {/* Floating Storyline Content Overlays (HTML Overlay) */}
        <div className="relative z-20 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center px-4 sm:px-6">
          {/* ================= STAGE 0: HERO / INTRO (0% - 25% Scroll) ================= */}
          <motion.div
            style={{ opacity: stage0Opacity, y: stage0Y }}
            className="pointer-events-auto absolute inset-x-4 top-24 flex flex-col items-start gap-6 sm:left-12 sm:max-w-xl md:top-32"
          >
            <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs text-neutral-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-lime-400" />
              </span>
              17-year-old Undergraduate Student · Astana, KZ
            </p>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-neutral-50 sm:text-5xl md:text-6xl">
              Amir Nagiyev
              <span className="block bg-gradient-to-r from-lime-400 via-lime-300 to-red-400 bg-clip-text text-transparent">
                AI & ML Engineer
              </span>
              <span className="text-2xl font-normal text-neutral-400 sm:text-3xl">& Systems Architect</span>
            </h1>

            <p className="max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base">
              Exploring neural models from tensors to syscalls. Scroll down to open the notebook and inspect the system architecture and live Voyage AI engine.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#project-dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-lime-400 px-5 py-2.5 text-xs font-semibold text-neutral-950 transition hover:bg-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
              >
                <span>Explore Notebook</span>
                <ArrowDown className="size-3.5 transition group-hover:translate-y-0.5" />
              </a>
            </div>

            <dl className="grid w-full max-w-sm grid-cols-3 gap-px overflow-hidden rounded-xl border border-neutral-800 bg-neutral-800/80">
              {[
                { label: 'FOCUS', value: 'AI / ML' },
                { label: 'CORE', value: 'Go · Py' },
                { label: 'TARGET', value: 'JLPT N2' },
              ].map((s) => (
                <div key={s.label} className="bg-neutral-950/90 px-3 py-2.5">
                  <dt className="font-mono text-[10px] text-neutral-500">{s.label}</dt>
                  <dd className="mt-0.5 font-mono text-xs font-medium text-neutral-200">{s.value}</dd>
                </div>
              ))}
            </dl>

            <SocialBadges />
          </motion.div>

          {/* ================= STAGE 1: ABOUT & SYSTEMS BLUEPRINT (25% - 55% Scroll) ================= */}
          <motion.div
            style={{ opacity: stage1Opacity, y: stage1Y }}
            className="pointer-events-auto absolute inset-x-4 flex flex-col items-start gap-4 sm:left-12 sm:max-w-lg"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-red-400/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-red-300">
                STAGE 02 // ARCHITECTURE & BACKGROUND
              </span>
            </div>

            <h2 className="text-3xl font-semibold tracking-tight text-neutral-100 sm:text-4xl">
              Learning machines, understanding metal.
            </h2>

            <p className="text-sm leading-relaxed text-neutral-400">
              I approach AI the way a systems engineer approaches a runtime: measure, profile, and understand every layer before trusting it.
            </p>

            <div className="mt-2 grid w-full gap-3 sm:grid-cols-2">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 font-mono text-xs text-lime-400">
                  <Cpu className="size-3.5" />
                  <span>AI & MACHINE LEARNING</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">
                  Undergraduate focus on PyTorch pipelines, data modeling, loss convergence, and inference efficiency.
                </p>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 font-mono text-xs text-red-400">
                  <Layers className="size-3.5" />
                  <span>SYSTEMS ENGINEERING</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">
                  Go pointer rewiring, escape analysis, zero-allocation memory pools, and SQLite WAL concurrent transactions.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 font-mono text-xs text-neutral-400">
              <span className="text-neutral-500">Language stack:</span> RU (Native) · EN (Fluent) · JA (JLPT prep)
            </div>
          </motion.div>

          {/* ================= STAGE 2: LIVE VOYAGE AI DASHBOARD (60% - 94% Scroll) ================= */}
          <motion.div
            style={{ opacity: stage2Opacity, scale: stage2Scale }}
            className="pointer-events-auto absolute inset-x-2 top-16 bottom-16 flex items-center justify-center sm:inset-x-6 sm:top-20 sm:bottom-20 md:inset-x-12"
          >
            <div className="h-full w-full max-w-5xl">
              <VoyageDashboard />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

