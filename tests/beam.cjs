// S-13 beam-mode checks (Focus + Wide, D-036), split out of smoke.cjs. smoke.cjs calls both functions.
const audio = new Proxy({}, { get: () => () => {} });
const fire = (extra = {}) => ({ move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fire: true, ...extra });
const idle = (extra = {}) => ({ move: { x: 0, y: 0 }, aim: null, fire: false, ...extra });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { T, CELL } = await import('../src/config.js');
  const { buyResearch } = await import('../src/research.js');
  const { castBeam } = await import('../src/beam.js');

  // A lab near the Nexus (Hearth, ×1 hp): an open 9×7 box, the core at its centre cell facing east, and a flat column of
  // DENSE rock (2.6 hp, so a second of fire cracks it without breaking it) 3 cells east. Returns the damage per wall row.
  const lab = (mode, secs = 1) => {
    const g = new Game({ seed: 77, mode: 'drift', audio }), w = g.world, gx = w.cx + 2, gy = w.cy + 6;
    for (let y = gy - 3; y <= gy + 3; y++) for (let x = gx - 4; x <= gx + 4; x++) w.cells[w.idx(x, y)] = x === gx + 3 ? T.DENSE : T.EMPTY;
    Object.assign(g.player, { x: (gx + 0.5) * CELL, y: (gy + 0.5) * CELL, vx: 0, vy: 0, angle: 0 });
    if (mode === 'wide') { g.research.wide = true; g.beamMode = 'wide'; }
    for (let i = 0; i < 60 * secs; i++) g.update(1 / 60, fire());
    return [-2, -1, 0, 1, 2].map(d => +w.damage[w.idx(gx + 3, gy + d)].toFixed(3));
  };
  const f = lab('focus'), wd = lab('wide'), ratio = wd.map(v => +(v / f[2]).toFixed(3));
  check('Wide: a second at a flat wall cracks 3 cells, each by 0.45× Focus\'s one (S-13)',
    f.filter(v => v > 0).length === 1 && f[2] > 0.9 && wd.filter(v => v > 0).length === 3 && [1, 2, 3].every(i => Math.abs(ratio[i] - 0.45) < 0.01) && !wd[0] && !wd[4],
    JSON.stringify({ focus: f, wide: wd, ratio }));

  // Two rays on one cell count once: one lone DENSE cell at 45°, placed by search so that two Wide rays end on it.
  const g2 = new Game({ seed: 77, mode: 'drift', audio }), w2 = g2.world, cx = w2.cx + 2, cy = w2.cy + 6, ci = w2.idx(cx + 2, cy + 2);
  for (let y = cy - 4; y <= cy + 7; y++) for (let x = cx - 4; x <= cx + 7; x++) w2.cells[w2.idx(x, y)] = T.EMPTY;
  w2.cells[ci] = T.DENSE; g2.research.wide = true; g2.beamMode = 'wide';
  let shared = 0;
  for (let ox = -16; ox <= 16 && !shared; ox += 2) for (let oy = -16; oy <= 16 && !shared; oy += 2) {
    Object.assign(g2.player, { x: (cx + 0.5) * CELL + ox, y: (cy + 0.5) * CELL + oy, angle: Math.PI / 4 });
    g2.beam.on = true; castBeam(g2, 0); w2.damage[ci] = 0;
    if (g2.beam.rays.filter(r => r.target && r.target.x === cx + 2 && r.target.y === cy + 2).length >= 2) shared = 2;
  }
  castBeam(g2, 1);
  const once = +w2.damage[ci].toFixed(3), wideDps = g2.stat('beam') * 0.45;
  check('Wide: two rays on one cell damage it once per frame (S-13)', shared === 2 && Math.abs(once - wideDps) < 1e-6, JSON.stringify({ shared, once, wideDps }));

  // A Glitch in front takes 0.45 × the usual 1.6× in Wide.
  const g3 = new Game({ seed: 77, mode: 'surge', audio }); g3.research.wide = true; g3.beamMode = 'wide';
  Object.assign(g3.player, { x: g3.nexus.x, y: g3.nexus.y, angle: 0 });
  const e = { x: g3.player.x + 40, y: g3.player.y, r: 11, hp: 10, maxHp: 10 };
  g3.enemies = [e]; g3.world.cells.fill(T.EMPTY); g3.beam.on = true; castBeam(g3, 0.1);
  check('Wide: a Glitch on a ray takes 0.45 × 1.6 × dps (S-13)', Math.abs((10 - e.hp) - g3.stat('beam') * 0.1 * 1.6 * 0.45) < 1e-9 && g3.beam.enemy === e, `${10 - e.hp}`);

  // Unlock + Q cycle: locked until 25●; Q does nothing with one mode; then Focus -> Wide -> Focus.
  const g = new Game({ seed: 77, mode: 'drift', audio });
  g.update(1 / 60, idle({ beamMode: true }));
  const before = { mode: g.beamMode, ev: g.events.includes('beam-mode') };
  g.bank.lumen = 24; const poor = buyResearch(g, 'wide');
  g.bank.lumen = 25; const bought = buyResearch(g, 'wide');
  const seq = [];
  for (let i = 0; i < 3; i++) { g.update(1 / 60, idle({ beamMode: true })); seq.push(g.beamMode); }
  check('Wide locked until 25●; Q cycles only unlocked modes: focus → wide → focus (S-13)', before.mode === 'focus' && !before.ev && !poor && bought
    && g.bank.lumen === 0 && seq.join() === 'wide,focus,wide' && g.events.includes('beam-mode'), JSON.stringify({ before, poor, bought, seq }));

  // Save: Wide survives reload; a format-6 save loads as Focus; a saved mode that isn't unlocked loads as Focus.
  const h = new Game({ seed: 77, mode: 'drift', audio, save: upgradeSave(JSON.parse(JSON.stringify(g.toSave()))) });
  const old = new Game({ seed: 77, mode: 'drift', audio }).toSave(); old.v = 6; delete old.beamMode;
  const up = upgradeSave(old), o = new Game({ seed: 77, mode: 'drift', audio, save: up });
  const bad = new Game({ seed: 77, mode: 'drift', audio }).toSave(); bad.beamMode = 'wide';
  const b = new Game({ seed: 77, mode: 'drift', audio, save: upgradeSave(bad) });
  check('Wide survives save + load; a format-6 save and an un-unlocked saved mode load as Focus (S-13)',
    h.beamMode === 'wide' && SAVE_FORMAT === 7 && up.v === 7 && up.beamMode === 'focus' && o.beamMode === 'focus' && b.beamMode === 'focus',
    JSON.stringify({ reload: h.beamMode, v: up.v, old: o.beamMode, bad: b.beamMode }));
}

async function browserChecks(browser, url, check, errors) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('beam: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; });
  await pg.keyboard.press('q'); await pg.waitForTimeout(100);
  const pre = await pg.evaluate(() => ({ mode: window.__lumen.game.beamMode, btn: !document.getElementById('mode-btn').classList.contains('hidden') }));
  await pg.evaluate(() => { window.__lumen.game.bank.lumen = 25; });
  await pg.keyboard.press('e'); await pg.waitForTimeout(100);
  await pg.click('#matrix .tabs button[data-tab="research"]');
  await pg.click('#upgrade-list [data-id="wide"] .buy:not([disabled])');
  await pg.keyboard.press('q'); await pg.waitForTimeout(100); // under the open Matrix: dropped
  const under = await pg.evaluate(() => window.__lumen.game.beamMode);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  await pg.keyboard.press('q'); await pg.waitForTimeout(150);
  const a = await pg.evaluate(() => ({ mode: window.__lumen.game.beamMode, btn: !document.getElementById('mode-btn').classList.contains('hidden'),
    toast: document.getElementById('toast').textContent }));
  await pg.click('#mode-btn'); await pg.waitForTimeout(150);
  const b = await pg.evaluate(() => window.__lumen.game.beamMode);
  check('⟂ hidden and Q ignored before Wide; after: Q (not under the Matrix) → Wide with a toast, ⟂ → Focus (S-13)',
    pre.mode === 'focus' && !pre.btn && under === 'focus' && a.mode === 'wide' && a.btn && a.toast === 'Wide' && b === 'focus', JSON.stringify({ pre, under, a, b }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
