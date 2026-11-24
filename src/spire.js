// S-19 Spires v1a (D-049, D-068): where the 5 dormant Spires go, their 9×9 shape, and the saved record.
// Sites are seed-only candidates (like vaultSites, D-023); which candidate a world uses is chosen once and saved, so a
// later generator change never moves a Spire. An old save takes the first candidate it hasn't looked at (D-024).
import { WORLD_W, WORLD_H, T, CELL, MATERIAL, SPIRE_COUNT, SPIRE_D, SPIRE_TRIES, SPIRE_VAULT_GAP, SPIRE_GAP,
  SPIRE_BREATH_S, SPIRE_BREATH_ALPHA, SPIRE_MARK_COLOR } from './config.js';
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
    if (!best) continue; // never seen on 400 seeds (probe: tools/spirefind.mjs); a world then has fewer Spires
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

// ---------- S-27 found (D-049, D-069) ----------

/** Mark every unseen Spire whose 9×9 footprint has an explored cell as `seen`. `newly` (cell indices just revealed)
 *  limits the test to Spires those cells touch; without it every footprint is scanned (load). Returns how many it marked. */
export function markSpiresSeen(game, newly = null) {
  const w = game.world, H = SPIRE_HALF;
  let marked = 0;
  for (const s of game.spires) {
    if (s.seen) continue;
    const hit = newly
      ? newly.some(i => Math.abs((i % w.w) - s.x) <= H && Math.abs(Math.floor(i / w.w) - s.y) <= H)
      : spireFootprint(s.x, s.y, w.w).some(i => w.explored[i]);
    if (hit) { s.seen = true; marked++; }
  }
  return marked;
}

/** Spires found so far (n of the toast "A dormant Spire (n/N)"), and lit (the Matrix stats line). */
export const spiresSeen = game => game.spires.filter(s => s.seen).length;
export const spiresLit = game => game.spires.filter(s => s.lit).length;

/** The core hexagon's alpha: breathes 0.35–0.6 over SPIRE_BREATH_S; held at the top under reduced motion. */
export function spireBreath(time, motion) {
  const [lo, hi] = SPIRE_BREATH_ALPHA;
  return motion ? lo + (hi - lo) * (0.5 + 0.5 * Math.cos(time * 2 * Math.PI / SPIRE_BREATH_S)) : hi;
}

/** The breathing outer hexagon over each on-screen Spire core (world transform, before the light layer). Drawn from
 *  the record, but only where the core cells exist (a broken Spire, D-069, has none to breathe). */
export function drawSpireBreath(r, ctx, left, top, vw, vh) {
  const g = r.game, w = g.world, a = spireBreath(r.time, g.motionOn()), C = MATERIAL[T.SPIRE];
  let open = false;
  for (const s of g.spires) {
    const cx = (s.x + 0.5) * CELL, cy = (s.y + 0.5) * CELL, m = CELL * 2;
    if (cx + m < left || cx - m > left + vw || cy + m < top || cy - m > top + vh) continue;
    if (w.get(s.x, s.y) !== T.SPIRE || w.get(s.x - 1, s.y) !== T.SPIRE || w.get(s.x + 1, s.y) !== T.SPIRE
      || w.get(s.x, s.y - 1) !== T.SPIRE || w.get(s.x, s.y + 1) !== T.SPIRE) continue;
    if (!open) { ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = C.edge; ctx.strokeStyle = C.edge; ctx.lineWidth = 2; open = true; }
    ctx.globalAlpha = a;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const t = Math.PI / 6 + k * Math.PI / 3; ctx[k ? 'lineTo' : 'moveTo'](cx + Math.cos(t) * CELL * 1.35, cy + Math.sin(t) * CELL * 1.35); }
    ctx.closePath(); ctx.stroke();
  }
  if (open) ctx.restore();
}

/** Minimap mark: a hollow violet-white hexagon at each seen Spire's centre (a broken one too, D-069). */
export function drawSpireMarks(m, g, sc) {
  m.save(); m.strokeStyle = SPIRE_MARK_COLOR; m.lineWidth = 1.25;
  for (const s of g.spires) {
    if (!s.seen) continue;
    const x = (s.x + 0.5) * CELL * sc, y = (s.y + 0.5) * CELL * sc;
    m.beginPath();
    for (let k = 0; k < 6; k++) { const t = Math.PI / 6 + k * Math.PI / 3; m[k ? 'lineTo' : 'moveTo'](x + Math.cos(t) * 3.5, y + Math.sin(t) * 3.5); }
    m.closePath(); m.stroke();
  }
  m.restore();
}
