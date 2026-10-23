// Animated sky: Astana (Baiterek) on the left, Tokyo on the right.
// Ported from the approved mockup (mock-ticket2/sky.js). No dependencies. Usage:
//   import { initSky } from './sky-engine';
//   const sky = initSky(document.querySelector('.sky'));
//   sky.destroy(); // removes everything initSky added
// Without JS, sky.css alone paints the gradient sky, static clouds and both silhouettes.

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number): number => Math.round(n * 100) / 100;
const SVG_NS = 'http://www.w3.org/2000/svg';

/* ------------------------------------------------------------------ */
/* Silhouettes (shared with the CSS fallback, see sky.css)             */
/* ------------------------------------------------------------------ */

// Baiterek, Astana. Flat vector after the owner's reference drawing: a stepped
// pedestal, a column whose lower part is split into dark leaves, a band of
// windows at the waist, a crown of pointed petals and the faceted golden sphere
// with its mast. Drawn in full colour and muted as a whole by the wrapper.
function baiterekSVG() {
  return `<svg xmlns="${SVG_NS}" viewBox="250 0 240 712" preserveAspectRatio="xMidYMax meet">
<defs>
<clipPath id="skyB-ball"><circle cx="372" cy="128" r="82"/></clipPath>
</defs>
<g>
<rect x="371" y="8" width="2.4" height="52" fill="#EDC886"/>
<g clip-path="url(#skyB-ball)">
<rect x="288" y="44" width="44" height="170" fill="#E5B273"/>
<rect x="332" y="44" width="40" height="170" fill="#ECC583"/>
<rect x="372" y="44" width="40" height="170" fill="#F1D395"/>
<rect x="412" y="44" width="44" height="170" fill="#F5E3B8"/>
<path d="M288 106H456V112H288Z" fill="#D9A867" opacity=".35"/>
<path d="M288 150H456V156H288Z" fill="#D9A867" opacity=".35"/>
</g>
</g>
<g>
<path fill="#D3E6F3" d="M318 662L330 520C332 450 330 390 325 332C315 270 290 200 264 122L300 192L306 134L340 200L346 120L372 202L398 120L404 200L438 134L444 192L480 122C454 200 430 270 420 332C414 390 412 450 414 520L426 662Z"/>
<path fill="#C2D8EB" d="M325 332L346 200L356 336ZM420 332L398 200L388 336ZM360 336L372 214L384 336Z"/>
<path fill="#C9DEEE" d="M330 520C331 470 330 420 327 368H417C414 420 413 470 414 520Z"/>
<g fill="#A3BCD9">
<rect x="334" y="368" width="12" height="19"/><rect x="355" y="368" width="12" height="19"/><rect x="377" y="368" width="12" height="19"/><rect x="398" y="368" width="12" height="19"/>
<rect x="334" y="398" width="12" height="19"/><rect x="355" y="398" width="12" height="19"/><rect x="377" y="398" width="12" height="19"/><rect x="398" y="398" width="12" height="19"/>
<rect x="334" y="428" width="12" height="19"/><rect x="355" y="428" width="12" height="19"/><rect x="377" y="428" width="12" height="19"/><rect x="398" y="428" width="12" height="19"/>
<path d="M318 662L331 498L352 662ZM352 662L372 498L392 662ZM392 662L413 498L426 662Z"/>
</g>
<path fill="#A2BAD6" d="M290 662H454L458 680H286Z"/>
<path fill="#95AECD" d="M286 680H458L464 708H280Z"/>
</g>
</svg>`;
}

// Tokyo Skytree. 634 m: a triangular base that rounds into a slender, slightly
// concave lattice shaft; Tembo Deck at 350 m, the smaller Tembo Galleria at 450 m,
// then the narrow gain tower and the antenna mast. 1 unit is 1 m.
function skytreeSVG() {
  const c = 50;
  const y = (h: number): number => 640 - h;
  // Right edge, bottom to top, as [half width, height]; mirrored for the left edge.
  const R = (hw: number, h: number): string => `${f(c + hw)} ${f(y(h))}`;
  const L = (hw: number, h: number): string => `${f(c - hw)} ${f(y(h))}`;
  const right = [
    `M${R(35, 0)}`,
    `C${R(30.5, 22)} ${R(28, 62)} ${R(26, 110)}`,
    `C${R(23.4, 190)} ${R(20, 280)} ${R(18.2, 334)}`,
    `L${R(23.2, 340)}L${R(23.2, 352)}L${R(22.4, 354.5)}L${R(22.4, 358.5)}L${R(16.9, 363)}`,
    `L${R(13.8, 440)}L${R(15.9, 443)}L${R(15.9, 452)}L${R(13.4, 455)}`,
    `L${R(10.2, 494)}L${R(6.2, 498)}`,
    `L${R(5.2, 562)}L${R(4.4, 563)}L${R(3.8, 600)}L${R(2.7, 601)}L${R(2.2, 618)}L${R(1.1, 619)}L${R(0.45, 634)}`,
  ];
  const left = [
    `L${L(0.45, 634)}L${L(1.1, 619)}L${L(2.2, 618)}L${L(2.7, 601)}L${L(3.8, 600)}L${L(4.4, 563)}L${L(5.2, 562)}`,
    `L${L(6.2, 498)}L${L(10.2, 494)}`,
    `L${L(13.4, 455)}L${L(15.9, 452)}L${L(15.9, 443)}L${L(13.8, 440)}`,
    `L${L(16.9, 363)}L${L(22.4, 358.5)}L${L(22.4, 354.5)}L${L(23.2, 352)}L${L(23.2, 340)}L${L(18.2, 334)}`,
    `C${L(20, 280)} ${L(23.4, 190)} ${L(26, 110)}`,
    `C${L(28, 62)} ${L(30.5, 22)} ${L(35, 0)}Z`,
  ];
  // Openings between the three legs at the foot.
  const legs =
    `M${L(27.5, 0)}C${L(25, 22)} ${L(17, 36)} ${L(9, 38)}C${L(6.5, 30)} ${L(5, 16)} ${L(4.2, 0)}Z` +
    `M${R(27.5, 0)}C${R(25, 22)} ${R(17, 36)} ${R(9, 38)}C${R(6.5, 30)} ${R(5, 16)} ${R(4.2, 0)}Z`;

  return `<svg xmlns="${SVG_NS}" viewBox="0 0 100 640" preserveAspectRatio="xMidYMax meet">
<defs>
<linearGradient id="skyT-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="640">
<stop offset="0" stop-color="#F6FBFD"/><stop offset=".5" stop-color="#EAF4F8"/><stop offset="1" stop-color="#D2E6EF" stop-opacity=".25"/>
</linearGradient>
<pattern id="skyT-lat" patternUnits="userSpaceOnUse" width="9" height="13">
<path d="M0 0L9 13M9 0L0 13M0 0H9" stroke="#000" stroke-width=".7" fill="none"/>
</pattern>
<mask id="skyT-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="640">
<rect width="100" height="640" fill="#fff"/>
<rect x="0" y="${y(330)}" width="100" height="280" fill="url(#skyT-lat)" opacity=".55"/>
<rect x="0" y="${y(438)}" width="100" height="73" fill="url(#skyT-lat)" opacity=".45"/>
<rect x="0" y="${y(349)}" width="100" height="5" fill="#000" opacity=".35"/>
<rect x="0" y="${y(449)}" width="100" height="3" fill="#000" opacity=".3"/>
</mask>
</defs>
<path opacity=".3" fill="url(#skyT-fill)" fill-rule="evenodd" mask="url(#skyT-mask)" d="${right.join('')}${left.join('')}${legs}"/>
</svg>`;
}

// Far skyline strips, faded toward the centre of the page.
function astanaSVG() {
  const r = rng(7);
  let d = '';
  let x = 0;
  while (x < 700) {
    const w = 10 + r() * 26;
    // Low blocks, with a few slim residential towers.
    let h = 10 + r() * 20;
    if (r() < 0.16 && x > 60 && (x < 400 || x > 560)) h = 38 + r() * 16;
    if (x > 400 && x < 560) h = 8 + r() * 10; // keep the tent clear
    d += `M${f(x)} 90V${f(90 - h)}H${f(x + w)}V90Z`;
    x += w + r() * 4;
  }
  // Khan Shatyr: a tilted transparent tent with a leaning mast.
  const k = 420;
  d += `M${k} 90C${k + 26} 82 ${k + 52} 58 ${k + 70} 22L${k + 66} 4L${k + 74} 20C${k + 82} 44 ${k + 96} 72 ${k + 116} 90Z`;
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 700 90" preserveAspectRatio="xMinYMax meet">
<defs>
<linearGradient id="skyA-fade" x1="0" x2="1" y1="0" y2="0"><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="skyA-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="90"><rect width="700" height="90" fill="url(#skyA-fade)"/></mask>
</defs>
<path opacity=".12" fill="#6A98B8" mask="url(#skyA-mask)" d="${d}"/>
</svg>`;
}

function tokyoSVG() {
  const r = rng(29);
  let d = '';
  let x = 0;
  while (x < 800) {
    const w = 6 + r() * 18;
    const t = x / 800; // taller, denser toward the right edge
    let h = 8 + r() * (16 + t * 22);
    if (r() < 0.1 + t * 0.12) h = 34 + r() * (18 + t * 18);
    d += `M${f(x)} 90V${f(90 - h)}H${f(x + w)}V90Z`;
    if (h > 40 && r() < 0.5) d += `M${f(x + w * 0.5 - 0.6)} ${f(90 - h)}V${f(90 - h - 6 - r() * 8)}h1.2V${f(90 - h)}Z`;
    x += w + r() * 1.6;
  }
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 800 90" preserveAspectRatio="xMaxYMax meet">
<defs>
<linearGradient id="skyK-fade" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff"/></linearGradient>
<mask id="skyK-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="90"><rect width="800" height="90" fill="url(#skyK-fade)"/></mask>
</defs>
<path opacity=".12" fill="#6A98B8" mask="url(#skyK-mask)" d="${d}"/>
</svg>`;
}

const PLANE_SVG = `<svg xmlns="${SVG_NS}" viewBox="0 0 24 12"><path fill="#fff" d="M1.5 5.4H19.5Q23.5 6 19.5 6.6H1.5ZM9.6 5.6L7 .4H9L13.8 5.6ZM9.6 6.4L7 11.6H9L13.8 6.4ZM2.6 5.6L1.4 2.4H2.6L4.6 5.6ZM2.6 6.4L1.4 9.6H2.6L4.6 6.4Z"/></svg>`;

export const SKY_SVG = {
  baiterek: baiterekSVG(),
  skytree: skytreeSVG(),
  astana: astanaSVG(),
  tokyo: tokyoSVG(),
  plane: PLANE_SVG,
};

/* ------------------------------------------------------------------ */
/* Clouds                                                              */
/* ------------------------------------------------------------------ */

// Sizes are in CSS px at a 1440 px wide viewport and scale with the width.
interface CloudCfg {
  name: string
  seed: number
  perK: number
  y: [number, number]
  w: [number, number]
  h: [number, number]
  alpha: number
  wisp: boolean
  speed: number
  depth: number
}
type Puff = [number, number, number];

const CLOUD_LAYERS: CloudCfg[] = [
  { name: 'far', seed: 11, perK: 4, y: [0.04, 0.34], w: [140, 300], h: [40, 70], alpha: 0.26, wisp: true, speed: 4, depth: 2 },
  { name: 'mid', seed: 23, perK: 2.6, y: [0.1, 0.52], w: [220, 420], h: [54, 96], alpha: 0.6, wisp: false, speed: 8, depth: 6 },
  { name: 'near', seed: 37, perK: 1.3, y: [0.36, 0.86], w: [420, 720], h: [96, 160], alpha: 0.4, wisp: false, speed: 14, depth: 12 },
];

const RES = 0.5; // clouds are soft, half resolution is plenty

function puff(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.45, `rgba(${rgb},${a * 0.72})`);
  g.addColorStop(0.75, `rgba(${rgb},${a * 0.28})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function cloudShape(r: () => number, w: number, h: number, wisp: boolean): Puff[] {
  const puffs: Puff[] = [];
  // A continuous flat body along the base...
  const m = Math.max(3, Math.ceil(w / (h * 0.55)));
  for (let i = 0; i < m; i++) {
    const u = ((i + 0.5) / m - 0.5) * 2;
    const k = Math.sqrt(Math.max(0, 1 - u * u));
    puffs.push([u * w * 0.44, -h * 0.08, h * (0.32 + 0.3 * k) * (0.85 + 0.3 * r())]);
  }
  if (wisp) return puffs;
  // ...and billowing tops, highest around one or two off-centre crowns.
  const crowns = [(r() - 0.5) * 0.6, (r() - 0.5) * 1.1];
  const n = Math.round(5 + (w / h) * 2.2);
  for (let i = 0; i < n; i++) {
    const u = (((i + 0.2 + r() * 0.6) / n) - 0.5) * 1.7;
    let k = Math.max(0, 1 - u * u);
    for (const c of crowns) k = Math.max(k * 0.9, Math.exp(-Math.pow((u - c) / 0.32, 2)));
    const pr = h * (0.2 + 0.36 * k) * (0.8 + 0.4 * r());
    puffs.push([u * w * 0.46, -h * 0.62 * k - h * 0.06 * r(), pr]);
  }
  return puffs;
}

function drawCloud(ctx: CanvasRenderingContext2D, puffs: Puff[], x: number, y: number, alpha: number, wisp: boolean) {
  ctx.save();
  ctx.translate(x, y);
  if (wisp) ctx.scale(1.25, 0.55);
  // Cool shade on a flattened underside first, then white body and sunlit tops.
  ctx.save();
  ctx.scale(1, 0.55);
  for (const [px, py, pr] of puffs) puff(ctx, px, (py + pr * 0.5) / 0.55, pr * 1.05, '170,196,218', alpha * 0.38);
  ctx.restore();
  for (const [px, py, pr] of puffs) puff(ctx, px, py, pr, '252,253,255', alpha * 0.7);
  for (const [px, py, pr] of puffs) if (py < -pr * 0.2) puff(ctx, px - pr * 0.12, py - pr * 0.22, pr * 0.6, '255,255,255', alpha * 0.5);
  ctx.restore();
}

function paintLayer(canvas: HTMLCanvasElement, cfg: CloudCfg, W: number, H: number): number {
  const scale = Math.min(1.2, Math.max(0.55, W / 1440));
  const T = Math.round(Math.max(W, 1000 * scale + 400)); // repeat period
  const cssW = T + W;
  canvas.width = Math.ceil(cssW * RES);
  canvas.height = Math.ceil(H * RES);
  canvas.style.width = cssW + 'px';
  canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d');
  if (!ctx) return T;
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
  ctx.clearRect(0, 0, cssW, H);
  if ('filter' in ctx) ctx.filter = `blur(${cfg.wisp ? 2 : 3}px)`;
  const r = rng(cfg.seed);
  const count = Math.max(2, Math.round((T / 1000) * cfg.perK / Math.max(scale, 0.7)));
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.15 + r() * 0.7) / count) * T;
    const y = (cfg.y[0] + r() * (cfg.y[1] - cfg.y[0])) * H;
    const w = (cfg.w[0] + r() * (cfg.w[1] - cfg.w[0])) * scale;
    const h = (cfg.h[0] + r() * (cfg.h[1] - cfg.h[0])) * scale;
    const a = cfg.alpha * (0.75 + r() * 0.25);
    const shape = cloudShape(r, w, h, cfg.wisp);
    for (const off of [-T, 0, T]) {
      const cx = x + off;
      if (cx + w < 0 || cx - w > cssW) continue;
      drawCloud(ctx, shape, cx, y, a, cfg.wisp);
    }
  }
  return T;
}


/* ------------------------------------------------------------------ */
/* Time of day (interim: day -> golden hour -> night by recolouring)    */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const SKY_KEYS = ['--sky-top', '--sky-high', '--sky-mid', '--sky-low', '--sky-horizon'] as const;
// day, golden hour, night
const SKY_STOPS: RGB[][] = [
  ['#0E5C98', '#1A7FBE', '#2FA3CF', '#8FCDE2', '#E3F0F0'].map(hex),
  ['#2A3F78', '#4F5C97', '#B47A86', '#EFA163', '#FFD9A1'].map(hex),
  ['#060F26', '#0A1A3A', '#112A52', '#1E3D66', '#2F4F78'].map(hex),
];
const HAZE: RGB[] = [[255, 214, 172], [255, 168, 96], [255, 186, 120]];
const mix = (a: RGB, b: RGB, k: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * k)) as RGB;
const pick = (stops: RGB[], t: number): RGB => (t <= 0.5 ? mix(stops[0], stops[1], t / 0.5) : mix(stops[1], stops[2], (t - 0.5) / 0.5));

/* ------------------------------------------------------------------ */
/* initSky                                                             */
/* ------------------------------------------------------------------ */

export interface SkyHandle {
  destroy(): void
  setTime?(t: number): void
}

export function initSky(el: HTMLElement | null): SkyHandle {
  if (!el || el.dataset.skyLive) return { destroy() {} };
  el.dataset.skyLive = '1';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const added: HTMLElement[] = [];
  const layers: HTMLElement[] = [];

  const make = (cls: string, html?: string): HTMLElement => {
    const d = document.createElement('div');
    d.className = cls;
    if (html) d.innerHTML = html;
    el.appendChild(d);
    added.push(d);
    return d;
  };

  // Back to front.
  const clouds: Record<string, { cfg: CloudCfg; canvas: HTMLCanvasElement; T: number; anim: Animation | null }> = {};
  const addClouds = (cfg: CloudCfg) => {
    const layer = make(`sky__layer sky__clouds sky__clouds--${cfg.name}`);
    const canvas = document.createElement('canvas');
    layer.appendChild(canvas);
    layer.dataset.depth = String(cfg.depth);
    layers.push(layer);
    clouds[cfg.name] = { cfg, canvas, T: 0, anim: null };
  };

  addClouds(CLOUD_LAYERS[0]);
  const flight = make(
    'sky__layer sky__flight',
    `<div class="sky__route"><div class="sky__track"><span class="sky__trail"></span><span class="sky__plane">${PLANE_SVG}</span></div></div>`
  );
  flight.dataset.depth = '3';
  layers.push(flight);

  const city = make(
    'sky__layer sky__city',
    `<div class="sky__skyline sky__skyline--astana">${SKY_SVG.astana}</div><div class="sky__skyline sky__skyline--tokyo">${SKY_SVG.tokyo}</div>`
  );
  city.dataset.depth = '3';
  layers.push(city);

  const towers = make(
    'sky__layer sky__towers',
    `<div class="sky__tower sky__tower--baiterek">${SKY_SVG.baiterek}</div><div class="sky__tower sky__tower--skytree">${SKY_SVG.skytree}</div>`
  );
  towers.dataset.depth = '5';
  layers.push(towers);

  addClouds(CLOUD_LAYERS[1]);
  addClouds(CLOUD_LAYERS[2]);

  el.classList.add('is-live');

  /* Clouds: paint, then drift with compositor-only transform animations. */
  let lastW = 0;
  let lastH = 0;
  const paint = () => {
    const W = el.clientWidth || window.innerWidth;
    const H = el.clientHeight || window.innerHeight;
    if (Math.abs(W - lastW) < 2 && Math.abs(H - lastH) < H * 0.15) return;
    lastW = W;
    lastH = H;
    for (const key in clouds) {
      const c = clouds[key];
      c.T = paintLayer(c.canvas, c.cfg, W, H);
      if (c.anim) c.anim.cancel();
      c.anim = null;
      const start = -c.T * (0.2 + 0.6 * rng(c.cfg.seed)());
      if (reduce.matches || typeof c.canvas.animate !== 'function') {
        c.canvas.style.transform = `translate3d(${start}px,0,0)`;
        continue;
      }
      c.canvas.style.transform = '';
      const duration = (c.T / c.cfg.speed) * 1000;
      c.anim = c.canvas.animate(
        [{ transform: `translate3d(${-c.T}px,0,0)` }, { transform: 'translate3d(0,0,0)' }],
        { duration, iterations: Infinity, easing: 'linear' }
      );
      c.anim.currentTime = ((start + c.T) / c.T) * duration;
    }
    if (document.hidden) pause();
  };

  /* Plane: every 20 s a far-away jet crosses from Astana toward Tokyo. */
  let planeAnim: Animation | null = null;
  const track = flight.querySelector('.sky__track') as HTMLElement;
  const startPlane = () => {
    if (planeAnim) planeAnim.cancel();
    planeAnim = null;
    if (reduce.matches || typeof track.animate !== 'function') return;
    planeAnim = track.animate(
      [
        { transform: 'translate3d(-100%,0,0)', opacity: 0, offset: 0 },
        { transform: 'translate3d(-96%,0,0)', opacity: 1, offset: 0.03 },
        { transform: 'translate3d(0,0,0)', opacity: 1, offset: 0.72 },
        { transform: 'translate3d(0,0,0)', opacity: 0, offset: 0.9 },
        { transform: 'translate3d(0,0,0)', opacity: 0, offset: 1 },
      ],
      { duration: 20000, iterations: Infinity, delay: 2500 }
    );
  };

  const pause = () => {
    for (const k in clouds) clouds[k].anim?.pause();
    planeAnim?.pause();
    stopLoop();
  };
  const resume = () => {
    for (const k in clouds) clouds[k].anim?.play();
    planeAnim?.play();
  };
  const onVisibility = () => (document.hidden ? pause() : resume());

  /* Pointer parallax (mouse only, never on touch, off for reduced motion). */
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    for (const l of layers) {
      const d = Number(l.dataset.depth) || 0;
      l.style.transform = `translate3d(${f(cx * d)}px,${f(cy * d * 0.5)}px,0)`;
    }
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(loop) : 0;
  };
  function stopLoop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduce.matches || document.hidden) return;
    tx = (e.clientX / window.innerWidth - 0.5) * -1;
    ty = (e.clientY / window.innerHeight - 0.5) * -1;
    if (!raf) raf = requestAnimationFrame(loop);
  };
  const onLeave = () => {
    tx = 0;
    ty = 0;
    if (!raf && !reduce.matches) raf = requestAnimationFrame(loop);
  };

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(paint, 180);
  };
  const onMotionPref = () => {
    lastW = 0;
    paint();
    startPlane();
    if (reduce.matches) {
      tx = ty = cx = cy = 0;
      stopLoop();
      for (const l of layers) l.style.transform = '';
    }
  };

  paint();
  startPlane();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize, { passive: true });
  if (finePointer.matches) {
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
  }
  reduce.addEventListener('change', onMotionPref);


  let lastT = -1;
  const setTime = (tIn: number) => {
    const t = Math.min(1, Math.max(0, +tIn || 0));
    if (Math.abs(t - lastT) < 0.002) return;
    lastT = t;
    const st = el.style;
    SKY_KEYS.forEach((k, i) => st.setProperty(k, `rgb(${pick(SKY_STOPS.map((s) => s[i]), t).join(',')})`));
    st.setProperty('--sky-haze', pick(HAZE, t).join(', '));
    const night = Math.max(0, (t - 0.5) / 0.5);
    const warm = 1 - Math.abs(t - 0.5) / 0.5;
    const shade = `brightness(${f(1 - night * 0.62)}) sepia(${f(Math.max(0, warm) * 0.35)})`;
    for (const l of layers) l.style.filter = t < 0.01 ? '' : shade;
    el.dataset.skyPhase = t < 0.3 ? 'day' : t < 0.72 ? 'dusk' : 'night';
  };

  return {
    setTime,
    destroy() {
      stopLoop();
      clearTimeout(resizeTimer);
      for (const k in clouds) clouds[k].anim?.cancel();
      planeAnim?.cancel();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      reduce.removeEventListener('change', onMotionPref);
      for (const n of added) n.remove();
      el.classList.remove('is-live');
      delete el.dataset.skyLive;
    },
  };
}
