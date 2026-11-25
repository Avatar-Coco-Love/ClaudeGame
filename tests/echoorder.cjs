// S-43 Echo orders checks (D-113): cycle by key intent and by the ◇ button, Guard kills a held Glitch while Gather ignores
// it, Guard pops a Spitter bolt, rock blocks a Guard shot, Drift labels it idle, save format 16 + the 15 -> 16 upgrade.
// smoke.cjs calls nodeChecks + browserChecks.
const idle = () => ({ move: { x: 0, y: 0 }, aim: null, fire: false });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { T, CELL, ECHO_GUARD_DMG } = await import('../src/config.js');
  const { makeGlitch } = await import('../src/glitch.js');
  const { orderLabel } = await import('../src/echo.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
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
    check('Echo orders: the order action cycles Gather → Guard → Gather once researched, and not before (S-43)',
      before === 'gather' && !ev0 && one === 'guard' && ev1 && g.echoOrder === 'gather', JSON.stringify({ before, ev0, one, ev1, two: g.echoOrder }));
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
    check('Echo orders: the chip reads "Guard (idle)" in Drift, "Guard" in Surge, "Gather" (S-43)',
      orderLabel(d) === 'Guard (idle)' && orderLabel(s) === 'Guard' && orderLabel(ga) === 'Gather', [orderLabel(d), orderLabel(s), orderLabel(ga)].join(' / '));
  }

  // Save: the order round-trips; an old save (the format before this one, no field) loads as Gather; a bad value loads Gather.
  {
    const { g } = lab('guard');
    const s = JSON.parse(JSON.stringify(g.toSave()));
    const back = new Game({ seed: 4242, mode: 'surge', audio, save: s }).echoOrder;
    const old = { ...JSON.parse(JSON.stringify(new Game({ seed: 4242, mode: 'surge', audio, size: 160 }).toSave())), v: SAVE_FORMAT - 1 }; // a format-17 save is 160 (S-46b2)
    delete old.echoOrder;
    const up = upgradeSave(JSON.parse(JSON.stringify(old)));
    const fromOld = up && new Game({ seed: 4242, mode: 'surge', audio, save: up }).echoOrder;
    const bad = new Game({ seed: 4242, mode: 'surge', audio, save: { ...s, echoOrder: 'attack' } }).echoOrder;
    check('Echo orders: saved as echoOrder; the previous format loads as Gather; a bad value loads Gather (S-43, D-005, B-037)',
      s.echoOrder === 'guard' && back === 'guard' && !!up && up.v === SAVE_FORMAT && fromOld === 'gather' && bad === 'gather',
      JSON.stringify({ saved: s.echoOrder, back, upV: up && up.v, fromOld, bad }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('echo orders: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
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
  check('Echo orders: chip and ◇ hidden (R does nothing) until researched; then R → Guard, ◇ → Gather, with chip and toast (S-43)',
    before.chip === null && !before.btn && unowned.order === 'gather' && key.order === 'guard' && key.chip === 'Guard (idle)' && key.btn && /Echo: Guard/.test(key.toast)
      && btn.order === 'gather' && btn.chip === 'Gather', JSON.stringify({ before, unowned, key, btn }));
  if (shot) await pg.screenshot({ path: shot });
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
