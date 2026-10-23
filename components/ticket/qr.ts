// QR encoder for the boarding pass stub: byte mode, ECC level M, versions 1-5.
// Ported from the approved mockup (mock-ticket2/ticket.js). Deterministic, no dependencies.

const QR_SPEC: Record<number, [number, number, [number, number], [number, number]]> = {
  // version: [total codewords, ec per block, [blocks group1, data per block], [blocks group2, data per block]]
  1: [26, 10, [1, 16], [0, 0]],
  2: [44, 16, [1, 28], [0, 0]],
  3: [70, 26, [1, 44], [0, 0]],
  4: [100, 18, [2, 32], [0, 0]],
  5: [134, 24, [2, 43], [2, 44]],
};
const QR_ALIGN: Record<number, number[]> = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30] };

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) { GF_EXP[i] = x; GF_LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
const gfMul = (a: number, b: number): number => (a && b ? GF_EXP[GF_LOG[a] + GF_LOG[b]] : 0);

function rsGenerator(deg: number): number[] {
  let g: number[] = [1];
  for (let i = 0; i < deg; i++) {
    const n: number[] = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) { n[j] ^= g[j]; n[j + 1] ^= gfMul(g[j], GF_EXP[i]); }
    g = n;
  }
  return g;
}
function rsRemainder(data: number[], deg: number): number[] {
  const gen = rsGenerator(deg);
  const res: number[] = new Array(deg).fill(0);
  for (const b of data) {
    const f = b ^ (res.shift() as number); res.push(0);
    for (let i = 0; i < deg; i++) res[i] ^= gfMul(gen[i + 1], f);
  }
  return res;
}

export function qrMatrix(text: string): boolean[][] {
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
  const bits: number[] = [];
  const put = (val: number, len: number) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, dataCap * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < dataCap; pad ^= 0xec ^ 0x11) data.push(pad);

  // blocks + interleave
  const blocks: { d: number[]; e: number[] }[] = []; let k = 0;
  for (const [n, len] of [g1, g2]) for (let b = 0; b < n; b++) { const d = data.slice(k, k + len); k += len; blocks.push({ d, e: rsRemainder(d, ecLen) }); }
  const code: number[] = [];
  const maxD = Math.max(...blocks.map((b) => b.d.length));
  for (let i = 0; i < maxD; i++) for (const b of blocks) if (i < b.d.length) code.push(b.d[i]);
  for (let i = 0; i < ecLen; i++) for (const b of blocks) code.push(b.e[i]);

  const size = ver * 4 + 17;
  const m: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x: number, y: number, dark: boolean) => { m[y][x] = dark; fn[y][x] = true; };

  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx: number, cy: number) => {
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
  const drawFormat = (mask: number) => {
    const d = (0 << 3) | mask; // ECC M = 00
    let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const f = ((d << 10) | r) ^ 0x5412;
    const bit = (i: number) => ((f >>> i) & 1) === 1;
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

  const maskFn: Array<(x: number, y: number) => boolean> = [
    (x: number, y: number) => (x + y) % 2 === 0, (x: number, y: number) => y % 2 === 0, (x: number) => x % 3 === 0, (x: number, y: number) => (x + y) % 3 === 0,
    (x: number, y: number) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const applyMask = (k: number) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && maskFn[k](x, y)) m[y][x] = !m[y][x]; };
  const penalty = () => {
    let p = 0;
    const line = (get: (a: number, b: number) => boolean) => {
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
    line((a: number, b: number) => m[a][b]); line((a: number, b: number) => m[b][a]);
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
