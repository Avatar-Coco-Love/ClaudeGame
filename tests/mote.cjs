// S-54 Mote swarm checks (D-142, D-150, mote.js). smoke.cjs calls nodeChecks + browserChecks. Node: a swarm of 6 spawns only
// in the Shoal of a 256 world (none in the Deep, none in a 160 world), 10–12 cells out on open floor; the current adds to a
// mote's velocity (a calm chunk adds none); Surge contact = 4 damage + 1 item taken; Drift contact = no damage, 1 item taken;
// Drift carries a loose pickup outside the Attractor's reach and drops it when beamed; the loot (1 ◆ a mote + the Glitch loot
// once a swarm) is the same in both modes; the beam reaches motes; a mode switch clears them; nothing saved; the
// `biomefoe.mjs` Shoal gate passes on 8 seeds. Browser: motes are drawn. Usage: node tests/mote.cjs [--browser] (MOTE_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { beamFoes } = await import('../src/spitter.js');
  const C = await import('../src/config.js');
  const { CELL, T, UNDERTOW_RING, SWARM_N, SWARM_FIRST_S, SWARM_SPAWN_R, MOTE_DMG, MOTE_TAKE, MOTE_LOOT, GLITCH_LOOT_SHARDS } = C;
  const still = { move: { x: 0, y: 0 }, fire: false, aim: null };
  /** The core in an open 25×25 room on a ring `ring` cell, Glitches / currents off. */
  const make = (mode, ring = UNDERTOW_RING, size = 256, seed = 4242) => {
    const g = new Game({ seed, mode, audio: quiet, size }), w = g.world;
    g.undertow.off = true; g.vents.off = true; g.burrow.off = true; g.upgrades.hull = 6; g.player.integrity = g.stat('hull');
    let at = -1;
    for (let i = 0; i < w.w * w.h && at < 0; i++) {
      const x = i % w.w, y = (i / w.w) | 0;
      if (w.rings[i] !== ring || x < 20 || y < 20 || x > w.w - 20 || y > w.h - 20) continue;
      let ok = true;
      for (let v = -6; v <= 6 && ok; v++) for (let u = -6; u <= 6 && ok; u++) if (w.ring(x + u, y + v) !== ring) ok = false;
      if (ok && (x + y) % 7 === 0) at = i;
    }
    if (at < 0) return null;
    const x = at % w.w, y = (at / w.w) | 0;
    for (let v = -12; v <= 12; v++) for (let u = -12; u <= 12; u++) w.cells[(y + v) * w.w + x + u] = T.EMPTY;
    w.breaks++;
    g.player.x = (x + 0.5) * CELL; g.player.y = (y + 0.5) * CELL; g.player.vx = g.player.vy = 0;
    g.room = { x, y };
    return g;
  };
  const frame = (g, input = still) => { g.enemies.length = 0; g.spawnTimer = 1e9; g.update(1 / 60, input); g.events.length = 0; };
  const pin = g => { g.player.vx = g.player.vy = 0; g.player.x = (g.room.x + 0.5) * CELL; g.player.y = (g.room.y + 0.5) * CELL; };

  { // where and when it spawns
    const shoal = make('drift');
    let first = 0, at = null;
    for (let i = 0; i < 25 * 60 && !first; i++) { pin(shoal); frame(shoal); if (shoal.swarm.motes.length) { first = shoal.stats.time; at = shoal.swarm.motes.map(m => Math.hypot(m.x - shoal.player.x, m.y - shoal.player.y) / CELL); } }
    const deep = make('surge', 2), small = make('surge', 2, 160);
    for (const g of [deep, small]) for (let i = 0; i < 40 * 60; i++) { pin(g); frame(g); }
    check(`S-54 mote: a swarm of ${SWARM_N} spawns in the Shoal after ${SWARM_FIRST_S} s, ${SWARM_SPAWN_R.join('–')} cells out; none in the Deep or a 160 world`,
      !!shoal && first >= SWARM_FIRST_S - 0.05 && first < SWARM_FIRST_S + 0.5 && at.length === SWARM_N && at.every(d => d > SWARM_SPAWN_R[0] - 1.5 && d < SWARM_SPAWN_R[1] + 1.5) &&
      deep.swarm.spawned === 0 && small.swarm.spawned === 0, JSON.stringify({ first, at, deep: deep.swarm.spawned, small: small.swarm.spawned }));
  }
  const withSwarm = mode => { const g = make(mode); g.swarm.timer = 0.01; for (let i = 0; i < 3 && !g.swarm.motes.length; i++) { pin(g); frame(g); } return g.swarm.motes.length ? g : null; };
  { // the current: a mote moves by its chunk's flow on top of its own velocity; a calm chunk adds nothing
    const g = withSwarm('drift'), { flowAt } = await import('../src/undertow.js');
    g.undertow.off = false;
    const flow = g.undertow.flow, W = g.world.chunksW, CH = C.CHUNK * CELL;
    let live = -1, calm = -1;
    for (let i = 0; i < flow.length / 2; i++) {
      const cx = (i % W + 0.5) * CH, cy = (((i / W) | 0) + 0.5) * CH;
      if (g.world.ring(Math.floor(cx / CELL), Math.floor(cy / CELL)) !== UNDERTOW_RING) continue;
      if (flow[i * 2] || flow[i * 2 + 1]) { if (live < 0) live = i; } else if (calm < 0) calm = i;
    }
    const step = i => { // one mote, alone, at a chunk centre in open floor, its own velocity zero and its goal on itself
      const x = (i % W + 0.5) * CH, y = (((i / W) | 0) + 0.5) * CH;
      g.world.cells[Math.floor(y / CELL) * g.world.w + Math.floor(x / CELL)] = T.EMPTY;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.world.cells[(Math.floor(y / CELL) + dy) * g.world.w + Math.floor(x / CELL) + dx] = T.EMPTY;
      const m = g.swarm.motes[0]; g.swarm.motes = [m]; Object.assign(m, { x, y, vx: 0, vy: 0, scatter: 1, sx: x, sy: y, carry: null, prey: null });
      g.player.x = x + 8 * CELL; g.player.y = y; // the core stays in reach (the leash), far from the mote
      const [ux, uy] = flowAt(g, x, y), x0 = m.x, y0 = m.y;
      g.update(1 / 60, still); g.events.length = 0;
      return { dx: m.x - x0, dy: m.y - y0, ux: ux / 60, uy: uy / 60 };
    };
    const a = live >= 0 && step(live), b = calm >= 0 && step(calm);
    check('S-54 mote: the Undertow carries motes (a current chunk moves a still mote by its flow; a calm chunk does not)',
      !!a && !!b && Math.abs(a.dx - a.ux) < 0.05 && Math.abs(a.dy - a.uy) < 0.05 && Math.hypot(a.ux, a.uy) > 0.2 && Math.hypot(b.dx, b.dy) < 0.05, JSON.stringify({ a, b }));
  }
  { // contact: Surge 4 damage + 1 item (most valuable first); Drift no damage + 1 item; then it scatters
    const touch = mode => {
      const g = withSwarm(mode); if (!g) return null;
      g.cargo.shard = 5; g.cargo.tide = 1;
      const hp = g.player.integrity, m = g.swarm.motes[0];
      g.swarm.motes = [m]; Object.assign(m, { x: g.player.x + 2, y: g.player.y, vx: 0, vy: 0 });
      pin(g); frame(g);
      return { dmg: hp - g.player.integrity, shard: g.cargo.shard, tide: g.cargo.tide, scatter: m.scatter > 0, touches: g.swarm.touches };
    };
    const s = touch('surge'), d = touch('drift');
    check(`S-54 mote: Surge contact = ${MOTE_DMG} damage + ${MOTE_TAKE} item (most valuable first), Drift = no damage + ${MOTE_TAKE}; it scatters`,
      !!s && !!d && s.dmg === MOTE_DMG && d.dmg === 0 && s.tide === 0 && d.tide === 0 && s.shard === 5 && d.shard === 5 && s.scatter && d.scatter && s.touches === 1 && d.touches === 1,
      JSON.stringify({ s, d }));
  }
  { // Drift: carries a loose pickup outside the Attractor's reach; beamed, it drops it plus its ◆
    const g = withSwarm('drift');
    g.upgrades.magnet = 0;
    const mag = g.stat('magnet'), m = g.swarm.motes[0];
    g.swarm.motes = [m];
    g.pickups.length = 0;
    g.spawnPickup(g.player.x + 5 * CELL, g.player.y, 'prism');
    const it = g.pickups[0]; it.vx = it.vy = 0; it.age = 1;
    Object.assign(m, { x: it.x - 3 * CELL, y: it.y, vx: 0, vy: 0, scatter: 0 });
    for (let i = 0; i < 120 && !m.carry; i++) { pin(g); frame(g); it.vx = it.vy = 0; }
    const carried = m.carry, left = g.pickups.length;
    m.hp = 0; pin(g); frame(g);
    const n = {}; for (const q of g.pickups) n[q.kind] = (n[q.kind] || 0) + 1;
    check('S-54 mote (Drift): carries a loose pickup the Attractor is not pulling; beamed, drops it plus its ◆',
      5 * CELL > mag && carried === 'prism' && left === 0 && n.prism === 1 && n.shard === MOTE_LOOT && g.swarm.dropped === 1, JSON.stringify({ mag, carried, left, n }));
  }
  { // loot: the same in both modes (6 ◆ + the Glitch loot once); the beam reaches motes
    const loot = mode => {
      const g = withSwarm(mode); if (!g) return null;
      const foe = g.swarm.motes.every(m => beamFoes(g).includes(m));
      g.pickups.length = 0;
      for (const m of g.swarm.motes) m.hp = 0;
      pin(g); frame(g);
      const n = {}; for (const q of g.pickups) n[q.kind] = (n[q.kind] || 0) + 1;
      return { n, tier: g.swarm.tier, gone: g.swarm.motes.length === 0, cleared: g.swarm.cleared, foe };
    };
    const s = loot('surge'), d = loot('drift');
    check(`S-54 mote: a whole swarm pays the same in both modes (${SWARM_N} × ${MOTE_LOOT} ◆ + the Glitch loot once); the beam reaches motes`,
      !!s && JSON.stringify(s) === JSON.stringify(d) && s.n.shard === SWARM_N * MOTE_LOOT + GLITCH_LOOT_SHARDS + s.tier && s.gone && s.cleared === 1 && s.foe,
      JSON.stringify({ s, d }));
  }
  {
    const g = withSwarm('surge'), keys = x => JSON.stringify(Object.keys(x.toSave()));
    const save = JSON.stringify(g.toSave());
    g.setMode('drift');
    check('S-54 mote: a mode switch clears the swarm; nothing saved (no swarm / mote field, toSave keys unchanged)',
      g.swarm.motes.length === 0 && !/swarm|mote/i.test(save) && keys(g) === keys(make('surge')));
  }
  { // the weight gate (D-142, D-146): tools/biomefoe.mjs --biome=shoal, 8 seeds × 10 min
    const out = require('child_process').execFileSync(process.execPath, [require('path').join(__dirname, '../tools/biomefoe.mjs'), '--biome=shoal', '--seeds=8'], { encoding: 'utf8' });
    const line = out.trim().split('\n').pop();
    check('S-54 mote: the biomefoe.mjs Shoal gate passes on 8 seeds (haul with / without 0.85–0.95 each mode, modes within 0.05)', /PASS/.test(line), out.trim().split('\n').map(l => l.slice(0, 60)).join(' | '));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('mote: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  const ok = await pg.evaluate(() => {
    const L = window.__lumen, g = L.game, w = g.world, C = 32;
    let at = -1;
    for (let i = 0; i < w.w * w.h && at < 0; i++) if (w.rings[i] === 3 && w.ring((i % w.w) + 12, (i / w.w | 0) + 12) === 3 && w.ring((i % w.w) - 12, (i / w.w | 0) - 12) === 3 && i % 5 === 0) at = i;
    if (at < 0) return false;
    const x = at % w.w, y = at / w.w | 0;
    for (let v = -4; v <= 4; v++) for (let u = -4; u <= 4; u++) { w.cells[(y + v) * w.w + x + u] = 0; w.markDirty(x + u, y + v); }
    g.player.x = (x + 0.5) * C; g.player.y = (y + 0.5) * C; g.player.vx = g.player.vy = 0;
    L.renderer.cam.x = g.player.x; L.renderer.cam.y = g.player.y;
    g.god = true; g.undertow.off = true; g.vents.off = true; g.pickups.length = 0;
    g.swarm.motes = [];
    for (let k = 0; k < 6; k++) {
      const a = k * 1.05, d = 70 + k * 6, mx = g.player.x + 60 + Math.cos(a) * 24, my = g.player.y - 30 + Math.sin(a) * 24;
      g.swarm.motes.push({ mote: true, x: mx, y: my, vx: Math.cos(a + 1.6) * 120, vy: Math.sin(a + 1.6) * 120, r: 4, hp: 99, maxHp: 99, flash: 0, hitCd: 0, scatter: 0, sx: 0, sy: 0, prey: null, carry: k === 0 ? 'tide' : null,
        trail: [mx - Math.cos(a + 1.6) * 12, my - Math.sin(a + 1.6) * 12, mx - Math.cos(a + 1.6) * 6, my - Math.sin(a + 1.6) * 6, mx, my], d });
    }
    g.swarm.off = true; // hold them still for the frame
    const ctx = L.renderer.ctx, fill = ctx.fill.bind(ctx);
    window.__moteFills = 0;
    ctx.fill = (...a) => { if (ctx.fillStyle === '#96ffc8') window.__moteFills++; return fill(...a); };
    return true;
  });
  await pg.waitForTimeout(150);
  if (shot) await pg.screenshot({ path: shot });
  const n = await pg.evaluate(() => window.__moteFills);
  check('S-54 mote: the swarm is drawn (mint diamonds, over the dark)', ok && n >= 6, JSON.stringify({ ok, n }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.MOTE_SHOT, shot: process.env.MOTE_SHOT });
