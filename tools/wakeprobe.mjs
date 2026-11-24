// Design 57 probe (Q-017): how hard is the S-23 Wake for a person, not a perfect bot? Per seed, a mid-build core stands in
// the nearest primed Spire's interior in Surge (no god mode) and guards with a handicap:
//   perfect  — surgebot's guard: between the core and the Glitch nearest it, instant re-target, exact aim;
//   human    — the same guard, but it re-targets and re-positions only every REACT s, aims at where the Glitch was then,
//              plus a fixed per-seed aim wobble of ±WOBBLE rad;
//   still    — never moves from where it entered (the south interior), beams the Glitch nearest the core it can see.
// Reports fails / tries (a fail → step out, back in, up to 3 tries) and charge left on success.
// Usage: node tools/wakeprobe.mjs [build = mid: start|mid|max] [seeds = 20] [REACT = 0.35] [WOBBLE = 0.12]
import { Game } from '../src/game.js';
import { CELL, UPGRADES } from '../src/config.js';
import { seededStream } from '../src/world.js';
import { LEVELS } from './surgebot.mjs';

const audio = new Proxy({}, { get: () => () => {} });
const dt = 1 / 60, clamp = v => Math.max(-1, Math.min(1, v));

/** One seed with one guard style; exported for tests/wake.cjs (S-31). */
export function run(seed, style, BUILD = 'mid', REACT = 0.35, WOBBLE = 0.12) {
  const g = new Game({ seed, mode: "surge", audio }), rnd = seededStream(seed, 'wakeprobe');
  for (const u of UPGRADES) g.upgrades[u.id] = LEVELS[BUILD] ? (LEVELS[BUILD][u.id] || 0) : u.max;
  g.player.integrity = g.stat('hull'); g.spawnTimer = 1e9;
  const s = g.spires.slice().sort((a, b) => Math.hypot(a.x - g.world.cx, a.y - g.world.cy) - Math.hypot(b.x - g.world.cx, b.y - g.world.cy))[0];
  s.fed = 80;
  let fails = 0, tries = 0, deaths = 0, charge = null, seen = null, react = 0, to = null;
  const die = g.destabilize.bind(g); g.destabilize = () => { deaths++; die(); };
  const enter = () => { g.player.x = (s.x + 0.5) * CELL; g.player.y = (s.y + 3.5) * CELL; g.player.vx = g.player.vy = 0; g.player.integrity = g.stat('hull'); g.update(dt, { move: { x: 0, y: 0 }, aim: null, fire: false }); };
  while (tries < 3 && !s.lit) {
    enter(); if (!g.wake) break; tries++;
    const wob = (rnd() * 2 - 1) * WOBBLE;
    while (g.wake) {
      const p = g.player, c = g.wake.core; let e = null, bd = Infinity;
      for (const q of g.enemies) { const d = Math.hypot(q.x - c.x, q.y - c.y); if (q.fade === undefined && d < bd) { bd = d; e = q; } }
      let move = { x: 0, y: 0 }, aim = null;
      if (style === 'still') { if (e) aim = { x: e.x - p.x, y: e.y - p.y }; }
      else {
        react -= dt;
        if (style === 'perfect' || react <= 0) { react = REACT; seen = e && { x: e.x, y: e.y, d: bd };
          if (seen) { const lim = 2.6 * CELL, k = 3.2 * CELL / seen.d; to = { x: c.x + Math.max(-lim, Math.min(lim, (seen.x - c.x) * k)), y: c.y + Math.max(-lim, Math.min(lim, (seen.y - c.y) * k)) }; } }
        if (to) { const m = Math.hypot(to.x - p.x, to.y - p.y); if (m > 3) move = { x: clamp((to.x - p.x) / m * 2), y: clamp((to.y - p.y) / m * 2) }; }
        const tgt = style === 'perfect' ? e : seen;
        if (tgt) { const a = Math.atan2(tgt.y - p.y, tgt.x - p.x) + (style === 'perfect' ? 0 : wob); aim = { x: Math.cos(a), y: Math.sin(a) }; }
      }
      const k = g.wake;
      g.update(dt, { move, aim, fire: !!aim });
      if (!g.wake && !s.lit) fails++;
      if (!g.wake && s.lit) charge = k.charge;
    }
    if (!s.lit) { g.player.y = (s.y + 8.5) * CELL; g.update(dt, { move: { x: 0, y: 0 }, aim: null, fire: false }); }
  }
  return { lit: s.lit, fails, tries, deaths, charge };
}

const main = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
const BUILD = process.argv[2] || 'mid', SEEDS = Number(process.argv[3] || 20), REACT = Number(process.argv[4] ?? 0.35), WOBBLE = Number(process.argv[5] ?? 0.12);
if (main) for (const style of ['perfect', 'human', 'still']) {
  const rows = []; for (let k = 1; k <= SEEDS; k++) rows.push(run(k * 7919, style, BUILD, REACT, WOBBLE));
  const f = rows.reduce((a, r) => a + r.fails, 0), t = rows.reduce((a, r) => a + r.tries, 0), ch = rows.filter(r => r.charge != null).map(r => r.charge).sort((a, b) => a - b);
  console.log(`${style.padEnd(7)} ${BUILD} react ${REACT} wobble ${WOBBLE}: relit ${rows.filter(r => r.lit).length}/${SEEDS}, first-try ${rows.filter(r => r.lit && r.fails === 0).length}/${SEEDS}, ` +
    `fails ${f}/${t} (${Math.round(100 * f / Math.max(1, t))} %), deaths ${rows.reduce((a, r) => a + r.deaths, 0)}, charge left median ${ch.length ? ch[ch.length >> 1] : '—'}`);
}
