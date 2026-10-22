/**
 * Voyage AI - conversational slot-filling agent.
 *
 * TypeScript port of the deterministic half of `ai_agent.py` (`_fallback_extract`,
 * `TravelAgentContext`, `_build_question`, `_check_budget_reality`, `_build_summary`).
 * The Python service can additionally call an LLM (OpenRouter) for extraction; the portfolio build
 * uses the regex extractors only, so it needs no API keys and responds deterministically.
 * Extraction understands English and Russian input; replies follow the `lang` flag ('en' | 'ru').
 */

import {
  checkBudgetReality,
  destinationLabel,
  isCountry,
  isIsoDate,
  isMealType,
  isOrigin,
  isStars,
  pluralRu,
  recommend,
  searchHotels,
  slotsToRequest,
  toIsoDate,
  USD_TO_KZT,
} from '@/lib/voyage/recommend'
import { emptySlots, seasonalPrompts } from '@/lib/voyage/defaults'
import { formatKzt, formatNumber } from '@/lib/voyage/format'
import type {
  AgentReply,
  Country,
  Lang,
  MealType,
  Origin,
  RequiredSlot,
  SearchRequest,
  Slots,
  Stars,
} from '@/lib/voyage/types'

// ────────────────────────────── aliases ─────────────────────────────

/** English and Russian forms (cases included), ported from `COUNTRY_FORMS` in `ai_agent.py`. */
const COUNTRY_FORMS: Record<Country, readonly string[]> = {
  Turkey: [
    'turkey', 'turkiye', 'antalya', 'belek', 'kemer', 'side', 'bodrum', 'marmaris', 'alanya', 'istanbul',
    'турция', 'турции', 'турцию', 'турцией', 'турецкий', 'турецкие',
    'анталья', 'анталье', 'анталью', 'анталии', 'анталию', 'антальи', 'антальей', 'анталийский',
    'белек', 'белеке', 'белека', 'белеком', 'кемер', 'кемере', 'кемера', 'кемером', 'сиде',
    'бодрум', 'бодруме', 'бодрума', 'бодрумом', 'мармарис', 'мармарисе', 'мармариса',
    'аланья', 'аланье', 'аланью', 'алании', 'аланию', 'стамбул', 'стамбуле', 'стамбула', 'стамбулом',
  ],
  UAE: [
    'uae', 'emirates', 'united arab emirates', 'dubai', 'abu dhabi', 'sharjah', 'ras al khaimah',
    'оаэ', 'эмираты', 'эмиратах', 'эмиратов', 'эмиратам', 'эмиратами',
    'дубай', 'дубае', 'дубая', 'дубаи', 'дубаем', 'дубаях', 'дубайский',
    'абу-даби', 'абу даби', 'шарджа', 'шардже', 'шарджи', 'шарджу', 'рас-эль-хайма', 'рас аль хайма',
  ],
  Thailand: [
    'thailand', 'thai', 'phuket', 'pattaya', 'samui', 'bangkok', 'krabi',
    'таиланд', 'таиланде', 'таиланда', 'таиланду', 'таиландом', 'тайский',
    'тайланд', 'тайланде', 'тайланда', 'тайланду', 'тайландом', 'тай',
    'пхукет', 'пхукете', 'пхукета', 'пхукетом', 'пхукетский', 'паттайя', 'паттайе', 'паттайю', 'паттайи',
    'самуи', 'самуй', 'бангкок', 'бангкоке', 'бангкока', 'краби',
  ],
  Maldives: [
    'maldives', 'maldive', 'male',
    'мальдивы', 'мальдивах', 'мальдивам', 'мальдив', 'мальдивами', 'мале', 'мальдивский', 'мальдивские',
  ],
  Egypt: [
    'egypt', 'sharm', 'sharm el sheikh', 'hurghada',
    'египет', 'египте', 'египта', 'египтом', 'египетский', 'египетские',
    'шарм', 'шарм-эль-шейх', 'шарм эль шейх', 'шарм-эль-шейхе', 'шарме', 'шарма',
    'хургада', 'хургаде', 'хургаду', 'хургады', 'хургадой',
  ],
  Vietnam: [
    'vietnam', 'da nang', 'danang', 'phu quoc', 'nha trang',
    'вьетнам', 'вьетнаме', 'вьетнама', 'вьетнамом', 'вьетнамский',
    'дананг', 'дананге', 'дананга', 'фукуок', 'фукуоке', 'фукуока', 'нячанг', 'нячанге', 'нячанга',
  ],
  Georgia: [
    'georgia', 'batumi', 'tbilisi', 'kobuleti',
    'грузия', 'грузии', 'грузию', 'грузией', 'грузинский', 'батуми', 'тбилиси', 'кобулети',
  ],
  'Sri Lanka': [
    'sri lanka', 'colombo', 'bentota', 'galle',
    'шри-ланка', 'шри ланка', 'шри-ланке', 'шри ланке', 'шри-ланку', 'шри ланку',
    'шриланка', 'шриланке', 'шри-ланки', 'шри ланки', 'шри-ланкой', 'коломбо', 'бентота', 'бентоте', 'галле',
  ],
  Indonesia: [
    'indonesia', 'bali', 'denpasar', 'ubud',
    'индонезия', 'индонезии', 'индонезию', 'индонезией', 'индонезийский', 'бали', 'балийский', 'денпасар', 'убуд', 'убуде',
  ],
  Spain: [
    'spain', 'barcelona', 'mallorca', 'majorca', 'madrid',
    'испания', 'испании', 'испанию', 'испанией', 'испанский',
    'барселона', 'барселоне', 'барселону', 'барселоны', 'майорка', 'майорке', 'мальорка', 'мальорке',
    'мадрид', 'мадриде', 'мадрида',
  ],
}

const ORIGIN_FORMS: Record<Origin, readonly string[]> = {
  Astana: [
    'astana', 'nqz', 'nur-sultan', 'nursultan', 'nur sultan',
    'астана', 'астаны', 'астане', 'астану', 'астаной', 'нур-султан', 'нурсултан', 'нур султан',
  ],
  Almaty: ['almaty', 'alma-ata', 'ala', 'алматы', 'алмате', 'алмату', 'алма-ата', 'алмаата', 'алмааты'],
  Shymkent: ['shymkent', 'cit', 'шымкент', 'шымкента', 'шымкенте', 'шымкенту'],
}

/** Longest alias first so "united arab emirates" wins over "arab"-style partials. */
function buildAliasList<T extends string>(forms: Record<T, readonly string[]>): [string, T][] {
  const entries: [string, T][] = []
  for (const key of Object.keys(forms) as T[]) for (const alias of forms[key]) entries.push([alias, key])
  return entries.sort((a, b) => b[0].length - a[0].length)
}

const COUNTRY_ALIASES = buildAliasList(COUNTRY_FORMS)
const ORIGIN_ALIASES = buildAliasList(ORIGIN_FORMS)

/** Matched against lowercased text with `ё` folded to `е`. Longer phrases first. */
const MEAL_ALIASES: readonly [string, MealType][] = [
  ['ultra all inclusive', 'UAI - Ultra All Inclusive'],
  ['ультра все включено', 'UAI - Ultra All Inclusive'],
  ['uai', 'UAI - Ultra All Inclusive'],
  ['all inclusive', 'AI - All Inclusive'],
  ['all-inclusive', 'AI - All Inclusive'],
  ['все включено', 'AI - All Inclusive'],
  ['full board', 'FB - Full Board'],
  ['полный пансион', 'FB - Full Board'],
  ['half board', 'HB - Half Board'],
  ['полупансион', 'HB - Half Board'],
  ['завтрак и ужин', 'HB - Half Board'],
  ['bed and breakfast', 'BB - Bed & Breakfast'],
  ['breakfast', 'BB - Bed & Breakfast'],
  ['завтрак', 'BB - Bed & Breakfast'],
]

/** Letters and digits of both scripts: the word boundary `\b` does not know Cyrillic. */
const WORD = 'a-zа-яё0-9'
const B = `(?<![${WORD}])`
const E = `(?![${WORD}])`

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wordRe = (alias: string): RegExp => new RegExp(`${B}${escapeRe(alias)}${E}`, 'i')
const foldYo = (text: string): string => text.toLowerCase().replace(/ё/g, 'е')

// ───────────────────────────── extractors ───────────────────────────

export function extractCountry(text: string): Country | null {
  for (const [alias, country] of COUNTRY_ALIASES) if (wordRe(alias).test(text)) return country
  return null
}

export function extractOrigin(text: string): Origin | null {
  const from =
    /\bfrom\s+([a-z-]+(?:\s[a-z]+)?)/i.exec(text) ??
    new RegExp(`${B}(?:вылет(?:ом)?\\s+)?из\\s+([а-яёa-z-]+(?:\\s[а-яёa-z]+)?)`, 'i').exec(text)
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
  const usd = new RegExp(
    String.raw`\$\s*${NUM}|${NUM}\s*(?:\$|usd\b|dollars?\b|bucks?\b|долл[а-яё]*|бакс[а-яё]*)`,
    'i',
  ).exec(text)
  if (usd) {
    const value = toNumber(usd[1] ?? usd[2])
    if (value > 0) return Math.round(value * USD_TO_KZT)
  }
  const million = new RegExp(String.raw`${NUM}\s*(?:mln\b|million\b|m\b|млн${E}|миллион[а-яё]*)`, 'i').exec(text)
  if (million) return Math.round(toNumber(million[1]) * 1_000_000)

  const thousand = new RegExp(String.raw`${NUM}\s*(?:k\b|к${E}|тыс[а-яё]*\.?)`, 'i').exec(text)
  if (thousand) {
    const value = toNumber(thousand[1]) * 1000
    if (value >= 50_000) return Math.round(value)
  }
  const kzt = new RegExp(String.raw`${NUM}\s*(?:₸|kzt\b|tenge\b|tg\b|тенге|тг${E})`, 'i').exec(text)
  if (kzt) return Math.round(toNumber(kzt[1]))

  const labelled = new RegExp(
    String.raw`(?:budget|up\s+to|under|within|max(?:imum)?|бюджет|${B}до${E}|под\s+ключ)\D{0,12}${NUM}`,
    'i',
  ).exec(text)
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

const RU_NUMBER_WORDS: Record<string, number> = {
  две: 2, два: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9, десять: 10,
  одиннадцать: 11, двенадцать: 12, четырнадцать: 14,
}

export function extractNights(text: string): number | null {
  const explicit = /(\d+)\s*(?:nights?|days?)\b/i.exec(text)
  if (explicit) return Number.parseInt(explicit[1], 10)
  const explicitRu = new RegExp(`(\\d+)\\s*(?:ноч[а-яё]*|сут(?:ок|ки)${E}|дн(?:ей|я)${E}|день${E})`, 'i').exec(text)
  if (explicitRu) return Number.parseInt(explicitRu[1], 10)

  const weeks = /(\d+)\s*weeks?\b/i.exec(text)
  if (weeks) return Number.parseInt(weeks[1], 10) * 7
  const weeksRu = /(\d+)\s*недел[а-яё]*/i.exec(text)
  if (weeksRu) return Number.parseInt(weeksRu[1], 10) * 7
  if (/\b(?:a|one)\s+week\b/i.test(text)) return 7
  if (new RegExp(`${B}(?:две|двух)\\s+недел`, 'i').test(text)) return 14
  if (new RegExp(`${B}(?:три|тр[её]х)\\s+недел`, 'i').test(text)) return 21
  if (new RegExp(`${B}(?:на\\s+(?:одну\\s+)?неделю|одн[ау]\\s+недел[юя])${E}`, 'i').test(text)) return 7

  for (const [word, n] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(String.raw`\b${word}\s+nights?\b`, 'i').test(text)) return n
  }
  for (const [word, n] of Object.entries(RU_NUMBER_WORDS)) {
    if (new RegExp(`${B}${word}\\s+ноч`, 'i').test(text)) return n
  }
  const bare = /^\s*(\d{1,2})[.!?]?\s*$/.exec(text)
  if (bare) {
    const n = Number.parseInt(bare[1], 10)
    if (n >= 1 && n <= 60) return n
  }
  return null
}

/** Russian solo cues from `_is_solo`; "один"/"одна" are skipped before hotel, night, star or child words. */
const SOLO_RU = new RegExp(
  [
    `${B}соло${E}`,
    `${B}соло[\\s-]поездк`,
    `${B}один${E}(?!\\s*(?:отел|ноч|день|раз|звезд|рейс|реб|дет))`,
    `${B}одна${E}(?!\\s*(?:звезд|ноч|кроват|реб|дет))`,
    `${B}(?:еду|лечу|поеду)\\s+один`,
    `${B}(?:один|одного)\\s+взросл`,
    `${B}(?:для|на)\\s+одного`,
    `${B}1\\s*взросл[а-яё]*${E}`,
  ].join('|'),
  'i',
)

export function isSolo(text: string): boolean {
  if (SOLO_RU.test(text)) return true
  return /\b(solo[\s-]?(?:trip|travel(?:er)?)?|travel(?:l)?ing\s+alone|i\s+am\s+alone|just\s+me|for\s+(?:1|one)\s+(?:person|adult)|single\s+traveler|1\s+adult)\b/i.test(text)
}

export function extractAdults(text: string): number | null {
  if (isSolo(text)) return 1
  if (/\b(couple|for\s+two|two\s+adults|2\s+adults)\b/i.test(text)) return 2
  if (new RegExp(`${B}(?:двоих|вдво[её]м|двое|пара|паре|парой)${E}`, 'i').test(text)) return 2
  const count = /(\d+)\s*(?:adults?|guests?|persons?|people)\b/i.exec(text)
  if (count) return Number.parseInt(count[1], 10)
  const countRu = new RegExp(`(\\d+)\\s*(?:взросл[а-яё]*|человек[а-яё]*|чел${E}|гост[а-яё]*)`, 'i').exec(text)
  if (countRu) return Number.parseInt(countRu[1], 10)
  if (new RegExp(`${B}трое${E}`, 'i').test(text)) return 3
  if (/\bfamily\b/i.test(text)) return 2
  if (new RegExp(`${B}(?:семья|семье|семьей|семьёй|семью|семейн[а-яё]*)${E}`, 'i').test(text)) return 2
  return null
}

export function extractChildren(text: string): number | null {
  const count = /(\d+)\s*(?:children|kids?|child)\b(?!\s*club)/i.exec(text)
  if (count) return Number.parseInt(count[1], 10)
  const countRu = new RegExp(`(\\d+)\\s*(?:дет(?:ей|и|ям|ьми)|реб[её]н(?:ок|ка|ком))${E}`, 'i').exec(text)
  if (countRu) return Number.parseInt(countRu[1], 10)
  if (/\b(?:a|one)\s+(?:child|kid)\b(?!\s*club)/i.test(text)) return 1
  if (new RegExp(`${B}(?:двое|двумя)\\s+дет`, 'i').test(text)) return 2
  if (new RegExp(`${B}(?:один|одним|одного|с)\\s+реб[её]н|${B}реб[её]н(?:ок|ком)${E}`, 'i').test(text)) return 1
  if (new RegExp(`${B}с\\s+детьми${E}`, 'i').test(text)) return 2
  return null
}

export function extractChildrenAges(text: string): number[] | null {
  const parenthesised = [
    ...text.matchAll(/\(\s*(?:aged?\s*|возраст\s*)?(\d{1,2})\s*(?:years?(?:\s+old)?|yrs?|лет|года?)?\s*\)/gi),
  ]
  if (parenthesised.length) return parenthesised.map((m) => Number.parseInt(m[1], 10))
  const plain = [...text.matchAll(/\b(\d{1,2})\s*(?:years?\s+old|yrs?\s+old|y\.?o\.?)/gi)]
  if (plain.length) return plain.map((m) => Number.parseInt(m[1], 10))
  const plainRu = [...text.matchAll(new RegExp(`(?<!\\d)(\\d{1,2})\\s*(?:-?(?:ти|х|ми)\\s*)?(?:лет|года?)${E}`, 'gi'))]
  if (plainRu.length) return plainRu.map((m) => Number.parseInt(m[1], 10))
  return null
}

export function extractStars(text: string): Stars | null {
  const match =
    /\b([345])\s*[- ]?(?:stars?\b|★)/i.exec(text) ??
    new RegExp(`(?<!\\d)([345])\\s*[- ]?(?:звезд[а-яё]*|зв\\.|\\*)`, 'i').exec(text)
  if (!match) return null
  const n = Number.parseInt(match[1], 10)
  return isStars(n) ? n : null
}

export function extractMeal(text: string): MealType | null {
  const low = foldYo(text)
  for (const [alias, meal] of MEAL_ALIASES) if (low.includes(alias)) return meal
  return null
}

const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const
const monthOf = (word: string): number => MONTH_KEYS.indexOf(word.slice(0, 3).toLowerCase() as (typeof MONTH_KEYS)[number])

/** Russian month stems (any case ending) and abbreviations, from `RU_MONTH_MAP`. Index = month number - 1. */
const RU_MONTH_STEMS = ['январ', 'феврал', 'март', 'апрел', 'ма[йяе]', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'] as const
const RU_MONTH_ABBR = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сент?', 'окт', 'нояб?', 'дек'] as const
const RU_MONTH = `((?:${RU_MONTH_STEMS.join('|')})[а-яё]*|(?:${RU_MONTH_ABBR.join('|')})\\.?)`
const ruMonthOf = (word: string): number => {
  const byStem = RU_MONTH_STEMS.findIndex((stem) => new RegExp(`^${stem}`, 'i').test(word))
  return byStem >= 0 ? byStem : RU_MONTH_ABBR.findIndex((abbr) => new RegExp(`^${abbr}\\.?$`, 'i').test(word))
}

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

const inDays = (today: Date, days: number): string => toIsoDate(new Date(today.getTime() + days * 86_400_000))

/** "In October" style answers: a week out for the current month, otherwise the 1st. */
function monthStart(month: number, today: Date): string | null {
  return month === today.getUTCMonth() ? inDays(today, 7) : upcoming(month, 1, today)
}

export function extractDate(text: string, today: Date): string | null {
  const iso = /\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/.exec(text)
  if (iso && isIsoDate(iso[0])) return iso[0]

  const dayMonth = new RegExp(String.raw`\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?${MONTH}\b`, 'i').exec(text)
  if (dayMonth) return upcoming(monthOf(dayMonth[2]), Number.parseInt(dayMonth[1], 10), today)

  const dayMonthRu = new RegExp(`(?<!\\d)(\\d{1,2})(?:-?(?:го|е|ое))?\\s+${RU_MONTH}${E}`, 'i').exec(text)
  if (dayMonthRu) {
    const month = ruMonthOf(dayMonthRu[2])
    if (month >= 0) return upcoming(month, Number.parseInt(dayMonthRu[1], 10), today)
  }

  const monthDay = new RegExp(String.raw`\b${MONTH}\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b(?!\s*(?:nights?|days?|adults?|\$|k\b|m\b))`, 'i').exec(text)
  if (monthDay) return upcoming(monthOf(monthDay[1]), Number.parseInt(monthDay[2], 10), today)

  const numeric = /\b(\d{1,2})[./](\d{1,2})[./](\d{2,4})\b|\b(\d{1,2})\/(\d{1,2})\b|\b(\d{2})\.(\d{2})\b/.exec(text)
  if (numeric) {
    const day = Number.parseInt(numeric[1] ?? numeric[4] ?? numeric[6], 10)
    const month = Number.parseInt(numeric[2] ?? numeric[5] ?? numeric[7], 10) - 1
    if (month >= 0 && month < 12) return upcoming(month, day, today)
  }

  const monthOnly = new RegExp(String.raw`\b(?:in|during|early|late|mid|next)[-\s]+${MONTH}\b`, 'i').exec(text)
  if (monthOnly) return monthStart(monthOf(monthOnly[1]), today)

  const monthOnlyRu = new RegExp(`${B}(?:в|во|на|с|к|до|начале|середине|конце)\\s+${RU_MONTH}${E}`, 'i').exec(text)
  if (monthOnlyRu) {
    const month = ruMonthOf(monthOnlyRu[1])
    if (month >= 0) return monthStart(month, today)
  }

  if (/\bnext\s+month\b/i.test(text)) return inDays(today, 30)
  if (/\b(flexible|asap|soon|nearest\s+dates?|any\s+date)\b/i.test(text)) return inDays(today, 21)

  if (new RegExp(`${B}послезавтра${E}`, 'i').test(text)) return inDays(today, 2)
  if (new RegExp(`${B}завтра${E}`, 'i').test(text)) return inDays(today, 1)
  if (new RegExp(`${B}(?:через\\s+неделю|на\\s+следующей\\s+неделе)${E}`, 'i').test(text)) return inDays(today, 7)
  if (new RegExp(`${B}(?:в\\s+следующем\\s+месяце|через\\s+месяц)${E}`, 'i').test(text)) return inDays(today, 30)
  if (
    new RegExp(
      `${B}(?:ближайш[а-яё]*|люб[а-яё]*\\s+дат[а-яё]*|гибк[а-яё]*\\s+дат[а-яё]*|без\\s+разниц[а-яё]*|не\\s+важно|как\\s+можно\\s+скорее|скоро)${E}`,
      'i',
    ).test(text)
  )
    return inDays(today, 21)
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
  // Lowercase and fold `ё` so Russian forms match one spelling.
  const text = foldYo(message.trim())
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

const QUESTIONS: Record<Lang, Record<RequiredSlot | 'fallback', string>> = {
  en: {
    country: 'Which destination would you like to explore? (e.g. Turkey, UAE, Thailand, Maldives, or Spain).',
    dateStart: "When are you planning to depart? (e.g., October 14, next month, or 'flexible dates').",
    nights: 'How many nights are you planning for your stay? (e.g. 7 nights or 10 nights).',
    adults: "How many guests will be traveling? (e.g., 'solo / 1 adult', 'couple / 2 adults', or 'family with 1 child').",
    childrenAges: 'Could you please specify the age of each child traveling with you?',
    budgetKzt: 'What is your target budget for the complete vacation package (in USD or KZT, e.g. $3,000 or 1,500,000 ₸)?',
    fallback: 'Please specify your target destination, departure date, duration, and budget to prepare your custom itinerary.',
  },
  ru: {
    country: 'Куда желаете полететь? Например: Турция, ОАЭ, Таиланд, Мальдивы, Вьетнам или Египет.',
    dateStart: 'Уточните, пожалуйста, на какую дату или месяц планируете вылет? (например: 14 октября или «ближайшие даты»).',
    nights: 'На сколько ночей планируете поездку? (например, 7 или 10 ночей).',
    adults: 'Сколько человек едет? (например: «я один», «двое взрослых», «семья с 1 ребёнком»).',
    childrenAges: 'Укажите, пожалуйста, возраст каждого ребёнка, который поедет с вами.',
    budgetKzt: 'Уточните, пожалуйста, ваш ориентировочный бюджет (в тенге или долларах, например $3 000 или 1 500 000 ₸).',
    fallback: 'Уточните направление, дату вылета, длительность и бюджет, и мы подготовим персональный маршрут.',
  },
}

const QUESTION_ORDER: readonly RequiredSlot[] = ['country', 'dateStart', 'nights', 'adults', 'childrenAges', 'budgetKzt']

function buildQuestion(missing: RequiredSlot[], lang: Lang): string {
  const slot = QUESTION_ORDER.find((s) => missing.includes(s))
  return QUESTIONS[lang][slot ?? 'fallback']
}

const CITY_EN: Record<Country, string> = {
  Turkey: 'Antalya', UAE: 'Dubai', Thailand: 'Phuket', Maldives: 'the Maldives', Egypt: 'Sharm El Sheikh',
  Vietnam: 'Da Nang', Georgia: 'Batumi', 'Sri Lanka': 'Sri Lanka', Indonesia: 'Bali', Spain: 'Barcelona',
}

/** Where the trip goes, with the right preposition ("в Дубае", "на Мальдивах"). */
const CITY_RU: Record<Country, string> = {
  Turkey: 'в Анталье', UAE: 'в Дубае', Thailand: 'на Пхукете', Maldives: 'на Мальдивах', Egypt: 'в Шарм-эль-Шейхе',
  Vietnam: 'в Дананге', Georgia: 'в Батуми', 'Sri Lanka': 'на Шри-Ланке', Indonesia: 'на Бали', Spain: 'в Барселоне',
}

/** Russian destination names for the budget check: `to` = "в Турцию", `acc` = "Турцию" (after "Показать"). */
const DEST_RU: Record<Country, { to: string; acc: string }> = {
  Maldives: { to: 'на Мальдивы', acc: 'Мальдивы' },
  UAE: { to: 'в ОАЭ (Дубай)', acc: 'ОАЭ (Дубай)' },
  Indonesia: { to: 'на Бали (Индонезия)', acc: 'Бали (Индонезия)' },
  Spain: { to: 'в Испанию (Барселона)', acc: 'Испанию (Барселона)' },
  Thailand: { to: 'в Таиланд (Пхукет)', acc: 'Таиланд (Пхукет)' },
  Vietnam: { to: 'во Вьетнам (Дананг)', acc: 'Вьетнам (Дананг)' },
  'Sri Lanka': { to: 'на Шри-Ланку', acc: 'Шри-Ланку' },
  Turkey: { to: 'в Турцию (Анталья)', acc: 'Турцию (Анталья)' },
  Georgia: { to: 'в Грузию (Батуми)', acc: 'Грузию (Батуми)' },
  Egypt: { to: 'в Египет (Шарм-эль-Шейх)', acc: 'Египет (Шарм-эль-Шейх)' },
}

const ORIGIN_RU: Record<Origin, string> = { Astana: 'Астаны', Almaty: 'Алматы', Shymkent: 'Шымкента' }

const MONTHS_RU_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
] as const

/** `2026-10-20` to "20 октября" (the Python `_format_date_ru`). */
function formatDateRu(iso: string): string {
  if (!isIsoDate(iso)) return iso
  const [, month, day] = iso.split('-').map((part) => Number.parseInt(part, 10))
  return `${day} ${MONTHS_RU_GENITIVE[month - 1]}`
}

const nightsRu = (n: number): string => `${n} ${pluralRu(n, 'ночь', 'ночи', 'ночей')}`
const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

function buildSummary(req: SearchRequest, best: AgentReply['results'][number], lang: Lang): string {
  const passengers = req.adults + req.children
  const f = best.flight
  if (lang === 'ru') {
    const party = passengers === 1 ? 'для вашей соло-поездки' : req.children > 0 ? 'для вашей семьи' : 'для вашей поездки'
    const destination = req.country ? CITY_RU[req.country] : 'в выбранном направлении'
    return (
      `Подобрал ${party} лучшие варианты ${destination} с прямым перелётом ${f.airline} ` +
      `(${f.fromCode} → ${f.toCode}) из ${ORIGIN_RU[req.origin]} (вылет ${formatDateRu(req.dateStart)}, ${nightsRu(req.nights)}). ` +
      `Топ-рекомендация: ${best.name} (${best.stars}★, рейтинг ${best.rating}/5). ` +
      `Пакеты ниже включают проживание, выбранное питание и перелёт в обе стороны.`
    )
  }
  const party = passengers === 1 ? 'for your solo trip' : req.children > 0 ? 'for your family holiday' : 'for your journey'
  const destination = req.country ? CITY_EN[req.country] : 'your chosen destination'
  return (
    `Curated the best options ${party} to ${destination} with direct ${f.airline} flights ` +
    `(${f.fromCode} → ${f.toCode}, departing ${req.dateStart}, ${req.nights} nights). ` +
    `Top recommendation: ${best.name} (${best.stars}★, rating ${best.rating}/5). ` +
    `Packages below include accommodation, the selected meal plan, and roundtrip flights.`
  )
}

const NO_RESULTS: Record<Lang, string> = {
  en: "No matching options found within these exact filters. Let's expand your budget slightly or select another destination.",
  ru: 'По указанным критериям вариантов не найдено. Попробуйте немного увеличить бюджет или выбрать другое направление.',
}

function mismatchText(
  country: Country,
  budgetKzt: number,
  nights: number,
  minKzt: number,
  lang: Lang,
): { reply: string; prompts: string[] } {
  const minUsd = Math.round(minKzt / USD_TO_KZT)
  const userUsd = Math.round(budgetKzt / USD_TO_KZT)
  if (lang === 'ru') {
    const dest = DEST_RU[country]
    return {
      reply:
        `${capitalize(dest.to)} на ${nightsRu(nights)} минимальная стоимость пакета с прямым перелётом начинается ` +
        `от ${formatKzt(minKzt, 'ru')} (~$${formatNumber(minUsd, 'ru')}). ` +
        `В рамках вашего бюджета (до ${formatKzt(budgetKzt, 'ru')} / ~$${formatNumber(userUsd, 'ru')}) мы можем предложить ` +
        `отличные 4-5★ отели в других направлениях (например, Турция или Египет), либо рассмотреть альтернативные даты. ` +
        `Как поступим?`,
      prompts: [`Подобрать альтернативу до ${formatKzt(budgetKzt, 'ru')}`, `Показать ${dest.acc} от ${formatKzt(minKzt, 'ru')}`],
    }
  }
  const label = destinationLabel(country)
  return {
    reply:
      `A package to ${label} for ${nights} nights with direct flights starts from ${formatKzt(minKzt)} (~$${minUsd.toLocaleString('en-US')}). ` +
      `Within your budget (up to ${formatKzt(budgetKzt)} / ~$${userUsd.toLocaleString('en-US')}) we can offer excellent 4-5★ options in other ` +
      `destinations (such as Turkey or Egypt), or explore alternative dates. How would you like to proceed?`,
    prompts: [`Find alternatives within $${userUsd.toLocaleString('en-US')}`, `Show ${label} packages from $${minUsd.toLocaleString('en-US')}`],
  }
}

function mismatchReply(
  slots: Slots,
  country: Country,
  budgetKzt: number,
  nights: number,
  minKzt: number,
  lang: Lang,
): Omit<AgentReply, 'elapsedMs'> {
  const { reply, prompts } = mismatchText(country, budgetKzt, nights, minKzt, lang)
  return {
    state: 'BUDGET_MISMATCH',
    reply,
    missing: [],
    slots,
    results: [],
    prompts,
    budgetMismatch: { country, userBudgetKzt: budgetKzt, minBudgetKzt: minKzt, minBudgetUsd: Math.round(minKzt / USD_TO_KZT) },
  }
}

/**
 * One conversational turn: merge the message into the slots, then either ask for what's missing,
 * explain a budget mismatch, or return the curated top five. Every user-facing string follows `lang`.
 */
export async function runAgentTurn(
  previous: Slots,
  message: string,
  lang: Lang = 'en',
  today: Date = new Date(),
): Promise<Omit<AgentReply, 'elapsedMs'>> {
  const slots = applyMessage(previous, message, today)
  const missing = missingSlots(slots)
  const prompts = seasonalPrompts(lang)

  if (missing.length > 0) {
    return {
      state: 'INCOMPLETE',
      reply: buildQuestion(missing, lang),
      missing,
      slots,
      results: [],
      prompts,
      budgetMismatch: null,
    }
  }

  // All required slots are present (narrowed for the type checker).
  const country = slots.country as Country
  const budgetKzt = slots.budgetKzt as number
  const nights = slots.nights as number

  const reality = checkBudgetReality(country, budgetKzt, nights)
  if (reality) return mismatchReply(slots, country, budgetKzt, nights, reality.minBudgetKzt, lang)

  const request = slotsToRequest(slots, today)
  const results = await recommend(request, lang)

  if (results.length === 0) {
    const unconstrained = await searchHotels({ ...request, budgetKzt: 100_000_000, minStars: null, meal: null }, lang)
    const minKzt = unconstrained.length ? Math.min(...unconstrained.map((r) => r.totalKzt)) : 0
    if (minKzt > 0 && budgetKzt < minKzt) return mismatchReply(slots, country, budgetKzt, nights, minKzt, lang)
    return {
      state: 'INCOMPLETE',
      reply: NO_RESULTS[lang],
      missing: [],
      slots,
      results: [],
      prompts,
      budgetMismatch: null,
    }
  }

  return {
    state: 'COMPLETE',
    reply: buildSummary(request, results[0], lang),
    missing: [],
    slots,
    results,
    prompts,
    budgetMismatch: null,
  }
}
