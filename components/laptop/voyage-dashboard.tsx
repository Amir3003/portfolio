'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react'
import { Check, ExternalLink, RefreshCw, ShieldCheck, Star, X } from 'lucide-react'
import { postAgentTurn } from '@/lib/voyage/client'
import { emptySlots } from '@/lib/voyage/defaults'
import { formatKzt, formatUsd } from '@/lib/voyage/format'
import {
  DICTIONARY,
  LANGS,
  LANG_STORAGE_KEY,
  isLang,
  localizeBadge,
  type BeachKind,
  type Lang,
  type MealCode,
  type SuiteId,
  type VoyageDict,
} from '@/lib/voyage/i18n'
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
}

interface Pkg {
  id: string
  name: string
  location: string
  stars: number
  meal: string
  rating: number
  badge: string
  affinity: number
  adults: number
  children: number
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
  beach: BeachKind | null
  cityKm: number | null
  amenities: string[]
}

interface Suite {
  id: SuiteId
  extraKzt: number
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

const MEAL_PLANS: readonly { code: MealCode; surcharge: number }[] = [
  { code: 'BB', surcharge: 0 },
  { code: 'HB', surcharge: 65000 },
  { code: 'FB', surcharge: 120000 },
  { code: 'AI', surcharge: 190000 },
  { code: 'UAI', surcharge: 280000 },
]

const SUITES: readonly Suite[] = [
  { id: 'superior', extraKzt: 0 },
  { id: 'deluxe', extraKzt: 95000 },
  { id: 'executive', extraKzt: 210000 },
  { id: 'royal', extraKzt: 420000 },
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

function formatDuration(text: string, t: VoyageDict): string {
  const total = durationMinutes(text)
  return total > 0 ? t.duration(Math.floor(total / 60), total % 60) : text
}

const isMealCode = (code: string): code is MealCode => MEAL_PLANS.some((m) => m.code === code)

/** Localizes the engine's meal string, e.g. `AI - All Inclusive`, keeping the code. */
function mealText(meal: string, t: VoyageDict): string {
  const code = mealCodeOf(meal)
  return isMealCode(code) ? `${code} - ${t.mealNames[code]}` : meal
}

const placeText = (pkg: Pkg, t: VoyageDict): string =>
  `${t.locations[pkg.location] ?? pkg.location} · ${pkg.stars}★ · ${mealText(pkg.meal, t)}`

function toPackage(r: Recommendation, index: number, slots: Slots): Pkg {
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
    location: r.location,
    stars: r.stars,
    meal: r.meal,
    rating: r.rating,
    badge: r.badge,
    affinity: r.matchScore,
    adults: slots.adults ?? 2,
    children: slots.children,
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
    },
    departIso: r.flight.departDate,
    nights,
    flightKzt: r.flightKzt,
    baseKzt: r.totalKzt,
    mealCode: mealCodeOf(r.meal),
    beach: beachfront ? 'beachfront' : privateBeach ? 'private' : null,
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

function PendingBubble({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex justify-start">
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

function PackageCard({
  pkg,
  t,
  lang,
  onExplore,
}: {
  pkg: Pkg
  t: VoyageDict
  lang: Lang
  onExplore: (selection: Selection) => void
}) {
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
          {localizeBadge(pkg.badge, lang)}
        </span>
        <span className="absolute right-3 top-3 rounded bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white">
          {t.affinity(pkg.affinity)}
        </span>
        <span className="absolute bottom-3 left-3 rounded border border-emerald-400/40 bg-emerald-900/80 px-2 py-0.5 text-[11px] text-emerald-200">
          {t.guests(pkg.adults, pkg.children)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{pkg.name}</h3>
            <p className="mt-0.5 truncate text-xs text-slate-400">{placeText(pkg, t)}</p>
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
              {t.flightIncluded}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-slate-300">
            <p>
              {t.directFlight}:{' '}
              <span className="font-semibold text-teal-300">
                {pkg.flight.fromCode} → {pkg.flight.toCode}
              </span>{' '}
              ({departLabel} - {returnLabel}), {t.nonStop}
            </p>
            <span className="shrink-0 text-slate-400">{formatDuration(pkg.flight.duration, t)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span>{pkg.flight.times}</span>
            <span>{t.baggage}</span>
          </div>
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            {t.flexDates}
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
                    {active ? ` (${t.selected})` : ''}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{formatKzt(priceFor(idx, meal), lang)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {pkg.beach ? (
            <span className="rounded border border-teal-300/25 bg-teal-400/10 px-2 py-0.5 text-teal-200">
              {t.beachLabel}: {t.beach[pkg.beach]}
            </span>
          ) : null}
          {pkg.cityKm !== null ? (
            <span className="rounded border border-teal-300/25 bg-teal-400/10 px-2 py-0.5 text-teal-200">
              {t.cityCenter(pkg.cityKm)}
            </span>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">{t.mealLabel}</p>
          <div className="flex flex-wrap gap-1.5">
            {MEAL_PLANS.map((m) => {
              const delta = m.surcharge - initialSurcharge
              const active = m.code === meal
              const hint = delta === 0 ? t.mealBase : `${delta > 0 ? '+' : '-'}${Math.abs(delta) / 1000}K`
              return (
                <button
                  key={m.code}
                  type="button"
                  aria-pressed={active}
                  title={t.mealNames[m.code]}
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
              {formatKzt(total, lang)}{' '}
              <span className="text-sm font-semibold text-teal-300">({formatUsd(total)})</span>
            </p>
            <span className="text-xs text-teal-300">{t.instantConfirm}</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-400">
            {t.priceBreakdown(pkg.nights, formatKzt(total - pkg.flightKzt, lang), formatKzt(pkg.flightKzt, lang))}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onExplore({ pkg, dateLabel: departLabel, mealCode: meal, totalKzt: total })}
          className="flex items-center justify-between rounded-xl border border-teal-300/30 bg-teal-400/5 px-4 py-3 text-sm font-semibold text-teal-300 transition hover:border-teal-300 hover:bg-teal-400/10"
        >
          <span>{t.explore}</span>
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
  const [lang, setLang] = useState<Lang>('en')
  const t = DICTIONARY[lang]
  const [input, setInput] = useState('')
  const [slots, setSlots] = useState<Slots>(emptySlots)
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'assistant', text: DICTIONARY.en.welcome }])
  const [packages, setPackages] = useState<readonly Pkg[]>([])
  const [isPending, startTransition] = useTransition()
  const logRef = useRef<HTMLDivElement>(null)
  const curationRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  const [step, setStep] = useState<Step>('closed')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [suiteId, setSuiteId] = useState<SuiteId>(SUITES[0]?.id ?? 'superior')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState(false)
  const [reference, setReference] = useState('')

  /** Applies a language; the welcome message follows it until the first user turn. */
  const applyLang = (next: Lang) => {
    setLang(next)
    setMessages((prev) =>
      prev.some((m) => m.role === 'user')
        ? prev
        : prev.map((m) => (m.id === 0 && m.role === 'assistant' ? { ...m, text: DICTIONARY[next].welcome } : m)),
    )
  }

  const chooseLang = (next: Lang) => {
    applyLang(next)
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      // Storage can be blocked (private mode); the choice still applies to this visit.
    }
  }

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY)
      if (isLang(saved) && saved !== 'en') applyLang(saved)
    } catch {
      // Storage unavailable: keep the default language.
    }
  }, [])

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isPending])

  const closeModal = () => {
    setStep('closed')
    setPhoneError(false)
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
        const res = await postAgentTurn(text, slots, lang)
        setSlots(res.slots)
        push('assistant', res.reply)
        if (res.results.length > 0) {
          setPackages(res.results.map((r, i) => toPackage(r, i, res.slots)))
        } else {
          setPackages([])
        }
      } catch (err) {
        push('error', lang === 'ru' || !(err instanceof Error) ? t.errorFallback : err.message)
      }
    })
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    send(input)
  }

  const reset = () => {
    setSlots(emptySlots())
    setMessages([{ id: 0, role: 'assistant', text: t.welcome }])
    nextId.current = 1
    setPackages([])
    setInput('')
  }

  const explore = (s: Selection) => {
    setSelection(s)
    setSuiteId(SUITES[0]?.id ?? 'superior')
    setPhone('')
    setPhoneError(false)
    setStep('suites')
  }

  const suite = SUITES.find((s) => s.id === suiteId) ?? SUITES[0]
  const finalTotal = (selection?.totalKzt ?? 0) + (suite?.extraKzt ?? 0)

  const confirm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7 || digits.length > 15) {
      setPhoneError(true)
      return
    }
    setPhoneError(false)
    setReference(`VAI-${Date.now().toString(36).toUpperCase().slice(-6)}`)
    setStep('done')
  }

  const amenityList = useMemo(() => {
    const own = selection?.pkg.amenities ?? []
    return Array.from(new Set([...own.map((a) => t.amenities[a] ?? a), ...t.standardAmenities]))
  }, [selection, t])

  const chatHasReply = messages.length > 1
  const suiteCopy = suite ? t.suites[suite.id] : null

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-teal-300/20 bg-[#050a14] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-teal-300/15 bg-[#070e1c] px-3 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg border border-teal-400/40 bg-teal-400/10 text-xs font-bold font-mono text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.25)]">
            V
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Voyage<span className="text-teal-400">AI</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 font-mono text-[10px] font-semibold text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)] sm:px-3">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            <span className="sm:hidden">{t.mvpShort}</span>
            <span className="hidden sm:inline">{t.mvpLong}</span>
          </span>
          <div
            role="group"
            aria-label={t.langSwitchLabel}
            className="flex items-center rounded-lg border border-teal-300/20 bg-teal-400/5 p-0.5 font-mono text-[10px] sm:text-[11px]"
          >
            {LANGS.map((code) => {
              const active = code === lang
              return (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  aria-pressed={active}
                  onClick={() => chooseLang(code)}
                  className={`rounded px-1.5 py-0.5 transition ${
                    active ? 'bg-teal-400 font-bold text-[#050a14]' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              )
            })}
          </div>
          <a
            href={voyageLinks.repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.githubLabel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2 py-1 text-[11px] text-slate-200 transition hover:border-teal-400/50 hover:text-white sm:px-2.5"
          >
            <span className="hidden sm:inline">{t.githubLabel}</span>
            <ExternalLink className="size-3 text-slate-400" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        data-lenis-prevent="true"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-8 sm:py-8 lg:px-12"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:gap-10">
          {/* Hero Banner from Screenshot 1 */}
          <div className="relative overflow-hidden rounded-2xl border border-teal-300/20 bg-gradient-to-b from-[#0a182e]/90 via-[#071120]/95 to-[#050a14] px-4 py-6 text-center sm:rounded-3xl sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-500/12 via-transparent to-transparent" />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-0.5 font-mono text-[10px] uppercase tracking-wider text-teal-300">
                <span className="hidden sm:inline">{t.heroEyebrowLead}</span>
                {t.heroEyebrowTail}
              </span>
              <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.2)]">
                {t.heroStageBadge}
              </span>
            </div>

            <h2 className="mt-4 text-[28px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t.heroTitleBrand}
              <br />
              <span className="bg-gradient-to-r from-teal-200 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                {t.heroTitleLine1}
                <br />
                {t.heroTitleLine2}
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-relaxed text-slate-300 sm:text-base">
              {t.heroDesc}{' '}
              <span className="font-semibold text-amber-300">{t.heroMvpNote}</span>
            </p>

            <div className="mt-5 flex justify-center sm:mt-6">
              <button
                type="button"
                onClick={() => curationRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-6 py-3 text-sm font-bold text-[#050a14] shadow-[0_0_24px_rgba(45,212,191,0.4)] transition hover:bg-teal-300 hover:shadow-[0_0_32px_rgba(45,212,191,0.6)]"
              >
                {t.heroCta} <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-4 sm:gap-3">
              <div className="rounded-xl border border-teal-300/15 bg-[#0b162a]/80 p-3 sm:p-4">
                <div className="text-xl font-bold text-white sm:text-3xl">24/7</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-400 sm:text-[10px]">
                  {t.statConcierge}
                </div>
              </div>
              <div className="rounded-xl border border-teal-300/15 bg-[#0b162a]/80 p-3 sm:p-4">
                <div className="text-xl font-bold text-white sm:text-3xl">50</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-400 sm:text-[10px]">
                  {t.statResorts}
                </div>
              </div>
              <div className="rounded-xl border border-teal-300/15 bg-[#0b162a]/80 p-3 sm:p-4">
                <div className="text-xl font-bold text-white sm:text-3xl">10</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-400 sm:text-[10px]">
                  {t.statDestinations}
                </div>
              </div>
              <div className="rounded-xl border border-teal-300/15 bg-[#0b162a]/80 p-3 sm:p-4">
                <div className="text-xl font-bold text-white sm:text-3xl">0%</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-slate-400 sm:text-[10px]">
                  {t.statCommission}
                </div>
              </div>
            </div>
          </div>

          {/* Intro */}
          <header ref={curationRef} className="flex flex-col gap-3 pt-2">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-amber-400">
              {t.introEyebrow}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">{t.introTitle}</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-400">{t.introDesc}</p>
          </header>

          {/* Natural Language Extraction */}
          <section
            aria-label={t.panelAria}
            className="rounded-2xl border border-teal-300/15 bg-[#0b1426] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)] sm:p-5"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-teal-300/10 pb-3 text-[11px]">
              <div className="flex items-center gap-2 text-teal-300">
                <span className="size-1.5 rounded-full bg-teal-400" aria-hidden="true" />
                <span>{t.panelStatus}</span>
                <span className="rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
                  MVP
                </span>
              </div>
              <span className="flex items-center gap-3 text-slate-400">
                <span className="hidden sm:inline">{t.panelSub}</span>
                {chatHasReply ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-0.5 text-slate-300 transition hover:border-teal-400/50 hover:text-white"
                  >
                    <RefreshCw className="size-3" aria-hidden="true" />
                    {t.reset}
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
              {isPending ? <PendingBubble label={t.pendingAria} /> : null}
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              {t.chips.map((chip) => (
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
                aria-label={t.inputAria}
                placeholder={t.placeholder}
                className="min-w-0 flex-1 rounded-xl border border-teal-300/20 bg-[#08101f] px-4 py-3 text-base text-slate-100 sm:text-sm placeholder-slate-500 outline-none transition focus:border-teal-300 focus:ring-1 focus:ring-teal-300"
              />
              <button
                type="submit"
                disabled={isPending || !input.trim()}
                className="shrink-0 rounded-xl bg-teal-400 px-4 py-3 text-sm font-bold text-[#050a14] transition hover:bg-teal-300 disabled:opacity-40 sm:px-5"
              >
                {t.send} <span aria-hidden="true">↗</span>
              </button>
            </form>
          </section>

          {/* Bespoke selection */}
          {packages.length > 0 ? (
            <section aria-labelledby="voyage-results-title" className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                    {t.resultsEyebrow}
                  </p>
                  <h3 id="voyage-results-title" className="mt-1 text-2xl font-bold sm:text-3xl tracking-tight text-white">
                    {t.resultsTitle(packages.length)}
                  </h3>
                </div>
                <span className="rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-xs text-teal-300">
                  {t.resultsBadge(packages.length)}
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} t={t} lang={lang} onExplore={explore} />
                ))}
              </div>
            </section>
          ) : null}

          <footer className="flex flex-col items-center gap-1.5 border-t border-teal-300/10 pt-6 pb-2 text-center text-xs text-slate-400">
            <p className="flex flex-wrap items-center justify-center gap-2 font-semibold text-slate-200">
              <span>
                Voyage<span className="text-teal-400">AI</span> · {t.footerTagline}
              </span>
              <span className="rounded border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                {t.footerBadge}
              </span>
            </p>
            <p>{t.footerDesc}</p>
            <p className="max-w-xl text-[11px] text-amber-300/80">{t.footerMvpNote}</p>
            <a href="/projects/voyage-ai" className="mt-1 font-mono text-[11px] text-teal-300 underline underline-offset-4 hover:text-teal-200">
              {t.caseStudy}
            </a>
          </footer>
        </div>
      </div>

      {/* Modals stay inside the dashboard so they stay inside the laptop display */}
      {step !== 'closed' && selection && suite && suiteCopy ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={step === 'suites' ? t.suitesDialog(selection.pkg.name) : t.confirmDialog}
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
                    aria-label={t.close}
                    className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                  <div className="absolute bottom-3 left-5 right-5">
                    <h4 className="text-xl font-bold text-white">{selection.pkg.name}</h4>
                    <p className="text-xs text-slate-300">{placeText(selection.pkg, t)}</p>
                  </div>
                </div>

                <div className="grid gap-6 p-5 md:grid-cols-5">
                  <div className="md:col-span-3">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      {t.selectSuite}
                    </p>
                    <div className="flex flex-col gap-2">
                      {SUITES.map((s) => {
                        const active = s.id === suiteId
                        const copy = t.suites[s.id]
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
                              <span className="block text-sm font-semibold text-white">{copy.name}</span>
                              <span className="block text-[11px] text-slate-400">{copy.detail}</span>
                            </span>
                            <span className="shrink-0 font-mono text-xs text-teal-300">
                              {s.extraKzt === 0 ? t.suiteIncluded : `+${formatKzt(s.extraKzt, lang)}`}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                      {t.includedAmenities}
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
                      {t.departure} {selection.dateLabel} · {selection.mealCode} · {suiteCopy.name}
                    </p>
                    <p className="text-xl font-bold text-white">
                      {formatKzt(finalTotal, lang)}{' '}
                      <span className="text-sm font-semibold text-teal-300">({formatUsd(finalTotal)})</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('confirm')}
                    className="rounded-xl bg-teal-400 px-5 py-2.5 text-sm font-bold text-[#050a14] transition hover:bg-teal-300"
                  >
                    {t.reserve}
                  </button>
                </div>
              </div>
            ) : null}

            {step === 'confirm' ? (
              <form onSubmit={confirm} className="flex flex-col gap-4 p-5 sm:p-6" noValidate>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-amber-400">{t.finalStep}</p>
                    <h4 className="mt-1 text-xl font-bold text-white">{t.confirmTitle}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label={t.close}
                    className="flex size-8 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <dl className="grid gap-2 rounded-xl border border-teal-300/15 bg-[#08101f] p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] text-slate-400">{t.hotel}</dt>
                    <dd className="font-medium text-white">{selection.pkg.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">{t.suite}</dt>
                    <dd className="font-medium text-white">{suiteCopy.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">{t.flight}</dt>
                    <dd className="font-medium text-white">
                      {t.flightSummary(selection.pkg.flight.fromCode, selection.pkg.flight.toCode, selection.dateLabel)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-slate-400">{t.total}</dt>
                    <dd className="font-bold text-teal-300">
                      {formatKzt(finalTotal, lang)} ({formatUsd(finalTotal)})
                    </dd>
                  </div>
                </dl>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-slate-300">{t.phoneLabel}</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 700 000 00 00"
                    aria-invalid={phoneError}
                    className="rounded-xl border border-teal-300/25 bg-[#08101f] px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-300 focus:ring-1 focus:ring-teal-300"
                  />
                  {phoneError ? <span className="text-xs text-rose-300">{t.phoneError}</span> : null}
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('suites')}
                    className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-teal-400/50 hover:text-white"
                  >
                    {t.backToSuites}
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-teal-400 px-5 py-2.5 text-sm font-bold text-[#050a14] transition hover:bg-teal-300"
                  >
                    {t.sendRequest}
                  </button>
                </div>
              </form>
            ) : null}

            {step === 'done' ? (
              <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/10">
                  <ShieldCheck className="size-6 text-emerald-300" aria-hidden="true" />
                </span>
                <h4 className="text-xl font-bold text-white">{t.successTitle}</h4>
                <p className="max-w-md text-sm leading-relaxed text-slate-300">
                  {t.successDesc(phone.trim(), selection.pkg.name, suiteCopy.name)}
                </p>
                <p className="font-mono text-xs text-teal-300">{t.reference(reference)}</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-2 rounded-xl bg-teal-400 px-5 py-2.5 text-sm font-bold text-[#050a14] transition hover:bg-teal-300"
                >
                  {t.backToPackages}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
