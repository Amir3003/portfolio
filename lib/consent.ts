/**
 * Cookie / analytics consent. Stored in localStorage (not a cookie) under one key. The site
 * itself sets no cookies; the only optional processing is Vercel Web Analytics, which is
 * loaded only after the visitor accepts.
 */
export type ConsentChoice = 'granted' | 'denied'
export type ConsentState = ConsentChoice | 'unset' | 'pending'

const KEY = 'consent.analytics.v1'
const EVENT = 'consent:change'

function read(): ConsentState {
  try {
    const value = window.localStorage.getItem(KEY)
    return value === 'granted' || value === 'denied' ? value : 'unset'
  } catch {
    return 'unset'
  }
}

export function subscribeConsent(listener: () => void): () => void {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export const getConsentSnapshot = (): ConsentState => read()
/** Server and hydration render: unknown yet, so nothing consent-dependent is shown. */
export const getConsentServerSnapshot = (): ConsentState => 'pending'

export function setConsent(choice: ConsentChoice | null): void {
  try {
    if (choice === null) window.localStorage.removeItem(KEY)
    else window.localStorage.setItem(KEY, choice)
  } catch {
    /* storage unavailable: the choice simply is not remembered */
  }
  window.dispatchEvent(new Event(EVENT))
}
