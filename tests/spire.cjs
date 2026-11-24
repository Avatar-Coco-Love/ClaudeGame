// S-19 Spires v1a checks (sites, cells, save). smoke.cjs calls both functions.
const audio = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { World, vaultSites, packBits } = await import('../src/world.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { spireCandidates, spireFootprint, chooseSpires } = await import('../src/spire.js');
  const { T, WORLD_W, WORLD_H, SPIRE_D } = await import('../src/config.js');
  const W = WORLD_W, H = WORLD_H, N = W * H;

  // Placement over 40 seeds: 5 each, d 64–74, ≥ 12 from every vault centre (and no shared cell), ≥ 12 apart, inside the border.
  const bad = [];
  for (let seed = 1; seed <= 40; seed++) {
    const sp = chooseSpires(seed), vaults = vaultSites(seed), vcells = new Set(vaults.flatMap(v => v.cells));
    const fail = sp.length !== 5 || sp.some(s => {
      const d = Math.hypot(s.x + 0.5 - W / 2, s.y + 0.5 - H / 2);
      return d < SPIRE_D[0] || d > SPIRE_D[1] || s.x - 4 < 2 || s.y - 4 < 2 || s.x + 4 > W - 3 || s.y + 4 > H - 3
        || vaults.some(v => Math.hypot(v.x - s.x, v.y - s.y) < 12) || spireFootprint(s.x, s.y).some(c => vcells.has(c))
        || sp.some(o => o !== s && Math.hypot(o.x - s.x, o.y - s.y) < 12);
    });
    if (fail) bad.push(seed);
  }
  check('5 Spires on 40/40 seeds: d 64–74, ≥ 12 from vaults and each other, inside the border (S-19)', bad.length === 0, `bad seeds ${bad.join()}`);

  // Same seed -> same sites; the stamp changes nothing outside the footprints; the shape is 9 core, 8 facets, 20 shell.
  const a = new Game({ seed: 77, mode: 'drift', audio }), b = new Game({ seed: 77, mode: 'surge', audio }), c = new Game({ seed: 78, mode: 'drift', audio });
  const key = g => JSON.stringify(g.spires.map(s => [s.x, s.y]));
  check('the same seed gives the same Spires, another seed others (S-19)', key(a) === key(b) && key(a) !== key(c), key(a));
  const base = new World(77), foot = new Set(a.spires.flatMap(s => spireFootprint(s.x, s.y)));
  let outside = 0; for (let i = 0; i < N; i++) if (!foot.has(i) && a.world.cells[i] !== base.cells[i]) outside++;
  const s0 = a.spires[0], count = t => spireFootprint(s0.x, s0.y).filter(i => a.world.cells[i] === t).length;
  const shape = { core: count(T.SPIRE), facet: count(T.FACET), shell: count(T.SPIRE_SHELL), open: count(T.EMPTY) };
  check('a Spire is a 9×9 shell with 4 gaps, 8 facets, a 3×3 core; nothing changes outside the footprints (S-19)', outside === 0
    && shape.core === 9 && shape.facet === 8 && shape.shell === 20 && shape.open === 44 && a.world.get(s0.x, s0.y) === T.SPIRE
    && a.world.get(s0.x + 2, s0.y - 4) === T.FACET && a.world.get(s0.x, s0.y + 4) === T.EMPTY, JSON.stringify({ ...shape, outside }));

  // Core and facets take no beam damage (no crack); the shell cracks like a vault shell.
  const w = a.world, core = w.hit(s0.x, s0.y, 99), facet = w.hit(s0.x - 4, s0.y + 2, 99), shell = w.hit(s0.x - 3, s0.y - 4, 1);
  check('Spire core and facets take no beam damage; the shell does (S-19)', core === null && facet === null && w.damageFrac(s0.x, s0.y) === 0
    && w.get(s0.x, s0.y) === T.SPIRE && shell && !shell.broken && shell.frac > 0, JSON.stringify({ core, facet, shell }));

  // A format-9 save that tunnelled through sector 0's first candidate: it gets a later candidate and keeps its tunnel.
  const cand = spireCandidates(77), c0 = cand[0][0];
  const old = new Game({ seed: 77, mode: 'drift', audio }).toSave();
  const ex = new Uint8Array(N), br = new Uint8Array(N), tunnel = [];
  for (let i = -6; i <= 6; i++) { const k = c0.y * W + c0.x + i; br[k] = ex[k] = 1; tunnel.push(k); }
  Object.assign(old, { v: 9, explored: packBits(ex), broken: packBits(br) }); delete old.spires;
  const up = upgradeSave(JSON.parse(JSON.stringify(old))), o = new Game({ seed: 77, mode: 'drift', audio, save: up });
  const t0 = up.spires[0], idx0 = cand[0].findIndex(q => q.x === t0.x && q.y === t0.y);
  check('a format-9 save with a tunnel through candidate 1 gets a later one and keeps its tunnel (S-19, D-024)', up.v === SAVE_FORMAT
    && up.spires.length === 5 && idx0 >= 1 && tunnel.every(k => o.world.cells[k] === T.EMPTY)
    && up.spires.slice(1).every((s, k) => s.x === a.spires[k + 1].x && s.y === a.spires[k + 1].y)
    && JSON.stringify(Object.keys(t0)) === '["x","y","seen","fed","mask","lit"]', `sector 0 took candidate ${idx0 + 1}`);

  // Centres are saved, never re-derived: a save naming another valid site keeps it across a reload; a bad record re-chooses.
  const s = JSON.parse(JSON.stringify(a.toSave())), alt = cand[0][3];
  s.spires[0] = { ...s.spires[0], x: alt.x, y: alt.y, fed: 12 };
  const r = new Game({ seed: 77, mode: 'drift', audio, save: upgradeSave(s) }), again = JSON.parse(JSON.stringify(r.toSave()));
  const junk = new Game({ seed: 77, mode: 'drift', audio, save: { ...JSON.parse(JSON.stringify(s)), spires: [{ x: 'a' }] } });
  check('reload keeps the saved Spire centres and fields; a malformed record re-chooses (S-19, B-037)', r.spires[0].x === alt.x
    && r.world.get(alt.x, alt.y) === T.SPIRE && again.spires[0].fed === 12 && key(junk) === key(a), JSON.stringify(again.spires[0]));
}

/** S-27 found: first sight toasts + tones once per Spire, never again after a reload; a pre-seen save is marked silently. */
async function foundChecks(check) {
  const { Game } = await import('../src/game.js');
  const { packBits, unpackBits } = await import('../src/world.js');
  const { spireFootprint, spireBreath } = await import('../src/spire.js');
  const { upgradeSave } = await import('../src/save.js');
  const { CELL } = await import('../src/config.js');
  const idle = { move: { x: 0, y: 0 }, aim: null, fire: false };
  const res = {};
  for (const mode of ['drift', 'surge']) {
    let tones = 0;
    const au = new Proxy({}, { get: (_, k) => k === 'spire' ? () => tones++ : () => {} });
    const g = new Game({ seed: 77, mode, audio: au }), s = g.spires[2];
    const look = q => q.revealQueue.push(...q.world.reveal((s.x + 0.5) * CELL, (s.y + 5.5) * CELL, 2 * CELL)); // touches the bottom row only
    g.update(1 / 60, idle);
    const before = { ev: g.events.includes('spire'), seen: g.spires.filter(q => q.seen).length };
    look(g); g.update(1 / 60, idle);
    const first = { ev: g.events.filter(e => e === 'spire').length, n: g.spireCount, seen: s.seen, others: g.spires.filter(q => q.seen).length };
    g.events.length = 0; for (let i = 0; i < 30; i++) g.update(1 / 60, idle);
    const again = g.events.includes('spire');
    const r = new Game({ seed: 77, mode, audio: au, save: upgradeSave(JSON.parse(JSON.stringify(g.toSave()))) });
    r.revealQueue.push(...r.world.reveal((s.x + 0.5) * CELL, (s.y + 0.5) * CELL, 6 * CELL)); r.update(1 / 60, idle);
    res[mode] = { before, first, again, reload: r.events.includes('spire'), keptSeen: r.spires[2].seen, tones };
  }
  const ok = m => !m.before.ev && m.before.seen === 0 && m.first.ev === 1 && m.first.n === 1 && m.first.seen && m.first.others === 1
    && !m.again && !m.reload && m.keptSeen && m.tones === 1;
  check('first sight of a Spire: one "spire" event + one tone, n = 1, never again (nor after a reload), Drift + Surge (S-27)',
    ok(res.drift) && ok(res.surge), JSON.stringify(res));

  // A v0.2.50 save (format 10, every `seen` false) whose explored bitset covers two footprints: both seen on load, no event.
  let tones = 0;
  const au = new Proxy({}, { get: (_, k) => k === 'spire' ? () => tones++ : () => {} });
  const base = new Game({ seed: 77, mode: 'drift', audio: au }), sv = JSON.parse(JSON.stringify(base.toSave())), n = base.world.w * base.world.h;
  const ex = unpackBits(sv.explored, n);
  for (const k of [0, 3]) for (const i of spireFootprint(sv.spires[k].x, sv.spires[k].y)) ex[i] = 1;
  sv.explored = packBits(ex);
  const pre = new Game({ seed: 77, mode: 'drift', audio: au, save: upgradeSave(sv) });
  for (let i = 0; i < 10; i++) pre.update(1 / 60, idle);
  const seen = pre.spires.map(q => q.seen);
  check('a pre-seen v0.2.50 save marks its explored Spires seen on load, silently (S-27)', seen.join() === 'true,false,false,true,false'
    && !pre.events.includes('spire') && tones === 0 && pre.toSave().spires[3].seen === true, JSON.stringify({ seen, events: pre.events, tones }));

  const b = [0, 1.5, 3, 4.5].map(t => +spireBreath(t, true).toFixed(3)), still = [0, 3].map(t => spireBreath(t, false));
  check('the core hexagon breathes 0.35–0.6 over 6 s; held at 0.6 under reduced motion (S-27)',
    b[0] === 0.6 && b[2] === 0.35 && b[1] === 0.475 && still.every(v => v === 0.6), JSON.stringify({ b, still }));
}

// Teleport 7 cells out from Spire k's core on the side facing the Nexus (the carved 3×3 room stays clear of the 9×9
// footprint), snap the camera and let it settle on the core, so screen pixels map to the world asked for.
async function nearSpire(page, k) {
  const info = await page.evaluate(k => {
    const L = window.__lumen, g = L.game, s = g.spires[k], cx = g.world.w / 2, cy = g.world.h / 2;
    const side = Math.abs(s.x + 0.5 - cx) > Math.abs(s.y + 0.5 - cy) ? [Math.sign(cx - s.x - 0.5) * 7, 0] : [0, Math.sign(cy - s.y - 0.5) * 7];
    const tx = s.x + side[0] + 0.5 - cx, ty = s.y + side[1] + 0.5 - cy;
    g.demo = true; L.dev.god(true); g.enemies = []; g.spawnTimer = 1e9;
    const at = L.dev.teleport(Math.hypot(tx, ty), Math.atan2(ty, tx));
    const p = g.player, cam = L.renderer.cam; // snap to where it eases to (the core + a 36 px look-ahead), so the toast is still up
    cam.x = p.x + Math.cos(p.angle) * 36; cam.y = p.y + Math.sin(p.angle) * 36;
    return { at, d: Math.hypot(tx, ty) };
  }, k);
  // Audit 49 (C3): the "Entering the Deep" milestone toast now holds its 2.6 s, so the Spire toast shows after it.
  await page.waitForFunction(() => { const t = document.getElementById('toast'); return t.classList.contains('show') && /Spire/.test(t.textContent); },
    null, { timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(250);
  return info;
}

/** Beside a Deep Spire (DSF 1): hexagon pixel + breath, the found toast, the minimap mark, the stats line; 320×568 too.
 *  `shots` (env SPIRE_SHOT, a directory) saves spire-1280x800.png and spire-320x568.png (viewed in sessions 46 and 48). */
async function browserChecks(browser, url, check, errors, shots) {
  const { T } = await import('../src/config.js');
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?dev'); await page.waitForTimeout(200);
  await page.click('#new-world'); await page.waitForTimeout(300);
  const info = await nearSpire(page, 0);
  const toastText = await page.evaluate(() => { const t = document.getElementById('toast'); return t.classList.contains('show') ? t.textContent : 'hidden'; });
  // Brightest pixel in a 9×9 box: on the core hexagon's top vertex (CELL·1.35 above the centre) vs midway between the
  // outer and inner hexagons (CELL·1.0 above), where only the core's fill is. `t` sets the breath clock first.
  const sample = (t, dir = -1, h = 4) => page.evaluate(async ([t, dir, h]) => {
    const L = window.__lumen, g = L.game, s = g.spires[0], R = L.renderer;
    if (t != null) { R.time = t; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
    const cx = (s.x + 0.5) * 32, cy = (s.y + 0.5) * 32, at = r => { r *= -dir;
      const p = R.worldToScreen(cx, cy - r), d = R.ctx.getImageData(Math.round(p.x * R.dpr) - h, Math.round(p.y * R.dpr) - h, 2 * h + 1, 2 * h + 1).data;
      let m = 0; for (let i = 0; i < d.length; i += 4) m = Math.max(m, d[i] + d[i + 1] + d[i + 2]); return m;
    };
    return { line: at(32 * 1.35), fill: at(32), core: g.world.get(s.x, s.y) };
  }, [t, dir, h]);
  const peak = await sample(0);
  if (shots) await page.screenshot({ path: `${shots}/spire-1280x800.png` });
  // Breath, measured in the core's light: stand in the Spire's interior, 3 cells below the core, and read the near vertex
  // (measured: 347 at the peak, 264 at the trough).
  await page.evaluate(() => { const g = window.__lumen.game, s = g.spires[0]; g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 3.5) * 32; });
  await page.waitForFunction(() => { const L = window.__lumen, p = L.game.player; return Math.hypot(L.renderer.cam.x - p.x, L.renderer.cam.y - p.y) < 40; }, null, { timeout: 5000 }).catch(() => {});
  const hi = await sample(0, 1, 1), low = await sample(3, 1, 1); // a 3×3 box: the cell bevel 4 px off the vertex is static
  check('beside a Deep Spire the core hexagon draws ≥ 1.8× its fill at the breath peak (S-19, DSF 1)', peak.core === T.SPIRE
    && peak.line >= 1.8 * peak.fill && peak.line > 30, JSON.stringify({ ...peak, at: info.at, d: info.d.toFixed(1) }));
  check('the core hexagon breathes: dimmer at the trough than at the peak, still above its fill (S-27)',
    low.line < 0.9 * hi.line && low.line > low.fill, JSON.stringify({ peak: hi.line, low: low.line, fill: low.fill }));
  check('first sight toasts "A dormant Spire (1/5)" (S-27)', /A dormant Spire \(1\/5\)/.test(toastText), toastText);
  // Minimap: the brightest pixel in a 9×9 box at a Spire's centre. The mark (#e4dcff, sum 703) is brighter than any
  // explored Spire cell (shell 510); an unseen Spire's box stays dark.
  const mini = await page.evaluate(() => {
    const L = window.__lumen, g = L.game, c = L.renderer.minimap, m = c.getContext('2d'), sc = c.width / (g.world.w * 32);
    const at = s => { const d = m.getImageData(Math.round((s.x + 0.5) * 32 * sc) - 4, Math.round((s.y + 0.5) * 32 * sc) - 4, 9, 9).data;
      let v = 0; for (let i = 0; i < d.length; i += 4) v = Math.max(v, d[i] + d[i + 1] + d[i + 2]); return v; };
    return { seen: at(g.spires[0]), unseen: at(g.spires[1]), flags: g.spires.map(s => s.seen) };
  });
  check('minimap: a hollow hexagon at the seen Spire, nothing at an unseen one (S-27)', mini.seen >= 650 && mini.unseen < 200
    && mini.flags[0] && !mini.flags[1], JSON.stringify(mini));
  // Back at the Nexus the Matrix stats line counts lit Spires.
  await page.evaluate(() => { window.__lumen.dev.teleport(0); }); await page.waitForTimeout(200);
  await page.evaluate(() => window.__lumen.input.pressed.add('matrix')); await page.waitForTimeout(200);
  const stats = await page.textContent('#stats');
  check('the Matrix stats line adds "Spires 0/5 lit" once one is found (S-27)', /· Spires 0\/5 lit$/.test(stats), stats);
  await page.close();

  // 320×568 portrait (DSF 1): the same scene on the narrowest phone, for the screenshot; the toast fits on screen.
  const ph = await browser.newPage({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  ph.on('pageerror', e => errors.push('spire 320: ' + e.message));
  await ph.goto(url + '?dev'); await ph.waitForTimeout(200);
  await ph.tap('#new-world'); await ph.waitForTimeout(300);
  await ph.evaluate(() => { window.__lumen.game.setMode('surge'); });
  await nearSpire(ph, 0);
  if (shots) await ph.screenshot({ path: `${shots}/spire-320x568.png` });
  const t = await ph.evaluate(() => { const e = document.getElementById('toast'), r = e.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), text: e.classList.contains('show') ? e.textContent : 'hidden' }; });
  check('320×568 Surge: the Spire toast shows and fits the screen (S-27)', /1\/5/.test(t.text) && t.l >= 0 && t.r <= 320, JSON.stringify(t));
  await ph.close();
}

module.exports = { nodeChecks, foundChecks, browserChecks };
