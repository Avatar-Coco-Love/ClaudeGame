// Research (S-11, D-030, D-034): one-time unlocks paid only in Lumen. v1 has one node, the Scanner ping.
// The ping is intent -> realized like movement: `intent.scan` asks, `tryScan` realizes it only if unlocked and off cooldown.
import { CELL, T, RESEARCH, SCAN_RADIUS, SCAN_COOLDOWN_S, SCAN_SHOW_S, SCAN_SPEED } from './config.js';

export const SCAN_TYPES = new Set([T.CRYSTAL, T.PRISM, T.LUMEN]);

/** Ore cells (CRYSTAL / PRISM / LUMEN) whose centre lies within SCAN_RADIUS cells of (px, py). Pure: tests reuse it. */
export function oreWithin(world, px, py, radius = SCAN_RADIUS) {
  const out = [], R = radius * CELL;
  const x0 = Math.max(0, Math.floor((px - R) / CELL)), x1 = Math.min(world.w - 1, Math.floor((px + R) / CELL));
  const y0 = Math.max(0, Math.floor((py - R) / CELL)), y1 = Math.min(world.h - 1, Math.floor((py + R) / CELL));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const type = world.cells[y * world.w + x];
    if (!SCAN_TYPES.has(type)) continue;
    const d = Math.hypot((x + 0.5) * CELL - px, (y + 0.5) * CELL - py);
    if (d <= R) out.push({ x, y, type, d });
  }
  return out;
}

export function researchNode(id) { return RESEARCH.find(r => r.id === id); }
export function canResearch(game, id) {
  const r = researchNode(id);
  return !!r && !game.research[id] && game.bank.lumen >= r.cost;
}
export function buyResearch(game, id) {
  if (!canResearch(game, id)) return false;
  game.bank.lumen -= researchNode(id).cost;
  game.research[id] = true;
  game.stats.upgrades++;
  game.audio.upgrade();
  if (game.motionOn()) game.coreRing = 1;
  return true;
}

/** Realize a ping. Returns true only when one actually starts. */
export function tryScan(game) {
  if (!game.research.scanner || game.scan.cooldown > 0) return false;
  const p = game.player, instant = !game.motionOn(); // reduced motion: no ring, every glyph at once
  const marks = oreWithin(game.world, p.x, p.y).map(m => ({ ...m, at: instant ? 0 : m.d / SCAN_SPEED }));
  game.scan = { cooldown: SCAN_COOLDOWN_S, age: 0, x: p.x, y: p.y, ring: !instant, marks,
    end: Math.max(0, ...marks.map(m => m.at)) + SCAN_SHOW_S };
  game.audio.scan();
  return true;
}

export function updateScan(game, dt) {
  const s = game.scan;
  s.cooldown = Math.max(0, s.cooldown - dt);
  if (!s.marks.length) return;
  s.age += dt;
  if (s.age >= s.end) s.marks = [];
}

/** 0..1 visibility of a mark now (0 before the ring reaches it, fading to 0 over SCAN_SHOW_S); 0 once the cell is mined. */
export function markAlpha(game, m) {
  const s = game.scan, t = s.age - m.at;
  if (t < 0 || game.world.cells[m.y * game.world.w + m.x] !== m.type) return 0;
  return Math.max(0, 1 - t / SCAN_SHOW_S);
}

export const emptyScan = () => ({ cooldown: 0, age: 0, x: 0, y: 0, ring: false, marks: [], end: 0 });
