// S-60b2 (D-165): the Crucible gate. Per seed and mode, a top base build (base max) with a Heat Sink and 2 Wards placed at
// the lair starts 12 cells from the boss core (toward the Nexus, on a cleared 3×3 pad) and runs surgebot's boss route to
// "down". The world as played (D-164): lairs on, Burrowers / Glitch spawns / vents / heat live; weather and rifts keep their
// own rule (they never start while the boss is awake). Gate on GATE_SEEDS (8, D-155): time to down Surge / Drift
// (sum over seeds) 0.8–1.25 and Surge deaths median ≤ 1; every run must reach down. Deaths are logged by cause:
// boss (flare, or a bolt with no Spitter near = an ember), Burrower, Glitch (contact or a Spitter's bolt), other.
// S-61b (D-170): --boss=gyre runs the Shoal's Gyre instead: 2 Wards at ± 4, no Heat Sink (no heat in the Shoal); its rim and
// a hit from one of its swarm motes count as boss. The same band, seeds and start.
// Usage: node tools/bossrun.mjs [--boss=crucible|gyre] [--seeds=8] [--minutes=15] [--mode=drift,surge] [--v]
import { runBot } from './surgebot.mjs';
const GATE_SEEDS = 8; // B-092 / D-155: the seed count every gate verdict is defined on (biomefoe.mjs runs on import)
import { CELL } from '../src/config.js';
import { tryPlace } from '../src/craft.js';

const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const seeds = Number(arg('seeds', GATE_SEEDS)), minutes = Number(arg('minutes', 15)), modes = arg('mode', 'drift,surge').split(',');
const V = process.argv.includes('--v'), START = 12, BOSS = arg('boss', 'crucible'), RING = BOSS === 'gyre' ? 3 : 4;

/** Places one of `kind` on cell (x, y) by standing the core there (the player's own B / ✦). */
function place(g, kind, x, y) {
  Object.assign(g.player, { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL });
  g.craft[kind] = 1; g.craft.last = kind;
  return tryPlace(g);
}

/** Which source a hit came from (the caller's file on the stack); a bolt with no live Spitter within 400 px is an ember. */
function cause(g) {
  const st = new Error().stack.split('\n').slice(3).join('\n');
  if (/boss\.js|gyre\.js/.test(st)) return 'boss';
  if (/mote\.js/.test(st)) return g.swarm.motes.some(m => m.boss && Math.hypot(m.x - g.player.x, m.y - g.player.y) < m.r + g.player.r + 2) ? 'boss' : 'other';
  if (/burrower\.js/.test(st)) return 'burrower';
  if (/glitch\.js/.test(st)) return 'glitch';
  if (/spitter\.js/.test(st)) return g.enemies.some(e => e.spitter && e.fade === undefined && Math.hypot(e.x - g.player.x, e.y - g.player.y) < 400) ? 'glitch' : 'boss';
  return 'other';
}

export function bossRun(seed, mode, ring = RING) {
  let game = null; const why = { boss: 0, burrower: 0, glitch: 0, other: 0 };
  const setup = g => {
    game = g; const w = g.world, B = g.bosses.list.find(b => b.ring === ring), sink = ring === 4;
    const placed = (!sink || place(g, 'sink', B.x + 2, B.y)) && place(g, 'ward', B.x - 4, B.y) && place(g, 'ward', B.x + 4, B.y);
    const d = Math.hypot(w.cx - B.x, w.cy - B.y), sx = Math.round(B.x + (w.cx - B.x) / d * START), sy = Math.round(B.y + (w.cy - B.y) / d * START);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) w.destroy(sx + dx, sy + dy);
    Object.assign(g.player, { x: (sx + 0.5) * CELL, y: (sy + 0.5) * CELL, vx: 0, vy: 0 });
    g.placed = placed && g.sinks.length === (sink ? 1 : 0) && g.wards.length === 2;
    const hurt = g.hurtPlayer.bind(g);
    g.hurtPlayer = (n, dx, dy) => { if (!g.god && g.player.integrity - n <= 0) why[cause(g)]++; hurt(n, dx, dy); };
  };
  const r = runBot({ seed, route: 'boss', build: 'max', mode, minutes, boss: 'on', lair: ring, rift: 'on', anomaly: 'off', setup });
  return { ...r, why, placed: game.placed, embers: game.bosses.embers, burns: game.bosses.burns, overheats: game.heatState.overheats, swarms: game.swarm.bossSwarms, rims: game.bosses.rims };
}

const med = v => { const s = [...v].sort((a, b) => a - b); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const res = {};
  for (const mode of modes) {
    const rows = [];
    for (let k = 1; k <= seeds; k++) { const r = bossRun(k * 7919, mode); if (V) console.log(JSON.stringify(r)); rows.push(r); }
    res[mode] = rows;
    const sum = f => rows.reduce((a, r) => a + f(r), 0), why = Object.keys(rows[0].why).map(k => `${k} ${sum(r => r.why[k])}`).join(', ');
    console.log(`${BOSS} ${mode}: down ${rows.filter(r => r.down).length}/${seeds}, min to down med ${med(rows.map(r => r.minutes)).toFixed(2)} (sum ${sum(r => r.minutes).toFixed(2)}), ` +
      `deaths med ${med(rows.map(r => r.deaths))} (sum ${sum(r => r.deaths)}: ${why}), embers ${sum(r => r.embers)}, burns ${sum(r => r.burns)}, swarms ${sum(r => r.swarms)}, rims ${sum(r => r.rims)}, overheats ${sum(r => r.overheats)}, ` +
      `kills ${sum(r => r.kills)}, placed ${rows.filter(r => r.placed).length}/${seeds}, stuck ${rows.filter(r => r.stuck > 0).length}, skipped ${sum(r => r.skipped)}`);
  }
  if (res.drift && res.surge) {
    const tot = m => res[m].reduce((a, r) => a + r.minutes, 0), ratio = tot('surge') / tot('drift');
    const allDown = [...res.drift, ...res.surge].every(r => r.down), dmed = med(res.surge.map(r => r.deaths));
    const ok = allDown && ratio >= 0.8 && ratio <= 1.25 && dmed <= 1;
    if (seeds < GATE_SEEDS) console.log(`ratio surge/drift ${ratio.toFixed(3)}; gate: no verdict (${seeds} seeds < ${GATE_SEEDS}: too few to gate on, B-092)`);
    else console.log(`gate ${BOSS} (time surge/drift 0.8–1.25, Surge deaths median ≤ 1, all down): ${ok ? 'PASS' : 'FAIL'} (ratio ${ratio.toFixed(3)}, deaths med ${dmed}, all down ${allDown})`);
  }
}
