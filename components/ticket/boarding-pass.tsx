'use client'

import { useEffect, useRef } from 'react'
import { subscribeScroll } from '@/lib/lenis'
import { qrMatrix } from '@/components/ticket/qr'
import './ticket.css'

/**
 * The boarding pass hero: Astana NQZ to Tokyo NRT, 28 AUG 2029, seat 17A.
 * Ported from the approved mockup (mock-ticket2/ticket.js). The markup renders on the server;
 * one effect adds the live clocks, the countdown, the pointer tilt and the scroll tear, all
 * written straight to the DOM so React never re-renders while the ticket moves.
 */

export const QR_URL = 'https://www.instagram.com/ijustwannaw1n/'
/** 28 Aug 2029 09:00 in Astana (UTC+5). */
const DEPART_UTC = Date.UTC(2029, 7, 28, 4, 0, 0)

/* -------------------------------------------------------------------------- */
/*  Deterministic artwork, computed once per module                           */
/* -------------------------------------------------------------------------- */

const QR_QUIET = 4
const QR = (() => {
  const m = qrMatrix(QR_URL)
  let d = ''
  m.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v) d += `M${x + QR_QUIET} ${y + QR_QUIET}h1v1h-1z`
    }),
  )
  return { size: m.length + QR_QUIET * 2, d }
})()

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const BARCODE = (() => {
  const rnd = mulberry32(20290828)
  const bars: Array<[number, number]> = []
  let x = 0
  const guard = () => {
    bars.push([x, 1])
    x += 2
    bars.push([x, 1])
    x += 2
  }
  guard()
  while (x < 150) {
    const w = 1 + Math.floor(rnd() * 3.2)
    const gap = 1 + Math.floor(rnd() * 2.4)
    bars.push([x, w])
    x += w + gap
  }
  guard()
  return { width: x - 1, bars }
})()

const GUILLOCHE = (() => {
  const paths: string[] = []
  for (let k = 0; k < 18; k++) {
    let d = ''
    for (let i = 0; i <= 120; i++) {
      const x = i * 5
      const y = 40 + k * 14 + Math.sin(i / 7 + k * 0.55) * 16 + Math.sin(i / 2.9 + k) * 3
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)
    }
    paths.push(d)
  }
  const rings: number[] = []
  for (let r = 30; r <= 260; r += 11) rings.push(r)
  return { paths, rings }
})()

const PLANE =
  'M-9 -1.2 L-3 -1.2 L-7 -8.5 L-4.6 -8.5 L2.2 -1.2 L7.6 -1.2 C10 -1.2 10 1.2 7.6 1.2 L2.2 1.2 L-4.6 8.5 L-7 8.5 L-3 1.2 L-9 1.2 L-10.6 4 L-12.2 4 L-11.2 0 L-12.2 -4 L-10.6 -4 Z'
const ARC = 'M8 46 Q100 -10 192 46'

/* -------------------------------------------------------------------------- */
/*  Formatting                                                                */
/* -------------------------------------------------------------------------- */

const pad = (n: number): string => String(n).padStart(2, '0')

function fmtClock(now: number, offsetH: number): string {
  const d = new Date(now + offsetH * 3600e3)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

function fmtCountdown(now: number): { html: string; label: string } {
  let s = Math.max(0, Math.floor((DEPART_UTC - now) / 1000))
  const d = Math.floor(s / 86400)
  s -= d * 86400
  const h = Math.floor(s / 3600)
  s -= h * 3600
  const m = Math.floor(s / 60)
  s -= m * 60
  const days = String(d).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return {
    html: `<b>${days}</b><i>d</i> <b>${pad(h)}</b><i>h</i> <b>${pad(m)}</b><i>m</i> <b class="tk-sec">${pad(s)}</b><i class="tk-sec">s</i>`,
    label: `${d} days ${h} hours ${m} minutes`,
  }
}

/* -------------------------------------------------------------------------- */
/*  Behaviour                                                                 */
/* -------------------------------------------------------------------------- */

interface TiltState {
  rx: number
  ry: number
  vx: number
  vy: number
  tx: number
  ty: number
  mx: number
  my: number
  tmx: number
  tmy: number
}

const REST: TiltState = { rx: 0, ry: 0, vx: 0, vy: 0, tx: 0, ty: 0, mx: 50, my: 50, tmx: 50, tmy: 50 }
const MAX_TILT = 10

type OrientationPermission = { requestPermission?: () => Promise<string> }

function attachTicket(root: HTMLElement): () => void {
  const tk = root.querySelector<HTMLElement>('.tk')
  const countEl = root.querySelector<HTMLElement>('[data-countdown]')
  const countWrap = root.querySelector<HTMLElement>('.tk-count')
  if (!tk || !countEl || !countWrap) return () => {}
  const clocks = Array.from(root.querySelectorAll<HTMLElement>('[data-clock]'))
  const scroller = root.closest<HTMLElement>('[data-hero]')
  const rmq = window.matchMedia('(prefers-reduced-motion: reduce)')
  let reduced = rmq.matches
  root.classList.toggle('tk-reduced', reduced)

  // Live clocks and countdown, aligned to the second.
  const tickClock = () => {
    const now = Date.now()
    clocks.forEach((c) => {
      c.textContent = fmtClock(now, Number(c.dataset.clock))
    })
    const cd = fmtCountdown(now)
    countEl.innerHTML = cd.html
    countWrap.setAttribute('aria-label', `Boarding in ${cd.label}`)
  }
  tickClock()
  const nextDelay = () => 1000 - (Date.now() % 1000) + 5
  let clockTimer = setTimeout(function loop() {
    tickClock()
    clockTimer = setTimeout(loop, nextDelay())
  }, nextDelay())

  // Tilt spring.
  const st: TiltState = { ...REST }
  let raf = 0
  let hovering = false
  let sway = false
  let orient = false
  const swayT0 = performance.now()
  const write = () => {
    const s = tk.style
    s.setProperty('--rx', st.rx.toFixed(3) + 'deg')
    s.setProperty('--ry', st.ry.toFixed(3) + 'deg')
    s.setProperty('--mx', st.mx.toFixed(2) + '%')
    s.setProperty('--my', st.my.toFixed(2) + '%')
    s.setProperty('--sx', (-st.ry * 1.6).toFixed(2) + 'px')
    s.setProperty('--sy', (26 + st.rx * 1.6).toFixed(2) + 'px')
    s.setProperty('--tilt', (Math.hypot(st.rx, st.ry) / MAX_TILT).toFixed(3))
  }
  const frame = (t: number) => {
    raf = 0
    if (sway && !hovering && !orient) {
      const k = (t - swayT0) / 1000
      st.tx = Math.sin(k * 0.55) * 3.2
      st.ty = Math.sin(k * 0.8 + 1) * 4.5
      st.tmx = 50 + st.ty * 6
      st.tmy = 50 - st.tx * 6
    }
    const K = 0.07
    const D = 0.78
    st.vx = (st.vx + (st.tx - st.rx) * K) * D
    st.rx += st.vx
    st.vy = (st.vy + (st.ty - st.ry) * K) * D
    st.ry += st.vy
    st.mx += (st.tmx - st.mx) * 0.12
    st.my += (st.tmy - st.my) * 0.12
    write()
    const moving =
      Math.abs(st.vx) + Math.abs(st.vy) + Math.abs(st.tx - st.rx) + Math.abs(st.ty - st.ry) + Math.abs(st.tmx - st.mx) * 0.02 >
      0.002
    if ((moving || sway) && !reduced) raf = requestAnimationFrame(frame)
  }
  const kick = () => {
    if (!raf && !reduced) raf = requestAnimationFrame(frame)
  }

  const onLeave = () => {
    hovering = false
    st.tx = 0
    st.ty = 0
    st.tmx = 50
    st.tmy = 50
    kick()
  }
  const onMove = (e: PointerEvent) => {
    if (reduced || e.pointerType === 'touch') return
    const r = tk.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width
    const ny = (e.clientY - r.top) / r.height
    const inside = nx > -0.08 && nx < 1.08 && ny > -0.12 && ny < 1.12
    if (!inside) {
      if (hovering) onLeave()
      return
    }
    hovering = true
    const cx = Math.min(1, Math.max(0, nx))
    const cy = Math.min(1, Math.max(0, ny))
    st.ty = (cx - 0.5) * 2 * MAX_TILT
    st.tx = -(cy - 0.5) * 2 * MAX_TILT
    st.tmx = cx * 100
    st.tmy = cy * 100
    kick()
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)

  // Touch: device orientation when allowed, otherwise an idle sway.
  const coarse = window.matchMedia('(hover: none)').matches
  const onOrient = (e: DeviceOrientationEvent) => {
    if (reduced || e.beta == null || e.gamma == null) return
    orient = true
    st.ty = Math.max(-MAX_TILT, Math.min(MAX_TILT, e.gamma / 2.5))
    st.tx = Math.max(-MAX_TILT, Math.min(MAX_TILT, -(e.beta - 40) / 2.5))
    st.tmx = 50 + st.ty * 4
    st.tmy = 50 - st.tx * 4
    kick()
  }
  const DOE = (typeof DeviceOrientationEvent === 'undefined' ? undefined : DeviceOrientationEvent) as
    | OrientationPermission
    | undefined
  const askOrient = () => {
    DOE?.requestPermission?.()
      .then((r) => {
        if (r === 'granted') window.addEventListener('deviceorientation', onOrient)
      })
      .catch(() => {})
  }
  if (coarse) {
    sway = true
    kick()
    if (typeof DOE?.requestPermission === 'function') tk.addEventListener('click', askOrient, { once: true })
    else window.addEventListener('deviceorientation', onOrient)
  }

  // Tear: the stub falls and the main part lifts over the first viewport of scroll.
  let progress = 0
  const ease = (x: number) => 1 - Math.pow(1 - x, 3)
  const setProgress = (p: number) => {
    progress = Math.min(1, Math.max(0, p || 0))
    const q = reduced ? 0 : progress
    const sep = Math.min(1, q / 0.18)
    const tp = Math.max(0, (q - 0.12) / 0.88)
    const lp = ease(Math.min(1, q / 0.8))
    tk.style.setProperty('--sep', ease(sep).toFixed(4))
    tk.style.setProperty('--tp', tp.toFixed(4))
    tk.style.setProperty('--lp', lp.toFixed(4))
    root.classList.toggle('tk-torn', q > 0.01)
  }
  const onScroll = () => {
    const vh = Math.max(1, window.innerHeight)
    const y = scroller ? -scroller.getBoundingClientRect().top : window.scrollY
    setProgress(y / vh)
  }
  const unsubscribe = subscribeScroll(onScroll)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  const onRm = (e: MediaQueryListEvent) => {
    reduced = e.matches
    root.classList.toggle('tk-reduced', reduced)
    if (reduced) {
      cancelAnimationFrame(raf)
      raf = 0
      Object.assign(st, REST)
      write()
    } else kick()
    setProgress(progress)
  }
  rmq.addEventListener('change', onRm)
  write()

  return () => {
    clearTimeout(clockTimer)
    cancelAnimationFrame(raf)
    window.removeEventListener('pointermove', onMove)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    window.removeEventListener('deviceorientation', onOrient)
    tk.removeEventListener('click', askOrient)
    window.removeEventListener('scroll', onScroll)
    unsubscribe()
    rmq.removeEventListener('change', onRm)
    root.classList.remove('tk-reduced', 'tk-torn')
  }
}

/* -------------------------------------------------------------------------- */
/*  Markup                                                                    */
/* -------------------------------------------------------------------------- */

export function BoardingPass() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    return attachTicket(root)
  }, [])

  return (
    <div ref={ref} className="tk-stage">
      <div className="tk-enter">
        <article className="tk" aria-label="Boarding pass">
          <div className="tk-part tk-main">
            <div className="tk-face">
              <div className="tk-bg" aria-hidden="true">
                <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
                  <g fill="none" stroke="currentColor" strokeWidth=".7">
                    {GUILLOCHE.paths.map((d, i) => (
                      <path key={`p${i}`} d={d} />
                    ))}
                    {GUILLOCHE.rings.map((r) => (
                      <circle key={`r${r}`} cx="600" cy="0" r={r} />
                    ))}
                  </g>
                </svg>
                <span className="tk-wm" lang="ja">
                  東京
                </span>
              </div>
              <div className="tk-body">
                <header className="tk-head">
                  <p className="tk-kicker">
                    <span>Boarding pass</span>
                    <span className="tk-jp" lang="ja">
                      搭乗券
                    </span>
                  </p>
                  <p className="tk-tags">
                    <span className="tk-pill">One way</span>
                    <span className="tk-pill tk-pill--solid">E-ticket 2029</span>
                  </p>
                </header>
                <div className="tk-route">
                  <div className="tk-port">
                    <p className="tk-label">From</p>
                    <p className="tk-code">NQZ</p>
                    <p className="tk-city">Astana</p>
                    <p className="tk-clock">
                      <span className="tk-live" aria-hidden="true" />
                      <span className="tk-sr">Local time in Astana </span>
                      <time data-clock="5">--:--:--</time>
                      <span className="tk-utc">UTC+5</span>
                    </p>
                  </div>
                  <div className="tk-path">
                    <p className="tk-flt">
                      <span className="tk-sr">Flight </span>AN 2029
                    </p>
                    <svg className="tk-arc" viewBox="0 0 200 56" aria-hidden="true" focusable="false">
                      <path d={ARC} className="tk-arc-ahead" pathLength={1} />
                      <path d={ARC} className="tk-arc-done" pathLength={1} />
                      <circle cx="8" cy="46" r="3.4" className="tk-arc-dot" />
                      <circle cx="192" cy="46" r="3.4" className="tk-arc-dot tk-arc-dot--to" />
                      <g className="tk-plane">
                        <path d={PLANE} />
                      </g>
                    </svg>
                    <p className="tk-bound" lang="ja" aria-hidden="true">
                      東京行き
                    </p>
                  </div>
                  <div className="tk-port tk-port--to">
                    <p className="tk-label">To</p>
                    <p className="tk-code">NRT</p>
                    <p className="tk-city">Tokyo Narita</p>
                    <p className="tk-clock">
                      <span className="tk-live" aria-hidden="true" />
                      <span className="tk-sr">Local time in Tokyo </span>
                      <time data-clock="9">--:--:--</time>
                      <span className="tk-utc">UTC+9</span>
                    </p>
                  </div>
                </div>
                <dl className="tk-grid">
                  <div className="tk-f tk-f--pax">
                    <dt>Passenger</dt>
                    <dd>
                      <span className="tk-name">Amir Nagiyev</span>
                      <span className="tk-kana" lang="ja">
                        アミル・ナギエフ
                      </span>
                      <span className="tk-role">AI &amp; ML developer</span>
                    </dd>
                  </div>
                  <div className="tk-f">
                    <dt>Date</dt>
                    <dd>28 AUG 2029</dd>
                  </div>
                  <div className="tk-f">
                    <dt>Flight</dt>
                    <dd>AN 2029</dd>
                  </div>
                  <div className="tk-f">
                    <dt>Seat</dt>
                    <dd>17A</dd>
                  </div>
                  <div className="tk-f">
                    <dt>Gate</dt>
                    <dd>N2</dd>
                  </div>
                  <div className="tk-f">
                    <dt>Class</dt>
                    <dd>Student</dd>
                  </div>
                  <div className="tk-f">
                    <dt>Ticket</dt>
                    <dd>One way</dd>
                  </div>
                </dl>
              </div>
              <footer className="tk-foot">
                <p className="tk-board">
                  <span className="tk-label">Boarding</span>
                  <strong>The next step</strong>
                </p>
                <p className="tk-count" role="timer">
                  <span className="tk-label">Boarding in</span>
                  <span className="tk-count-v" data-countdown="">
                    calculating
                  </span>
                </p>
              </footer>
              <div className="tk-foil" aria-hidden="true">
                <span>THE NEXT STEP · QADAM · 2029 · THE NEXT STEP · QADAM · 2029 ·</span>
              </div>
              <div className="tk-sheen" aria-hidden="true" />
            </div>
          </div>
          <div className="tk-part tk-stub">
            <div className="tk-face">
              <div className="tk-stub-body">
                <div className="tk-stub-head">
                  <p className="tk-label">
                    Seat <span lang="ja">座席</span>
                  </p>
                  <p className="tk-label">AN 2029</p>
                </div>
                <p className="tk-seat">
                  <span className="tk-sr">Seat </span>17A
                </p>
                <p className="tk-window">
                  <b>Window</b>
                  <span lang="ja">窓側</span>
                </p>
                <div className="tk-stub-row">
                  <a className="tk-qr" href={QR_URL} target="_blank" rel="noopener noreferrer" aria-label="Amir on Instagram">
                    <svg
                      viewBox={`0 0 ${QR.size} ${QR.size}`}
                      shapeRendering="crispEdges"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <rect width={QR.size} height={QR.size} fill="#F6F4EE" />
                      <path d={QR.d} fill="#0C2633" />
                    </svg>
                  </a>
                  <dl className="tk-mini">
                    <div>
                      <dt>Route</dt>
                      <dd>
                        NQZ <span aria-hidden="true">→</span>
                        <span className="tk-sr">to</span> NRT
                      </dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd>28 AUG 2029</dd>
                    </div>
                    <div>
                      <dt>Gate</dt>
                      <dd>N2</dd>
                    </div>
                    <div>
                      <dt>Name</dt>
                      <dd>Nagiyev / Amir</dd>
                    </div>
                  </dl>
                </div>
                <div className="tk-barcode" aria-hidden="true">
                  <svg viewBox={`0 0 ${BARCODE.width} 40`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                    <g fill="currentColor">
                      {BARCODE.bars.map(([x, w]) => (
                        <rect key={x} x={x} width={w} height="40" />
                      ))}
                    </g>
                  </svg>
                  <p>AN2029 0828 17A N2 0001</p>
                </div>
              </div>
              <div className="tk-sheen" aria-hidden="true" />
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
