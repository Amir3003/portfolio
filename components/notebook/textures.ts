import { CanvasTexture, SRGBColorSpace } from 'three'

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
const LIME = '#a3e635'
const RED = '#f87171'

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  return [canvas, ctx]
}

function toTexture(canvas: HTMLCanvasElement, maxAnisotropy: number): CanvasTexture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = Math.min(4, maxAnisotropy)
  texture.needsUpdate = true
  return texture
}

function dotGrid(ctx: CanvasRenderingContext2D, w: number, h: number, step: number, color: string) {
  ctx.fillStyle = color
  for (let y = step; y < h; y += step) for (let x = step; x < w; x += step) ctx.fillRect(x, y, 2, 2)
}

/** Front cover: minimalist monogram + name plate. 1024 × 1424 (≈ the cover's aspect ratio). */
export function createCoverTexture(maxAnisotropy: number): CanvasTexture {
  const [c, ctx] = makeCanvas(1024, 1424)
  ctx.fillStyle = '#0b0b0b'
  ctx.fillRect(0, 0, c.width, c.height)
  dotGrid(ctx, c.width, c.height, 48, 'rgba(255,255,255,0.05)')

  ctx.strokeStyle = 'rgba(163,230,53,0.55)'
  ctx.lineWidth = 3
  ctx.strokeRect(56, 56, c.width - 112, c.height - 112)

  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `500 30px ${MONO}`
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('NOTEBOOK / 01', 104, 128)
  ctx.textAlign = 'right'
  ctx.fillStyle = RED
  ctx.fillText('● REC', c.width - 104, 128)
  ctx.textAlign = 'left'

  // Monogram
  ctx.fillStyle = '#f5f5f5'
  ctx.font = `600 340px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('AN', c.width / 2, 700)
  ctx.fillStyle = LIME
  ctx.fillRect(c.width / 2 - 90, 748, 180, 8)

  ctx.fillStyle = '#e5e5e5'
  ctx.font = `600 54px ${SANS}`
  ctx.fillText('AMIR NAGIYEV', c.width / 2, 1130)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = `500 30px ${MONO}`
  ctx.fillText('AI & ML  ·  SYSTEMS ARCHITECT', c.width / 2, 1186)
  ctx.fillText('ASTANA, KZ', c.width / 2, 1236)

  return toTexture(c, maxAnisotropy)
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, sub: string, accent: string) {
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.strokeStyle = accent
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 18)
  ctx.fill()
  ctx.stroke()
  ctx.textAlign = 'left'
  ctx.fillStyle = '#f5f5f5'
  ctx.font = `600 38px ${SANS}`
  ctx.fillText(label, x + 28, y + 56)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = `500 26px ${MONO}`
  ctx.fillText(sub, x + 28, y + 98)
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number, color: string) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(x, y1)
  ctx.lineTo(x, y2 - 12)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x - 12, y2 - 14)
  ctx.lineTo(x + 12, y2 - 14)
  ctx.lineTo(x, y2)
  ctx.closePath()
  ctx.fill()
}

/** Back cover: Voyage AI system-architecture blueprint. */
export function createArchitectureTexture(maxAnisotropy: number): CanvasTexture {
  const [c, ctx] = makeCanvas(1024, 1424)
  ctx.fillStyle = '#0a0f0a'
  ctx.fillRect(0, 0, c.width, c.height)
  dotGrid(ctx, c.width, c.height, 32, 'rgba(163,230,53,0.12)')

  ctx.textAlign = 'left'
  ctx.fillStyle = LIME
  ctx.font = `600 30px ${MONO}`
  ctx.fillText('SYSTEM ARCHITECTURE', 72, 110)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `500 26px ${MONO}`
  ctx.fillText('voyage-ai / request path', 72, 152)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(72, 180)
  ctx.lineTo(c.width - 72, 180)
  ctx.stroke()

  const x = 112
  const w = c.width - 224
  const h = 138
  const rows: [string, string, string][] = [
    ['Client', 'Next.js dashboard · slots', LIME],
    ['Agent', 'slot extraction · budget check', LIME],
    ['Catalog', '50 properties · hard filters', RED],
    ['Flights', 'async GDS quotes per destination', RED],
    ['Curate', 'rank · top five · badges', LIME],
  ]
  rows.forEach(([label, sub, accent], i) => {
    const y = 236 + i * 216
    box(ctx, x, y, w, h, label, sub, accent)
    if (i < rows.length - 1) arrow(ctx, c.width / 2, y + h, y + 216, 'rgba(255,255,255,0.4)')
  })

  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `500 26px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('FastAPI · Pydantic v2 · SQLite WAL', c.width / 2, 1350)

  return toTexture(c, maxAnisotropy)
}

/** Inside pages: dark dot-grid paper with a faint margin line. */
export function createPageTexture(maxAnisotropy: number, side: 'left' | 'right'): CanvasTexture {
  const [c, ctx] = makeCanvas(1024, 1424)
  ctx.fillStyle = '#101010'
  ctx.fillRect(0, 0, c.width, c.height)
  dotGrid(ctx, c.width, c.height, 40, 'rgba(255,255,255,0.09)')
  const marginX = side === 'left' ? c.width - 96 : 96
  ctx.strokeStyle = 'rgba(248,113,113,0.35)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(marginX, 0)
  ctx.lineTo(marginX, c.height)
  ctx.stroke()
  return toTexture(c, maxAnisotropy)
}

