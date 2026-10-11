'use client'

import { useState, useTransition } from 'react'
import {
  Send,
  Sparkles,
  Plane,
  Building2,
  Calendar,
  Users,
  Wallet,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { postAgentTurn } from '@/lib/voyage/client'
import { SEASONAL_PROMPTS, emptySlots } from '@/lib/voyage/defaults'
import { formatKzt, formatUsd } from '@/lib/voyage/format'
import type { AgentReply, Recommendation, Slots } from '@/lib/voyage/types'
import { voyageLinks } from '@/lib/site'

interface VoyageDashboardProps {
  initialRecommendations?: Recommendation[]
}

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

export function VoyageDashboard({ initialRecommendations = DEFAULT_HIGHLIGHTS }: VoyageDashboardProps) {
  const [input, setInput] = useState('')
  const [slots, setSlots] = useState<Slots>(emptySlots)
  const [reply, setReply] = useState<AgentReply | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const activeResults = reply?.results && reply.results.length > 0 ? reply.results : initialRecommendations

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
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl backdrop-blur-2xl">
      {/* Console Topbar */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 bg-neutral-900/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-2.5 items-center justify-center">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-lime-400" />
            </span>
          </div>
          <span className="font-mono text-xs font-medium tracking-wider text-neutral-300">
            VOYAGE AI <span className="text-neutral-500">//</span> TRAVEL CONCIERGE ENGINE
          </span>
          <span className="hidden rounded bg-neutral-800/80 px-2 py-0.5 font-mono text-[10px] text-lime-400 sm:inline-block">
            LIVE CATALOG
          </span>
        </div>

        <div className="flex items-center gap-2">
          {reply && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 px-2.5 py-1 font-mono text-[11px] text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200"
            >
              <RefreshCw className="size-3" />
              Reset
            </button>
          )}
          <a
            href={voyageLinks.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 font-mono text-[11px] text-neutral-300 transition hover:border-neutral-700 hover:text-white"
          >
            <span>GitHub</span>
            <ExternalLink className="size-3 text-neutral-500" />
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Side: Agent Interaction & Slot Telemetry */}
        <div className="flex flex-col border-b border-neutral-800/80 p-4 sm:p-5 lg:w-[45%] lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
              <Sparkles className="size-3.5 text-lime-400" />
              <span>NATURAL LANGUAGE QUERY</span>
            </div>
            {reply && (
              <span
                className={`font-mono text-[10px] uppercase tracking-wider ${
                  reply.state === 'COMPLETE'
                    ? 'text-lime-400'
                    : reply.state === 'BUDGET_MISMATCH'
                      ? 'text-red-400'
                      : 'text-neutral-400'
                }`}
              >
                ● {reply.state} {reply.elapsedMs ? `(${reply.elapsedMs}ms)` : ''}
              </span>
            )}
          </div>

          {/* Prompt Form */}
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
              placeholder="e.g. Dubai for 5 nights from Astana, budget $2,500..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-2.5 pr-11 font-mono text-xs text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50"
            />
            <button
              type="submit"
              disabled={isPending || !input.trim()}
              aria-label="Send query"
              className="absolute right-1.5 flex size-8 items-center justify-center rounded-lg bg-lime-400 text-neutral-950 transition hover:bg-lime-300 disabled:opacity-40 disabled:hover:bg-lime-400"
            >
              <Send className="size-3.5" />
            </button>
          </form>

          {/* Quick-Prompt Chips */}
          <div className="mb-4">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
              SAMPLE TEST INTENTS
            </p>
            <div className="flex flex-col gap-1.5">
              {SEASONAL_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt)
                    handleSubmit(prompt)
                  }}
                  className="group flex items-center justify-between rounded-lg border border-neutral-900 bg-neutral-900/40 px-2.5 py-1.5 text-left font-mono text-[11px] text-neutral-400 transition hover:border-neutral-700 hover:bg-neutral-800/40 hover:text-neutral-200"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <ChevronRight className="size-3 shrink-0 text-neutral-600 transition group-hover:translate-x-0.5 group-hover:text-lime-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Agent Reply Message or Guide */}
          <div className="mt-auto rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-3 sm:p-4">
            {error ? (
              <div className="flex items-start gap-2.5 text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">{error}</p>
              </div>
            ) : reply ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-lime-400">
                  <CheckCircle2 className="size-3.5" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">CONCIERGE SYNTHESIS</span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-300">{reply.reply}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 text-neutral-400">
                <div className="flex items-center gap-1.5 text-lime-400">
                  <Sparkles className="size-3.5" />
                  <span className="font-mono text-[11px] font-medium tracking-wider">REAL-TIME INFERENCE READY</span>
                </div>
                <p className="text-xs leading-relaxed">
                  Enter criteria or pick a prompt above. The recommendation engine computes SQL-level package constraints, GDS flight availability, and returns curated 5-star itineraries.
                </p>
              </div>
            )}

            {/* Extracted Slots Telemetry */}
            {(slots.country || slots.budgetKzt || slots.nights || slots.adults) && (
              <div className="mt-3 border-t border-neutral-800/80 pt-2.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  RECOGNIZED PARAMETERS:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {slots.origin && (
                    <span className="rounded bg-neutral-800/60 px-2 py-0.5 text-neutral-300">
                      Origin: {slots.origin}
                    </span>
                  )}
                  {slots.country && (
                    <span className="rounded bg-lime-400/10 px-2 py-0.5 text-lime-300">
                      Dest: {slots.country}
                    </span>
                  )}
                  {slots.nights && (
                    <span className="rounded bg-neutral-800/60 px-2 py-0.5 text-neutral-300">
                      Nights: {slots.nights}
                    </span>
                  )}
                  {slots.adults && (
                    <span className="rounded bg-neutral-800/60 px-2 py-0.5 text-neutral-300">
                      Guests: {slots.adults}A {slots.children > 0 ? `+ ${slots.children}C` : ''}
                    </span>
                  )}
                  {slots.budgetKzt && (
                    <span className="rounded bg-neutral-800/60 px-2 py-0.5 text-neutral-300">
                      Budget: {formatKzt(slots.budgetKzt)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Results Feed */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-xs text-neutral-400">
              TOP CURATED PACKAGES ({activeResults.length})
            </span>
            <span className="font-mono text-[11px] text-neutral-500">
              HOTEL + DIRECT FLIGHT SYNC
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {activeResults.map((item, idx) => (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 transition hover:border-neutral-700 hover:bg-neutral-900/70"
              >
                <div>
                  {/* Top Badges & Score */}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-500">#{String(idx + 1).padStart(2, '0')}</span>
                      <span className="rounded-full border border-lime-500/30 bg-lime-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-lime-300">
                        {item.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 rounded bg-neutral-800/70 px-2 py-0.5 font-mono text-[11px] text-lime-400">
                      <span>{item.matchScore}% Match</span>
                    </div>
                  </div>

                  {/* Title & Location */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                    <h4 className="text-base font-medium text-neutral-100 group-hover:text-lime-300 transition-colors">
                      {item.name}
                    </h4>
                    <span className="text-xs text-neutral-400 font-mono">
                      {item.location}
                    </span>
                  </div>

                  {/* Rating, Stars & Board */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="size-3 fill-amber-400" />
                      <span className="font-medium text-neutral-200">{item.rating}</span>
                      <span className="text-[11px] text-neutral-500">({item.reviews})</span>
                    </div>
                    <span className="text-neutral-700">·</span>
                    <span className="rounded bg-neutral-800/40 px-1.5 py-0.5 font-mono text-[11px] text-neutral-300">
                      {item.stars}★ Luxury
                    </span>
                    <span className="text-neutral-700">·</span>
                    <span className="font-mono text-[11px] text-neutral-300">{item.meal}</span>
                  </div>

                  {/* Flight Info Snippet */}
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-800/60 bg-neutral-950/60 px-3 py-2 font-mono text-[11px] text-neutral-300">
                    <Plane className="size-3.5 text-lime-400" />
                    <span>{item.flight.airline} ({item.flight.fromCode} → {item.flight.toCode})</span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-neutral-400">{item.flight.duration}</span>
                    <span className="ml-auto text-neutral-500 hidden sm:inline">{item.flight.aircraft}</span>
                  </div>
                </div>

                {/* Bottom Pricing Row */}
                <div className="mt-3.5 flex items-end justify-between border-t border-neutral-800/60 pt-3">
                  <div className="flex flex-col font-mono text-[11px] text-neutral-500">
                    <span>{item.breakdown}</span>
                    <span className="text-neutral-400">{item.guestsBadge}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold text-lime-400 font-mono">
                      {formatKzt(item.totalKzt)}
                    </div>
                    <div className="font-mono text-[11px] text-neutral-500">
                      ≈ {formatUsd(item.totalKzt)} total package
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

