// Boarding pass hero component. Plain ES module, no dependencies.
// Usage: import { initTicket } from './ticket.js';
//        const t = initTicket(document.querySelector('#ticket'), { scroll: true });
//        t.setProgress(0.5); t.destroy();

export const QR_URL = 'https://www.instagram.com/ijustwannaw1n/';
const DEPART_UTC = Date.UTC(2029, 7, 28, 4, 0, 0); // 28 Aug 2029 09:00 Astana (UTC+5)

/* ------------------------------------------------------------------ */
/* QR encoder: byte mode, ECC level M, versions 1-5 (single RS block   */
/* up to v3; v4-M and v5-M use 2 blocks, handled generically).         */
/* ------------------------------------------------------------------ */
const QR_SPEC = {
  // version: [total codewords, ec per block, [blocks group1, data per block], [blocks group2, data per block]]
  1: [26, 10, [1, 16], [0, 0]],
  2: [44, 16, [1, 28], [0, 0]],
  3: [70, 26, [1, 44], [0, 0]],
  4: [100, 18, [2, 32], [0, 0]],
  5: [134, 24, [2, 43], [2, 44]],
};
const QR_ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30] };

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) { GF_EXP[i] = x; GF_LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
const gfMul = (a, b) => (a && b ? GF_EXP[GF_LOG[a] + GF_LOG[b]] : 0);

function rsGenerator(deg) {
  let g = [1];
  for (let i = 0; i < deg; i++) {
    const n = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) { n[j] ^= g[j]; n[j + 1] ^= gfMul(g[j], GF_EXP[i]); }
    g = n;
  }
  return g;
}
function rsRemainder(data, deg) {
  const gen = rsGenerator(deg);
  const res = new Array(deg).fill(0);
  for (const b of data) {
    const f = b ^ res.shift(); res.push(0);
    for (let i = 0; i < deg; i++) res[i] ^= gfMul(gen[i + 1], f);
  }
  return res;
}

export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let ver = 0;
  for (let v = 1; v <= 5; v++) {
    const [, , g1, g2] = QR_SPEC[v];
    const cap = g1[0] * g1[1] + g2[0] * g2[1];
    if (4 + 8 + bytes.length * 8 <= cap * 8) { ver = v; break; }
  }
  if (!ver) throw new Error('QR text too long');
  const [, ecLen, g1, g2] = QR_SPEC[ver];
  const dataCap = g1[0] * g1[1] + g2[0] * g2[1];

  // bit stream
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, dataCap * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < dataCap; pad ^= 0xec ^ 0x11) data.push(pad);

  // blocks + interleave
  const blocks = []; let k = 0;
  for (const [n, len] of [g1, g2]) for (let b = 0; b < n; b++) { const d = data.slice(k, k + len); k += len; blocks.push({ d, e: rsRemainder(d, ecLen) }); }
  const code = [];
  const maxD = Math.max(...blocks.map((b) => b.d.length));
  for (let i = 0; i < maxD; i++) for (const b of blocks) if (i < b.d.length) code.push(b.d[i]);
  for (let i = 0; i < ecLen; i++) for (const b of blocks) code.push(b.e[i]);

  const size = ver * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => { m[y][x] = dark; fn[y][x] = true; };

  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      set(x, y, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = QR_ALIGN[ver];
  for (const ay of al) for (const ax of al) {
    if ((ax === 6 && ay === 6) || (ax === 6 && ay === al[al.length - 1]) || (ay === 6 && ax === al[al.length - 1])) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const drawFormat = (mask) => {
    const d = (0 << 3) | mask; // ECC M = 00
    let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const f = ((d << 10) | r) ^ 0x5412;
    const bit = (i) => ((f >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  drawFormat(0); // reserve

  // place data
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) {
      const x = right - j;
      const up = ((right + 1) & 2) === 0;
      const y = up ? size - 1 - v : v;
      if (!fn[y][x] && bi < code.length * 8) { m[y][x] = ((code[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1; bi++; }
    }
  }

  const maskFn = [
    (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const applyMask = (k) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && maskFn[k](x, y)) m[y][x] = !m[y][x]; };
  const penalty = () => {
    let p = 0;
    const line = (get) => {
      for (let a = 0; a < size; a++) {
        let run = 1;
        for (let b = 1; b < size; b++) {
          if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
        for (let b = 0; b + 10 < size + 1; b++) {
          const s = Array.from({ length: 11 }, (_, i) => (b + i < size ? get(a, b + i) : false));
          const pat1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], pat2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
          if (b + 11 <= size && (s.every((v, i) => v === !!pat1[i]) || s.every((v, i) => v === !!pat2[i]))) p += 40;
        }
      }
    };
    line((a, b) => m[a][b]); line((a, b) => m[b][a]);
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
    let dark = 0; m.forEach((r) => r.forEach((v) => { if (v) dark++; }));
    p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    return p;
  };
  let best = 0, bestP = Infinity;
  for (let k = 0; k < 8; k++) { applyMask(k); drawFormat(k); const p = penalty(); if (p < bestP) { bestP = p; best = k; } applyMask(k); }
  applyMask(best); drawFormat(best);
  return m;
}

function qrSvg(text, quiet = 4) {
  const m = qrMatrix(text);
  const n = m.length + quiet * 2;
  let d = '';
  m.forEach((row, y) => row.forEach((v, x) => { if (v) d += `M${x + quiet} ${y + quiet}h1v1h-1z`; }));
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><rect width="${n}" height="${n}" fill="#F6F4EE"/><path d="${d}" fill="#0C2633"/></svg>`;
}

/* ------------------------------------------------------------------ */
/* Decorative SVG builders                                             */
/* ------------------------------------------------------------------ */
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function barcodeSvg(seed) {
  const rnd = mulberry32(seed);
  let x = 0; let rects = '';
  const guard = () => { rects += `<rect x="${x}" width="1" height="40"/>`; x += 2; rects += `<rect x="${x}" width="1" height="40"/>`; x += 2; };
  guard();
  while (x < 150) {
    const w = 1 + Math.floor(rnd() * 3.2);
    const gap = 1 + Math.floor(rnd() * 2.4);
    rects += `<rect x="${x}" width="${w}" height="40"/>`;
    x += w + gap;
  }
  guard();
  return `<svg viewBox="0 0 ${x - 1} 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g fill="currentColor">${rects}</g></svg>`;
}
function guillocheSvg() {
  let paths = '';
  for (let k = 0; k < 18; k++) {
    let d = '';
    for (let i = 0; i <= 120; i++) {
      const x = i * 5;
      const y = 40 + k * 14 + Math.sin(i / 7 + k * 0.55) * 16 + Math.sin(i / 2.9 + k) * 3;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    paths += `<path d="${d}"/>`;
  }
  let rings = '';
  for (let r = 30; r <= 260; r += 11) rings += `<circle cx="600" cy="0" r="${r}"/>`;
  return `<svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width=".7">${paths}${rings}</g></svg>`;
}
const PLANE = 'M-9 -1.2 L-3 -1.2 L-7 -8.5 L-4.6 -8.5 L2.2 -1.2 L7.6 -1.2 C10 -1.2 10 1.2 7.6 1.2 L2.2 1.2 L-4.6 8.5 L-7 8.5 L-3 1.2 L-9 1.2 L-10.6 4 L-12.2 4 L-11.2 0 L-12.2 -4 L-10.6 -4 Z';
function pathSvg() {
  const arc = 'M8 46 Q100 -10 192 46';
  return `<svg class="tk-arc" viewBox="0 0 200 56" aria-hidden="true" focusable="false">
    <path d="${arc}" class="tk-arc-ahead" pathLength="1"/>
    <path d="${arc}" class="tk-arc-done" pathLength="1"/>
    <circle cx="8" cy="46" r="3.4" class="tk-arc-dot"/><circle cx="192" cy="46" r="3.4" class="tk-arc-dot tk-arc-dot--to"/>
    <g class="tk-plane"><path d="${PLANE}"/></g>
  </svg>`;
}

/* ------------------------------------------------------------------ */
/* Markup                                                              */
/* ------------------------------------------------------------------ */
function markup() {
  return `
<div class="tk-enter">
<article class="tk" aria-label="Boarding pass">
  <div class="tk-part tk-main">
    <div class="tk-face">
      <div class="tk-bg" aria-hidden="true">${guillocheSvg()}<span class="tk-wm" lang="ja">東京</span></div>
      <div class="tk-body">
        <header class="tk-head">
          <p class="tk-kicker"><span>Boarding pass</span><span class="tk-jp" lang="ja">搭乗券</span></p>
          <p class="tk-tags"><span class="tk-pill">One way</span><span class="tk-pill tk-pill--solid">E-ticket 2029</span></p>
        </header>
        <div class="tk-route">
          <div class="tk-port">
            <p class="tk-label">From</p>
            <p class="tk-code">NQZ</p>
            <p class="tk-city">Astana</p>
            <p class="tk-clock"><span class="tk-live" aria-hidden="true"></span><span class="tk-sr">Local time in Astana </span><time data-clock="5">--:--:--</time><span class="tk-utc">UTC+5</span></p>
          </div>
          <div class="tk-path">
            <p class="tk-flt"><span class="tk-sr">Flight </span>AN 2029</p>
            ${pathSvg()}
            <p class="tk-bound" lang="ja" aria-hidden="true">東京行き</p>
          </div>
          <div class="tk-port tk-port--to">
            <p class="tk-label">To</p>
            <p class="tk-code">NRT</p>
            <p class="tk-city">Tokyo Narita</p>
            <p class="tk-clock"><span class="tk-live" aria-hidden="true"></span><span class="tk-sr">Local time in Tokyo </span><time data-clock="9">--:--:--</time><span class="tk-utc">UTC+9</span></p>
          </div>
        </div>
        <dl class="tk-grid">
          <div class="tk-f tk-f--pax"><dt>Passenger</dt><dd><span class="tk-name">Amir Nagiyev</span><span class="tk-kana" lang="ja">アミル・ナギエフ</span><span class="tk-role">AI &amp; ML developer</span></dd></div>
          <div class="tk-f"><dt>Date</dt><dd>28 AUG 2029</dd></div>
          <div class="tk-f"><dt>Flight</dt><dd>AN 2029</dd></div>
          <div class="tk-f"><dt>Seat</dt><dd>17A</dd></div>
          <div class="tk-f"><dt>Gate</dt><dd>N2</dd></div>
          <div class="tk-f"><dt>Class</dt><dd>Student</dd></div>
          <div class="tk-f"><dt>Ticket</dt><dd>One way</dd></div>
        </dl>
      </div>
      <footer class="tk-foot">
        <p class="tk-board"><span class="tk-label">Boarding</span><strong>The next step</strong></p>
        <p class="tk-count" role="timer"><span class="tk-label">Boarding in</span><span class="tk-count-v" data-countdown>calculating</span></p>
      </footer>
      <div class="tk-foil" aria-hidden="true"><span>THE NEXT STEP &middot; QADAM &middot; 2029 &middot; THE NEXT STEP &middot; QADAM &middot; 2029 &middot;</span></div>
      <div class="tk-sheen" aria-hidden="true"></div>
    </div>
  </div>
  <div class="tk-part tk-stub">
    <div class="tk-face">
      <div class="tk-stub-body">
        <div class="tk-stub-head"><p class="tk-label">Seat <span lang="ja">座席</span></p><p class="tk-label">AN 2029</p></div>
        <p class="tk-seat"><span class="tk-sr">Seat </span>17A</p>
        <p class="tk-window"><b>Window</b><span lang="ja">窓側</span></p>
        <div class="tk-stub-row">
          <a class="tk-qr" href="${QR_URL}" target="_blank" rel="noopener noreferrer" aria-label="Amir on Instagram">${qrSvg(QR_URL)}</a>
          <dl class="tk-mini">
            <div><dt>Route</dt><dd>NQZ <span aria-hidden="true">&rarr;</span><span class="tk-sr">to</span> NRT</dd></div>
            <div><dt>Date</dt><dd>28 AUG 2029</dd></div>
            <div><dt>Gate</dt><dd>N2</dd></div>
            <div><dt>Name</dt><dd>Nagiyev / Amir</dd></div>
          </dl>
        </div>
        <div class="tk-barcode" aria-hidden="true">${barcodeSvg(20290828)}<p>AN2029 0828 17A N2 0001</p></div>
      </div>
      <div class="tk-sheen" aria-hidden="true"></div>
    </div>
  </div>
</article>
</div>`;
}

/* ------------------------------------------------------------------ */
/* Behaviour                                                           */
/* ------------------------------------------------------------------ */
const pad = (n) => String(n).padStart(2, '0');
function fmtClock(now, offsetH) {
  const d = new Date(now + offsetH * 3600e3);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
function fmtCountdown(now) {
  let s = Math.max(0, Math.floor((DEPART_UTC - now) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const days = String(d).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return {
    html: `<b>${days}</b><i>d</i> <b>${pad(h)}</b><i>h</i> <b>${pad(m)}</b><i>m</i> <b class="tk-sec">${pad(s)}</b><i class="tk-sec">s</i>`,
    label: `${d} days ${h} hours ${m} minutes`,
  };
}

export function initTicket(root, opts = {}) {
  const { scroll = true } = opts;
  root.classList.add('tk-stage');
  root.innerHTML = markup();
  const tk = root.querySelector('.tk');
  const clocks = [...root.querySelectorAll('[data-clock]')];
  const countEl = root.querySelector('[data-countdown]');
  const countWrap = root.querySelector('.tk-count');
  const rmq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = rmq.matches;
  if (reduced) root.classList.add('tk-reduced');

  // live clock + countdown
  const tickClock = () => {
    const now = Date.now();
    clocks.forEach((c) => { c.textContent = fmtClock(now, +c.dataset.clock); });
    const cd = fmtCountdown(now);
    countEl.innerHTML = cd.html;
    countWrap.setAttribute('aria-label', `Boarding in ${cd.label}`);
  };
  tickClock();
  let clockTimer = setTimeout(function loop() { tickClock(); clockTimer = setTimeout(loop, 1000 - (Date.now() % 1000) + 5); }, 1000 - (Date.now() % 1000) + 5);

  // tilt spring
  const MAX = 10;
  const st = { rx: 0, ry: 0, vx: 0, vy: 0, tx: 0, ty: 0, mx: 50, my: 50, tmx: 50, tmy: 50 };
  let raf = 0, hovering = false, sway = false, orient = false, swayT0 = performance.now();
  const write = () => {
    const s = tk.style;
    s.setProperty('--rx', st.rx.toFixed(3) + 'deg');
    s.setProperty('--ry', st.ry.toFixed(3) + 'deg');
    s.setProperty('--mx', st.mx.toFixed(2) + '%');
    s.setProperty('--my', st.my.toFixed(2) + '%');
    s.setProperty('--sx', (-st.ry * 1.6).toFixed(2) + 'px');
    s.setProperty('--sy', (26 + st.rx * 1.6).toFixed(2) + 'px');
    s.setProperty('--tilt', (Math.hypot(st.rx, st.ry) / MAX).toFixed(3));
  };
  const frame = (t) => {
    raf = 0;
    if (sway && !hovering && !orient) {
      const k = (t - swayT0) / 1000;
      st.tx = Math.sin(k * 0.55) * 3.2; st.ty = Math.sin(k * 0.8 + 1) * 4.5;
      st.tmx = 50 + st.ty * 6; st.tmy = 50 - st.tx * 6;
    }
    const K = 0.07, D = 0.78; // spring stiffness and damping
    st.vx = (st.vx + (st.tx - st.rx) * K) * D; st.rx += st.vx;
    st.vy = (st.vy + (st.ty - st.ry) * K) * D; st.ry += st.vy;
    st.mx += (st.tmx - st.mx) * 0.12; st.my += (st.tmy - st.my) * 0.12;
    write();
    const moving = Math.abs(st.vx) + Math.abs(st.vy) + Math.abs(st.tx - st.rx) + Math.abs(st.ty - st.ry) + Math.abs(st.tmx - st.mx) * 0.02 > 0.002;
    if (moving || sway) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && !reduced) raf = requestAnimationFrame(frame); };

  const onMove = (e) => {
    if (reduced || e.pointerType === 'touch') return;
    const r = tk.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    const inside = nx > -0.08 && nx < 1.08 && ny > -0.12 && ny < 1.12;
    if (!inside) { if (hovering) onLeave(); return; }
    hovering = true;
    const cx = Math.min(1, Math.max(0, nx)), cy = Math.min(1, Math.max(0, ny));
    st.ty = (cx - 0.5) * 2 * MAX; st.tx = -(cy - 0.5) * 2 * MAX;
    st.tmx = cx * 100; st.tmy = cy * 100;
    kick();
  };
  const onLeave = () => { hovering = false; st.tx = 0; st.ty = 0; st.tmx = 50; st.tmy = 50; kick(); };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  // touch: device orientation if allowed, else idle sway
  const coarse = window.matchMedia('(hover: none)').matches;
  const onOrient = (e) => {
    if (reduced || e.beta == null || e.gamma == null) return;
    orient = true;
    st.ty = Math.max(-MAX, Math.min(MAX, e.gamma / 2.5));
    st.tx = Math.max(-MAX, Math.min(MAX, -(e.beta - 40) / 2.5));
    st.tmx = 50 + st.ty * 4; st.tmy = 50 - st.tx * 4;
    kick();
  };
  const askOrient = () => {
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then((r) => { if (r === 'granted') window.addEventListener('deviceorientation', onOrient); }).catch(() => {});
    }
  };
  if (coarse) {
    sway = true; kick();
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') tk.addEventListener('click', askOrient, { once: true });
    else window.addEventListener('deviceorientation', onOrient);
  }

  // tear progress
  let progress = 0;
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  function setProgress(p) {
    progress = Math.min(1, Math.max(0, +p || 0));
    const q = reduced ? 0 : progress;
    const sep = Math.min(1, q / 0.18);              // perforation cracks open
    const tp = Math.max(0, (q - 0.12) / 0.88);       // stub falls
    const lp = ease(Math.min(1, q / 0.8));           // main lifts
    tk.style.setProperty('--sep', ease(sep).toFixed(4));
    tk.style.setProperty('--tp', tp.toFixed(4));
    tk.style.setProperty('--lp', lp.toFixed(4));
    root.classList.toggle('tk-torn', q > 0.01);
  }
  const onScroll = () => setProgress(window.scrollY / Math.max(1, window.innerHeight));
  if (scroll) { window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); } else setProgress(0);

  const onRm = (e) => {
    reduced = e.matches; root.classList.toggle('tk-reduced', reduced);
    if (reduced) { Object.assign(st, { rx: 0, ry: 0, vx: 0, vy: 0, tx: 0, ty: 0, mx: 50, my: 50, tmx: 50, tmy: 50 }); write(); }
    else kick();
    setProgress(progress);
  };
  rmq.addEventListener('change', onRm);
  write();

  return {
    setProgress,
    get progress() { return progress; },
    destroy() {
      clearTimeout(clockTimer); cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('scroll', onScroll);
      rmq.removeEventListener('change', onRm);
      root.innerHTML = ''; root.classList.remove('tk-stage', 'tk-reduced', 'tk-torn');
    },
  };
}
