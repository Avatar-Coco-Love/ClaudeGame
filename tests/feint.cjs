// S-78a Feint checks (M19, D-224, D-225; feint.js, hunter.js). smoke.cjs calls nodeChecks + browserChecks.
// Node (stub halls): a Feint in a 3-wide hall with a Focus ray on it dashes sideways after the 0.15 s tell, not before;
// in a 1-wide tunnel it never dashes and the beam kills it; the cooldown holds (back on the ray inside 1.6 s: no read);
// left / right draws differ across seeds and repeat per seed; Drift = Surge (same path, same dash); the Deep's second slot
// spawns a Feint, the Veil never does; a lured Feint does not dash. Browser: the tell drawn in the live game, screenshot
// (FEINT_SHOT). Usage: node tests/feint.cjs [--browser]   (FEINT_SHOT=path.png)
const { newWorld } = require('./pinworld.cjs');
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { makeTracer } = await import('../src/hunter.js');
  const { makeDecoy } = await import('../src/decoy.js');
  const { CELL, T, FEINT_TELL_S, FEINT_DASH, FEINT_CD_S } = await import('../src/config.js');
  const still = { move: { x: 0, y: 0 }, fire: false, aim: null };
  const east = { move: { x: 0, y: 0 }, fire: true, aim: { x: 1, y: 0 } };
  /** A 24-long hall `wide` cells across, 30 cells east of the Nexus, dense rock round it; the core pinned at its west end. */
  const hall = (mode = 'surge', wide = 3, seed = 4242) => {
    const g = new Game({ seed, mode, audio: quiet, size: 256 }), w = g.world, ox = w.cx + 30, oy = w.cy, mid = 6;
    g.undertow.off = true; g.vents.off = true; g.burrow.off = true; g.swarm.off = true; g.spawnTimer = 1e9; g.hunt.timer = 1e9; g.hunt.pincer = 1e9;
    g.god = true; g.player.invuln = 1e9;
    for (let y = -2; y <= 14; y++) for (let x = -2; x <= 26; x++) w.cells[w.idx(ox + x, oy + y)] = T.DENSE;
    const h = (wide - 1) / 2;
    for (let y = mid - h; y <= mid + h; y++) for (let x = 0; x <= 23; x++) w.cells[w.idx(ox + x, oy + y)] = T.EMPTY;
    w.breaks++;
    const L = { g, w, ox, oy, mid };
    pin(L); g.player.angle = 0; g.update(1 / 60, still); g.events.length = 0;
    return L;
  };
  const pin = L => Object.assign(L.g.player, { x: (L.ox + 1.5) * CELL, y: (L.oy + L.mid + 0.5) * CELL, vx: 0, vy: 0 });
  const frame = (L, intent = east) => { pin(L); L.g.spawnTimer = 1e9; L.g.update(1 / 60, intent); L.g.events.length = 0; };
  /** A Feint at hall cell (x, mid), run `s` s with the beam east; logs the first tell / dash and the path. */
  const run = (mode, { wide = 3, seed = 4242, x = 12, s = 3, hp = 1e9, until = null } = {}) => {
    const L = hall(mode, wide, seed), g = L.g, e = makeTracer(g, L.ox + x, L.oy + L.mid, 'feint');
    e.hp = e.maxHp = hp; g.hunters.push(e);
    const log = { tell: null, dash: null, vyPre: 0, vyDash: 0, path: [], speed: e.speed };
    for (let t = 0; t < s; t += 1 / 60) {
      frame(L);
      const f = e.feint || {};
      if (log.tell === null && f.tell > 0) log.tell = t;
      if (log.dash === null && f.dash > 0) { log.dash = t; log.vyDash = e.vy; }
      if (log.dash === null) log.vyPre = Math.max(log.vyPre, Math.abs(e.vy));
      log.path.push(+e.x.toFixed(3), +e.y.toFixed(3));
      if (until && until(g, e, t)) break;
      if (!g.hunters.includes(e)) break;
    }
    return { log, e, g, L };
  };

  { // the read: tell first, then a sideways dash
    const { log, g } = run('surge');
    const gap = log.dash !== null && log.tell !== null ? log.dash - log.tell : null;
    check(`S-78a feint: in a 3-wide hall a Focus ray on it starts a ${FEINT_TELL_S} s tell, then it dashes sideways (not before)`,
      gap !== null && gap >= FEINT_TELL_S - 1e-6 && gap <= FEINT_TELL_S + 0.05 && log.vyPre < 0.3 * log.speed && Math.abs(log.vyDash) >= 0.9 * FEINT_DASH * log.speed && g.hunt.dashes >= 1,
      JSON.stringify({ tell: log.tell, gap, vyPre: +log.vyPre.toFixed(1), vyDash: +log.vyDash.toFixed(1), speed: +log.speed.toFixed(1), dashes: g.hunt.dashes }));
  }
  { // a 1-wide tunnel: no open side, no dash; the beam kills it
    const L = hall('surge', 1), g = L.g, e = makeTracer(g, L.ox + 12, L.oy + L.mid, 'feint'); g.hunters.push(e);
    for (let t = 0; t < 12 && g.hunters.includes(e); t += 1 / 60) frame(L);
    check('S-78a feint: in a 1-wide tunnel it never dashes and the beam kills it', !g.hunters.includes(e) && g.hunt.kills === 1 && g.hunt.dashes === 0 && g.hunt.pinned > 0,
      JSON.stringify({ alive: g.hunters.includes(e), kills: g.hunt.kills, dashes: g.hunt.dashes, pinned: g.hunt.pinned }));
  }
  { // the cooldown: put back on the ray right after the dash: no read for FEINT_CD_S, then a read
    const { e, g, L } = run('surge', { until: (g, e) => e.feint && e.feint.cd > 0 });
    const bx = e.x, back = () => { e.x = bx; e.y = (L.oy + L.mid + 0.5) * CELL; e.vx = e.vy = 0; e.best = Infinity; };
    const r0 = g.hunt.reads; let t1 = null;
    for (let t = 0; t < FEINT_CD_S + 0.4; t += 1 / 60) { back(); frame(L); if (t1 === null && g.hunt.reads > r0) t1 = t; }
    check(`S-78a feint: the cooldown holds (back on the ray: no read inside ${FEINT_CD_S} s, a read just after)`,
      t1 !== null && t1 >= FEINT_CD_S - 0.05 && t1 <= FEINT_CD_S + 0.1, JSON.stringify({ t1 }));
  }
  { // left / right: per seed, repeatable; across seeds, both
    const sides = [], again = [];
    for (let s = 1; s <= 10; s++) { sides.push(Math.sign(run('surge', { seed: s, until: (g, e) => e.feint && e.feint.dash > 0 }).log.vyDash)); }
    for (let s = 1; s <= 3; s++) again.push(Math.sign(run('surge', { seed: s, until: (g, e) => e.feint && e.feint.dash > 0 }).log.vyDash));
    check('S-78a feint: the dash side (rng.feint) differs across 10 seeds and repeats per seed', sides.includes(1) && sides.includes(-1) && again.every((v, i) => v === sides[i]),
      JSON.stringify({ sides, again }));
  }
  { // Drift = Surge: the same path and dash up to the dash's end
    const stop = (g, e) => e.feint && e.feint.cd > 0;
    const d = run('drift', { until: stop }).log, s = run('surge', { until: stop }).log;
    check('S-78a feint: Drift = Surge (same path, same tell and dash)', d.path.length > 30 && d.path.join() === s.path.join() && d.dash === s.dash,
      JSON.stringify({ n: d.path.length, dd: d.dash, sd: s.dash }));
  }
  { // the slots: the Deep's second is a Feint; the Veil never has one (natural seed-1 caves)
    const at = (g, r0) => { const nx = Math.floor(g.nexus.x / CELL), ny = Math.floor(g.nexus.y / CELL);
      for (let r = r0; r < r0 + 10; r++) for (let a = 0; a < 64; a++) { const x = nx + Math.round(Math.cos(a / 10) * r), y = ny + Math.round(Math.sin(a / 10) * r); if (!g.world.solid(x, y)) return [x, y]; } };
    const slots = (r0, n) => {
      const g = new Game({ seed: 1, mode: 'drift', audio: quiet, size: 256 }); g.undertow.off = true; g.burrow.off = true; g.swarm.off = true; g.hunt.pincer = 1e9; g.god = true;
      const c = at(g, r0), hold = () => Object.assign(g.player, { x: (c[0] + 0.5) * CELL, y: (c[1] + 0.5) * CELL, vx: 0, vy: 0 });
      for (let k = 0; k < n; k++) { g.hunt.timer = 0.01; for (let i = 0; i < 5; i++) { hold(); g.update(1 / 60, still); } }
      return { ring: g.ringNow, kinds: g.hunters.map(e => e.hunter).join(), feints: g.hunt.feints };
    };
    const deep = slots(54, 3), veil = slots(30, 3);
    check('S-78a feint: the Deep\'s second Tracer slot spawns a Feint (still 2 at a time); the Veil never does',
      deep.ring >= 2 && deep.kinds === 'tracer,feint' && deep.feints === 1 && veil.ring === 1 && veil.kinds === 'tracer' && !veil.feints, JSON.stringify({ deep, veil }));
  }
  { // a lured Feint does not dash: the beam held on it while it circles a Decoy
    const L = hall('surge', 9), g = L.g, e = makeTracer(g, L.ox + 14, L.oy + L.mid, 'feint'); e.hp = e.maxHp = 1e9;
    const dc = makeDecoy(g.world, L.w.idx(L.ox + 14, L.oy + L.mid - 4)); g.decoys.push(dc); g.hunters.push(e);
    let lured = 0, readsLured = 0;
    for (let t = 0; t < 3.5; t += 1 / 60) {
      const p = g.player, dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
      const r0 = g.hunt.reads; frame(L, { move: { x: 0, y: 0 }, fire: true, aim: { x: dx / d, y: dy / d } });
      if (e.lure) { lured++; if (g.hunt.reads > r0) readsLured++; }
    }
    check('S-78a feint: a lured Feint does not read or dash while the beam is on it', lured > 60 && !readsLured && !g.hunt.dashes,
      JSON.stringify({ lured, readsLured, dashes: g.hunt.dashes, reads: g.hunt.reads }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('feint: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(300);
  await pg.evaluate(async () => {
    const L = window.__lumen, g = L.game, w = g.world;
    L.dev.teleport(54, 0.6);
    const cx = Math.floor(g.player.x / 32), cy = Math.floor(g.player.y / 32);
    for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 8; x <= cx + 8; x++) if (w.solid(x, y) && w.get(x, y) !== 5) w.destroy(x, y);
    g.pickups.length = 0; g.god = true; g.burrow.off = true; g.swarm.off = true; g.hunt.timer = 1e9; g.hunt.pincer = 1e9; g.spawnTimer = 1e9;
    const { makeTracer } = await import('./src/hunter.js');
    const e = makeTracer(g, cx + 4, cy, 'feint'); e.hp = e.maxHp = 1e9; g.hunters.push(e);
    g.player.angle = 0;
    // hold the realized tell on screen: the read sets it, then the clock is frozen at half the tell
    e.feint = { tell: 0, dash: 0, cd: 0, nx: 0, ny: -1 };
    window.__feintHold = setInterval(() => { if (e.feint.tell > 0 || e.feint.dash > 0) { e.feint.tell = 0.08; e.feint.dash = 0; } else e.feint.tell = 0.08; e.x = (cx + 4.5) * 32; e.y = (cy + 0.5) * 32; e.vx = e.vy = 0; }, 5);
  });
  await pg.waitForTimeout(400);
  const seen = await pg.evaluate(() => { const g = window.__lumen.game, e = g.hunters.find(h => h.hunter === 'feint'); return { kind: e && e.hunter, tell: e && e.feint.tell > 0, ring: g.ringNow }; });
  if (shot) await pg.screenshot({ path: shot });
  await pg.evaluate(() => clearInterval(window.__feintHold));
  check('S-78a feint: a Feint draws in the live game (diamond + tell chevron), no page error', seen.kind === 'feint' && seen.tell && seen.ring >= 2, JSON.stringify(seen));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.FEINT_SHOT, shot: process.env.FEINT_SHOT });
