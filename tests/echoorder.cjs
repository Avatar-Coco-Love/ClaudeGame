// S-43 Echo orders checks (D-113): cycle by key intent and by the ◇ button, Guard kills a held Glitch while Gather ignores
// it, Guard pops a Spitter bolt, rock blocks a Guard shot, Drift labels it idle, save format 16 + the 15 -> 16 upgrade.
// smoke.cjs calls nodeChecks + browserChecks.
const { newWorld } = require('./pinworld.cjs');
const idle = () => ({ move: { x: 0, y: 0 }, aim: null, fire: false });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { T, CELL, ECHO_GUARD_DMG } = await import('../src/config.js');
  const { makeGlitch } = await import('../src/glitch.js');
  const { makeSwarm } = await import('../src/mote.js');
  const { orderLabel } = await import('../src/echo.js');
  const { buyResearch } = await import('../src/research.js');
  const { upgradeSave, SAVE_FORMAT, STEPS } = await import('../src/save.js');
  const audio = new Proxy({}, { get: () => () => {} });

  // A 9×5 hall in solid rock, 30 cells east of the Nexus (out of its ring and its Glitch repel), Surge, the Echo owned.
  const lab = (order, mode = 'surge') => {
    const g = new Game({ seed: 4242, mode, audio }), w = g.world, ox = w.cx + 30, oy = w.cy;
    for (let y = oy - 2; y <= oy + 8; y++) for (let x = ox - 2; x <= ox + 12; x++) w.cells[w.idx(x, y)] = T.ROCK;
    for (let y = 0; y <= 4; y++) for (let x = 0; x <= 8; x++) w.cells[w.idx(ox + x, oy + y)] = T.EMPTY;
    Object.assign(g.player, { x: (ox + 1.5) * CELL, y: (oy + 2.5) * CELL, vx: 0, vy: 0 });
    g.spawnTimer = 1e9; g.research.echo = true; g.echoOrder = order;
    for (let i = 0; i < 60; i++) g.update(1 / 60, idle()); // the Echo appears and settles
    return { g, w, ox, oy };
  };
  // A tier-1 Glitch held 100 px east of the core (put back every frame, so it neither closes in nor gives up).
  const held = (order, secs, wall = false) => {
    const L = lab(order), { g, w, ox, oy } = L, gx = g.player.x + 100, gy = g.player.y;
    if (wall) for (let y = 0; y <= 4; y++) w.cells[w.idx(ox + 3, oy + y)] = T.DENSE; // between the core + Echo and the Glitch
    if (wall) { g.echo.x = g.player.x - 20; g.echo.y = g.player.y; }
    const e = makeGlitch(gx, gy, 1, 0); e.aggro = true;
    g.enemies.push(e);
    const hp0 = e.hp, k0 = g.stats.glitches;
    let t = 0;
    for (; t < secs && g.enemies.includes(e); t += 1 / 60) {
      Object.assign(e, { x: gx, y: gy, vx: 0, vy: 0 });
      if (wall) { g.echo.x = Math.min(g.echo.x, (ox + 2.5) * CELL); }
      g.update(1 / 60, idle());
    }
    return { g, e, hp0, killed: g.stats.glitches - k0, t, alive: g.enemies.includes(e) };
  };

  // Cycling: the intent flips Gather -> Guard -> Gather and raises 'echo-order'; without the Research nothing changes.
  {
    const g = new Game({ seed: 4242, mode: 'surge', audio });
    g.update(1 / 60, { ...idle(), echoOrder: true });
    const before = g.echoOrder, ev0 = g.events.includes('echo-order');
    g.research.echo = true; g.events.length = 0;
    g.update(1 / 60, { ...idle(), echoOrder: true });
    const one = g.echoOrder, ev1 = g.events.includes('echo-order');
    g.update(1 / 60, { ...idle(), echoOrder: true });
    const two = g.echoOrder;
    g.update(1 / 60, { ...idle(), echoOrder: true });
    check('Echo orders: the order action cycles Mine → Defend → Auto → Mine once researched, and not before (S-43, S-69)',
      before === 'gather' && !ev0 && one === 'guard' && ev1 && two === 'auto' && g.echoOrder === 'gather', JSON.stringify({ before, ev0, one, ev1, two, three: g.echoOrder }));
    const nb = new Game({ seed: 4242, mode: 'surge', audio }); nb.bank.lumen = 99;
    const ok = buyResearch(nb, 'echo');
    check('Echo orders: a newly researched Echo starts in Auto (S-69)', ok && nb.echoOrder === 'auto' && orderLabel(nb) === 'Auto · Mine', `${ok} ${nb.echoOrder} ${orderLabel(nb)}`);
  }

  // Guard kills a held tier-1 Glitch in 3 hits; Gather leaves it whole.
  {
    const gd = held('guard', 4), ga = held('gather', 4);
    check(`Echo Guard: kills a held tier-1 Glitch (${gd.hp0.toFixed(1)} hp, ${ECHO_GUARD_DMG} a shot) in 3 shots, < 2.6 s; Gather doesn't touch it (S-43)`,
      gd.killed === 1 && !gd.alive && gd.g.echo.shots === 3 && gd.t < 2.6 && ga.alive && ga.e.hp === ga.hp0 && ga.g.echo.shots === 0,
      JSON.stringify({ guard: { killed: gd.killed, shots: gd.g.echo.shots, t: +gd.t.toFixed(2) }, gather: { hp: ga.e.hp, hp0: ga.hp0, shots: ga.g.echo.shots } }));
    const wl = held('guard', 3, true);
    check('Echo Guard: rock between the Echo and the Glitch blocks the shot (clear line, S-43)', wl.alive && wl.e.hp === wl.hp0 && wl.g.echo.shots === 0,
      JSON.stringify({ hp: wl.e.hp, shots: wl.g.echo.shots, echo: [wl.g.echo.x | 0, wl.g.echo.y | 0] }));
  }

  // Guard pops a Spitter bolt (still, 80 px from the core) before it can land; the core takes no damage.
  {
    const { g } = lab('guard');
    const hp = g.player.integrity;
    g.bolts.push({ bolt: true, x: g.player.x + 80, y: g.player.y + 20, vx: 0, vy: 0, r: 5, hp: 0.5, flash: 0, life: 10 });
    for (let i = 0; i < 60 && g.bolts.length; i++) g.update(1 / 60, idle());
    check('Echo Guard: pops a Spitter bolt within 140 px of the core, no damage taken (S-43)',
      g.bolts.length === 0 && g.echo.shots === 1 && g.player.integrity === hp, JSON.stringify({ bolts: g.bolts.length, shots: g.echo.shots, hp: g.player.integrity }));
  }

  // Drift: the chip says idle; Surge: plain Guard; Gather either way.
  {
    const d = lab('guard', 'drift').g, s = lab('guard').g, ga = lab('gather', 'drift').g;
    check('Echo orders: the chip reads "Defend" in Drift and Surge, "Mine" (S-43, S-69: no more "idle")',
      orderLabel(d) === 'Defend' && orderLabel(s) === 'Defend' && orderLabel(ga) === 'Mine', [orderLabel(d), orderLabel(s), orderLabel(ga)].join(' / '));
  }

  // S-69 Auto: a seen Glitch at 100 px -> Auto · Defend within 0.25 s; back to Mine 2 s after it dies.
  {
    const { g } = lab('auto');
    const lbl0 = orderLabel(g), e = makeGlitch(g.player.x + 100, g.player.y, 1, 0); e.aggro = true; g.enemies.push(e);
    let tD = null, t = 0;
    for (; t < 0.5 && tD === null; t += 1 / 60) { Object.assign(e, { x: g.player.x + 100, y: g.player.y, vx: 0, vy: 0 }); g.update(1 / 60, idle()); if (g.echo.auto === 'defend') tD = t; }
    const lblD = orderLabel(g);
    g.enemies.length = 0;
    let tM = null;
    for (t = 0; t < 3 && tM === null; t += 1 / 60) { g.update(1 / 60, idle()); if (g.echo.auto === 'mine') tM = t; }
    check('Echo Auto: a Glitch at 100 px turns it to Auto · Defend within 0.25 s; back to Auto · Mine ~2 s after it is gone (S-69)',
      lbl0 === 'Auto · Mine' && tD !== null && tD <= 0.25 + 1e-6 && lblD === 'Auto · Defend' && tM !== null && tM >= 1.7 && tM <= 2.3 && orderLabel(g) === 'Auto · Mine',
      JSON.stringify({ lbl0, tD, lblD, tM }));
  }
  // Hysteresis: a Glitch swinging across the range edge (110…170 px, period 2 s) for 10 s gives ≤ 2 switches.
  {
    const { g } = lab('auto');
    const e = makeGlitch(g.player.x + 140, g.player.y, 1, 0); e.aggro = true; e.hp = 1e9; g.enemies.push(e);
    g.echo.switches = 0;
    for (let t = 0; t < 10; t += 1 / 60) { Object.assign(e, { x: g.player.x + 140 + 30 * Math.sin(Math.PI * t), y: g.player.y, vx: 0, vy: 0, hp: 1e9, stall: 0 }); g.update(1 / 60, idle()); }
    check('Echo Auto: a foe swinging across the range edge for 10 s gives ≤ 2 switches: one, into Defend (hysteresis, S-69)', g.echo.switches === 1, `switches ${g.echo.switches}`);
  }
  // Defend shoots a closing bolt (100 px) before a nearer Glitch (60 px).
  {
    const { g } = lab('guard');
    const e = makeGlitch(g.player.x + 60, g.player.y, 1, 0); e.aggro = true; g.enemies.push(e);
    const b = { bolt: true, x: g.player.x + 100, y: g.player.y + 30, vx: -20, vy: -6, r: 5, hp: 0.5, flash: 0, life: 10 }; g.bolts.push(b);
    const hp0 = e.hp;
    for (let i = 0; i < 40 && !g.echo.shots; i++) { Object.assign(e, { x: g.player.x + 60, y: g.player.y, vx: 0, vy: 0 }); g.update(1 / 60, idle()); }
    check('Echo Defend: a closing bolt is shot before a nearer Glitch (S-69)', g.echo.shots === 1 && b.hp <= 0 && e.hp === hp0, JSON.stringify({ shots: g.echo.shots, bolt: b.hp, glitch: e.hp }));
  }
  // Mine: a ▲ 3 cells away beats a ◆ 1 cell away (worth / (cells + 2)).
  {
    const { g, w, ox, oy } = lab('gather');
    const ex = Math.floor(g.echo.x / CELL), ey = Math.floor(g.echo.y / CELL);
    g.echo.x = (ex + 0.5) * CELL; g.echo.y = (ey + 0.5) * CELL;
    const dy = ey - oy >= 3 ? -1 : 1, sh = [ex + 1, ey], pr = [ex, ey + 3 * dy]; // ◆ 1 cell east, ▲ 3 cells along the hall's height
    w.cells[w.idx(...sh)] = T.CRYSTAL; w.cells[w.idx(...pr)] = T.PRISM;
    for (const [x, y] of [sh, pr]) w.explored[w.idx(x, y)] = 1;
    g.echo.target = null; g.echo.pickT = 0;
    for (let i = 0; i < 3 && !g.echo.target; i++) { g.echo.x = (ex + 0.5) * CELL; g.echo.y = (ey + 0.5) * CELL; g.update(1 / 60, idle()); }
    const tg = g.echo.target;
    check('Echo Mine: picks a ▲ 3 cells away over a ◆ 1 cell away (ORE_WORTH / (cells + 2), S-69)', !!tg && tg.x === pr[0] && tg.y === pr[1],
      JSON.stringify({ tg, echo: [ex, ey], sh, pr }));
  }
  // Drift: Defend hits a Mote.
  {
    const { g } = lab('guard', 'drift');
    if (!g.swarm) g.swarm = makeSwarm();
    const m = { mote: true, boss: false, grp: 0, x: g.player.x + 70, y: g.player.y, vx: 0, vy: 0, r: 4, hp: 5, maxHp: 5, trail: [] };
    g.swarm.motes.push(m);
    for (let i = 0; i < 30 && !g.echo.shots; i++) { Object.assign(m, { x: g.player.x + 70, y: g.player.y }); g.update(1 / 60, idle()); }
    check('Echo Defend: shoots a Mote in Drift (S-69)', g.echo.shots === 1 && m.hp < 5, JSON.stringify({ shots: g.echo.shots, hp: m.hp }));
  }

  // Save: the order round-trips; an old save (the format before this one, no field) loads as Gather; a bad value loads Gather.
  {
    const { g } = lab('guard');
    const s = JSON.parse(JSON.stringify(g.toSave()));
    const back = new Game({ seed: 4242, mode: 'surge', audio, save: s }).echoOrder;
    // audit 179: the format before orders is found by the step that adds `echoOrder`, not SAVE_FORMAT - 1 (B-114)
    const orderStep = STEPS.findIndex(f => { try { return 'echoOrder' in f({}); } catch { return false; } });
    const old = { ...JSON.parse(JSON.stringify(new Game({ seed: 4242, mode: 'surge', audio, size: 160 }).toSave())), v: orderStep + 1 }; // a format-17 save is 160 (S-46b2)
    delete old.echoOrder;
    const up = upgradeSave(JSON.parse(JSON.stringify(old)));
    const fromOld = up && new Game({ seed: 4242, mode: 'surge', audio, save: up }).echoOrder;
    const bad = new Game({ seed: 4242, mode: 'surge', audio, save: { ...s, echoOrder: 'attack' } }).echoOrder;
    const auto = new Game({ seed: 4242, mode: 'surge', audio, save: { ...s, echoOrder: 'auto' } }).echoOrder;
    check('Echo orders: an Auto order round-trips through a save (S-69)', auto === 'auto', auto);
    check('Echo orders: saved as echoOrder; the previous format loads as Gather; a bad value loads Gather (S-43, D-005, B-037)',
      s.echoOrder === 'guard' && back === 'guard' && !!up && up.v === SAVE_FORMAT && fromOld === 'gather' && bad === 'gather',
      JSON.stringify({ saved: s.echoOrder, back, upV: up && up.v, fromOld, bad }));
  }
  { // S-71a (D-187): the --orders measure runs every row and gives no verdict on too few seeds (the gate waits on Q-040)
    const { ordersGate } = await import('../tools/echobot.mjs');
    const r = ordersGate(1, 0.25), keys = Object.keys(r.rows);
    check('S-71a echobot --orders: 10 rows (Surge none / Mine / Defend / Auto, Drift none / Auto × L0, L2), Auto switches counted, no verdict on 1 seed',
      keys.length === 10 && keys.every(k => Number.isFinite(r.rows[k].gain) && Number.isFinite(r.rows[k].dmg)) &&
      r.rows['surge auto L0'].sw > 0 && /no verdict/.test(r.lines.at(-1)), r.lines.slice(-3).join(' | '));
  }
  { // S-71b gate (D-187, D-189): tools/echobot.mjs --orders, 48 seeds × 5 min, every row
    const out = await require('./gates.cjs').run('echobot.mjs', ['--orders']);
    const line = out.split('\n').find(l => l.startsWith('gate')) || '';
    check('S-71b: the echobot.mjs --orders gate passes on 48 seeds (Auto ≥ 0.9 × Mine gain, ≤ 1.1 × Defend damage, Drift / Surge Auto gain 0.8–1.25, added ≤ 1.5, L2 share 15–35 %)',
      /PASS/.test(line), out.trim().split('\n').filter(l => /FAIL|gate/.test(l)).join(' | '));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('echo orders: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(200);
  const ui = () => pg.evaluate(() => ({ order: window.__lumen.game.echoOrder, chip: document.getElementById('echo-chip').classList.contains('hidden') ? null : document.getElementById('echo-name').textContent.trim(),
    btn: !document.getElementById('echo-btn').classList.contains('hidden'), toast: document.getElementById('toast').textContent }));
  const before = await ui();
  await pg.keyboard.press('r'); await pg.waitForTimeout(150);
  const unowned = await ui();
  await pg.evaluate(() => { window.__lumen.dev.echo(); window.__lumen.dev.teleport(14); });
  await pg.waitForTimeout(300);
  await pg.keyboard.press('r'); await pg.waitForTimeout(200);
  const key = await ui();
  await pg.click('#echo-btn'); await pg.waitForTimeout(200);
  const btn = await ui();
  check('Echo orders: chip and ◇ hidden (R does nothing) until researched; it starts in Auto; R → Mine, ◇ → Defend, with chip and toast (S-43, S-69)',
    before.chip === null && !before.btn && unowned.order === 'gather' && key.order === 'gather' && key.chip === 'Mine' && key.btn && /Echo: Mine/.test(key.toast)
      && btn.order === 'guard' && btn.chip === 'Defend', JSON.stringify({ before, unowned, key, btn }));
  // S-69: Surge, Auto, a Glitch held 90 px off -> the chip reads Auto · Defend and the ring shows (the screenshot).
  await pg.evaluate(async () => {
    const { makeGlitch } = await import('./src/glitch.js'), g = window.__lumen.game;
    g.setMode('surge'); g.enemies = []; g.spawnTimer = 1e9; g.echoOrder = 'auto';
    const w = g.world, C = 32, px = Math.floor(g.player.x / C), py = Math.floor(g.player.y / C); // an open hall, so the Echo sees it
    for (let y = py - 2; y <= py + 2; y++) for (let x = px - 2; x <= px + 5; x++) if (w.cells[w.idx(x, y)]) w.destroy(x, y);
    const e = makeGlitch(g.player.x + 90, g.player.y, 1, 0); e.aggro = true; e.hp = 1e9; g.enemies.push(e);
    window.__s69 = setInterval(() => Object.assign(e, { x: g.player.x + 90, y: g.player.y, vx: 0, vy: 0, hp: 1e9, stall: 0 }), 10);
  });
  await pg.waitForTimeout(600);
  const au = { ...(await ui()), dbg: await pg.evaluate(() => { const g = window.__lumen.game; return { auto: g.echo && g.echo.auto, nexus: g.inNexus(), paused: g.echo && g.echo.paused, n: g.enemies.length, p: [g.player.x | 0, g.player.y | 0], e: g.echo && [g.echo.x | 0, g.echo.y | 0] }; }) };
  check('Echo Auto in the page: a held Glitch in Surge turns the chip to "Auto · Defend" (S-69)', au.order === 'auto' && au.chip === 'Auto · Defend', JSON.stringify(au));
  if (shot) await pg.screenshot({ path: shot });
  await pg.evaluate(() => clearInterval(window.__s69));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, shot: process.env.ECHO_ORDER_SHOT });
