// S-19 Spires v1a (D-049, D-068): where the 5 dormant Spires go, their 9×9 shape, and the saved record.
// Sites are seed-only candidates (like vaultSites, D-023); which candidate a world uses is chosen once and saved, so a
// later generator change never moves a Spire. An old save takes the first candidate it hasn't looked at (D-024).
import { WORLD_W, WORLD_H, T, CELL, MATERIAL, SPIRE_COUNT, SPIRE_D, SPIRE_TRIES, SPIRE_VAULT_GAP, SPIRE_GAP,
  SPIRE_BREATH_S, SPIRE_BREATH_ALPHA, SPIRE_MARK_COLOR, SPIRE_PRISMS, SPIRE_FEED_RATE, SPIRE_TAPS, SPIRE_TAP_S, SPIRE_LIGHT, SPIRE_LIT_RGB, SPIRE_WAKE_RGB, RESOURCE } from './config.js';
import { seededStream, vaultSites, unpackBits } from './world.js';
import { wakeMask, drawWake } from './wake.js';
import { checkEnding } from './ending.js';

export const SPIRE_HALF = 4; // the footprint is (2·4 + 1)² = 9×9 cells
export const SPIRE_CORE = 1;  // the core is (2·1 + 1)² = 3×3 cells

/** Offset (i, j) from the centre -> the cell type the Spire writes there. Edge ring: shell, with a 1-cell gap at the
 *  middle of each side and facets at (±2, ±4), (±4, ±2); inside: open floor around a 3×3 core. */
export function spireTypeAt(i, j) {
  const ai = Math.abs(i), aj = Math.abs(j), edge = Math.max(ai, aj) === SPIRE_HALF;
  if (edge) {
    if (ai === 0 || aj === 0) return T.EMPTY;                       // the four gaps
    if ((ai === 2 && aj === 4) || (ai === 4 && aj === 2)) return T.FACET;
    return T.SPIRE_SHELL;
  }
  return ai <= SPIRE_CORE && aj <= SPIRE_CORE ? T.SPIRE : T.EMPTY;
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
      mask: Number.isInteger(s.mask) && s.mask >= 0 && s.mask <= 255 ? s.mask : null, lit: s.lit === true };
    if (rec.lit) rec.mask = 255; // B-045: a lit Spire has all 8 facets lit, whatever a malformed save says
    rec.fed = Math.min(SPIRE_PRISMS, rec.fed); // S-20: a fed count past the cap is a malformed save (B-037)
    if (rec.lit && SPIRE_MODES.includes(s.mode)) rec.mode = s.mode; // S-28 (D-081): an unknown mode is dropped (B-037)
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
    if (!open) { ctx.save(); ctx.lineWidth = 2; open = true; }
    const col = s.lit ? SPIRE_MARK_COLOR : C.edge; // S-28: a relit core is bright and still (no breath)
    ctx.shadowColor = ctx.strokeStyle = ctx.fillStyle = col; ctx.shadowBlur = s.lit ? 20 : 8;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const t = Math.PI / 6 + k * Math.PI / 3; ctx[k ? 'lineTo' : 'moveTo'](cx + Math.cos(t) * CELL * 1.35, cy + Math.sin(t) * CELL * 1.35); }
    ctx.closePath();
    if (s.lit) { ctx.globalAlpha = 0.3; ctx.fill(); }
    ctx.globalAlpha = s.lit ? 1 : a; ctx.stroke();
  }
  if (open) ctx.restore();
}

/** Minimap mark: a violet-white hexagon at each seen Spire's centre (a broken one too, D-069): hollow, filled once relit. */
export function drawSpireMarks(m, g, sc) {
  m.save(); m.strokeStyle = SPIRE_MARK_COLOR; m.lineWidth = 1.25;
  for (const s of g.spires) {
    if (!s.seen) continue;
    const x = (s.x + 0.5) * CELL * sc, y = (s.y + 0.5) * CELL * sc;
    m.beginPath();
    for (let k = 0; k < 6; k++) { const t = Math.PI / 6 + k * Math.PI / 3; m[k ? 'lineTo' : 'moveTo'](x + Math.cos(t) * 3.5, y + Math.sin(t) * 3.5); }
    m.closePath(); m.stroke();
    if (s.lit) { m.fillStyle = SPIRE_MARK_COLOR; m.fill(); } // S-28: relit = filled
  }
  m.restore();
}

// ---------- S-20 feed (D-055, D-069, D-070) ----------

/** The 8 facets in ring order (clockwise from the top right), as offsets from the centre. Bit k of `mask` = facet k lit. */
export const FACET_RING = [[2, -4], [4, -2], [4, 2], [2, 4], [-2, 4], [-4, 2], [-4, -2], [-2, -4]];
export const SPIRE_INTERIOR = 3; // the 7×7 interior: |dx|, |dy| ≤ 3 cells from the centre

/** D-069: broken when the saved `keep` list holds a core or facet cell (the stamp left it as generated). Derived, not saved. */
function isBroken(s, w = WORLD_W) {
  return (s.keep || []).some(c => { const t = spireTypeAt(c % w - s.x, Math.floor(c / w) - s.y); return t === T.SPIRE || t === T.FACET; });
}

/** Toggling facet k flips it and its two ring neighbours (S-28's rule). */
export const toggleMask = (mask, k) => mask ^ (1 << k) ^ (1 << ((k + 1) % 8)) ^ (1 << ((k + 7) % 8));

/** S-28's start pattern for Spire i: all lit, then SPIRE_TAPS[i] distinct facets toggled, drawn from its own salt. */
export function startMask(seed, i) {
  const rand = seededStream(seed, 'facets' + i), pool = [0, 1, 2, 3, 4, 5, 6, 7], n = SPIRE_TAPS[Math.min(i, SPIRE_TAPS.length - 1)];
  let mask = 255;
  for (let k = 0; k < n; k++) {
    const j = k + Math.floor(rand() * (8 - k));
    [pool[k], pool[j]] = [pool[j], pool[k]];
    mask = toggleMask(mask, pool[k]);
  }
  return mask;
}

/** The Spire whose 7×7 interior holds the core's cell (judged by position from the record's centre, D-069), or null. */
export function spireHere(game) {
  const cx = Math.floor(game.player.x / CELL), cy = Math.floor(game.player.y / CELL);
  return game.spires.find(s => Math.abs(cx - s.x) <= SPIRE_INTERIOR && Math.abs(cy - s.y) <= SPIRE_INTERIOR) || null;
}

/** Feed: inside a dormant Spire's interior, ▲ moves in at SPIRE_FEED_RATE, cargo first, then the bank (D-070), up to
 *  SPIRE_PRISMS. ◆ and ● stay put. Same in Drift and Surge. At the cap the Spire is primed (or, if broken, relit). */
export function updateSpireFeed(game, dt) {
  const s = spireHere(game);
  if (s && !s.lit && s.fed >= SPIRE_PRISMS && s.mask === null) primeSpire(game, s); // a save cut off mid-prime heals here
  if (!s || s.lit || s.fed >= SPIRE_PRISMS || game.cargo.prism + game.bank.prism === 0) { game.feedTimer = 0; return; }
  game.feedTimer += dt;
  const step = 1 / SPIRE_FEED_RATE, p = game.player, tx = (s.x + 0.5) * CELL, ty = (s.y + 0.5) * CELL;
  while (game.feedTimer >= step && s.fed < SPIRE_PRISMS) {
    const from = game.cargo.prism > 0 ? game.cargo : game.bank.prism > 0 ? game.bank : null;
    if (!from) { game.feedTimer = 0; return; }
    game.feedTimer -= step;
    from.prism--; s.fed++;
    game.audio.deposit(game.depositCount++);
    game.particles.push({ type: 'streak', x: p.x, y: p.y, tx, ty, life: 0.4, max: 0.4, color: RESOURCE.prism.color, size: 3 });
    if (s.fed >= SPIRE_PRISMS) primeSpire(game, s);
  }
}

/** At SPIRE_PRISMS: `mask` gets the start pattern (S-28 only reads it) and the toast "Spire primed". A broken Spire
 *  (D-069) has no puzzle and relights at once, with the same effects as a solved one (relightSpire, mode 'broken'). */
function primeSpire(game, s) {
  game.audio.depositDone(3);
  if (isBroken(s, game.world.w)) relightSpire(game, s, 'broken');
  else {
    s.mask = startMask(game.world.seed, game.spires.indexOf(s));
    game.notify('spire-primed');
  }
}

/** The fed / 80 arc around the core while it stands in an unlit Spire's interior, and a primed Spire's facets: lit ones
 *  bright (filled, glowing), unlit ones a clear outline, so the start pattern reads (world transform, before the light). */
export function drawSpireFeed(r, ctx, left, top, vw, vh) {
  const g = r.game, w = g.world;
  ctx.save();
  ctx.strokeStyle = SPIRE_MARK_COLOR; ctx.fillStyle = SPIRE_MARK_COLOR; ctx.shadowColor = SPIRE_MARK_COLOR;
  for (const s of g.spires) {
    if (s.mask === null) continue; // S-28: a relit Spire keeps all 8 facets lit
    const cx = (s.x + 0.5) * CELL, cy = (s.y + 0.5) * CELL, m = CELL * 5;
    if (cx + m < left || cx - m > left + vw || cy + m < top || cy - m > top + vh) continue;
    const clock = g.wake && g.wake.s === s; // S-31: a Wake's lit facets are its clock, drawn in the ring's orange
    ctx.strokeStyle = ctx.fillStyle = ctx.shadowColor = clock ? `rgb(${SPIRE_WAKE_RGB})` : SPIRE_MARK_COLOR;
    FACET_RING.forEach(([i, j], k) => {
      if (w.get(s.x + i, s.y + j) !== T.FACET) return;
      const on = (wakeMask(g, s) >> k) & 1, x = cx + i * CELL, y = cy + j * CELL;
      ctx.beginPath();
      for (let n = 0; n < 6; n++) { const t = Math.PI / 6 + n * Math.PI / 3; ctx[n ? 'lineTo' : 'moveTo'](x + Math.cos(t) * 9, y + Math.sin(t) * 9); }
      ctx.closePath();
      ctx.shadowBlur = on ? 14 : 0; ctx.lineWidth = on ? 2.5 : 1.5; ctx.globalAlpha = on ? 1 : 0.6; ctx.stroke();
      if (on) { ctx.globalAlpha = 0.45; ctx.fill(); }
    });
  }
  ctx.strokeStyle = ctx.fillStyle = ctx.shadowColor = SPIRE_MARK_COLOR;
  const a = g.facetAim; // S-28: the dwell on the aimed facet fills a ring round it, then holds while latched
  if (a && !a.s.lit) {
    const [i, j] = FACET_RING[a.k], x = (a.s.x + i + 0.5) * CELL, y = (a.s.y + j + 0.5) * CELL, f = Math.min(1, a.t / SPIRE_TAP_S);
    ctx.globalAlpha = 0.9; ctx.lineWidth = 2.5; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(x, y, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f); ctx.stroke();
  }
  drawWake(ctx, g); // S-23: the charge ring round a waking Spire's core
  const s = spireHere(g);
  if (s && !s.lit && !g.wake) {
    const p = g.player, f = Math.min(1, s.fed / SPIRE_PRISMS), a0 = -Math.PI / 2;
    ctx.shadowBlur = 0; ctx.lineWidth = 3; ctx.globalAlpha = 0.22;
    ctx.beginPath(); ctx.arc(p.x, p.y, 24, 0, Math.PI * 2); ctx.stroke();
    if (f > 0) {
      ctx.globalAlpha = 0.95; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.x, p.y, 24, a0, a0 + Math.PI * 2 * f); ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------- S-28 facet puzzle + relit (D-055, D-078, D-080, D-081) ----------

const SPIRE_MODES = ['drift', 'surge', 'broken']; // D-081: how a lit Spire was relit (saved as `mode`)

/** The light a relit Spire adds to the Renderer's light sets (S-26): a 260 px hole + violet-white floor glow. */
export const spireLight = s => ({ x: (s.x + 0.5) * CELL, y: (s.y + 0.5) * CELL, r: SPIRE_LIGHT, glow: SPIRE_LIT_RGB });

/** { s, k } when cell (x, y) is facet k of a primed, unlit Spire (the only facets that toggle); otherwise null. */
export function facetAt(game, x, y) {
  if (game.mode === 'surge' || game.world.get(x, y) !== T.FACET) return null; // S-23 (D-055): Surge relights by the Wake
  for (const s of game.spires) {
    if (s.lit || s.mask === null) continue;
    const k = FACET_RING.findIndex(([i, j]) => s.x + i === x && s.y + j === y);
    if (k >= 0) return { s, k };
  }
  return null;
}

/** Toggle facet k (and its two ring neighbours); all 8 lit relights the Spire. Only Drift toggles since S-23 (D-086). */
export function toggleFacet(game, s, k) {
  s.mask = toggleMask(s.mask, k);
  const [i, j] = FACET_RING[k], on = (s.mask >> k) & 1;
  game.burst((s.x + i + 0.5) * CELL, (s.y + j + 0.5) * CELL, 10, SPIRE_MARK_COLOR, 120);
  game.audio.facet(!!on);
  if (s.mask === 255) relightSpire(game, s, 'drift');
}

/** D-080: only the aim (centre) ray's cell counts. `SPIRE_TAP_S` of unbroken contact with one facet toggles it once;
 *  it then stays latched until the ray leaves that facet. `target` is the centre ray's cell this frame (null = none);
 *  `blocked`: a Glitch stands on the centre ray, so the aim hasn't left the facet; the latch (and dwell) hold (B-044). */
export function updateFacetAim(game, dt, target, blocked = false) {
  if (!target && blocked) return;
  const f = target && facetAt(game, target.x, target.y);
  if (!f) { game.facetAim = null; return; }
  let a = game.facetAim;
  if (!a || a.s !== f.s || a.k !== f.k) a = game.facetAim = { s: f.s, k: f.k, t: 0, done: false };
  a.t += dt;
  if (!a.done && a.t >= SPIRE_TAP_S - 1e-9) { a.done = true; toggleFacet(game, f.s, f.k); }
}

/** Relit (S-28): lit, all facets set, `mode` recorded (D-081), its light joins the light sets, a rising tone, the toast
 *  "Spire relit (n/N)" (main.js reads `spireLitCount`). Used by the puzzle and by S-20's broken path. */
export function relightSpire(game, s, mode) {
  if (s.lit) return; // audit 64 (B-059): never twice (dev relight-all during a Wake relit it again at 40 s)
  s.mask = 255; s.lit = true; s.mode = mode;
  game.spireLitCount = spiresLit(game);
  game.spireLights.push(spireLight(s));
  game.audio.spireRelit();
  game.notify('spire-relit');
  checkEnding(game); // S-24: the last one ends the world
}

/** The hint's test: the core stands in a primed, unlit Spire's interior. */
export function primedHere(game) {
  const s = spireHere(game);
  return !!s && !s.lit && s.mask !== null;
}
