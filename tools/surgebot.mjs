// S-30 (D-082): the Surge bot runner. A headless, deterministic bot (no Math.random in the bot; the game's own Math.random
// only moves particles) that paths with A* over the grid, digs what it must, fights Glitches in Surge and retreats to heal.
// Routes: mine (nearest ore by path cost, bank when full), deep (S-32: mine only ore at Spitter depth), rim / hug (degenerate Glitch farms at the Nexus; should not
// beat mine), spire (nearest Spire by path, feed the banked ▲, mine prism cells within 24 cells and carry them in until
// primed, then hold the interior). S-23 adds "Wake held / failed" to the spire route.
// Usage: node tools/surgebot.mjs [--route=mine,spire] [--build=start,mid,max] [--mode=drift,surge] [--seeds=12]
//        [--minutes=20] [--bank=20] [--hold=40] [--weather=on|off] [--anomaly=on,off,overclock,…] [--v]
//        (one line per route × build × mode × anomaly: medians + p90 over seeds)
// S-36: --anomaly=on (default) detours to a charged site whose kind isn't active, open or one dig away, within
// ANOMALY_DETOUR_S path-seconds; off voids every site (none can be taken, even in passing); a kind id voids the other kinds.
import { Game } from '../src/game.js';
import { CELL, T, UPGRADES, SPIRE_PRISMS, NEXUS_RADIUS, SPITTER_TIER, GLITCH_TIER_PX } from '../src/config.js';
import { spireHere, SPIRE_HALF } from '../src/spire.js';
import { siteCharged } from '../src/anomaly.js';
import { beamFoes } from '../src/spitter.js';
import { clearBosses, bossAwake, platesLeft, PLATES } from '../src/boss.js';

/** S-23 guard helpers (one copy for surgebot, wakeprobe and tests/wake.cjs, audit 59): the live Glitch nearest the
 *  Spire core, the spot between the core and a target 3.2 cells out (clamped inside the interior), and the move toward it. */
export function nearestToCore(g, c) { let e = null, bd = Infinity;
  for (const q of g.enemies) { const d = Math.hypot(q.x - c.x, q.y - c.y); if (q.fade === undefined && d < bd) { bd = d; e = q; } } return e; }
export function guardSpot(c, q) { const lim = (SPIRE_HALF - 1.4) * CELL, k = 3.2 * CELL / (Math.hypot(q.x - c.x, q.y - c.y) || 1);
  return { x: c.x + Math.max(-lim, Math.min(lim, (q.x - c.x) * k)), y: c.y + Math.max(-lim, Math.min(lim, (q.y - c.y) * k)) }; }
export function steer(p, to) { const m = Math.hypot(to.x - p.x, to.y - p.y);
  return m < 3 ? { x: 0, y: 0 } : { x: Math.max(-1, Math.min(1, (to.x - p.x) / m * 2)), y: Math.max(-1, Math.min(1, (to.y - p.y) / m * 2)) }; }

export const LEVELS = { start: {}, mid: { beam: 4, range: 3, thrust: 3, cargo: 4, magnet: 2, hull: 2 }, max: null };
const WALL = new Set([T.BEDROCK, T.VAULT, T.CACHE, T.SPIRE, T.FACET, T.BOSS_PLATE, T.BOSS_CORE]); // never dug on a path (a boss cell only when aimed at, S-60b2)
const ORE = new Set([T.CRYSTAL, T.PRISM, T.LUMEN]);
const ANOMALY_DETOUR_S = 20;
const dt = 1 / 60, REPLAN_S = 2, STUCK_S = 5, STUCK_PX = 8, FIGHT_PX = 160, RETREAT = 0.35, SPIRE_R = 24;
const audio = new Proxy({}, { get: () => () => {} });

/** Binary-heap A* / Dijkstra over the grid (4-neighbour). Cost of entering a cell, in seconds: crossing time, plus the
 *  dig time (remaining hp / beam dps) for a solid cell. `goal(i)` ends the search; `h(i)` is an admissible heuristic. */
function search(g, start, goal, h = () => 0, maxCost = Infinity) {
  const w = g.world, N = w.w * w.h, dps = g.stat('beam'), cross = CELL / g.stat('thrust');
  const dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), heap = [];
  const push = (f, i) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0;
    for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
      if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  dist[start] = 0; push(h(start), start);
  while (heap.length) {
    const [f, i] = pop(), d = dist[i];
    if (f - h(i) > d + 1e-9) continue;
    if (goal(i)) { const path = []; for (let k = i; k !== -1; k = prev[k]) path.push(k); return { path: path.reverse(), cost: d, end: i }; }
    if (d > maxCost) return null;
    const x = i % w.w, y = (i / w.w) | 0;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      const t = w.get(nx, ny);
      if (WALL.has(t)) continue;
      const j = ny * w.w + nx, c = cross + (t === T.EMPTY ? 0 : Math.max(0, w.hpAt(nx, ny, t) - w.damage[j]) / dps);
      if (d + c < dist[j]) { dist[j] = d + c; prev[j] = i; push(d + c + h(j), j); }
    }
  }
  return null;
}

// S-53b: `setup(g)` runs once before the clock (biomefoe: start in a biome, place a Relay); `ore(i)` replaces the mine
// route's ore test (cell index -> bool). A surfaced Burrower counts as a foe in both modes (a player beams it).
export function runBot({ seed, route = 'mine', build = 'mid', mode = 'surge', minutes = 20, bank = 20, hold = 40, weather = null, anomaly = 'on', rift = 'off', boss = 'off', echo = false, onTick = null, setup = null, ore = null }) {
  const g = new Game({ seed, mode, audio }), w = g.world, W = w.w;
  for (const s of g.anomaly.sites) if (anomaly !== 'on' && s.kind !== anomaly) s.void = true; // S-36: off / one kind only
  if (weather === 'on' || weather === 'off') g.weather.force = weather; // S-33: storm / aurora all run, or never (default: the schedule)
  if (rift !== 'on') g.rift.force = 'off'; // S-57a (D-156): rifts only when asked (eventrun), so older gates keep their numbers
  if (boss !== 'on') clearBosses(g); // S-60a (D-163): lairs only when asked (S-60b bossrun), the same rule
  for (const u of UPGRADES) g.upgrades[u.id] = LEVELS[build] ? (LEVELS[build][u.id] || 0) : u.max;
  g.player.integrity = g.stat('hull');
  if (route === 'spire') g.bank.prism = bank;
  if (echo) g.research.echo = true; // S-42: echobot runs the same routes with the Echo along
  if (setup) setup(g);
  const capT = minutes * 60, cellOf = (x, y) => Math.floor(y / CELL) * W + Math.floor(x / CELL);
  const cx = i => (i % W + 0.5) * CELL, cy = i => (((i / W) | 0) + 0.5) * CELL;
  let deaths = 0, stuck = 0, skipped = 0, t = 0; const die = g.destabilize.bind(g); g.destabilize = () => { deaths++; die(); };
  const banked0 = { ...g.bank };
  // ---- the driver: follow a path, dig the next solid cell, fight Glitches in reach, retreat when hurt ----
  let plan = null, planT = -1, goalFn = null, goalKey = '', replanned = false, watch = { x: 0, y: 0, t: 0, mined: 0 };
  const setGoal = (key, fn) => { if (key !== goalKey) { goalKey = key; goalFn = fn; plan = null; replanned = false; watch = { x: g.player.x, y: g.player.y, t, mined: g.stats.mined }; } };
  // S-32: a bolt in flight inside FIGHT_PX is a foe too (a player beams it). Spitters count only inside FIGHT_PX, like any
  // Glitch: aiming at one out of beam reach stalled the dig (stuck on a spire run).
  const foe = () => { let best = null, bd = FIGHT_PX;
    for (const e of beamFoes(g)) { if (e.fade !== undefined) continue; // S-54: what the beam can hit (Glitches, bolts, a surfaced Burrower, motes)
    const d = Math.hypot(e.x - g.player.x, e.y - g.player.y); if (d < bd) { bd = d; best = e; } } return best; };
  /** One frame toward the current goal. Returns 'arrived' | 'moving' | 'skip' (stuck twice, or no path). */
  const drive = () => {
    const p = g.player, here = cellOf(p.x, p.y);
    if (goalFn(here)) { tick({ x: p.x, y: p.y }); return 'arrived'; }
    if (!plan || t - planT >= REPLAN_S || !plan.path.includes(here)) { plan = search(g, here, goalFn); planT = t; if (!plan) return 'skip'; }
    const k = plan.path.indexOf(here), next = plan.path[Math.min(k + 1, plan.path.length - 1)];
    const target = { x: cx(next), y: cy(next) };
    tick(target, w.get(next % W, (next / W) | 0) !== T.EMPTY ? target : null);
    // Stuck: no movement, no broken cell and no beam damage for STUCK_S -> re-plan once, then skip the goal.
    if (Math.hypot(p.x - watch.x, p.y - watch.y) >= STUCK_PX || g.stats.mined !== watch.mined || (g.beam.target && g.beam.target.frac > 0)) {
      if (t - watch.t >= STUCK_S) watch = { x: p.x, y: p.y, t, mined: g.stats.mined };
    } else if (t - watch.t >= STUCK_S) {
      watch = { x: p.x, y: p.y, t, mined: g.stats.mined };
      if (!replanned) { replanned = true; plan = null; } else { stuck++; return 'skip'; }
    }
    return 'moving';
  };
  const tick = (to, dig = null) => {
    const p = g.player, e = foe(), m = Math.hypot(to.x - p.x, to.y - p.y);
    const move = m < 2 ? { x: 0, y: 0 } : { x: Math.max(-1, Math.min(1, (to.x - p.x) / m * 2)), y: Math.max(-1, Math.min(1, (to.y - p.y) / m * 2)) };
    const aimAt = e || dig || (m >= 2 ? to : { x: p.x + Math.cos(p.angle), y: p.y + Math.sin(p.angle) });
    g.update(dt, { move, fire: !!(e || dig), aim: { x: aimAt.x - p.x, y: aimAt.y - p.y } });
    t += dt;
    if (onTick) onTick(g, dt);
  };
  const inNexusCell = i => Math.hypot(cx(i) - g.nexus.x, cy(i) - g.nexus.y) < NEXUS_RADIUS - CELL;
  const depositCell = i => inNexusCell(i) || g.relays.some(r => Math.hypot(cx(i) - r.x, cy(i) - r.y) < r.r * 0.6);
  /** Hurt (Surge): head for the Nexus and heal to full. Returns true while it is busy with that. */
  let healing = false;
  const retreat = () => {
    if (mode !== 'surge') return false;
    const p = g.player, max = g.stat('hull');
    if (!healing && p.integrity < max * RETREAT) healing = true;
    if (healing && g.inNexus() && p.integrity >= max) healing = false;
    if (!healing) return false;
    setGoal('heal', inNexusCell);
    if (drive() === 'skip') { setGoal('', null); healing = false; }
    return true;
  };
  const bankRun = () => { setGoal('bank', depositCell); const r = drive(); if (r === 'arrived') { for (let k = 0; k < 600 && g.cargoTotal() > 0 && t < capT; k++) tick(g.player); setGoal('', null); } return r; };
  const bad = new Set();
  const out = { seed, route, build, mode, anomaly, deaths: 0, stuck: 0, skipped: 0, minutes: 0, buffs: 0 };
  const take = g.notify.bind(g); g.notify = ev => { if (ev === 'anomaly') out.buffs++; take(ev); };
  /** S-36: the nearest takeable site (charged, kind not active, its cell open or next to an open one) within
   *  ANOMALY_DETOUR_S path-seconds, as a cell index; or -1. */
  const siteGoal = () => {
    const want = new Set(), wc = (x, y) => w.get(x, y) === T.EMPTY;
    g.anomaly.sites.forEach((s, i) => { const j = s.y * W + s.x;
      if (siteCharged(g, i) && !g.buffs.includes(s.kind) && !bad.has(j) && (wc(s.x, s.y) || wc(s.x + 1, s.y) || wc(s.x - 1, s.y) || wc(s.x, s.y + 1) || wc(s.x, s.y - 1))) want.add(j); });
    if (!want.size) return -1;
    const r = search(g, cellOf(g.player.x, g.player.y), i => want.has(i), () => 0, ANOMALY_DETOUR_S);
    return r && r.cost <= ANOMALY_DETOUR_S ? r.end : -1;
  };

  if (route === 'mine' || route === 'deep' || route === 'rim' || route === 'hug') {
    // rim: a spot 1.4 R out (only 1 Glitch near the Nexus, GLITCH_CAP); hug: just inside the ring's edge.
    const spot = route === 'rim' ? 1.4 : 0.92, pick = (() => { let best = -1, bd = Infinity;
      for (let i = 0; i < W * w.h; i++) { const d = Math.abs(Math.hypot(cx(i) - g.nexus.x, cy(i) - g.nexus.y) - NEXUS_RADIUS * spot);
        if (d < CELL * 0.5 && !WALL.has(w.cells[i])) { const s = Math.hypot(cx(i) - g.nexus.x, cy(i) - g.player.y - CELL * 8); if (s < bd) { bd = s; best = i; } } } return best; })();
    while (t < capT) {
      if (retreat()) continue;
      if (g.cargoRoom() < 2) { if (bankRun() === 'skip') break; continue; }
      if (route === 'mine' || route === 'deep') { // deep (S-32): only ore at Spitter depth (tier >= SPITTER_TIER)
        if (!goalKey && anomaly !== 'off') { const j = siteGoal(); if (j >= 0) setGoal(`site${j}`, i => i === j); }
        if (goalKey.startsWith('site')) { // S-36: the detour; on arrival, settle onto the site's centre to take it
          const r = drive(), j = Number(goalKey.slice(4));
          if (r === 'skip') { bad.add(j); skipped++; setGoal('', null); }
          else if (r === 'arrived') { const n0 = out.buffs; for (let k = 0; k < 90 && out.buffs === n0 && t < capT; k++) tick({ x: cx(j), y: cy(j) }); if (out.buffs === n0) bad.add(j); setGoal('', null); }
          continue;
        }
        const far = route === 'deep' ? SPITTER_TIER * GLITCH_TIER_PX : 0;
        setGoal('ore', i => (ore ? ore(i) : ORE.has(w.cells[i])) && !bad.has(i) && Math.hypot(cx(i) - g.nexus.x, cy(i) - g.nexus.y) >= far);
        const r = drive();
        if (r === 'skip') { if (!plan) break; bad.add(plan.end); skipped++; setGoal('', null); }
        else if (r === 'arrived') { for (let k = 0; k < 50 && t < capT; k++) tick(g.player); setGoal('', null); } // let the Attractor pull
      } else {
        setGoal('spot', i => i === pick);
        if (drive() === 'skip') break;
      }
    }
    Object.assign(out, { shardMin: (g.bank.shard - banked0.shard) / minutes, prismMin: (g.bank.prism - banked0.prism) / minutes });
    out.haulMin = out.shardMin + out.prismMin;
    out.carried = g.cargoTotal(); // S-36: still in cargo at the cap (a Ballast run carries more): `gainMin` counts it
    out.gainMin = out.haulMin + out.carried / minutes;
  } else if (route === 'boss') {
    // S-60b2 (D-165): take boss 0 apart. Target: the lit plate (asleep) or the standing plate nearest the core (awake), then
    // the boss core; stand on an open 4-neighbour of it and beam it (a foe in reach first: embers, Glitches, a Burrower).
    // No retreat: healing is only at the Nexus, ~100 cells off; a death respawns there and the bot paths back.
    const B = g.bosses.list[0]; let tgt = -1;
    const pick = () => {
      if (!platesLeft(g, B)) return B.y * W + B.x;
      const live = PLATES.map(([i, j]) => (B.y + j) * W + B.x + i).filter(c => w.cells[c] === T.BOSS_PLATE);
      if (!bossAwake(g, B)) return (B.y + PLATES[B.lit][1]) * W + B.x + PLATES[B.lit][0];
      if (live.includes(tgt)) return tgt;
      return live.reduce((a, c) => Math.hypot(cx(c) - g.player.x, cy(c) - g.player.y) < Math.hypot(cx(a) - g.player.x, cy(a) - g.player.y) ? c : a);
    };
    while (B && !B.down && t < capT) {
      tgt = pick();
      const j = tgt, spot = i => w.cells[i] === T.EMPTY && Math.abs(i % W - j % W) + Math.abs(((i / W) | 0) - ((j / W) | 0)) === 1;
      setGoal(`boss${j}`, spot);
      const here = cellOf(g.player.x, g.player.y);
      if (spot(here)) tick({ x: cx(here), y: cy(here) }, { x: cx(j), y: cy(j) });
      else if (drive() === 'skip') { skipped++; setGoal('', null); tick(g.player); }
    }
    Object.assign(out, { down: !!(B && B.down), toDown: B && B.down ? t / 60 : null, plates: B ? platesLeft(g, B) : 0 });
  } else if (route === 'spire') {
    const H = SPIRE_HALF - 1, inSpire = (s, i) => Math.abs((i % W) - s.x) <= H && Math.abs(((i / W) | 0) - s.y) <= H && w.cells[i] === T.EMPTY;
    const first = search(g, cellOf(g.player.x, g.player.y), i => g.spires.some(s => inSpire(s, i)));
    const s = first && g.spires.find(q => inSpire(q, first.end));
    let primedT = null, holdT = 0, holdDeaths = 0, holdOk = null, relitT = null, wakes = 0, wakeFails = 0;
    const note = g.notify.bind(g); g.notify = ev => { if (ev === 'wake-start') wakes++; if (ev === 'wake-failed') wakeFails++; note(ev); };
    /** S-23 guard: stand between the core and the Glitch nearest it (inside the interior), beam that Glitch. */
    const guard = () => {
      const p = g.player, e = nearestToCore(g, g.wake.core);
      if (!e) { tick(p); return; }
      g.update(dt, { move: steer(p, guardSpot(g.wake.core, e)), fire: true, aim: { x: e.x - p.x, y: e.y - p.y } }); t += dt;
    };
    while (s && t < capT) {
      if (retreat()) continue;
      const fed = s.fed >= SPIRE_PRISMS;
      if (fed && primedT === null) { primedT = t; holdT = 0; }
      if (fed && mode === 'surge') { // S-23: the Wake. Guard the core until relit; a failed Wake -> step out, come back in
        if (s.lit) { relitT = t; break; }
        if (g.wake) { guard(); continue; }
        if (g.wakeBlock === s) setGoal('out', i => Math.max(Math.abs(i % W - s.x), Math.abs(((i / W) | 0) - s.y)) > SPIRE_HALF + 1 && w.cells[i] === T.EMPTY);
        else setGoal('spire', i => inSpire(s, i));
        if (drive() === 'skip') { out.end = 'no path'; break; }
        continue;
      }
      if (fed) { // hold the interior for `hold` s; a death during it fails the hold
        const d0 = deaths;
        setGoal('spire', i => inSpire(s, i)); drive();
        if (spireHere(g) === s) holdT += dt;
        if (deaths > d0) holdDeaths++;
        if (holdT >= hold) { holdOk = holdDeaths === 0; break; }
        continue;
      }
      const room = g.cargoRoom(), cp = g.cargo.prism;
      const target = (() => { let n = 0; for (let y = s.y - SPIRE_R; y <= s.y + SPIRE_R; y++) for (let x = s.x - SPIRE_R; x <= s.x + SPIRE_R; x++)
        if (w.get(x, y) === T.PRISM && !bad.has(y * W + x) && Math.hypot(x - s.x, y - s.y) <= SPIRE_R) n++; return n; })();
      const anyPrism = target || w.cells.some((c, i) => c === T.PRISM && !bad.has(i));
      if (g.bank.prism > 0 || cp >= 8 || (cp > 0 && (room < 3 || !anyPrism))) setGoal('feed', i => inSpire(s, i));
      if (goalKey === 'feed') {
        const r = drive();
        if (r === 'arrived') { // stand still while the feed runs, then go back out
          for (let k = 0; k < 60 * 12 && g.cargo.prism + g.bank.prism > 0 && s.fed < SPIRE_PRISMS && t < capT && spireHere(g) === s; k++) tick(g.player);
          setGoal('', null);
        } else if (r === 'skip') break;
        continue;
      }
      if (room < 3) { if (bankRun() === 'skip') break; continue; }
      if (!anyPrism) { out.dry = 1; break; } // no prism cell left anywhere
      if (!target) out.far = 1; // the 24-cell neighbourhood is mined out: the nearest prism anywhere, by path cost
      setGoal(target ? 'prism' : 'prism-far', i => w.cells[i] === T.PRISM && !bad.has(i) && Math.hypot(i % W - s.x, ((i / W) | 0) - s.y) <= (target ? SPIRE_R : Infinity));
      const r = drive();
      if (r === 'skip') { if (!plan) { out.end = 'no path'; break; } bad.add(plan.end); skipped++; setGoal('', null); }
      else if (r === 'arrived') { for (let k = 0; k < 50 && t < capT; k++) tick(g.player); setGoal('', null); } // let the Attractor pull
    }
    Object.assign(out, { wakes, wakeFails, wakeHeld: relitT !== null, toRelit: relitT === null || primedT === null ? null : (relitT - primedT) / 60, primed: primedT !== null, toPrimed: primedT === null ? null : primedT / 60, holdDeaths, held: holdOk, fed: s ? s.fed : 0 });
  }
  Object.assign(out, { kills: g.stats.glitches, deaths, stuck, skipped, minutes: t / 60, deathsMin: deaths / Math.max(t / 60, 1e-9), capped: t >= capT });
  return out;
}

const q = (v, f) => { const s = v.filter(x => x != null && Number.isFinite(x)).sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(f * s.length))] : NaN; };
const fmt = v => { const a = q(v, 0.5), b = q(v, 0.9); return Number.isNaN(a) ? '—' : `${a.toFixed(1)}/${b.toFixed(1)}`; };

/** One report line per (route, build, mode), medians/p90 over seeds. */
export function summarize(rows) {
  const r0 = rows[0], n = rows.length, col = k => rows.map(r => r[k]), cnt = f => rows.filter(f).length;
  let line = `${r0.route} ${r0.build} ${r0.mode} anomaly=${r0.anomaly} (${n} seeds, med/p90): deaths/min ${fmt(col('deathsMin'))}`;
  if (r0.route === 'spire') {
    const held = rows.filter(r => r.held !== null);
    line += `, min to primed ${fmt(col('toPrimed'))}, primed ${cnt(r => r.primed)}/${n} (went past 24 cells ${cnt(r => r.far)}), deaths ${fmt(col('deaths'))}, hold deaths ${fmt(col('holdDeaths'))}, ` +
      (r0.mode === 'surge' ? `Wake held ${cnt(r => r.wakeHeld)}/${cnt(r => r.wakes > 0)}, Wakes failed ${col('wakeFails').reduce((a, b) => a + b, 0)} of ${col('wakes').reduce((a, b) => a + b, 0)}, ` +
        `fail rate ${Math.round(100 * col('wakeFails').reduce((a, b) => a + b, 0) / Math.max(1, col('wakes').reduce((a, b) => a + b, 0)))} %, primed→relit min ${fmt(col('toRelit'))}`
        : `holds survived ${held.length ? Math.round(100 * held.filter(r => r.held).length / held.length) : 0} % of ${held.length}`);
  } else line += `, ◆/min ${fmt(col('shardMin'))}, ▲/min ${fmt(col('prismMin'))}, haul/min ${fmt(col('haulMin'))}`;
  line += `, buffs taken ${fmt(col('buffs'))}, kills/min ${fmt(rows.map(r => r.kills / Math.max(r.minutes, 1e-9)))}`;
  return line + `, stuck ${cnt(r => r.stuck > 0)}, skipped goals ${col('skipped').reduce((a, b) => a + b, 0)}, capped ${cnt(r => r.capped)}`;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
  const routes = arg('route', 'mine,spire').split(','), builds = arg('build', 'start,mid,max').split(','), modes = arg('mode', 'drift,surge').split(',');
  const seeds = Number(arg('seeds', 12)), minutes = Number(arg('minutes', 20)), bank = Number(arg('bank', 20)), hold = Number(arg('hold', 40));
  const V = process.argv.includes('--v');
  const anomalies = arg('anomaly', 'on').split(',');
  for (const route of routes) for (const build of builds) for (const mode of modes) for (const anomaly of anomalies) {
    const rows = [];
    for (let k = 1; k <= seeds; k++) { const r = runBot({ seed: k * 7919, route, build, mode, minutes, bank, hold, weather: arg('weather', null), anomaly }); if (V) console.log(JSON.stringify(r)); rows.push(r); }
    console.log(summarize(rows));
  }
}
