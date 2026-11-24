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
    && SAVE_FORMAT === 10 && up.spires.length === 5 && idx0 >= 1 && tunnel.every(k => o.world.cells[k] === T.EMPTY)
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

/** `dev.teleport` beside a Spire in the Deep; screenshot at DSF 1 (looked at in session 46) and a pixel on the core's hexagon. */
async function browserChecks(browser, url, check, errors, shot) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url + '?dev'); await page.waitForTimeout(200);
  await page.click('#new-world'); await page.waitForTimeout(300);
  const info = await page.evaluate(() => {
    const L = window.__lumen, g = L.game, s = g.spires[0], cx = g.world.w / 2, cy = g.world.h / 2;
    // Stand 7 cells out from the core on the side facing the Nexus (the carved 3×3 room stays clear of the 9×9 footprint).
    const side = Math.abs(s.x + 0.5 - cx) > Math.abs(s.y + 0.5 - cy) ? [Math.sign(cx - s.x - 0.5) * 7, 0] : [0, Math.sign(cy - s.y - 0.5) * 7];
    const tx = s.x + side[0] + 0.5 - cx, ty = s.y + side[1] + 0.5 - cy, a = Math.atan2(ty, tx), d = Math.hypot(tx, ty);
    g.demo = true; L.dev.god(true);
    const at = L.dev.teleport(d, a);
    return { s, at, d };
  });
  // Wait for the camera to settle on the core (it eases), so screen pixels map to the world positions asked for.
  await page.waitForFunction(() => { const L = window.__lumen, p = L.game.player; return Math.hypot(L.renderer.cam.x - p.x, L.renderer.cam.y - p.y) < 1; }, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(200);
  if (shot) await page.screenshot({ path: shot });
  const px = await page.evaluate(() => {
    const L = window.__lumen, g = L.game, s = g.spires[0], R = L.renderer;
    // Brightest pixel in a 9×9 box: on the core hexagon's top vertex (CELL·1.35 above the centre) vs midway between the
    // outer and inner hexagons (CELL·1.0 above), where only the core's fill is.
    const cx = (s.x + 0.5) * 32, cy = (s.y + 0.5) * 32, at = r => {
      const p = R.worldToScreen(cx, cy - r), d = R.ctx.getImageData(Math.round(p.x * R.dpr) - 4, Math.round(p.y * R.dpr) - 4, 9, 9).data;
      let m = 0; for (let i = 0; i < d.length; i += 4) m = Math.max(m, d[i] + d[i + 1] + d[i + 2]); return m;
    };
    const p = at(32 * 1.35), q = at(32);
    return { line: p, fill: q, core: g.world.get(s.x, s.y) };
  });
  check('beside a Deep Spire the core hexagon draws ≥ 1.8× its fill (S-19, DSF 1)', px.core === 10 && px.line >= 1.8 * px.fill && px.line > 30,
    JSON.stringify({ ...px, at: info.at, d: info.d.toFixed(1) }));
  await page.close();
}

module.exports = { nodeChecks, browserChecks };
