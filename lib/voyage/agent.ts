/**
 * Voyage AI - conversational slot-filling agent.
 *
 * TypeScript port of the deterministic half of `ai_agent.py` (`_fallback_extract`,
 * `TravelAgentContext`, `_build_question`, `_check_budget_reality`, `_build_summary`).
 * The Python service can additionally call an LLM (OpenRouter) for extraction; the portfolio build
 * uses the regex extractors only, so it needs no API keys and responds deterministically.
 * English only.
 */

import {
  checkBudgetReality,
  destinationLabel,
  isCountry,
  isIsoDate,
  isMealType,
  isOrigin,
  isStars,
  recommend,
  searchHotels,
  slotsToRequest,
  toIsoDate,
  USD_TO_KZT,
} from '@/lib/voyage/recommend'
import { SEASONAL_PROMPTS, emptySlots } from '@/lib/voyage/defaults'
import { formatKzt } from '@/lib/voyage/format'
import type {
  AgentReply,
  Country,
  MealType,
  Origin,
  RequiredSlot,
  SearchRequest,
  Slots,
  Stars,
} from '@/lib/voyage/types'

// ────────────────────────────── aliases ─────────────────────────────

const COUNTRY_FORMS: Record<Country, readonly string[]> = {
  Turkey: ['turkey', 'turkiye', 'antalya', 'belek', 'kemer', 'side', 'bodrum', 'marmaris', 'alanya', 'istanbul'],
  UAE: ['uae', 'emirates', 'united arab emirates', 'dubai', 'abu dhabi', 'sharjah', 'ras al khaimah'],
  Thailand: ['thailand', 'thai', 'phuket', 'pattaya', 'samui', 'bangkok', 'krabi'],
  Maldives: ['maldives', 'maldive', 'male'],
  Egypt: ['egypt', 'sharm', 'sharm el sheikh', 'hurghada'],
  Vietnam: ['vietnam', 'da nang', 'danang', 'phu quoc', 'nha trang'],
  Georgia: ['georgia', 'batumi', 'tbilisi', 'kobuleti'],
  'Sri Lanka': ['sri lanka', 'colombo', 'bentota', 'galle'],
  Indonesia: ['indonesia', 'bali', 'denpasar', 'ubud'],
  Spain: ['spain', 'barcelona', 'mallorca', 'majorca', 'madrid'],
}

const ORIGIN_FORMS: Record<Origin, readonly string[]> = {
  Astana: ['astana', 'nqz', 'nur-sultan', 'nursultan', 'nur sultan'],
  Almaty: ['almaty', 'alma-ata', 'ala'],
  Shymkent: ['shymkent', 'cit'],
}

/** Longest alias first so "united arab emirates" wins over "arab"-style partials. */
function buildAliasList<T extends string>(forms: Record<T, readonly string[]>): [string, T][] {
  const entries: [string, T][] = []
  for (const key of Object.keys(forms) as T[]) for (const alias of forms[key]) entries.push([alias, key])
  return entries.sort((a, b) => b[0].length - a[0].length)
}

const COUNTRY_ALIASES = buildAliasList(COUNTRY_FORMS)
const ORIGIN_ALIASES = buildAliasList(ORIGIN_FORMS)

const MEAL_ALIASES: readonly [string, MealType][] = [
  ['ultra all inclusive', 'UAI - Ultra All Inclusive'],
  ['uai', 'UAI - Ultra All Inclusive'],
  ['all inclusive', 'AI - All Inclusive'],
  ['all-inclusive', 'AI - All Inclusive'],
  ['full board', 'FB - Full Board'],
  ['half board', 'HB - Half Board'],
  ['bed and breakfast', 'BB - Bed & Breakfast'],
  ['breakfast', 'BB - Bed & Breakfast'],
]

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wordRe = (alias: string): RegExp => new RegExp(`(?:^|[^a-z0-9])${escapeRe(alias)}(?:[^a-z0-9]|$)`, 'i')

// ───────────────────────────── extractors ───────────────────────────

export function extractCountry(text: string): Country | null {
  for (const [alias, country] of COUNTRY_ALIASES) if (wordRe(alias).test(text)) return country
  return null
}

export function extractOrigin(text: string): Origin | null {
  const from = /\bfrom\s+([a-z-]+(?:\s[a-z]+)?)/i.exec(text)
  if (from) {
    const target = from[1].toLowerCase()
    for (const [alias, origin] of ORIGIN_ALIASES) if (target.startsWith(alias)) return origin
  }
  for (const [alias, origin] of ORIGIN_ALIASES) if (wordRe(alias).test(text)) return origin
  return null
}

const NUM = String.raw`(\d{1,3}(?:[,\s]\d{3})+|\d+(?:[.,]\d+)?)`
const toNumber = (raw: string): number => Number.parseFloat(raw.replace(/[,\s](?=\d{3}\b)/g, '').replace(',', '.'))

export function extractBudgetKzt(text: string): number | null {
  const usd = new RegExp(String.raw`\$\s*${NUM}|${NUM}\s*(?:\$|usd\b|dollars?\b|bucks?\b)`, 'i').exec(text)
  if (usd) {
    const value = toNumber(usd[1] ?? usd[2])
    if (value > 0) return Math.round(value * USD_TO_KZT)
  }
  const million = new RegExp(String.raw`${NUM}\s*(?:mln|million|m)\b`, 'i').exec(text)
  if (million) return Math.round(toNumber(million[1]) * 1_000_000)

  const thousand = new RegExp(String.raw`${NUM}\s*k\b`, 'i').exec(text)
  if (thousand) {
    const value = toNumber(thousand[1]) * 1000
    if (value >= 50_000) return Math.round(value)
  }
  const kzt = new RegExp(String.raw`${NUM}\s*(?:₸|kzt\b|tenge\b|tg\b)`, 'i').exec(text)
  if (kzt) return Math.round(toNumber(kzt[1]))

  const labelled = new RegExp(String.raw`(?:budget|up\s+to|under|within|max(?:imum)?)\D{0,12}${NUM}`, 'i').exec(text)
  if (labelled) {
    const value = toNumber(labelled[1])
    if (value >= 50_000) return Math.round(value)
  }
  for (const match of text.matchAll(/\b\d{1,3}(?:[,\s]\d{3})+\b|\b\d{6,}\b/g)) {
    const value = toNumber(match[0])
    if (value >= 100_000) return Math.round(value)
  }
  return null
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fourteen: 14,
}

export function extractNights(text: string): number | null {
  const explicit = /(\d+)\s*(?:nights?|days?)\b/i.exec(text)
  if (explicit) return Number.parseInt(explicit[1], 10)
  const weeks = /(\d+)\s*weeks?\b/i.exec(text)
  if (weeks) return Number.parseInt(weeks[1], 10) * 7
  if (/\b(?:a|one)\s+week\b/i.test(text)) return 7
  for (const [word, n] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(String.raw`\b${word}\s+nights?\b`, 'i').test(text)) return n
  }
  const bare = /^\s*(\d{1,2})[.!?]?\s*$/.exec(text)
  if (bare) {
    const n = Number.parseInt(bare[1], 10)
    if (n >= 1 && n <= 60) return n
  }
  return null
}

export function isSolo(text: string): boolean {
  return /\b(solo[\s-]?(?:trip|travel(?:er)?)?|travel(?:l)?ing\s+alone|i\s+am\s+alone|just\s+me|for\s+(?:1|one)\s+(?:person|adult)|single\s+traveler|1\s+adult)\b/i.test(text)
}

export function extractAdults(text: string): number | null {
  if (isSolo(text)) return 1
  if (/\b(couple|for\s+two|two\s+adults|2\s+adults)\b/i.test(text)) return 2
  const count = /(\d+)\s*(?:adults?|guests?|persons?|people)\b/i.exec(text)
  if (count) return Number.parseInt(count[1], 10)
  if (/\bfamily\b/i.test(text)) return 2
  return null
}

export function extractChildren(text: string): number | null {
  const count = /(\d+)\s*(?:children|kids?|child)\b(?!\s*club)/i.exec(text)
  if (count) return Number.parseInt(count[1], 10)
  if (/\b(?:a|one)\s+(?:child|kid)\b(?!\s*club)/i.test(text)) return 1
  return null
}

export function extractChildrenAges(text: string): number[] | null {
  const parenthesised = [...text.matchAll(/\(\s*(?:aged?\s*)?(\d{1,2})\s*(?:years?(?:\s+old)?|yrs?)?\s*\)/gi)]
  if (parenthesised.length) return parenthesised.map((m) => Number.parseInt(m[1], 10))
  const plain = [...text.matchAll(/\b(\d{1,2})\s*(?:years?\s+old|yrs?\s+old|y\.?o\.?)/gi)]
  if (plain.length) return plain.map((m) => Number.parseInt(m[1], 10))
  return null
}

export function extractStars(text: string): Stars | null {
  const match = /\b([345])\s*[- ]?(?:stars?\b|★)/i.exec(text)
  if (!match) return null
  const n = Number.parseInt(match[1], 10)
  return isStars(n) ? n : null
}

export function extractMeal(text: string): MealType | null {
  const low = text.toLowerCase()
  for (const [alias, meal] of MEAL_ALIASES) if (low.includes(alias)) return meal
  return null
}

const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const
const monthOf = (word: string): number => MONTH_KEYS.indexOf(word.slice(0, 3).toLowerCase() as (typeof MONTH_KEYS)[number])

/** Builds the next future occurrence of month/day (rolls to next year if already past). */
function upcoming(month: number, day: number, today: Date): string | null {
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  for (const year of [today.getUTCFullYear(), today.getUTCFullYear() + 1]) {
    const candidate = new Date(Date.UTC(year, month, day))
    if (candidate.getUTCMonth() !== month) return null // e.g. 31 Feb
    if (candidate.getTime() >= todayUtc) return toIsoDate(candidate)
  }
  return null
}

export function extractDate(text: string, today: Date): string | null {
  const iso = /\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/.exec(text)
  if (iso && isIsoDate(iso[0])) return iso[0]

  const dayMonth = new RegExp(String.raw`\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?${MONTH}\b`, 'i').exec(text)
  if (dayMonth) return upcoming(monthOf(dayMonth[2]), Number.parseInt(dayMonth[1], 10), today)

  const monthDay = new RegExp(String.raw`\b${MONTH}\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b(?!\s*(?:nights?|days?|adults?|\$|k\b|m\b))`, 'i').exec(text)
  if (monthDay) return upcoming(monthOf(monthDay[1]), Number.parseInt(monthDay[2], 10), today)

  const numeric = /\b(\d{1,2})[./](\d{1,2})[./](\d{2,4})\b|\b(\d{1,2})\/(\d{1,2})\b|\b(\d{2})\.(\d{2})\b/.exec(text)
  if (numeric) {
    const day = Number.parseInt(numeric[1] ?? numeric[4] ?? numeric[6], 10)
    const month = Number.parseInt(numeric[2] ?? numeric[5] ?? numeric[7], 10) - 1
    if (month >= 0 && month < 12) return upcoming(month, day, today)
  }

  const monthOnly = new RegExp(String.raw`\b(?:in|during|early|late|mid|next)[-\s]+${MONTH}\b`, 'i').exec(text)
  if (monthOnly) {
    const month = monthOf(monthOnly[1])
    const sameMonth = month === today.getUTCMonth()
    return sameMonth ? toIsoDate(new Date(today.getTime() + 7 * 86_400_000)) : upcoming(month, 1, today)
  }
  if (/\bnext\s+month\b/i.test(text)) return toIsoDate(new Date(today.getTime() + 30 * 86_400_000))
  if (/\b(flexible|asap|soon|nearest\s+dates?|any\s+date)\b/i.test(text)) return toIsoDate(new Date(today.getTime() + 21 * 86_400_000))
  return null
}

// ───────────────────────────── slot state ───────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const intOrNull = (v: unknown, min: number, max: number): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null

/** Coerces untrusted client-supplied slots into a well-formed `Slots` (invalid fields are dropped). */
export function sanitizeSlots(input: unknown): Slots {
  const slots = emptySlots()
  if (!isRecord(input)) return slots
  if (isOrigin(input.origin)) slots.origin = input.origin
  if (typeof input.dateStart === 'string' && isIsoDate(input.dateStart)) slots.dateStart = input.dateStart
  slots.nights = intOrNull(input.nights, 1, 30)
  slots.adults = intOrNull(input.adults, 1, 6)
  slots.children = intOrNull(input.children, 0, 4) ?? 0
  if (typeof input.budgetKzt === 'number' && Number.isFinite(input.budgetKzt) && input.budgetKzt > 0)
    slots.budgetKzt = Math.round(input.budgetKzt)
  if (isCountry(input.country)) slots.country = input.country
  if (isStars(input.minStars)) slots.minStars = input.minStars
  if (isMealType(input.meal)) slots.meal = input.meal
  if (Array.isArray(input.childrenAges))
    slots.childrenAges = input.childrenAges.filter((a: unknown): a is number => intOrNull(a, 0, 17) !== null).slice(0, 4)
  return slots
}

export function missingSlots(slots: Slots): RequiredSlot[] {
  const missing: RequiredSlot[] = []
  if (slots.country === null) missing.push('country')
  if (slots.dateStart === null) missing.push('dateStart')
  if (slots.nights === null) missing.push('nights')
  if (slots.adults === null) missing.push('adults')
  if (slots.budgetKzt === null) missing.push('budgetKzt')
  if (slots.children > 0 && slots.childrenAges.length !== slots.children) missing.push('childrenAges')
  return missing
}

/** Extracts every slot we can find in a message and merges it over the existing conversation state. */
export function applyMessage(previous: Slots, message: string, today: Date): Slots {
  const slots: Slots = { ...previous, childrenAges: [...previous.childrenAges] }
  const text = message.trim()
  if (!text) return slots

  slots.origin = extractOrigin(text) ?? slots.origin
  slots.dateStart = extractDate(text, today) ?? slots.dateStart
  slots.country = extractCountry(text) ?? slots.country
  slots.budgetKzt = extractBudgetKzt(text) ?? slots.budgetKzt
  slots.nights = extractNights(text) ?? slots.nights
  slots.minStars = extractStars(text) ?? slots.minStars
  slots.meal = extractMeal(text) ?? slots.meal

  const adults = extractAdults(text)
  if (adults !== null) slots.adults = Math.min(6, Math.max(1, adults))
  const children = extractChildren(text)
  if (children !== null) slots.children = Math.min(4, Math.max(0, children))
  const ages = extractChildrenAges(text)
  if (ages) {
    slots.childrenAges = ages.map((a) => Math.min(17, a)).slice(0, 4)
    if (children === null || children === 0) slots.children = slots.childrenAges.length
  }
  if (slots.nights !== null) slots.nights = Math.min(30, Math.max(1, slots.nights))

  // A solo traveller travels without children.
  if (adults === 1 && isSolo(text)) {
    slots.children = 0
    slots.childrenAges = []
  }
  // Instant-search rule: with destination, nights and budget known, default to two adults.
  if (slots.country && slots.nights && slots.budgetKzt && slots.adults === null) slots.adults = 2
  // Missing child ages default to 7 so the fare calculation can proceed.
  if (slots.children > 0 && slots.childrenAges.length < slots.children)
    slots.childrenAges = [...slots.childrenAges, ...Array<number>(slots.children - slots.childrenAges.length).fill(7)]
  if (slots.childrenAges.length > slots.children) slots.childrenAges = slots.childrenAges.slice(0, slots.children)
  return slots
}

// ────────────────────────────── replies ─────────────────────────────

function buildQuestion(missing: RequiredSlot[]): string {
  if (missing.includes('country')) return 'Which destination would you like to explore? (e.g. Turkey, UAE, Thailand, Maldives, or Spain).'
  if (missing.includes('dateStart')) return "When are you planning to depart? (e.g., October 14, next month, or 'flexible dates')."
  if (missing.includes('nights')) return 'How many nights are you planning for your stay? (e.g. 7 nights or 10 nights).'
  if (missing.includes('adults')) return "How many guests will be traveling? (e.g., 'solo / 1 adult', 'couple / 2 adults', or 'family with 1 child')."
  if (missing.includes('childrenAges')) return 'Could you please specify the age of each child traveling with you?'
  if (missing.includes('budgetKzt'))
    return 'What is your target budget for the complete vacation package (in USD or KZT, e.g. $3,000 or 1,500,000 ₸)?'
  return 'Please specify your target destination, departure date, duration, and budget to prepare your custom itinerary.'
}

const CITY_EN: Record<Country, string> = {
  Turkey: 'Antalya', UAE: 'Dubai', Thailand: 'Phuket', Maldives: 'the Maldives', Egypt: 'Sharm El Sheikh',
  Vietnam: 'Da Nang', Georgia: 'Batumi', 'Sri Lanka': 'Sri Lanka', Indonesia: 'Bali', Spain: 'Barcelona',
}

function buildSummary(req: SearchRequest, best: AgentReply['results'][number]): string {
  const passengers = req.adults + req.children
  const party = passengers === 1 ? 'for your solo trip' : req.children > 0 ? 'for your family holiday' : 'for your journey'
  const destination = req.country ? CITY_EN[req.country] : 'your chosen destination'
  const f = best.flight
  return (
    `Curated the best options ${party} to ${destination} with direct ${f.airline} flights ` +
    `(${f.fromCode} → ${f.toCode}, departing ${req.dateStart}, ${req.nights} nights). ` +
    `Top recommendation: ${best.name} (${best.stars}★, rating ${best.rating}/5). ` +
    `Packages below include accommodation, the selected meal plan, and roundtrip flights.`
  )
}

function mismatchReply(slots: Slots, country: Country, budgetKzt: number, nights: number, minKzt: number): Omit<AgentReply, 'elapsedMs'> {
  const minUsd = Math.round(minKzt / USD_TO_KZT)
  const userUsd = Math.round(budgetKzt / USD_TO_KZT)
  const label = destinationLabel(country)
  return {
    state: 'BUDGET_MISMATCH',
    reply:
      `A package to ${label} for ${nights} nights with direct flights starts from ${formatKzt(minKzt)} (~$${minUsd.toLocaleString('en-US')}). ` +
      `Within your budget (up to ${formatKzt(budgetKzt)} / ~$${userUsd.toLocaleString('en-US')}) we can offer excellent 4-5★ options in other ` +
      `destinations (such as Turkey or Egypt), or explore alternative dates. How would you like to proceed?`,
    missing: [],
    slots,
    results: [],
    prompts: [`Find alternatives within $${userUsd.toLocaleString('en-US')}`, `Show ${label} packages from $${minUsd.toLocaleString('en-US')}`],
    budgetMismatch: { country, userBudgetKzt: budgetKzt, minBudgetKzt: minKzt, minBudgetUsd: minUsd },
  }
}

/**
 * One conversational turn: merge the message into the slots, then either ask for what's missing,
 * explain a budget mismatch, or return the curated top five.
 */
export async function runAgentTurn(
  previous: Slots,
  message: string,
  today: Date = new Date(),
): Promise<Omit<AgentReply, 'elapsedMs'>> {
  const slots = applyMessage(previous, message, today)
  const missing = missingSlots(slots)

  if (missing.length > 0) {
    return {
      state: 'INCOMPLETE',
      reply: buildQuestion(missing),
      missing,
      slots,
      results: [],
      prompts: [...SEASONAL_PROMPTS],
      budgetMismatch: null,
    }
  }

  // All required slots are present (narrowed for the type checker).
  const country = slots.country as Country
  const budgetKzt = slots.budgetKzt as number
  const nights = slots.nights as number

  const reality = checkBudgetReality(country, budgetKzt, nights)
  if (reality) return mismatchReply(slots, country, budgetKzt, nights, reality.minBudgetKzt)

  const request = slotsToRequest(slots, today)
  const results = await recommend(request)

  if (results.length === 0) {
    const unconstrained = await searchHotels({ ...request, budgetKzt: 100_000_000, minStars: null, meal: null })
    const minKzt = unconstrained.length ? Math.min(...unconstrained.map((r) => r.totalKzt)) : 0
    if (minKzt > 0 && budgetKzt < minKzt) return mismatchReply(slots, country, budgetKzt, nights, minKzt)
    return {
      state: 'INCOMPLETE',
      reply: "No matching options found within these exact filters. Let's expand your budget slightly or select another destination.",
      missing: [],
      slots,
      results: [],
      prompts: [...SEASONAL_PROMPTS],
      budgetMismatch: null,
    }
  }

  return {
    state: 'COMPLETE',
    reply: buildSummary(request, results[0]),
    missing: [],
    slots,
    results,
    prompts: [...SEASONAL_PROMPTS],
    budgetMismatch: null,
  }
}
