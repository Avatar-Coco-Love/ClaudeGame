// Design 52 probe: the whole mid-game route to a primed Spire, in Drift or Surge. Per seed, a greedy bot with a given build
// and bank ▲ leaves the Nexus for the nearest Spire, tunnels to its Nexus-facing gap and stands in the interior (the bank
// feeds first, D-070). Then until fed = 80: mine the nearest prism cell within R cells (exit by the gap, beam it, wait for
// the pickups), carry ▲ back in. Cargo full of ◆ → bank it (at the Nexus, or with RELAY=1 at a Relay the bot places on
// the way out at the first legal cell inside 24 cells of the Spire). Ignores Glitches; a death respawns it at the Nexus.
// Reports minutes to primed, deaths, bank trips, and how much of the 80 came from cargo vs bank.
// Usage: GAME=surge RELAY=1 node tools/spireloop.mjs [seeds = 12] [bank ▲ = 20] [build = mid: start|mid|max] [R = 18]
import { Game } from '../src/game.js';
import { CELL, T, UPGRADES, SPIRE_PRISMS } from '../src/config.js';
import { tryPlace, placeRefusal } from '../src/craft.js';
import { spireHere } from '../src/spire.js';

const GAME = process.env.GAME === 'surge' ? 'surge' : 'drift', RELAY = process.env.RELAY === '1';
const audio = new Proxy({}, { get: () => () => {} });
const SEEDS = Number(process.argv[2] || 12), BANK = Number(process.argv[3] ?? 20), BUILD = process.argv[4] || 'mid', R = Number(process.argv[5] || 18);
const LEVELS = { start: {}, mid: { beam: 4, range: 3, thrust: 3, cargo: 4, magnet: 2, hull: 2 }, max: null };
const dt = 1 / 60, CAP_S = 1500, clamp = v => Math.max(-1, Math.min(1, v));

function run(seed) {
  const g = new Game({ seed, mode: GAME, audio }), w = g.world, px = c => (c + 0.5) * CELL;
  for (const u of UPGRADES) g.upgrades[u.id] = LEVELS[BUILD] ? (LEVELS[BUILD][u.id] || 0) : u.max;
  g.player.integrity = g.stat('hull'); g.bank.prism = BANK; if (RELAY) g.craft.relay = 1;
  let deaths = 0, banks = 0, t = 0, fromCargo = 0; const die = g.destabilize.bind(g); g.destabilize = () => { deaths++; die(); };
  const s = g.spires.slice().sort((a, b) => Math.hypot(a.x - w.cx, a.y - w.cy) - Math.hypot(b.x - w.cx, b.y - w.cy))[0];
  const gap = [[0, -1], [0, 1], [-1, 0], [1, 0]].sort(([ax, ay], [bx, by]) =>
    Math.hypot(s.x + ax * 4 - w.cx, s.y + ay * 4 - w.cy) - Math.hypot(s.x + bx * 4 - w.cx, s.y + by * 4 - w.cy))[0];
  const out = { x: px(s.x + gap[0] * 6), y: px(s.y + gap[1] * 6) }, inner = { x: px(s.x + gap[0] * 3), y: px(s.y + gap[1] * 3) };
  const step = (goal, aim) => {
    const p = g.player, m = Math.hypot(goal.x - p.x, goal.y - p.y) || 1, a = aim || goal, before = s.fed, cargoP = g.cargo.prism;
    g.update(dt, { move: { x: clamp((goal.x - p.x) / m * 2), y: clamp((goal.y - p.y) / m * 2) }, fire: true, aim: { x: a.x - p.x, y: a.y - p.y } });
    if (s.fed > before && g.cargo.prism < cargoP) fromCargo += s.fed - before;
    t += dt;
  };
  const near = (q, r) => Math.hypot(g.player.x - q.x, g.player.y - q.y) < r;
  let stuck = 0;
  const go = (q, r = 12, cap = 120) => { const d0 = deaths; let last = { x: g.player.x, y: g.player.y }; for (let k = 0; k < cap / dt && !near(q, r) && deaths === d0 && t < CAP_S; k++) {
    step(q);
    if (k % 300 === 299) { if (Math.hypot(g.player.x - last.x, g.player.y - last.y) < 8) { stuck++; return false; } last = { x: g.player.x, y: g.player.y }; }
    if (RELAY && g.craft.relay > 0 && Math.hypot(g.player.x / CELL - s.x, g.player.y / CELL - s.y) < 24 && !placeRefusal(g, 'relay')) tryPlace(g);
  } return deaths === d0 && near(q, r); };
  const enter = () => go(out) && go(inner);
  const leave = () => go(out);
  const bankRun = () => { const r = g.relays[0]; banks++; leave(); const home = r ? { x: r.x, y: r.y } : { x: g.nexus.x, y: g.nexus.y + 40 };
    go(home, r ? 30 : 40, 200); for (let k = 0; k < 600 && g.cargoTotal() > 0 && g.atDeposit(); k++) step(home); };
  const bad = new Set();
  enter();
  while (s.fed < SPIRE_PRISMS && t < CAP_S && stuck < 3) {
    if (!spireHere(g)) { if (!enter()) continue; }
    for (let k = 0; k < 60 * 15 && g.cargo.prism + g.bank.prism > 0 && s.fed < SPIRE_PRISMS; k++) step(inner); // feed
    if (s.fed >= SPIRE_PRISMS) break;
    if (g.cargoRoom() < 2) { bankRun(); continue; }
    // Nearest unmined prism cell within R of the centre (outside the footprint), measured from the gap.
    let best = null, bd = Infinity;
    for (let y = s.y - R; y <= s.y + R; y++) for (let x = s.x - R; x <= s.x + R; x++) {
      if (w.get(x, y) !== T.PRISM || bad.has(y * w.w + x) || Math.hypot(x - s.x, y - s.y) > R) continue;
      if (Math.abs(x - s.x) <= 4 && Math.abs(y - s.y) <= 4) continue;
      const d = Math.hypot(x - (s.x + gap[0] * 6), y - (s.y + gap[1] * 6)); if (d < bd) { bd = d; best = { x, y }; }
    }
    if (!best) break; // the neighbourhood is mined out
    leave();
    const c = { x: px(best.x), y: px(best.y) }, d0 = deaths;
    let k = 0;
    for (; k < 60 * 25 && w.get(best.x, best.y) === T.PRISM && deaths === d0 && t < CAP_S; k++) step(c, c);
    if (w.get(best.x, best.y) === T.PRISM) { bad.add(best.y * w.w + best.x); continue; }
    for (let j = 0; j < 60; j++) step(g.player, c); // let the Attractor pull the pickups in
    if (g.cargo.prism > 0) enter();
  }
  return { min: t / 60, primed: s.fed >= SPIRE_PRISMS, stuck: stuck >= 3, deaths, banks, fromCargo, relay: g.relays.length, d: Math.hypot(s.x + 0.5 - w.cx, s.y + 0.5 - w.cy) };
}

const rows = [];
for (let k = 1; k <= SEEDS; k++) { const r = run(k * 7919); if (process.env.V) console.log(JSON.stringify(r)); rows.push(r); }
const med = key => { const v = rows.map(r => r[key]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
const sum = key => rows.reduce((a, r) => a + r[key], 0);
console.log(`${GAME} relay=${RELAY} bank▲=${BANK} build=${BUILD} R=${R} ${SEEDS} seeds: primed ${rows.filter(r => r.primed).length}/${SEEDS} (bot stuck ${rows.filter(r => r.stuck).length}), ` +
  `min to primed median ${med('min').toFixed(1)} max ${Math.max(...rows.map(r => r.min)).toFixed(1)}, deaths ${sum('deaths')}, ` +
  `bank trips ${sum('banks')}, relays placed ${sum('relay')}, ▲ from cargo ${(sum('fromCargo') / (rows.length * SPIRE_PRISMS) * 100).toFixed(0)} %`);
