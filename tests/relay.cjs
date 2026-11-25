// S-22 Relays v1 (Crafting, D-056) checks. smoke.cjs calls both functions.
const calls = [];
const audio = new Proxy({}, { get: (_, k) => (...a) => { calls.push(k); } });
const idle = (place = false) => ({ move: { x: 0, y: 0 }, aim: null, fire: false, place });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { T, CELL, RELAY_COST, RELAY_MAX, RELAY_R, RELAY_GAP } = await import('../src/config.js');
  const { craftRelay, craftBeacon, placeRefusal, placeKind } = await import('../src/craft.js');
  const fresh = (mode = 'drift') => { const g = new Game({ seed: 77, mode, audio }); g.spawnTimer = 1e9; return g; };
  const g = fresh(), w = g.world;
  g.bank.prism = 30; g.bank.shard = 100;
  const a = craftRelay(g), b = craftRelay(g);
  check('crafting a Relay spends exactly 12▲ + 40◆; 1 carried, a second craft is refused (S-22)', a && !b && g.bank.prism === 30 - RELAY_COST.prism
    && g.bank.shard === 100 - RELAY_COST.shard && g.craft.relay === 1 && g.craft.last === 'relay', JSON.stringify({ a, b, bank: g.bank, craft: g.craft }));
  const poor = fresh(); poor.bank.prism = 12; poor.bank.shard = 39;
  check('a Relay needs both costs: 12▲ + 39◆ is refused (S-22)', !craftRelay(poor) && poor.bank.prism === 12, JSON.stringify(poor.bank));

  // The direction from the Nexus farthest from every vault and Spire: a straight carved strip there tests the near rules alone.
  const cx = Math.floor(g.nexus.x / CELL), cy = Math.floor(g.nexus.y / CELL);
  let best = 0, bestD = -1;
  for (let k = 0; k < 4; k++) { // axis directions only, so cell distances along the strip are exact
    const an = k / 4 * Math.PI * 2, d = Math.min(...[...w.vaults, ...g.spires].map(v => {
      let m = Infinity; for (let r = 20; r <= 44; r++) m = Math.min(m, Math.hypot(v.x - (cx + Math.cos(an) * r), v.y - (cy + Math.sin(an) * r))); return m; }));
    if (d > bestD) { bestD = d; best = an; }
  }
  const cell = r => [cx + Math.round(Math.cos(best) * r), cy + Math.round(Math.sin(best) * r)];
  for (let r = 0; r <= 46; r++) { const [x, y] = cell(r); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) w.destroy(x + dx, y + dy); }
  const at = ([x, y]) => Object.assign(g.player, { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL, vx: 0, vy: 0 });
  const place = () => { g.update(1 / 60, idle(true)); return g.placeResult; };
  at(cell(20)); const shallow = place();
  const [rx, ry] = cell(30); w.cells[w.idx(rx + 2, ry + 2)] = T.ROCK; at([rx + 2, ry + 2]); const rock = placeRefusal(g);
  at(cell(28)); const first = place();
  g.bank.prism = 30; g.bank.shard = 100; craftRelay(g);
  at(cell(38)); const near = place(); // 10 cells from the first
  at(cell(28 + RELAY_GAP)); const gap = place();
  check('Relay placement: d 20 refused, in rock refused, 10 cells from a Relay refused; d 28 and 16 cells on placed (S-22)',
    shallow === 'nexus' && rock === 'blocked' && first === 'placed' && near === 'near' && gap === 'placed' && g.relays.length === 2 && g.craft.relay === 0,
    JSON.stringify({ shallow, rock, first, near, gap, relays: g.relays.length, clearance: Math.round(bestD) }));

  // Vault centres and Spire footprints keep 16 cells clear.
  const v = w.vaults[0], q = g.spires[0], k = fresh(); k.craft.relay = 1;
  const stand = (x, y) => { k.world.destroy(x, y); Object.assign(k.player, { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL }); return placeRefusal(k); };
  const vault = stand(v.x + 10, v.y + 9); k.world.vaults = []; const spire = stand(q.x + 4 + 15, q.y); // vaults off: the Spire rule alone
  check('a Relay 13 cells from a vault centre or 15 from a Spire footprint is refused (S-22)', vault === 'vault' && spire === 'spire', JSON.stringify({ vault, spire }));

  // Banking at a Relay: ◆ ▲ ● move to the bank with the Nexus's ticks and chime; streaks head toward the Nexus.
  const s = fresh('surge'), [sx, sy] = cell(30);
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) s.world.destroy(sx + dx, sy + dy);
  s.craft.relay = 1; Object.assign(s.player, { x: (sx + 0.5) * CELL, y: (sy + 0.5) * CELL });
  s.update(1 / 60, idle(true));
  s.player.x += RELAY_R - 12; // inside the bank radius, off the Relay's own cell
  s.cargo = { shard: 4, prism: 3, lumen: 2 }; s.player.integrity = 1; s.player.invuln = 99;
  calls.length = 0;
  let streakOk = true;
  for (let i = 0; i < 120; i++) {
    s.update(1 / 60, idle());
    for (const p of s.particles) if (p.type === 'streak') {
      const toN = Math.hypot(p.tx - s.nexus.x, p.ty - s.nexus.y), fromN = Math.hypot(s.player.x - s.nexus.x, s.player.y - s.nexus.y);
      if (!(toN < fromN - 150)) streakOk = false;
    }
  }
  check('cargo within 64 px of a Relay banks ◆ ▲ ●, with the deposit ticks + chime; streaks fly toward the Nexus (S-22)',
    s.relays.length === 1 && s.cargoTotal() === 0 && s.bank.shard === 4 && s.bank.prism === 3 && s.bank.lumen === 2
    && calls.filter(c => c === 'deposit').length === 9 && calls.includes('depositDone') && streakOk,
    JSON.stringify({ bank: s.bank, deposits: calls.filter(c => c === 'deposit').length, done: calls.includes('depositDone'), streakOk }));
  check('Surge integrity does not refill at a Relay; the Matrix stays the Nexus\'s (S-22)', s.player.integrity === 1 && !s.inNexus() && s.atDeposit(),
    `integrity ${s.player.integrity}`);
  s.player.x += 20; s.cargo.shard = 3; s.update(0.5, idle());
  check('outside the 64 px radius nothing banks (S-22)', s.cargo.shard === 3 && !s.atDeposit(), JSON.stringify(s.cargo));

  // B / ✦ places the item crafted last that is still carried.
  const m = fresh(); m.bank.prism = 100; m.bank.shard = 100;
  craftRelay(m); const k1 = placeKind(m); craftBeacon(m); const k2 = placeKind(m); m.craft.beacon = 0; const k3 = placeKind(m);
  check('B places the latest craft still carried: relay, then beacon, then relay again once beacons run out (S-22)', k1 === 'relay' && k2 === 'beacon' && k3 === 'relay',
    [k1, k2, k3].join());

  // Save + load; a format-10 save; malformed relays.
  g.craft.relay = 1;
  const h = new Game({ seed: 77, mode: 'drift', audio, save: upgradeSave(JSON.parse(JSON.stringify(g.toSave()))) });
  check('Relays, carried stock and craft.last survive save + load (S-22)', h.relays.map(r => r.i).join() === g.relays.map(r => r.i).join()
    && h.craft.relay === 1 && h.craft.last === 'relay' && h.relays[0].x === g.relays[0].x, JSON.stringify({ relays: h.relays.length, craft: h.craft }));
  const old = new Game({ seed: 77, mode: 'drift', audio, size: 160 }).toSave(); // a format-17 save is 160 (S-46b2)
  old.v = SAVE_FORMAT - 1; old.craft = { beacon: 2 }; delete old.relays;
  const up = upgradeSave(old), o = new Game({ seed: 77, mode: 'drift', audio, save: up });
  check('the previous save format loads with no Relays, its beacons kept (S-22, D-005)', up.v === SAVE_FORMAT && o.relays.length === 0 && o.craft.relay === 0
    && o.craft.beacon === 2 && o.craft.last === 'beacon', JSON.stringify({ v: up.v, craft: o.craft }));
  const i0 = g.relays[0].i, bad = new Game({ seed: 77, mode: 'drift', audio, save: { ...upgradeSave(JSON.parse(JSON.stringify(g.toSave()))),
    relays: [-1, 'x', w.idx(0, 0), i0, i0, {}], craft: { beacon: 1, relay: 9, last: 'zz' } } });
  check('malformed saved Relays and stock are dropped or clamped on load (S-22)', bad.relays.length === 1 && bad.craft.relay === 1 && bad.craft.last === 'beacon',
    JSON.stringify({ n: bad.relays.length, craft: bad.craft }));

  // The cap: 3 placed; crafting stops when stock + placed reach it.
  const c = fresh(); c.bank.prism = 1000; c.bank.shard = 1000; let placed = 0;
  for (const an of [0, 2.1, 4.2]) { // d 30, three ways round: 52 cells apart, clear of vaults (d ≥ 50) and Spires
    const [x, y] = [cx + Math.round(Math.cos(an) * 30), cy + Math.round(Math.sin(an) * 30)];
    c.world.destroy(x, y); craftRelay(c); Object.assign(c.player, { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL });
    c.update(1 / 60, idle(true)); if (c.placeResult === 'placed') placed++;
  }
  check(`at most ${RELAY_MAX} Relays; crafting stops at the cap (S-22)`, placed === RELAY_MAX && !craftRelay(c) && c.craft.relay === 0,
    JSON.stringify({ placed, stock: c.craft.relay }));
}

async function browserChecks(browser, url, check, errors, plantSaveAndReload, shot) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('relay: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; g.bank.prism = 20; g.bank.shard = 50; });
  await pg.keyboard.press('e'); await pg.waitForTimeout(100);
  await pg.click('#matrix .tabs button[data-tab="craft"]');
  await pg.click('#upgrade-list [data-id="relay"] .buy'); await pg.waitForTimeout(50);
  const tab = await pg.evaluate(() => ({ rows: [...document.querySelectorAll('#upgrade-list .upgrade')].map(r => r.dataset.id).join(),
    val: document.querySelector('#upgrade-list [data-id="relay"] .u-val').textContent, dis: document.querySelector('#upgrade-list [data-id="relay"] .buy').disabled,
    bank: { ...window.__lumen.game.bank } }));
  if (shot) await pg.screenshot({ path: shot + '-tab.png' });
  check('Craft tab: a Relay row; crafting spends 12▲ + 40◆ and then locks (S-22)', tab.rows === 'beacon,relay' && /Carried 1\/1/.test(tab.val) && tab.dis
    && tab.bank.prism === 8 && tab.bank.shard === 10, JSON.stringify(tab));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  const btn = await pg.evaluate(() => document.getElementById('beacon-btn').textContent.replace(/\s+/g, ''));
  // Out to d 30 (dev teleport carves a 3×3 room), place, step 1 cell aside, fill the cargo: it banks there.
  await pg.evaluate(() => { const g = window.__lumen.game; g.ringsSeen = new Set([0, 1, 2]); window.__lumen.dev.teleport(30, Math.PI); }); // no ring toast ahead of ours
  await pg.keyboard.press('b'); await pg.waitForTimeout(100);
  const placed = await pg.evaluate(() => ({ r: window.__lumen.game.placeResult, toast: document.getElementById('toast').textContent, n: window.__lumen.game.relays.length,
    hidden: document.getElementById('beacon-btn').classList.contains('hidden') }));
  await pg.evaluate(() => { const g = window.__lumen.game; g.player.x += 32; g.cargo.shard = 5; g.cargo.prism = 2; });
  await pg.waitForTimeout(600);
  const banked = await pg.evaluate(() => ({ bank: { ...window.__lumen.game.bank }, cargo: window.__lumen.game.cargoTotal() }));
  if (shot) await pg.screenshot({ path: shot + '-world.png' });
  // Step 10 cells away so the Relay is lit only by itself, then read the light canvas and the minimap.
  await pg.evaluate(() => window.__lumen.dev.teleport(40, Math.PI));
  const look = await pg.evaluate(() => {
    const { game: g, renderer: R } = window.__lumen, q = g.relays[0], frames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const dark = (x, y) => { const p = R.worldToScreen(x, y); return R.lctx.getImageData(Math.round(p.x / 2), Math.round(p.y / 2), 1, 1).data[3]; };
    const mw = () => R.miniWin, box = () => R.mctx.getImageData(Math.round((q.x - mw().ox) * mw().sc) - 5, Math.round((q.y - mw().oy) * mw().sc) - 5, 11, 11).data; // S-46b window
    return frames().then(() => {
      const on = box(), out = { lights: R.lightSets.map(s => s.length).join(), at: dark(q.x, q.y), off: dark(q.x, q.y - 220) };
      const kept = g.relays.splice(0); // the same map without the Relay: the ring is what differs, and it is cyan
      return frames().then(() => {
        const off = box(); g.relays.push(...kept);
        let ring = 0; for (let k = 0; k < on.length; k += 4) if (on[k + 2] - off[k + 2] > 60 && on[k + 2] > on[k]) ring++;
        return { ...out, ring };
      });
    });
  });
  check('B places a Relay at d 30 (⊕ on the button); cargo beside it banks; it lights, and the minimap shows a cyan ring (S-22)',
    /⊕1/.test(btn) && placed.r === 'placed' && /Relay placed/.test(placed.toast) && placed.n === 1 && !placed.hidden /* S-34: in its ring ✦ now offers pick-up */ && banked.cargo === 0 && banked.bank.shard === 15
    && banked.bank.prism === 10 && look.lights === '0,1,0' && look.at < 60 && look.off > 200 && look.ring >= 8,
    JSON.stringify({ btn, placed, banked, look }));
  await plantSaveAndReload(pg, s => s);
  await pg.click('#continue'); await pg.waitForTimeout(200);
  const re = await pg.evaluate(() => ({ n: window.__lumen.game.relays.length, sets: window.__lumen.renderer.lightSets[1] === window.__lumen.game.relays }));
  check('the Relay survives reload and is still a light (S-22)', re.n === 1 && re.sets, JSON.stringify(re));
  await pg.close();

  // 320×568 by touch: the Craft tab with both rows fits; the ⊕ button places by tap.
  const ctx = await browser.newContext({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const ph = await ctx.newPage();
  ph.on('pageerror', e => errors.push('relay 320: ' + e.message));
  await ph.goto(url); await ph.waitForTimeout(200);
  await ph.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await ph.reload(); await ph.waitForTimeout(200);
  await ph.tap('#new-world'); await ph.waitForTimeout(200);
  await ph.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; g.bank.prism = 50; g.bank.shard = 100; });
  await ph.waitForTimeout(100);
  await ph.tap('#matrix-btn'); await ph.waitForTimeout(100);
  await ph.tap('#matrix .tabs button[data-tab="craft"]');
  await ph.tap('#upgrade-list [data-id="relay"] .buy'); await ph.waitForTimeout(50);
  if (shot) await ph.screenshot({ path: shot + '-320-tab.png' });
  const fit = await ph.evaluate(() => { const sh = document.querySelector('#matrix .sheet').getBoundingClientRect();
    return [...document.querySelectorAll('#matrix .sheet, #matrix .buy, #upgrade-list .upgrade')]
      .filter(e => { const r = e.getBoundingClientRect(); return r.left < sh.left || r.right > sh.right || e.scrollWidth > e.clientWidth || r.height < 44; })
      .map(e => e.textContent.trim().slice(0, 12)); });
  await ph.tap('#matrix-close'); await ph.waitForTimeout(100);
  await ph.evaluate(() => window.__lumen.dev.teleport(30, Math.PI)); await ph.waitForTimeout(100);
  const glyph = await ph.evaluate(() => document.getElementById('place-glyph').textContent);
  await ph.tap('#beacon-btn'); await ph.waitForTimeout(150);
  if (shot) await ph.screenshot({ path: shot + '-320-world.png' });
  const t = await ph.evaluate(() => ({ r: window.__lumen.game.placeResult, n: window.__lumen.game.relays.length }));
  check('phone 320×568: Craft tab with a Relay row fits (≥ 44 px); ⊕ tap places a Relay (S-22)', fit.length === 0 && glyph === '⊕' && t.r === 'placed' && t.n === 1,
    JSON.stringify({ fit, glyph, t }));
  await ctx.close();
}

module.exports = { nodeChecks, browserChecks };
