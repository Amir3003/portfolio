/**
 * Page background: the base colour plus a faint grid and three slow-drifting, heavily blurred
 * glows in dark teal, deep green and slate. Low opacity so text contrast is unaffected; the
 * drift is a few percent over 30 to 40 seconds, so the page "breathes" without distracting.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="ambient-blob ambient-blob-a" />
      <div className="ambient-blob ambient-blob-b" />
      <div className="ambient-blob ambient-blob-c" />
      <div className="bg-grid absolute inset-0" />
    </div>
  )
}
