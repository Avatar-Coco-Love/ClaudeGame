// S-22 probe (D-056): how much faster does a Relay bank a haul? Per seed, a straight 3-wide tunnel is carved from the Nexus
// along the axis farthest from vaults and Spires; the core starts at d 60 carrying 10▲ and drives home along it until the
// cargo is banked. Run once with no Relay and once with one at d 50 (placed by the game's own rules). Reports seconds per
// haul and, with GAME=surge, deaths (a death scatters the cargo: the haul then counts as lost, D-002 parity read).
// Usage: node tools/relayrun.mjs [seeds = 20] [start d = 60] [relay d = 50] [build = mid: start|mid]
import { Game } from '../src/game.js';
import { CELL } from '../src/config.js';
import { tryPlace } from '../src/craft.js';

const GAME = process.env.GAME === 'surge' ? 'surge' : 'drift';
const audio = new Proxy({}, { get: () => () => {} });
const [SEEDS = 20, START = 60, AT = 50] = process.argv.slice(2, 5).map(Number);
const MID = { beam: 4, range: 3, thrust: 3, cargo: 4, magnet: 2, hull: 2 }, BUILD = process.argv[5] === 'start' ? {} : MID;
const dt = 1 / 60, CAP = 120, clamp = v => Math.max(-1, Math.min(1, v));

function haul(seed, relay) {
  const g = new Game({ seed, mode: GAME, audio }), w = g.world;
  for (const k in g.upgrades) g.upgrades[k] = BUILD[k] || 0;
  g.player.integrity = g.stat('hull');
  const cx = Math.floor(g.nexus.x / CELL), cy = Math.floor(g.nexus.y / CELL);
  let an = 0, best = -1;
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2, d = Math.min(...[...w.vaults, ...g.spires].map(v => Math.hypot(v.x - (cx + Math.cos(a) * AT), v.y - (cy + Math.sin(a) * AT))));
    if (d > best) { best = d; an = a; }
  }
  const cell = r => [cx + Math.round(Math.cos(an) * r), cy + Math.round(Math.sin(an) * r)];
  for (let r = 0; r <= START; r++) { const [x, y] = cell(r); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) w.destroy(x + dx, y + dy); }
  const put = r => { const [x, y] = cell(r); Object.assign(g.player, { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, vx: 0, vy: 0 }); };
  let placed = false;
  if (relay) { g.craft.relay = 1; g.craft.last = 'relay'; put(AT); placed = tryPlace(g); }
  put(START); g.cargo.prism = 10; g.spawnTimer = 0;
  let deaths = 0; const die = g.destabilize.bind(g); g.destabilize = () => { deaths++; die(); };
  let t = 0;
  for (; t < CAP && g.cargo.prism > 0 && !deaths; t += dt) {
    const p = g.player, gx = g.nexus.x - p.x, gy = g.nexus.y - p.y, m = Math.hypot(gx, gy) || 1;
    const e = g.enemies.length ? g.enemies.reduce((a, b) => Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b) : null;
    g.update(dt, { move: { x: clamp(gx / m * 2), y: clamp(gy / m * 2) }, fire: !!e, aim: e ? { x: e.x - p.x, y: e.y - p.y } : null });
  }
  return { t, deaths, placed, banked: g.bank.prism };
}

const rows = { none: [], relay: [] };
for (let s = 1; s <= SEEDS; s++) { rows.none.push(haul(s, false)); rows.relay.push(haul(s, true)); }
const sum = (a, f) => a.reduce((x, y) => x + f(y), 0);
for (const [k, a] of Object.entries(rows)) {
  const ok = a.filter(r => !r.deaths && (k === 'none' || r.placed)); // a refused Relay (vault/Spire near d 50) is left out
  console.log(`${GAME} ${k.padEnd(5)}: ${(sum(ok, r => r.t) / (ok.length || 1)).toFixed(2)} s per 10▲ haul from d ${START} (${ok.length}/${a.length} banked), deaths ${sum(a, r => r.deaths)}, relay placed ${sum(a, r => r.placed ? 1 : 0)}`);
}
