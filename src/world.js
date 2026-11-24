// Terrain grid: generation, damage, and destruction. Pure data — rendering lives in render.js.
import { CELL, WORLD_W, WORLD_H, CHUNK, T, MATERIAL, RINGS, LUMEN_D, LUMEN_CUT, LUMEN_SALT, VAULT_COUNT, VAULT_D, VAULT_GAP, VAULT_TRIES } from './config.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// S-5 / D-025: one independent stream per gameplay draw, keyed by world seed + a salt name, so draws never shift each
// other (an extra pickup roll can't change where the next Glitch spawns). FNV-1a over the salt, mixed with the seed.
export function seededStream(seed, salt) {
  let h = 0x811c9dc5 ^ (seed >>> 0);
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 0x01000193);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return mulberry32((h ^ (h >>> 16)) >>> 0);
}

function makeNoise(seed) {
  const rand = mulberry32(seed);
  const SIZE = 256;
  const table = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < table.length; i++) table[i] = rand();
  const at = (x, y) => table[((y & 255) << 8) | (x & 255)];
  const smooth = t => t * t * (3 - 2 * t);
  const value = (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = smooth(x - x0), fy = smooth(y - y0);
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
  };
  return (x, y) => value(x, y) * 0.65 + value(x * 2.1 + 17.3, y * 2.1 + 5.9) * 0.35;
}

// S-9 vault templates (7×7): '#' shell (T.VAULT), '.' hollow, 'C' cache (T.CACHE), ' ' leave the generated cell alone.
const VAULT_TEMPLATES = [
  ['   #   ', '  #.#  ', ' #...# ', '#..C..#', ' #...# ', '  #.#  ', '   #   '], // diamond
  ['  ###  ', ' #...# ', '#.....#', '#..C..#', '#.....#', ' #...# ', '  ###  '], // hexagon
  ['  ###  ', '  #.#  ', '###.###', '#..C..#', '###.###', '  #.#  ', '  ###  '], // cross
];

/** S-9: where a seed's vaults go. Depends on the seed alone (not on terrain), so the save upgrade can find them too.
 *  Returns [{ x, y, kind, cells: [cell index, ...] }] where cells are the indices the template writes. */
export function vaultSites(seed, w = WORLD_W, h = WORLD_H) {
  const rand = seededStream(seed, 'vault'), sites = [];
  for (let t = 0; t < VAULT_TRIES && sites.length < VAULT_COUNT; t++) {
    const a = rand() * Math.PI * 2, d = VAULT_D[0] + rand() * (VAULT_D[1] - VAULT_D[0]), kind = Math.floor(rand() * VAULT_TEMPLATES.length);
    const x = Math.floor(w / 2 + Math.cos(a) * d), y = Math.floor(h / 2 + Math.sin(a) * d);
    if (x - 3 < 2 || y - 3 < 2 || x + 3 > w - 3 || y + 3 > h - 3) continue; // footprint stays inside the bedrock border
    if (sites.some(v => Math.hypot(v.x - x, v.y - y) < VAULT_GAP)) continue;
    const cells = [];
    VAULT_TEMPLATES[kind].forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ' ') cells.push((y - 3 + j) * w + (x - 3 + i)); }));
    sites.push({ x, y, kind, cells });
  }
  return sites;
}

// Cells the beam can never break (it sparks, no crack): the border, and a Spire's core + facets (S-19, D-049).
export const UNBREAKABLE = new Set([T.BEDROCK, T.SPIRE, T.FACET]);

export class World {
  /** `vaultSkip`: indices into vaultSites(seed) never stamped (D-023: an old save had already seen that ground). */
  constructor(seed, vaultSkip = []) {
    this.seed = seed;
    this.w = WORLD_W;
    this.h = WORLD_H;
    this.cells = new Uint8Array(this.w * this.h);
    this.damage = new Float32Array(this.w * this.h);
    this.broken = new Uint8Array(this.w * this.h);   // 1 = originally solid, now mined
    this.explored = new Uint8Array(this.w * this.h);
    this.chunksW = Math.ceil(this.w / CHUNK);
    this.chunksH = Math.ceil(this.h / CHUNK);
    this.dirtyChunks = new Set();
    this.listeners = [];
    this.breaks = 0; // S-42: count of destroyed cells (the Echo rebuilds its field when it moves)
    this.rings = new Uint8Array(this.w * this.h); // S-8: ring index per cell, fixed by distance alone
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const d = Math.hypot(x + 0.5 - this.cx, y + 0.5 - this.cy);
      let r = 0;
      while (r + 1 < RINGS.length && d >= RINGS[r + 1].r0) r++;
      this.rings[y * this.w + x] = r;
    }
    this.generate();
    this.vaults = vaultSites(seed, this.w, this.h).filter((_, i) => !vaultSkip.includes(i));
    for (const v of this.vaults) this.stampVault(v);
  }

  stampVault(v) {
    const rows = VAULT_TEMPLATES[v.kind];
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) {
      const ch = rows[j][i];
      if (ch !== ' ') this.cells[(v.y - 3 + j) * this.w + (v.x - 3 + i)] = ch === '#' ? T.VAULT : ch === 'C' ? T.CACHE : T.EMPTY;
    }
  }

  /** S-8: depth ring index (0 Hearth, 1 Veil, 2 Deep) of a cell; out-of-bounds counts as the outermost ring. */
  ring(x, y) { return this.inBounds(x, y) ? this.rings[y * this.w + x] : RINGS.length - 1; }
  /** Hit points of a cell type at (x, y): rings toughen only ROCK and DENSE (D-022). */
  hpAt(x, y, type) {
    const hp = MATERIAL[type].hp;
    return type === T.ROCK || type === T.DENSE ? hp * RINGS[this.ring(x, y)].hpMul : hp;
  }
  /** Fill + edge colour of a cell: ROCK/DENSE take their ring's palette; ore and bedrock look the same everywhere. */
  look(x, y, type) {
    if (type !== T.ROCK && type !== T.DENSE) return MATERIAL[type];
    const r = RINGS[this.ring(x, y)];
    return type === T.ROCK ? { fill: r.rockFill, edge: r.rockEdge } : { fill: r.denseFill, edge: r.denseEdge };
  }

  get cx() { return this.w / 2; }
  get cy() { return this.h / 2; }
  get centerPx() { return { x: this.cx * CELL, y: this.cy * CELL }; }

  generate() {
    const cave = makeNoise(this.seed);
    const hard = makeNoise(this.seed ^ 0x9e3779b9);
    const ore = makeNoise(this.seed ^ 0x85ebca6b);
    const ore2 = makeNoise(this.seed ^ 0xc2b2ae35);
    const lumen = makeNoise(this.seed ^ LUMEN_SALT); // S-10: its own noise, so Lumen never shifts crystal/prism placement
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = y * this.w + x;
        const d = Math.hypot(x + 0.5 - this.cx, y + 0.5 - this.cy);
        if (x < 2 || y < 2 || x >= this.w - 2 || y >= this.h - 2) { this.cells[i] = T.BEDROCK; continue; }
        if (d < 6.5) { this.cells[i] = T.EMPTY; continue; }
        // Caves open up with distance; close to the nexus it's mostly solid so the first tunnels are yours.
        const openness = Math.min(1, Math.max(0, (d - 8) / 30));
        const n = cave(x / 11, y / 11);
        const threshold = 0.36 + 0.14 * openness;
        if (n < threshold && d > 9) { this.cells[i] = T.EMPTY; continue; }
        let type = T.ROCK;
        if (d > 18 && hard(x / 9, y / 9) > 0.64 - Math.min(0.08, d / 900)) type = T.DENSE;
        const o = ore(x / 6, y / 6);
        const crystalCut = d < 22 ? 0.64 : 0.7;
        if (o > crystalCut) type = T.CRYSTAL;
        if (d > 32 && ore2(x / 5, y / 5) > 0.76 - Math.min(0.06, (d - 32) / 600)) type = T.PRISM;
        if ((type === T.ROCK || type === T.DENSE) && d >= LUMEN_D && lumen(x / 5, y / 5) > LUMEN_CUT) type = T.LUMEN;
        this.cells[i] = type;
      }
    }
  }

  idx(x, y) { return y * this.w + x; }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inBounds(x, y) ? this.cells[y * this.w + x] : T.BEDROCK; }
  solid(x, y) { return this.get(x, y) !== T.EMPTY; }
  solidAtPx(px, py) { return this.solid(Math.floor(px / CELL), Math.floor(py / CELL)); }

  markDirty(x, y) {
    const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
    this.dirtyChunks.add(cy * this.chunksW + cx);
    // Edges of neighbours change too (wall outlines), so dirty adjacent chunks when on a boundary.
    if (x % CHUNK === 0 && cx > 0) this.dirtyChunks.add(cy * this.chunksW + cx - 1);
    if (x % CHUNK === CHUNK - 1 && cx < this.chunksW - 1) this.dirtyChunks.add(cy * this.chunksW + cx + 1);
    if (y % CHUNK === 0 && cy > 0) this.dirtyChunks.add((cy - 1) * this.chunksW + cx);
    if (y % CHUNK === CHUNK - 1 && cy < this.chunksH - 1) this.dirtyChunks.add((cy + 1) * this.chunksW + cx);
  }

  /** Apply beam damage. Returns {broken:true, type} when the cell is destroyed. */
  hit(x, y, amount) {
    const type = this.get(x, y);
    if (type === T.EMPTY || UNBREAKABLE.has(type)) return null;
    const i = this.idx(x, y);
    this.damage[i] += amount;
    const hp = this.hpAt(x, y, type);
    if (this.damage[i] >= hp) {
      this.destroy(x, y);
      return { broken: true, type };
    }
    return { broken: false, type, frac: this.damage[i] / hp };
  }

  destroy(x, y) {
    const i = this.idx(x, y);
    this.cells[i] = T.EMPTY;
    this.damage[i] = 0;
    this.broken[i] = 1;
    this.breaks++; // S-42: the Echo's field rebuilds when this changes
    this.markDirty(x, y);
    for (const fn of this.listeners) fn(x, y);
  }

  damageFrac(x, y) {
    const type = this.get(x, y);
    if (type === T.EMPTY || UNBREAKABLE.has(type)) return 0;
    return this.damage[this.idx(x, y)] / this.hpAt(x, y, type);
  }

  /** Grid DDA raycast. Returns the first solid cell and the distance to it, or null within maxDist. */
  raycast(ox, oy, dx, dy, maxDist) {
    let cx = Math.floor(ox / CELL), cy = Math.floor(oy / CELL);
    const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
    const tDeltaX = dx !== 0 ? Math.abs(CELL / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(CELL / dy) : Infinity;
    let tMaxX = dx !== 0 ? ((dx > 0 ? (cx + 1) * CELL - ox : ox - cx * CELL) / Math.abs(dx)) : Infinity;
    let tMaxY = dy !== 0 ? ((dy > 0 ? (cy + 1) * CELL - oy : oy - cy * CELL) / Math.abs(dy)) : Infinity;
    // The origin cell counts: a beam that starts inside a wall hits that wall, not the one behind it.
    if (this.solid(cx, cy)) return { x: cx, y: cy, dist: 0 };
    let t = 0;
    while (t <= maxDist) {
      if (tMaxX < tMaxY) { t = tMaxX; tMaxX += tDeltaX; cx += stepX; }
      else { t = tMaxY; tMaxY += tDeltaY; cy += stepY; }
      if (t > maxDist) break;
      if (this.solid(cx, cy)) return { x: cx, y: cy, dist: t };
    }
    return null;
  }

  reveal(px, py, radius) {
    const r = Math.ceil(radius / CELL);
    const gx = Math.floor(px / CELL), gy = Math.floor(py / CELL);
    const newly = [];
    for (let y = gy - r; y <= gy + r; y++) {
      for (let x = gx - r; x <= gx + r; x++) {
        if (!this.inBounds(x, y)) continue;
        if ((x - gx) ** 2 + (y - gy) ** 2 > r * r) continue;
        const i = this.idx(x, y);
        if (!this.explored[i]) { this.explored[i] = 1; newly.push(i); }
      }
    }
    return newly;
  }
}

// Bitset <-> base64 for compact saves (25,600 cells -> ~4.3 KB).
export function packBits(arr) {
  const bytes = new Uint8Array(Math.ceil(arr.length / 8));
  for (let i = 0; i < arr.length; i++) if (arr[i]) bytes[i >> 3] |= 1 << (i & 7);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function unpackBits(b64, length) {
  const out = new Uint8Array(length);
  const s = atob(b64);
  for (let i = 0; i < length; i++) out[i] = (s.charCodeAt(i >> 3) >> (i & 7)) & 1;
  return out;
}
