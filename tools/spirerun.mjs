// Design 47 probe: the trip from the Nexus to a Spire, and the Prisms near it (S-20's feed). Per seed, a straight-line bot
// leaves the Nexus in Drift with a given build, tunnels to a point 2 cells outside the Spire gap that faces the Nexus, then
// steps into the interior. Reports seconds out (tunnelling), seconds back down the open tunnel, and ▲ in prism cells within
// R cells of each Spire centre (yield mean 1.5 per cell), so a Spire's 80▲ can be mined on site.
// GAME=surge runs it in Surge (the bot ignores Glitches; deaths counted, a death restarts the leg from the Nexus).
// Usage: node tools/spirerun.mjs [build = mid: start|mid|max] [seeds = 20] [R = 14]
import { Game } from '../src/game.js';
import { beamModeFromEnv } from './mode.mjs';
import { CELL, T, UPGRADES } from '../src/config.js';

const BEAM_MODE = beamModeFromEnv(), GAME = process.env.GAME === 'surge' ? 'surge' : 'drift';
const audio = new Proxy({}, { get: () => () => {} });
const BUILD = process.argv[2] || 'mid', SEEDS = Number(process.argv[3] || 20), R = Number(process.argv[4] || 14);
const LEVELS = { start: {}, mid: { beam: 4, range: 3, thrust: 3, cargo: 4, magnet: 2, hull: 2 }, max: null };
const dt = 1 / 60, CAP = 900, clamp = v => Math.max(-1, Math.min(1, v));

function drive(g, goal, done) {
  let t = 0;
  for (; t < CAP && !done(); t += dt) {
    const p = g.player, m = Math.hypot(goal.x - p.x, goal.y - p.y) || 1;
    g.update(dt, { move: { x: clamp((goal.x - p.x) / m * 2), y: clamp((goal.y - p.y) / m * 2) }, fire: true, aim: { x: goal.x - p.x, y: goal.y - p.y } });
  }
  return t;
}

function run(seed) {
  const g = new Game({ seed, mode: GAME, audio });
  let deaths = 0; const die = g.destabilize.bind(g); g.destabilize = () => { deaths++; die(); };
  for (const u of UPGRADES) g.upgrades[u.id] = LEVELS[BUILD] ? (LEVELS[BUILD][u.id] || 0) : u.max;
  if (BEAM_MODE !== 'focus') g.research[BEAM_MODE] = true; g.beamMode = BEAM_MODE;
  const w = g.world, px = c => (c + 0.5) * CELL;
  const prism = g.spires.map(s => { let n = 0; for (let y = s.y - R; y <= s.y + R; y++) for (let x = s.x - R; x <= s.x + R; x++)
    if (Math.hypot(x - s.x, y - s.y) <= R && w.get(x, y) === T.PRISM) n++; return n * 1.5; });
  // Nearest Spire (by centre), and its gap that faces the Nexus.
  const s = g.spires.slice().sort((a, b) => Math.hypot(a.x - w.cx, a.y - w.cy) - Math.hypot(b.x - w.cx, b.y - w.cy))[0];
  const gaps = [[0, -1], [0, 1], [-1, 0], [1, 0]].sort(([ax, ay], [bx, by]) =>
    Math.hypot(s.x + ax * 4 - w.cx, s.y + ay * 4 - w.cy) - Math.hypot(s.x + bx * 4 - w.cx, s.y + by * 4 - w.cy))[0];
  const out = { x: px(s.x + gaps[0] * 6), y: px(s.y + gaps[1] * 6) }, inner = { x: px(s.x + gaps[0] * 3), y: px(s.y + gaps[1] * 3) };
  const near = (q, r) => () => Math.hypot(g.player.x - q.x, g.player.y - q.y) < r;
  const tOut = drive(g, out, near(out, 12)) + drive(g, inner, near(inner, 12));
  const home = { x: g.nexus.x, y: g.nexus.y + 40 };
  const tBack = drive(g, out, near(out, 12)) + drive(g, home, () => g.inNexus());
  return { tOut, tBack, deaths, d: Math.hypot(s.x + 0.5 - w.cx, s.y + 0.5 - w.cy), prismMin: Math.min(...prism), prismMean: prism.reduce((a, b) => a + b) / prism.length };
}

const rows = [];
for (let k = 1; k <= SEEDS; k++) rows.push(run(k * 7919));
const q = (key, f) => { const v = rows.map(r => r[key]).sort((a, b) => a - b); return v[Math.min(v.length - 1, Math.floor(f * v.length))].toFixed(0); };
const avg = key => (rows.reduce((a, r) => a + r[key], 0) / rows.length).toFixed(0);
console.log(`${GAME} build=${BUILD} mode=${BEAM_MODE} ${SEEDS} seeds: out s median ${q('tOut', 0.5)} p90 ${q('tOut', 0.9)} max ${q('tOut', 1)}, ` +
  `back s median ${q('tBack', 0.5)}, Spire d mean ${avg('d')}, ▲ within ${R} cells per Spire: mean ${avg('prismMean')}, worst Spire ${q('prismMin', 0)}, ` +
  `capped ${rows.filter(r => r.tOut >= CAP).length}, ${GAME} deaths ${rows.reduce((a, r) => a + r.deaths, 0)}`);
