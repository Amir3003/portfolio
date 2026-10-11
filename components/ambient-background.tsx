export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_15%_0%,var(--color-lime-950),transparent_70%),radial-gradient(ellipse_60%_50%_at_100%_40%,color-mix(in_oklch,var(--color-red-950)_50%,transparent),transparent_70%),radial-gradient(ellipse_70%_50%_at_30%_100%,color-mix(in_oklch,var(--color-lime-950)_60%,transparent),transparent_70%)]" />
      <div className="animate-drift-slow absolute right-[8%] top-[18%] size-72 rounded-full bg-red-600/10 blur-3xl" />
      <div className="animate-drift absolute bottom-[12%] left-[4%] size-56 rounded-full bg-red-700/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
      <div className="bg-grid absolute inset-0" />
    </div>
  )
}
