import { CanvasTexture, SRGBColorSpace } from 'three'

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const SANS = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const LIME = '#a3e635'
const CYAN = '#2dd4bf'
const AMBER = '#fbbf24'
const MUTED = 'rgba(255, 255, 255, 0.45)'

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

/**
 * Procedural laptop lid texture: Sleek dark matte aluminum with minimalist AN laser engraving
 * and profile identification: "17-year-old AI & ML Engineer Amir Nagiyev".
 */
export function createLidTexture(maxAnisotropy: number): CanvasTexture {
  const [c, ctx] = makeCanvas(1400, 920)

  // Dark matte metallic finish
  ctx.fillStyle = '#0d0d10'
  ctx.fillRect(0, 0, c.width, c.height)

  // Perimeter guide line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
  ctx.lineWidth = 2
  ctx.strokeRect(36, 36, c.width - 72, c.height - 72)

  // Minimalist center emblem
  const cx = c.width / 2
  const cy = c.height / 2 - 40

  ctx.fillStyle = '#f5f5f5'
  ctx.font = `700 120px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('AN', cx, cy)

  // Accent line under emblem
  ctx.fillStyle = LIME
  ctx.fillRect(cx - 32, cy + 68, 64, 4)

  // Clean Profile Headline on Outer Lid
  ctx.fillStyle = '#ffffff'
  ctx.font = `600 32px ${SANS}`
  ctx.fillText('17-year-old AI & ML Engineer Amir Nagiyev', cx, cy + 120)

  // Bottom engineering stamp
  ctx.fillStyle = MUTED
  ctx.font = `500 18px ${MONO}`
  ctx.fillText('ASTANA ARCHITECTURE NODE // NEURAL SYSTEMS RUNTIME', cx, c.height - 84)

  ctx.fillStyle = 'rgba(163, 230, 53, 0.7)'
  ctx.font = `600 15px ${MONO}`
  ctx.fillText('MODEL 01 · TENSOR CORES & ZERO-ALLOC PIPELINES', cx, c.height - 54)

  return toTexture(c, maxAnisotropy)
}

/**
 * Bottom chassis deck texture: Realistic ventilation grates, Torx screw markings,
 * rubber foot alignments, and laser-engraved regulatory hardware specifications.
 */
export function createBottomChassisTexture(maxAnisotropy: number): CanvasTexture {
  const [c, ctx] = makeCanvas(1400, 920)

  // Dark anodized bottom plate finish
  ctx.fillStyle = '#0b0b0e'
  ctx.fillRect(0, 0, c.width, c.height)

  // Outer bevel line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, c.width - 60, c.height - 60)

  // Torx screws around perimeter (8 points)
  const screwCoords = [
    [50, 50],
    [c.width / 2, 45],
    [c.width - 50, 50],
    [50, c.height / 2],
    [c.width - 50, c.height / 2],
    [50, c.height - 50],
    [c.width / 2, c.height - 45],
    [c.width - 50, c.height - 50],
  ]

  ctx.fillStyle = '#1e1e24'
  ctx.strokeStyle = '#272730'
  ctx.lineWidth = 1.5
  screwCoords.forEach(([sx, sy]) => {
    ctx.beginPath()
    ctx.arc(sx, sy, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  // Horizontal ventilation intake cooling grilles (dual-band array across upper chassis)
  const ventTop = 130
  const ventW = c.width - 240
  const ventStartX = 120
  const slotCount = 52
  const slotSpacing = ventW / slotCount
  const slotWidth = slotSpacing * 0.55

  // Band 1
  for (let i = 0; i < slotCount; i++) {
    const vx = ventStartX + i * slotSpacing
    ctx.fillStyle = '#040406'
    ctx.beginPath()
    ctx.roundRect(vx, ventTop, slotWidth, 34, 4)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Band 2
  for (let i = 0; i < slotCount; i++) {
    const vx = ventStartX + i * slotSpacing
    ctx.fillStyle = '#040406'
    ctx.beginPath()
    ctx.roundRect(vx, ventTop + 44, slotWidth, 34, 4)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Exhaust vent slits near rear hinge
  const exhaustTop = 70
  for (let i = 0; i < slotCount; i += 2) {
    const vx = ventStartX + i * slotSpacing
    ctx.fillStyle = '#060608'
    ctx.beginPath()
    ctx.roundRect(vx, exhaustTop, slotWidth * 1.5, 14, 2)
    ctx.fill()
  }

  // Center Laser-Engraved Engineering & Regulatory Block
  const blockX = c.width / 2
  const blockY = 360

  ctx.textAlign = 'center'
  ctx.fillStyle = '#e4e4e7'
  ctx.font = `600 24px ${MONO}`
  ctx.fillText('MODEL 01 · TENSOR CORE NODE · ASTANA', blockX, blockY)

  ctx.fillStyle = MUTED
  ctx.font = `500 15px ${MONO}`
  ctx.fillText('SYSTEM ARCHITECTURE: PYTORCH / GO RUNTIME / SQLITE WAL CONCURRENCY', blockX, blockY + 36)
  ctx.fillText('SERIAL NO: AN-2026-ASTANA-AI-NODE-01  |  RATED 20V === 6.5A 130W', blockX, blockY + 66)
  ctx.fillText('DESIGNED BY AMIR NAGIYEV IN ASTANA, KAZAKHSTAN', blockX, blockY + 96)

  // Technical glyphs & regulatory boxes
  const badges = ['CE', 'FCC', 'ROHS', 'AI/ML-99', 'ARM64']
  const totalBadgesWidth = badges.length * 90
  const badgeStartX = (c.width - totalBadgesWidth) / 2

  badges.forEach((b, idx) => {
    const bx = badgeStartX + idx * 90
    const by = blockY + 130
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.strokeRect(bx, by, 76, 26)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = `600 12px ${MONO}`
    ctx.fillText(b, bx + 38, by + 18)
  })

  // Lower chassis ventilation & rubber foot guidelines
  ctx.fillStyle = 'rgba(163, 230, 53, 0.5)'
  ctx.font = `500 14px ${MONO}`
  ctx.fillText('THERMAL REGIME: PASSIVE DUAL HEATPIPE + LOW-NOISE TURBINE', blockX, c.height - 110)

  return toTexture(c, maxAnisotropy)
}

/**
 * Keyboard deck texture: Precision dark chiclet keys, trackpad, and speaker grilles.
 */
export function createKeyboardDeckTexture(maxAnisotropy: number): CanvasTexture {
  const [c, ctx] = makeCanvas(1400, 900)

  // Deck surface
  ctx.fillStyle = '#111114'
  ctx.fillRect(0, 0, c.width, c.height)

  // Keyboard recess area
  const kbX = 140
  const kbY = 70
  const kbW = c.width - 280
  const kbH = 460

  ctx.fillStyle = '#09090b'
  ctx.beginPath()
  ctx.roundRect(kbX, kbY, kbW, kbH, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.lineWidth = 2
  ctx.stroke()

  // 5 rows of chiclet keys
  const rows = 5
  const keyGap = 8
  const rowHeight = (kbH - (rows + 1) * keyGap) / rows

  for (let r = 0; r < rows; r++) {
    const y = kbY + keyGap + r * (rowHeight + keyGap)
    const cols = r === 4 ? 8 : 14
    const keyWidth = (kbW - (cols + 1) * keyGap) / cols

    for (let col = 0; col < cols; col++) {
      let kw = keyWidth
      let kx = kbX + keyGap + col * (keyWidth + keyGap)

      // Spacebar on last row
      if (r === 4 && col === 3) {
        kw = keyWidth * 3.5 + keyGap * 2.5
      } else if (r === 4 && col > 3 && col < 6) {
        continue
      }

      ctx.fillStyle = '#18181b'
      ctx.beginPath()
      ctx.roundRect(kx, y, kw, rowHeight, 6)
      ctx.fill()

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  // Large precision glass trackpad
  const tpW = 340
  const tpH = 240
  const tpX = (c.width - tpW) / 2
  const tpY = kbY + kbH + 50

  ctx.fillStyle = '#0c0c0e'
  ctx.beginPath()
  ctx.roundRect(tpX, tpY, tpW, tpH, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Speaker grilles on left & right of keyboard
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  for (let x = 60; x < kbX - 25; x += 10) {
    for (let y = kbY + 30; y < kbY + kbH - 30; y += 12) {
      ctx.fillRect(x, y, 3, 3)
      ctx.fillRect(c.width - x - 3, y, 3, 3)
    }
  }

  return toTexture(c, maxAnisotropy)
}

/**
 * Screen texture for the 3D model displaying Voyage AI's authentic cyan/navy design system
 * before the interactive DOM screen layers over it.
 */
export function createDefaultScreenTexture(maxAnisotropy: number): CanvasTexture {
  const [c, ctx] = makeCanvas(1600, 1000)

  // Authentic Voyage AI deep navy background
  ctx.fillStyle = '#070d18'
  ctx.fillRect(0, 0, c.width, c.height)

  // Subtle navy grid background
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.05)'
  ctx.lineWidth = 1
  for (let x = 0; x < c.width; x += 50) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, c.height)
    ctx.stroke()
  }
  for (let y = 0; y < c.height; y += 50) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(c.width, y)
    ctx.stroke()
  }

  // Top Status Bar in authentic Voyage AI theme
  ctx.fillStyle = '#0b1528'
  ctx.fillRect(0, 0, c.width, 46)

  // Cyan status dot
  ctx.fillStyle = CYAN
  ctx.beginPath()
  ctx.arc(36, 23, 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#f8fafc'
  ctx.font = `600 16px ${MONO}`
  ctx.textAlign = 'left'
  ctx.fillText('VOYAGE AI // AUTONOMOUS TRAVEL CONCIERGE', 54, 29)

  ctx.fillStyle = MUTED
  ctx.textAlign = 'right'
  ctx.fillText('ONLINE · DIRECT GDS FLIGHTS · 5★ RESORTS', c.width - 36, 29)

  // Center Window Graphic in authentic glassmorphism style
  const wx = 100
  const wy = 86
  const ww = c.width - 200
  const wh = c.height - 150

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.beginPath()
  ctx.roundRect(wx, wy, ww, wh, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(94, 234, 212, 0.22)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#f8fafc'
  ctx.font = `700 46px ${SANS}`
  ctx.fillText('Voyage AI Concierge Engine', wx + 54, wy + 90)

  ctx.fillStyle = CYAN
  ctx.font = `500 20px ${MONO}`
  ctx.fillText('Bespoke itinerary curation & real-time slot inference', wx + 54, wy + 130)

  // Authentic spec stats in cyan & amber
  const statBoxY = wy + 185
  const statBoxW = (ww - 160) / 3
  const stats = [
    { label: 'DESTINATIONS', val: '10 Global Hubs', color: CYAN },
    { label: 'CURATED RESORTS', val: '50 Elite 5★ Suites', color: AMBER },
    { label: 'COMMISSION MARKUP', val: '0% Transparent Pricing', color: '#34d399' },
  ]

  stats.forEach((s, idx) => {
    const bx = wx + 54 + idx * (statBoxW + 26)
    ctx.fillStyle = 'rgba(17, 28, 48, 0.9)'
    ctx.beginPath()
    ctx.roundRect(bx, statBoxY, statBoxW, 115, 12)
    ctx.fill()
    ctx.strokeStyle = 'rgba(94, 234, 212, 0.15)'
    ctx.stroke()

    ctx.fillStyle = MUTED
    ctx.font = `600 13px ${MONO}`
    ctx.fillText(s.label, bx + 22, statBoxY + 40)

    ctx.fillStyle = s.color
    ctx.font = `600 20px ${SANS}`
    ctx.fillText(s.val, bx + 22, statBoxY + 80)
  })

  return toTexture(c, maxAnisotropy)
}
