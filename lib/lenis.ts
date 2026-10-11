import type Lenis from 'lenis'

type ScrollListener = () => void

let instance: Lenis | null = null
const listeners = new Set<ScrollListener>()

export function setLenis(lenis: Lenis | null) {
  instance = lenis
}

export function getLenis() {
  return instance
}

/**
 * Subscribes to scroll updates. Fires from Lenis' own `scroll` event while smooth scrolling is
 * active, and from native `scroll` events when Lenis is disabled (e.g. `prefers-reduced-motion`),
 * so consumers get one stream regardless of mode.
 */
export function subscribeScroll(listener: ScrollListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitScroll() {
  listeners.forEach((listener) => listener())
}
