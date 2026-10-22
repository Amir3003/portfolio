/**
 * Voyage AI dashboard copy in English and Russian.
 *
 * Russian strings follow the original project (https://github.com/Amir3003/AItouragent,
 * `static/app.js` TRANSLATIONS and inline `isRu` copy), rebranded from "Zari Travel" to "Voyage AI".
 */

import type { Lang } from '@/lib/voyage/types'

export type { Lang }

export const LANGS: readonly Lang[] = ['en', 'ru']

export const LANG_STORAGE_KEY = 'voyage-lang'

export const isLang = (value: unknown): value is Lang => value === 'en' || value === 'ru'

export interface ChipCopy {
  label: string
  query: string
}

export interface SuiteCopy {
  name: string
  detail: string
}

export type SuiteId = 'superior' | 'deluxe' | 'executive' | 'royal'
export type MealCode = 'BB' | 'HB' | 'FB' | 'AI' | 'UAI'
export type BeachKind = 'beachfront' | 'private'

const en = {
  langSwitchLabel: 'Interface language',
  githubLabel: 'GitHub',

  // Top bar
  mvpShort: 'MVP',
  mvpLong: 'MVP PROTOTYPE · IN ACTIVE DEVELOPMENT',

  // Hero
  heroEyebrowLead: 'AUTONOMOUS LUXURY TRAVEL · ',
  heroEyebrowTail: '24/7 CONCIERGE',
  heroStageBadge: 'MVP STAGE · ACTIVE DEVELOPMENT',
  heroTitleBrand: 'Voyage AI.',
  heroTitleLine1: 'Your Autonomous',
  heroTitleLine2: 'Travel Concierge',
  heroDesc:
    'Bespoke itinerary curation powered by Google Gemini. Direct roundtrip flights, handpicked 5-star suites, and transparent pricing in USD & KZT with zero commission markups.',
  heroMvpNote: '(Voyage AI is currently in active development: this is an interactive MVP prototype).',
  heroCta: 'Start Curation',
  statConcierge: 'AUTONOMOUS CONCIERGE',
  statResorts: 'ELITE WORLD RESORTS',
  statDestinations: 'TOP GLOBAL DESTINATIONS',
  statCommission: 'HIDDEN COMMISSION',

  // Intro
  introEyebrow: 'VOYAGE AI CONCIERGE',
  introTitle: 'Where shall we take you?',
  introDesc:
    'A single conversational prompt replaces tedious multi-step search engines. Voyage AI interprets your travel style, selects non-stop flight routes, and matches real suites.',

  // Chat panel
  panelAria: 'Natural language extraction',
  panelStatus: 'Voyage AI Active · Real-time Parameter Extraction',
  panelSub: 'Natural Language Parsing',
  reset: 'Reset',
  welcome:
    'Welcome to Voyage AI! I am your autonomous travel concierge. Where would you like to travel, for how many nights, and what is your preferred budget and party size?',
  pendingAria: 'Voyage AI is preparing your packages',
  inputAria: 'Describe your trip',
  placeholder: 'e.g. Solo luxury escape to Dubai from Astana for 7 nights, 5★, $3,500 budget',
  send: 'Send',
  errorFallback: 'Voyage AI could not be reached. Please try again.',
  chips: [
    {
      label: 'Need flights to Dubai, 2 adults, for a week...',
      query: 'Need flights to Dubai from Astana, flexible dates, 7 nights: 2 adults, $5,000 budget',
    },
    {
      label: 'Solo trip to Dubai, 5 nights',
      query: 'Solo luxury trip to Dubai from Astana, flexible dates, 5 nights: 1 adult, $3,500 budget',
    },
    {
      label: 'Family holiday in Antalya from Astana, 7 nights',
      query: 'Family holiday in Antalya from Astana, flexible dates, 7 nights: 2 adults, 1 child (age 6), $4,000 budget',
    },
    {
      label: 'Phuket vacation, 8 nights',
      query: 'Phuket vacation from Almaty, flexible dates, 8 nights: 2 adults, $3,600 budget',
    },
  ] as readonly ChipCopy[],

  // Results
  resultsEyebrow: 'Bespoke Selection',
  resultsTitle: (n: number) => `Top ${n} Tailored Packages`,
  resultsBadge: (n: number) => `Top ${n} Bespoke Matches`,

  // Package card
  affinity: (score: number) => `${score}% Affinity`,
  flightIncluded: 'Flight Included in Package',
  directFlight: 'Direct Flight',
  nonStop: 'non-stop',
  baggage: '23 kg + 8 kg',
  duration: (h: number, m: number) => `${h}h ${m}m`,
  flexDates: 'Flexible departure dates:',
  selected: 'Selected',
  beachLabel: 'Beach',
  beach: { beachfront: 'Beachfront', private: 'Private beach' } as Record<BeachKind, string>,
  cityCenter: (km: number) => `City center: ${km} km`,
  mealLabel: 'Meal plan:',
  mealBase: 'base',
  mealNames: {
    BB: 'Bed & Breakfast',
    HB: 'Half Board',
    FB: 'Full Board',
    AI: 'All Inclusive',
    UAI: 'Ultra All Inclusive',
  } as Record<MealCode, string>,
  instantConfirm: 'Instant Confirmation',
  priceBreakdown: (nights: number, hotel: string, flight: string) =>
    `Hotel (${nights}n): ${hotel} + Roundtrip Flight: ${flight}`,
  explore: 'Explore Suite Options & Details',

  // Engine data shown on cards
  badges: {
    'Top Recommended': 'Top Recommended',
    'Highest Rating': 'Highest Rating',
    'Beachfront Sanctuary': 'Beachfront Sanctuary',
    'Best Value Package': 'Best Value Package',
    'Ultra Luxury Retreat': 'Ultra Luxury Retreat',
  } as Record<string, string>,
  amenities: {
    'Private Beach': 'Private Beach',
    'Sandy Beach': 'Sandy Beach',
    'Beachfront (First Line)': 'Beachfront (First Line)',
    'High-speed Wi-Fi': 'High-speed Wi-Fi',
    'Aqua Park': 'Aqua Park',
    'Kids Club': 'Kids Club',
    'All-Inclusive': 'All-Inclusive',
  } as Record<string, string>,
  locations: {} as Record<string, string>,
  guests: (adults: number, children: number): string => {
    if (adults + children === 1) return 'Solo Traveler · 1 Adult'
    if (adults === 2 && children === 0) return 'Couple Escape · 2 Adults'
    if (children > 0) return `Family Package · ${adults} Adults, ${children} ${children > 1 ? 'Children' : 'Child'}`
    return `Group Package · ${adults} Guests`
  },

  // Suites modal
  suitesDialog: (hotel: string) => `${hotel} suites`,
  close: 'Close',
  selectSuite: 'Select your suite',
  suiteIncluded: 'Included',
  suites: {
    superior: { name: 'Superior City View', detail: '32 m² · King bed · City skyline view' },
    deluxe: { name: 'Deluxe Sea View', detail: '38 m² · King bed · Private balcony, sea view' },
    executive: { name: 'Executive Suite', detail: '58 m² · Separate lounge · Club lounge access' },
    royal: { name: 'Royal Panorama Suite', detail: '96 m² · Two bedrooms · Panoramic terrace, butler' },
  } as Record<SuiteId, SuiteCopy>,
  includedAmenities: 'Included amenities',
  standardAmenities: [
    'Free high-speed Wi-Fi',
    'Round-trip airport transfer',
    'Daily housekeeping and turndown',
    'Spa and fitness access',
    '24/7 Voyage AI concierge',
  ] as readonly string[],
  departure: 'Departure',
  reserve: 'Reserve with Concierge',

  // Confirm form
  confirmDialog: 'Confirm reservation with concierge',
  finalStep: 'Final step',
  confirmTitle: 'Confirm Reservation with Concierge',
  hotel: 'Hotel',
  suite: 'Suite',
  flight: 'Flight',
  total: 'Total',
  flightSummary: (from: string, to: string, date: string) => `${from} → ${to}, departure ${date}`,
  phoneLabel: 'Phone / WhatsApp number',
  phoneError: 'Enter a valid phone or WhatsApp number (7 to 15 digits).',
  backToSuites: 'Back to suites',
  sendRequest: 'Send Reservation Request',

  // Success
  successTitle: 'Reservation Request Received',
  successDesc: (phone: string, hotel: string, suite: string) =>
    `A Voyage AI concierge will contact you at ${phone} to finalise your stay at ${hotel} (${suite}).`,
  reference: (ref: string) => `Reference ${ref}`,
  backToPackages: 'Back to packages',

  // Footer
  footerTagline: 'Autonomous Travel Concierge',
  footerBadge: 'MVP PROTOTYPE',
  footerDesc: 'Bespoke itineraries, direct flights and transparent pricing with zero commission markup.',
  footerMvpNote:
    'Voyage AI is currently in active development (MVP stage). Live GDS flight feeds and autonomous reservation pipelines are continuously updated.',
  caseStudy: 'Voyage AI case study',
}

export type VoyageDict = typeof en

const ruPlural = (n: number, one: string, few: string, many: string): string => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

const ru: VoyageDict = {
  langSwitchLabel: 'Язык интерфейса',
  githubLabel: 'GitHub',

  mvpShort: 'MVP',
  mvpLong: 'MVP-ПРОТОТИП · В АКТИВНОЙ РАЗРАБОТКЕ',

  heroEyebrowLead: 'АВТОНОМНЫЙ ПРЕМИУМ-ТРЕВЕЛ · ',
  heroEyebrowTail: 'КОНСЬЕРЖ 24/7',
  heroStageBadge: 'СТАДИЯ MVP · АКТИВНАЯ РАЗРАБОТКА',
  heroTitleBrand: 'Voyage AI.',
  heroTitleLine1: 'Ваш автономный',
  heroTitleLine2: 'тревел-консьерж',
  heroDesc:
    'Персональный подбор туров на базе Google Gemini. Прямые рейсы в обе стороны, проверенные 5★ отели и прозрачные цены в тенге и долларах без скрытых наценок.',
  heroMvpNote: '(Voyage AI находится в активной разработке: это интерактивный MVP-прототип).',
  heroCta: 'Подобрать тур',
  statConcierge: 'АВТОНОМНЫЙ СЕРВИС',
  statResorts: 'ЛУЧШИХ КУРОРТОВ',
  statDestinations: 'ПОПУЛЯРНЫХ НАПРАВЛЕНИЙ',
  statCommission: 'СКРЫТЫХ КОМИССИЙ',

  introEyebrow: 'КОНСЬЕРЖ VOYAGE AI',
  introTitle: 'Куда бы вы хотели отправиться?',
  introDesc:
    'Один текстовый запрос заменяет сложные формы поиска. Voyage AI понимает пожелания, подбирает прямые рейсы и лучшие номера.',

  panelAria: 'Извлечение параметров из текста',
  panelStatus: 'Voyage AI активен · Извлечение параметров в реальном времени',
  panelSub: 'Анализ на естественном языке',
  reset: 'Сбросить',
  welcome:
    'Добро пожаловать в Voyage AI! Я ваш автономный тревел-консьерж. Куда желаете полететь, на сколько ночей и каков ваш бюджет?',
  pendingAria: 'Voyage AI подбирает для вас туры',
  inputAria: 'Опишите поездку',
  placeholder: 'Напр.: Один в Дубай на 7 ночей из Астаны, бюджет $3500',
  send: 'Отправить',
  errorFallback: 'Voyage AI обновляет соединение. Пожалуйста, повторите запрос через несколько секунд.',
  chips: [
    {
      label: 'Перелет в Дубай на двоих, на неделю...',
      query: 'Перелет в Дубай из Астаны, ближайшие даты, на 7 ночей: 2 взрослых, бюджет $5 000',
    },
    {
      label: 'Соло-поездка в Дубай на 5 ночей',
      query: 'Соло-поездка в Дубай из Астаны, ближайшие даты, на 5 ночей: 1 взрослый, бюджет $3 500',
    },
    {
      label: 'Семейный тур в Анталию из Астаны на 7 ночей',
      query: 'Семейный тур в Анталию из Астаны, ближайшие даты, на 7 ночей: 2 взрослых, 1 ребёнок (6 лет), бюджет $4 000',
    },
    {
      label: 'Отдых на Пхукете на 8 ночей',
      query: 'Отдых на Пхукете из Алматы, ближайшие даты, на 8 ночей: 2 взрослых, бюджет 1 800 000 ₸',
    },
  ],

  resultsEyebrow: 'Подборка для вас',
  resultsTitle: (n) => `Топ-${n} персональных пакетов`,
  resultsBadge: (n) => `Топ-${n} персональных туров`,

  affinity: (score) => `Совпадение ${score}%`,
  flightIncluded: 'Рейс включен в стоимость пакета',
  directFlight: 'Прямой рейс',
  nonStop: 'без пересадок',
  baggage: 'Багаж: 23 кг + 8 кг',
  duration: (h, m) => `${h} ч ${m} мин`,
  flexDates: 'Соседние даты вылета:',
  selected: 'Выбрано',
  beachLabel: 'Пляж',
  beach: { beachfront: '1-я линия', private: 'собственный пляж' },
  cityCenter: (km) => `До центра: ${km} км`,
  mealLabel: 'Питание:',
  mealBase: 'база',
  mealNames: {
    BB: 'Только завтрак',
    HB: 'Завтрак + ужин',
    FB: 'Полный пансион',
    AI: 'Всё включено',
    UAI: 'Ультра всё включено',
  },
  instantConfirm: 'Мгновенное подтверждение',
  priceBreakdown: (nights, hotel, flight) =>
    `Отель (${nights} ${ruPlural(nights, 'ночь', 'ночи', 'ночей')}): ${hotel} + Перелет туда и обратно: ${flight}`,
  explore: 'Выбрать номер и детали',

  badges: {
    'Top Recommended': 'Лучший выбор',
    'Highest Rating': 'Высокий рейтинг',
    'Beachfront Sanctuary': 'Первая линия у моря',
    'Best Value Package': 'Лучшая цена за пакет',
    'Ultra Luxury Retreat': 'Премиальный отдых',
  },
  amenities: {
    'Private Beach': 'Собственный пляж',
    'Sandy Beach': 'Песчаный пляж',
    'Beachfront (First Line)': 'Первая линия',
    'High-speed Wi-Fi': 'Скоростной Wi-Fi',
    'Aqua Park': 'Аквапарк',
    'Kids Club': 'Детский клуб',
    'All-Inclusive': 'Всё включено',
  },
  locations: {
    'Egypt, Sharm El Sheikh': 'Египет, Шарм-эль-Шейх',
    'Georgia, Batumi & Black Sea': 'Грузия, Батуми и Черное море',
    'Indonesia, Bali': 'Индонезия, Бали',
    'Maldives, North Malé Atoll': 'Мальдивы, атолл Северный Мале',
    'Spain, Barcelona Coast': 'Испания, побережье Барселоны',
    'Sri Lanka, Bentota & Galle': 'Шри-Ланка, Бентота и Галле',
    'Thailand, Phuket': 'Таиланд, Пхукет',
    'Turkey, Antalya / Belek': 'Турция, Анталья / Белек',
    'UAE, Dubai': 'ОАЭ, Дубай',
    'Vietnam, Da Nang': 'Вьетнам, Дананг',
  },
  guests: (adults, children) => {
    if (adults + children === 1) return 'Соло-путешествие · 1 взрослый'
    if (adults === 2 && children === 0) return 'Для двоих · 2 взрослых'
    const grown = `${adults} ${ruPlural(adults, 'взрослый', 'взрослых', 'взрослых')}`
    if (children > 0) return `Семейный тур · ${grown}, ${children} ${ruPlural(children, 'ребенок', 'ребенка', 'детей')}`
    return `Групповой тур · ${adults} ${ruPlural(adults, 'гость', 'гостя', 'гостей')}`
  },

  suitesDialog: (hotel) => `Номера в ${hotel}`,
  close: 'Закрыть',
  selectSuite: 'Выберите номер',
  suiteIncluded: 'Включено',
  suites: {
    superior: { name: 'Улучшенный номер с видом на город', detail: '32 м² · Кровать king size · Вид на город' },
    deluxe: { name: 'Делюкс с видом на море', detail: '38 м² · Кровать king size · Балкон с видом на море' },
    executive: { name: 'Представительский люкс', detail: '58 м² · Отдельная гостиная · Доступ в клубный лаунж' },
    royal: { name: 'Королевский панорамный люкс', detail: '96 м² · Две спальни · Панорамная терраса, дворецкий' },
  },
  includedAmenities: 'Включено в стоимость',
  standardAmenities: [
    'Бесплатный скоростной Wi-Fi',
    'Трансфер из аэропорта и обратно',
    'Ежедневная уборка и вечерний сервис',
    'Доступ в спа и фитнес-зал',
    'Консьерж Voyage AI 24/7',
  ],
  departure: 'Вылет',
  reserve: 'Забронировать тур',

  confirmDialog: 'Подтверждение бронирования с консьержем',
  finalStep: 'Последний шаг',
  confirmTitle: 'Подтверждение бронирования',
  hotel: 'Отель',
  suite: 'Номер',
  flight: 'Перелет',
  total: 'Итого',
  flightSummary: (from, to, date) => `${from} → ${to}, вылет ${date}`,
  phoneLabel: 'WhatsApp / Номер телефона',
  phoneError: 'Введите корректный номер телефона или WhatsApp (от 7 до 15 цифр).',
  backToSuites: 'Назад к номерам',
  sendRequest: 'Подтвердить бронирование',

  successTitle: 'Заявка на бронирование принята',
  successDesc: (phone, hotel, suite) =>
    `Консьерж Voyage AI свяжется с вами по номеру ${phone}, чтобы подтвердить проживание в ${hotel} (${suite}).`,
  reference: (ref) => `Номер заявки ${ref}`,
  backToPackages: 'Назад к турам',

  footerTagline: 'Автономный тревел-консьерж',
  footerBadge: 'MVP-ПРОТОТИП',
  footerDesc: 'Персональные маршруты, прямые рейсы и прозрачные цены без скрытых комиссий.',
  footerMvpNote:
    'Voyage AI находится в активной разработке (стадия MVP). Данные о рейсах GDS и автономное бронирование постоянно обновляются.',
  caseStudy: 'Кейс Voyage AI',
}

export const DICTIONARY: Record<Lang, VoyageDict> = { en, ru }

/**
 * Shows an engine badge in the current language. The engine answers in the language of the request,
 * so a badge may arrive in either language; both are mapped back to the same key.
 */
export function localizeBadge(raw: string, lang: Lang): string {
  const key = Object.keys(en.badges).find((k) => k === raw || ru.badges[k] === raw)
  return key ? DICTIONARY[lang].badges[key] ?? raw : raw
}
