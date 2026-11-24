// S-19 Spires v1a (D-049, D-068): where the 5 dormant Spires go, their 9×9 shape, and the saved record.
// Sites are seed-only candidates (like vaultSites, D-023); which candidate a world uses is chosen once and saved, so a
// later generator change never moves a Spire. An old save takes the first candidate it hasn't looked at (D-024).
import { WORLD_W, WORLD_H, T, SPIRE_COUNT, SPIRE_D, SPIRE_TRIES, SPIRE_VAULT_GAP, SPIRE_GAP } from './config.js';
import { seededStream, vaultSites, unpackBits } from './world.js';

export const SPIRE_HALF = 4; // the footprint is (2·4 + 1)² = 9×9 cells

/** Offset (i, j) from the centre -> the cell type the Spire writes there. Edge ring: shell, with a 1-cell gap at the
 *  middle of each side and facets at (±2, ±4), (±4, ±2); inside: open floor around a 3×3 core. */
export function spireTypeAt(i, j) {
  const ai = Math.abs(i), aj = Math.abs(j), edge = Math.max(ai, aj) === SPIRE_HALF;
  if (edge) {
    if (ai === 0 || aj === 0) return T.EMPTY;                       // the four gaps
    if ((ai === 2 && aj === 4) || (ai === 4 && aj === 2)) return T.FACET;
    return T.SPIRE_SHELL;
  }
  return ai <= 1 && aj <= 1 ? T.SPIRE : T.EMPTY;
}

/** Cell indices of a 9×9 footprint centred on (x, y). */
export function spireFootprint(x, y, w = WORLD_W) {
  const out = [];
  for (let j = -SPIRE_HALF; j <= SPIRE_HALF; j++) for (let i = -SPIRE_HALF; i <= SPIRE_HALF; i++) out.push((y + j) * w + (x + i));
  return out;
}

/** Seed-only candidate centres: SPIRE_COUNT sectors × SPIRE_TRIES each, [{ x, y }] per sector, in draw order. Every
 *  candidate costs the same draws, so candidate k is the same whatever was valid before it. Only geometry that depends
 *  on the seed is filtered here (border, depth band, vaults); the Spire-to-Spire gap is checked while choosing. */
export function spireCandidates(seed, w = WORLD_W, h = WORLD_H) {
  const rand = seededStream(seed, 'spire'), a0 = rand() * Math.PI * 2, step = Math.PI * 2 / SPIRE_COUNT;
  const vaults = vaultSites(seed, w, h), cx = w / 2, cy = h / 2, H = SPIRE_HALF;
  const sectors = [];
  for (let k = 0; k < SPIRE_COUNT; k++) {
    const list = [];
    for (let t = 0; t < SPIRE_TRIES; t++) {
      const a = a0 + (k + rand()) * step, d = SPIRE_D[0] + rand() * (SPIRE_D[1] - SPIRE_D[0]);
      const x = Math.floor(cx + Math.cos(a) * d), y = Math.floor(cy + Math.sin(a) * d), dc = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (dc < SPIRE_D[0] || dc > SPIRE_D[1]) continue;
      if (x - H < 2 || y - H < 2 || x + H > w - 3 || y + H > h - 3) continue; // footprint stays inside the bedrock border
      if (vaults.some(v => Math.hypot(v.x - x, v.y - y) < SPIRE_VAULT_GAP)) continue;
      list.push({ x, y, t });
    }
    sectors.push(list);
  }
  return sectors;
}

function bits(b64, n) {
  try { return typeof b64 === 'string' ? unpackBits(b64, n) : null; } catch { return null; } // B-037: never trust a save
}

/** Choose this world's Spires. With no save (`explored`/`broken` base64 absent) every sector takes its first candidate.
 *  With a save, the first candidate whose footprint has no explored or broken cell; if none, the least-seen one, and the
 *  seen cells go in `keep` (the stamp leaves them as generated). Returns the saved record (the whole M5 shape, D-063). */
export function chooseSpires(seed, explored, broken, w = WORLD_W, h = WORLD_H) {
  const n = w * h, ex = bits(explored, n), br = bits(broken, n), seen = c => (ex && ex[c]) || (br && br[c]);
  const out = [];
  for (const list of spireCandidates(seed, w, h)) {
    let best = null, bestSeen = Infinity;
    for (const c of list) {
      if (out.some(s => Math.hypot(s.x - c.x, s.y - c.y) < SPIRE_GAP)) continue;
      const k = spireFootprint(c.x, c.y, w).filter(seen).length;
      if (k < bestSeen) { best = c; bestSeen = k; }
      if (k === 0) break;
    }
    if (!best) continue; // never seen on 400 seeds (probe: tools/spirefind.cjs); a world then has fewer Spires
    const rec = { x: best.x, y: best.y, seen: false, fed: 0, mask: null, lit: false };
    if (bestSeen > 0) rec.keep = spireFootprint(best.x, best.y, w).filter(seen);
    out.push(rec);
  }
  return out;
}

/** A save's `spires`, if well-formed (B-037); otherwise null and the caller re-chooses from the save's bitsets. */
export function loadSpires(raw, w = WORLD_W, h = WORLD_H) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > SPIRE_COUNT) return null;
  const H = SPIRE_HALF, int = v => Number.isInteger(v);
  const ok = raw.every(s => s && int(s.x) && int(s.y) && s.x - H >= 2 && s.y - H >= 2 && s.x + H <= w - 3 && s.y + H <= h - 3
    && (s.keep === undefined || (Array.isArray(s.keep) && s.keep.every(int))));
  if (!ok) return null;
  return raw.map(s => {
    const rec = { x: s.x, y: s.y, seen: s.seen === true, fed: Math.max(0, Math.floor(Number(s.fed)) || 0),
      mask: Number.isInteger(s.mask) ? s.mask : null, lit: s.lit === true };
    if (s.keep) rec.keep = [...s.keep];
    return rec;
  });
}

/** Write each Spire's cells into the world (before a save's broken cells are cleared), skipping its `keep` cells. */
export function stampSpires(world, spires) {
  for (const s of spires) {
    const keep = new Set(s.keep || []);
    for (let j = -SPIRE_HALF; j <= SPIRE_HALF; j++) for (let i = -SPIRE_HALF; i <= SPIRE_HALF; i++) {
      const c = (s.y + j) * world.w + (s.x + i);
      if (!keep.has(c)) world.cells[c] = spireTypeAt(i, j);
    }
  }
}
