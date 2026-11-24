// S-38 PWA checks (D-103), run by smoke.cjs. Node: the manifest parses, start_url/scope are relative, the icons are PNGs at
// their sizes, and the Pages deploy ships every file the worker and manifest need (B-020). Browser: load online, wait for
// the worker and its warm cache (named lumen-<VERSION>), go offline, reload → the title renders and New World starts with
// no page errors. Proved once to fail with registration removed (offline reload = Chromium's error page, no #title).
// Usage: node tests/pwa.cjs   (SHOTS=dir writes pwa-offline-title.png)
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function nodeChecks(check) {
  let m = null;
  try { m = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8')); } catch (e) { m = null; }
  const rel = u => typeof u === 'string' && !/^[a-z]+:|^\//i.test(u);
  check('S-38: manifest parses, standalone, relative start_url and scope, dark background',
    !!m && m.short_name === 'Lumen Core' && m.display === 'standalone' && rel(m.start_url) && rel(m.scope) && m.background_color === '#03040c',
    m ? `start ${m.start_url}, scope ${m.scope}` : 'missing or bad JSON');
  const icons = (m && m.icons) || [], bad = [];
  for (const ic of icons) {
    const f = path.join(ROOT, ic.src); let w = 0, h = 0;
    if (fs.existsSync(f)) { const b = fs.readFileSync(f); if (b.toString('ascii', 1, 4) === 'PNG') { w = b.readUInt32BE(16); h = b.readUInt32BE(20); } }
    if (ic.sizes !== `${w}x${h}`) bad.push(`${ic.src} ${w}x${h} ≠ ${ic.sizes}`);
  }
  const sizes = icons.map(i => i.sizes + (i.purpose === 'maskable' ? 'm' : ''));
  check('S-38: icons 192, 512 and maskable 512 exist as PNGs at their sizes',
    bad.length === 0 && ['192x192', '512x512', '512x512m'].every(s => sizes.includes(s)), bad.join('; ') || sizes.join(', '));
  const yml = fs.readFileSync(path.join(ROOT, '.github/workflows/pages.yml'), 'utf8');
  const cp = (yml.match(/cp -r ([^\n]+) _site\//) || [])[1] || '', shipped = new Set(cp.split(/\s+/));
  const need = ['sw.js', 'manifest.webmanifest', ...new Set(icons.map(i => i.src.split('/')[0]))];
  const missing = need.filter(f => !shipped.has(f));
  check('S-38: the Pages deploy ships sw.js, the manifest and the icons (B-020)', missing.length === 0, missing.length ? 'missing ' + missing.join(', ') : cp);
}

async function browserChecks(browser, url, check, errors, shots) {
  const { VERSION } = await import('../src/config.js');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  try {
    await page.goto(url);
    const warm = await page.evaluate(async () => {
      const ready = await Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise(r => setTimeout(r, 5000, false))]);
      if (!ready) return { names: await caches.keys(), n: 0, ready };
      for (let i = 0; i < 100; i++) { // the worker caches what the page loaded before it existed (warm list)
        const names = await caches.keys(), c = names.length && await caches.open(names[0]);
        const keys = c ? (await c.keys()).map(r => new URL(r.url).pathname) : [];
        if (keys.includes('/') && keys.includes('/src/main.js') && keys.includes('/style.css')) return { names, n: keys.length };
        await new Promise(r => setTimeout(r, 50));
      }
      return { names: await caches.keys(), n: 0 };
    });
    check('S-38: the worker registers and caches the page it was loaded from, in cache lumen-<VERSION>',
      warm.n > 0 && warm.names.length === 1 && warm.names[0] === 'lumen-' + VERSION, JSON.stringify(warm));
    await ctx.setOffline(true);
    await page.reload().catch(() => {}); await page.waitForTimeout(500); // without the worker: ERR_INTERNET_DISCONNECTED
    const title = await page.isVisible('#title').catch(() => false);
    const ver = title ? await page.textContent('#version') : '';
    if (shots) await page.screenshot({ path: path.join(shots, 'pwa-offline-title.png') });
    await page.evaluate(() => { window.__rnd = Math.random; Math.random = () => 0.42; }).catch(() => {});
    if (title) { await page.click('#new-world'); await page.waitForTimeout(300); }
    const started = title && await page.evaluate(() => !!window.__lumen?.game && !window.__lumen.game.demo &&
      document.getElementById('title').classList.contains('hidden')).catch(() => false);
    check('S-38: offline reload shows the title, New World starts, no page errors', title && started && errs.length === 0,
      `title ${title} (${ver}), started ${started}, errors ${errs.length ? errs.join(' | ') : 0}`);
  } finally {
    errors.push(...errs.map(e => 'pwa: ' + e));
    await ctx.close();
  }
}

module.exports = { nodeChecks, browserChecks };

if (require.main === module) {
  const http = require('http');
  const { chromium } = require('playwright');
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  let failed = 0;
  const check = (name, ok, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
  (async () => {
    nodeChecks(check);
    await new Promise(r => server.listen(0, r));
    const browser = await chromium.launch();
    try { await browserChecks(browser, `http://localhost:${server.address().port}/`, check, [], process.env.SHOTS); }
    finally { await browser.close(); server.close(); }
    process.exit(failed ? 1 : 0);
  })();
}
