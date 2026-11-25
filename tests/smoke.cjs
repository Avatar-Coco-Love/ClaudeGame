// Health check: serves the repo, drives the game in headless Chromium, exits non-zero on any failure.
// Usage: node tests/smoke.cjs   (uses the pre-installed Playwright; no npm install needed)
const path = require('path');
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const server = require('./serve.cjs').createServer(ROOT); // one static server for every test (session 101)

// Plant a save, then reload. Always use this: a plain reload fires `pagehide`, which saves the running game over the
// planted one (bit sessions 4 and 5). `edit(save)` runs in the page and returns the save to store (null = current save).
/** `old`: the edit writes a pre-S-45 format, and every such save is a 160 world (S-46b2): the live (256) game's progress
 *  is moved onto a 160 world of the same seed before edit() sees it. */
async function plantSaveAndReload(page, edit, old = false) {
  await page.evaluate(async ([src, old]) => {
    dispatchEvent(new Event('pagehide')); // flush the live game first so edit() sees current state
    window.__lumen.game.demo = true;      // ...then stop it from saving again during the reload
    const k = 'lumencore.save.v1';
    let cur = JSON.parse(localStorage.getItem(k));
    if (old) {
      const { Game } = await import('/src/game.js'), au = new Proxy({}, { get: () => () => {} });
      const small = new Game({ seed: cur.seed, mode: cur.mode, size: 160, audio: au }).toSave();
      cur = { ...small, bank: cur.bank, upgrades: cur.upgrades, nexus: cur.nexus, stats: cur.stats, mode: cur.mode };
    }
    localStorage.setItem(k, JSON.stringify((0, eval)(src)(cur)));
  }, [edit.toString(), old]);
  await page.reload(); await page.waitForTimeout(400);
}

const research = require('./research.cjs');
const beam = require('./beam.cjs');
const pulse = require('./pulse.cjs');
const audit29 = require('./audit29.cjs');
const touch = require('./touch.cjs');
const audit34 = require('./audit34.cjs');
const drawcost = require('./drawcost.cjs');
const audit39 = require('./audit39.cjs');
const craft = require('./craft.cjs');
const relay = require('./relay.cjs');
const glow = require('./glow.cjs');
const audit44 = require('./audit44.cjs');
const spire = require('./spire.cjs');
const pwa = require('./pwa.cjs');
const audioChecks = require('./audio.cjs');
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

(async () => {
  for (const r of require('./docs.cjs').run()) check(r.name, r.ok, r.detail);
  for (const r of require('./share.cjs').run()) check(r.name, r.ok, r.detail);
  pwa.nodeChecks(check);
  await require('./quality.cjs').nodeChecks(check);
  for (const r of require('./tuning.cjs').run()) check(r.name, r.ok, r.detail);
  for (const r of require('./comments.cjs').run()) check(r.name, r.ok, r.detail);
  for (const r of require('./colours.cjs').run()) check(r.name, r.ok, r.detail);
  await require('./world.cjs').nodeChecks(check);
  await require('./worldsize.cjs').nodeChecks(check);
  await require('./bigworld.cjs').nodeChecks(check).catch(e => check('S-46b2 big-world node checks ran', false, e.message));
  await require('./audit89.cjs').nodeChecks(check);
  await require('./audit119.cjs').nodeChecks(check).catch(e => check('audit 119 checks ran', false, e.message));
  await require('./saveformat.cjs').nodeChecks(check).catch(e => check('save-format checks ran', false, e.message));
  await require('./audit49.cjs').nodeChecks(check).catch(e => check('audit 49 checks ran', false, e.message));
  await require('./audit54.cjs').nodeChecks(check).catch(e => check('audit 54 checks ran', false, e.message));
  await research.nodeChecks(check).catch(e => check('S-11 research checks ran', false, e.message));
  await beam.nodeChecks(check).catch(e => check('S-13 beam checks ran', false, e.message));
  await pulse.nodeChecks(check).catch(e => check('S-14 pulse checks ran', false, e.message));
  await require('./arc.cjs').nodeChecks(check).catch(e => check('S-55 arc checks ran', false, e.message));
  await audit29.nodeChecks(check).catch(e => check('audit 29 checks ran', false, e.message));
  await audit39.nodeChecks(check).catch(e => check('audit 39 checks ran', false, e.message));
  await craft.nodeChecks(check).catch(e => check('S-16 craft checks ran', false, e.message));
  await relay.nodeChecks(check).catch(e => check('S-22 relay checks ran', false, e.message));
  await audit44.nodeChecks(check).catch(e => check('audit 44 checks ran', false, e.message));
  await spire.nodeChecks(check).catch(e => check('S-19 spire checks ran', false, e.message));
  await spire.foundChecks(check).catch(e => check('S-27 spire found checks ran', false, e.message));
  await require('./spirefeed.cjs').nodeChecks(check).catch(e => check('S-20 spire feed checks ran', false, e.message));
  await require('./facet.cjs').nodeChecks(check).catch(e => check('S-28 facet checks ran', false, e.message));
  await require('./reclaim.cjs').nodeChecks(check).catch(e => check('S-34 reclaim checks ran', false, e.message));
  await require('./cycle.cjs').nodeChecks(check).catch(e => check('S-29 cycle checks ran', false, e.message));
  await require('./ending.cjs').nodeChecks(check).catch(e => check('S-24 ending checks ran', false, e.message));
  await require('./wake.cjs').nodeChecks(check).catch(e => check('S-23 wake checks ran', false, e.message));
  await require('./surgebot.cjs').nodeChecks(check).catch(e => check('S-30 surge bot checks ran', false, e.message));
  await require('./spitter.cjs').nodeChecks(check).catch(e => check('S-32 spitter checks ran', false, e.message));
  await require('./weather.cjs').nodeChecks(check).catch(e => check('S-33 weather checks ran', false, e.message));
  await require('./anomaly.cjs').nodeChecks(check).catch(e => check('S-35 anomaly checks ran', false, e.message));
  await require('./anomalyfound.cjs').nodeChecks(check).catch(e => check('S-37 anomaly-found checks ran', false, e.message));
  await require('./keys.cjs').nodeChecks(check).catch(e => check('S-39 keys checks ran', false, e.message));
  await require('./echo.cjs').nodeChecks(check).catch(e => check('S-42 echo checks ran', false, e.message));
  await require('./echoorder.cjs').nodeChecks(check).catch(e => check('S-43 echo order checks ran', false, e.message));
  await require('./undertow.cjs').nodeChecks(check).catch(e => check('S-47 undertow checks ran', false, e.message));
  await require('./shatter.cjs').nodeChecks(check).catch(e => check('S-47b shatter checks ran', false, e.message));
  await require('./heat.cjs').nodeChecks(check).catch(e => check('S-48a heat checks ran', false, e.message));
  await require('./vent.cjs').nodeChecks(check).catch(e => check('S-48b vent checks ran', false, e.message));
  await require('./ore.cjs').nodeChecks(check).catch(e => check('S-49 ore checks ran', false, e.message));
  await require('./overdrive.cjs').nodeChecks(check).catch(e => check('S-50 overdrive checks ran', false, e.message));
  await require('./heatsink.cjs').nodeChecks(check).catch(e => check('S-51 heat sink checks ran', false, e.message));
  await require('./chart.cjs').nodeChecks(check).catch(e => check('S-52 chart checks ran', false, e.message));
  await require('./ward.cjs').nodeChecks(check).catch(e => check('S-56 ward checks ran', false, e.message));
  await require('./burrower.cjs').nodeChecks(check).catch(e => check('S-53 burrower checks ran', false, e.message));
  await require('./mote.cjs').nodeChecks(check).catch(e => check('S-54 mote checks ran', false, e.message));
  await new Promise(r => server.listen(0, r));
  const url = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const errors = [];
  try {
    // ---- Desktop ----
    const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    pg.on('pageerror', e => errors.push('desktop: ' + e.message));
    pg.on('console', m => { if (m.type() === 'error') errors.push('desktop console: ' + m.text()); });
    await pg.goto(url);
    await pg.waitForTimeout(400);
    check('title screen visible', await pg.isVisible('#title'));
    check('version shown on title', /^v\d+\.\d+\.\d+$/.test(await pg.textContent('#version')));
    await pg.keyboard.press('e'); await pg.waitForTimeout(150);
    check('E on the title does not open the Core Matrix (B-003)', !(await pg.isVisible('#matrix')));
    // B-012: pin the new world's seed. A random seed let "beam mines terrain" fall to 3 cells on a dense-rock column (~1 run in 4).
    await pg.evaluate(() => { window.__rnd = Math.random; Math.random = () => 0.42; });
    await pg.focus('#new-world'); await pg.keyboard.press('Enter'); // keyboard start: Enter is the button's, not a Matrix toggle
    await pg.evaluate(() => { Math.random = window.__rnd; });
    await pg.waitForTimeout(300);
    check('Enter on New World starts without opening the Matrix', !(await pg.isVisible('#matrix')));
    check('game started', await pg.evaluate(() => !!window.__lumen?.game && document.getElementById('title').classList.contains('hidden')));
    check('dev panel absent without ?dev (S-7)', await pg.evaluate(() => !document.getElementById('dev-panel')));

    // Mine straight down from the Nexus.
    // Real input, but timed by GAME time (B-006): the loop clamps dt to 0.05 s, so under load 5 s of wall clock was
    // as little as ~3 s of play and the cell count swung 3-8. Wait for 5 s of stats.time instead.
    await pg.mouse.move(640, 790); await pg.mouse.down(); await pg.keyboard.down('s');
    const mineT0 = await pg.evaluate(() => window.__lumen.game.stats.time);
    const mineWall = Date.now();
    await pg.waitForFunction(t => window.__lumen.game.stats.time >= t + 5, mineT0, { timeout: 60000, polling: 'raf' });
    await pg.keyboard.up('s'); await pg.mouse.up();
    const m = await pg.evaluate(() => { const g = window.__lumen.game; return { mined: g.stats.mined, got: g.cargo.shard + g.cargo.prism + g.bank.shard + g.bank.prism, dy: g.player.y - g.nexus.y }; });
    check('beam mines terrain', m.mined >= 4, `seed ${await pg.evaluate(() => window.__lumen.game.world.seed)}, mined ${m.mined} in 5 s game time (${((Date.now() - mineWall) / 1000).toFixed(1)} s wall)`);
    check('core tunnels forward', m.dy > 150, `moved ${Math.round(m.dy)}px`);
    // S-35: an open Anomaly site taken by touch -> an "✶ Overclock" chip under the cargo bar and the take toast; a deposit ends it.
    const an = await pg.evaluate(async () => { const g = window.__lumen.game, s = g.anomaly.sites[0], w = g.world, back = { x: g.player.x, y: g.player.y };
      s.kind = 'overclock'; // S-36: a site's kind varies by seed
      w.cells[s.y * w.w + s.x] = 0; g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 0.5) * 32; g.player.vx = g.player.vy = 0;
      for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r));
      const out = { buffs: g.buffs.join(), chip: document.querySelector('#buffs .chip')?.textContent, toast: document.getElementById('toast').textContent };
      g.player.x = back.x; g.player.y = back.y; return out; });
    check('S-35: taking an open Anomaly shows an "✶ Overclock" chip and the take toast', an.buffs === 'overclock' && an.chip === '✶ Overclock' && /Overclock — beam ×1.5 until you deposit/.test(an.toast), JSON.stringify(an));

    // Deposit + upgrade.
    await pg.evaluate(() => { const g = window.__lumen.game; g.cargo.shard = 30; g.cargo.prism = 5; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; });
    await pg.waitForTimeout(2000);
    const bank = await pg.evaluate(() => ({ ...window.__lumen.game.bank, cargo: window.__lumen.game.cargoTotal(), buffs: window.__lumen.game.buffs.length }));
    check('deposit empties cargo into bank', bank.cargo === 0 && bank.shard >= 30, JSON.stringify(bank));
    check('S-35: that deposit ended the Overclock', bank.buffs === 0, JSON.stringify(bank));
    // B-010: Shards already banked -> the hint says to upgrade, not to "bring shards home".
    await pg.evaluate(() => { const g = window.__lumen.game; g.player.y = g.nexus.y + 400; });
    await pg.waitForTimeout(200);
    const h10 = await pg.evaluate(() => ({ text: document.getElementById('hint').textContent, up: window.__lumen.game.stats.upgrades }));
    await pg.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; });
    await pg.waitForTimeout(100);
    check('banked Shards: hint says upgrade ready, not "bring home" (B-010)', h10.up === 0 && /upgrade ready/i.test(h10.text), JSON.stringify(h10));
    await pg.keyboard.press('e'); await pg.waitForTimeout(200);
    check('core matrix opens', await pg.isVisible('#matrix'));
    check('no "Press E" hint under the open Matrix (B-008)', !(await pg.isVisible('#hint')), await pg.textContent('#hint'));
    const before = await pg.evaluate(() => window.__lumen.game.bank.shard);
    await pg.click('#upgrade-list .upgrade:first-child .buy:not([disabled])');
    const after = await pg.evaluate(() => window.__lumen.game.bank.shard);
    check('upgrade purchase spends shards', after < before, `${before} -> ${after}`);
    const ring = await pg.evaluate(() => ({ ring: window.__lumen.game.coreRing, flash: document.querySelectorAll('#upgrade-list .upgrade.flash').length }));
    check('purchase rings the core and brightens its pip row (S-4)', ring.ring > 0 && ring.flash === 1, JSON.stringify(ring));

    // Nexus Development (S-1): Radiance costs Prisms only, widens the light, and reveals more of the map.
    const nx0 = await pg.evaluate(() => { const g = window.__lumen.game; g.bank.prism = 10; return { light: g.nexusLight(), shard: g.bank.shard, explored: g.world.explored.reduce((a, b) => a + b, 0) }; });
    await pg.click('#matrix .tabs button[data-tab="nexus"]');
    await pg.click('#upgrade-list .upgrade:first-child .buy:not([disabled])');
    const nx1 = await pg.evaluate(() => { const g = window.__lumen.game; return { light: g.nexusLight(), shard: g.bank.shard, prism: g.bank.prism, lvl: g.nexusLevels.radiance, explored: g.world.explored.reduce((a, b) => a + b, 0) }; });
    check('Radiance spends Prisms, not Shards', nx1.lvl === 1 && nx1.prism === 4 && nx1.shard === nx0.shard, JSON.stringify(nx1));
    check('Radiance widens Nexus light by 96 and reveals map', nx1.light === nx0.light + 96 && nx1.explored > nx0.explored, `${nx0.light}->${nx1.light}, explored ${nx0.explored}->${nx1.explored}`);
    await pg.keyboard.press('Escape'); await pg.keyboard.press('e'); await pg.waitForTimeout(100);
    check('Matrix remembers the last tab', await pg.evaluate(() => document.querySelector('#matrix .tabs .selected')?.dataset.tab === 'nexus'));
    await pg.keyboard.press('Escape');

    // S-4 feel: hitstop on yield-cell breaks only (crystal, prism, Lumen; caches too, D-048; rate-limited) and the loop really pauses the sim for it;
    // deposit arpeggio once per emptied hold, sized by kinds; beam sweep only on the off -> on edge.
    const fx = await pg.evaluate(() => {
      const g = window.__lumen.game, calls = { beamStart: 0, depositDone: [] }, a = g.audio;
      const orig = { beamStart: a.beamStart, depositDone: a.depositDone };
      a.beamStart = () => calls.beamStart++; a.depositDone = n => calls.depositDone.push(n);
      g.hitstop = 0; g.lastHitstop = -Infinity;
      g.onCellBroken(1, 1, 1); const rock = g.hitstop;
      g.onCellBroken(1, 1, 3); const crystal = g.hitstop; g.hitstop = 0;
      g.onCellBroken(1, 1, 4); const tooSoon = g.hitstop;
      const idle = { move: { x: 0, y: 0 }, fire: false, aim: null }, fire = { move: { x: 0, y: 0 }, fire: true, aim: { x: 0, y: -1 } };
      g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; g.cargo.shard = 3; g.cargo.prism = 2;
      for (let i = 0; i < 30; i++) g.update(1 / 60, idle);
      g.cargo.shard = 2;
      for (let i = 0; i < 30; i++) g.update(1 / 60, idle);
      for (const inp of [fire, fire, fire, idle, fire, fire]) g.update(1 / 60, inp);
      g.update(1 / 60, idle);
      Object.assign(a, orig);
      return { rock, crystal, tooSoon, ...calls };
    });
    check('hitstop on yield-cell breaks only (not rock), at most once per 150 ms (S-4)', fx.rock === 0 && fx.crystal > 0 && fx.tooSoon === 0, JSON.stringify(fx));
    check('deposit arpeggio sized by kinds; beam sweep once per switch-on (S-4)', JSON.stringify(fx.depositDone) === '[2,1]' && fx.beamStart === 2, JSON.stringify(fx));
    const rm = await pg.evaluate(() => { const g = window.__lumen.game, st = window.__lumen.settings; st.reducedMotion = true;
      g.hitstop = 0; g.lastHitstop = -Infinity; g.coreRing = 0; g.bank.shard += 999; g.onCellBroken(1, 1, 3); g.buy('magnet');
      const r = { hitstop: g.hitstop, ring: g.coreRing, bought: g.upgrades.magnet }; st.reducedMotion = false; g.hitstop = 0; return r; });
    check('reduced motion: no hitstop, no upgrade ring (S-4)', rm.hitstop === 0 && rm.ring === 0 && rm.bought >= 1, JSON.stringify(rm));
    const hs = await pg.evaluate(async () => { const g = window.__lumen.game, t0 = g.stats.time; g.hitstop = 0.4;
      await new Promise(r => setTimeout(r, 250)); return { frozen: g.stats.time - t0, left: g.hitstop }; });
    check('main loop holds the sim during hitstop (S-4)', hs.frozen === 0 && hs.left > 0 && hs.left < 0.4, JSON.stringify(hs));

    // Surge mode: glitches spawn and die to the beam.
    await pg.evaluate(() => { const g = window.__lumen.game; g.setMode('surge'); g.player.x = g.nexus.x + 1200; g.player.y = g.nexus.y + 1200;
      for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) g.world.destroy(Math.floor(g.player.x / 32) + x, Math.floor(g.player.y / 32) + y); g.spawnTimer = 0; });
    await pg.waitForTimeout(3000);
    check('surge spawns glitches', await pg.evaluate(() => window.__lumen.game.enemies.length > 0));
    await pg.evaluate(() => { const g = window.__lumen.game, p = g.player; g.enemies = [{ x: p.x + 60, y: p.y, r: 11, vx: 0, vy: 0, tier: 0, hp: 1, maxHp: 1, speed: 0, dmg: 1, spin: 0, flash: 0, hitCd: 9, wander: 0, alert: true }]; });
    await pg.mouse.move(900, 400); await pg.mouse.down(); await pg.waitForTimeout(1500); await pg.mouse.up();
    check('beam kills glitches', await pg.evaluate(() => window.__lumen.game.stats.glitches >= 1));
    // B-007: dying to the last of several Glitches near the Nexus emptied the list mid-loop and froze the game.
    const t0 = await pg.evaluate(() => { const g = window.__lumen.game, p = g.player; p.x = g.nexus.x + 600; p.y = g.nexus.y; p.integrity = 1; p.invuln = 0;
      g.enemies = [0, 1, 2].map(() => ({ x: p.x, y: p.y, r: 11, vx: 0, vy: 0, tier: 0, hp: 9, maxHp: 9, speed: 0, dmg: 50, spin: 0, flash: 0, hitCd: 0, wander: 0, alert: true }));
      return g.stats.time; });
    await pg.waitForTimeout(500);
    const d7 = await pg.evaluate(t => { const g = window.__lumen.game; return { ran: g.stats.time - t, home: Math.round(Math.hypot(g.player.x - g.nexus.x, g.player.y - g.nexus.y)) }; }, t0);
    check('death among several Glitches keeps the game running (B-007)', d7.ran > 0.2 && d7.home < 200, JSON.stringify(d7));
    // S-6: a Glitch boxed in by dense rock gives up (fades, no kill credit); one with a clear line keeps chasing. Stepped in-page, 8 s.
    const s6 = await pg.evaluate(() => {
      const g = window.__lumen.game, p = g.player, w = g.world, C = 32;
      p.x = g.nexus.x + 1200.5; p.y = g.nexus.y + 1216; p.integrity = 1e6; p.vx = p.vy = 0;
      const set = (cx, cy, t) => { w.cells[w.idx(cx, cy)] = t; w.damage[w.idx(cx, cy)] = 0; };
      const pcx = Math.floor(p.x / C), pcy = Math.floor(p.y / C);
      for (let y = -1; y <= 1; y++) for (let x = -10; x <= 1; x++) set(pcx + x, pcy + y, 0); // open corridor to the west (player invulnerable: hits would knock it toward the box)
      for (let y = -1; y <= 1; y++) for (let x = 8; x <= 10; x++) set(pcx + x, pcy + y, x === 9 && y === 0 ? 0 : 2); // dense box to the east
      const mk = cx => ({ x: (cx + 0.5) * C, y: (pcy + 0.5) * C, r: 11, vx: 0, vy: 0, tier: 0, hp: 99, maxHp: 99, speed: 120, dmg: 0, spin: 0, flash: 0, hitCd: 0, wander: 0, alert: false });
      const boxed = mk(pcx + 9), open = mk(pcx - 9);
      g.enemies = [boxed, open];
      const kills = g.stats.glitches, d0 = Math.hypot(open.x - p.x, open.y - p.y);
      for (let i = 0; i < 480; i++) { g.spawnTimer = 99; p.invuln = 9; g.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null }); }
      return { boxedGone: !g.enemies.includes(boxed), openHere: g.enemies.includes(open), d0: Math.round(d0),
        d1: Math.round(Math.hypot(open.x - p.x, open.y - p.y)), killsSame: g.stats.glitches === kills };
    });
    check('boxed-in Glitch gives up and frees its slot (S-6)', s6.boxedGone && s6.killsSame, JSON.stringify(s6));
    check('Glitch with a clear line keeps chasing (S-6)', s6.openHere && s6.d1 < s6.d0, JSON.stringify(s6));

    // Save / reload.
    const snap = await pg.evaluate(() => { dispatchEvent(new Event('pagehide')); const g = window.__lumen.game; return { mined: g.stats.mined, up: JSON.stringify(g.upgrades), nexus: g.nexusLevels.radiance }; });
    await pg.reload(); await pg.waitForTimeout(400);
    check('continue offered after reload', await pg.isVisible('#continue'));
    await pg.click('#continue'); await pg.waitForTimeout(200);
    const re = await pg.evaluate(() => { const g = window.__lumen.game; return { mined: g.stats.mined, up: JSON.stringify(g.upgrades), mode: g.mode, nexus: g.nexusLevels.radiance }; });
    check('save restores progress (incl. Radiance)', re.mined === snap.mined && re.up === snap.up && re.mode === 'surge' && re.nexus === 1 && snap.nexus === 1, JSON.stringify(re));

    // Old saves must load: a save written before format tracking has no `v`.
    // A format-1 save has no `nexus` either.
    await plantSaveAndReload(pg, s => { delete s.v; delete s.nexus; return s; }, true);
    await pg.click('#continue'); await pg.waitForTimeout(200);
    const old = await pg.evaluate(() => ({ mined: window.__lumen.game.stats.mined, radiance: window.__lumen.game.nexusLevels.radiance }));
    check('unversioned (format 1) save still loads, Radiance 0', old.mined === snap.mined && old.radiance === 0, JSON.stringify(old));
    // A format-2 save has no `pickups` (B-011).
    await plantSaveAndReload(pg, s => { s.v = 2; delete s.pickups; return s; }, true);
    await pg.click('#continue'); await pg.waitForTimeout(200);
    const f2 = await pg.evaluate(() => ({ mined: window.__lumen.game.stats.mined, pickups: window.__lumen.game.pickups.length }));
    check('format-2 save (no pickups) still loads (B-011)', f2.mined === snap.mined && f2.pickups >= 0, JSON.stringify(f2));

    // A save this build can't read (newer format) must not be wiped without asking (D-005, B-004).
    await plantSaveAndReload(pg, () => ({ v: 99, seed: 5, mode: 'drift', bank: { shard: 1, prism: 1 } }));
    let asked = false; pg.once('dialog', d => { asked = true; d.dismiss(); });
    await pg.click('#new-world'); await pg.waitForTimeout(200);
    const kept = await pg.evaluate(() => JSON.parse(localStorage.getItem('lumencore.save.v1'))?.v);
    check('New World asks before replacing an unreadable save', asked && kept === 99, `asked ${asked}, v ${kept}`);

    // Frame budget: average frame time while mining.
    const fps = await pg.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { if (++n < 120) requestAnimationFrame(f); else r(1000 * n / (performance.now() - t0)); }; requestAnimationFrame(f); }));
    check('frame rate reasonable (headless)', fps > 20, `${fps.toFixed(1)} fps`);
    await pg.close();

    // ---- Dev panel (S-7): every action is a __lumen.dev function; the panel only calls them ----
    const dp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    dp.on('pageerror', e => errors.push('dev: ' + e.message));
    await dp.goto(url + '?dev'); await dp.waitForTimeout(200);
    await dp.evaluate(() => { try { localStorage.clear(); } catch {} });
    await dp.click('#new-world'); await dp.waitForTimeout(200);
    const tp = await dp.evaluate(async () => {
      const L = window.__lumen, g = L.game, { x, y } = L.dev.teleport(60), w = g.world;
      let open = true; for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (w.solid(xx, yy)) open = false;
      const t0 = g.stats.time; await new Promise(r => { const f = () => g.stats.time > t0 + 0.5 ? r() : requestAnimationFrame(f); f(); });
      return { d: Math.round(Math.hypot(g.player.x - g.nexus.x, g.player.y - g.nexus.y)), open, panel: getComputedStyle(document.getElementById('dev-panel')).display !== 'none' };
    });
    check('dev.teleport(60): core ≥ 1800 px out in an open room; panel shown with ?dev (S-7)', tp.d >= 1800 && tp.open && tp.panel, JSON.stringify(tp));
    // Audit 19: teleport never carves the bedrock border (B-013); off-screen floor pickups aren't drawn (B-014).
    const au = await dp.evaluate(() => {
      const L = window.__lumen, g = L.game, w = g.world, isBed = () => [...w.cells].filter(c => c === 5).length;
      const bed0 = isBed(); L.dev.teleport(90); const bedLost = bed0 - isBed();
      // Draws (fill or drawImage: a pickup is a sprite since B-027) made inside drawPickups only, so chunk blits don't count.
      const R = L.renderer, ctx = R.ctx, fill = ctx.fill, img = ctx.drawImage, dp = R.drawPickups; let fills = 0, inPk = false;
      ctx.fill = function (...a) { if (inPk) fills++; return fill.apply(this, a); }; ctx.drawImage = function (...a) { if (inPk) fills++; return img.apply(this, a); };
      R.drawPickups = function (...a) { inPk = true; try { return dp.apply(this, a); } finally { inPk = false; } };
      const saved = g.pickups.splice(0);
      for (let i = 0; i < 400; i++) g.pickups.push({ x: g.nexus.x + (i % 20) * 6, y: g.nexus.y + Math.floor(i / 20) * 6, vx: 0, vy: 0, kind: 'shard', age: 1, r: 4 });
      R.draw(0.016, L.input); const off = fills; fills = 0;
      g.pickups.length = 0; g.pickups.push({ x: R.cam.x + 20, y: R.cam.y, vx: 0, vy: 0, kind: 'prism', age: 1, r: 4 }); // the camera lags the teleport
      R.draw(0.016, L.input); const on = fills;
      ctx.fill = fill; ctx.drawImage = img; delete R.drawPickups; g.pickups.splice(0, g.pickups.length, ...saved);
      return { bedLost, offFills: off, onFills: on };
    });
    check('teleport(90) keeps the bedrock border (B-013); 400 off-screen pickups add no draws (B-014)',
      au.bedLost === 0 && au.onFills - au.offFills >= 1 && au.offFills < 50, JSON.stringify(au));
    await dp.click('#dev-panel [data-dev="+100◆"]'); await dp.click('#dev-panel [data-dev="God"]');
    const dv = await dp.evaluate(() => {
      const L = window.__lumen, g = L.game, godOn = g.god, mode = L.dev.setMode('surge');
      const hp = g.player.integrity; g.hurtPlayer(50, 1, 0); const after = g.player.integrity;
      L.dev.maxAll();
      return { shard: g.bank.shard, mode, godOn, hp, after, row: !document.getElementById('integrity-row').classList.contains('hidden'),
        maxed: g.upgrades.beam === 8 && g.nexusLevels.radiance === 5, saved: /god/.test(JSON.stringify(g.toSave())) };
    });
    check('dev panel +100◆ and God; god mode takes no damage; max all; never saved (S-7)',
      dv.shard === 100 && dv.mode === 'surge' && dv.godOn && dv.hp === dv.after && dv.row && dv.maxed && !dv.saved, JSON.stringify(dv));
    await dp.close();

    // ---- Phone (touch) ----
    const ctx = await browser.newContext({ ...devices['Pixel 7'] });
    const ph = await ctx.newPage();
    ph.on('pageerror', e => errors.push('phone: ' + e.message));
    await ph.goto(url); await ph.waitForTimeout(300);
    await ph.evaluate(() => { try { localStorage.clear(); } catch {} });
    await ph.reload(); await ph.waitForTimeout(300);
    await ph.reload(); await ph.waitForTimeout(300); // a fresh visitor leaving + returning must not get a phantom save
    check('title demo world is never saved', !(await ph.isVisible('#continue')));
    await ph.tap('#new-world'); await ph.waitForTimeout(300);
    // Before any touch: a phone must already get touch hints and no keyboard badge (B-002, S-2).
    const pre = await ph.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; return document.getElementById('hint').textContent; });
    await ph.waitForTimeout(150);
    const kbd = await ph.evaluate(() => { const k = document.querySelector('#matrix-btn kbd'); return !!k && k.getClientRects().length > 0; });
    check('phone shows touch hint + no E badge before first touch (B-002)', /thumb/i.test(pre) && !kbd, `hint "${pre}", E badge ${kbd ? 'shown' : 'hidden'}`);
    const cdp = await ctx.newCDPSession(ph);
    const vp = ph.viewportSize();
    const pts = dy => [{ x: 80, y: vp.height - 150 + dy, id: 1 }, { x: vp.width - 80, y: vp.height - 150 + dy, id: 2 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(0) });
    for (let i = 0; i < 30; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(50) }); await ph.waitForTimeout(100); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const t = await ph.evaluate(() => { const g = window.__lumen.game; return { mined: g.stats.mined, moved: Math.round(Math.hypot(g.player.x - g.nexus.x, g.player.y - g.nexus.y - 40)), beam: g.beam.on }; });
    check('touch stick moves the core', t.moved > 60, JSON.stringify(t));
    check('touch aim stick fires the beam', t.mined > 0 || t.beam, JSON.stringify(t));
    // Leaving the page mid-drag (no touchend ever arrives) must drop both sticks, like held keys (audit 9).
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(0) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(50) }); await ph.waitForTimeout(100);
    const held = await ph.evaluate(() => {
      const i = window.__lumen.input, before = !!(i.sticks.move && i.sticks.aim);
      dispatchEvent(new Event('blur'));
      const m = i.read({ x: 0, y: 0 }).move;
      return { before, after: !!(i.sticks.move || i.sticks.aim), move: Math.hypot(m.x, m.y) };
    });
    check('blur releases held touch sticks', held.before && !held.after && held.move === 0, JSON.stringify(held));
    await ctx.close();

    await research.browserChecks(browser, url, check, errors, plantSaveAndReload);
    await beam.browserChecks(browser, url, check, errors);
    await pulse.browserChecks(browser, url, check, errors);
    await require('./arc.cjs').browserChecks(browser, url, check, errors, process.env.ARC_SHOT).catch(e => check('S-55 arc browser checks ran', false, e.message));
    await audit29.browserChecks(browser, url, check, errors);
    await touch.browserChecks(browser, url, check, errors);
    await audit34.browserChecks(browser, url, check, errors);
    await drawcost.browserChecks(browser, url, check, errors);
    await audit39.browserChecks(browser, url, check, errors);
    await require('./audit84.cjs').browserChecks(browser, url, check, errors);
    await craft.browserChecks(browser, url, check, errors, plantSaveAndReload);
    await relay.browserChecks(browser, url, check, errors, plantSaveAndReload, process.env.RELAY_SHOT);
    await glow.browserChecks(browser, url, check, errors);
    await pwa.browserChecks(browser, url, check, errors);
    await require('./keys.cjs').browserChecks(browser, url, check, errors).catch(e => check('S-39 keys browser checks ran', false, e.message));
    await spire.browserChecks(browser, url, check, errors, process.env.SPIRE_SHOT);
    await require('./spirefeed.cjs').browserChecks(browser, url, check, errors, process.env.SPIRE_SHOT);
    await require('./facet.cjs').browserChecks(browser, url, check, errors, process.env.SPIRE_SHOT);
    await require('./wake.cjs').browserChecks(browser, url, check, errors, process.env.SPIRE_SHOT);
    await require('./ending.cjs').browserChecks(browser, url, check, errors, process.env.SPIRE_SHOT);
    await require('./cycle.cjs').browserChecks(browser, url, check, errors, process.env.SPIRE_SHOT);
    await require('./reclaim.cjs').browserChecks(browser, url, check, errors, process.env.SPIRE_SHOT);
    await require('./audit54.cjs').browserChecks(browser, url, check, errors).catch(e => check('audit 54 browser checks ran', false, e.message));
    await require('./hud.cjs').browserChecks(browser, url, check, errors);
    await require('./anomalyfound.cjs').browserChecks(browser, url, check, errors).catch(e => check('S-37 anomaly-found browser checks ran', false, e.message));
    await require('./worldsize.cjs').browserChecks(browser, url, check, errors).catch(e => check('S-46b world-size browser checks ran', false, e.message));
    await require('./bigworld.cjs').browserChecks(browser, url, check, errors).catch(e => check('S-46b2 big-world browser checks ran', false, e.message));
    await require('./hud.cjs').toastChecks(browser, url, check, errors);
    await require('./quality.cjs').browserChecks(browser, url, check, errors).catch(e => check('S-41 graphics quality browser checks ran', false, e.message));
    await require('./textsize.cjs').browserChecks(browser, url, check, errors).catch(e => check('S-40 text size browser checks ran', false, e.message));
    await require('./echo.cjs').browserChecks(browser, url, check, errors, process.env.ECHO_SHOT).catch(e => check('S-42 echo browser checks ran', false, e.message));
    await require('./echoorder.cjs').browserChecks(browser, url, check, errors, process.env.ECHO_ORDER_SHOT).catch(e => check('S-43 echo order browser checks ran', false, e.message));
    await require('./undertow.cjs').browserChecks(browser, url, check, errors, process.env.UNDERTOW_SHOT).catch(e => check('S-47 undertow browser checks ran', false, e.message));
    await require('./heat.cjs').browserChecks(browser, url, check, errors, process.env.HEAT_SHOT).catch(e => check('S-48a heat browser checks ran', false, e.message));
    await require('./vent.cjs').browserChecks(browser, url, check, errors, process.env.VENT_SHOT).catch(e => check('S-48b vent browser checks ran', false, e.message));
    await require('./ore.cjs').browserChecks(browser, url, check, errors, process.env.ORE_SHOT).catch(e => check('S-49 ore browser checks ran', false, e.message));
    await require('./overdrive.cjs').browserChecks(browser, url, check, errors, process.env.OVERDRIVE_SHOT).catch(e => check('S-50 overdrive browser checks ran', false, e.message));
    await require('./heatsink.cjs').browserChecks(browser, url, check, errors, process.env.HEATSINK_SHOT).catch(e => check('S-51 heat sink browser checks ran', false, e.message));
    await require('./chart.cjs').browserChecks(browser, url, check, errors, process.env.CHART_SHOT).catch(e => check('S-52 chart browser checks ran', false, e.message));
    await require('./ward.cjs').browserChecks(browser, url, check, errors, process.env.WARD_SHOT).catch(e => check('S-56 ward browser checks ran', false, e.message));
    await require('./burrower.cjs').browserChecks(browser, url, check, errors, process.env.BURROW_SHOT).catch(e => check('S-53 burrower browser checks ran', false, e.message));
    await require('./mote.cjs').browserChecks(browser, url, check, errors, process.env.MOTE_SHOT).catch(e => check('S-54 mote browser checks ran', false, e.message));
    await require('./audit99.cjs').browserChecks(browser, url, check, errors).catch(e => check('audit 99 browser checks ran', false, e.message));
    await audioChecks.browserChecks(browser, url, check, errors);
    await require('./music.cjs').browserChecks(browser, url, check, errors).catch(e => check('S-44 music browser checks ran', false, e.message));

    // ---- Settings (S-3, D-016) ----
    const sp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    sp.on('pageerror', e => errors.push('settings: ' + e.message));
    await sp.goto(url); await sp.waitForTimeout(200);
    await sp.evaluate(() => { try { localStorage.clear(); localStorage.setItem('lumencore.muted', '1'); } catch {} });
    await sp.reload(); await sp.waitForTimeout(300);
    const legacy = await sp.evaluate(() => ({ s: window.__lumen.settings.muted, a: window.__lumen.audio.muted,
      stored: JSON.parse(localStorage.getItem('lumencore.settings.v1'))?.muted, old: localStorage.getItem('lumencore.muted') }));
    check('legacy lumencore.muted = 1 loads as muted (S-3)', legacy.s && legacy.a && legacy.stored === true && legacy.old === null, JSON.stringify(legacy));
    await sp.click('#settings-btn'); await sp.waitForTimeout(100);
    await sp.click('#settings [data-setting="shake"]');
    await sp.$eval('#set-volume', el => { el.value = 0; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await sp.keyboard.press('Escape'); await sp.waitForTimeout(100);
    const closed = !(await sp.isVisible('#settings'));
    await sp.click('#new-world'); await sp.waitForTimeout(200);
    // Kill a Glitch and take a hit with shake off, stepped in-page; both used to set game.shake to 4 / 8.
    const sk = await sp.evaluate(() => {
      const g = window.__lumen.game, p = g.player, C = 32;
      g.setMode('surge'); p.x = g.nexus.x + 1200.5; p.y = g.nexus.y + 1216;
      for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) g.world.destroy(Math.floor(p.x / C) + x, Math.floor(p.y / C) + y);
      g.enemies = [{ x: p.x + 60, y: p.y, r: 11, vx: 0, vy: 0, tier: 0, hp: 0.05, maxHp: 1, speed: 0, dmg: 1, spin: 0, flash: 0, hitCd: 9, wander: 0, alert: true }];
      const kills = g.stats.glitches; let maxShake = 0;
      for (let i = 0; i < 60; i++) { g.spawnTimer = 99; g.update(1 / 60, { move: { x: 0, y: 0 }, fire: true, aim: { x: 1, y: 0 } }); maxShake = Math.max(maxShake, g.shake); }
      g.hurtPlayer(1, 0, 0); maxShake = Math.max(maxShake, g.shake);
      return { killed: g.stats.glitches - kills, maxShake };
    });
    check('shake off: no screen shake after a Glitch kill or a hit (S-3)', closed && sk.killed >= 1 && sk.maxShake === 0, JSON.stringify({ closed, ...sk }));
    await sp.reload(); await sp.waitForTimeout(300);
    const persisted = await sp.evaluate(() => ({ vol: window.__lumen.settings.volume, gain: window.__lumen.audio.volume, shake: window.__lumen.settings.shake, ui: document.getElementById('set-volume').value }));
    check('volume 0 and shake off survive reload (S-3)', persisted.vol === 0 && persisted.gain === 0 && persisted.shake === false && persisted.ui === "0", JSON.stringify(persisted));
    check('settings never enter the world save', await sp.evaluate(() => !/volume|shake/.test(localStorage.getItem('lumencore.save.v1') || '')));
    await sp.close();

    // Narrowest phone: Matrix tabs and buy buttons fit at 320 px (S-1).
    const np = await browser.newPage({ viewport: { width: 320, height: 568 } });
    await np.goto(url); await np.waitForTimeout(200);
    // Nothing on the title, HUD or Matrix may overflow its box at 320 px (B-001, S-2). The hint's ellipsis is deliberate.
    const overflow = () => np.evaluate(() => [...document.querySelectorAll('#hud *, #title *, #matrix *, #settings *')]
      .filter(e => e.id !== 'hint' && e.getClientRects().length && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline')
      .map(e => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''} ${e.scrollWidth}>${e.clientWidth}`));
    const ovTitle = await overflow();
    // Settings sheet at 320×568: fits without scrolling, nothing overflows, every control ≥ 40 px tall (S-3).
    await np.click('#settings-btn'); await np.waitForTimeout(100);
    const st = await np.evaluate(() => { const sh = document.querySelector('#settings .sheet'), r = sh.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), scroll: sh.scrollHeight > sh.clientHeight,
        short: [...document.querySelectorAll('#settings button, #settings input')].filter(e => e.getClientRects().length && e.getBoundingClientRect().height < 40).map(e => e.id || e.dataset.setting) }; });
    ovTitle.push(...await overflow());
    check('Settings fits at 320×568, controls ≥ 40 px (S-3)', st.top >= 0 && st.bottom <= 568 && !st.scroll && st.short.length === 0, JSON.stringify(st));
    await np.click('#settings-close'); await np.waitForTimeout(100);
    await np.click('#new-world'); await np.waitForTimeout(200);
    await np.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; g.demo = true; });
    await np.keyboard.press('e'); await np.waitForTimeout(100);
    await np.click('#matrix .tabs button[data-tab="nexus"]');
    const clip = await np.evaluate(() => { const sh = document.querySelector('#matrix .sheet').getBoundingClientRect();
      return [...document.querySelectorAll('#matrix .tabs button, #matrix .buy, #matrix-close')].filter(e => { const r = e.getBoundingClientRect(); return r.left < sh.left || r.right > sh.right || e.scrollWidth > e.clientWidth; }).map(e => e.textContent); });
    await np.click('#matrix .tabs button[data-tab="research"]'); // S-11: the third tab and its Lumen hint fit too
    clip.push(...await np.evaluate(() => { const sh = document.querySelector('#matrix .sheet').getBoundingClientRect();
      return [...document.querySelectorAll('#matrix .tabs button, #matrix .buy, #upgrade-list .upgrade, .research-hint')].filter(e => { const r = e.getBoundingClientRect(); return r.left < sh.left || r.right > sh.right || e.scrollWidth > e.clientWidth; }).map(e => e.textContent); }));
    check('Matrix tabs + buy fit at 320 px (Nexus + Research with 2 nodes, S-13)', clip.length === 0, clip.join(', '));
    const ov = [...ovTitle, ...await overflow()];
    check('nothing overflows at 320 px: title, Settings, HUD, Matrix (B-001)', ov.length === 0, ov.join(', '));
    await np.close();
  } catch (e) {
    check('smoke run completed', false, e.message);
  } finally {
    check('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
    await browser.close();
    server.close();
    const failed = results.filter(r => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} checks passed`);
    process.exit(failed ? 1 : 0);
  }
})();
