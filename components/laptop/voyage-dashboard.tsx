'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react'
import { Check, ExternalLink, RefreshCw, ShieldCheck, Star, X } from 'lucide-react'
import { postAgentTurn } from '@/lib/voyage/client'
import { emptySlots } from '@/lib/voyage/defaults'
import { formatKzt, formatUsd } from '@/lib/voyage/format'
import type { Recommendation, Slots } from '@/lib/voyage/types'
import { voyageLinks } from '@/lib/site'

/* -------------------------------------------------------------------------- */
/*  View model                                                                */
/* -------------------------------------------------------------------------- */

interface PkgFlight {
  airline: string
  code: string
  aircraft: string
  fromCode: string
  toCode: string
  duration: string
  times: string
  baggage: string
}

interface Pkg {
  id: string
  name: string
  place: string
  rating: number
  badge: string
  affinity: number
  guests: string
  photo: string
  photoFallback?: string
  flight: PkgFlight
  /** ISO date of the central departure option. */
  departIso: string
  nights: number
  flightKzt: number
  /** Total package price at the central date and the initial meal plan. */
  baseKzt: number
  mealCode: string
  beach: string | null
  cityKm: number | null
  amenities: string[]
}

interface Suite {
  id: string
  name: string
  detail: string
  extraKzt: number
}

interface Chip {
  label: string
  query: string
}

interface Message {
  id: number
  role: 'assistant' | 'user' | 'error'
  text: string
}

type Step = 'closed' | 'suites' | 'confirm' | 'done'

interface Selection {
  pkg: Pkg
  dateLabel: string
  mealCode: string
  totalKzt: number
}

/* -------------------------------------------------------------------------- */
/*  Static content                                                            */
/* -------------------------------------------------------------------------- */

const WELCOME =
  'Welcome to Voyage AI! I am your autonomous travel concierge. Where would you like to travel, for how many nights, and what is your preferred budget and party size?'

const CHIPS: readonly Chip[] = [
  {
    label: 'Need flights to Dubai, 2 adults, for a week...',
    query: 'Need flights to Dubai from Astana, 2 adults, 7 nights, $3,500',
  },
  { label: 'Solo trip to Dubai, 5 nights', query: 'Solo trip to Dubai from Astana, 5 nights, $2,500' },
  {
    label: 'Family holiday in Antalya from Astana, 7 nights',
    query: 'Family holiday in Antalya from Astana, 7 nights, $2,800',
  },
  { label: 'Phuket vacation, 8 nights', query: 'Phuket vacation from Almaty, 8 nights, $2,200' },
]

const MEAL_PLANS: readonly { code: string; surcharge: number }[] = [
  { code: 'BB', surcharge: 0 },
  { code: 'HB', surcharge: 65000 },
  { code: 'FB', surcharge: 120000 },
  { code: 'AI', surcharge: 190000 },
  { code: 'UAI', surcharge: 280000 },
]

const SUITES: readonly Suite[] = [
  { id: 'superior', name: 'Superior City View', detail: '32 m² · King bed · City skyline view', extraKzt: 0 },
  { id: 'deluxe', name: 'Deluxe Sea View', detail: '38 m² · King bed · Private balcony, sea view', extraKzt: 95000 },
  { id: 'executive', name: 'Executive Suite', detail: '58 m² · Separate lounge · Club lounge access', extraKzt: 210000 },
  { id: 'royal', name: 'Royal Panorama Suite', detail: '96 m² · Two bedrooms · Panoramic terrace, butler', extraKzt: 420000 },
]

const INCLUDED_AMENITIES: readonly string[] = [
  'Free high-speed Wi-Fi',
  'Round-trip airport transfer',
  'Daily housekeeping and turndown',
  'Spa and fitness access',
  '24/7 Voyage AI concierge',
]

interface ResortPhoto {
  src: string
  fallback: string
}

const PHOTOS: readonly ResortPhoto[] = [
  {
    src: '/resorts/resort-1.svg',
    fallback: '/resorts/resort-1.svg',
  },
  {
    src: '/resorts/resort-2.svg',
    fallback: '/resorts/resort-2.svg',
  },
  {
    src: '/resorts/resort-3.svg',
    fallback: '/resorts/resort-3.svg',
  },
  {
    src: '/resorts/resort-4.svg',
    fallback: '/resorts/resort-4.svg',
  },
  {
    src: '/resorts/resort-5.svg',
    fallback: '/resorts/resort-5.svg',
  },
]

const DATE_STEP_KZT = 22000

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const mealCodeOf = (meal: string): string => meal.split(' ')[0] ?? 'BB'

const mealSurcharge = (code: string): number =>
  MEAL_PLANS.find((m) => m.code === code)?.surcharge ?? 0

function isoMs(iso: string): number {
  const p = iso.split('-')
  return Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
}

function shiftLabel(iso: string, days: number): string {
  const d = new Date(isoMs(iso) + days * 86400000)
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function addMinutes(time: string, add: number): string {
  const p = time.split(':')
  const total = (Number(p[0]) * 60 + Number(p[1]) + add) % (24 * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function durationMinutes(text: string): number {
  const m = /(\d+)h\s*(\d+)m/.exec(text)
  return Number(m?.[1] ?? 0) * 60 + Number(m?.[2] ?? 0)
}

function toPackage(r: Recommendation, index: number): Pkg {
  const nights = Math.max(
    1,
    Math.round((isoMs(r.flight.returnDate) - isoMs(r.flight.departDate)) / 86400000),
  )
  const depart = '09:10'
  const beachfront = r.amenities.includes('Beachfront (First Line)')
  const privateBeach = r.amenities.includes('Private Beach')
  const photo = PHOTOS[index % PHOTOS.length] ?? PHOTOS[0]!
  return {
    id: r.id,
    name: r.name,
    place: `${r.country}, ${r.location} · ${r.stars}★ · ${r.meal}`,
    rating: r.rating,
    badge: r.badge,
    affinity: r.matchScore,
    guests: r.guestsBadge,
    photo: photo.src,
    photoFallback: photo.fallback,
    flight: {
      airline: r.flight.airline,
      code: r.flight.airlineCode,
      aircraft: r.flight.aircraft,
      fromCode: r.flight.fromCode,
      toCode: r.flight.toCode,
      duration: r.flight.duration,
      times: `${depart} → ${addMinutes(depart, durationMinutes(r.flight.duration))}`,
      baggage: '23 kg + 8 kg',
    },
    departIso: r.flight.departDate,
    nights,
    flightKzt: r.flightKzt,
    baseKzt: r.totalKzt,
    mealCode: mealCodeOf(r.meal),
    beach: beachfront ? 'Beachfront' : privateBeach ? 'Private beach' : null,
    cityKm: null,
    amenities: [...r.amenities],
  }
}

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                              */
/* -------------------------------------------------------------------------- */

function HotelPhoto({
  src,
  fallbackSrc,
  alt,
  className,
}: {
  src: string
  fallbackSrc?: string
  alt: string
  className: string
}) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
    }
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="eager"
      decoding="async"
      onError={handleError}
      className={`object-cover ${className}`}
    />
  )
}

function Bubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-teal-400/15 px-4 py-2.5 text-sm text-teal-50">
          {message.text}
        </p>
      </div>
    )
  }
  return (
    <div className="flex justify-start">
      <p
        className={`max-w-[85%] rounded-2xl rounded-bl-md bg-slate-800/70 px-4 py-2.5 text-sm leading-relaxed ${
          message.role === 'error' ? 'text-rose-300' : 'text-slate-100'
        }`}
      >
        {message.text}
      </p>
    </div>
  )
}

function PendingBubble() {
  return (
    <div role="status" aria-label="Voyage AI is preparing your packages" className="flex justify-start">
      <div className="flex w-64 flex-col gap-2 rounded-2xl rounded-bl-md bg-slate-800/70 px-4 py-3">
        <div className="h-3 w-11/12 animate-pulse rounded bg-slate-600/50" />
        <div className="h-3 w-8/12 animate-pulse rounded bg-slate-600/50" />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Package card                                                              */
/* -------------------------------------------------------------------------- */

function PackageCard({ pkg, onExplore }: { pkg: Pkg; onExplore: (selection: Selection) => void }) {
  const [dateIdx, setDateIdx] = useState(2)
  const [meal, setMeal] = useState(pkg.mealCode)

  const initialSurcharge = mealSurcharge(pkg.mealCode)
  const dates = useMemo(
    () => [-2, -1, 0, 1, 2].map((offset) => ({ offset, label: shiftLabel(pkg.departIso, offset) })),
    [pkg.departIso],
  )
  const priceFor = (idx: number, code: string): number =>
    pkg.baseKzt + (idx - 2) * DATE_STEP_KZT + mealSurcharge(code) - initialSurcharge

  const total = priceFor(dateIdx, meal)
  const selected = dates[dateIdx]
  const departLabel = selected?.label ?? shiftLabel(pkg.departIso, 0)
  const returnLabel = shiftLabel(pkg.departIso, (selected?.offset ?? 0) + pkg.nights)

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-teal-300/15 bg-[#0b1426] shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
      <div className="relative h-44 shrink-0">
        <HotelPhoto
          src={pkg.photo}
          fallbackSrc={pkg.photoFallback}
          alt={pkg.name}
          className="absolute inset-0 size-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1426] via-transparent to-black/20" />
        <span className="absolute left-3 top-3 rounded bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-slate-900">
          {pkg.badge}
        </span>
        <span className="absolute right-3 top-3 rounded bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white">
          {pkg.affinity}% Affinity
        </span>
        <span className="absolute bottom-3 left-3 rounded border border-emerald-400/40 bg-emerald-900/80 px-2 py-0.5 text-[11px] text-emerald-200">
          {pkg.guests}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{pkg.name}</h3>
            <p className="mt-0.5 truncate text-xs text-slate-400">{pkg.place}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-400 px-2 py-1 text-xs font-bold text-slate-900">
            <Star className="size-3 fill-slate-900" aria-hidden="true" />
            {pkg.rating.toFixed(1)}
          </span>
        </div>

        <div className="rounded-xl border border-teal-300/15 bg-[#08101f] p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="rounded border border-teal-300/30 bg-teal-400/10 px-1.5 py-0.5 font-mono text-[10px] text-teal-300">
                {pkg.flight.code}
              </span>
              <span className="truncate font-medium text-slate-100">
                {pkg.flight.airline} · {pkg.flight.aircraft}
              </span>
            </div>
            <span className="hidden shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300 sm:inline">
              Flight Included in Package
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-slate-300">
            <p>
              Direct Flight:{' '}
              <span className="font-semibold text-teal-300">
                {pkg.flight.fromCode} → {pkg.flight.toCode}
              </span>{' '}
              ({departLabel} - {returnLabel}), non-stop
            </p>
            <span className="shrink-0 text-slate-400">{pkg.flight.duration}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span>{pkg.flight.times}</span>
            <span>{pkg.flight.baggage}</span>
          </div>
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Flexible departure dates:
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {dates.map((d, idx) => {
              const active = idx === dateIdx
              return (
                <button
                  key={d.offset}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDateIdx(idx)}
                  className={`flex flex-col items-center rounded-lg border px-1 py-1.5 transition ${
                    active
                      ? 'border-teal-300 bg-teal-400/10 shadow-[0_0_14px_rgba(45,212,191,0.35)]'
                      : 'border-slate-700/70 bg-[#08101f] hover:border-teal-300/50'
                  }`}
                >
                  <span className={`text-[11px] font-semibold ${active ? 'text-white' : 'text-slate-200'}`}>
                    {d.label}
                    {active ? ' (Selected)' : ''}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{formatKzt(priceFor(idx, meal))}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {pkg.beach ? (
            <span className="rounded border border-teal-300/25 bg-teal-400/10 px-2 py-0.5 text-teal-200">
              Beach: {pkg.beach}
            </span>
          ) : null}
          {pkg.cityKm !== null ? (
            <span className="rounded border border-teal-300/25 bg-teal-400/10 px-2 py-0.5 text-teal-200">
              City center: {pkg.cityKm} km
            </span>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">Meal plan:</p>
          <div className="flex flex-wrap gap-1.5">
            {MEAL_PLANS.map((m) => {
              const delta = m.surcharge - initialSurcharge
              const active = m.code === meal
              const hint = delta === 0 ? 'base' : `${delta > 0 ? '+' : '-'}${Math.abs(delta) / 1000}K`
              return (
                <button
                  key={m.code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMeal(m.code)}
                  className={`rounded-md border px-2 py-1 text-[11px] transition ${
                    active
                      ? 'border-teal-300 bg-teal-400/15 text-teal-100'
                      : 'border-slate-700/70 bg-[#08101f] text-slate-300 hover:border-teal-300/50'
                  }`}
                >
                  <span className="font-semibold">{m.code}</span>{' '}
                  <span className="text-slate-400">{hint}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-auto rounded-xl border border-teal-300/15 bg-[#08101f] px-4 py-3">
          <div className="flex items-end justify-between gap-3">
            <p className="text-2xl font-bold text-white">
              {formatKzt(total)}{' '}
              <span className="text-sm font-semibold text-teal-300">({formatUsd(total)})</span>
            </p>
            <span className="text-xs text-teal-300">Instant Confirmation</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-400">
            Hotel ({pkg.nights}n): {formatKzt(total - pkg.flightKzt)} + Roundtrip Flight: {formatKzt(pkg.flightKzt)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onExplore({ pkg, dateLabel: departLabel, mealCode: meal, totalKzt: total })}
          className="flex items-center justify-between rounded-xl border border-teal-300/30 bg-teal-400/5 px-4 py-3 text-sm font-semibold text-teal-300 transition hover:border-teal-300 hover:bg-teal-400/10"
        >
          <span>Explore Suite Options &amp; Details</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                 */
/* -------------------------------------------------------------------------- */

export function VoyageDashboard() {
  const [input, setInput] = useState('')
  const [slots, setSlots] = useState<Slots>(emptySlots)
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'assistant', text: WELCOME }])
  const [packages, setPackages] = useState<readonly Pkg[]>([])
  const [isPending, startTransition] = useTransition()
  const logRef = useRef<HTMLDivElement>(null)
  const curationRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  const [step, setStep] = useState<Step>('closed')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [suiteId, setSuiteId] = useState<string>(SUITES[0]?.id ?? 'superior')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [reference, setReference] = useState('')

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isPending])

  const closeModal = () => {
    setStep('closed')
    setPhoneError(null)
  }

  useEffect(() => {
    if (step === 'closed') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  const push = (role: Message['role'], text: string) => {
    const id = nextId.current++
    setMessages((prev) => [...prev, { id, role, text }])
  }

  const send = (query: string) => {
    const text = query.trim()
    if (!text || isPending) return
    push('user', text)
    setInput('')
    startTransition(async () => {
      try {
        const res = await postAgentTurn(text, slots)
        setSlots(res.slots)
        push('assistant', res.reply)
        if (res.results.length > 0) {
          setPackages(res.results.map(toPackage))
        } else {
          setPackages([])
        }
      } catch (err) {
        push('error', err instanceof Error ? err.message : 'Voyage AI could not be reached. Please try again.')
      }
    })
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    send(input)
  }

  const reset = () => {
    setSlots(emptySlots())
    setMessages([{ id: 0, role: 'assistant', text: WELCOME }])
    nextId.current = 1
    setPackages([])
    setInput('')
  }

  const explore = (s: Selection) => {
    setSelection(s)
    setSuiteId(SUITES[0]?.id ?? 'superior')
    setPhone('')
    setPhoneError(null)
    setStep('suites')
  }

  const suite = SUITES.find((s) => s.id === suiteId) ?? SUITES[0]
  const finalTotal = (selection?.totalKzt ?? 0) + (suite?.extraKzt ?? 0)

  const confirm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) {
      setPhoneError('Enter a valid phone or WhatsApp number (7 to 15 digits).')
      return
    }
    setPhoneError(null)
    setReference(`VAI-${Date.now().toString(36).toUpperCase().slice(-6)}`)
    setStep('done')
  }

  const amenityList = useMemo(() => {
    const own = selection?.pkg.amenities ?? []
    return Array.from(new Set([...own, ...INCLUDED_AMENITIES]))
  }, [selection])

  const chatHasReply = messages.length > 1

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-teal-300/20 bg-[#050a14] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-teal-300/15 bg-[#070e1c] px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg border border-teal-400/40 bg-teal-400/10 text-xs font-bold font-mono text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.25)]">
            V
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Voyage<span className="text-teal-400">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 font-mono text-[10px] font-semibold text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            MVP PROTOTYPE · IN ACTIVE DEVELOPMENT
          </span>
          <div className="flex items-center rounded-lg border border-teal-300/20 bg-teal-400/5 p-0.5 text-[11px] font-mono">
            <span className="rounded bg-teal-400 px-1.5 py-0.5 font-bold text-[#050a14]">EN</span>
            <span className="px-1.5 py-0.5 text-slate-400">RU</span>
          </div>
          <a
            href={voyageLinks.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1 text-[11px] text-slate-200 transition hover:border-teal-400/50 hover:text-white"
          >
            GitHub
            <ExternalLink className="size-3 text-slate-400" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        data-lenis-prevent="true"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-8 sm:px-8 lg:px-12"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          {/* Hero Banner from Screenshot 1 */}
          <div className="relative overflow-hidden rounded-3xl border border-teal-300/20 bg-gradient-to-b from-[#0a182e]/90 via-[#071120]/95 to-[#050a14] p-8 text-center sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/12 via-transparent to-transparent" />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider text-teal-300">
                AUTONOMOUS LUXURY TRAVEL · 24/7 CONCIERGE
              </span>
              <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.2)]">
                MVP STAGE · ACTIVE DEVELOPMENT
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Voyage AI.
              <br />
              <span className="bg-gradient-to-r from-teal-200 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                Your Autonomous
                <br />
                Travel Concierge
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Bespoke itinerary curation powered by Google Gemini. Direct roundtrip flights, handpicked 5-star suites,
              and transparent pricing in USD &amp; KZT with zero commission markups.{' '}
              <span className="font-semibold text-amber-300">
                (Voyage AI is currently in active development — this is an interactive MVP prototype).
              </span>
            </p>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => curationRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-6 py-3 text-sm font-bold text-[#050a14] shadow-[0_0_24px_rgba(45,212,191,0.4)] transition hover:bg-teal-300 hover:shadow-[0_0_32px_rgba(45,212,191,0.6)]"
              >
                Start Curation <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-teal-300/15 bg-[#0b162a]/80 p-4">
                <div className="text-2xl font-bold text-white sm:text-3xl">24/7</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  AUTONOMOUS CONCIERGE
                </div>
              </div>
              <div className="rounded-xl border border-teal-300/15 bg-[#0b162a]/80 p-4">
                <div className="text-2xl font-bold text-white sm:text-3xl">50</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  ELITE WORLD RESORTS
                </div>
              </div>
              <div className="rounded-xl border border-teal-300/15 bg-[#0b162a]/80 p-4">
                <div className="text-2xl font-bold text-white sm:text-3xl">10</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  TOP GLOBAL DESTINATIONS
                </div>
              </div>
              <div className="rounded-xl border border-teal-300/15 bg-[#0b162a]/80 p-4">
                <div className="text-2xl font-bold text-white sm:text-3xl">0%</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  HIDDEN COMMISSION
                </div>
              </div>
            </div>
          </div>

          {/* Intro */}
          <header ref={curationRef} className="flex flex-col gap-3 pt-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-amber-400">
              VOYAGE AI CONCIERGE
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Where shall we take you?</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
              A single conversational prompt replaces tedious multi-step search engines. Voyage AI interprets your
              travel style, selects non-stop flight routes, and matches real suites.
            </p>
          </header>

          {/* Natural Language Extraction */}
          <section
            aria-label="Natural language extraction"
            className="rounded-2xl border border-teal-300/15 bg-[#0b1426] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)] sm:p-5"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-teal-300/10 pb-3 text-[11px]">
              <div className="flex items-center gap-2 text-teal-300">
                <span className="size-1.5 rounded-full bg-teal-400" aria-hidden="true" />
                <span>Voyage AI Active · Real-time Parameter Extraction</span>
                <span className="rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
                  MVP
                </span>
              </div>
              <span className="flex items-center gap-3 text-slate-400">
                <span className="hidden sm:inline">Natural Language Parsing</span>
                {chatHasReply ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-0.5 text-slate-300 transition hover:border-teal-400/50 hover:text-white"
                  >
                    <RefreshCw className="size-3" aria-hidden="true" />
                    Reset
                  </button>
                ) : null}
              </span>
            </div>

            <div
              ref={logRef}
              data-lenis-prevent="true"
              aria-live="polite"
              className="flex max-h-56 min-h-28 flex-col gap-2.5 overflow-y-auto overscroll-contain pr-1"
            >
              {messages.map((m) => (
                <Bubble key={m.id} message={m} />
              ))}
              {isPending ? <PendingBubble /> : null}
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              {CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={isPending}
                  onClick={() => send(chip.query)}
                  className="rounded-lg border border-teal-300/20 bg-teal-400/5 px-3 py-1.5 text-left text-xs text-teal-200 transition hover:border-teal-300/60 hover:bg-teal-400/10 disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Describe your trip"
                placeholder="e.g. Solo luxury escape to Dubai from Astana for 7 nights, 5★, $3,500 budget"
                className="min-w-0 flex-1 rounded-xl border border-teal-300/20 bg-[#08101f] px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-300 focus:ring-1 focus:ring-teal-300"
              />
              <button
                type="submit"
                disabled={isPending || !input.trim()}
                className="rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-[#050a14] transition hover:bg-teal-300 disabled:opacity-40"
              >
                Send <span aria-hidden="true">↗</span>
              </button>
            </form>
          </section>

          {/* Bespoke selection */}
          {packages.length > 0 ? (
            <section aria-labelledby="voyage-results-title" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                    Bespoke Selection
                  </p>
                  <h3 id="voyage-results-title" className="mt-1 text-3xl font-bold tracking-tight text-white">
                    Top {packages.length} Tailored Packages
                  </h3>
                </div>
                <span className="rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-xs text-teal-300">
                  Top {packages.length} Bespoke Matches
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} onExplore={explore} />
                ))}
              </div>
            </section>
          ) : null}

          <footer className="flex flex-col items-center gap-1.5 border-t border-teal-300/10 pt-6 pb-2 text-center text-xs text-slate-400">
            <p className="flex flex-wrap items-center justify-center gap-2 font-semibold text-slate-200">
              <span>Voyage<span className="text-teal-400">AI</span> · Autonomous Travel Concierge</span>
              <span className="rounded border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                MVP PROTOTYPE
              </span>
            </p>
            <p>Bespoke itineraries, direct flights and transparent pricing with zero commission markup.</p>
            <p className="max-w-xl text-[11px] text-amber-300/80">
              Voyage AI is currently in active development (MVP stage). Live GDS flight feeds and autonomous reservation pipelines are continuously updated.
            </p>
          </footer>
        </div>
      </div>

      {/* Modals stay inside the dashboard so they stay inside the laptop display */}
      {step !== 'closed' && selection && suite ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={step === 'suites' ? `${selection.pkg.name} suites` : 'Confirm reservation with concierge'}
          className="absolute inset-0 z-40 flex items-center justify-center bg-[#02050c]/85 p-3 sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            data-lenis-prevent="true"
            className="max-h-full w-full max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-teal-300/25 bg-[#0b1426] shadow-[0_30px_90px_rgba(0,0,0,0.9)]"
          >
            {step === 'suites' ? (
              <div>
                <div className="relative h-36 sm:h-44">
                  <HotelPhoto
                    src={selection.pkg.photo}
                    fallbackSrc={selection.pkg.photoFallback}
                    alt={selection.pkg.name}
                    className="absolute inset-0 size-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1426] via-[#0b1426]/30 to-transparent" />
                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Close"
                    className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                  <div className="absolute bottom-3 left-5 right-5">
                    <h4 className="text-xl font-bold text-white">{selection.pkg.name}</h4>
                    <p className="text-xs text-slate-300">{selection.pkg.place}</p>
                  </div>
                </div>

                <div className="grid gap-6 p-5 md:grid-cols-5">
                  <div className="md:col-span-3">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      Select your suite
                    </p>
                    <div className="flex flex-col gap-2">
                      {SUITES.map((s) => {
                        const active = s.id === suiteId
                        return (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => setSuiteId(s.id)}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
                              active
                                ? 'border-teal-300 bg-teal-400/10 shadow-[0_0_14px_rgba(45,212,191,0.25)]'
                                : 'border-slate-700/70 bg-[#08101f] hover:border-teal-300/50'
                            }`}
                          >
                            <span>
                              <span className="block text-sm font-semibold text-white">{s.name}</span>
                              <span className="block text-[11px] text-slate-400">{s.detail}</span>
                            </span>
                            <span className="shrink-0 font-mono text-xs text-teal-300">
                              {s.extraKzt === 0 ? 'Included' : `+${formatKzt(s.extraKzt)}`}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      Included amenities
                    </p>
                    <ul className="flex flex-col gap-1.5">
                      {amenityList.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-xs text-slate-200">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-teal-400" aria-hidden="true" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-teal-300/10 bg-[#08101f] px-5 py-4">
                  <div>
                    <p className="text-[11px] text-slate-400">
                      Departure {selection.dateLabel} · {selection.mealCode} · {suite.name}
                    </p>
                    <p className="text-xl font-bold text-white">
                      {formatKzt(finalTotal)}{' '}
                      <span className="text-sm font-semibold text-teal-300">({formatUsd(finalTotal)})</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('confirm')}
                    className="rounded-xl bg-teal-400 px-5 py-2.5 text-sm font-bold text-[#050a14] transition hover:bg-teal-300"
                  >
                    Reserve with Concierge
                  </button>
                </div>
              </div>
            ) : null}

            {step === 'confirm' ? (
              <form onSubmit={confirm} className="flex flex-col gap-4 p-5 sm:p-6" noValidate>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-amber-400">Final step</p>
                    <h4 className="mt-1 text-xl font-bold text-white">Confirm Reservation with Concierge</h4>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Close"
                    className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <dl className="grid gap-2 rounded-xl border border-teal-300/15 bg-[#08101f] p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] text-slate-400">Hotel</dt>
                    <dd className="font-medium text-white">{selection.pkg.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">Suite</dt>
                    <dd className="font-medium text-white">{suite.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">Flight</dt>
                    <dd className="font-medium text-white">
                      {selection.pkg.flight.fromCode} → {selection.pkg.flight.toCode}, departure {selection.dateLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">Total</dt>
                    <dd className="font-bold text-teal-300">
                      {formatKzt(finalTotal)} ({formatUsd(finalTotal)})
                    </dd>
                  </div>
                </dl>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-slate-300">Phone / WhatsApp number</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 700 000 00 00"
                    aria-invalid={phoneError !== null}
                    className="rounded-xl border border-teal-300/25 bg-[#08101f] px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-300 focus:ring-1 focus:ring-teal-300"
                  />
                  {phoneError ? <span className="text-xs text-rose-300">{phoneError}</span> : null}
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('suites')}
                    className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-teal-400/50 hover:text-white"
                  >
                    Back to suites
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-teal-400 px-5 py-2.5 text-sm font-bold text-[#050a14] transition hover:bg-teal-300"
                  >
                    Send Reservation Request
                  </button>
                </div>
              </form>
            ) : null}

            {step === 'done' ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10">
                  <ShieldCheck className="size-6 text-emerald-300" aria-hidden="true" />
                </span>
                <h4 className="text-xl font-bold text-white">Reservation Request Received</h4>
                <p className="max-w-md text-sm leading-relaxed text-slate-300">
                  A Voyage AI concierge will contact you at {phone.trim()} to finalise your stay at{' '}
                  {selection.pkg.name} ({suite.name}).
                </p>
                <p className="font-mono text-xs text-teal-300">Reference {reference}</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-2 rounded-xl bg-teal-400 px-5 py-2.5 text-sm font-bold text-[#050a14] transition hover:bg-teal-300"
                >
                  Back to packages
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
