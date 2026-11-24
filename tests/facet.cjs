// S-28 facet puzzle + relit checks (D-055, D-078, D-080, D-081). smoke.cjs calls nodeChecks and browserChecks;
// tools/facetprobe.mjs reuses `aims` and `solveInGame` to solve every generated pattern in-game over many seeds.
const { nearSpire } = require('./spire.cjs');
const quiet = new Proxy({}, { get: () => () => {} });
const DT = 1 / 60;

/** For each facet k of Spire s: the interior standing cell (offset from the centre) and aim angle whose centre ray hits
 *  it over the widest angle window, and that window in degrees (how forgiving the aim is, mouse or thumb). The cast
 *  mirrors castBeam: from the core's centre, reach = Range + the 12 px nose. Pure geometry: the same for every Spire. */
function aims(g, s, range = g.stat('range') + 12) {
  const { FACET_RING } = g.__spire, w = g.world, out = [];
  for (const [fi, fj] of FACET_RING) {
    let best = null;
    for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
      if (Math.max(Math.abs(i), Math.abs(j)) <= 1) continue; // the core block
      const px = (s.x + i + 0.5) * 32, py = (s.y + j + 0.5) * 32;
      let run = 0, from = 0;
      for (let a = 0; a <= 7200; a++) { // 0.05° steps, one lap + the wrap
        const t = (a % 7200) * Math.PI / 3600, h = w.raycast(px, py, Math.cos(t), Math.sin(t), range);
        const on = h && h.x === s.x + fi && h.y === s.y + fj;
        if (on) { if (!run) from = a; run++; }
        if ((!on || a === 7200) && run) {
          if (!best || run > best.width) best = { i, j, angle: (from + (run - 1) / 2) * Math.PI / 3600, width: run };
          run = 0;
        }
      }
    }
    out.push({ ...best, deg: best.width / 20 });
  }
  return out;
}

/** Stand on aim k's cell, hold fire along its angle for `secs`, then let go for a frame. */
function hold(g, aim, secs, s, release = true) {
  g.player.x = (s.x + aim.i + 0.5) * 32; g.player.y = (s.y + aim.j + 0.5) * 32; g.player.vx = g.player.vy = 0; g.player.angle = aim.angle;
  const intent = { move: { x: 0, y: 0 }, aim: { x: Math.cos(aim.angle), y: Math.sin(aim.angle) }, fire: true };
  for (let t = 0; t < secs - 1e-9; t += DT) g.update(DT, intent);
  if (release) g.update(DT, { move: { x: 0, y: 0 }, aim: null, fire: false });
}

/** The fewest facets whose toggles take `mask` to 255 (brute force over the 256 tap sets). */
function tapSet(toggleMask, mask) {
  let best = null;
  for (let set = 0; set < 256; set++) {
    let m = mask; const ks = [];
    for (let k = 0; k < 8; k++) if (set >> k & 1) { m = toggleMask(m, k); ks.push(k); }
    if (m === 255 && (!best || ks.length < best.length)) best = ks;
  }
  return best;
}

/** Build a world, prime Spire i (fed 80, stand inside: S-20's heal path primes it), then beam its tap set facet by facet. */
async function solveInGame(seed, i, mode = 'drift', A = null) {
  const { Game } = await import('../src/game.js'), sp = await import('../src/spire.js');
  const g = new Game({ seed, mode, audio: quiet }); g.__spire = sp;
  g.god = true; g.spawnTimer = 1e9;
  const s = g.spires[i]; s.fed = 80;
  g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 3.5) * 32; g.update(DT, { move: { x: 0, y: 0 }, aim: null, fire: false });
  const start = s.mask, taps = tapSet(sp.toggleMask, start), at = A || aims(g, s);
  for (const k of taps) { g.enemies = []; hold(g, at[k], 0.5, s); }
  return { g, s, start, taps, lit: s.lit, mode: s.mode, mask: s.mask, events: [...g.events] };
}

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js'), sp = await import('../src/spire.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { SPIRE_TAPS, SPIRE_LIGHT } = await import('../src/config.js');
  const { startMask, toggleMask } = sp;
  const make = (mode = 'drift', save = null) => { const g = new Game({ seed: 77, mode, audio: quiet, save }); g.__spire = sp; g.god = true; g.spawnTimer = 1e9; return g; };
  const prime = (g, i = 0) => { const s = g.spires[i]; s.fed = 80; g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 3.5) * 32;
    g.update(DT, { move: { x: 0, y: 0 }, aim: null, fire: false }); return s; };
  const g0 = make(), A = aims(g0, g0.spires[0]);

  // Aim practicality (mouse and thumb): every facet has a standing cell where the centre ray hits it over a wide window.
  check('every facet can be hit by the centre ray over a ≥ 8° window from some interior cell (S-28 aim, touch)', A.every(a => a.deg >= 8),
    A.map(a => `${a.deg}°@(${a.i},${a.j})`).join(' '));

  // In-game solve: 40 seeds × 5 Spires (Drift), the start's tap set relights with exactly SPIRE_TAPS[i] taps.
  const bad = [];
  for (let seed = 1; seed <= 40; seed++) for (let i = 0; i < 5; i++) {
    const r = await solveInGame(seed, i, 'drift', A);
    if (!r.lit || r.mode !== 'drift' || r.taps.length !== SPIRE_TAPS[i] || !r.events.includes('spire-relit') || r.g.spireLights.length !== 1) bad.push(`${seed}:${i}`);
  }
  check('in-game: beaming each start pattern\'s tap set relights the Spire, mode "drift" (40 seeds × 5, S-28)', bad.length === 0, `bad ${bad.slice(0, 8).join()}`);

  // Surge (D-055 interim, until S-23): the same puzzle works with Glitches about, and records "surge".
  const sr = await solveInGame(77, 3, 'surge', A);
  check('Surge: the facet puzzle works too and records mode "surge" (D-055 interim, D-081)', sr.lit && sr.mode === 'surge', JSON.stringify({ lit: sr.lit, mode: sr.mode, mask: sr.mask }));

  // Dwell: a 0.2 s brush doesn't toggle; a 2 s hold toggles once; leaving and coming back toggles again.
  {
    const g = make(), s = prime(g), m0 = s.mask;
    hold(g, A[0], 0.2, s); const brush = s.mask;
    hold(g, A[0], 2, s); const held = s.mask;
    hold(g, A[0], 0.5, s); const again = s.mask;
    check('a 0.2 s brush doesn\'t toggle; a held beam toggles once; aiming again toggles again (SPIRE_TAP_S, S-28)', brush === m0
      && held === toggleMask(m0, 0) && again === m0, JSON.stringify({ m0, brush, held, again }));
  }

  // Dormant (unprimed) and relit Spires: a held beam never toggles a facet.
  {
    const g = make(), s = g.spires[0];
    hold(g, A[2], 1.5, s);
    const dormant = s.mask;
    s.fed = 80; s.mask = 255; s.lit = true;
    hold(g, A[2], 1.5, s);
    check('a dormant Spire\'s facets never toggle; nor a lit one\'s (S-28)', dormant === null && s.mask === 255 && g.facetAim === null, JSON.stringify({ dormant, lit: s.mask }));
  }

  // Wide (D-080): a side ray resting on a facet while the centre ray hits something else doesn't toggle it.
  {
    const g = make(), s = prime(g), m0 = s.mask; g.research.wide = true; g.beamMode = 'wide';
    const { WIDE_OFFSET, WIDE_RANGE } = await import('../src/config.js'), w = g.world, range = g.stat('range') * WIDE_RANGE + 12;
    let found = null; // a spot and angle where a side ray's first hit is a facet and the centre ray's is not
    for (let j = -3; j <= 3 && !found; j++) for (let i = -3; i <= 3 && !found; i++) {
      if (Math.max(Math.abs(i), Math.abs(j)) <= 1) continue;
      const px = (s.x + i + 0.5) * 32, py = (s.y + j + 0.5) * 32;
      for (let a = 0; a < 720 && !found; a++) {
        const t = a * Math.PI / 360, dx = Math.cos(t), dy = Math.sin(t), fac = h => h && sp.facetAt(g, h.x, h.y);
        const mid = w.raycast(px, py, dx, dy, range), side = [-1, 1].map(o => w.raycast(px - dy * o * WIDE_OFFSET, py + dx * o * WIDE_OFFSET, dx, dy, range));
        if (mid && !fac(mid) && side.some(fac)) found = { i, j, angle: t };
      }
    }
    if (found) hold(g, found, 1.5, s);
    check('a Wide beam whose side ray rests on a facet doesn\'t toggle it (D-080)', !!found && s.mask === m0, JSON.stringify({ found, m0, mask: s.mask }));
    hold(g, A[1], 1, s);
    check('a Wide beam\'s centre ray toggles a facet once (D-080)', s.mask === toggleMask(m0, 1), JSON.stringify({ m0, mask: s.mask }));
  }

  // Pulse: a held full charge aimed at a primed facet fires (ready shot) and toggles it once; at a dormant facet it waits.
  {
    const g = make(), s = prime(g), m0 = s.mask; g.research.pulse = true; g.beamMode = 'pulse';
    hold(g, A[4], 1.5, s); // full at 1.2 s, fires at once (S-21 ready shot), then recovers: one burst
    const g2 = make(); g2.research.pulse = true; g2.beamMode = 'pulse'; const d = g2.spires[0];
    hold(g2, A[4], 2.5, d, false);
    check('a Pulse burst at a primed facet toggles it once; at a dormant one a full charge waits (S-28, B-036)', s.mask === toggleMask(m0, 4)
      && d.mask === null && g2.beam.charge === 1, JSON.stringify({ m0, mask: s.mask, charge2: g2.beam.charge }));
  }

  // Save: mask, lit, mode survive reload and the light comes back; an old save's lit Spire loads 'broken'; junk mode dropped.
  {
    const r = await solveInGame(77, 0, 'drift', A), sv = upgradeSave(JSON.parse(JSON.stringify(r.g.toSave())));
    const again = new Game({ seed: 77, mode: 'drift', audio: quiet, save: sv }), a0 = again.spires[0];
    const old = JSON.parse(JSON.stringify(make().toSave())); old.v = SAVE_FORMAT - 1; Object.assign(old.spires[1], { fed: 80, mask: 255, lit: true });
    const up = new Game({ seed: 77, mode: 'drift', audio: quiet, save: upgradeSave(old) });
    const junk = JSON.parse(JSON.stringify(sv)); junk.spires[0].mode = 'banana';
    const jg = new Game({ seed: 77, mode: 'drift', audio: quiet, save: upgradeSave(junk) });
    check('mask, lit and mode survive reload (light back, r 260); an older save\'s lit Spire loads "broken"; an unknown mode is dropped (D-081, B-037)',
      a0.lit && a0.mask === 255 && a0.mode === 'drift' && again.spireLights.length === 1 && again.spireLights[0].r === SPIRE_LIGHT
      && up.spires[1].mode === 'broken' && up.spireLights.length === 1 && jg.spires[0].lit && jg.spires[0].mode === undefined,
      JSON.stringify({ a0, up: up.spires[1].mode, junk: jg.spires[0].mode }));
  }

  // S-20's broken path gets the relit effects: mode 'broken', the light, and the tone.
  {
    const base = JSON.parse(JSON.stringify(make().toSave())), s0 = base.spires[2]; s0.keep = [s0.y * 160 + s0.x];
    let tone = 0; const g = new Game({ seed: 77, mode: 'surge', audio: new Proxy({}, { get: (_, k) => k === 'spireRelit' ? () => tone++ : () => {} }), save: upgradeSave(base) });
    g.god = true; g.spawnTimer = 1e9; g.bank.prism = 80;
    const s = g.spires[2]; g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 3.5) * 32;
    for (let t = 0; t < 11; t += DT) g.update(DT, { move: { x: 0, y: 0 }, aim: null, fire: false });
    check('a broken Spire relit at 80 records mode "broken", lights 260 px and plays the relit tone (S-28 via S-20)', s.lit && s.mode === 'broken'
      && g.spireLights.length === 1 && tone === 1, JSON.stringify({ lit: s.lit, mode: s.mode, lights: g.spireLights.length, tone }));
  }
}

/** A primed Spire, its hint, one real facet aim (mouse at 1280×800 Drift; the aim stick at 320×568 Surge), then the
 *  relit Spire. `shots` (env SPIRE_SHOT) saves facet-primed-*.png and facet-relit-*.png. */
async function browserChecks(browser, url, check, errors, shots) {
  for (const [vw, vh, mode] of [[1280, 800, 'drift'], [320, 568, 'surge']]) {
    const touch = vw < 400;
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, ...(touch ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`facet ${vw}: ` + e.message));
    await page.goto(url + '?dev'); await page.waitForTimeout(200);
    if (touch) await page.tap('#new-world'); else await page.click('#new-world');
    await page.waitForTimeout(300);
    await page.evaluate(m => window.__lumen.game.setMode(m), mode);
    await nearSpire(page, 0);
    // Prime it and stand at (-2, 2), right above facet 4 (-2, 4), facing down.
    await page.evaluate(() => {
      const g = window.__lumen.game, s = g.spires[0]; s.fed = 80; g.enemies = []; g.spawnTimer = 1e9; g.stats.mined = 20; // past the first-move hint
      g.player.x = (s.x - 2 + 0.5) * 32; g.player.y = (s.y + 2 + 0.5) * 32; g.player.vx = g.player.vy = 0; g.player.angle = Math.PI / 2;
    });
    await page.waitForFunction(() => { const L = window.__lumen, p = L.game.player; return L.game.spires[0].mask !== null && Math.hypot(L.renderer.cam.x - p.x, L.renderer.cam.y - p.y) < 40; }, null, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(3300); // the "Spire primed" toast clears the view
    const before = await page.evaluate(() => {
      const L = window.__lumen, g = L.game, s = g.spires[0], h = document.getElementById('hint'), r = h.getBoundingClientRect();
      const q = L.renderer.worldToScreen((s.x + 0.5) * 32, (s.y - 6 + 0.5) * 32); // 6 cells north: past the core's own light
      return { mask: s.mask, hint: h.classList.contains('hidden') ? '' : h.textContent, l: r.left, r: r.right, t: r.top, b: r.bottom,
        dark: L.renderer.lctx.getImageData(Math.round(q.x / 2), Math.round(q.y / 2), 1, 1).data[3] };
    });
    check(`${vw}×${vh} ${mode}: in a primed Spire the hint names the rule and fits the screen (S-28, D-080)`,
      /Beam a facet: it flips with its two neighbours\. Light all 8\./.test(before.hint) && before.l >= 0 && before.r <= vw && before.b <= vh, JSON.stringify(before));
    if (shots) await page.screenshot({ path: `${shots}/facet-primed-${vw}x${vh}.png` });
    // One real aim at facet 4 (straight down from here): mouse on its screen centre, or the aim stick dragged down.
    const fp = await page.evaluate(() => { const L = window.__lumen, s = L.game.spires[0]; return L.renderer.worldToScreen((s.x - 2 + 0.5) * 32, (s.y + 4 + 0.5) * 32); });
    if (touch) {
      const cdp = await ctx.newCDPSession(page), A = { x: Math.round(vw * 0.75), y: Math.round(vh * 0.6), id: 1 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [A] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...A, y: A.y + 40 }] });
      await page.waitForTimeout(700);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(fp.x, fp.y); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
    }
    await page.waitForTimeout(100);
    const tapped = await page.evaluate(() => window.__lumen.game.spires[0].mask);
    const want = await page.evaluate(m => import('/src/spire.js').then(sp => sp.toggleMask(m, 4)), before.mask);
    check(`${vw}×${vh}: ${touch ? 'the aim stick held' : 'the mouse held'} on a facet for 0.7 s toggles it and its neighbours once (S-28)`,
      tapped === want, JSON.stringify({ before: before.mask, tapped, want }));
    // Set the pattern one tap (facet 4) from solved and aim again: relit.
    await page.evaluate(() => import('/src/spire.js').then(sp => { window.__lumen.game.spires[0].mask = sp.toggleMask(255, 4); }));
    if (touch) {
      const cdp = await ctx.newCDPSession(page), A = { x: Math.round(vw * 0.75), y: Math.round(vh * 0.6), id: 2 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [A] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...A, y: A.y + 40 }] });
      await page.waitForTimeout(700);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
    }
    await page.waitForFunction(() => { const t = document.getElementById('toast'); return t.classList.contains('show') && /Spire relit/.test(t.textContent); }, null, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(150);
    // The darkness 6 cells north of the centre (272 px from the core, out of its 260 px light) is the Spire's own.
    const after = await page.evaluate(() => new Promise(res => {
      const L = window.__lumen, g = L.game, s = g.spires[0], t = document.getElementById('toast'), r = t.getBoundingClientRect(), h = document.getElementById('hint');
      const out = { lit: s.lit, mode: s.mode, toast: t.classList.contains('show') ? t.textContent : 'hidden', tl: r.left, tr: r.right,
        hint: h.classList.contains('hidden') ? '' : h.textContent, stats: document.getElementById('stats').textContent, sets: L.renderer.lightSets.map(q => q.length).join() };
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const q = L.renderer.worldToScreen((s.x + 0.5) * 32, (s.y - 6 + 0.5) * 32); // 6 cells north: past the core's own light
        out.dark = L.renderer.lctx.getImageData(Math.round(q.x / 2), Math.round(q.y / 2), 1, 1).data[3]; res(out);
      }));
    }));
    if (shots) await page.screenshot({ path: `${shots}/facet-relit-${vw}x${vh}.png` });
    check(`${vw}×${vh} ${mode}: the last facet relights it: toast "Spire relit (1/5)" on screen, mode "${mode}", the hint goes, its light opens the dark (S-28)`,
      after.lit && after.mode === mode && /Spire relit \(1\/5\)/.test(after.toast) && after.tl >= 0 && after.tr <= vw && !/facet/.test(after.hint)
      && after.sets === '0,0,1' && after.dark < before.dark - 30, JSON.stringify({ before: before.dark, after }));
    await ctx.close();
  }
}

module.exports = { nodeChecks, browserChecks, aims, solveInGame, tapSet };
