// S-23 Spire Wake checks (D-055, D-071, D-086). smoke.cjs calls nodeChecks and browserChecks.
// Node: a guarded god-mode hold relights in 40 s (mode 'surge'); charge 0 fails and keeps fed, and stepping out and back in
// retries; a core death fails it; Drift never starts one; lanes clear only rock/ore, stop at what they can't clear and drop
// ore loot; Glitches spawn only at usable lane ends (a Spire with a bedrock-blocked lane still runs); a reload mid-Wake
// doesn't restart it until the core steps out. Browser: the Wake toast, hint and charge ring on screen (env SPIRE_SHOT).
const quiet = new Proxy({}, { get: () => () => {} });
const DT = 1 / 60, idle = { move: { x: 0, y: 0 }, aim: null, fire: false };

/** One frame of the guard: stand between the core and the Glitch nearest it, beam that Glitch (surgebot's guard). */
function guardStep(g) {
  const p = g.player, k = g.wake, c = k ? k.core : p; let e = null, bd = Infinity;
  for (const q of g.enemies) { const d = Math.hypot(q.x - c.x, q.y - c.y); if (q.fade === undefined && d < bd) { bd = d; e = q; } }
  if (!e || !k) { g.update(DT, idle); return; }
  const lim = 2.6 * 32, f = 3.2 * 32 / bd, tx = c.x + Math.max(-lim, Math.min(lim, (e.x - c.x) * f)), ty = c.y + Math.max(-lim, Math.min(lim, (e.y - c.y) * f));
  const m = Math.hypot(tx - p.x, ty - p.y), move = m < 3 ? { x: 0, y: 0 } : { x: Math.max(-1, Math.min(1, (tx - p.x) / m * 2)), y: Math.max(-1, Math.min(1, (ty - p.y) / m * 2)) };
  g.update(DT, { move, fire: true, aim: { x: e.x - p.x, y: e.y - p.y } });
}

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { T, UPGRADES, SPIRE_WAKE_S, SPIRE_LANE, SPIRE_CHARGE } = await import('../src/config.js');
  const make = (mode = 'surge', seed = 77, save = null) => {
    const g = new Game({ seed, mode, audio: quiet, save }); g.god = true;
    const ev = []; const n = g.notify.bind(g); g.notify = e => { ev.push(e); n(e); }; g.ev = ev;
    for (const u of UPGRADES) g.upgrades[u.id] = { beam: 4, range: 3, thrust: 3, cargo: 4, magnet: 2, hull: 2 }[u.id] || 0; return g;
  };
  const enter = (g, i = 0) => { const s = g.spires[i]; s.fed = 80; g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 3.5) * 32; g.update(DT, idle); return s; };
  const leave = (g, s) => { g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 7.5) * 32; g.update(DT, idle); };

  // A guarded hold relights in 40 s with mode 'surge'; the facets light one by one as the clock.
  {
    const g = make(), s = enter(g); let t = 0, lits = [];
    for (; t < SPIRE_WAKE_S + 2 && !s.lit; t += DT) { guardStep(g); if (g.wake && !lits.includes(g.wake.lit)) lits.push(g.wake.lit); }
    check('S-23: a guarded hold relights the Spire after 40 s, mode "surge", the 8 facets light in turn', s.lit && s.mode === 'surge' &&
      Math.abs(t - SPIRE_WAKE_S) < 0.1 && lits.join() === '0,1,2,3,4,5,6,7,8' && g.ev.includes('wake-start') && g.ev.includes('spire-relit') && !g.wake,
      JSON.stringify({ lit: s.lit, mode: s.mode, t: +t.toFixed(2), lits: lits.join(), ev: g.ev.slice(-4) }));
  }
  // Charge 0 fails: fed kept, no restart in place; stepping out and back in starts a new Wake. A core death fails too.
  {
    const g = make(), s = enter(g); for (let t = 0; t < 3; t += DT) g.update(DT, idle);
    g.wake.charge = 0; g.update(DT, idle);
    const failed = !g.wake && s.fed === 80 && !s.lit && g.ev.includes('wake-failed');
    for (let t = 0; t < 2; t += DT) g.update(DT, idle);
    const stays = !g.wake;
    leave(g, s); enter(g);
    const again = !!g.wake && g.wake.charge === SPIRE_CHARGE;
    g.god = false; g.player.integrity = 1; g.hurtPlayer(5, 0, 1);
    check('S-23: charge 0 fails the Wake and keeps fed; it waits until the core steps out and in; a core death fails it',
      failed && stays && again && !g.wake && g.ev.filter(e => e === 'wake-failed').length === 2, JSON.stringify({ failed, stays, again, ev: g.ev }));
  }
  // Drift never starts a Wake (the puzzle stays).
  {
    const g = make('drift'), s = enter(g); for (let t = 0; t < 5; t += DT) g.update(DT, idle);
    check('S-23: Drift never starts a Wake', !g.wake && s.mask !== null && !g.ev.includes('wake-start'), JSON.stringify(g.ev));
  }
  // Lanes: a crystal planted in a lane drops loot; a bedrock row stops a lane (it gets no spawns); every Wake Glitch
  // appears at a usable lane end. Run over 3 seeds × 5 Spires.
  {
    let bad = [], loot = 0, stopped = 0, spawns = 0;
    for (const seed of [77, 5, 9]) for (let i = 0; i < 5; i++) {
      const g = make('surge', seed), s = g.spires[i], w = g.world;
      if (i === 0) for (let o = -1; o <= 1; o++) w.cells[(s.y - 6) * w.w + s.x + o] = T.BEDROCK; // north lane: blocked at row 2
      const ore = (s.y + 6) * w.w + s.x; w.cells[ore] = T.CRYSTAL; // south lane, row 2
      const before = Array.from(w.cells), p0 = g.pickups.length;
      enter(g, i);
      const k = g.wake; if (!k) { bad.push(`${seed}:${i} no wake`); continue; }
      if (i === 0) { stopped += k.lanes[0].len === 1 ? 1 : 0; }
      for (let j = 0; j < w.cells.length; j++) if (before[j] !== w.cells[j] && (w.cells[j] !== T.EMPTY || ![T.ROCK, T.DENSE, T.CRYSTAL, T.PRISM, T.LUMEN].includes(before[j]))) bad.push(`${seed}:${i} cell ${j}`);
      if (w.cells[ore] === T.EMPTY && before[ore] === T.CRYSTAL && k.lanes[2].len >= 2) loot += g.pickups.length > p0 ? 1 : 0;
      const ends = k.lanes.filter(l => l.len >= SPIRE_LANE.min), seen = new Set();
      for (let t = 0; t < 12; t += DT) {
        g.update(DT, idle);
        for (const e of g.enemies) if (e.wake && !seen.has(e)) { seen.add(e); spawns++; if (!ends.some(l => Math.hypot(l.x - e.x, l.y - e.y) < 8)) bad.push(`${seed}:${i} spawn`); }
        if (!g.wake) break;
      }
    }
    check('S-23: lanes clear only rock/ore, stop at bedrock (that lane spawns nothing), ore drops loot; Glitches spawn only at usable lane ends',
      bad.length === 0 && stopped === 3 && loot >= 12 && spawns > 50, JSON.stringify({ bad: bad.slice(0, 5), stopped, loot, spawns }));
  }
  // A reload mid-Wake is a failed Wake: the core loads in the interior and the Spire waits for it to step out.
  {
    const g = make(), s = enter(g); for (let t = 0; t < 3; t += DT) g.update(DT, idle);
    const save = JSON.parse(JSON.stringify(g.toSave())), h = make('surge', 77, save); h.update(DT, idle);
    const waits = !h.wake && h.spires[0].fed === 80;
    leave(h, h.spires[0]); enter(h);
    check('S-23: a Wake is never saved; after a reload in the interior it starts only once the core steps out and in', waits && !!h.wake && !('wake' in save),
      JSON.stringify({ waits, after: !!h.wake }));
  }
}

async function browserChecks(browser, url, check, errors, shots) {
  for (const [vw, vh] of [[1280, 800], [320, 568]]) {
    const touch = vw < 400;
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, ...(touch ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`wake ${vw}: ` + e.message));
    await page.goto(url + '?dev'); await page.waitForTimeout(200);
    if (touch) await page.tap('#new-world'); else await page.click('#new-world');
    await page.waitForTimeout(300);
    await page.evaluate(() => { const g = window.__lumen.game; g.setMode('surge'); g.god = true; g.stats.mined = 20;
      const s = g.spires[0]; s.fed = 80; g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 3.5) * 32; g.player.vx = g.player.vy = 0; });
    await page.waitForFunction(() => !!window.__lumen.game.wake, null, { timeout: 3000 }).catch(() => {});
    await page.waitForFunction(() => /Spire wakes/.test(document.getElementById('toast').textContent), null, { timeout: 9000 }).catch(() => {});
    const toast = await page.evaluate(() => { const t = document.getElementById('toast'), r = t.getBoundingClientRect(); return { text: t.textContent, show: t.classList.contains('show'), l: r.left, r: r.right }; });
    await page.waitForTimeout(4200);
    const st = await page.evaluate(() => {
      const L = window.__lumen, g = L.game, k = g.wake, h = document.getElementById('hint'), r = h.getBoundingClientRect();
      if (!k) return { wake: false };
      const q = L.renderer.worldToScreen(k.core.x, k.core.y - 2.2 * 32), d = L.renderer.ctx.getImageData(Math.round(q.x), Math.round(q.y), 1, 1).data;
      return { wake: true, lit: k.lit, hint: h.classList.contains('hidden') ? '' : h.textContent, hl: r.left, hr: r.right, hb: r.bottom, ring: [d[0], d[1], d[2]] };
    });
    if (shots) await page.screenshot({ path: `${shots}/wake-${vw}x${vh}.png` });
    check(`${vw}×${vh}: the Wake toast + hint fit the screen, facets count up, the charge ring is orange at the core's top (S-23)`,
      toast.show && /hold it 40 s/.test(toast.text) && toast.l >= 0 && toast.r <= vw && st.wake && st.lit >= 1 && /Hold the Spire/.test(st.hint)
      && st.hl >= 0 && st.hr <= vw && st.hb <= vh && st.ring[0] > 150 && st.ring[0] > st.ring[2] + 60, JSON.stringify({ toast, st }));
    await ctx.close();
  }
}

module.exports = { nodeChecks, browserChecks, guardStep };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
