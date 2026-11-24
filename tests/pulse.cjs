// S-14 Pulse beam checks (D-042): charge -> piercing burst, recovery, Glitch stop, unlock + cycle, save, mouse + touch.
// smoke.cjs calls both functions.
const fire = (extra = {}) => ({ move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fire: true, ...extra });
const idle = (extra = {}) => ({ move: { x: 0, y: 0 }, aim: null, fire: false, ...extra });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave } = await import('../src/save.js');
  const { T, CELL } = await import('../src/config.js');
  const { buyResearch } = await import('../src/research.js');
  const { unlockedModes } = await import('../src/beam.js');
  const calls = [];
  const audio = new Proxy({}, { get: (_, k) => (...a) => { if (k === 'pulse' || k === 'pulseFizzle') calls.push(k); } });

  // A Hearth lab (×1 hp): rows gy-2..gy+2 cleared from gx-4, a ROCK line on row gy from gx+2 to gx+40; the core at (gx, gy) facing east.
  const lab = (mode, beamLvl = 0) => {
    const g = new Game({ seed: 77, mode: 'drift', audio }), w = g.world, gx = w.cx + 2, gy = w.cy + 6;
    for (let y = gy - 2; y <= gy + 2; y++) for (let x = gx - 4; x <= gx + 42; x++) w.cells[w.idx(x, y)] = y === gy && x >= gx + 2 && x <= gx + 40 ? T.ROCK : T.EMPTY;
    Object.assign(g.player, { x: (gx + 0.5) * CELL, y: (gy + 0.5) * CELL, vx: 0, vy: 0, angle: 0 });
    g.upgrades.beam = beamLvl;
    if (mode !== 'focus') { g.research[mode] = true; g.beamMode = mode; }
    const line = () => { let n = 0, part = 0; for (let x = gx + 2; x <= gx + 40; x++) { const i = w.idx(x, gy); if (w.cells[i] === T.EMPTY) n++; else part += w.damage[i] / 0.55; } return { broken: n, cells: n + part }; };
    return { g, w, gx, gy, line };
  };
  const firstBurst = lvl => { const L = lab('pulse', lvl); let f = 0; while (L.g.beam.recover === 0 && f++ < 200) L.g.update(1 / 60, fire()); return { ...L.line(), frames: f }; };
  const b0 = firstBurst(0), b2 = firstBurst(2);
  check('Pulse: a full charge (auto-fires at 1.2 s) breaks 2 Hearth rock cells at Beam 0 and exactly 3 (the pierce cap) at Beam 2 (S-14)',
    b0.broken === 2 && Math.abs(b0.cells - (2 + 0.1 / 0.55)) < 0.01 && b2.broken === 3 && b0.frames >= 71 && b0.frames <= 73, JSON.stringify({ b0, b2 }));

  // A 0.1 s tap fizzles: no damage, a soft tick, then 0.3 s before charging starts again.
  {
    const L = lab('pulse'); calls.length = 0;
    for (let i = 0; i < 6; i++) L.g.update(1 / 60, fire());
    L.g.update(1 / 60, idle());
    const after = { ...L.line(), recover: +L.g.beam.recover.toFixed(3), calls: calls.join() };
    const ch = [];
    for (let i = 0; i < 24; i++) { L.g.update(1 / 60, fire()); ch.push(L.g.beam.charge > 0 ? 1 : 0); }
    check('Pulse: a 0.1 s tap does nothing but tick; held fire then waits out the 0.3 s recovery before charging (S-14)',
      after.cells === 0 && after.calls === 'pulseFizzle' && after.recover > 0.28 && ch.slice(0, 17).every(v => !v) && ch.slice(20).every(v => v),
      JSON.stringify({ after, ch: ch.join('') }));
  }

  // 10 s of held fire on a rock line, the core kept 1.5 cells behind the front: Pulse breaks 0.7–0.9× what Focus does.
  const tenSec = mode => {
    const L = lab(mode);
    for (let i = 0; i < 600; i++) {
      let f = L.gx + 2; while (f <= L.gx + 40 && L.w.cells[L.w.idx(f, L.gy)] === T.EMPTY) f++;
      Object.assign(L.g.player, { x: (f - 1.5) * CELL, vx: 0, vy: 0, angle: 0 });
      L.g.update(1 / 60, fire());
    }
    return L.line().cells;
  };
  const tf = tenSec('focus'), tp = tenSec('pulse'), ratio = +(tp / tf).toFixed(3);
  check('Pulse: 10 s held on a rock line breaks 0.7–0.9× the cells Focus does (S-14, D-042)', ratio >= 0.7 && ratio <= 0.9, JSON.stringify({ focus: +tf.toFixed(2), pulse: +tp.toFixed(2), ratio }));

  // The burst stops at the first Glitch: a full burst at Beam 0 kills a tier-0 (1.2 hp) Glitch and leaves the rock behind it whole;
  // a Glitch behind one rock cell takes what that cell didn't use, × 1.6.
  {
    const L = lab('pulse'), g = L.g; g.mode = 'surge';
    L.w.cells[L.w.idx(L.gx + 2, L.gy)] = T.EMPTY; // open floor to gx+2, the Glitch in it, rock again from gx+3
    const e = { x: g.player.x + 2 * CELL, y: g.player.y, r: 11, hp: 1.2, maxHp: 1.2, tier: 0, vx: 0, vy: 0, spin: 0 };
    g.enemies = [e];
    const { releasePulse } = await import('../src/beam.js');
    g.beam.charge = 1; releasePulse(g);
    const killed = { hp: +e.hp.toFixed(3), rock: L.line().cells, enemy: g.beam.flashLine && g.beam.flashLine.enemy };
    const M = lab('pulse'), h = M.g; h.mode = 'surge';
    const e2 = { x: h.player.x + 3.5 * CELL, y: h.player.y, r: 11, hp: 10, maxHp: 10, tier: 3, vx: 0, vy: 0, spin: 0 };
    M.w.cells[M.w.idx(M.gx + 3, M.gy)] = T.EMPTY; M.w.cells[M.w.idx(M.gx + 4, M.gy)] = T.EMPTY; // rock at gx+2, the Glitch at gx+4, rock again from gx+5
    h.enemies = [e2]; h.beam.charge = 1;
    const r = releasePulse(h);
    const behind = { hp: +e2.hp.toFixed(3), want: +(10 - (1.2 - 0.55) * 1.6).toFixed(3), broken: r.broken, after: M.w.damage[M.w.idx(M.gx + 5, M.gy)] };
    check('Pulse: a full burst kills a tier-0 Glitch and stops there; through one rock cell a Glitch takes the rest × 1.6 (S-14)',
      killed.hp <= 0 && killed.rock === 1 && killed.enemy && Math.abs(behind.hp - behind.want) < 1e-3 && behind.broken === 1 && behind.after === 0,
      JSON.stringify({ killed, behind }));
  }

  // Unlock + cycle: buying Wide never unlocks Pulse; Pulse needs 40●; Q cycles Focus → Wide → Pulse → Focus. A charge is dropped
  // by a mode switch and by an open sheet (cancel); Pulse survives save + load.
  {
    const g = new Game({ seed: 77, mode: 'drift', audio });
    g.bank.lumen = 25; buyResearch(g, 'wide');
    const afterWide = unlockedModes(g).join();
    g.bank.lumen = 39; const poor = buyResearch(g, 'pulse');
    g.bank.lumen = 40; const bought = buyResearch(g, 'pulse');
    const seq = [];
    for (let i = 0; i < 3; i++) { g.update(1 / 60, idle({ beamMode: true })); seq.push(g.beamMode); }
    g.update(1 / 60, idle({ beamMode: true })); g.update(1 / 60, idle({ beamMode: true })); // → wide → pulse
    for (let i = 0; i < 30; i++) g.update(1 / 60, fire());
    const charged = +g.beam.charge.toFixed(2);
    g.update(1 / 60, idle({ cancel: true }));
    const cancelled = { charge: g.beam.charge, calls: calls.length };
    for (let i = 0; i < 30; i++) g.update(1 / 60, fire());
    g.update(1 / 60, idle({ beamMode: true }));
    const switched = { mode: g.beamMode, charge: g.beam.charge };
    g.update(1 / 60, idle({ beamMode: true })); g.update(1 / 60, idle({ beamMode: true }));
    const h = new Game({ seed: 77, mode: 'drift', audio, save: upgradeSave(JSON.parse(JSON.stringify(g.toSave()))) });
    check('Pulse: Wide never unlocks it; 40● does; Q: focus → wide → pulse → focus; a switch or an open sheet drops a charge; saved (S-14)',
      afterWide === 'focus,wide' && !poor && bought && seq.join() === 'wide,pulse,focus' && charged > 0.3 && cancelled.charge === 0
      && switched.mode === 'focus' && switched.charge === 0 && g.beamMode === 'pulse' && h.beamMode === 'pulse',
      JSON.stringify({ afterWide, poor, bought, seq, charged, cancelled, switched, saved: h.beamMode }));
  }
}

// In the page: unlock Pulse, select it, park the core facing a rock wall. Returns the damage summary of the 3 cells east.
async function setup(pg, tap) {
  await pg.evaluate(() => { try { localStorage.clear(); } catch {} });
  await pg.reload(); await pg.waitForTimeout(250);
  await (tap ? pg.tap('#new-world') : pg.click('#new-world')); await pg.waitForTimeout(200);
  await pg.evaluate(() => {
    const g = window.__lumen.game, w = g.world, gx = w.cx + 2, gy = w.cy + 6, C = 32;
    for (let y = gy - 2; y <= gy + 2; y++) for (let x = gx - 4; x <= gx + 8; x++) w.cells[w.idx(x, y)] = y === gy && x >= gx + 2 ? 1 : 0;
    for (let y = gy - 2; y <= gy + 2; y++) for (let x = gx - 4; x <= gx + 8; x++) w.markDirty(x, y);
    g.research.pulse = true; g.beamMode = 'pulse';
    Object.assign(g.player, { x: (gx + 0.5) * C, y: (gy + 0.5) * C, vx: 0, vy: 0, angle: 0 });
    window.__pl = { gx, gy };
  });
  await pg.waitForTimeout(900); // the camera eases onto the moved core before a test aims at screen coordinates
}
const wallState = pg => pg.evaluate(() => { const g = window.__lumen.game, w = g.world, { gx, gy } = window.__pl;
  return { broken: [2, 3, 4].filter(d => w.cells[w.idx(gx + d, gy)] === 0).length, charge: +g.beam.charge.toFixed(2), on: g.beam.on }; });

async function browserChecks(browser, url, check, errors, shots) {
  const { T } = await import('../src/config.js');
  if (T.ROCK !== 1 || T.EMPTY !== 0) check('Pulse browser lab assumes ROCK = 1, EMPTY = 0', false, JSON.stringify(T));
  // Desktop: hold the mouse 0.6 s to the right of the core, then release.
  {
    const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    pg.on('pageerror', e => errors.push('pulse: ' + e.message));
    await pg.goto(url); await setup(pg, false);
    const sp = await pg.evaluate(() => window.__lumen.renderer.worldToScreen(window.__lumen.game.player.x, window.__lumen.game.player.y));
    await pg.mouse.move(sp.x + 200, sp.y); await pg.mouse.down(); await pg.waitForTimeout(600);
    const mid = await wallState(pg);
    if (shots) await pg.screenshot({ path: `${shots}/pulse-charge.png` });
    await pg.mouse.up();
    if (shots) await pg.screenshot({ path: `${shots}/pulse-release.png` });
    await pg.waitForTimeout(200);
    const end = await wallState(pg);
    check('Pulse (mouse): holding charges with no continuous beam; release breaks rock (S-14)',
      mid.charge > 0.2 && !mid.on && mid.broken === 0 && end.broken >= 1 && end.charge === 0, JSON.stringify({ mid, end }));
    await pg.close();
  }
  // Touch (Pixel 7 portrait): the aim stick held charges, lifted fires.
  {
    const { devices } = require('playwright'), P7 = devices['Pixel 7'];
    const ctx = await browser.newContext({ ...P7 }), pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push('pulse touch: ' + e.message));
    await pg.goto(url); await setup(pg, true);
    const vw = P7.viewport.width, vh = P7.viewport.height, cdp = await ctx.newCDPSession(pg);
    const A = { x: vw * 0.75, y: vh * 0.7, id: 7 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [A] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...A, x: A.x + 60 }] });
    await pg.waitForTimeout(600);
    const mid = await wallState(pg);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await pg.waitForTimeout(200);
    const end = await wallState(pg);
    check('Pulse (touch): the aim stick held charges, lifted fires (S-14)', mid.charge > 0.2 && mid.broken === 0 && end.broken >= 1, JSON.stringify({ mid, end }));
    await ctx.close();
  }
}

module.exports = { nodeChecks, browserChecks };
