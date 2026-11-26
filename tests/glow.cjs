// S-25 beacon floor glow checks (D-061), run by smoke.cjs. A big open floor is carved 18 cells east of the Nexus with one
// wall cell left standing 3 cells from the beacon; the core is parked 11 cells west of the beacon so only the beacon lights
// the samples. Luma is the mean of a 5×5 screen patch at a cell centre (grid lines run on even cell edges, never there).
const { newWorld } = require('./pinworld.cjs');
async function measure(pg) {
  return pg.evaluate(() => {
    const { game: g, renderer: R, input } = window.__lumen, w = g.world, C = 32;
    g.demo = true;
    window.requestAnimationFrame = () => 0; // frames below are drawn by hand
    const bx = Math.floor(g.nexus.x / C) + 18, by = Math.floor(g.nexus.y / C);
    for (let y = by - 12; y <= by + 12; y++) for (let x = bx - 12; x <= bx + 12; x++) if (w.solid(x, y)) w.destroy(x, y);
    w.cells[w.idx(bx, by + 3)] = 1; w.markDirty(bx, by + 3); // one rock cell (T.ROCK) inside the pool
    const b = { x: (bx + 0.5) * C, y: (by + 0.5) * C, r: 140 };
    g.beacons.length = 0; g.beacons.push({ i: by * w.w + bx, ...b });
    Object.assign(g.player, { x: b.x - 11 * C, y: b.y, vx: 0, vy: 0 });
    g.enemies = []; g.pickups.length = 0; g.particles.length = 0; g.beam.on = false;
    const luma = (wx, wy) => {
      const p = R.worldToScreen(wx, wy), d = R.ctx.getImageData(Math.round(p.x * R.dpr) - 2, Math.round(p.y * R.dpr) - 2, 5, 5).data;
      let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      return +(s / 25).toFixed(1);
    };
    const shot = () => { R.cam.x = b.x; R.cam.y = b.y; g.shake = 0; R.draw(0, input); R.cam.x = b.x; R.cam.y = b.y; R.draw(0, input);
      return { inside: luma(b.x + 3 * C, b.y), outside: luma(b.x + 140 + 3 * C, b.y), wall: luma(b.x, b.y + 3 * C) }; };
    const glow = R.beaconGlow;
    R.beaconGlow = 0; const off = shot();
    R.beaconGlow = glow; const on = shot();
    // B-104: a big union box (pool in the middle of the view), then a smaller one (camera pans so the pool is clipped at
    // the view's left / top edge); every layer texel past the new lw × lh must be clear, or the blit can sample it.
    const stale = () => { R.cam.x = b.x; R.cam.y = b.y; g.shake = 0; R.draw(0, input);
      R.cam.x = b.x + R.w / R.zoom / 2 - 40; R.cam.y = b.y + R.h / R.zoom / 2 - 40; R.draw(0, input);
      const L = R.glowLayer, [lw, lh] = R.glowSize, d = L.getContext('2d').getImageData(0, 0, L.width, L.height).data;
      let n = 0; for (let y = 0; y < L.height; y++) for (let x = 0; x < L.width; x++) if ((x >= lw || y >= lh) && d[(y * L.width + x) * 4 + 3]) n++;
      return { lw, lh, W: L.width, H: L.height, n }; };
    return { off, on, glow, wallCell: w.solid(bx, by + 3), stale: stale() };
  });
}

async function browserChecks(browser, url, check, errors, shots) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('glow: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(200);
  const m = await measure(pg);
  if (shots) await pg.screenshot({ path: `${shots}/beacon-glow.png` });
  check('a beacon pool lifts its open floor: 3 cells in ≥ 2× the floor 3 cells outside the pool (S-25, D-061)',
    m.on.inside >= 2 * m.on.outside && m.on.inside > m.off.inside, JSON.stringify(m));
  check('the floor glow draws under the walls: a wall in the pool within 1 luma of no glow (S-25)',
    m.wallCell && Math.abs(m.on.wall - m.off.wall) <= 1 && m.on.wall > m.on.inside, JSON.stringify({ off: m.off.wall, on: m.on.wall }));
  check('the glow layer is clear past this frame\'s box and keeps a 1-texel margin (B-104: no stale edge lines on phones)',
    m.stale.n === 0 && m.stale.lw < m.stale.W && m.stale.lh < m.stale.H && m.stale.lw > 0, JSON.stringify(m.stale));
  await pg.close();
}

module.exports = { browserChecks, measure };
