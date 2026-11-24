// S-42 Echo (D-108): a lesser core that follows the core and Gathers exposed ore. Intent vs realized like the core:
// `targetVx/Vy` is where it wants to go (down a BFS distance field from the core's cell), `moveBody` is what it got.
// It never takes damage and Glitches ignore it. Owning it is `research.echo`; its live state is never saved.
// S-43: `game.echoOrder` (saved) picks what it does at rest: Gather ore or Guard the core (bolts at Glitches / Spitter bolts).
import { CELL, ORE_KIND, PLAYER_ACCEL, ECHO_R, ECHO_FIELD, ECHO_FIELD_S, ECHO_HOLD, ECHO_SPEED_MUL, ECHO_BLINK_CELLS,
  ECHO_STUCK_S, ECHO_STUCK_PX, ECHO_FADE_S, ECHO_REACH, ECHO_DMG, ECHO_PICK_S,
  ECHO_ORDERS, ECHO_GUARD_S, ECHO_GUARD_PX, ECHO_GUARD_DMG, ECHO_SHOT_S } from './config.js';
import { collides, moveBody } from './body.js';
import { beamFoes } from './spitter.js';

/** S-43: a saved order that isn't one loads as Gather (B-037). */
export const validOrder = o => (ECHO_ORDERS.includes(o) ? o : 'gather');

/** S-43: the next order; false (nothing changes) until the Echo is researched. */
export function cycleEchoOrder(game) {
  if (!game.research.echo) return false;
  game.echoOrder = ECHO_ORDERS[(ECHO_ORDERS.indexOf(validOrder(game.echoOrder)) + 1) % ECHO_ORDERS.length];
  if (game.echo) { game.echo.target = null; game.echo.beam = null; }
  return true;
}

/** The chip text: "Guard (idle)" in Drift, where there is nothing to shoot. */
export function orderLabel(game) {
  return game.echoOrder === 'guard' ? (game.mode === 'drift' ? 'Guard (idle)' : 'Guard') : 'Gather';
}

const SIDE = 2 * ECHO_FIELD + 1;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const AROUND = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]; // blink spots, fixed order (D-025: no draw)

/** The Echo for a game that owns it, placed beside the core (fading in). null without the Research. */
export function makeEcho(game) {
  if (!game.research.echo) return null;
  const e = { x: 0, y: 0, r: ECHO_R, vx: 0, vy: 0, targetVx: 0, targetVy: 0, angle: game.player.angle, alpha: 0,
    blink: { phase: 'in', t: 0 }, field: new Int16Array(SIDE * SIDE), fx: 0, fy: 0, fieldT: 0, fieldVer: -1,
    watch: { on: false }, target: null, pickT: 0, beam: null, blinks: 0, paused: false, guardT: 0, shot: null, shots: 0 };
  placeBeside(game, e);
  buildField(game, e);
  return e;
}

/** Field distance (cells) from the core's cell to cell (x, y); -1 = outside the field or not reachable within it. */
export function fieldAt(e, x, y) {
  const lx = x - e.fx + ECHO_FIELD, ly = y - e.fy + ECHO_FIELD;
  return lx < 0 || ly < 0 || lx >= SIDE || ly >= SIDE ? -1 : e.field[ly * SIDE + lx];
}

function buildField(game, e) {
  const w = game.world, p = game.player, f = e.field;
  e.fx = Math.floor(p.x / CELL); e.fy = Math.floor(p.y / CELL); e.fieldT = ECHO_FIELD_S; e.fieldVer = w.breaks;
  f.fill(-1);
  const q = [ECHO_FIELD * SIDE + ECHO_FIELD];
  f[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], d = f[i];
    if (d >= ECHO_FIELD) continue;
    const lx = i % SIDE, ly = (i - lx) / SIDE;
    for (const [dx, dy] of N4) {
      const nx = lx + dx, ny = ly + dy;
      if (nx < 0 || ny < 0 || nx >= SIDE || ny >= SIDE) continue;
      const j = ny * SIDE + nx;
      if (f[j] >= 0 || w.solid(e.fx + nx - ECHO_FIELD, e.fy + ny - ECHO_FIELD)) continue;
      f[j] = d + 1; q.push(j);
    }
  }
}

/** A body of radius r can slide straight from (ax, ay) to (bx, by): sampled every 4 px. */
function clearLine(world, ax, ay, bx, by, r) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 4);
  for (let i = 1; i <= n; i++) if (collides(world, ax + (bx - ax) * i / n, ay + (by - ay) * i / n, r)) return false;
  return true;
}

/** Reappear on the nearest open cell beside the core (its own cell if all 8 are solid). */
function placeBeside(game, e) {
  const w = game.world, p = game.player, gx = Math.floor(p.x / CELL), gy = Math.floor(p.y / CELL);
  let x = p.x, y = p.y;
  for (const [dx, dy] of AROUND) {
    const cx = (gx + dx + 0.5) * CELL, cy = (gy + dy + 0.5) * CELL;
    if (!collides(w, cx, cy, e.r) && clearLine(w, p.x, p.y, cx, cy, e.r)) { x = cx; y = cy; break; }
  }
  e.x = x; e.y = y; e.vx = e.vy = 0; e.target = null; e.beam = null;
  e.watch = { on: false };
}

function startBlink(game, e) {
  e.blink = { phase: 'out', t: 0 }; e.blinks++; e.target = null; e.beam = null;
  game.audio.echoBlink();
}

/** Run one frame. Called from Game.update after the core moved and its beam was cast. */
export function updateEcho(game, dt) {
  if (!game.research.echo) { game.echo = null; return; }
  if (!game.echo) game.echo = makeEcho(game);
  const e = game.echo, w = game.world, p = game.player;
  e.beam = null;
  if (e.shot && (e.shot.t -= dt) <= 0) e.shot = null;
  e.guardT = Math.max(0, e.guardT - dt);
  if (w.breaks !== e.fieldVer) buildField(game, e); // a cell broke (any cell: a bounded rebuild is cheap, D-108)
  else if ((e.fieldT -= dt) <= 0) buildField(game, e);

  if (e.blink) { // fade out, jump beside the core, fade in; no movement or mining meanwhile
    e.blink.t += dt;
    if (e.blink.phase === 'out') {
      e.alpha = Math.max(0, 1 - e.blink.t / ECHO_FADE_S);
      if (e.blink.t >= ECHO_FADE_S) { placeBeside(game, e); buildField(game, e); e.blink = { phase: 'in', t: 0 }; }
    } else {
      e.alpha = Math.min(1, e.blink.t / ECHO_FADE_S);
      if (e.blink.t >= ECHO_FADE_S) { e.blink = null; e.alpha = 1; }
    }
    return;
  }

  // Pauses: the Ending sequence and the Nexus ring hold it still (no mining). A stranded Echo still blinks back in the
  // ring (B-077: a core death respawns there, far from the Echo); only the Ending skips the blink check.
  e.paused = !!game.endSeq || game.inNexus();
  const d = Math.hypot(p.x - e.x, p.y - e.y), fd = fieldAt(e, Math.floor(e.x / CELL), Math.floor(e.y / CELL));
  let tx = 0, ty = 0, follow = false;
  if (!game.endSeq && (fd < 0 || fd > ECHO_BLINK_CELLS)) { startBlink(game, e); return; }
  if (!e.paused) {
    if (d > ECHO_HOLD[1] * CELL || fd > ECHO_HOLD[1] + 1) { // past the band, or around a bend
      follow = true;
      let gx = p.x, gy = p.y;
      if (!clearLine(w, e.x, e.y, p.x, p.y, e.r)) { // down the field: the 4-neighbour one step closer
        const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
        let best = fd;
        for (const [dx, dy] of N4) {
          const v = fieldAt(e, cx + dx, cy + dy);
          if (v >= 0 && v < best) { best = v; gx = (cx + dx + 0.5) * CELL; gy = (cy + dy + 0.5) * CELL; }
        }
      }
      const gd = Math.hypot(gx - e.x, gy - e.y) || 1, speed = game.stat('thrust') * ECHO_SPEED_MUL;
      tx = (gx - e.x) / gd * speed; ty = (gy - e.y) / gd * speed;
    } else if (d < ECHO_HOLD[0] * CELL && d > 0.01) { // too close: ease away to the band
      const speed = game.stat('thrust') * 0.5;
      tx = (e.x - p.x) / d * speed; ty = (e.y - p.y) / d * speed;
    }
  }
  e.targetVx = tx; e.targetVy = ty;
  const k = Math.min(1, PLAYER_ACCEL * dt);
  e.vx += (tx - e.vx) * k; e.vy += (ty - e.vy) * k;
  const moved = moveBody(w, e, e.vx * dt, e.vy * dt, true);
  if (Math.abs(moved.x) < Math.abs(e.vx * dt) * 0.5) e.vx = moved.x / dt;
  if (Math.abs(moved.y) < Math.abs(e.vy * dt) * 0.5) e.vy = moved.y / dt;
  if (Math.hypot(e.vx, e.vy) > 20) e.angle = Math.atan2(e.vy, e.vx);

  // Stuck: following, but < ECHO_STUCK_PX closer (straight line or path, whichever moved more) in ECHO_STUCK_S.
  if (follow) {
    const nd = Math.hypot(p.x - e.x, p.y - e.y), nf = fieldAt(e, Math.floor(e.x / CELL), Math.floor(e.y / CELL));
    if (!e.watch.on) e.watch = { on: true, t: 0, s0: nd, f0: nf };
    e.watch.t += dt;
    if (e.watch.t >= ECHO_STUCK_S) {
      const gain = Math.max(e.watch.s0 - nd, (e.watch.f0 - nf) * CELL);
      if (gain < ECHO_STUCK_PX) { startBlink(game, e); return; }
      e.watch = { on: true, t: 0, s0: nd, f0: nf };
    }
  } else e.watch = { on: false };

  if (!e.paused) (game.echoOrder === 'guard' ? guard : gather)(game, e, dt);
}

/** S-43 Guard: every ECHO_GUARD_S, a bolt at the foe nearest the core within ECHO_GUARD_PX of it that the Echo can see.
 *  It only takes hp: glitch.js / spitter.js kill or pop it on their next pass (loot as from the beam). */
function guard(game, e) {
  e.target = null;
  if (e.guardT > 0) return;
  const p = game.player, w = game.world;
  let best = null;
  for (const f of beamFoes(game)) {
    if (f.fade !== undefined || f.hp <= 0) continue; // gave up (S-6) or already dead this frame
    const dc = Math.hypot(f.x - p.x, f.y - p.y);
    if (dc > ECHO_GUARD_PX || (best && dc >= best.dc)) continue;
    const d = Math.hypot(f.x - e.x, f.y - e.y);
    if (d > 0.01 && w.raycast(e.x, e.y, (f.x - e.x) / d, (f.y - e.y) / d, Math.max(0, d - f.r))) continue; // rock between
    best = { f, dc };
  }
  if (!best) return;
  const f = best.f;
  e.guardT = ECHO_GUARD_S; e.shots++;
  f.hp -= ECHO_GUARD_DMG; f.flash = 0.08;
  e.shot = { x: f.x, y: f.y, t: ECHO_SHOT_S };
}

const ORE = new Set(Object.keys(ORE_KIND).map(Number));

/** The core is busy only while its beam is on something and it stands still. */
function coreFree(game) {
  const p = game.player, b = game.beam;
  return !(b.on && (b.target || b.enemy)) || Math.hypot(p.realizedVx, p.realizedVy) > 20;
}

/** Ore cell (x, y) the Echo may mine now: explored, beside an open cell, within reach of the core, first on its line. */
function gatherable(game, e, x, y) {
  const w = game.world, p = game.player, i = w.idx(x, y);
  if (!ORE.has(w.cells[i]) || !w.explored[i]) return false;
  if (Math.hypot((x + 0.5) * CELL - p.x, (y + 0.5) * CELL - p.y) > ECHO_REACH * CELL) return false;
  if (!N4.some(([dx, dy]) => !w.solid(x + dx, y + dy))) return false;
  const cx = (x + 0.5) * CELL - e.x, cy = (y + 0.5) * CELL - e.y, cd = Math.hypot(cx, cy) || 1;
  const h = w.raycast(e.x, e.y, cx / cd, cy / cd, cd + CELL);
  return !!h && h.x === x && h.y === y;
}

function gather(game, e, dt) {
  if (game.cargoRoom() <= 0 || !coreFree(game)) { e.target = null; return; }
  const w = game.world, p = game.player;
  if (e.target && !gatherable(game, e, e.target.x, e.target.y)) e.target = null;
  if (!e.target && (e.pickT -= dt) <= 0) {
    e.pickT = ECHO_PICK_S;
    const gx = Math.floor(p.x / CELL), gy = Math.floor(p.y / CELL);
    let best = null;
    for (let y = gy - ECHO_REACH; y <= gy + ECHO_REACH; y++) for (let x = gx - ECHO_REACH; x <= gx + ECHO_REACH; x++) {
      if (!w.inBounds(x, y) || !ORE.has(w.cells[w.idx(x, y)])) continue;
      const d = Math.hypot((x + 0.5) * CELL - e.x, (y + 0.5) * CELL - e.y);
      if ((!best || d < best.d) && gatherable(game, e, x, y)) best = { x, y, d };
    }
    if (best) e.target = { x: best.x, y: best.y };
  }
  if (!e.target) return;
  const { x, y } = e.target, cx = (x + 0.5) * CELL - e.x, cy = (y + 0.5) * CELL - e.y, cd = Math.hypot(cx, cy) || 1;
  const h = w.raycast(e.x, e.y, cx / cd, cy / cd, cd + CELL);
  e.beam = { ex: e.x + cx / cd * h.dist, ey: e.y + cy / cd * h.dist };
  const res = w.hit(x, y, game.stat('beam') * ECHO_DMG * dt);
  if (res && res.broken) { e.target = null; game.onCellBroken(x, y, res.type); }
}

// ---------- drawing (render.js calls this between the beam and the core) ----------
export function drawEcho(r, ctx) {
  const g = r.game, e = g.echo;
  if (!e || e.alpha <= 0) return;
  const p = g.player;
  ctx.save();
  ctx.globalAlpha = 0.25 * e.alpha; ctx.strokeStyle = '#d8fbff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(e.x, e.y); ctx.stroke(); // the tether
  if (e.beam) {
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const [a, lw] of [[0.3, 4], [0.85, 1.2]]) {
      ctx.globalAlpha = a * e.alpha; ctx.strokeStyle = a < 0.5 ? '#2ef2ff' : '#ffffff'; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.beam.ex, e.beam.ey); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  if (e.shot) { // S-43 Guard: a short bright dash from the Echo to what it hit, fading over ECHO_SHOT_S
    const k = e.shot.t / ECHO_SHOT_S, dx = e.shot.x - e.x, dy = e.shot.y - e.y;
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.9 * k * e.alpha; ctx.strokeStyle = '#d8fbff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(e.x + dx * (1 - k) * 0.6, e.y + dy * (1 - k) * 0.6); ctx.lineTo(e.shot.x, e.shot.y); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.translate(e.x, e.y); ctx.rotate(e.angle);
  ctx.globalAlpha = 0.8 * e.alpha; ctx.strokeStyle = '#d8fbff'; ctx.lineWidth = 1.6;
  ctx.shadowColor = '#2ef2ff'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(0, -6); ctx.lineTo(-8, 0); ctx.lineTo(0, 6); ctx.closePath(); ctx.stroke();
  ctx.restore();
}
