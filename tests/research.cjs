// S-11 Research v1 (Scanner) checks, split out of smoke.cjs to keep it under ~600 lines. smoke.cjs calls both functions.
const audio = new Proxy({}, { get: () => () => {} });
const idle = (scan = false) => ({ move: { x: 0, y: 0 }, aim: null, fire: false, scan });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { T, CELL, SCAN_RADIUS, SCAN_COOLDOWN_S, SCAN_SHOW_S } = await import('../src/config.js');
  const { buyResearch, markAlpha } = await import('../src/research.js');
  const g = new Game({ seed: 77, mode: 'drift', audio }), w = g.world, p = g.player;
  // Park the core in an open spot ~30 cells out that has ore within 12 cells.
  for (let i = 0; i < w.cells.length; i++) {
    const x = i % w.w, y = Math.floor(i / w.w);
    if (w.cells[i] !== T.EMPTY || Math.abs(Math.hypot(x - w.cx, y - w.cy) - 30) > 1) continue;
    p.x = (x + 0.5) * CELL; p.y = (y + 0.5) * CELL; break;
  }
  // Node-side count, written apart from research.js: every ore cell whose centre is within 12 cells of the core.
  let expect = 0;
  for (let i = 0; i < w.cells.length; i++) {
    if (![T.CRYSTAL, T.PRISM, T.LUMEN].includes(w.cells[i])) continue;
    if (Math.hypot(((i % w.w) + 0.5) * CELL - p.x, (Math.floor(i / w.w) + 0.5) * CELL - p.y) <= SCAN_RADIUS * CELL) expect++;
  }
  // S-37: plus each charged Anomaly site (an entity, not a cell) within the same 12 cells.
  for (const q of g.anomaly.sites) if (!q.void && Math.hypot((q.x + 0.5) * CELL - p.x, (q.y + 0.5) * CELL - p.y) <= SCAN_RADIUS * CELL) expect++;
  g.update(1 / 60, idle(true));
  const locked = { marks: g.scan.marks.length, cd: g.scan.cooldown };
  g.bank.lumen = 9; const poor = buyResearch(g, 'scanner');
  g.bank.lumen = 10; const bought = buyResearch(g, 'scanner'), again = buyResearch(g, 'scanner');
  check('Scanner: F before unlock does nothing; 10● buys it once, leaving 0● (S-11)', locked.marks === 0 && locked.cd === 0 && !poor && bought && !again
    && g.bank.lumen === 0 && g.research.scanner === true, JSON.stringify({ locked, poor, bought, again, lumen: g.bank.lumen }));
  const ex0 = g.world.explored.reduce((a, b) => a + b, 0);
  g.update(1 / 60, idle(true));
  const first = { marks: g.scan.marks.length, cd: g.scan.cooldown, explored: g.world.explored.reduce((a, b) => a + b, 0) - ex0 };
  for (let i = 0; i < 60; i++) g.update(1 / 60, idle(i === 30));
  const second = { age: +g.scan.age.toFixed(2), cd: +g.scan.cooldown.toFixed(2) };
  check('ping marks exactly the node-side ore (+ charged Anomaly, S-37) count within 12 cells, starts a 20 s cooldown, explores nothing (S-11)',
    expect > 0 && first.marks === expect && first.cd === SCAN_COOLDOWN_S && first.explored === 0, JSON.stringify({ expect, ...first }));
  check('a second ping inside the cooldown does nothing (S-11)', second.age > 0.9 && Math.abs(second.cd - (SCAN_COOLDOWN_S - 1)) < 0.05, JSON.stringify(second));
  for (let i = 0; i < 60 * (SCAN_SHOW_S + 1); i++) g.update(1 / 60, idle());
  const faded = g.scan.marks.length;
  for (let i = 0; i < 60 * SCAN_COOLDOWN_S; i++) g.update(1 / 60, idle());
  g.update(1 / 60, idle(true));
  check('marks fade within SCAN_SHOW_S + ring time; the ping works again after the cooldown (S-11)', faded === 0 && g.scan.marks.length === expect,
    `faded ${faded}, re-ping ${g.scan.marks.length}`);
  const h = new Game({ seed: 77, mode: 'drift', audio, save: upgradeSave(JSON.parse(JSON.stringify(g.toSave()))) });
  check('the Scanner survives save + load; the live ping is never saved (S-11)', h.research.scanner === true && !('scan' in g.toSave()) && h.scan.marks.length === 0,
    JSON.stringify(h.research));
  const old = new Game({ seed: 77, mode: 'drift', audio }).toSave();
  old.v = 5; delete old.research;
  const up = upgradeSave(old), o = new Game({ seed: 77, mode: 'drift', audio, save: up });
  check('a format-5 save loads with research: {} (S-11)', up.v === SAVE_FORMAT && JSON.stringify(up.research) === '{}' && !o.research.scanner,
    JSON.stringify({ v: up.v, research: up.research }));
  const rm = new Game({ seed: 77, mode: 'surge', audio, settings: { reducedMotion: true } });
  Object.assign(rm.player, { x: p.x, y: p.y }); rm.research.scanner = true; rm.spawnTimer = 99;
  rm.update(1 / 60, idle(true));
  check('reduced motion: no ring, every glyph at once; same ping in Surge (S-11)', !rm.scan.ring && rm.scan.marks.length === expect && rm.scan.marks.every(m => m.at === 0),
    `${rm.scan.marks.length} marks, ring ${rm.scan.ring}`);

  // S-12 (D-035): the ping also marks an unopened vault cache inside 12 cells, once, with one soft tone when the ring gets there.
  let tones = 0;
  const vg = new Game({ seed: 77, mode: 'drift', audio: new Proxy({}, { get: (_, k) => k === 'scanCache' ? () => tones++ : () => {} }) });
  vg.research.scanner = true; vg.spawnTimer = 99;
  const v = vg.world.vaults[0], vw = vg.world, toN = Math.atan2(vw.cy - v.y, vw.cx - v.x);
  const pingAt = cells => {
    Object.assign(vg.player, { x: (v.x + 0.5 + Math.cos(toN) * cells) * CELL, y: (v.y + 0.5 + Math.sin(toN) * cells) * CELL, vx: 0, vy: 0 });
    vg.scan.cooldown = 0; vg.update(1 / 60, idle(true));
    return vg.scan.marks.filter(m => m.type === T.CACHE && m.x === v.x && m.y === v.y);
  };
  const near = pingAt(10);
  for (let i = 0; i < 60; i++) vg.update(1 / 60, idle());
  const nearTones = tones, shown = near.length === 1 && markAlpha(vg, near[0]) > 0;
  const far = pingAt(14).length;
  vg.world.cells[v.y * vw.w + v.x] = T.EMPTY; vg.onCellBroken(v.x, v.y, T.CACHE);
  const broken = pingAt(10).length;
  check('ping 10 cells from a vault marks its cache once (one soft tone); 14 cells away or broken, no mark (S-12)',
    near.length === 1 && shown && nearTones === 1 && far === 0 && broken === 0, JSON.stringify({ near: near.length, shown, nearTones, far, broken }));
}

async function browserChecks(browser, url, check, errors, plantSaveAndReload) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('research: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; });
  await pg.keyboard.press('f'); await pg.waitForTimeout(100);
  const pre = await pg.evaluate(() => ({ marks: window.__lumen.game.scan.marks.length, btn: !document.getElementById('scan-btn').classList.contains('hidden') }));
  await pg.keyboard.press('e'); await pg.waitForTimeout(100);
  await pg.click('#matrix .tabs button[data-tab="research"]');
  const tab = await pg.evaluate(() => ({ title: document.getElementById('matrix-title').textContent, hint: document.querySelector('.research-hint')?.textContent || '',
    disabled: document.querySelector('#upgrade-list .buy').disabled }));
  check('Research tab at 0●: Lumen hint, Scanner locked, F does nothing (S-11)', tab.title === 'Research' && /past 55 cells/.test(tab.hint) && tab.disabled
    && pre.marks === 0 && !pre.btn, JSON.stringify({ ...tab, ...pre }));
  await pg.evaluate(() => { window.__lumen.game.bank.lumen = 10; });
  await pg.click('#matrix .tabs button[data-tab="research"]');
  await pg.click('#upgrade-list .buy:not([disabled])');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  await pg.keyboard.press('f'); await pg.waitForTimeout(150);
  const a = await pg.evaluate(() => { const g = window.__lumen.game, b = document.getElementById('scan-btn');
    return { lumen: g.bank.lumen, marks: g.scan.marks.length, cd: g.scan.cooldown, btn: !b.classList.contains('hidden'), cooling: b.classList.contains('cooling') }; });
  await pg.keyboard.press('f'); await pg.waitForTimeout(150);
  const b = await pg.evaluate(() => ({ cd: window.__lumen.game.scan.cooldown, age: window.__lumen.game.scan.age }));
  check('buying Scanner leaves 0●; F pings, the ◎ button dims; F again inside the cooldown does nothing (S-11)',
    a.lumen === 0 && a.marks > 0 && a.cd > 19 && a.btn && a.cooling && b.cd < a.cd && b.age > 0.2, JSON.stringify({ a, b }));
  await plantSaveAndReload(pg, s => s);
  await pg.click('#continue'); await pg.waitForTimeout(200);
  const re = await pg.evaluate(() => ({ scanner: window.__lumen.game.research.scanner, lumen: window.__lumen.game.bank.lumen, btn: !document.getElementById('scan-btn').classList.contains('hidden') }));
  check('Scanner unlock survives reload; ◎ button shown (S-11)', re.scanner === true && re.lumen === 0 && re.btn, JSON.stringify(re));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
