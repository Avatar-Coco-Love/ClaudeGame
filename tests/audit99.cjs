// Audit 99 checks (browser). smoke.cjs calls browserChecks.
// B-086 (design 97, not reproduced in audit 99): a d 110 shot once seemed to draw no terrain near the core. Guard: after a
// dev teleport to d 110 on fixed seeds, a few seconds of moving + mining, every cached terrain chunk that isn't marked
// dirty must match a fresh paintChunk of the world as it is now (a stale chunk cache would draw old or missing rock).
// Usage: node tests/audit99.cjs
const SEEDS = [0.3, 0.5]; // Math.random values for the new world's seed; 0.3 lands in an open Kiln cave

async function browserChecks(browser, url, check, errors) {
  const rows = [];
  for (const s of SEEDS) {
    const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    pg.on('pageerror', e => errors.push('audit99: ' + e.message));
    await pg.goto(url); await pg.waitForTimeout(200);
    await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
    await pg.reload(); await pg.waitForTimeout(200);
    await pg.evaluate(v => { Math.random = () => v; }, s);
    await pg.click('#new-world'); await pg.waitForTimeout(200);
    await pg.evaluate(() => { const L = window.__lumen; L.game.god = true; L.dev.maxAll(); L.dev.teleport(110); });
    await pg.waitForTimeout(300); // the camera settles on the new spot
    const aim = await pg.evaluate(() => { // the screen point of the nearest breakable solid cell
      const L = window.__lumen, g = L.game, w = g.world, R = L.renderer, cx = Math.floor(g.player.x / 32), cy = Math.floor(g.player.y / 32);
      let best = null;
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
        const t = w.get(cx + dx, cy + dy), d = dx * dx + dy * dy;
        if ((t >= 1 && t <= 4 || t === 8) && (!best || d < best.d)) best = { d, x: (cx + dx + 0.5) * 32, y: (cy + dy + 0.5) * 32 };
      }
      return { x: (best.x - R.cam.x) * R.zoom + R.w / 2, y: (best.y - R.cam.y) * R.zoom + R.h / 2 };
    });
    await pg.mouse.move(aim.x, aim.y); await pg.mouse.down(); await pg.waitForTimeout(2500);
    for (const k of ['KeyD', 'KeyS', 'KeyA']) { await pg.keyboard.down(k); await pg.waitForTimeout(600); await pg.keyboard.up(k); }
    await pg.mouse.up(); await pg.waitForTimeout(100);
    rows.push(await pg.evaluate(async () => {
      const { paintChunk } = await import('/src/terrain.js');
      const L = window.__lumen, w = L.game.world, R = L.renderer;
      let checked = 0, stale = 0;
      for (const [key, ch] of R.chunks) {
        if (w.dirtyChunks.has(key)) continue;
        const t = document.createElement('canvas'); t.width = t.height = ch.canvas.width;
        paintChunk(w, t, key % w.chunksW, Math.floor(key / w.chunksW), R.chunkK);
        const a = ch.canvas.getContext('2d').getImageData(0, 0, t.width, t.height).data, b = t.getContext('2d').getImageData(0, 0, t.width, t.height).data;
        let diff = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 8) diff++;
        checked++; if (diff > 50) stale++;
      }
      return { mined: L.game.stats.mined, checked, stale };
    }));
    await pg.close();
  }
  check('B-086 guard: after a d 110 teleport + moving and mining, no cached terrain chunk differs from a fresh paint (2 seeds)',
    rows.every(r => r.checked >= 12 && r.stale === 0 && r.mined > 0), JSON.stringify(rows));
}

module.exports = { browserChecks };

if (require.main === module) {
  let fail = 0;
  const report = (name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
  (async () => {
    const http = require('http'), fs = require('fs'), path = require('path'), { chromium } = require('playwright');
    const root = path.join(__dirname, '..'), types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
    const server = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
      fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); } }); });
    await new Promise(r => server.listen(0, r));
    const browser = await chromium.launch(), errors = [];
    await browserChecks(browser, `http://localhost:${server.address().port}/`, report, errors);
    report('no page errors', errors.length === 0, errors.join('; '));
    await browser.close(); server.close();
    process.exit(fail ? 1 : 0);
  })();
}
