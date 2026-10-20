import { ImageResponse } from 'next/og'

/** Share card for every page that does not define its own: 1200x630, rendered at build time. */
export const alt = 'Amir Nagiyev, AI and ML developer from Astana'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#0a0a0a',
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          color: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 84,
              height: 84,
              border: '4px solid #a3e635',
              borderRadius: 18,
              color: '#a3e635',
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            AN
          </div>
          <div style={{ fontSize: 30, color: '#a3a3a3' }}>a-nagiyev.dev</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>Amir Nagiyev</div>
          <div style={{ fontSize: 40, color: '#d4d4d4' }}>AI &amp; ML Developer · Astana, Kazakhstan</div>
          <div style={{ width: 120, height: 6, background: '#a3e635', marginTop: 8 }} />
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 28, color: '#a3a3a3' }}>
          <span>Founder of QADAM</span>
          <span style={{ color: '#525252' }}>·</span>
          <span>Voyage AI</span>
          <span style={{ color: '#525252' }}>·</span>
          <span>PyTorch, Go, TypeScript</span>
        </div>
      </div>
    ),
    size,
  )
}
