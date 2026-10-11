import type { Slots } from '@/lib/voyage/types'

/** Lightweight defaults shared by the agent and the dashboard (keeps the catalog out of the client bundle). */

export function emptySlots(): Slots {
  return {
    origin: 'Astana',
    dateStart: null,
    nights: null,
    budgetKzt: null,
    country: null,
    adults: null,
    children: 0,
    childrenAges: [],
    minStars: null,
    meal: null,
  }
}

/** Example prompts shown as quick-start chips. */
export const SEASONAL_PROMPTS: readonly string[] = [
  'Solo trip to Dubai from Astana from October 20 for 5 nights, 1 adult, budget $2,500',
  'Family holiday in Antalya from Astana from October 14 for 7 nights: 2 adults, 1 child (6 years old), budget $2,800',
  'Phuket from Almaty from November 10 for 8 nights: 2 adults, budget 1,800,000 ₸',
  'Maldives from Almaty from November 5 for 7 nights: couple, all inclusive, budget $5,500',
]

