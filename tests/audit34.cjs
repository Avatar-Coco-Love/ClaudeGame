// Audit 34 checks (B-027): repeated glowing shapes are sprites, not one shadowBlur draw each. smoke.cjs calls this.
// A shadowBlur fill cost ~3.4 ms on headless Chromium's canvas: 30 floor pickups took a 1280×800 frame from 22 to 120 ms,
// a 44-glyph Scanner ping to 148 ms (`09`, session 34). The check counts draws made while a shadow is set, so it is exact.
async function browserChecks(browser, url, check, errors) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('audit34: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);

  const r = await pg.evaluate(async () => {
    const { game: g, renderer: R } = window.__lumen, P = CanvasRenderingContext2D.prototype;
    g.demo = true; // never saved
    // Count, on the main canvas only, the draws made while shadowBlur > 0 and the drawImage calls, per draw step.
    const ops = ['fill', 'stroke', 'fillText', 'fillRect', 'strokeRect'], orig = {}, n = { shadowed: 0, images: 0 };
    for (const k of [...ops, 'drawImage']) {
      orig[k] = P[k];
      P[k] = function (...a) {
        if (this === R.ctx) { if (k === 'drawImage') n.images++; else if (this.shadowBlur > 0) n.shadowed++; }
        return orig[k].apply(this, a);
      };
    }
    const measure = fn => { n.shadowed = 0; n.images = 0; fn(); return { ...n }; };
    const ctx = R.ctx, vw = R.w / R.zoom, vh = R.h / R.zoom, left = R.cam.x - vw / 2, top = R.cam.y - vh / 2;
    const inWorld = fn => { ctx.save(); ctx.translate(R.w / 2, R.h / 2); ctx.scale(R.zoom, R.zoom); ctx.translate(-R.cam.x, -R.cam.y); fn(); ctx.restore(); };
    // 120 pickups of all three kinds, all on screen.
    const kinds = ['shard', 'prism', 'lumen'], saved = g.pickups.splice(0);
    for (let i = 0; i < 120; i++) g.pickups.push({ x: R.cam.x - 200 + (i % 20) * 20, y: R.cam.y - 60 + Math.floor(i / 20) * 20, vx: 0, vy: 0, kind: kinds[i % 3], age: 1, r: 4, kept: true });
    const pick = measure(() => inWorld(() => R.drawPickups(ctx, left, top, vw, vh)));
    g.pickups.splice(0, g.pickups.length, ...saved);
    // A ping holding 40 marks (cells re-typed to ore so markAlpha shows them), ring finished so only glyphs draw.
    const w = g.world, cx = Math.floor(R.cam.x / 32), cy = Math.floor(R.cam.y / 32), marks = [];
    for (let i = 0; i < 40; i++) {
      const x = cx - 10 + (i % 10) * 2, y = cy - 4 + Math.floor(i / 10) * 2, type = [3, 4, 8, 7][i % 4];
      w.cells[y * w.w + x] = type; marks.push({ x, y, type, d: 0, at: 0 });
    }
    g.scan = { cooldown: 20, age: 1, x: R.cam.x, y: R.cam.y, ring: false, marks, end: 6 };
    const scan = measure(() => inWorld(() => R.drawScan(ctx)));
    for (const k of Object.keys(orig)) P[k] = orig[k];
    return { pick, scan, cell: 32 === (await import('./src/config.js')).CELL };
  });
  check('120 on-screen pickups: no shadowBlur draws, one sprite each (B-027)',
    r.cell && r.pick.shadowed === 0 && r.pick.images >= 120, JSON.stringify(r.pick));
  check('a 40-glyph Scanner ping: no shadowBlur draws, one sprite per glyph (B-027)',
    r.cell && r.scan.shadowed === 0 && r.scan.images >= 40, JSON.stringify(r.scan));
  await pg.close();
}

module.exports = { browserChecks };
