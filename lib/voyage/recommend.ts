/**
 * Voyage AI - asynchronous recommendation engine.
 *
 * TypeScript port of the Python engine (`hotel_search.py`, `flight_service.py`, `ai_agent.py`)
 * from https://github.com/Amir3003/AItouragent:
 *   catalog filter  →  per-destination flight quotes (async, de-duplicated)  →  hotel + flight pricing
 *   →  preference match score  →  curated top-five selection with editorial badges.
 *
 * Everything here is pure and framework-free, so it runs identically in a Route Handler, on the
 * server, or in the browser.
 */

import { CATALOG } from '@/lib/voyage/catalog'
import { formatKzt } from '@/lib/voyage/format'
import {
  AMENITIES,
  COUNTRIES,
  MEAL_TYPES,
  ORIGINS,
  type Amenity,
  type BudgetMismatch,
  type CatalogHotel,
  type Country,
  type FlightQuote,
  type Lang,
  type MealType,
  type Origin,
  type Recommendation,
  type Result,
  type SearchRequest,
  type Slots,
  type Stars,
  type ValidationIssue,
  type VoyageMeta,
} from '@/lib/voyage/types'

export const USD_TO_KZT = 500
export const MAX_RESULTS = 5

const ORIGIN_CODES: Record<Origin, string> = { Astana: 'NQZ', Almaty: 'ALA', Shymkent: 'CIT' }

interface FlightRoute {
  city: string
  code: string
  airline: string
  airlineCode: string
  aircraft: string
  duration: string
  /** Round-trip fare per passenger, KZT. */
  fareKzt: number
}

/** Verified Kazakhstan-origin routes used by the GDS simulation fallback. */
const FLIGHT_ROUTES: Record<Country, FlightRoute> = {
  Turkey: { city: 'Antalya', code: 'AYT', airline: 'Turkish Airlines', airlineCode: 'TK', aircraft: 'Airbus A321neo', duration: '4h 50m', fareKzt: 195_000 },
  Egypt: { city: 'Sharm El Sheikh', code: 'SSH', airline: 'Air Astana', airlineCode: 'KC', aircraft: 'Airbus A321LR', duration: '5h 15m', fareKzt: 210_000 },
  UAE: { city: 'Dubai', code: 'DXB', airline: 'Flydubai', airlineCode: 'FZ', aircraft: 'Boeing 737 MAX 8', duration: '4h 25m', fareKzt: 185_000 },
  Thailand: { city: 'Phuket', code: 'HKT', airline: 'Air Astana', airlineCode: 'KC', aircraft: 'Boeing 767-300ER', duration: '7h 10m', fareKzt: 290_000 },
  Maldives: { city: 'Malé', code: 'MLE', airline: 'Qatar Airways', airlineCode: 'QR', aircraft: 'Boeing 787-9 Dreamliner', duration: '6h 45m', fareKzt: 360_000 },
  Vietnam: { city: 'Da Nang', code: 'DAD', airline: 'VietJet Air', airlineCode: 'VJ', aircraft: 'Airbus A321neo', duration: '7h 30m', fareKzt: 240_000 },
  Georgia: { city: 'Batumi', code: 'BUS', airline: 'Air Astana', airlineCode: 'KC', aircraft: 'Embraer E190-E2', duration: '3h 40m', fareKzt: 160_000 },
  'Sri Lanka': { city: 'Colombo', code: 'CMB', airline: 'Air Arabia', airlineCode: 'G9', aircraft: 'Airbus A320', duration: '6h 20m', fareKzt: 230_000 },
  Indonesia: { city: 'Bali (Denpasar)', code: 'DPS', airline: 'Qatar Airways', airlineCode: 'QR', aircraft: 'Airbus A350-900', duration: '9h 30m', fareKzt: 390_000 },
  Spain: { city: 'Barcelona', code: 'BCN', airline: 'Turkish Airlines', airlineCode: 'TK', aircraft: 'Airbus A330-300', duration: '7h 45m', fareKzt: 310_000 },
}

/** Editorial badges, assigned in order to the curated picks. */
const BADGES: Readonly<Record<Lang, readonly string[]>> = {
  en: ['Top Recommended', 'Highest Rating', 'Beachfront Sanctuary', 'Best Value Package', 'Ultra Luxury Retreat'],
  ru: ['Лучший выбор', 'Высокий рейтинг', 'Первая линия у моря', 'Лучшая цена за пакет', 'Премиальный отдых'],
}

/** Minimum realistic package price per 7 nights (hotel + flight), KZT. */
const MIN_PACKAGE_7N_KZT: Record<Country, { minKzt: number; label: string }> = {
  Maldives: { minKzt: 2_300_000, label: 'the Maldives' },
  UAE: { minKzt: 2_000_000, label: 'UAE (Dubai)' },
  Indonesia: { minKzt: 1_800_000, label: 'Bali (Indonesia)' },
  Spain: { minKzt: 1_600_000, label: 'Spain (Barcelona)' },
  Thailand: { minKzt: 1_300_000, label: 'Thailand (Phuket)' },
  Vietnam: { minKzt: 1_200_000, label: 'Vietnam (Da Nang)' },
  'Sri Lanka': { minKzt: 1_200_000, label: 'Sri Lanka' },
  Turkey: { minKzt: 1_200_000, label: 'Turkey (Antalya)' },
  Georgia: { minKzt: 1_100_000, label: 'Georgia (Batumi)' },
  Egypt: { minKzt: 1_050_000, label: 'Egypt (Sharm El Sheikh)' },
}

// ───────────────────────────── helpers ─────────────────────────────

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function isCountry(value: unknown): value is Country {
  return typeof value === 'string' && (COUNTRIES as readonly string[]).includes(value)
}
export function isOrigin(value: unknown): value is Origin {
  return typeof value === 'string' && (ORIGINS as readonly string[]).includes(value)
}
export function isMealType(value: unknown): value is MealType {
  return typeof value === 'string' && (MEAL_TYPES as readonly string[]).includes(value)
}
export function isStars(value: unknown): value is Stars {
  return value === 3 || value === 4 || value === 5
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
}

// ──────────────────────────── validation ───────────────────────────

/** Validates untrusted input into a `SearchRequest` (the Pydantic `HotelSearchRequest` rules). */
export function validateSearchRequest(input: unknown): Result<SearchRequest> {
  const issues: ValidationIssue[] = []
  if (!isRecord(input)) return { ok: false, error: [{ field: 'body', message: 'Expected a JSON object.' }] }

  const origin = input.origin ?? 'Astana'
  if (!isOrigin(origin)) issues.push({ field: 'origin', message: 'Please choose Astana, Almaty or Shymkent.' })

  const dateStart = input.dateStart
  if (typeof dateStart !== 'string' || !isIsoDate(dateStart))
    issues.push({ field: 'dateStart', message: 'Please provide a valid date in YYYY-MM-DD format.' })

  const nights = input.nights ?? 7
  if (!isIntInRange(nights, 1, 30)) issues.push({ field: 'nights', message: 'Trip duration must be between 1 and 30 nights.' })

  const adults = input.adults ?? 2
  if (!isIntInRange(adults, 1, 6)) issues.push({ field: 'adults', message: 'Number of adult guests must be between 1 and 6.' })

  const children = input.children ?? 0
  if (!isIntInRange(children, 0, 4)) issues.push({ field: 'children', message: 'Number of children must be between 0 and 4.' })

  const childrenAges = input.childrenAges ?? []
  const agesValid =
    Array.isArray(childrenAges) &&
    childrenAges.every((age: unknown) => isIntInRange(age, 0, 17)) &&
    (!isIntInRange(children, 0, 4) || childrenAges.length === children)
  if (!agesValid) issues.push({ field: 'childrenAges', message: 'Please indicate the age of each child (0 to 17 years).' })

  const budgetKzt = input.budgetKzt
  if (typeof budgetKzt !== 'number' || !Number.isFinite(budgetKzt) || budgetKzt <= 0)
    issues.push({ field: 'budgetKzt', message: 'Please specify a realistic travel budget greater than 0.' })

  const country = input.country ?? null
  if (country !== null && !isCountry(country))
    issues.push({ field: 'country', message: 'Please select a destination from the curated portfolio.' })

  const minStars = input.minStars ?? null
  if (minStars !== null && !isStars(minStars)) issues.push({ field: 'minStars', message: 'Star category must be 3, 4, or 5 stars.' })

  const meal = input.meal ?? null
  if (meal !== null && !isMealType(meal)) issues.push({ field: 'meal', message: 'Please select a supported board type.' })

  const amenitiesRaw = input.amenities ?? []
  if (!Array.isArray(amenitiesRaw) || !amenitiesRaw.every((a: unknown) => typeof a === 'string'))
    issues.push({ field: 'amenities', message: 'Please select amenities from the catalog.' })

  if (issues.length > 0) return { ok: false, error: issues }

  return {
    ok: true,
    value: {
      origin: origin as Origin,
      dateStart: dateStart as string,
      nights: nights as number,
      adults: adults as number,
      children: children as number,
      childrenAges: childrenAges as number[],
      budgetKzt: Math.round(budgetKzt as number),
      country: country as Country | null,
      minStars: minStars as Stars | null,
      meal: meal as MealType | null,
      amenities: amenitiesRaw as Amenity[],
    },
  }
}

// ───────────────────────────── flights ─────────────────────────────

/**
 * Quotes a round-trip flight. The Python service tries the Amadeus Self-Service API and falls back
 * to a verified GDS simulation; the portfolio ships only the simulation (no credentials), kept
 * `async` so a live GDS client can be dropped in without touching callers.
 */
export async function quoteFlight(
  origin: Origin,
  country: Country,
  dateStart: string,
  nights: number,
  passengers: number,
): Promise<FlightQuote> {
  const route = FLIGHT_ROUTES[country]
  return {
    airline: route.airline,
    airlineCode: route.airlineCode,
    aircraft: route.aircraft,
    fromCity: origin,
    fromCode: ORIGIN_CODES[origin],
    toCity: route.city,
    toCode: route.code,
    departDate: dateStart,
    returnDate: addDays(dateStart, nights),
    duration: route.duration,
    priceKzt: route.fareKzt * Math.max(1, passengers),
  }
}

// ──────────────────────────── pricing ──────────────────────────────

/** Russian plural form: `one` for 1, 21; `few` for 2-4, 22-24; `many` otherwise. */
export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function guestsBadgeRu(adults: number, children: number): string {
  const passengers = adults + children
  if (passengers === 1) return 'Соло-путешественник · 1 взрослый'
  if (adults === 2 && children === 0) return 'Для двоих · 2 взрослых'
  if (children > 0)
    return `Семейный тур · ${adults} ${pluralRu(adults, 'взрослый', 'взрослых', 'взрослых')}, ${children} ${pluralRu(children, 'ребёнок', 'ребёнка', 'детей')}`
  return `Группа · ${adults} ${pluralRu(adults, 'гость', 'гостя', 'гостей')}`
}

function guestsBadge(adults: number, children: number, lang: Lang = 'en'): string {
  if (lang === 'ru') return guestsBadgeRu(adults, children)
  const passengers = adults + children
  if (passengers === 1) return 'Solo Traveler · 1 Adult'
  if (adults === 2 && children === 0) return 'Couple Escape · 2 Adults'
  if (children > 0) return `Family Package · ${adults} Adults, ${children} ${children > 1 ? 'Children' : 'Child'}`
  return `Group Package · ${adults} Guests`
}

/** Hotel total for the stay: nightly scaling, solo discount and per-extra-guest surcharge. */
export function hotelTotalKzt(hotel: CatalogHotel, nights: number, passengers: number): number {
  const base = Math.round((hotel.package7Kzt * nights) / 7)
  if (passengers === 1) return Math.round(base * 0.7)
  if (passengers > 2) return Math.round(base * (1 + (passengers - 2) * 0.25))
  return base
}

/** SQL-equivalent hard filters from `search_database`. */
function filterCatalog(req: SearchRequest): CatalogHotel[] {
  const passengers = req.adults + req.children
  const countryLower = req.country?.toLowerCase() ?? null
  return CATALOG.filter((h) => {
    if (Math.round((h.package7Kzt * req.nights) / 7) > req.budgetKzt) return false
    if (passengers > h.maxGuests) return false
    if (countryLower && h.country.toLowerCase() !== countryLower && !h.location.toLowerCase().includes(countryLower)) return false
    if (req.minStars !== null && h.stars < req.minStars) return false
    if (req.meal !== null && h.meal !== req.meal) return false
    return req.amenities.every((a) => h.amenities.includes(a))
  }).sort(
    (a, b) =>
      b.rating - a.rating ||
      Math.round((a.package7Kzt * req.nights) / 7) - Math.round((b.package7Kzt * req.nights) / 7),
  )
}

/**
 * Searches + prices every matching property. Flight quotes are fetched once per destination, concurrently.
 * `lang` only affects the human-readable fields (badge, breakdown, guests badge).
 */
export async function searchHotels(req: SearchRequest, lang: Lang = 'en'): Promise<Recommendation[]> {
  const passengers = req.adults + req.children
  const matches = filterCatalog(req)

  const countries = [...new Set(matches.map((h) => h.country))]
  const quotes = new Map<Country, FlightQuote>(
    await Promise.all(
      countries.map(
        async (c): Promise<[Country, FlightQuote]> => [
          c,
          await quoteFlight(req.origin, c, req.dateStart, req.nights, passengers),
        ],
      ),
    ),
  )

  return matches.flatMap((h): Recommendation[] => {
    const flight = quotes.get(h.country)
    if (!flight) return []
    const hotelKzt = hotelTotalKzt(h, req.nights, passengers)
    const totalKzt = hotelKzt + flight.priceKzt
    const matchScore = Math.min(99, 88 + (req.country !== null && h.country === req.country ? 10 : 0))
    return [
      {
        id: h.id,
        name: h.name,
        country: h.country,
        location: h.location,
        stars: h.stars,
        meal: h.meal,
        rating: h.rating,
        reviews: h.reviews,
        matchScore,
        badge: BADGES[lang][0],
        amenities: [...h.amenities],
        hotelTotalKzt: hotelKzt,
        flightKzt: flight.priceKzt,
        totalKzt,
        totalUsd: Math.round(totalKzt / USD_TO_KZT),
        perNightKzt: Math.round(totalKzt / req.nights),
        breakdown:
          lang === 'ru'
            ? `Отель (${req.nights} ${pluralRu(req.nights, 'ночь', 'ночи', 'ночей')}): ${formatKzt(hotelKzt, 'ru')} + перелёт туда и обратно: ${formatKzt(flight.priceKzt, 'ru')}`
            : `Hotel (${req.nights}n): ${formatKzt(hotelKzt)} + Roundtrip Flight: ${formatKzt(flight.priceKzt)}`,
        guestsBadge: guestsBadge(req.adults, req.children, lang),
        flight,
      },
    ]
  })
}

// ───────────────────────────── curation ────────────────────────────

/**
 * Picks up to five distinct properties that strictly respect the budget (hotel + flight):
 * the best match first, then the cheapest, a beachfront pick, the top-rated and a 5★ VIP pick,
 * topped up by rank. Relaxes star/board filters (never the budget) when fewer than five match.
 */
export async function curateTopFive(
  candidates: Recommendation[],
  req: SearchRequest,
  lang: Lang = 'en',
): Promise<Recommendation[]> {
  const pool = candidates.filter((r) => r.totalKzt <= req.budgetKzt)

  if (pool.length < MAX_RESULTS) {
    const known = new Set(pool.map((r) => r.id))
    const relaxed = await searchHotels({ ...req, minStars: null, meal: null }, lang)
    for (const r of relaxed) {
      if (!known.has(r.id) && r.totalKzt <= req.budgetKzt) {
        pool.push(r)
        known.add(r.id)
      }
    }
  }
  if (pool.length === 0) return []

  const ranked = [...pool].sort((a, b) => b.matchScore - a.matchScore || b.rating - a.rating || a.totalKzt - b.totalKzt)
  const cheapest = Math.min(...ranked.map((r) => r.totalKzt))
  const bestRating = Math.max(...ranked.map((r) => r.rating))
  const vipIds = new Set(CATALOG.filter((h) => h.hasVip).map((h) => h.id))

  const selected: Recommendation[] = [ranked[0]]
  const rules: ((r: Recommendation) => boolean)[] = [
    (r) => r.totalKzt === cheapest,
    (r) => r.amenities.some((a) => a.toLowerCase().includes('beach') || a.toLowerCase().includes('first line')),
    (r) => r.rating === bestRating,
    (r) => r.stars === 5 && vipIds.has(r.id),
  ]
  for (const rule of rules) {
    const choice = ranked.find((r) => !selected.includes(r) && rule(r))
    if (choice) selected.push(choice)
  }
  for (const r of ranked) {
    if (selected.length >= Math.min(MAX_RESULTS, ranked.length)) break
    if (!selected.includes(r)) selected.push(r)
  }

  const badges = BADGES[lang]
  return selected.slice(0, MAX_RESULTS).map((r, i) => ({ ...r, badge: badges[i] ?? badges[badges.length - 1] }))
}

/** End-to-end: validated request in, curated recommendations out. */
export async function recommend(req: SearchRequest, lang: Lang = 'en'): Promise<Recommendation[]> {
  return curateTopFive(await searchHotels(req, lang), req, lang)
}

// ─────────────────────── budget reality & meta ─────────────────────

export function checkBudgetReality(country: Country, budgetKzt: number, nights: number): BudgetMismatch | null {
  const entry = MIN_PACKAGE_7N_KZT[country]
  const minKzt = Math.trunc((entry.minKzt * nights) / 7)
  if (budgetKzt >= minKzt) return null
  return { country, userBudgetKzt: budgetKzt, minBudgetKzt: minKzt, minBudgetUsd: Math.round(minKzt / USD_TO_KZT) }
}

export function destinationLabel(country: Country): string {
  return MIN_PACKAGE_7N_KZT[country].label
}

/** Builds a `SearchRequest` from conversation slots (missing optional slots get Python's defaults). */
export function slotsToRequest(slots: Slots, today: Date = new Date()): SearchRequest {
  return {
    origin: slots.origin,
    dateStart: slots.dateStart ?? toIsoDate(new Date(today.getTime() + 21 * 86_400_000)),
    nights: slots.nights ?? 7,
    adults: slots.adults ?? 2,
    children: slots.children,
    childrenAges: slots.childrenAges,
    budgetKzt: slots.budgetKzt ?? 1_500_000,
    country: slots.country,
    minStars: slots.minStars,
    meal: slots.meal,
    amenities: [],
  }
}

export function getMeta(): VoyageMeta {
  const destinations = COUNTRIES.map((country) => {
    const hotels = CATALOG.filter((h) => h.country === country)
    return {
      country,
      properties: hotels.length,
      // cheapest 7-night package for two guests, flights included
      fromKzt: hotels.length ? Math.min(...hotels.map((h) => h.package7Kzt)) + FLIGHT_ROUTES[country].fareKzt * 2 : 0,
    }
  })
  return {
    propertiesTotal: CATALOG.length,
    destinations,
    origins: ORIGINS,
    mealTypes: MEAL_TYPES,
    amenities: AMENITIES,
  }
}
