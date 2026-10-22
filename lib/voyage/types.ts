/**
 * Voyage AI - strictly-typed domain model.
 *
 * Ported from the Python/Pydantic models in https://github.com/Amir3003/AItouragent
 * (`hotel_search.py`, `ai_agent.py`). Wire-format keys are camelCase.
 */

/** UI and reply language. */
export type Lang = 'en' | 'ru'

export const COUNTRIES = [
  'Turkey',
  'Egypt',
  'UAE',
  'Thailand',
  'Maldives',
  'Vietnam',
  'Georgia',
  'Sri Lanka',
  'Indonesia',
  'Spain',
] as const
export type Country = (typeof COUNTRIES)[number]

export const ORIGINS = ['Astana', 'Almaty', 'Shymkent'] as const
export type Origin = (typeof ORIGINS)[number]

export const MEAL_TYPES = [
  'BB - Bed & Breakfast',
  'HB - Half Board',
  'FB - Full Board',
  'AI - All Inclusive',
  'UAI - Ultra All Inclusive',
] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const AMENITIES = [
  'Private Beach',
  'Sandy Beach',
  'Beachfront (First Line)',
  'High-speed Wi-Fi',
  'Aqua Park',
  'Kids Club',
  'All-Inclusive',
] as const
export type Amenity = (typeof AMENITIES)[number]

export type Stars = 3 | 4 | 5

/** One property from the exported catalog. `package7Kzt` = 7-night hotel price for 2 guests. */
export interface CatalogHotel {
  readonly id: string
  readonly name: string
  readonly country: Country
  readonly location: string
  readonly stars: Stars
  readonly meal: MealType
  readonly package7Kzt: number
  readonly rating: number
  readonly reviews: number
  readonly amenities: readonly Amenity[]
  readonly maxGuests: number
  readonly distanceBeachM: number
  readonly airport: string
  readonly hasVip: boolean
}

/** A fully-validated search request (the Pydantic `HotelSearchRequest`). */
export interface SearchRequest {
  origin: Origin
  /** ISO date, `YYYY-MM-DD`. */
  dateStart: string
  nights: number
  adults: number
  children: number
  childrenAges: number[]
  budgetKzt: number
  country: Country | null
  minStars: Stars | null
  meal: MealType | null
  amenities: Amenity[]
}

/** Slots gathered so far in a conversation (the Python `TravelAgentContext`). */
export interface Slots {
  origin: Origin
  dateStart: string | null
  nights: number | null
  budgetKzt: number | null
  country: Country | null
  adults: number | null
  children: number
  childrenAges: number[]
  minStars: Stars | null
  meal: MealType | null
}

export type RequiredSlot = 'country' | 'dateStart' | 'nights' | 'adults' | 'budgetKzt' | 'childrenAges'

export interface FlightQuote {
  airline: string
  airlineCode: string
  aircraft: string
  fromCity: Origin
  fromCode: string
  toCity: string
  toCode: string
  departDate: string
  returnDate: string
  duration: string
  priceKzt: number
}

export interface Recommendation {
  id: string
  name: string
  country: Country
  location: string
  stars: Stars
  meal: MealType
  rating: number
  reviews: number
  /** 0-100 preference match. */
  matchScore: number
  badge: string
  amenities: Amenity[]
  hotelTotalKzt: number
  flightKzt: number
  totalKzt: number
  totalUsd: number
  perNightKzt: number
  breakdown: string
  guestsBadge: string
  flight: FlightQuote
}

export type AgentState = 'COMPLETE' | 'INCOMPLETE' | 'BUDGET_MISMATCH'

export interface BudgetMismatch {
  country: Country
  userBudgetKzt: number
  minBudgetKzt: number
  minBudgetUsd: number
}

export interface AgentReply {
  state: AgentState
  reply: string
  missing: RequiredSlot[]
  slots: Slots
  results: Recommendation[]
  prompts: string[]
  budgetMismatch: BudgetMismatch | null
  /** Server-side wall time for the whole agent turn, in milliseconds. */
  elapsedMs: number
}

export interface VoyageMeta {
  propertiesTotal: number
  destinations: { country: Country; properties: number; fromKzt: number }[]
  origins: readonly Origin[]
  mealTypes: readonly MealType[]
  amenities: readonly Amenity[]
}

export interface ValidationIssue {
  field: string
  message: string
}

export type Result<T, E = ValidationIssue[]> = { ok: true; value: T } | { ok: false; error: E }

