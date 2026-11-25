// S-56 Ward checks (D-153, ward.js). smoke.cjs calls nodeChecks + browserChecks. Node: crafting costs exactly ▲8 ◆30, stock
// 2, stock + placed ≤ 4; placement: open floor, not the Nexus disc, ≥ 6 cells apart; a bolt every 0.8 s for 1.2 hp at the
// creature nearest the Ward, only within 4 cells and with no rock between; Drift = Surge rate; a Spitter bolt in one; a Ward
// kill pays no kill loot (D-154); B / ✦ on a Ward picks it up (full refund, refused while 2 are carried); save round-trip;
// format 21 → 22; junk loads as none. Browser: the Craft row, craft, place with B, a shot draws; screenshot.
// Usage: node tests/ward.cjs [--browser]   (WARD_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { canCraftWard, craftWard, updateWards, makeWard } = await import('../src/ward.js');
  const { tryPlace, placeRefusal } = await import('../src/craft.js');
  const { makeGlitch } = await import('../src/glitch.js');
  const { CELL, T, WARD_S, WARD_DMG } = await import('../src/config.js');
  const make = (mode = 'drift', size) => { const g = new Game({ seed: 4242, mode, audio: quiet, size }); g.undertow.off = true; g.burrow.off = true; g.swarm.off = true; g.god = true; return g; };
  const give = g => Object.assign(g.bank, { prism: 100, shard: 500 });
  /** A 13×13 open room 30 cells east of the Nexus; returns its centre cell. */
  const room = g => {
    const w = g.world, c = { x: w.cx + 30, y: w.cy };
    for (let y = c.y - 6; y <= c.y + 6; y++) for (let x = c.x - 6; x <= c.x + 6; x++) w.cells[y * w.w + x] = T.EMPTY;
    return c;
  };
  const at = (g, x, y) => { g.player.x = (x + 0.5) * CELL; g.player.y = (y + 0.5) * CELL; };
  const foe = (x, y, hp = 1000) => ({ x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, r: 4, hp, maxHp: hp, flash: 0 });
  /** Shots a Ward at the room centre fires at a stub foe in `s` seconds of updateWards alone. */
  const shots = (g, c, f, s) => {
    const wd = makeWard(g.world, c.y * g.world.w + c.x); g.wards.push(wd); g.enemies.push(f);
    const hp0 = f.hp; g.wardShots = 0;
    for (let t = 0; t < s - 1e-9; t += 1 / 60) updateWards(g, 1 / 60);
    g.wards.length = 0; g.enemies.length = 0;
    return { n: g.wardShots, dmg: hp0 - f.hp };
  };

  {
    const g = make(); const c = room(g);
    const no = canCraftWard(g); give(g);
    const b0 = { ...g.bank }; craftWard(g); craftWard(g);
    const third = canCraftWard(g), paid = { prism: b0.prism - g.bank.prism, shard: b0.shard - g.bank.shard };
    check('S-56 ward: crafting costs exactly ▲8 ◆30 each, stock caps at 2, nothing with an empty bank',
      !no && g.craft.ward === 2 && !third && paid.prism === 16 && paid.shard === 60, JSON.stringify({ paid, stock: g.craft.ward }));
    g.craft.last = 'ward';
    const w = g.world; w.cells[c.y * w.w + c.x + 6] = T.ROCK;
    at(g, c.x + 6, c.y); const rock = placeRefusal(g, 'ward');
    at(g, w.cx, w.cy + 1); const nexus = placeRefusal(g, 'ward');
    at(g, c.x - 3, c.y); const placed = tryPlace(g);
    at(g, c.x + 1, c.y + 2); const near = placeRefusal(g, 'ward');
    at(g, c.x + 3, c.y); const second = tryPlace(g);
    check('S-56 ward: placement is open floor only, never the Nexus disc, ≥ 6 cells from another Ward',
      rock === 'blocked' && nexus === 'nexus' && placed && near === 'near' && second && g.wards.length === 2 && g.craft.ward === 0, JSON.stringify({ rock, nexus, placed, near, second }));
    const m = make(); give(m);
    for (let k = 0; k < 4; k++) m.wards.push({ i: k, x: 0, y: 0 });
    const m2 = make(); give(m2); m2.wards.push({ i: 1, x: 0, y: 0 }, { i: 2, x: 0, y: 0 }, { i: 3, x: 0, y: 0 }); craftWard(m2);
    check('S-56 ward: stock + placed never passes 4', !canCraftWard(m) && m2.craft.ward === 1 && !canCraftWard(m2), JSON.stringify({ m2: m2.craft.ward }));
    // reclaim
    at(g, c.x - 3, c.y);
    const up = tryPlace(g), r1 = { stock: g.craft.ward, placed: g.wards.length, res: g.placeResult };
    craftWard(g); at(g, c.x + 3, c.y);
    const refused = tryPlace(g), r2 = { stock: g.craft.ward, placed: g.wards.length, res: g.placeResult };
    check('S-56 ward: B / ✦ on a Ward picks it up into stock (full refund); refused while 2 are carried',
      up && r1.stock === 1 && r1.placed === 1 && r1.res === 'picked' && !refused && r2.stock === 2 && r2.placed === 1 && r2.res === 'carrying', JSON.stringify({ r1, r2 }));
    // save round trip
    for (const q of g.wards) w.broken[q.i] = 1; // the room was carved by hand: mark the Ward's cell as mined so it reloads open
    const s = JSON.parse(JSON.stringify(g.toSave()));
    const h = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: upgradeSave(s) });
    check('S-56 ward: placed Wards and carried stock survive a save round-trip',
      h.wards.length === 1 && h.wards[0].i === g.wards[0].i && h.craft.ward === 2, JSON.stringify({ wards: h.wards.map(q => q.i), stock: h.craft.ward }));
    const old = { ...s, v: 21 }; delete old.wards; old.craft = { beacon: 1, relay: 0, sink: 0, last: 'relay' };
    const u = upgradeSave(JSON.parse(JSON.stringify(old)));
    check('S-56 ward: a format-21 save upgrades to SAVE_FORMAT with no Wards crafted or placed',
      u && u.v === SAVE_FORMAT && u.craft.ward === 0 && Array.isArray(u.wards) && u.wards.length === 0 && u.craft.beacon === 1, JSON.stringify(u && { v: u.v, craft: u.craft, wards: u.wards }));
    const nexusCell = Math.floor(h.nexus.y / CELL) * w.w + Math.floor(h.nexus.x / CELL);
    const rockCell = w.cells.findIndex(v => v === T.ROCK);
    const j = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: upgradeSave({ ...JSON.parse(JSON.stringify(s)), wards: [-1, 'x', 3.5, rockCell, nexusCell], craft: { ward: 99 } }) });
    check('S-56 ward: junk Wards / stock in a save load as none / clamped (B-037)', j.wards.length === 0 && j.craft.ward === 2, JSON.stringify({ wards: j.wards.length, stock: j.craft.ward }));
  }
  {
    const d = make('drift'), cd = room(d), s = make('surge'), cs = room(s);
    const rd = shots(d, cd, foe(cd.x + 3, cd.y), 8), rs = shots(s, cs, foe(cs.x + 3, cs.y), 8);
    check(`S-56 ward: one bolt every ${WARD_S} s for ${WARD_DMG} hp (8 s = 10 bolts, 12 hp); Drift = Surge`,
      rd.n === 10 && Math.abs(rd.dmg - 12) < 1e-9 && rs.n === rd.n && rs.dmg === rd.dmg, JSON.stringify({ rd, rs }));
    const far = shots(d, cd, foe(cd.x + 4, cd.y + 1), 2); // 4.12 cells: out
    const edge = shots(d, cd, foe(cd.x + 4, cd.y), 2); // 4.0 cells: in
    const w = d.world; w.cells[cd.y * w.w + cd.x + 1] = T.ROCK;
    const hidden = shots(d, cd, foe(cd.x + 2, cd.y), 2);
    w.cells[cd.y * w.w + cd.x + 1] = T.EMPTY;
    check('S-56 ward: bolts only within 4 cells and only with no rock between',
      far.n === 0 && edge.n > 0 && hidden.n === 0, JSON.stringify({ far, edge, hidden }));
    const near = foe(cd.x - 2, cd.y), farther = foe(cd.x + 3, cd.y);
    d.wards.push(makeWard(d.world, cd.y * d.world.w + cd.x)); d.enemies.push(farther, near); updateWards(d, 1 / 60);
    d.wards.length = 0; d.enemies.length = 0;
    const bolt = { bolt: true, x: (cd.x + 2.5) * CELL, y: (cd.y + 0.5) * CELL, r: 5, hp: 0.5, flash: 0 };
    d.bolts.push(bolt); d.wards.push(makeWard(d.world, cd.y * d.world.w + cd.x)); updateWards(d, 1 / 60);
    d.wards.length = 0; d.bolts.length = 0;
    check('S-56 ward: it bolts the creature nearest it; a Spitter bolt pops in one',
      near.hp < near.maxHp && farther.hp === farther.maxHp && bolt.hp <= 0, JSON.stringify({ near: near.hp, farther: farther.hp, bolt: bolt.hp }));
  }
  {
    const g = make('surge'), c = room(g);
    at(g, c.x - 5, c.y); g.spawnTimer = 999;
    g.wards.push(makeWard(g.world, c.y * g.world.w + c.x));
    const e = makeGlitch((c.x + 2.5) * CELL, (c.y + 0.5) * CELL, 1, 0); g.enemies.push(e);
    const k0 = g.stats.glitches, p0 = g.pickups.length;
    for (let t = 0; t < 2 && g.enemies.length; t += 1 / 60) { g.spawnTimer = 999; g.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null }); }
    // the same Glitch beamed to its last 0.1 hp by hand, then finished by the beam's own pass: loot as ever
    const h = make('surge'), ch = room(h); h.spawnTimer = 999; at(h, ch.x - 5, ch.y);
    const e2 = makeGlitch((ch.x + 2.5) * CELL, (ch.y + 0.5) * CELL, 1, 0); e2.hp = 0; h.enemies.push(e2);
    const q0 = h.pickups.length; h.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null });
    check('S-56 ward: a Ward kill counts as a Glitch kill but drops no loot (D-154); a beam kill still does',
      g.enemies.length === 0 && g.stats.glitches === k0 + 1 && g.pickups.length === p0 && h.pickups.length > q0,
      JSON.stringify({ left: g.enemies.length, kills: g.stats.glitches - k0, wardLoot: g.pickups.length - p0, beamLoot: h.pickups.length - q0 }));
  }
  { // the Ward gate (D-153, D-154): the Kiln with 2 Wards kept at the dig site never turns the Burrower into income
    const out = require('child_process').execFileSync(process.execPath, [require('path').join(__dirname, '../tools/biomefoe.mjs'), '--biome=kiln', '--wards=2'], { encoding: 'utf8' });
    const line = out.split('\n').find(l => l.startsWith('gate')) || '';
    check('S-56 ward: biomefoe.mjs Kiln with 2 Wards stays ≤ 1.00 in each mode (8 seeds, B-092)', /PASS/.test(line), out.trim().split('\n').map(l => l.slice(0, 50)).join(' | '));
  }
  {
    const g = make('drift', 160); give(g);
    check('S-56 ward: a 160 world crafts Wards too (Glitches live everywhere)', canCraftWard(g) && craftWard(g) && g.craft.ward === 1);
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('ward: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const g = window.__lumen.game; Object.assign(g.bank, { prism: 20, shard: 100 }); g.player.x = g.nexus.x; g.player.y = g.nexus.y; });
  await pg.waitForTimeout(100);
  const row = await pg.evaluate(() => {
    document.getElementById('matrix-btn').click();
    document.querySelector('#matrix .tabs button[data-tab="craft"]').click();
    const r = document.querySelector('#upgrade-list [data-id="ward"]');
    if (!r) return null;
    const btn = r.querySelector('.buy'), txt = btn.textContent.replace(/\s+/g, ' ').trim();
    btn.click();
    const g = window.__lumen.game;
    document.getElementById('matrix-close').click();
    return { txt, stock: g.craft.ward, bank: { prism: g.bank.prism, shard: g.bank.shard } };
  });
  check('S-56 ward: the Craft tab shows a Ward row priced ▲8 ◆30; buying it puts one in stock',
    !!row && /▲8/.test(row.txt) && /◆30/.test(row.txt) && row.stock === 1 && row.bank.prism === 12 && row.bank.shard === 70, JSON.stringify(row));
  const set = {}; set.ok = await pg.evaluate(() => {
    const L = window.__lumen, g = L.game, w = g.world;
    L.dev.teleport(40, 0.6);
    const cx = Math.floor(g.player.x / 32), cy = Math.floor(g.player.y / 32);
    for (let y = cy - 5; y <= cy + 5; y++) for (let x = cx - 5; x <= cx + 5; x++) if (w.solid(x, y) && w.get(x, y) !== 5) w.destroy(x, y);
    g.pickups.length = 0; g.god = true; g.burrow.off = true; g.swarm.off = true;
    return true;
  });
  await pg.waitForTimeout(300);
  set.glyph = await pg.evaluate(() => document.getElementById('place-glyph').textContent);
  await pg.keyboard.press('KeyB'); await pg.waitForTimeout(200);
  const r = await pg.evaluate(() => {
    const g = window.__lumen.game, s = g.wards[0];
    if (!s) return { wards: 0 };
    g.player.x = s.x - 3 * 32; // step off it so the pick-up hint gives way
    g.swarm.motes.push({ mote: true, x: s.x + 80, y: s.y - 30, vx: 0, vy: 0, r: 4, hp: 1000, maxHp: 1000, flash: 0, trail: [] });
    return { wards: g.wards.length, stock: g.craft.ward };
  });
  await pg.waitForTimeout(250);
  const fired = await pg.evaluate(() => { const g = window.__lumen.game; return { shots: g.wardShots || 0, shot: !!(g.wards[0] && g.wards[0].shot) || (g.wardShots || 0) > 0 }; });
  await pg.waitForFunction(() => { const s = window.__lumen.game.wards[0]; return s && s.shot && s.shot.t > 0.08; }, null, { timeout: 3000 }).catch(() => {});
  if (shot) await pg.screenshot({ path: shot });
  check('S-56 ward: B places a Ward (button shows ⌖), it bolts a creature in range in the live game',
    set.glyph === '⌖' && r.wards === 1 && r.stock === 0 && fired.shots > 0, JSON.stringify({ set, r, fired }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.WARD_SHOT, shot: process.env.WARD_SHOT });
