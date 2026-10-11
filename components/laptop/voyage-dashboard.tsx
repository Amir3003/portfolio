'use client'

import { useState, useTransition } from 'react'
import {
  Send,
  Sparkles,
  Plane,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react'
import { postAgentTurn } from '@/lib/voyage/client'
import { emptySlots } from '@/lib/voyage/defaults'
import { formatKzt, formatUsd } from '@/lib/voyage/format'
import type { AgentReply, Recommendation, Slots } from '@/lib/voyage/types'
import { voyageLinks } from '@/lib/site'

interface VoyageDashboardProps {
  initialRecommendations?: Recommendation[]
  /**
   * True when rendered inside the fixed-size 3D laptop screen. Viewport breakpoints
   * (sm:, lg:) describe the browser window, not the virtual screen, so the embedded
   * layout is always the desktop two-column layout.
   */
  embedded?: boolean
}

const AUTHENTIC_DEMO_CHIPS = [
  'Solo trip to Dubai from Astana, 5 nights, $2,500',
  'Family holiday in Antalya from Astana, 7 nights, $2,800',
  'Phuket vacation from Almaty, 8 nights, $2,200',
]

const DEFAULT_HIGHLIGHTS: Recommendation[] = [
  {
    id: 'htl-001',
    name: 'Rixos Premium Belek',
    country: 'Turkey',
    location: 'Antalya / Belek',
    stars: 5,
    meal: 'AI - All Inclusive',
    rating: 4.9,
    reviews: 1420,
    matchScore: 98,
    badge: 'Top Recommended',
    amenities: ['High-speed Wi-Fi', 'Private Beach', 'Aqua Park', 'Kids Club', 'All-Inclusive'],
    hotelTotalKzt: 950000,
    flightKzt: 390000,
    totalKzt: 1340000,
    totalUsd: 2680,
    perNightKzt: 191428,
    breakdown: 'Hotel (7n): 950,000 ₸ + Roundtrip Flight: 390,000 ₸',
    guestsBadge: 'Couple Escape · 2 Adults',
    flight: {
      airline: 'Turkish Airlines',
      airlineCode: 'TK',
      aircraft: 'Airbus A321neo',
      fromCity: 'Astana',
      fromCode: 'NQZ',
      toCity: 'Antalya',
      toCode: 'AYT',
      departDate: '2026-10-24',
      returnDate: '2026-10-31',
      duration: '4h 50m',
      priceKzt: 390000,
    },
  },
  {
    id: 'htl-011',
    name: 'Atlantis The Royal',
    country: 'UAE',
    location: 'Dubai · Palm Jumeirah',
    stars: 5,
    meal: 'BB - Bed & Breakfast',
    rating: 5.0,
    reviews: 1940,
    matchScore: 96,
    badge: 'Ultra Luxury Retreat',
    amenities: ['High-speed Wi-Fi', 'Beachfront (First Line)', 'Aqua Park', 'Private Beach'],
    hotelTotalKzt: 2450000,
    flightKzt: 370000,
    totalKzt: 2820000,
    totalUsd: 5640,
    perNightKzt: 402857,
    breakdown: 'Hotel (7n): 2,450,000 ₸ + Roundtrip Flight: 370,000 ₸',
    guestsBadge: 'Couple Escape · 2 Adults',
    flight: {
      airline: 'Flydubai',
      airlineCode: 'FZ',
      aircraft: 'Boeing 737 MAX 8',
      fromCity: 'Astana',
      fromCode: 'NQZ',
      toCity: 'Dubai',
      toCode: 'DXB',
      departDate: '2026-10-28',
      returnDate: '2026-11-04',
      duration: '4h 25m',
      priceKzt: 370000,
    },
  },
  {
    id: 'htl-007',
    name: 'Four Seasons Resort',
    country: 'Egypt',
    location: 'Sharm El Sheikh',
    stars: 5,
    meal: 'AI - All Inclusive',
    rating: 5.0,
    reviews: 920,
    matchScore: 94,
    badge: 'Beachfront Sanctuary',
    amenities: ['High-speed Wi-Fi', 'Private Beach', 'Beachfront (First Line)'],
    hotelTotalKzt: 1680000,
    flightKzt: 420000,
    totalKzt: 2100000,
    totalUsd: 4200,
    perNightKzt: 300000,
    breakdown: 'Hotel (7n): 1,680,000 ₸ + Roundtrip Flight: 420,000 ₸',
    guestsBadge: 'Couple Escape · 2 Adults',
    flight: {
      airline: 'Air Astana',
      airlineCode: 'KC',
      aircraft: 'Airbus A321LR',
      fromCity: 'Astana',
      fromCode: 'NQZ',
      toCity: 'Sharm El Sheikh',
      toCode: 'SSH',
      departDate: '2026-11-02',
      returnDate: '2026-11-09',
      duration: '5h 15m',
      priceKzt: 420000,
    },
  },
]

export function VoyageDashboard({
  initialRecommendations = DEFAULT_HIGHLIGHTS,
  embedded = false,
}: VoyageDashboardProps) {
  const [input, setInput] = useState('')
  const [slots, setSlots] = useState<Slots>(emptySlots)
  const [reply, setReply] = useState<AgentReply | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const activeResults = reply?.results && reply.results.length > 0 ? reply.results : initialRecommendations

  const showInline = embedded ? 'inline' : 'hidden sm:inline'
  const showInlineBlock = embedded ? 'inline-block' : 'hidden sm:inline-block'
  const bodyLayout = embedded ? 'flex-row' : 'flex-col lg:flex-row'
  const leftColLayout = embedded
    ? 'w-[44%] border-r'
    : 'border-b lg:w-[44%] lg:border-b-0 lg:border-r'
  const titleRowLayout = embedded
    ? 'flex flex-row items-baseline justify-between'
    : 'flex flex-col sm:flex-row sm:items-baseline sm:justify-between'
  const breakdownWidth = embedded ? 'max-w-none' : 'max-w-[260px] sm:max-w-none'

  const handleSubmit = (query: string) => {
    const text = query.trim()
    if (!text || isPending) return
    setError(null)

    startTransition(async () => {
      try {
        const res = await postAgentTurn(text, slots)
        setReply(res)
        setSlots(res.slots)
        setInput('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to query Voyage AI agent.')
      }
    })
  }

  const handleReset = () => {
    setSlots(emptySlots())
    setReply(null)
    setInput('')
    setError(null)
  }

  return (
    <div
      data-lenis-prevent="true"
      style={{
        backgroundColor: '#070d18',
        borderColor: 'rgba(94, 234, 212, 0.22)',
      }}
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl border text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
    >
      {/* Authentic Header */}
      <div
        style={{
          backgroundColor: '#0b1528',
          borderBottomColor: 'rgba(94, 234, 212, 0.16)',
        }}
        className="flex shrink-0 items-center justify-between border-b px-4 py-2.5 sm:px-5"
      >
        <div className="flex items-center gap-3">
          {/* Cyan Status Dot */}
          <div className="flex size-2 items-center justify-center">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-400 opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-teal-400" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-white font-sans text-sm">
              Voyage<b className="text-teal-400">AI</b>
            </span>
            <span className="text-slate-600">//</span>
            <span className={`text-xs text-slate-400 ${showInline}`}>Autonomous Travel Concierge</span>
          </div>
          <span
            style={{
              backgroundColor: 'rgba(45, 212, 191, 0.1)',
              borderColor: 'rgba(94, 234, 212, 0.25)',
              color: '#5eead4',
            }}
            className={`rounded px-2 py-0.5 text-[10px] font-mono border ${showInlineBlock}`}
          >
            LIVE ENGINE · 24/7
          </span>
        </div>

        <div className="flex items-center gap-2">
          {reply && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              <RefreshCw className="size-3" />
              Reset
            </button>
          )}
          <a
            href={voyageLinks.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-200 transition hover:border-teal-400/50 hover:text-white"
          >
            <span>GitHub</span>
            <ExternalLink className="size-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Main Split Body */}
      <div className={`flex min-h-0 flex-1 overflow-hidden ${bodyLayout}`}>
        {/* Left Column: Authentic Chat Concierge Panel */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            borderRightColor: 'rgba(94, 234, 212, 0.16)',
          }}
          data-lenis-prevent="true"
          className={`flex min-h-0 flex-col overflow-y-auto overscroll-contain p-4 sm:p-5 ${leftColLayout}`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono text-teal-400">
              <Sparkles className="size-3.5" />
              <span>NATURAL LANGUAGE EXTRACTION</span>
            </div>
            {reply && (
              <span
                className={`font-mono text-[10px] uppercase tracking-wider ${
                  reply.state === 'COMPLETE'
                    ? 'text-teal-400'
                    : reply.state === 'BUDGET_MISMATCH'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                }`}
              >
                ● {reply.state} {reply.elapsedMs ? `(${reply.elapsedMs}ms)` : ''}
              </span>
            )}
          </div>

          {/* Authentic Assistant Welcome Message Bubble */}
          <div
            style={{
              backgroundColor: 'rgba(17, 28, 48, 0.85)',
              borderColor: 'rgba(94, 234, 212, 0.16)',
            }}
            className="mb-3 rounded-xl border p-3.5 text-xs leading-relaxed text-slate-200 shadow-sm"
          >
            <div className="mb-1.5 flex items-center gap-1.5 text-teal-300 font-medium">
              <span className="size-1.5 rounded-full bg-teal-400" />
              <span>Voyage AI Assistant</span>
            </div>
            {error ? (
              <div className="flex items-start gap-2 text-rose-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            ) : reply ? (
              <p className="text-slate-100">{reply.reply}</p>
            ) : (
              <p>
                Welcome to Voyage AI! I am your autonomous travel concierge. Where would you like to travel, for how many nights, and what is your preferred budget and party size?
              </p>
            )}
          </div>

          {/* Query Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(input)
            }}
            className="relative mb-3 flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Solo luxury escape to Dubai, 5 nights, $2,500..."
              style={{
                backgroundColor: 'rgba(11, 21, 40, 0.9)',
                borderColor: 'rgba(94, 234, 212, 0.22)',
              }}
              className="w-full rounded-xl border px-3.5 py-2.5 pr-12 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              aria-label="Send query"
              style={{
                backgroundColor: '#2dd4bf',
                color: '#070d18',
              }}
              className="absolute right-1.5 flex size-8 items-center justify-center rounded-lg font-bold transition hover:bg-teal-300 disabled:opacity-40"
            >
              <Send className="size-3.5" />
            </button>
          </form>

          {/* Authentic Demo Quick-Launch Chips */}
          <div className="mb-4">
            <p className="mb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              DEMO QUICK-LAUNCH INTENTS
            </p>
            <div className="flex flex-col gap-1.5">
              {AUTHENTIC_DEMO_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setInput(chip)
                    handleSubmit(chip)
                  }}
                  style={{
                    backgroundColor: 'rgba(17, 28, 48, 0.65)',
                    borderColor: 'rgba(94, 234, 212, 0.12)',
                  }}
                  className="group flex items-center justify-between rounded-lg border px-3 py-1.5 text-left text-[11px] text-slate-300 transition hover:border-teal-400/40 hover:bg-slate-800/80 hover:text-white"
                >
                  <span className="truncate pr-2">{chip}</span>
                  <ChevronRight className="size-3 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-teal-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Extracted Slots Telemetry */}
          {(slots.country || slots.budgetKzt || slots.nights || slots.adults) && (
            <div
              style={{
                backgroundColor: 'rgba(11, 21, 40, 0.75)',
                borderColor: 'rgba(94, 234, 212, 0.16)',
              }}
              className="mt-auto rounded-xl border p-3"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                <SlidersHorizontal className="size-3 text-teal-400" />
                <span>PARSED CRITERIA:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {slots.origin && (
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                    Origin: {slots.origin}
                  </span>
                )}
                {slots.country && (
                  <span
                    style={{
                      backgroundColor: 'rgba(45, 212, 191, 0.12)',
                      borderColor: 'rgba(94, 234, 212, 0.25)',
                      color: '#5eead4',
                    }}
                    className="rounded border px-2 py-0.5"
                  >
                    Dest: {slots.country}
                  </span>
                )}
                {slots.nights && (
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                    Nights: {slots.nights}
                  </span>
                )}
                {slots.adults && (
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                    Guests: {slots.adults}A {slots.children > 0 ? `+ ${slots.children}C` : ''}
                  </span>
                )}
                {slots.budgetKzt && (
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                    Budget: {formatKzt(slots.budgetKzt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Authentic Bespoke Selection Results */}
        <div data-lenis-prevent="true" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400">
                BESPOKE SELECTION
              </span>
              <h4 className="text-sm font-semibold text-white">
                Top Tailored Packages ({activeResults.length})
              </h4>
            </div>
            <span className="font-mono text-[10px] text-teal-400/80">
              DIRECT FLIGHTS + 5★ SUITES
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {activeResults.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'rgba(17, 28, 48, 0.85)',
                  borderColor: 'rgba(94, 234, 212, 0.16)',
                }}
                className="group relative flex flex-col justify-between rounded-xl border p-3.5 transition hover:border-teal-400/40"
              >
                <div>
                  {/* Top Badges & Match Score */}
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <span
                        style={{
                          backgroundColor: 'rgba(251, 191, 36, 0.12)',
                          borderColor: 'rgba(251, 191, 36, 0.3)',
                          color: '#fbbf24',
                        }}
                        className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div
                      style={{
                        backgroundColor: 'rgba(45, 212, 191, 0.12)',
                        borderColor: 'rgba(94, 234, 212, 0.25)',
                        color: '#5eead4',
                      }}
                      className="rounded border px-2 py-0.5 font-mono text-[11px]"
                    >
                      <span>{item.matchScore}% Match</span>
                    </div>
                  </div>

                  {/* Title & Location */}
                  <div className={titleRowLayout}>
                    <h5 className="text-sm sm:text-base font-semibold text-white transition-colors group-hover:text-teal-300">
                      {item.name}
                    </h5>
                    <span className="font-mono text-xs text-slate-300">
                      {item.location}
                    </span>
                  </div>

                  {/* Rating, Stars, Meal */}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="size-3 fill-amber-400" />
                      <span className="font-medium text-slate-100">{item.rating}</span>
                      <span className="text-[11px] text-slate-400">({item.reviews})</span>
                    </div>
                    <span className="text-slate-600">·</span>
                    <span className="rounded bg-slate-800/60 px-1.5 py-0.5 font-mono text-[11px] text-slate-200">
                      {item.stars}★ Luxury
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-[11px] text-slate-200">{item.meal}</span>
                  </div>

                  {/* Flight Info Snippet */}
                  <div
                    style={{
                      backgroundColor: 'rgba(11, 21, 40, 0.85)',
                      borderColor: 'rgba(94, 234, 212, 0.12)',
                    }}
                    className="mt-2.5 flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px] text-slate-200"
                  >
                    <Plane className="size-3.5 text-teal-400" />
                    <span>
                      {item.flight.airline} ({item.flight.fromCode} → {item.flight.toCode})
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300">{item.flight.duration}</span>
                    <span className={`ml-auto text-slate-400 ${showInline}`}>
                      {item.flight.aircraft}
                    </span>
                  </div>
                </div>

                {/* Bottom Pricing Row */}
                <div
                  style={{ borderTopColor: 'rgba(94, 234, 212, 0.12)' }}
                  className="mt-3 flex items-end justify-between border-t pt-2.5"
                >
                  <div className="flex flex-col font-mono text-[11px] text-slate-400">
                    <span className={`truncate ${breakdownWidth}`}>{item.breakdown}</span>
                    <span className="text-slate-300">{item.guestsBadge}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm sm:text-base font-bold text-teal-300">
                      {formatKzt(item.totalKzt)}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      ≈ {formatUsd(item.totalKzt)} total
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
