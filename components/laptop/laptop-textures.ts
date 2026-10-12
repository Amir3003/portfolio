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
 * Display texture: the default Voyage AI view (header, concierge chat on the left, top GDS
 * package on the right), drawn with the same palette and layout as the DOM dashboard that
 * expands from the laptop display, so the hand-off between the two is seamless.
 */
export function createDefaultScreenTexture(maxAnisotropy: number): CanvasTexture {
  const [c, ctx] = makeCanvas(1600, 1000)
  const W = c.width
  const H = c.height

  const panel = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string) => {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
    ctx.strokeStyle = stroke
    ctx.lineWidth = 2
    ctx.stroke()
  }
  const text = (
    s: string,
    x: number,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = 'left',
  ) => {
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(s, x, y)
  }

  const BORDER = 'rgba(94, 234, 212, 0.18)'
  const CARD = 'rgba(17, 28, 48, 0.92)'

  // Window
  ctx.fillStyle = '#070d18'
  ctx.fillRect(0, 0, W, H)

  // Header bar
  ctx.fillStyle = '#0b1528'
  ctx.fillRect(0, 0, W, 74)
  ctx.strokeStyle = BORDER
  ctx.beginPath()
  ctx.moveTo(0, 74)
  ctx.lineTo(W, 74)
  ctx.stroke()
  ctx.fillStyle = CYAN
  ctx.beginPath()
  ctx.arc(44, 37, 8, 0, Math.PI * 2)
  ctx.fill()
  text('Voyage', 70, 47, `600 28px ${SANS}`, '#ffffff')
  text('AI', 70 + ctx.measureText('Voyage').width + 2, 47, `700 28px ${SANS}`, CYAN)
  text('//  Autonomous Travel Concierge', 186, 46, `400 20px ${SANS}`, '#94a3b8')
  text('LIVE ENGINE · 24/7', W - 190, 44, `500 16px ${MONO}`, '#5eead4', 'right')
  panel(W - 150, 20, 118, 36, 8, 'rgba(30, 41, 59, 0.8)', 'rgba(100, 116, 139, 0.5)')
  text('GitHub', W - 91, 45, `500 18px ${SANS}`, '#e2e8f0', 'center')

  // Left column: concierge chat
  const lw = Math.round(W * 0.44)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)'
  ctx.fillRect(0, 75, lw, H - 75)
  ctx.strokeStyle = BORDER
  ctx.beginPath()
  ctx.moveTo(lw, 75)
  ctx.lineTo(lw, H)
  ctx.stroke()

  text('NATURAL LANGUAGE EXTRACTION', 36, 124, `500 17px ${MONO}`, CYAN)

  panel(36, 146, lw - 72, 150, 16, CARD, BORDER)
  ctx.fillStyle = CYAN
  ctx.beginPath()
  ctx.arc(66, 182, 7, 0, Math.PI * 2)
  ctx.fill()
  text('Voyage AI Assistant', 84, 188, `600 20px ${SANS}`, '#5eead4')
  const welcome = [
    'Welcome to Voyage AI! I am your autonomous travel',
    'concierge. Where would you like to travel, for how many',
    'nights, and what is your budget and party size?',
  ]
  welcome.forEach((line, i) => text(line, 58, 226 + i * 28, `400 19px ${SANS}`, '#e2e8f0'))

  // Input
  panel(36, 320, lw - 72, 60, 14, 'rgba(11, 21, 40, 0.95)', 'rgba(94, 234, 212, 0.26)')
  text('e.g. Solo luxury escape to Dubai, 5 nights, $2,500...', 58, 358, `400 18px ${SANS}`, '#64748b')
  panel(lw - 36 - 54, 326, 46, 48, 10, CYAN, CYAN)

  text('DEMO QUICK-LAUNCH INTENTS', 36, 428, `500 15px ${MONO}`, '#94a3b8')
  const chips = [
    'Solo trip to Dubai from Astana, 5 nights, $2,500',
    'Family holiday in Antalya from Astana, 7 nights, $2,800',
    'Phuket vacation from Almaty, 8 nights, $2,200',
  ]
  chips.forEach((chip, i) => {
    const y = 446 + i * 60
    panel(36, y, lw - 72, 48, 10, 'rgba(17, 28, 48, 0.7)', 'rgba(94, 234, 212, 0.14)')
    text(chip, 54, y + 31, `400 18px ${SANS}`, '#cbd5e1')
    text('›', lw - 62, y + 32, `500 24px ${SANS}`, CYAN, 'center')
  })

  // Right column: bespoke selection
  const rx = lw + 36
  const rw = W - rx - 36
  text('BESPOKE SELECTION', rx, 124, `500 16px ${MONO}`, AMBER)
  text('Top Tailored Packages (3)', rx, 156, `600 24px ${SANS}`, '#ffffff')
  text('DIRECT FLIGHTS + 5★ SUITES', rx + rw, 156, `400 15px ${MONO}`, 'rgba(45, 212, 191, 0.8)', 'right')

  const cardTop = 182
  panel(rx, cardTop, rw, 330, 16, CARD, BORDER)
  text('#01', rx + 24, cardTop + 40, `500 18px ${MONO}`, '#94a3b8')
  panel(rx + 76, cardTop + 18, 190, 32, 16, 'rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.35)')
  text('TOP RECOMMENDED', rx + 171, cardTop + 40, `500 14px ${MONO}`, AMBER, 'center')
  panel(rx + rw - 150, cardTop + 16, 126, 36, 8, 'rgba(45, 212, 191, 0.12)', 'rgba(94, 234, 212, 0.28)')
  text('98% Match', rx + rw - 87, cardTop + 41, `500 17px ${MONO}`, '#5eead4', 'center')

  text('Rixos Premium Belek', rx + 24, cardTop + 98, `600 30px ${SANS}`, '#ffffff')
  text('Antalya / Belek', rx + rw - 24, cardTop + 96, `400 18px ${MONO}`, '#cbd5e1', 'right')
  text('★ 4.9', rx + 24, cardTop + 138, `600 19px ${SANS}`, '#fbbf24')
  text('(1420)   ·   5★ Luxury   ·   AI - All Inclusive', rx + 92, cardTop + 138, `400 18px ${MONO}`, '#cbd5e1')

  panel(rx + 24, cardTop + 160, rw - 48, 50, 10, 'rgba(11, 21, 40, 0.9)', 'rgba(94, 234, 212, 0.14)')
  text('Turkish Airlines (NQZ → AYT)   ·   4h 50m', rx + 44, cardTop + 192, `400 18px ${MONO}`, '#e2e8f0')
  text('Airbus A321neo', rx + rw - 44, cardTop + 192, `400 16px ${MONO}`, '#94a3b8', 'right')

  ctx.strokeStyle = 'rgba(94, 234, 212, 0.14)'
  ctx.beginPath()
  ctx.moveTo(rx + 24, cardTop + 236)
  ctx.lineTo(rx + rw - 24, cardTop + 236)
  ctx.stroke()
  text('Hotel (7n) 950,000 ₸ + Flight 390,000 ₸', rx + 24, cardTop + 276, `400 16px ${MONO}`, '#94a3b8')
  text('Couple Escape · 2 Adults', rx + 24, cardTop + 304, `400 16px ${MONO}`, '#cbd5e1')
  text('1,340,000 ₸', rx + rw - 24, cardTop + 284, `700 28px ${MONO}`, '#5eead4', 'right')
  text('≈ $2,680 total', rx + rw - 24, cardTop + 310, `400 16px ${MONO}`, '#94a3b8', 'right')

  // Second card, partially visible: the list continues below the fold.
  panel(rx, cardTop + 350, rw, 330, 16, CARD, BORDER)
  text('#02', rx + 24, cardTop + 390, `500 18px ${MONO}`, '#94a3b8')
  text('Atlantis The Royal', rx + 24, cardTop + 448, `600 30px ${SANS}`, '#ffffff')
  text('Dubai · Palm Jumeirah', rx + rw - 24, cardTop + 446, `400 18px ${MONO}`, '#cbd5e1', 'right')

  return toTexture(c, maxAnisotropy)
}
