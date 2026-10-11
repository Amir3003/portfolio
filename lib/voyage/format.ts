/** Display helpers shared by the engine and the UI (no heavy imports; safe for client bundles). */

export function formatKzt(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} ₸`
}

export function formatUsd(valueKzt: number, rate = 500): string {
  return `$${Math.round(valueKzt / rate).toLocaleString('en-US')}`
}

