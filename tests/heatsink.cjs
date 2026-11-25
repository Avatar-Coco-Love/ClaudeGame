// S-51 Heat Sink checks (D-141, heatsink.js). smoke.cjs calls nodeChecks + browserChecks. Node: 60 s of steady fire inside a
// Sink's 5 cells is overheated 7.4 % ± 2, outside 17 % ± 2; cooling is unchanged inside; Drift = Surge; crafting costs exactly
// ⬟6 ◆20, stock 2, stock + placed ≤ 6; placement: Kiln floor only, ≥ 6 cells apart, not on rock; B / ✦ on a Sink picks it up
// (full refund, refused while 2 are carried); save round-trip; format 19 → 20; a 160 world has none.
// Browser: the Craft tab row in a 256 world; craft, then B in the Kiln places one, the floor ring draws; screenshot.
// Usage: node tests/heatsink.cjs [--browser]   (HEATSINK_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { packBits } = await import('../src/world.js');
  const { canCraftSink, craftSink, sinksOn } = await import('../src/heatsink.js');
  const { tryPlace, placeRefusal } = await import('../src/craft.js');
  const { CELL, T, KILN_RING } = await import('../src/config.js');
  const make = (mode = 'drift', size) => { const g = new Game({ seed: 4242, mode, audio: quiet, size }); g.undertow.off = true; g.god = true; return g; };
  /** heat.cjs's room: 7×7 open round a Kiln cell, a DENSE wall 2 cells east, aimed east. Returns the wall + centre. */
  const park = (g, ring = KILN_RING, nth = 0) => {
    const w = g.world; let c = null, k = 0;
    for (let y = 8; y < w.h - 8 && !c; y++) for (let x = 8; x < w.w - 8 && !c; x++) {
      let ok = true;
      for (let dy = -4; dy <= 4 && ok; dy++) for (let dx = -4; dx <= 4 && ok; dx++) if (w.ring(x + dx, y + dy) !== ring) ok = false;
      if (ok && (x * 31 + y * 17) % 97 === 0 && k++ === nth) c = { x, y };
    }
    for (let y = c.y - 3; y <= c.y + 3; y++) for (let x = c.x - 3; x <= c.x + 3; x++) w.cells[y * w.w + x] = T.EMPTY;
    const wall = [-1, 0, 1].map(d => (c.y + d) * w.w + c.x + 2);
    for (const i of wall) w.cells[i] = T.DENSE;
    const p = g.player; p.x = (c.x + 0.5) * CELL; p.y = (c.y + 0.5) * CELL; p.vx = p.vy = 0; p.angle = 0;
    g.pickups.length = 0;
    return { wall, c };
  };
  const fire = { move: { x: 0, y: 0 }, fire: true, aim: { x: 1, y: 0 } }, still = { move: { x: 0, y: 0 }, fire: false, aim: null };
  const run = (g, room, s, intent = fire) => {
    let over = 0, n = 0;
    for (let t = 0; t < s - 1e-9; t += 1 / 60) {
      for (const i of room.wall) g.world.damage[i] = 0;
      g.enemies.length = 0; g.spawnTimer = 99;
      g.update(1 / 60, intent); g.events.length = 0;
      n++; if (g.heatState.over > 0) over++;
    }
    return over / n;
  };
  const give = g => Object.assign(g.bank, { calx: 100, shard: 500 });
  /** Craft one and place it on the core's cell (or the cell `dx` east of the room centre). */
  const plant = (g, room, dx = 0) => {
    const p = g.player, was = { x: p.x, y: p.y };
    give(g); craftSink(g);
    p.x = (room.c.x + dx + 0.5) * CELL; p.y = (room.c.y + 0.5) * CELL;
    const ok = tryPlace(g); p.x = was.x; p.y = was.y; return ok;
  };

  {
    const out = make(), ro = park(out), so = run(out, ro, 60);
    const ins = make(), ri = park(ins); plant(ins, ri, -1); const si = run(ins, ri, 60);
    const srg = make('surge'), rs = park(srg); plant(srg, rs, -1); const ss = run(srg, rs, 60);
    check('S-51 heat sink: 60 s of steady fire inside a Sink is overheated 7.4 % ± 2, outside 17 % ± 2; Drift = Surge',
      ins.sinks.length === 1 && Math.abs(si - 0.074) <= 0.02 && Math.abs(so - 0.17) <= 0.02 && ss === si,
      `inside ${(si * 100).toFixed(1)} %, outside ${(so * 100).toFixed(1)} %, surge ${(ss * 100).toFixed(1)} %`);
  }
  {
    const g = make(), room = park(g); plant(g, room, -1);
    g.heat = 0.5; run(g, room, 1, still);
    check('S-51 heat sink: cooling is unchanged inside a Sink (0.25 per s with the beam off)', Math.abs(g.heat - 0.25) < 0.01, g.heat.toFixed(3));
  }
  {
    const g = make(), room = park(g);
    const before = { ...g.bank };
    const no = canCraftSink(g); give(g);
    const b0 = { ...g.bank }; craftSink(g); craftSink(g);
    const third = canCraftSink(g), paid = { calx: b0.calx - g.bank.calx, shard: b0.shard - g.bank.shard };
    check('S-51 heat sink: crafting costs exactly ⬟6 ◆20 each, stock caps at 2, nothing with an empty bank',
      !no && before.calx === 0 && g.craft.sink === 2 && !third && paid.calx === 12 && paid.shard === 40, JSON.stringify({ paid, stock: g.craft.sink }));
    // placement: off Kiln, on rock, too near, then a valid cell
    const p = g.player, at = (x, y) => { p.x = (x + 0.5) * CELL; p.y = (y + 0.5) * CELL; };
    const deep = make(); park(deep, 2); give(deep); craftSink(deep);
    const offKiln = placeRefusal(deep, 'sink');
    g.craft.last = 'sink';
    at(room.c.x + 2, room.c.y); const rock = placeRefusal(g, 'sink');
    at(room.c.x - 2, room.c.y); const placed = tryPlace(g);
    at(room.c.x + 1, room.c.y + 3); const near = placeRefusal(g, 'sink');
    check('S-51 heat sink: placement is Kiln floor only (Deep floor refused), not on rock, ≥ 6 cells from another Sink',
      offKiln === 'kiln' && rock === 'blocked' && placed && g.sinks.length === 1 && g.craft.sink === 1 && near === 'near', JSON.stringify({ offKiln, rock, placed, near }));
    // stock + placed never passes 6
    const m = make(); give(m);
    for (let k = 0; k < 6; k++) m.sinks.push({ i: k, x: 0, y: 0 });
    check('S-51 heat sink: stock + placed never passes 6 (no craft with 6 placed)', !canCraftSink(m));
    // reclaim
    at(room.c.x - 2, room.c.y);
    const up = tryPlace(g), r1 = { stock: g.craft.sink, placed: g.sinks.length, res: g.placeResult };
    at(room.c.x - 2, room.c.y); tryPlace(g); // back down (stock 1)
    craftSink(g); at(room.c.x - 2, room.c.y); // 2 carried, standing on one
    const refused = tryPlace(g), r2 = { stock: g.craft.sink, placed: g.sinks.length, res: g.placeResult };
    check('S-51 heat sink: B / ✦ on a Sink picks it up into stock (full refund); refused while 2 are carried',
      up && r1.stock === 2 && r1.placed === 0 && r1.res === 'picked' && !refused && r2.stock === 2 && r2.placed === 1 && r2.res === 'carrying', JSON.stringify({ r1, r2 }));
    // save round trip
    for (const q of g.sinks) g.world.broken[q.i] = 1; // the test room was carved by hand: mark the Sink's cell as mined so it reloads open
    const s = JSON.parse(JSON.stringify(g.toSave()));
    const h = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: upgradeSave(s) }); // the constructor loads it
    check('S-51 heat sink: placed Sinks and carried stock survive a save round-trip',
      h.sinks.length === 1 && h.sinks[0].i === g.sinks[0].i && h.craft.sink === 2, JSON.stringify({ sinks: h.sinks.map(q => q.i), stock: h.craft.sink }));
    // an old save gains the fields
    const old = { ...s, v: 19 }; delete old.sinks; old.craft = { beacon: 1, relay: 0, last: 'relay' };
    const u = upgradeSave(JSON.parse(JSON.stringify(old)));
    check('S-51 heat sink: a format-19 save upgrades to SAVE_FORMAT with no Sinks crafted or placed',
      u && u.v === SAVE_FORMAT && u.craft.sink === 0 && Array.isArray(u.sinks) && u.sinks.length === 0 && u.craft.beacon === 1, JSON.stringify(u && { v: u.v, craft: u.craft, sinks: u.sinks }));
    // junk in a save
    const jw = make().world;
    const rockKiln = jw.cells.findIndex((v, i) => v !== T.EMPTY && jw.ring(i % jw.w, Math.floor(i / jw.w)) === KILN_RING);
    const nexusCell = Math.floor(make().nexus.y / CELL) * jw.w + Math.floor(make().nexus.x / CELL); // open, but Hearth
    const j = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: upgradeSave({ ...JSON.parse(JSON.stringify(s)), broken: packBits(new Uint8Array(jw.w * jw.h)), sinks: [-1, 'x', 3.5, rockKiln, nexusCell], craft: { sink: 99, last: 'nope' } }) });
    check('S-51 heat sink: junk Sinks / stock in a save load as none / clamped (B-037)', j.sinks.length === 0 && j.craft.sink === 2 && j.craft.last === 'beacon',
      JSON.stringify({ sinks: j.sinks.length, stock: j.craft.sink, last: j.craft.last }));
  }
  {
    const g = make('drift', 160); give(g);
    check('S-51 heat sink: a 160 world has no Heat Sinks (no craft)', !sinksOn(g) && !canCraftSink(g) && !craftSink(g) && g.craft.sink === 0);
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('heatsink: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(300);
  const a = await pg.evaluate(() => {
    const g = window.__lumen.game;
    Object.assign(g.bank, { calx: 20, shard: 100 });
    g.player.x = g.nexus.x; g.player.y = g.nexus.y;
    return true;
  });
  await pg.waitForTimeout(100);
  const row = await pg.evaluate(() => {
    document.getElementById('matrix-btn').click();
    document.querySelector('#matrix .tabs button[data-tab="craft"]').click();
    const r = document.querySelector('#upgrade-list [data-id="sink"]');
    if (!r) return null;
    const btn = r.querySelector('.buy'), txt = btn.textContent.replace(/\s+/g, ' ').trim();
    btn.click();
    const g = window.__lumen.game;
    document.getElementById('matrix-close').click();
    return { txt, stock: g.craft.sink, bank: { ...g.bank } };
  });
  check('S-51 heat sink: the Craft tab shows a Heat Sink row priced ⬟6 ◆20; buying it puts one in stock',
    !!row && /⬟6/.test(row.txt) && /◆20/.test(row.txt) && row.stock === 1 && row.bank.calx === 14 && row.bank.shard === 80, JSON.stringify({ a, row }));
  await pg.waitForTimeout(150);
  const atNexus = await pg.evaluate(() => { const b = document.getElementById('beacon-btn'); return { off: b.classList.contains('off'), hidden: b.classList.contains('hidden'), title: b.title }; });
  const placed = await pg.evaluate(() => {
    const L = window.__lumen, g = L.game, w = g.world;
    L.dev.teleport(112, 0.6);
    const cx = Math.floor(g.player.x / 32), cy = Math.floor(g.player.y / 32);
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) if (w.solid(x, y) && w.get(x, y) !== 5) w.destroy(x, y);
    g.pickups.length = 0; g.god = true;
    let rings = 0; const ctx = L.renderer.ctx, arc = ctx.arc.bind(ctx);
    ctx.arc = (x, y, rad, ...rest) => { if (rad === 160) rings++; return arc(x, y, rad, ...rest); }; // r 160 px = the 5-cell floor ring
    window.__sinkRings = () => rings;
    return { ring: w.ring(cx, cy) };
  });
  await pg.waitForTimeout(150);
  const offBefore = await pg.evaluate(() => document.getElementById('beacon-btn').classList.contains('off'));
  await pg.keyboard.press('KeyB'); await pg.waitForTimeout(400);
  const r = await pg.evaluate(offBefore => ({ offBefore, sinks: window.__lumen.game.sinks.length, rings: window.__sinkRings(), count: document.getElementById('beacon-count').textContent, off: document.getElementById('beacon-btn').classList.contains('off') }), offBefore);
  if (shot) await pg.screenshot({ path: shot });
  check('S-51 heat sink: off Kiln floor the place button is greyed out and names the reason; on Kiln floor it is not',
    !atNexus.hidden && atNexus.off && /Kiln/.test(atNexus.title) && !r.offBefore, JSON.stringify({ atNexus, r }));
  check('S-51 heat sink: B on Kiln floor places a Sink, its floor ring draws round the core, the button offers ↑ (pick up)',
    placed.ring === 4 && r.sinks === 1 && r.rings > 0 && r.count === '↑', JSON.stringify({ placed, r }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.HEATSINK_SHOT, shot: process.env.HEATSINK_SHOT });
