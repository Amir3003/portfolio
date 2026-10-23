// Animated sky over the flight from Astana to Tokyo: Baiterek and the Astana skyline on the
// left, Tokyo Tower in front of Mt Fuji and the Tokyo skyline on the right.
// Ported from the approved mockup (design/mock-ticket/sky.js). No dependencies. Usage:
//   import { initSky } from './sky-engine';
//   const sky = initSky(document.querySelector('.sky'));
//   sky.setTime(t); // 0 day, 0.5 golden hour, 1 night. Cheap: only writes CSS variables.
//   sky.destroy();  // removes everything initSky added
// Without JS, sky.css alone paints the daytime sky, static clouds and both silhouettes.
//
// Time of day is a cross-fade: every scene element is pre-rendered once as a day, a golden
// hour and a night variant, and setTime only moves two CSS variables (--sky-dusk and
// --sky-night) that drive their opacities, plus one CSS filter that tints the cloud canvases.

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
const smoothstep = (a: number, b: number, x: number): number => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/* ------------------------------------------------------------------ */
/* Palettes: day, golden hour, night                                   */
/* ------------------------------------------------------------------ */

type Phase = 'day' | 'dusk' | 'night';
const PHASES: Phase[] = ['day', 'dusk', 'night'];

interface BaiterekPalette {
  mast: string; ball: string[]; ballLine: string; col: string; colShade: string; colMid: string;
  win: string; legs: string; base1: string; base2: string; glow: string | null;
}
interface TowerPalette {
  oL: string; oR: string; wL: string; wR: string; face: string; faceOp: number; lat: string; latOp: number;
  deck: string; deckShade: string; win: string; roof: string; lights: string | null; glow: string | null; tip: string;
}
interface SkylinePalette { fill: string; op: number; win: string | null }
interface FujiPalette { body: string; shade: string; op: number; cap: string; capShade: string; capOp: number }
interface SkylineData { d: string; win: string }
type Box = [number, number, number, number];

const BAITEREK: Record<Phase, BaiterekPalette> = {
  day: {
    mast: '#E3B56C', ball: ['#E0A35C', '#E9B86D', '#EFCB85', '#F5DFAE'], ballLine: '#C98F4E',
    col: '#C9DDF0', colShade: '#B2CAE4', colMid: '#BDD3EA', win: '#8AA5CB', legs: '#93ADD1',
    base1: '#8DA7CA', base2: '#7D98BF', glow: null,
  },
  dusk: {
    mast: '#F2C27A', ball: ['#E8964A', '#EFAA58', '#F5C070', '#F9D69A'], ballLine: '#C67A3C',
    col: '#EDD5D2', colShade: '#DCBDC1', colMid: '#E5CACB', win: '#A688A8', legs: '#B393AD',
    base1: '#AE8DAA', base2: '#9A7C9B', glow: null,
  },
  night: {
    mast: '#FFE2A2', ball: ['#F2A548', '#F7BA5A', '#FBCE76', '#FEE3A8'], ballLine: '#D68A34',
    col: '#3F5B84', colShade: '#334D75', colMid: '#3A557E', win: '#FFD38E', legs: '#263C61',
    base1: '#22385B', base2: '#1B2D4C', glow: '#FFC56A',
  },
};

const TOKYO_TOWER: Record<Phase, TowerPalette> = {
  day: {
    oL: '#EA8260', oR: '#DA6E4E', wL: '#F8F2EB', wR: '#E8E0DA', face: '#7A2E14', faceOp: 0.1,
    lat: '#8E3A1E', latOp: 0.3, deck: '#EEF1F5', deckShade: '#DAE1EA', win: '#98B0D0', roof: '#C9D3E1',
    lights: null, glow: null, tip: '#DC6A47',
  },
  dusk: {
    oL: '#E8653F', oR: '#C7533A', wL: '#FAD9C7', wR: '#E8BFB1', face: '#5C1E22', faceOp: 0.14,
    lat: '#6E2A26', latOp: 0.32, deck: '#F7D9CB', deckShade: '#E3C0B6', win: '#A3849F', roof: '#D6AFA9',
    lights: null, glow: null, tip: '#C7533A',
  },
  night: {
    oL: '#F6893F', oR: '#E36F32', wL: '#FFC783', wR: '#F6B06E', face: '#4A1300', faceOp: 0.2,
    lat: '#FFE3B5', latOp: 0.42, deck: '#F9C47F', deckShade: '#EDAE69', win: '#FFF6DA', roof: '#E8A25B',
    lights: '#FFF1D0', glow: '#FF8A3D', tip: '#FF5A3C',
  },
};

const SKYLINE: Record<Phase, SkylinePalette> = {
  day: { fill: '#6A98B8', op: 0.13, win: null },
  dusk: { fill: '#6C5888', op: 0.2, win: null },
  night: { fill: '#040B1D', op: 0.6, win: '#FFC877' },
};

const FUJI: Record<Phase, FujiPalette> = {
  day: { body: '#8DA9C7', shade: '#7F9DBE', op: 0.36, cap: '#FFFFFF', capShade: '#E3ECF5', capOp: 0.55 },
  dusk: { body: '#8E6E9A', shade: '#7E6290', op: 0.32, cap: '#FFDCCB', capShade: '#F1C3B9', capOp: 0.66 },
  night: { body: '#0C1A36', shade: '#0A1630', op: 0.55, cap: '#8597B8', capShade: '#6F82A6', capOp: 0.34 },
};

/* ------------------------------------------------------------------ */
/* Silhouettes (the day variants also feed the CSS fallback)           */
/* ------------------------------------------------------------------ */

// Baiterek, Astana. Flat vector after the owner's reference drawing: a stepped
// pedestal, a column whose lower part is split into dark leaves, a band of
// windows at the waist, a crown of pointed petals and the faceted golden sphere
// with its mast.
function baiterekSVG(p: BaiterekPalette, id: string): string {
  const glow = p.glow
    ? `<radialGradient id="${id}-glow" cx="372" cy="128" r="120" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="${p.glow}" stop-opacity=".5"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>`
    : '';
  const win = [368, 398, 428]
    .map((y) => [334, 355, 377, 398].map((x) => `<rect x="${x}" y="${y}" width="12" height="19"/>`).join(''))
    .join('');
  return `<svg xmlns="${SVG_NS}" viewBox="250 0 240 712" preserveAspectRatio="xMidYMax meet">
<defs>
<clipPath id="${id}-ball"><circle cx="372" cy="128" r="82"/></clipPath>${glow}
</defs>
${p.glow ? `<circle cx="372" cy="128" r="120" fill="url(#${id}-glow)"/>` : ''}
<rect x="371" y="8" width="2.4" height="52" fill="${p.mast}"/>
<g clip-path="url(#${id}-ball)">
<rect x="288" y="44" width="44" height="170" fill="${p.ball[0]}"/>
<rect x="332" y="44" width="40" height="170" fill="${p.ball[1]}"/>
<rect x="372" y="44" width="40" height="170" fill="${p.ball[2]}"/>
<rect x="412" y="44" width="44" height="170" fill="${p.ball[3]}"/>
<path d="M288 106H456V112H288ZM288 150H456V156H288Z" fill="${p.ballLine}" opacity=".35"/>
</g>
<path fill="${p.col}" d="M318 662L330 520C332 450 330 390 325 332C315 270 290 200 264 122L300 192L306 134L340 200L346 120L372 202L398 120L404 200L438 134L444 192L480 122C454 200 430 270 420 332C414 390 412 450 414 520L426 662Z"/>
<path fill="${p.colShade}" d="M325 332L346 200L356 336ZM420 332L398 200L388 336ZM360 336L372 214L384 336Z"/>
<path fill="${p.colMid}" d="M330 520C331 470 330 420 327 368H417C414 420 413 470 414 520Z"/>
<g fill="${p.win}">${win}</g>
<path fill="${p.legs}" d="M318 662L331 498L352 662ZM352 662L372 498L392 662ZM392 662L413 498L426 662Z"/>
<path fill="${p.base1}" d="M290 662H454L458 680H286Z"/>
<path fill="${p.base2}" d="M286 680H458L464 708H280Z"/>
</svg>`;
}

// Tokyo Tower, 333 m, drawn on Baiterek's 240 x 712 board so the pair match: four splayed
// legs joined by a low arch, a lattice that narrows to the two-storey main deck at 40 %,
// the small top deck at 75 % and the banded antenna. International orange with white bands.
const TT_CX = 120;
const TT_G = 708; // ground line
const TT_H = 700; // full height including the antenna
const ttY = (k: number): number => f(TT_G - k * TT_H);
function ttHW(k: number): number {
  if (k <= 0.385) return TT_H * (0.045 + 0.086 * Math.pow(1 - k / 0.385, 2));
  if (k <= 0.445) return TT_H * (0.045 + ((k - 0.385) / 0.06) * (0.038 - 0.045));
  if (k <= 0.745) return TT_H * (0.019 + 0.019 * Math.pow(1 - (k - 0.445) / 0.3, 1.25));
  if (k <= 0.775) return TT_H * (0.019 - ((k - 0.745) / 0.03) * 0.004);
  if (k <= 0.87) return TT_H * (0.015 - ((k - 0.775) / 0.095) * 0.0075);
  return 3 - ((k - 0.87) / 0.13) * 2.2;
}
// Inset of the darker lattice face from the outer edge (the legs stay lighter).
const ttInset = (k: number): number => (k < 0.4 ? 17 - (9 * (k - 0.1)) / 0.28 : 5.5 - (2 * (k - 0.445)) / 0.3);

function tokyoTowerSVG(p: TowerPalette, id: string): string {
  const x = (v: number): number => f(TT_CX + v);
  // Outline: right edge bottom to top, then the left edge back down.
  const ks: number[] = [];
  for (let k = 0; k < 0.385; k += 0.0175) ks.push(k);
  ks.push(0.385, 0.445);
  for (let k = 0.475; k < 0.745; k += 0.03) ks.push(k);
  ks.push(0.745, 0.775, 0.87);
  const right: [number, number][] = ks.map((k) => [ttHW(k), k]);
  right.push([3, 0.87], [0.8, 1]);
  const pts = right.map(([w, k]) => `${x(w)} ${ttY(k)}`);
  const ptsL = right.slice().reverse().map(([w, k]) => `${x(-w)} ${ttY(k)}`);
  const ya = ttY(0.09);
  const arch =
    `M${x(-68)} ${TT_G}C${x(-64)} ${ttY(0.045)} ${x(-40)} ${ya} ${x(0)} ${ya}` +
    `C${x(40)} ${ya} ${x(64)} ${ttY(0.045)} ${x(68)} ${TT_G}Z`;
  const outline = `M${pts.join('L')}L${ptsL.join('L')}Z${arch}`;

  // Colour bands: orange, with white bands between the decks and up the antenna.
  const white: [number, number][] = [[0.505, 0.6], [0.8, 0.825], [0.858, 0.878], [0.905, 0.925], [0.952, 0.972]];
  let bandsL = '';
  let bandsR = `<rect x="${TT_CX}" y="0" width="120" height="712" fill="${p.oR}"/>`;
  for (const [a, b] of white) {
    bandsL += `<rect x="0" y="${ttY(b)}" width="${TT_CX}" height="${f((b - a) * TT_H)}" fill="${p.wL}"/>`;
    bandsR += `<rect x="${TT_CX}" y="${ttY(b)}" width="120" height="${f((b - a) * TT_H)}" fill="${p.wR}"/>`;
  }

  // Lattice face (darker) between the legs, below and above the main deck.
  const facePoly = (k0: number, k1: number): string => {
    const a: string[] = [];
    const b: string[] = [];
    for (let i = 0; i <= 8; i++) {
      const k = k0 + ((k1 - k0) * i) / 8;
      const w = ttHW(k) - ttInset(k);
      a.push(`${x(w)} ${ttY(k)}`);
      b.unshift(`${x(-w)} ${ttY(k)}`);
    }
    return `M${a.join('L')}L${b.join('L')}Z`;
  };
  const face = facePoly(0.105, 0.385) + facePoly(0.445, 0.745);

  // Lattice hints: girders and one X per tier.
  let lat = '';
  const tier = (k0: number, k1: number, inset: boolean): void => {
    const w0 = ttHW(k0) - (inset ? ttInset(k0) : 0);
    const w1 = ttHW(k1) - (inset ? ttInset(k1) : 0);
    lat += `M${x(-w0)} ${ttY(k0)}L${x(w1)} ${ttY(k1)}M${x(w0)} ${ttY(k0)}L${x(-w1)} ${ttY(k1)}`;
    lat += `M${x(-ttHW(k1))} ${ttY(k1)}H${x(ttHW(k1))}`;
  };
  const tiers = (ks: number[], inset: boolean): void => {
    for (let i = 1; i < ks.length; i++) tier(ks[i - 1], ks[i], inset);
  };
  tiers([0.105, 0.17, 0.235, 0.305, 0.372], true);
  tiers([0.445, 0.52, 0.6, 0.675, 0.745], true);
  tiers([0.778, 0.825, 0.87], false);
  lat += `M${x(-ttHW(0.105))} ${ttY(0.105)}H${x(ttHW(0.105))}`;

  // Decks: a flat two-tone box per storey with a strip of windows.
  const box = (k0: number, k1: number, w0: number, w1: number): string => {
    const y0 = ttY(k0);
    const y1 = ttY(k1);
    return `<path fill="${p.deck}" d="M${x(-w0)} ${y0}L${x(-w1)} ${y1}H${x(0)}V${y0}Z"/><path fill="${p.deckShade}" d="M${x(0)} ${y0}V${y1}H${x(w1)}L${x(w0)} ${y0}Z"/>`;
  };
  const windows = (k0: number, k1: number, w: number, n: number): string => {
    let s = '';
    const step = (2 * w) / n;
    for (let i = 0; i < n; i++) s += `<rect x="${f(TT_CX - w + i * step + step * 0.18)}" y="${ttY(k1)}" width="${f(step * 0.64)}" height="${f((k1 - k0) * TT_H)}"/>`;
    return s;
  };
  const decks =
    // Main deck: brackets, two storeys, roof.
    `<path fill="${p.roof}" d="M${x(-31)} ${ttY(0.372)}L${x(-44)} ${ttY(0.385)}H${x(44)}L${x(31)} ${ttY(0.372)}Z"/>` +
    box(0.385, 0.408, 44, 44) +
    box(0.408, 0.433, 48, 48) +
    `<path fill="${p.roof}" d="M${x(-48)} ${ttY(0.433)}L${x(-30)} ${ttY(0.446)}H${x(30)}L${x(48)} ${ttY(0.433)}Z"/>` +
    `<g fill="${p.win}">${windows(0.392, 0.402, 40, 8)}${windows(0.415, 0.427, 44, 9)}</g>` +
    // Top deck.
    box(0.745, 0.758, 19, 19) +
    box(0.758, 0.773, 22, 22) +
    `<path fill="${p.roof}" d="M${x(-22)} ${ttY(0.773)}L${x(-12)} ${ttY(0.781)}H${x(12)}L${x(22)} ${ttY(0.773)}Z"/>` +
    `<g fill="${p.win}">${windows(0.762, 0.77, 19, 5)}</g>`;

  // Night: rows of warm bulbs along the legs, the girders and the arch, and a halo.
  let night = '';
  let defs = '';
  if (p.lights) {
    let dots = '';
    const dot = (cx: number, cy: number, r = 1.5): string => (dots += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${r}"/>`);
    for (let k = 0.012; k < 0.37; k += 0.022) {
      const w = ttHW(k) - 3;
      dot(TT_CX - w, TT_G - k * TT_H);
      dot(TT_CX + w, TT_G - k * TT_H);
    }
    for (let k = 0.46; k < 0.74; k += 0.026) {
      const w = ttHW(k) - 2;
      dot(TT_CX - w, TT_G - k * TT_H, 1.2);
      dot(TT_CX + w, TT_G - k * TT_H, 1.2);
    }
    for (const k of [0.105, 0.17, 0.235, 0.305]) {
      const w = ttHW(k) - 6;
      for (let v = -w; v <= w + 0.1; v += (2 * w) / Math.max(2, Math.round(w / 9))) dot(TT_CX + v, TT_G - k * TT_H, 1.3);
    }
    for (let i = 1; i < 12; i++) {
      const a = Math.PI * (i / 12);
      dot(TT_CX - Math.cos(a) * 62, TT_G - Math.sin(a) * 0.09 * TT_H * 0.94 - 2, 1.3);
    }
    defs =
      `<radialGradient id="${id}-glow"><stop offset="0" stop-color="${p.glow}" stop-opacity=".34"/><stop offset=".55" stop-color="${p.glow}" stop-opacity=".12"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="${id}-deck"><stop offset="0" stop-color="#FFF1CF" stop-opacity=".6"/><stop offset="1" stop-color="#FFF1CF" stop-opacity="0"/></radialGradient>`;
    night =
      `<g fill="${p.lights}">${dots}</g>` +
      `<ellipse cx="120" cy="${ttY(0.41)}" rx="80" ry="34" fill="url(#${id}-deck)"/>` +
      `<ellipse cx="120" cy="${ttY(0.765)}" rx="40" ry="20" fill="url(#${id}-deck)"/>` +
      `<circle cx="120" cy="${ttY(1) + 1}" r="2.4" fill="${p.tip}"/>`;
  }

  return `<svg xmlns="${SVG_NS}" viewBox="0 0 240 712" preserveAspectRatio="xMidYMax meet">
<defs>
<clipPath id="${id}-c"><path clip-rule="evenodd" d="${outline}"/></clipPath>${defs}
</defs>
${p.glow ? `<ellipse cx="120" cy="${ttY(0.4)}" rx="118" ry="300" fill="url(#${id}-glow)"/>` : ''}
<path fill="${p.oL}" fill-rule="evenodd" d="${outline}"/>
<g clip-path="url(#${id}-c)">
${bandsR}${bandsL}
<path fill="${p.face}" opacity="${p.faceOp}" d="${face}"/>
<path fill="none" stroke="${p.lat}" stroke-width="1.5" opacity="${p.latOp}" d="${lat}"/>
</g>
${decks}${night}
</svg>`;
}

// Mt Fuji: wide and low, with a snow cap and a soft shaded right flank.
function fujiSVG(p: FujiPalette, id: string): string {
  const body = 'M0 160C110 150 200 118 262 74C282 58 294 42 302 28L310 25L318 28L326 25L334 29C344 44 358 60 380 76C440 120 520 150 640 160Z';
  const cap =
    'M180 112L206 99L216 103L230 92L240 99L252 88L262 96L276 80L286 90L298 74L306 84L318 70L326 82L338 76L348 90L360 84L372 97L384 90L398 101L414 98L460 112V0H180Z';
  const shade = 'M318 28C328 70 330 110 300 160H640C520 150 440 120 380 76C358 60 344 44 334 29Z';
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 640 160" preserveAspectRatio="xMidYMax meet">
<defs><clipPath id="${id}-c"><path d="${body}"/></clipPath><clipPath id="${id}-k"><path d="${cap}"/></clipPath></defs>
<g opacity="${p.op}"><path fill="${p.body}" d="${body}"/><path fill="${p.shade}" clip-path="url(#${id}-c)" d="${shade}"/></g>
<g opacity="${p.capOp}" clip-path="url(#${id}-c)"><path fill="${p.cap}" d="${cap}"/><path fill="${p.capShade}" clip-path="url(#${id}-k)" d="M318 20C328 56 334 90 330 120H460V20Z"/></g>
</svg>`;
}

// Window dots for lit buildings: [x, top, width, height] boxes in, one path out.
function windowDots(boxes: Box[], r: () => number, density: number): string {
  let d = '';
  for (const [x, top, w, h] of boxes) {
    if (h < 12 || w < 6) continue;
    for (let yy = top + 3; yy < top + h - 3; yy += 4.2) {
      for (let xx = x + 2; xx < x + w - 2.4; xx += 3.4) if (r() < density) d += `M${f(xx)} ${f(yy)}h1.3v1.7h-1.3Z`;
    }
  }
  return d;
}

// Far Astana skyline: low blocks and a few towers, the tilted tent of Khan Shatyr and the
// Nur Alem sphere of EXPO 2017. Faded toward the centre of the page.
function astanaData(): SkylineData {
  const r = rng(7);
  const G = 120;
  let d = '';
  const boxes: Box[] = [];
  const block = (x: number, w: number, h: number): void => {
    d += `M${f(x)} ${G}V${f(G - h)}H${f(x + w)}V${G}Z`;
    boxes.push([x, G - h, w, h]);
  };
  let x = 0;
  while (x < 700) {
    const w = 10 + r() * 24;
    let h = 10 + r() * 18;
    if (x > 330 && x < 460) h = 6 + r() * 8; // keep the tent clear
    if (x > 500 && x < 556) h = 8 + r() * 6; // and the sphere
    block(x, w, h);
    x += w + r() * 4;
  }
  // A few slim towers.
  for (const [tx, tw, th] of [[236, 12, 58], [262, 9, 72], [282, 14, 50], [312, 10, 64], [478, 12, 60], [574, 11, 54], [600, 9, 66], [640, 12, 46]]) {
    block(tx, tw, th);
    d += `M${f(tx + tw / 2 - 0.6)} ${f(G - th)}V${f(G - th - 7)}h1.2V${f(G - th)}Z`;
  }
  // Khan Shatyr: a tilted transparent tent with a leaning mast.
  const k = 344;
  d += `M${k} ${G}C${k + 28} ${G - 10} ${k + 56} ${G - 40} ${k + 74} ${G - 82}L${k + 70} ${G - 102}L${k + 79} ${G - 84}C${k + 88} ${G - 54} ${k + 102} ${G - 22} ${k + 124} ${G}Z`;
  // Nur Alem: a glass sphere on a short drum.
  d += `M516 ${G}V${G - 14}H544V${G}Z`;
  d += `M530 ${G - 14}m-21 -19a21 21 0 1 0 42 0a21 21 0 1 0 -42 0Z`;
  const wr = rng(71);
  return { d, win: windowDots(boxes, wr, 0.2) + windowDots([[512, G - 44, 36, 24]], wr, 0.35) };
}

function astanaSVG(p: SkylinePalette, id: string, data: SkylineData): string {
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 700 120" preserveAspectRatio="xMinYMax meet">
<defs>
<linearGradient id="${id}-fade" x1="0" x2="1" y1="0" y2="0"><stop offset=".6" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="700" height="120"><rect width="700" height="120" fill="url(#${id}-fade)"/></mask>
</defs>
<g mask="url(#${id}-m)"><path opacity="${p.op}" fill="${p.fill}" d="${data.d}"/>${p.win ? `<path opacity=".75" fill="${p.win}" d="${data.win}"/>` : ''}</g>
</svg>`;
}

function tokyoData(): SkylineData {
  const r = rng(29);
  let d = '';
  const boxes: Box[] = [];
  let x = 0;
  while (x < 800) {
    const w = 6 + r() * 18;
    const t = x / 800; // taller, denser toward the right edge
    let h = 8 + r() * (16 + t * 22);
    if (r() < 0.1 + t * 0.12) h = 34 + r() * (18 + t * 18);
    d += `M${f(x)} 90V${f(90 - h)}H${f(x + w)}V90Z`;
    boxes.push([x, 90 - h, w, h]);
    if (h > 40 && r() < 0.5) d += `M${f(x + w * 0.5 - 0.6)} ${f(90 - h)}V${f(90 - h - 6 - r() * 8)}h1.2V${f(90 - h)}Z`;
    x += w + r() * 1.6;
  }
  return { d, win: windowDots(boxes, rng(31), 0.22) };
}

function tokyoSVG(p: SkylinePalette, id: string, data: SkylineData): string {
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 800 90" preserveAspectRatio="xMaxYMax meet">
<defs>
<linearGradient id="${id}-fade" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff"/></linearGradient>
<mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="90"><rect width="800" height="90" fill="url(#${id}-fade)"/></mask>
</defs>
<g mask="url(#${id}-m)"><path opacity="${p.op}" fill="${p.fill}" d="${data.d}"/>${p.win ? `<path opacity=".75" fill="${p.win}" d="${data.win}"/>` : ''}</g>
</svg>`;
}

// Night sky: a fixed field of small stars, no twinkle.
function starsSVG(): string {
  const r = rng(53);
  let d = '';
  let bright = '';
  for (let i = 0; i < 170; i++) {
    const x = r() * 1440;
    const y = Math.pow(r(), 1.5) * 620;
    const s = 0.5 + r() * 0.8;
    if (r() < 0.1) bright += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s + 0.5)}"/>`;
    else d += `M${f(x)} ${f(y)}m-${f(s)} 0a${f(s)} ${f(s)} 0 1 0 ${f(2 * s)} 0a${f(s)} ${f(s)} 0 1 0 -${f(2 * s)} 0Z`;
  }
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice"><path fill="#DCE6FF" opacity=".6" d="${d}"/><g fill="#F4F2FF" opacity=".9">${bright}</g></svg>`;
}

const MOON_SVG = `<svg xmlns="${SVG_NS}" viewBox="0 0 40 40"><defs><mask id="skyM-m"><rect width="40" height="40" fill="#fff"/><circle cx="27" cy="15" r="13" fill="#000"/></mask></defs><circle cx="20" cy="20" r="14" fill="#F6EED6" mask="url(#skyM-m)"/></svg>`;

const PLANE_SVG = `<svg xmlns="${SVG_NS}" viewBox="0 0 24 12"><path fill="#fff" d="M1.5 5.4H19.5Q23.5 6 19.5 6.6H1.5ZM9.6 5.6L7 .4H9L13.8 5.6ZM9.6 6.4L7 11.6H9L13.8 6.4ZM2.6 5.6L1.4 2.4H2.6L4.6 5.6ZM2.6 6.4L1.4 9.6H2.6L4.6 6.4Z"/></svg>`;

const ASTANA_DATA = astanaData();
const TOKYO_DATA = tokyoData();

type Art = Record<Phase, string>;
const variants = (fn: (ph: Phase) => string): Art => ({ day: fn('day'), dusk: fn('dusk'), night: fn('night') });

export const SKY_ART = {
  baiterek: variants((ph) => baiterekSVG(BAITEREK[ph], `skyB-${ph}`)),
  tokyoTower: variants((ph) => tokyoTowerSVG(TOKYO_TOWER[ph], `skyT-${ph}`)),
  fuji: variants((ph) => fujiSVG(FUJI[ph], `skyF-${ph}`)),
  astana: variants((ph) => astanaSVG(SKYLINE[ph], `skyA-${ph}`, ASTANA_DATA)),
  tokyo: variants((ph) => tokyoSVG(SKYLINE[ph], `skyK-${ph}`, TOKYO_DATA)),
};

// Day silhouettes, used for the no-JS fallback in sky.css.
export const SKY_SVG = {
  baiterek: SKY_ART.baiterek.day,
  tokyoTower: SKY_ART.tokyoTower.day,
  fuji: SKY_ART.fuji.day,
  astana: SKY_ART.astana.day,
  tokyo: SKY_ART.tokyo.day,
  plane: PLANE_SVG,
};

const stack = (art: Art): string => PHASES.map((ph) => `<div class="sky__v sky__v--${ph}">${art[ph]}</div>`).join('');

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
/* Time of day                                                         */
/* ------------------------------------------------------------------ */

// Cloud tint per phase as [brightness, sepia, saturate, hue-rotate]: warm at golden hour,
// dark blue-grey at night (the hue keeps turning the same way so the blend stays smooth).
const CLOUD_TINT: number[][] = [
  [1, 0, 1, 0],
  [0.97, 0.55, 1.9, -22],
  [0.4, 0.6, 1.25, -192],
];

function cloudFilter(dusk: number, night: number): string {
  if (dusk < 0.005) return 'none';
  const v = CLOUD_TINT[0].map((a, i) => {
    const b = a + (CLOUD_TINT[1][i] - a) * dusk;
    return b + (CLOUD_TINT[2][i] - b) * night;
  });
  return `brightness(${f(v[0])}) sepia(${f(v[1])}) saturate(${f(v[2])}) hue-rotate(${Math.round(v[3])}deg)`;
}

/* ------------------------------------------------------------------ */
/* initSky                                                             */
/* ------------------------------------------------------------------ */

export interface SkyHandle {
  destroy(): void
  setTime?(t: number): void
}

export function initSky(el: HTMLElement | null): SkyHandle {
  if (!el || el.dataset.skyLive) return { destroy() {}, setTime() {} };
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

  // Back to front: time-of-day sky tints, stars and moon, clouds, plane, city, towers.
  make('sky__tint sky__tint--dusk');
  make('sky__tint sky__tint--night');
  make('sky__night', `<div class="sky__stars">${starsSVG()}</div><div class="sky__moon">${MOON_SVG}</div>`);

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
    `<div class="sky__route"><div class="sky__track"><span class="sky__trail"></span><span class="sky__plane">${PLANE_SVG}<i class="sky__beacon"></i></span></div></div>`
  );
  flight.dataset.depth = '3';
  layers.push(flight);

  const city = make(
    'sky__layer sky__city',
    `<div class="sky__fuji sky__mix">${stack(SKY_ART.fuji)}</div>` +
      `<div class="sky__skyline sky__skyline--astana sky__mix">${stack(SKY_ART.astana)}</div>` +
      `<div class="sky__skyline sky__skyline--tokyo sky__mix">${stack(SKY_ART.tokyo)}</div>`
  );
  city.dataset.depth = '3';
  layers.push(city);

  addClouds(CLOUD_LAYERS[1]);
  addClouds(CLOUD_LAYERS[2]);

  const towers = make(
    'sky__layer sky__towers',
    `<div class="sky__tower sky__tower--baiterek">${stack(SKY_ART.baiterek)}</div>` +
      `<div class="sky__tower sky__tower--tokyo">${stack(SKY_ART.tokyoTower)}</div>`
  );
  towers.dataset.depth = '5';
  layers.push(towers);

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
    el.classList.add('is-paused');
    stopLoop();
  };
  const resume = () => {
    for (const k in clouds) clouds[k].anim?.play();
    planeAnim?.play();
    el.classList.remove('is-paused');
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

  /* Time of day: two opacities and one cloud filter, written only when they change. */
  let lastT = -1;
  let lastFilter = 'none';
  let lastPhase = '';
  const setTime = (tIn: number) => {
    const t = Math.min(1, Math.max(0, +tIn || 0));
    if (Math.abs(t - lastT) < 0.002) return;
    lastT = t;
    const dusk = smoothstep(0.04, 0.5, t);
    const night = smoothstep(0.52, 0.94, t);
    const st = el.style;
    st.setProperty('--sky-dusk', String(f(dusk * 1000) / 1000));
    st.setProperty('--sky-night', String(f(night * 1000) / 1000));
    const filter = cloudFilter(dusk, night);
    if (filter !== lastFilter) {
      lastFilter = filter;
      st.setProperty('--sky-cloud-filter', filter);
    }
    const phase = t < 0.3 ? 'day' : t < 0.72 ? 'dusk' : 'night';
    if (phase !== lastPhase) {
      lastPhase = phase;
      el.dataset.skyPhase = phase;
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
      el.classList.remove('is-live', 'is-paused');
      for (const p of ['--sky-dusk', '--sky-night', '--sky-cloud-filter']) el.style.removeProperty(p);
      delete el.dataset.skyLive;
      delete el.dataset.skyPhase;
    },
  };
}
