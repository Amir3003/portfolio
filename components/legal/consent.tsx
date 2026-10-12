'use client'

import { Analytics } from '@vercel/analytics/next'
import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  setConsent,
  subscribeConsent,
  type ConsentState,
} from '@/lib/consent'

function useConsent(): ConsentState {
  return useSyncExternalStore(subscribeConsent, getConsentSnapshot, getConsentServerSnapshot)
}

/** Loads analytics only after an explicit opt-in, and only in production builds. */
export function AnalyticsGate() {
  const consent = useConsent()
  if (process.env.NODE_ENV !== 'production' || consent !== 'granted') return null
  return <Analytics />
}

/** Equal-weight Accept and Decline. Dismissing without a choice keeps analytics off. */
export function ConsentBanner() {
  const consent = useConsent()
  if (consent !== 'unset') return null

  return (
    <section
      aria-label="Analytics consent"
      className="fixed inset-x-3 bottom-3 z-[60] max-w-md border border-neutral-700 bg-neutral-950 p-4 sm:left-4 sm:right-auto"
    >
      <p className="text-sm leading-relaxed text-neutral-300">
        This site sets no cookies. With your permission it uses privacy-focused analytics to count visits. Nothing is
        used for advertising.{' '}
        <Link href="/privacy" className="text-neutral-100 underline underline-offset-4">
          Privacy Policy
        </Link>
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setConsent('denied')}
          className="flex-1 border border-neutral-600 px-3 py-2 text-sm text-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => setConsent('granted')}
          className="flex-1 border border-neutral-600 px-3 py-2 text-sm text-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
        >
          Accept analytics
        </button>
      </div>
    </section>
  )
}

/** Footer control that reopens the banner so consent can be changed or withdrawn at any time. */
export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => setConsent(null)}
      className="underline underline-offset-4 hover:text-neutral-200 focus-visible:outline-2 focus-visible:outline-lime-400"
    >
      Cookie settings
    </button>
  )
}
