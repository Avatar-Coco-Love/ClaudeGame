// S-70 Echo upgrades (D-185): Focus / Volley / Tether, ● 20 then ● 35, levels 0…2, saved as `echoLevels` (format 25).
// Costs and levels; echoStat per level; Focus moves the Echo's dps, Volley its shots in 10 s, Tether the cells it may
// pick and its Defend range; no Core Matrix stat moves; old / malformed saves; Research tab rows (+ phone Large text).
// smoke.cjs calls nodeChecks + browserChecks.
const { newWorld } = require('./pinworld.cjs');
const idle = () => ({ move: { x: 0, y: 0 }, aim: null, fire: false });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { T, CELL, UPGRADES, ECHO_LEVELS } = await import('../src/config.js');
  const { makeGlitch } = await import('../src/glitch.js');
  const { echoStat, buyEchoLevel, ECHO_ROWS } = await import('../src/echolevels.js');
  const { upgradeSave, SAVE_FORMAT, STEPS } = await import('../src/save.js');
  const audio = new Proxy({}, { get: () => () => {} });

  // Costs: refused before the Echo; ● 20, ● 35, then a 3rd buy refused; ● 165 for all three rows.
  {
    const g = new Game({ seed: 4242, mode: 'surge', audio }); g.bank.lumen = 500;
    const pre = buyEchoLevel(g, 'focus');
    g.research.echo = true;
    const stat0 = Object.fromEntries(UPGRADES.map(u => [u.id, g.stat(u.id)]));
    const spent = [];
    for (const r of ECHO_ROWS) for (let i = 0; i < 2; i++) { const b = g.bank.lumen; buyEchoLevel(g, r); spent.push(b - g.bank.lumen); }
    const third = ECHO_ROWS.map(r => buyEchoLevel(g, r));
    check('S-70 Echo upgrades: refused before the Echo; ● 20 then ● 35 per row, ● 165 in all; levels 2; a 3rd buy refused',
      !pre && spent.join() === '20,35,20,35,20,35' && 500 - g.bank.lumen === 165 && ECHO_ROWS.every(r => g.echoLevels[r] === 2) && third.every(b => !b),
      JSON.stringify({ pre, spent, levels: g.echoLevels, third }));
    check('S-70 Echo upgrades: no Core Matrix stat moves', UPGRADES.every(u => g.stat(u.id) === stat0[u.id]), JSON.stringify(stat0));
    const poor = new Game({ seed: 4242, mode: 'surge', audio }); poor.research.echo = true; poor.bank.lumen = 19;
    check('S-70 Echo upgrades: 19 ● cannot buy a level', !buyEchoLevel(poor, 'focus') && poor.bank.lumen === 19 && poor.echoLevels.focus === 0);
  }
  // echoStat per level = the spec table.
  {
    const g = new Game({ seed: 4242, mode: 'surge', audio }), got = [];
    for (let l = 0; l <= 2; l++) { Object.assign(g.echoLevels, { focus: l, volley: l, tether: l }); got.push(['dmg', 'guardS', 'reach', 'guardPx'].map(k => echoStat(g, k))); }
    check('S-70 echoStat: Focus 0.5/0.7/0.9, Volley 0.8/0.6/0.45 s, Tether 5/6/7 cells + 140/170/200 px',
      JSON.stringify(got) === JSON.stringify([[0.5, 0.8, 5, 140], [0.7, 0.6, 6, 170], [0.9, 0.45, 7, 200]]) && ECHO_LEVELS.focus.stats.dmg.length === 3, JSON.stringify(got));
  }

  // A 9×5 hall in rock 30 cells east of the Nexus; the core at its west end, the Echo owned.
  const lab = (order, lv) => {
    const g = new Game({ seed: 4242, mode: 'surge', audio }), w = g.world, ox = w.cx + 30, oy = w.cy;
    for (let y = oy - 2; y <= oy + 8; y++) for (let x = ox - 2; x <= ox + 12; x++) w.cells[w.idx(x, y)] = T.ROCK;
    for (let y = 0; y <= 4; y++) for (let x = 0; x <= 8; x++) w.cells[w.idx(ox + x, oy + y)] = T.EMPTY;
    Object.assign(g.player, { x: (ox + 1.5) * CELL, y: (oy + 2.5) * CELL, vx: 0, vy: 0 });
    g.spawnTimer = 1e9; g.research.echo = true; g.echoOrder = order; Object.assign(g.echoLevels, lv);
    for (let i = 0; i < 60; i++) g.update(1 / 60, idle());
    return { g, w, ox, oy };
  };
  // Focus: the Echo's damage rate on a ▲ 4 cells east scales 0.5 -> 0.9 × Beam Power.
  const rate = focus => {
    const { g, w, ox, oy } = lab('gather', { focus });
    const i0 = w.idx(ox + 5, oy + 2); w.cells[i0] = T.PRISM; w.explored[i0] = 1;
    for (let i = 0; i < 120 && !w.damage[i0]; i++) g.update(1 / 60, idle());
    const d0 = w.damage[i0];
    for (let i = 0; i < 15; i++) g.update(1 / 60, idle());
    return { r: (w.damage[i0] - d0) * 4, want: g.stat('beam') * echoStat(g, 'dmg') };
  };
  { const a = rate(0), b = rate(2);
    check('S-70 Focus: the Echo mines at 0.5 × Beam Power at level 0 and 0.9 × at level 2', a.r > 0 && Math.abs(a.r - a.want) < 0.03 * a.want && Math.abs(b.r - b.want) < 0.03 * b.want && b.r > 1.7 * a.r,
      JSON.stringify({ a, b })); }
  // Volley: shots at a held, unkillable Glitch 100 px east in 10 s.
  const shots = (lv, px = 100, secs = 10) => {
    const { g } = lab('guard', lv), gx = g.player.x + px, gy = g.player.y;
    let e = null;
    const s0 = g.echo.shots;
    for (let t = 0; t < secs; t += 1 / 60) {
      if (!e || !g.enemies.includes(e) || e.fade !== undefined) { // a held Glitch gives up after 6 s (D-017): swap in a fresh one
        if (e && g.enemies.includes(e)) g.enemies.splice(g.enemies.indexOf(e), 1);
        e = makeGlitch(gx, gy, 1, 0); e.aggro = true; g.enemies.push(e);
      }
      Object.assign(e, { x: gx, y: gy, vx: 0, vy: 0, hp: 1e9 }); g.update(1 / 60, idle());
    }
    return g.echo.shots - s0;
  };
  { const v0 = shots({ volley: 0 }), v2 = shots({ volley: 2 });
    check('S-70 Volley: Defend shoots ~12 times in 10 s at level 0, ~22 at level 2', Math.abs(v0 - 10 / 0.8) <= 1.5 && Math.abs(v2 - 10 / 0.45) <= 1.5, JSON.stringify({ v0, v2 })); }
  // Tether: an ore cell 6 cells from the core is out of reach at level 0, picked at level 1; a Glitch 160 px out likewise.
  const picks = tether => {
    const { g, w, ox, oy } = lab('gather', { tether });
    const i0 = w.idx(ox + 7, oy + 2); w.cells[i0] = T.CRYSTAL; w.explored[i0] = 1;
    let hit = false;
    for (let i = 0; i < 180; i++) { g.update(1 / 60, idle()); if (g.echo.target && g.echo.target.x === ox + 7) hit = true; }
    return hit;
  };
  { const p0 = picks(0), p1 = picks(1), d0 = shots({ tether: 0 }, 160, 3), d1 = shots({ tether: 1 }, 160, 3);
    check('S-70 Tether: an ore cell 6 cells out is picked only from level 1; a Glitch 160 px out is shot only from level 1',
      !p0 && p1 && d0 === 0 && d1 >= 2, JSON.stringify({ p0, p1, d0, d1 })); }

  // Saves: levels round-trip; a format-24 save loads 0 / 0 / 0; malformed values clamp or load 0 (B-037).
  {
    const g = new Game({ seed: 4242, mode: 'surge', audio }); Object.assign(g.echoLevels, { focus: 2, volley: 1, tether: 0 });
    const s = JSON.parse(JSON.stringify(g.toSave()));
    const back = new Game({ seed: 4242, mode: 'surge', audio, save: s }).echoLevels;
    // audit 179: the format before levels is found by the step that adds `echoLevels`, not SAVE_FORMAT - 1 (B-114)
    const levelStep = STEPS.findIndex(f => { try { return 'echoLevels' in f({}); } catch { return false; } });
    const old = { ...s, v: levelStep + 1 }; delete old.echoLevels;
    const up = upgradeSave(JSON.parse(JSON.stringify(old)));
    const fromOld = up && new Game({ seed: 4242, mode: 'surge', audio, save: up }).echoLevels;
    const bad = new Game({ seed: 4242, mode: 'surge', audio, save: { ...s, echoLevels: { focus: 9, volley: 'x', tether: -3 } } }).echoLevels;
    const junk = new Game({ seed: 4242, mode: 'surge', audio, save: { ...s, echoLevels: 'nope' } }).echoLevels;
    check('S-70 save: Echo levels round-trip; an old save loads 0; malformed clamps to 0…2 (B-037)',
      JSON.stringify(back) === '{"focus":2,"volley":1,"tether":0}' && JSON.stringify(fromOld) === '{"focus":0,"volley":0,"tether":0}' &&
      JSON.stringify(bad) === '{"focus":2,"volley":0,"tether":0}' && JSON.stringify(junk) === '{"focus":0,"volley":0,"tether":0}',
      JSON.stringify({ back, fromOld, bad, junk }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const open = async (pg, lv) => {
    await pg.goto(url); await pg.waitForTimeout(200);
    await newWorld(pg); await pg.waitForTimeout(200);
    await pg.evaluate(lv => { const g = window.__lumen.game; window.__lumen.dev.echo(); Object.assign(g.echoLevels, lv); g.bank.lumen = 40;
      g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; }, lv);
    await pg.keyboard.press('e'); await pg.waitForTimeout(100);
    await pg.click('#matrix .tabs button[data-tab="research"]'); await pg.waitForTimeout(100);
  };
  const rows = pg => pg.evaluate(() => ['focus', 'volley', 'tether'].map(k => { const r = document.querySelector(`#upgrade-list .upgrade[data-id="echo-${k}"]`);
    if (!r) return null;
    const b = r.getBoundingClientRect(), btn = r.querySelector('.buy');
    return { val: r.querySelector('.u-val').textContent.trim(), on: r.querySelectorAll('.pips i.on').length, buy: btn.textContent.trim(), can: !btn.disabled,
      w: Math.round(b.width), right: Math.round(b.right), btnH: Math.round(btn.getBoundingClientRect().height), sw: document.documentElement.scrollWidth }; }));
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('echo levels: ' + e.message));
  await pg.goto(url); await pg.evaluate(() => { try { localStorage.clear(); } catch {} });
  await open(pg, { focus: 2, volley: 1, tether: 0 });
  const r = await rows(pg);
  check('S-70 Research tab: Focus 2 reads MAX with 2 pips, Volley 1 reads 0.6 s → 0.45 s for ● 35, Tether 0 → 6 cells / 170 px for ● 20',
    !!r[0] && r[0].buy === 'MAX' && r[0].on === 2 && r[1].val === '0.6 s → 0.45 s' && /35/.test(r[1].buy) && r[1].can && r[2].val === '5 cells / 140 px → 6 cells / 170 px' && /20/.test(r[2].buy),
    JSON.stringify(r));
  await pg.click('#upgrade-list .upgrade[data-id="echo-volley"] .buy');
  const after = await pg.evaluate(() => ({ lv: window.__lumen.game.echoLevels.volley, lumen: window.__lumen.game.bank.lumen }));
  check('S-70 Research tab: buying Volley 2 spends ● 35', after.lv === 2 && after.lumen === 5, JSON.stringify(after));
  await pg.evaluate(() => { window.__lumen.game.echoLevels.volley = 1; }); await pg.click('#matrix .tabs button[data-tab="core"]'); await pg.click('#matrix .tabs button[data-tab="research"]');
  if (shot) await pg.screenshot({ path: shot });
  await pg.close();
  // Phone 320 × 568, Large text: the three rows fit the width (the tab scrolls), buttons ≥ 44 px.
  const ph = await browser.newPage({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true });
  ph.on('pageerror', e => errors.push('echo levels phone: ' + e.message));
  await ph.goto(url); await ph.evaluate(() => { localStorage.clear(); localStorage.setItem('lumencore.settings.v1', JSON.stringify({ largeText: true })); });
  await open(ph, {});
  const p = await rows(ph);
  check('S-70 phone 320 × 568 Large text: the three Echo rows fit the width, buttons ≥ 44 px', p.every(x => x && x.right <= 320 && x.sw <= 320 && x.btnH >= 44), JSON.stringify(p));
  await ph.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, shot: process.env.ECHO_LEVELS_SHOT });
