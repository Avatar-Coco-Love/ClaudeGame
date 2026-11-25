// S-16 Beacons v1 (Crafting) checks. smoke.cjs calls both functions.
const audio = new Proxy({}, { get: () => () => {} });
const idle = (place = false) => ({ move: { x: 0, y: 0 }, aim: null, fire: false, place });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { T, CELL, BEACON_COST, BEACON_STOCK, BEACON_MAX, BEACON_LIGHT } = await import('../src/config.js');
  const { craftBeacon, placeRefusal, tryPlace } = await import('../src/craft.js');
  const g = new Game({ seed: 77, mode: 'drift', audio }), w = g.world;
  g.bank.prism = 100;
  const crafted = [0, 1, 2, 3].map(() => craftBeacon(g));
  check('crafting spends exactly 5▲ a Beacon and stops at 3 carried (S-16)', crafted.join() === 'true,true,true,false' && g.bank.prism === 100 - 3 * BEACON_COST
    && g.craft.beacon === BEACON_STOCK, JSON.stringify({ crafted, prism: g.bank.prism, stock: g.craft.beacon }));

  // A strip of open floor 20 cells east of the Nexus: carve it, then try each refusal on the core's cell.
  const cx = Math.floor(g.nexus.x / CELL), cy = Math.floor(g.nexus.y / CELL);
  for (let x = cx; x <= cx + 40; x++) w.destroy(x, cy);
  const at = (dx, dy = 0) => { Object.assign(g.player, { x: (cx + dx + 0.5) * CELL, y: (cy + dy + 0.5) * CELL, vx: 0, vy: 0 }); };
  const place = () => { g.update(1 / 60, idle(true)); return g.placeResult; };
  at(2); const inRing = place();
  w.cells[(cy + 1) * w.w + cx + 20] = T.ROCK; at(20, 1); const rockCell = placeRefusal(g);
  at(20); w.explored.fill(0); const first = tryPlace(g) && g.placeResult, revealed = w.explored.reduce((a, b) => a + b, 0);
  at(23); const near = place();
  at(24); const gap = place();
  check('place: open floor works; inside the Nexus ring, in rock, 3 cells from a beacon refused; 4 cells ok (S-16)',
    inRing === 'nexus' && rockCell === 'blocked' && first === 'placed' && near === 'near' && gap === 'placed' && g.beacons.length === 2 && g.craft.beacon === 1,
    JSON.stringify({ inRing, rockCell, first, near, gap, placed: g.beacons.length, stock: g.craft.beacon }));
  check('a placed beacon lights 140 px at its cell centre and reveals cells within 5 (S-16)', g.beacons[0].r === BEACON_LIGHT
    && g.beacons[0].x === (cx + 20.5) * CELL && revealed === 81, `revealed ${revealed}`); // a 5-cell disc (world.reveal) = 81 cells

  // Save + load, then a format-8 save.
  const h = new Game({ seed: 77, mode: 'surge', audio, save: upgradeSave(JSON.parse(JSON.stringify(g.toSave()))) });
  check('beacons and carried stock survive save + load (S-16)', h.beacons.map(b => b.i).join() === g.beacons.map(b => b.i).join() && h.craft.beacon === 1
    && h.beacons[1].x === g.beacons[1].x, JSON.stringify({ beacons: h.beacons.length, stock: h.craft.beacon }));
  const old = new Game({ seed: 77, mode: 'drift', audio }).toSave();
  old.v = 8; delete old.craft; delete old.beacons;
  const up = upgradeSave(old), o = new Game({ seed: 77, mode: 'drift', audio, save: up });
  check('a format-8 save loads with no beacons and none carried (S-16, D-005)', up.v === SAVE_FORMAT && o.beacons.length === 0 && o.craft.beacon === 0
    && JSON.stringify(up.beacons) === '[]', JSON.stringify({ v: up.v, beacons: up.beacons, craft: up.craft }));
  const bad = new Game({ seed: 77, mode: 'drift', audio, save: { ...upgradeSave(JSON.parse(JSON.stringify(g.toSave()))), beacons: [-1, 'x', w.idx(0, 0), g.beacons[0].i, g.beacons[0].i] } });
  check('a saved beacon on rock, out of range or repeated is dropped on load (S-16)', bad.beacons.length === 1, `${bad.beacons.length} loaded`);

  // The cap: at BEACON_MAX placed, placing and crafting both refuse; stock + placed never passes the cap.
  const m = new Game({ seed: 77, mode: 'surge', audio }); m.spawnTimer = 999;
  for (let x = cx; x <= cx + 40; x++) for (let y = cy - 30; y <= cy + 30; y += 5) m.world.destroy(x, y);
  m.bank.prism = 1000;
  let placed = 0;
  for (let y = cy - 30; y <= cy + 30 && placed < BEACON_MAX + 2; y += 5) for (let x = cx + 8; x <= cx + 40; x += 5) {
    if (!m.craft.beacon) craftBeacon(m);
    Object.assign(m.player, { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, vx: 0, vy: 0 });
    m.update(1 / 60, idle(true)); if (m.placeResult === 'placed') placed++;
  }
  const capCraft = craftBeacon(m), stock = m.craft.beacon;
  check(`at most ${BEACON_MAX} placed; crafting stops when stock + placed reach it; same in Surge (S-16)`, m.beacons.length === BEACON_MAX && placed === BEACON_MAX
    && !capCraft && stock + m.beacons.length <= BEACON_MAX && m.bank.prism === 1000 - BEACON_COST * (m.beacons.length + stock),
    JSON.stringify({ placed: m.beacons.length, stock, capCraft, prism: m.bank.prism }));
}

// Light under a world point, from the half-res light canvas: 0 = fully lit, ~237 = full darkness (0.93 alpha).
const darkAt = () => window.__lumen.renderer && ((wx, wy) => {
  const R = window.__lumen.renderer, p = R.worldToScreen(wx, wy);
  return R.lctx.getImageData(Math.round(p.x / 2), Math.round(p.y / 2), 1, 1).data[3];
});

async function browserChecks(browser, url, check, errors, plantSaveAndReload) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('craft: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; g.bank.prism = 12; });
  await pg.keyboard.press('e'); await pg.waitForTimeout(100);
  await pg.click('#matrix .tabs button[data-tab="craft"]');
  await pg.click('#upgrade-list .buy'); await pg.click('#upgrade-list .buy'); await pg.waitForTimeout(50);
  const tab = await pg.evaluate(() => ({ title: document.getElementById('matrix-title').textContent, val: document.querySelector('#upgrade-list .u-val').textContent,
    disabled: document.querySelector('#upgrade-list .buy').disabled, prism: window.__lumen.game.bank.prism }));
  check('Craft tab: two Beacons for 10▲, then the button locks at 2▲ (S-16)', tab.title === 'Craft' && /Carried 2\/3/.test(tab.val) && tab.disabled && tab.prism === 2, JSON.stringify(tab));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  await pg.keyboard.press('b'); await pg.waitForTimeout(100);
  const inRing = await pg.evaluate(() => ({ r: window.__lumen.game.placeResult, toast: document.getElementById('toast').textContent, btn: document.getElementById('beacon-btn').textContent }));
  // Walk out: teleport 12 cells east (a carved room), place, then step 9 cells further east so the beacon is lit only by itself.
  const b = await pg.evaluate(() => { const { game: g, dev } = window.__lumen; dev.teleport(12, 0); return { x: g.player.x, y: g.player.y }; });
  await pg.keyboard.press('b'); await pg.waitForTimeout(100);
  const placed = await pg.evaluate(() => ({ r: window.__lumen.game.placeResult, n: window.__lumen.game.beacons.length, lights: window.__lumen.renderer.extraLights.length }));
  const lit = async () => pg.evaluate(([bx, by, f]) => {
    const { game: g, dev } = window.__lumen; dev.teleport(21, 0);
    // B-074: the world is random; an explored Anomaly site or seen Spire within ~5 map px is drawn over the beacon's dot.
    const C = 32, near = (x, y) => Math.hypot((x + 0.5) * C - bx, (y + 0.5) * C - by) < 6 * C; let hid = 0;
    g.anomaly.sites.forEach(q => { if (!q.void && near(q.x, q.y)) { q.void = true; hid++; } });
    g.spires.forEach(q => { if (q.seen && near(q.x, q.y)) { q.seen = false; hid++; } });
    return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => {
      const dark = (0, eval)(f)(); const m = window.__lumen.renderer.mctx, sc = 140 / (g.world.w * 32);
      const px = m.getImageData(Math.round(bx * sc), Math.round(by * sc), 1, 1).data;
      res({ at: dark(bx, by), off: dark(bx, by - 220), mini: [px[0], px[1], px[2]].join(','), hid });
    })));
  }, [b.x, b.y, darkAt.toString()]);
  const l1 = await lit();
  check('B outside the ring places; the beacon lights its spot (light canvas) and marks the minimap; B in the ring says why (S-16)',
    inRing.r === 'nexus' && /Nexus/.test(inRing.toast) && /2/.test(inRing.btn) && placed.r === 'placed' && placed.n === 1 && placed.lights === 1
    && l1.at < 60 && l1.off > 200 && l1.mini === '191,248,255', JSON.stringify({ inRing, placed, l1 }));
  await plantSaveAndReload(pg, s => s);
  await pg.click('#continue'); await pg.waitForTimeout(200);
  const l2 = await lit();
  const re = await pg.evaluate(() => ({ n: window.__lumen.game.beacons.length, stock: window.__lumen.game.craft.beacon, btn: !document.getElementById('beacon-btn').classList.contains('hidden') }));
  check('the beacon, its light and its minimap dot survive reload; 1 still carried (S-16)', re.n === 1 && re.stock === 1 && re.btn && l2.at < 60 && l2.mini === '191,248,255',
    JSON.stringify({ re, l2 }));
  await pg.close();

  // Phones: the ✦ button by touch, the Craft tab at 320 px, and the landscape row not running into the bank panel.
  for (const [w, h] of [[320, 568], [667, 375], [844, 390]]) { // 568×320 + 640×360: touch.cjs (B-034, S-25)
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const ph = await ctx.newPage();
    ph.on('pageerror', e => errors.push(`craft ${w}: ` + e.message));
    await ph.goto(url); await ph.waitForTimeout(200);
    await ph.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
    await ph.reload(); await ph.waitForTimeout(200);
    await ph.tap('#new-world'); await ph.waitForTimeout(200);
    await ph.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; g.bank.prism = 50; g.research.scanner = true; g.research.wide = true; g.demo = true; });
    await ph.waitForTimeout(100);
    await ph.tap('#matrix-btn'); await ph.waitForTimeout(100);
    await ph.tap('#matrix .tabs button[data-tab="craft"]');
    await ph.tap('#upgrade-list .buy'); await ph.waitForTimeout(50);
    const fit = await ph.evaluate(() => { const sh = document.querySelector('#matrix .sheet').getBoundingClientRect();
      return [...document.querySelectorAll('#matrix .sheet, #matrix .tabs button, #matrix .buy, #upgrade-list .upgrade, #matrix-close')]
        .filter(e => { const r = e.getBoundingClientRect(); return r.left < sh.left || r.right > sh.right || e.scrollWidth > e.clientWidth || r.height < 44; })
        .map(e => e.textContent.trim().slice(0, 12)); });
    await ph.tap('#matrix-close'); await ph.waitForTimeout(100);
    await ph.evaluate(() => window.__lumen.dev.teleport(12, 0)); await ph.waitForTimeout(100);
    const lay = await ph.evaluate(() => {
      const r = id => document.getElementById(id).getBoundingClientRect(), bb = r('beacon-btn'), tl = document.querySelector('.top-left').getBoundingClientRect();
      const hit = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
      const others = ['scan-btn', 'mode-btn', 'minimap', 'mute-btn', 'menu-btn'].filter(id => hit(bb, r(id)));
      const onBank = ['scan-btn', 'mode-btn', 'beacon-btn'].filter(id => hit(tl, r(id))); // the ✦ must not push ◎ ⟂ into the bank panel either
      return { w: Math.round(bb.width), h: Math.round(bb.height), right: Math.round(bb.right), overlaps: [...onBank, ...others], inView: bb.right <= innerWidth && bb.bottom <= innerHeight };
    });
    await ph.tap('#beacon-btn'); await ph.waitForTimeout(150);
    const t = await ph.evaluate(() => ({ r: window.__lumen.game.placeResult, n: window.__lumen.game.beacons.length, hidden: document.getElementById('beacon-btn').classList.contains('hidden') }));
    check(`phone ${w}×${h}: Craft tab fits (≥ 44 px); ✦ is ≥ 44 px, clear of the HUD; a tap places and hides it (S-16)`,
      fit.length === 0 && lay.h >= 44 && lay.w >= 44 && lay.inView && lay.overlaps.length === 0 && t.r === 'placed' && t.n === 1 && t.hidden,
      JSON.stringify({ fit, lay, t }));
    await ctx.close();
  }
}

module.exports = { nodeChecks, browserChecks };
