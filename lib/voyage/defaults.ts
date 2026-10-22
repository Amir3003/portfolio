import type { Lang, Slots } from '@/lib/voyage/types'

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

/** Example prompts shown as quick-start chips (English). */
export const SEASONAL_PROMPTS: readonly string[] = [
  'Solo trip to Dubai from Astana from October 20 for 5 nights, 1 adult, budget $2,500',
  'Family holiday in Antalya from Astana from October 14 for 7 nights: 2 adults, 1 child (6 years old), budget $2,800',
  'Phuket from Almaty from November 10 for 8 nights: 2 adults, budget 1,800,000 ₸',
  'Maldives from Almaty from November 5 for 7 nights: couple, all inclusive, budget $5,500',
]


/** Russian quick-start chips, ported from `SEASONAL_PROMPTS_RU` in `ai_agent.py`. */
export const SEASONAL_PROMPTS_RU: readonly string[] = [
  'Соло-поездка в Дубай из Астаны с 20 октября на 5 ночей, 1 взрослый, бюджет $2 500',
  'Семейный отдых в Анталье из Астаны с 14 октября на 7 ночей: 2 взрослых, 1 ребёнок (6 лет), бюджет $2 800',
  'Отдых на Пхукете из Алматы с 10 ноября на 8 ночей: 2 взрослых, бюджет 1 800 000 ₸',
  'Отдых на Мальдивах из Алматы с 5 ноября на 7 ночей: вилла на воде, всё включено, бюджет $5 500',
]

export const SEASONAL_PROMPTS_BY_LANG: Readonly<Record<Lang, readonly string[]>> = {
  en: SEASONAL_PROMPTS,
  ru: SEASONAL_PROMPTS_RU,
}

/** Quick-start chips in the requested language (the Python `build_seasonal_prompts`). */
export function seasonalPrompts(lang: Lang = 'en'): string[] {
  return [...SEASONAL_PROMPTS_BY_LANG[lang]]
}
