'use client'

import { useState } from 'react'
import { ArrowRight, Bell, Check, ExternalLink, FileSearch, Radar } from 'lucide-react'
import { qadamLinks } from '@/lib/site'

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

type Kind = 'all' | 'hackathon' | 'grant' | 'internship'

interface Opportunity {
  kind: Exclude<Kind, 'all'>
  title: string
  host: string
  fit: number
  note: string
}

/** Illustrative feed items: the shape of what the radar returns, not live data. */
const FEED: readonly Opportunity[] = [
  {
    kind: 'hackathon',
    title: 'Global AI Agents Hackathon',
    host: 'Online · team of 2 to 4',
    fit: 94,
    note: 'Python and LLM tooling match your stack',
  },
  {
    kind: 'grant',
    title: 'Student Research Travel Grant',
    host: 'Conference travel · undergraduates',
    fit: 88,
    note: 'Eligible: undergraduate, first-author not required',
  },
  {
    kind: 'internship',
    title: 'ML Engineering Summer Internship',
    host: 'Remote · 12 weeks',
    fit: 81,
    note: 'Gap: one deployed project with metrics',
  },
  {
    kind: 'hackathon',
    title: 'Open Source Climate Data Sprint',
    host: 'Hybrid · Astana and online',
    fit: 76,
    note: 'Good first squad event, no prior wins needed',
  },
]

const FILTERS: ReadonlyArray<{ id: Kind; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'grant', label: 'Grants' },
  { id: 'internship', label: 'Internships' },
]

const STATS: ReadonlyArray<readonly [string, string]> = [
  ['4x', 'Radar scans a day'],
  ['3', 'Messenger channels'],
  ['3', 'Product pillars'],
  ['0', 'PII in webhooks'],
]

const PILLARS = [
  {
    icon: Radar,
    label: '01 / Eligibility Radar',
    title: 'Only what you can actually apply to',
    body: 'A scheduled GitHub Actions pipeline runs four searches a day, extracts grants, hackathons and internships in batches and merges them into one feed. Items are matched against your stack and real eligibility rules, and stale entries expire on their own.',
    points: ['Verified sponsors, no scraped spam', 'Deadlines normalised, or "see official page"', 'Prepare & Apply opens the exact opportunity'],
  },
  {
    icon: FileSearch,
    label: '02 / CV & Skill Lab',
    title: 'See the gap before the recruiter does',
    body: 'Your CV is benchmarked against a target role: ATS keyword density, a health score and the skills that are missing. Short five question skill checks turn claims into verified badges, and the network page helps you find teammates.',
    points: ['CV health score and benchmark fit', 'Five question skill verification', 'Teammates and squad discovery'],
  },
  {
    icon: Bell,
    label: '03 / Messenger Bots',
    title: 'Deadlines come to you',
    body: 'Telegram and Discord bots, plus a KakaoTalk channel, push new matches and deadline reminders where students already are. Webhooks are filtered server side so no personal data leaves the platform.',
    points: ['Telegram bot and Discord server', 'KakaoTalk channel chatbot', 'Server-side privacy filtering'],
  },
] as const

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

/* -------------------------------------------------------------------------- */
/*  Pieces                                                                    */
/* -------------------------------------------------------------------------- */

/** The QADAM mark: a Q whose ring rises into an upward arrow. */
function QadamMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="6 7.5 54 54"
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M34.18,15.68 A20,20 0 1 0 49.0,35.0 L49.0,14" />
      <path d="M41.0,22 L49.0,14 L57.0,22" />
      <path d="M38 45 L47 54" />
    </svg>
  )
}

function RadarDemo() {
  const [filter, setFilter] = useState<Kind>('all')
  const items = FEED.filter((o) => filter === 'all' || o.kind === filter)

  return (
    <section
      aria-labelledby="qadam-radar-title"
      className="rounded-2xl border border-[#1B2440]/10 bg-white p-4 shadow-[0_18px_50px_rgba(27,36,64,0.08)] sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#8A6A2E]">Try it</p>
          <h3 id="qadam-radar-title" className="mt-1 text-xl font-bold tracking-tight text-[#1B2440] sm:text-2xl">
            Your radar feed
          </h3>
        </div>
        <span className="rounded-full border border-[#1B2440]/15 px-2.5 py-1 font-mono text-[10px] text-slate-500">
          Illustrative data
        </span>
      </div>

      <div role="group" aria-label="Filter opportunities" className="mt-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = f.id === filter
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-[#1B2440] bg-[#1B2440] text-[#F7F4EE]'
                  : 'border-[#1B2440]/15 bg-[#F7F4EE] text-[#1B2440] hover:border-[#1B2440]/40'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((o) => (
          <li
            key={o.title}
            className="flex items-center gap-3 rounded-xl border border-[#1B2440]/10 bg-[#F7F4EE]/60 p-3 sm:gap-4 sm:p-4"
          >
            <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#1B2440] text-[#F7F4EE] sm:size-14">
              <span className="text-base font-bold leading-none sm:text-lg">{o.fit}%</span>
              <span className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-[#C9A25E]">fit</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1B2440] sm:text-[15px]">{o.title}</p>
              <p className="truncate text-xs text-slate-500">{o.host}</p>
              <p className="mt-1 truncate text-xs text-[#8A6A2E]">{o.note}</p>
            </div>
            <span className="hidden shrink-0 rounded-md border border-[#1B2440]/15 px-2 py-1 font-mono text-[10px] uppercase text-slate-500 sm:inline">
              {o.kind}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Showcase                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * QADAM Hub, the second project in the laptop story. A light, self-contained product page in
 * the startup's own palette (navy, ivory, gold) that expands from the laptop display the same
 * way the Voyage AI dashboard does.
 */
export function QadamShowcase() {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#1B2440]/15 bg-[#F7F4EE] text-[#1B2440] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#1B2440]/10 bg-white px-3 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <QadamMark className="size-6 shrink-0 text-[#1B2440] sm:size-7" />
          <span className="truncate text-sm font-bold tracking-tight sm:text-base">QADAM Hub</span>
          <span className="whitespace-nowrap rounded-full border border-[#C9A25E]/60 bg-[#C9A25E]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#8A6A2E]">
            LIVE BETA
          </span>
        </div>
        <a
          href={qadamLinks.site}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1B2440] px-3 py-1.5 text-xs font-semibold text-[#F7F4EE] transition hover:bg-[#283459]"
        >
          <span className="hidden sm:inline">Open live site</span>
          <span className="sm:hidden">Live site</span>
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>

      {/* Scrollable body */}
      <div
        data-lenis-prevent="true"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pointer-coarse:overscroll-auto px-3 py-4 sm:px-8 sm:py-8 lg:px-12"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:gap-10">
          {/* Hero */}
          <div className="rounded-2xl border border-[#1B2440]/10 bg-white px-4 py-6 text-center shadow-[0_20px_60px_rgba(27,36,64,0.08)] sm:rounded-3xl sm:p-12">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8A6A2E] sm:text-xs">
              AI opportunity hub · student startup
            </p>
            <h2 className="mt-3 text-[28px] font-extrabold leading-[1.1] tracking-tight sm:mt-4 sm:text-5xl lg:text-6xl">
              QADAM Hub.
              <br />
              <span className="text-[#C9A25E]">Take your first step.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-relaxed text-slate-600 sm:text-base">
              QADAM (Қадам) means &ldquo;step&rdquo; in Kazakh. It finds grants, hackathons, internships and AI
              programs a student is actually eligible for, shows what is missing in their CV, and sends the
              deadlines to Telegram, Discord and KakaoTalk.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:mt-6 sm:flex-row sm:gap-3">
              <a
                href={qadamLinks.site}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B2440] px-6 py-3 text-sm font-semibold text-[#F7F4EE] transition hover:bg-[#283459] sm:w-auto"
              >
                Open QADAM Hub <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a
                href="#qadam-pillars"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('qadam-pillars')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex w-full items-center justify-center rounded-xl border border-[#1B2440]/25 bg-white px-6 py-3 text-sm font-semibold text-[#1B2440] transition hover:border-[#1B2440]/60 sm:w-auto"
              >
                How it works
              </a>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-4 sm:gap-3">
              {STATS.map(([value, label]) => (
                <div key={label} className="rounded-xl border border-[#1B2440]/10 bg-[#F7F4EE]/70 p-3 sm:p-4">
                  <div className="text-xl font-extrabold sm:text-3xl">{value}</div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-500 sm:text-[10px]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pillars */}
          <section id="qadam-pillars" aria-labelledby="qadam-pillars-title" className="flex scroll-mt-4 flex-col gap-4">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#8A6A2E]">Product</p>
              <h3 id="qadam-pillars-title" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Three pillars, one first step
              </h3>
            </div>
            <div className="grid gap-3 md:grid-cols-3 md:gap-4">
              {PILLARS.map(({ icon: Icon, label, title, body, points }) => (
                <article
                  key={label}
                  className="flex flex-col gap-3 rounded-2xl border border-[#1B2440]/10 bg-white p-4 sm:p-5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-[#1B2440] text-[#C9A25E]">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-wider">{label}</p>
                  </div>
                  <h4 className="text-base font-semibold sm:text-lg">{title}</h4>
                  <p className="text-[13px] leading-relaxed text-slate-600 sm:text-sm">{body}</p>
                  <ul className="mt-auto flex flex-col gap-1.5 border-t border-[#1B2440]/10 pt-3">
                    {points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-[#C9A25E]" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <RadarDemo />

          {/* Engineering */}
          <section aria-labelledby="qadam-stack-title" className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#8A6A2E]">
                Under the hood
              </p>
              <h3 id="qadam-stack-title" className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Built and shipped by a student team
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
                I founded QADAM Hub and lead product, design and engineering: the web app, the radar pipeline
                that merges each scan into the existing feed, the shared teammate network on Supabase and the
                messenger bots. The brand, Discord community and launch content were made in house too.
              </p>
            </div>
            <div className="rounded-2xl border border-[#1B2440]/10 bg-white p-4 sm:p-5 md:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Stack</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {STACK.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-[#1B2440]/15 bg-[#F7F4EE] px-2 py-1 text-[11px] text-[#1B2440]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <footer className="flex flex-col items-center gap-2 border-t border-[#1B2440]/10 pt-6 pb-2 text-center text-xs text-slate-500">
            <p className="flex items-center gap-2 font-semibold text-[#1B2440]">
              <QadamMark className="size-4" /> QADAM Hub · AI Opportunity Hub
            </p>
            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <a href={qadamLinks.site} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-[#1B2440] hover:underline">
                Live site
              </a>
              <a href={qadamLinks.instagram} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-[#1B2440] hover:underline">
                Instagram @joinqadamhub
              </a>
              <a href={qadamLinks.tiktok} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-[#1B2440] hover:underline">
                TikTok @qadamhub
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
