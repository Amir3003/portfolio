/** Display helpers shared by the engine and the UI (no heavy imports; safe for client bundles). */

import type { Lang } from '@/lib/voyage/types'

/** Groups thousands: `1,500,000` in English, `1 500 000` (non-breaking spaces) in Russian. */
export function formatNumber(value: number, lang: Lang = 'en'): string {
  const grouped = Math.round(value).toLocaleString('en-US')
  return lang === 'ru' ? grouped.replace(/,/g, '\u00a0') : grouped
}

export function formatKzt(value: number, lang: Lang = 'en'): string {
  return `${formatNumber(value, lang)} ₸`
}

export function formatUsd(valueKzt: number, rate = 500): string {
  return `$${Math.round(valueKzt / rate).toLocaleString('en-US')}`
}

