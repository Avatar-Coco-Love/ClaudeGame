// S-77a Decoy checks (D-208, D-212; decoy.js). smoke.cjs calls nodeChecks + browserChecks. Node: S-77b2 (D-218) the Lure
// Nexus level fills the stock (2, stock + placed ≤ 3), a deposit refills it, no Lure no stock; a lured hunter takes /
// deals nothing; the 27 -> 28 save step; placement open floor outside the Nexus disc; pick-up; in a stub room a Tracer 5 cells
// from a Decoy with a clear line turns to it (and not through rock), circles it 4 s, then the Decoy is gone and it walks
// the field again; a Pincer flank lures the same; a fleeing thief ignores one; Drift = Surge (same path and hold); a Glitch
// ignores it; save round-trip, the previous format loads none, junk loads none. Browser: no Craft row, a Nexus Lure row
// (360 × 640, screenshot DECOY_LURE_SHOT); place with B, a Tracer circling it; screenshot. Usage: node tests/decoy.cjs [--browser]   (DECOY_SHOT=path.png)
const { newWorld } = require('./pinworld.cjs');
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT, STEPS } = await import('../src/save.js');
  const { makeDecoy } = await import('../src/decoy.js');
  const { tryPlace, placeRefusal } = await import('../src/craft.js');
  const { makeTracer } = await import('../src/hunter.js');
  const { makeGlitch } = await import('../src/glitch.js');
  const { CELL, T, DECOY_HOLD_S, LURE_COST } = await import('../src/config.js');
  const still = { move: { x: 0, y: 0 }, fire: false, aim: null };
  const give = g => Object.assign(g.bank, { prism: 100, shard: 500 });
  /** A 20 × 12 open room 30 cells east of the Nexus, dense rock round it; the core pinned at its west end (2, 6). */
  const room = (mode = 'surge') => {
    const g = new Game({ seed: 4242, mode, audio: quiet, size: 256 }), w = g.world, ox = w.cx + 30, oy = w.cy;
    g.undertow.off = true; g.vents.off = true; g.burrow.off = true; g.swarm.off = true; g.spawnTimer = 1e9; g.hunt.timer = 1e9; g.hunt.pincer = 1e9;
    g.god = true; g.player.invuln = 1e9;
    for (let y = -2; y <= 14; y++) for (let x = -2; x <= 22; x++) w.cells[w.idx(ox + x, oy + y)] = T.DENSE;
    for (let y = 0; y <= 11; y++) for (let x = 0; x <= 19; x++) w.cells[w.idx(ox + x, oy + y)] = T.EMPTY;
    w.breaks++;
    const L = { g, w, ox, oy };
    pin(L); g.update(1 / 60, still); g.events.length = 0;
    return L;
  };
  const pin = L => Object.assign(L.g.player, { x: (L.ox + 2.5) * CELL, y: (L.oy + 6.5) * CELL, vx: 0, vy: 0 });
  const frame = L => { pin(L); L.g.spawnTimer = 1e9; L.g.update(1 / 60, still); L.g.events.length = 0; };
  const cell = (L, x, y) => L.w.idx(L.ox + x, L.oy + y);
  /** A Tracer at room cell (14, 6) and a Decoy 5 cells north of it at (14, 1); runs `s` seconds, logging the hunter. */
  const lure = (mode, { wall = false, flee = 0, kind = 'tracer', s = 7 } = {}) => {
    const L = room(mode), g = L.g;
    if (wall) { for (let x = 11; x <= 17; x++) g.world.cells[cell(L, x, 3)] = T.DENSE; g.world.breaks++; }
    const dc = makeDecoy(g.world, cell(L, 14, 1)); g.decoys.push(dc);
    const e = makeTracer(g, L.ox + 14, L.oy + 6, kind);
    if (kind === 'flank') { e.searchT = 0; e.path = null; e.pi = 0; }
    if (flee) e.flee = flee;
    g.hunters.push(e);
    const log = { arrive: null, gone: null, first: null, after: null, minD: Infinity, lured: false };
    for (let t = 0; t < s; t += 1 / 60) {
      frame(L);
      const d = Math.hypot(e.x - dc.x, e.y - dc.y) / CELL;
      if (g.decoys.includes(dc)) log.minD = Math.min(log.minD, d);
      if (e.lure) log.lured = true;
      if (log.first === null && t >= 0.4) log.first = { vx: +e.vx.toFixed(1), vy: +e.vy.toFixed(1) };
      if (log.arrive === null && dc.hold !== null) log.arrive = +t.toFixed(3);
      if (log.gone === null && !g.decoys.includes(dc)) log.gone = +t.toFixed(3);
      if (log.gone !== null && log.after === null && t >= log.gone + 0.5) log.after = { vx: +e.vx.toFixed(1), lure: !!e.lure, x: +(e.x / CELL - L.ox).toFixed(2) };
    }
    return { log, e, g, L, dc };
  };

  { // S-77b2: Lure + place + pick up
    const L = room('drift'), g = L.g;
    const no = g.canAffordNexus('lure'), none = g.craft.decoy; give(g);
    const b0 = { ...g.bank }, ok = g.buyNexus('lure'), again = g.canAffordNexus('lure');
    check(`S-77b2 decoy: Lure costs ▲${LURE_COST} once and fills the stock to 2; no Lure, no stock`,
      !no && none === 0 && ok && !again && g.nexusLevels.lure === 1 && g.craft.decoy === 2 && b0.prism - g.bank.prism === LURE_COST && b0.shard === g.bank.shard,
      JSON.stringify({ no, none, ok, again, stock: g.craft.decoy, paid: b0.prism - g.bank.prism }));
    { // a deposit refills, capped by placed; no Lure: a deposit gives none
      const d = room('drift').g, dep = (x, n) => { x.player.x = x.nexus.x; x.player.y = x.nexus.y; x.cargo.shard = n; for (let k = 0; k < 120; k++) x.update(1 / 60, still); };
      d.nexusLevels.lure = 1; d.craft.decoy = 0; d.decoys.push({ i: 1, x: 0, y: 0, hold: null }, { i: 2, x: 0, y: 0, hold: null }); dep(d, 3);
      const capped = d.craft.decoy; d.decoys.length = 0; d.craft.decoy = 0; dep(d, 3);
      const full = d.craft.decoy;
      const n = room('drift').g; dep(n, 3);
      check('S-77b2 decoy: a deposit refills the stock to 2, capped so stock + placed ≤ 3; without Lure a deposit gives none',
        capped === 1 && full === 2 && n.craft.decoy === 0 && n.bank.shard >= 3, JSON.stringify({ capped, full, noLure: n.craft.decoy, banked: n.bank.shard }));
    }
    g.craft.last = 'decoy';
    const at = (x, y) => Object.assign(g.player, { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL });
    at(L.ox - 1, L.oy + 4); const rock = placeRefusal(g, 'decoy');
    at(g.world.cx, g.world.cy + 1); const nexus = placeRefusal(g, 'decoy');
    at(L.ox + 6, L.oy + 4); const placed = tryPlace(g);
    at(L.ox + 8, L.oy + 4); const second = tryPlace(g);
    check('S-77a decoy: placement is open floor outside the Nexus disc; two Decoys may sit 2 cells apart (no gap rule)',
      rock === 'blocked' && nexus === 'nexus' && placed && second && g.decoys.length === 2 && g.craft.decoy === 0 && g.placeResult === 'placed', JSON.stringify({ rock, nexus, placed, second }));
    at(L.ox + 6, L.oy + 4);
    const up = tryPlace(g);
    check('S-77a decoy: B / ✦ on a Decoy picks it up into stock (full refund)', up && g.craft.decoy === 1 && g.decoys.length === 1 && g.placeResult === 'picked', JSON.stringify({ stock: g.craft.decoy, res: g.placeResult }));
    // save round trip (the room was carved by hand: mark the Decoy's cell as mined so it reloads open)
    for (const q of g.decoys) g.world.broken[q.i] = 1;
    const s = JSON.parse(JSON.stringify(g.toSave()));
    const h = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: upgradeSave(s) });
    check('S-77a decoy: placed Decoys and carried stock survive a save round-trip',
      h.decoys.length === 1 && h.decoys[0].i === g.decoys[0].i && h.decoys[0].hold === null && h.craft.decoy === 1, JSON.stringify({ decoys: h.decoys.map(q => q.i), stock: h.craft.decoy }));
    // S-66a: the format before Decoys is found by the step that adds `craft.decoy`, not SAVE_FORMAT - 1 (a later format moved it)
    const decoyStep = STEPS.findIndex(f => { try { return 'decoy' in (f({ craft: {} }).craft || {}); } catch { return false; } });
    const old = { ...s, v: decoyStep + 1 }; delete old.decoys; old.craft = { beacon: 1, relay: 0, sink: 0, ward: 1, last: 'ward' };
    const u = upgradeSave(JSON.parse(JSON.stringify(old)));
    check('S-77a decoy: a save from before Decoys upgrades to SAVE_FORMAT with no Decoys crafted or placed (and no Lure)',
      u && u.v === SAVE_FORMAT && u.craft.decoy === 0 && Array.isArray(u.decoys) && !u.decoys.length && u.craft.ward === 1 && u.nexus.lure === 0, JSON.stringify(u && { v: u.v, craft: u.craft, decoys: u.decoys, nexus: u.nexus }));
    // S-77b2: the step that adds `nexus.lure` builds it for a save that holds a Decoy (stock or placed), else not
    const lureStep = STEPS.findIndex(f => { try { return 'lure' in (f({ nexus: {}, craft: {} }).nexus || {}); } catch { return false; } });
    const pre = (craft, decoys) => { const o = { ...JSON.parse(JSON.stringify(s)), v: lureStep + 1, craft: { ...s.craft, decoy: craft }, decoys }; delete o.nexus.lure; return upgradeSave(o); };
    const a = pre(2, []), b = pre(0, [g.decoys[0].i]), c = pre(0, []);
    const ag = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: a });
    check('S-77b2 decoy: a save before Lure with stock 2 loads Lure 1 + stock 2; one placed loads Lure 1; none loads Lure 0',
      lureStep >= 0 && a.nexus.lure === 1 && ag.nexusLevels.lure === 1 && ag.craft.decoy === 2 && b.nexus.lure === 1 && c.nexus.lure === 0,
      JSON.stringify({ lureStep, a: a.nexus.lure, stock: ag.craft.decoy, b: b.nexus.lure, c: c.nexus.lure }));
    const nexusCell = Math.floor(h.nexus.y / CELL) * h.world.w + Math.floor(h.nexus.x / CELL);
    const j = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: upgradeSave({ ...JSON.parse(JSON.stringify(s)), decoys: [-1, 'x', 2.5, nexusCell, 0], craft: { decoy: 99 } }) });
    check('S-77a decoy: junk Decoys / stock in a save load as none / clamped (B-037)', j.decoys.length === 0 && j.craft.decoy === 2, JSON.stringify({ decoys: j.decoys.length, stock: j.craft.decoy }));
  }
  { // the lure: turn, hold, spend, resume
    const R = lure('surge'), l = R.log, held = l.gone !== null && l.arrive !== null ? l.gone - l.arrive : null;
    check('S-77a decoy: a Tracer 5 cells from a Decoy with a clear line turns to it (north, off its westward field)',
      l.first && l.first.vy < -20 && Math.abs(l.first.vx) < Math.abs(l.first.vy) / 3, JSON.stringify(l.first));
    check(`S-77a decoy: it circles the Decoy (within 0.6 cell) for ${DECOY_HOLD_S} s, then the Decoy is spent`,
      l.arrive !== null && Math.abs(held - DECOY_HOLD_S) < 0.05 && l.minD < 0.6 && R.g.decoysSpent === 1, JSON.stringify({ ...l, held }));
    check('S-77a decoy: after the Decoy is spent the hunter walks the field to the core again (west, unlured)',
      l.after && !l.after.lure && l.after.vx < -20 && R.e.fade === undefined, JSON.stringify(l.after));
    const W = lure('surge', { wall: true, s: 2 });
    check('S-77a decoy: not through rock: with a wall between, the Tracer keeps to the field', !W.log.lured && W.dc.hold === null && W.e.vx < -20, JSON.stringify({ lured: W.log.lured, vx: W.e.vx }));
    const D = lure('drift');
    check('S-77a decoy: Drift = Surge: the same arrival and the same hold (one rule, D-002)',
      D.log.arrive === l.arrive && D.log.gone === l.gone && Math.abs(D.log.minD - l.minD) < 1e-9, JSON.stringify({ drift: [D.log.arrive, D.log.gone], surge: [l.arrive, l.gone] }));
    const F = lure('drift', { flee: 3, s: 2 });
    check('S-77a decoy: a fleeing Drift thief ignores Decoys', !F.log.lured && F.dc.hold === null, JSON.stringify({ lured: F.log.lured }));
    const P = lure('surge', { kind: 'flank' });
    check('S-77a decoy: a Pincer flank lures the same (its A* waits)', P.log.lured && P.log.arrive !== null && P.log.gone !== null, JSON.stringify(P.log));
  }
  { // S-77b2 (D-218): a Tracer circling a Decoy on the core's cell takes nothing (Drift) / deals nothing (Surge), then touches
    const held = mode => {
      const L = room(mode), g = L.g; g.god = false; g.player.invuln = 0;
      Object.assign(g.cargo, { shard: 40 }); const hull = g.player.integrity;
      const dc = makeDecoy(g.world, cell(L, 2, 6)); g.decoys.push(dc);
      const e = makeTracer(g, L.ox + 5, L.oy + 6); g.hunters.push(e);
      let during = null, arrive = null;
      for (let t = 0; t < DECOY_HOLD_S + 3; t += 1 / 60) {
        const was = { shard: g.cargo.shard, hull: g.player.integrity, taken: g.hunt.taken || 0 }; // the frame the Decoy is spent frees it
        frame(L);
        if (arrive === null && dc.hold !== null) arrive = t;
        if (during === null && !g.decoys.includes(dc)) during = was;
      }
      return { arrive, during, hull, after: { shard: g.cargo.shard, hull: g.player.integrity, met: e.met || !g.hunters.includes(e) || e.flee > 0 } };
    };
    const D = held('drift'), S = held('surge');
    check('S-77b2 decoy: a Tracer circling a Decoy on the core\'s cell takes nothing in Drift for the hold, then touches as before',
      D.arrive !== null && D.during && D.during.shard === 40 && D.after.shard < 40, JSON.stringify(D));
    check('S-77b2 decoy: the same in Surge: no damage for the hold, then it hits',
      S.arrive !== null && S.during && S.during.hull === S.hull && S.after.hull < S.hull, JSON.stringify(S));
  }
  { // a Glitch is not lured
    const L = room('surge'), g = L.g, dc = makeDecoy(g.world, cell(L, 14, 1)); g.decoys.push(dc);
    const gl = makeGlitch((L.ox + 14.5) * CELL, (L.oy + 3.5) * CELL, 1, 0); g.enemies.push(gl);
    for (let t = 0; t < 1; t += 1 / 60) frame(L);
    check('S-77a decoy: a Glitch ignores a Decoy (it still runs at the core)', dc.hold === null && gl.lure === undefined && gl.vx < 0, JSON.stringify({ hold: dc.hold, vx: gl.vx }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('decoy: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const g = window.__lumen.game; Object.assign(g.bank, { prism: 40, shard: 100 }); g.player.x = g.nexus.x; g.player.y = g.nexus.y; });
  await pg.waitForTimeout(100);
  const row = await pg.evaluate(() => {
    document.getElementById('matrix-btn').click();
    document.querySelector('#matrix .tabs button[data-tab="craft"]').click();
    const craftRow = !!document.querySelector('#upgrade-list [data-id="decoy"]');
    document.querySelector('#matrix .tabs button[data-tab="nexus"]').click();
    const r = document.querySelector('#upgrade-list [data-id="lure"]');
    return { craftRow, lure: r ? r.textContent.replace(/\s+/g, ' ').trim() : null };
  });
  check('S-77b2 decoy: the Craft tab has no Decoy row; the Nexus tab has a Lure row priced ▲30',
    !!row && !row.craftRow && !!row.lure && /30/.test(row.lure), JSON.stringify(row));
  if (process.env.DECOY_LURE_SHOT) { // 360 × 640: the Nexus tab with the Lure row
    await pg.setViewportSize({ width: 360, height: 640 }); await pg.waitForTimeout(300);
    await pg.screenshot({ path: process.env.DECOY_LURE_SHOT }); await pg.setViewportSize({ width: 1000, height: 700 });
  }
  const bought = await pg.evaluate(() => {
    document.querySelector('#upgrade-list [data-id="lure"] .buy').click();
    const g = window.__lumen.game;
    document.getElementById('matrix-close').click();
    return { lure: g.nexusLevels.lure, stock: g.craft.decoy, prism: g.bank.prism };
  });
  check('S-77b2 decoy: buying Lure in the Nexus tab builds it and fills the stock to 2', bought.lure === 1 && bought.stock === 2 && bought.prism === 10, JSON.stringify(bought));
  await pg.evaluate(() => {
    const L = window.__lumen, g = L.game, w = g.world;
    L.dev.teleport(40, 0.6);
    const cx = Math.floor(g.player.x / 32), cy = Math.floor(g.player.y / 32);
    for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 6; x <= cx + 6; x++) if (w.solid(x, y) && w.get(x, y) !== 5) w.destroy(x, y);
    g.pickups.length = 0; g.god = true; g.burrow.off = true; g.swarm.off = true; g.hunt.timer = 1e9; g.hunt.pincer = 1e9;
  });
  await pg.waitForTimeout(300);
  const glyph = await pg.evaluate(() => document.getElementById('place-glyph').textContent);
  await pg.keyboard.press('KeyB'); await pg.waitForTimeout(200);
  const r = await pg.evaluate(async () => {
    const g = window.__lumen.game, s = g.decoys[0];
    if (!s) return { decoys: 0 };
    g.player.x = s.x - 4 * 32; // step off it so the pick-up hint gives way
    const { makeTracer } = await import('./src/hunter.js');
    const e = makeTracer(g, Math.floor(s.x / 32) + 3, Math.floor(s.y / 32) + 2); g.hunters.push(e);
    return { decoys: g.decoys.length, stock: g.craft.decoy };
  });
  await pg.waitForFunction(() => { const s = window.__lumen.game.decoys[0]; return s && s.hold !== null && s.hold > 1; }, null, { timeout: 5000 }).catch(() => {});
  const held = await pg.evaluate(() => { const g = window.__lumen.game, s = g.decoys[0]; return { hold: s ? s.hold : null, lured: g.hunters.some(e => e.lure === s) }; });
  if (shot) await pg.screenshot({ path: shot });
  check('S-77a decoy: B places a Decoy (button shows ◈); a Tracer in sight circles it in the live game',
    glyph === '◈' && r.decoys === 1 && r.stock === 1 && held.hold > 1 && held.lured, JSON.stringify({ glyph, r, held }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.DECOY_SHOT, shot: process.env.DECOY_SHOT });
