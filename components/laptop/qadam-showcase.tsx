'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { QadamAmbient } from '@/components/qadam/qadam-ambient'
import {
  ChevronRightIcon,
  DiscordIcon,
  DockerIcon,
  InstagramIcon,
  KakaoTalkIcon,
  LinuxIcon,
  LlmIcon,
  PyTorchIcon,
  TelegramIcon,
  TikTokIcon,
} from '@/components/qadam/qadam-icons'
import { qadamLinks } from '@/lib/site'

/*
 * QADAM, the second project in the laptop story: the welcome page of the live web app
 * (same background, fonts, colours and cards), plus a radar feed demo, the engineering story
 * and the socials. Everything scrolls inside the panel, so in-panel links scroll that pane
 * instead of the page (scrolling the page would move the story on and collapse the panel).
 */

type Stage = 0 | 1 | 2

/** Light card surface of the QADAM showcase. */
const CARD =
  'rounded-3xl border border-teal-300/40 bg-gradient-to-br from-[#EDF7F6]/95 via-[#F3F6FF]/95 to-[#E8F4F8]/95 text-slate-900 shadow-[0_20px_50px_-15px_rgba(6,182,212,0.22)]'

const GRADIENT_BUTTON =
  'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/30 transition-all hover:from-emerald-400 hover:to-teal-500'

const PILLARS: ReadonlyArray<{ title: string; body: string; points: readonly string[] }> = [
  {
    title: 'Verified Eligibility & Matching',
    body: 'Real-time indexing of global hackathons, research grants, and internships matched against your stack and actual academic eligibility requirements.',
    points: ['Zero scrapers: verified sponsors & funding', 'Automated academic deadline calculation'],
  },
  {
    title: 'CV Gap Analysis & Team Network',
    body: 'Precision resume benchmarking against target roles, interactive skill verification, and peer discovery for hackathon squads.',
    points: ['ATS linear density compatibility checks', 'Interactive 5-question Skill Lab tests'],
  },
  {
    title: 'Instant Messenger Alerts',
    body: 'Direct real-time notifications delivered via Telegram, KakaoTalk, and Discord with server-side privacy filtering.',
    points: ['Direct phone notifications for upcoming deadlines', 'Zero PII leakage during webhook transmission'],
  },
]

/* -------------------------------------------------------------------------- */
/*  Stage content (from the web app's welcome page)                           */
/* -------------------------------------------------------------------------- */

function MatchRow({ tone, title, meta, match }: { tone: 'emerald' | 'sky' | 'amber'; title: string; meta: string; match: string }) {
  const styles = {
    emerald: ['from-emerald-50 to-teal-100/80 border-emerald-300/60', 'text-emerald-950', 'text-emerald-800', 'bg-emerald-600'],
    sky: ['from-sky-50 to-cyan-100/80 border-sky-300/60', 'text-sky-950', 'text-sky-800', 'bg-sky-600'],
    amber: ['from-amber-50 to-orange-100/80 border-amber-300/60', 'text-amber-950', 'text-amber-800', 'bg-amber-600'],
  }[tone]
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border bg-gradient-to-br p-3.5 shadow-xs ${styles[0]}`}>
      <div className="min-w-0">
        <div className={`truncate text-[13px] font-bold ${styles[1]}`}>{title}</div>
        <div className={`mt-0.5 truncate font-mono text-[11px] leading-[14px] ${styles[2]}`}>{meta}</div>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold leading-[14px] text-white ${styles[3]}`}>
        {match}
      </span>
    </div>
  )
}

function SkillTile({ icon, label, score, className }: { icon: ReactNode; label: string; score: string; className: string }) {
  return (
    <div className={`flex flex-col items-center rounded-xl border bg-gradient-to-br p-2.5 text-center font-mono ${className}`}>
      {icon}
      <div className="mt-1 text-[12px] font-bold">{label}</div>
      <div className="text-[11px] opacity-80">Score: {score}</div>
    </div>
  )
}

function Alert({
  icon,
  tone,
  from,
  time,
  text,
}: {
  icon: ReactNode
  tone: string
  from: string
  time: string
  text: string
}) {
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border bg-gradient-to-br p-3 shadow-xs ${tone}`}>
      <div className="flex size-8 shrink-0 items-center justify-center">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] leading-[14px]">
          <span className="truncate font-bold">{from}</span>
          <span className="shrink-0 opacity-75">{time}</span>
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed opacity-90">{text}</p>
      </div>
    </div>
  )
}

function StageContent({ stage }: { stage: Stage }) {
  if (stage === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Real-Time Academic Indexing
          </div>
          <h3 className="font-mono text-2xl font-bold tracking-tight text-indigo-950 sm:text-4xl">01 / ELIGIBILITY RADAR</h3>
        </div>
        <div className="space-y-2.5">
          <MatchRow tone="emerald" title="Nebius x NVIDIA Global AI Hackathon" meta="GPU Compute & Multimodal Agents Track · Virtual" match="94% MATCH" />
          <MatchRow tone="sky" title="MEXT Scholarship: Graduate Research in AI" meta="Full Government Sponsorship · Ministry of Education Japan" match="88% MATCH" />
          <MatchRow tone="amber" title="Physical AI & Robotics Travel Grant" meta="NeurIPS 2026 Conference Travel · Verified Academic Track" match="91% MATCH" />
        </div>
      </div>
    )
  }
  if (stage === 1) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
            Linear ATS Resume & Benchmark Matrix
          </div>
          <h3 className="font-mono text-2xl font-bold tracking-tight text-indigo-950 sm:text-4xl">02 / CV & SKILL BENCHMARK</h3>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-300/60 bg-gradient-to-br from-indigo-50 to-violet-100/80 p-3.5 text-indigo-950 shadow-xs">
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase text-indigo-700">CV Health Score</div>
            <div className="mt-0.5 font-mono text-2xl font-bold">
              89 <span className="text-sm text-indigo-400">/ 100</span>
              <span className="ml-2 inline-block whitespace-nowrap rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-sans text-[11px] font-medium text-emerald-700">
                Top Quartile
              </span>
            </div>
          </div>
          <div className="text-right font-mono text-[11px]">
            <div className="text-indigo-700">Benchmark Fit</div>
            <div className="mt-0.5 font-bold text-indigo-900">4 of 4 Skills Verified</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SkillTile icon={<PyTorchIcon size={20} />} label="PyTorch" score="95%" className="border-amber-300/60 from-amber-50 to-orange-100/80 text-amber-950" />
          <SkillTile icon={<DockerIcon size={20} />} label="Docker" score="90%" className="border-sky-300/60 from-sky-50 to-cyan-100/80 text-sky-950" />
          <SkillTile icon={<LlmIcon size={20} className="text-indigo-700" />} label="LLMs" score="92%" className="border-indigo-300/60 from-indigo-50 to-violet-100/80 text-indigo-950" />
          <SkillTile icon={<LinuxIcon size={20} className="text-emerald-700" />} label="Linux" score="88%" className="border-emerald-300/60 from-emerald-50 to-teal-100/80 text-emerald-950" />
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-sky-700">
          Multi-Channel Push Notification Bot
        </div>
        <h3 className="font-mono text-2xl font-bold tracking-tight text-indigo-950 sm:text-4xl">03 / INSTANT MESSENGER BOTS</h3>
      </div>
      <div className="space-y-2.5">
        <Alert
          icon={<TelegramIcon size={26} />}
          tone="border-sky-300/60 from-sky-50 to-cyan-100/80 text-sky-950"
          from="@QadamAgentBot"
          time="Just now"
          text="High-compatibility Hackathon detected (94% fit). Registration closes in 3 days. Proposal drafted in /workspace/qadam."
        />
        <Alert
          icon={<DiscordIcon size={26} />}
          tone="border-indigo-300/60 from-indigo-50 to-violet-100/80 text-indigo-950"
          from="Discord Webhook · Squad Channel"
          time="2m ago"
          text="New Travel Grant open for CVPR candidates with verified PyTorch credentials."
        />
        <Alert
          icon={<KakaoTalkIcon size={26} />}
          tone="border-amber-300/60 from-amber-50 to-yellow-100/80 text-amber-950"
          from="KakaoTalk Channel · QADAM"
          time="12m ago"
          text="Tokyo Institute of Tech Exchange deadline synchronized with your local calendar."
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pillars showcase                                                          */
/* -------------------------------------------------------------------------- */

function PillarShowcase() {
  const [stage, setStage] = useState<Stage>(0)
  const [auto, setAuto] = useState(true)
  const pillar = PILLARS[stage]

  // Cycles through the pillars like the scroll-driven original, until the visitor picks one.
  useEffect(() => {
    if (!auto) return
    const id = window.setInterval(() => setStage((s) => ((s + 1) % 3) as Stage), 6000)
    return () => window.clearInterval(id)
  }, [auto])

  const pick = (s: Stage) => {
    setAuto(false)
    setStage(s)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr] lg:gap-6">
      <div className={`${CARD} flex flex-col gap-5 p-5 sm:p-8`}>
        <div className="flex items-center justify-between border-b border-teal-200/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-teal-950">Interactive Showcase</span>
          </div>
          <div role="tablist" aria-label="QADAM pillars" className="flex items-center gap-1.5">
            {([0, 1, 2] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={stage === s}
                onClick={() => pick(s)}
                className={`h-7 rounded-full px-3.5 font-mono text-[11px] font-bold transition-all ${
                  stage === s
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                    : 'border border-teal-200/60 bg-white/80 text-teal-800 hover:bg-white'
                }`}
              >
                0{s + 1}
              </button>
            ))}
          </div>
        </div>

        <div key={stage} className="qadam-flip min-h-[17rem] sm:min-h-[18.5rem]">
          <StageContent stage={stage} />
        </div>

        <div className="flex items-center gap-1.5 border-t border-teal-200/80 pt-4" aria-hidden="true">
          {([0, 1, 2] as const).map((s) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${stage === s ? 'w-7 bg-emerald-500' : 'w-1.5 bg-teal-300'}`}
            />
          ))}
        </div>
      </div>

      <div className={`${CARD} flex flex-col justify-center gap-4 p-5 sm:p-8`}>
        <p className="font-mono text-[11px] uppercase tracking-wider text-teal-700">
          Pillar 0{stage + 1} / 03
        </p>
        <h3 className="text-2xl font-bold leading-tight tracking-tight text-indigo-950 sm:text-3xl">{pillar.title}</h3>
        <p className="text-[14px] leading-relaxed text-slate-700 sm:text-[15px]">{pillar.body}</p>
        <ul className="space-y-1.5">
          {pillar.points.map((point) => (
            <li key={point} className="font-mono text-[12px] text-teal-800">
              ✓ {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Radar feed demo                                                           */
/* -------------------------------------------------------------------------- */

type Kind = 'all' | 'hackathon' | 'grant' | 'internship'

const FEED: ReadonlyArray<{ kind: Exclude<Kind, 'all'>; tone: 'emerald' | 'sky' | 'amber'; title: string; meta: string; match: string }> = [
  { kind: 'hackathon', tone: 'emerald', title: 'Global AI Agents Hackathon', meta: 'Online · teams of 2 to 4 · Python and LLM tooling', match: '94% MATCH' },
  { kind: 'grant', tone: 'sky', title: 'Student Research Travel Grant', meta: 'Conference travel · undergraduates eligible', match: '88% MATCH' },
  { kind: 'internship', tone: 'amber', title: 'ML Engineering Summer Internship', meta: 'Remote · 12 weeks · gap: one deployed project', match: '81% MATCH' },
  { kind: 'hackathon', tone: 'emerald', title: 'Open Source Climate Data Sprint', meta: 'Hybrid · Astana and online · first squad friendly', match: '76% MATCH' },
]

const FILTERS: ReadonlyArray<{ id: Kind; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'grant', label: 'Grants' },
  { id: 'internship', label: 'Internships' },
]

function RadarDemo() {
  const [filter, setFilter] = useState<Kind>('all')
  const items = FEED.filter((o) => filter === 'all' || o.kind === filter)

  return (
    <section aria-labelledby="qadam-radar-title" className={`${CARD} p-5 sm:p-8`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-teal-200/80 pb-3">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Try it</p>
          <h3 id="qadam-radar-title" className="mt-1 text-2xl font-bold tracking-tight text-indigo-950 sm:text-3xl">
            Your radar feed
          </h3>
        </div>
        <span className="rounded-full border border-teal-200/80 bg-white/70 px-2.5 py-1 font-mono text-[10px] text-teal-800">
          Illustrative data
        </span>
      </div>

      <div role="group" aria-label="Filter opportunities" className="mt-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={f.id === filter}
            onClick={() => setFilter(f.id)}
            className={`h-8 rounded-full px-3.5 font-mono text-[11px] font-bold transition-all ${
              f.id === filter
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
                : 'border border-teal-200/60 bg-white/80 text-teal-800 hover:bg-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {items.map((o) => (
          <MatchRow key={o.title} tone={o.tone} title={o.title} meta={o.meta} match={o.match} />
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Showcase                                                                  */
/* -------------------------------------------------------------------------- */

const STACK = [
  'React 19',
  'TypeScript',
  'Vite',
  'Tailwind CSS',
  'Supabase Postgres + OTP auth',
  'GitHub Actions radar',
  'Node.js bots on Oracle Cloud',
  'Vercel',
] as const

export function QadamShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pillarsRef = useRef<HTMLDivElement>(null)

  // Scroll the panel's own pane: scrollIntoView would also scroll the page and close the panel.
  const showPillars = () => {
    const pane = scrollRef.current
    const target = pillarsRef.current
    if (!pane || !target) return
    const top = target.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - 16
    pane.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="qadam-ui relative isolate flex h-full w-full flex-col overflow-hidden rounded-2xl border border-teal-500/20 bg-[#0B101E] font-sans text-slate-100 antialiased shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
      <QadamAmbient />

      {/* Top bar, as on the live site */}
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-b border-teal-500/20 bg-slate-900/60 px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qadam/qadam-icon.png" alt="" width={32} height={32} className="size-7 rounded-md object-contain sm:size-8" />
          <span className="font-mono text-[17px] font-bold tracking-tight text-white sm:text-[19px]">QADAM</span>
          <span className="hidden rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-teal-300 sm:inline">
            «Қадам»
          </span>
          <span className="whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
            LIVE BETA
          </span>
        </div>
        <a
          href={qadamLinks.site}
          target="_blank"
          rel="noopener noreferrer"
          className={`${GRADIENT_BUTTON} flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 font-mono text-[11px] font-semibold sm:h-10 sm:px-5`}
        >
          <span className="hidden sm:inline">Open live site</span>
          <span className="sm:hidden">Live site</span>
          <ChevronRightIcon size={13} />
        </a>
      </header>

      <div
        ref={scrollRef}
        data-lenis-prevent="true"
        className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain pointer-coarse:overscroll-auto"
      >
        {/* Hero: the welcome screen of the live site */}
        <section className="relative flex min-h-full flex-col items-center justify-center px-4 pt-10 pb-20 text-center sm:px-6">
          <div className="flex flex-col items-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-teal-400/30 bg-teal-500/10 px-5 py-2 text-sm font-semibold text-teal-300 shadow-lg md:text-base">
              <span className="size-2.5 animate-pulse rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              <span>AI Opportunity Hub</span>
            </div>
            <h2 className="text-6xl font-black leading-none tracking-tight text-white drop-shadow-[0_4px_28px_rgba(16,185,129,0.28)] sm:text-7xl md:text-8xl lg:text-[7.5rem]">
              QADAM
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-teal-100/90 sm:text-xl md:text-2xl">
              QADAM («Қадам») means &quot;step&quot; in Kazakh. Your direct platform for global academic grants,
              internships, and AI opportunities.
            </p>
            <div className="flex w-full flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <a
                href={qadamLinks.site}
                target="_blank"
                rel="noopener noreferrer"
                className={`${GRADIENT_BUTTON} flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl px-8 py-3.5 font-mono text-base font-semibold shadow-xl shadow-emerald-500/25 active:scale-[0.98] sm:w-auto sm:px-10 sm:text-lg`}
              >
                <span>Open QADAM</span>
                <ChevronRightIcon size={18} />
              </a>
              <button
                type="button"
                onClick={showPillars}
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-teal-400/30 bg-teal-500/10 px-8 py-3.5 font-mono text-base font-semibold text-teal-200 transition-colors hover:border-teal-300/60 hover:bg-teal-500/15 sm:w-auto sm:text-lg"
              >
                How it works
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={showPillars}
            className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 opacity-75 transition-opacity hover:opacity-100 md:flex"
          >
            <span className="font-mono text-[12px] font-medium uppercase tracking-wider text-teal-300">Explore 3 Pillars</span>
            <span className="h-6 w-1.5 animate-bounce rounded-full bg-teal-400/70" />
          </button>
        </section>

        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-3 pb-8 sm:gap-8 sm:px-6 lg:px-10">
          <div ref={pillarsRef}>
            <PillarShowcase />
          </div>

          <RadarDemo />

          {/* Engineering */}
          <section aria-labelledby="qadam-stack-title" className={`${CARD} grid gap-5 p-5 sm:p-8 md:grid-cols-5`}>
            <div className="md:col-span-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Under the hood</p>
              <h3 id="qadam-stack-title" className="mt-1 text-2xl font-bold tracking-tight text-indigo-950 sm:text-3xl">
                Built and shipped by a student team
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-700">
                I founded QADAM and lead product, design and engineering: the web app, the radar pipeline that merges
                each scan into the existing feed, the shared teammate network on Supabase and the messenger bots. The
                brand, Discord community and launch content were made in house too.
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-teal-700">Stack</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {STACK.map((item) => (
                  <li key={item} className="rounded-lg border border-teal-200/80 bg-white/80 px-2.5 py-1 font-mono text-[11px] text-teal-900">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <footer className="flex flex-col items-center gap-3 border-t border-teal-500/20 pt-6 pb-2 text-center">
            <p className="flex items-center gap-2 font-mono text-sm font-bold text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/qadam/qadam-icon.png" alt="" width={20} height={20} className="size-5 rounded" />
              QADAM · AI Opportunity Hub
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={qadamLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1.5 font-mono text-[12px] text-teal-200 transition-colors hover:border-teal-300/60 hover:text-white"
              >
                <InstagramIcon size={15} /> @joinqadamhub
              </a>
              <a
                href={qadamLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1.5 font-mono text-[12px] text-teal-200 transition-colors hover:border-teal-300/60 hover:text-white"
              >
                <TikTokIcon size={15} /> @qadamhub
              </a>
              <a
                href={qadamLinks.site}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1.5 font-mono text-[12px] text-teal-200 transition-colors hover:border-teal-300/60 hover:text-white"
              >
                Live site <ChevronRightIcon size={12} />
              </a>
              <a
                href="/projects/qadam"
                className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1.5 font-mono text-[12px] text-teal-200 transition-colors hover:border-teal-300/60 hover:text-white"
              >
                QADAM case study <ChevronRightIcon size={12} />
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
