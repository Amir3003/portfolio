import type { CSSProperties } from 'react'

/** Boarding pass palette, shared by the sections around the 3D story. */
export const TICKET = {
  ink: '#0C2633',
  paper: '#F6F4EE',
  sky: '#00AFCA',
  /** Sky blue darkened for small text on paper (contrast above 4.5:1). */
  skyInk: '#006A7A',
  sun: '#FEC50C',
} as const

/** TikTok Sans (variable, wdth 75 to 150) when the layout provides it, the UI font otherwise. */
export const DISPLAY_FAMILY = "var(--font-tiktok, 'TikTok Sans'), var(--font-ui), ui-sans-serif, system-ui, sans-serif"

/** Huge, wide, heavy words: TikTok Sans 900 at 150% width with tight tracking. */
export const giantWord: CSSProperties = {
  fontFamily: DISPLAY_FAMILY,
  fontWeight: 900,
  fontStretch: '150%',
  letterSpacing: '-0.04em',
  lineHeight: 0.86,
}

/** Body and label type of the ticket world. */
export const ticketText: CSSProperties = { fontFamily: DISPLAY_FAMILY }

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  tone = 'night',
}: {
  id: string
  /** Small spaced capitals above the title, like a field label on the boarding pass. */
  eyebrow?: string
  title: string
  description?: string
  /** `night` for paper text on the dark sky, `paper` for ink text on a light surface. */
  tone?: 'night' | 'paper'
}) {
  const night = tone === 'night'
  return (
    <div className="mb-12 flex flex-col gap-4" style={ticketText}>
      {eyebrow ? (
        <p
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: night ? TICKET.sky : TICKET.skyInk }}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className="text-balance text-[clamp(2.5rem,7vw,5.5rem)]"
        style={{ ...giantWord, lineHeight: 0.92, letterSpacing: '-0.035em', fontStretch: '125%', color: night ? TICKET.paper : TICKET.ink }}
      >
        {title}
      </h2>
      {description ? (
        <p
          className="max-w-[44ch] text-pretty text-lg leading-relaxed"
          style={{ color: night ? 'rgba(246,244,238,0.78)' : 'rgba(12,38,51,0.78)' }}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
