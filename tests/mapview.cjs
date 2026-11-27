// D-191 map view checks (owner feedback, session 153). smoke.cjs calls browserChecks. Desktop: a click on the minimap
// opens the map (≥ 3× the minimap's side, the core drawn), never fires the beam, the world holds still while it is open;
// a click on it closes it; N opens and Escape closes. Phone (landscape, touch): a tap on the minimap opens the map and
// starts no aim stick; a tap closes it. Usage: node tests/mapview.cjs [--browser] (MAP_SHOT=path for a screenshot)
async function browserChecks(browser, url, check, errors, shot) {
  const st = pg => pg.evaluate(() => { const L = window.__lumen, g = L.game, b = document.getElementById('bigmap'), m = document.getElementById('minimap').getBoundingClientRect();
    const d = b.getContext('2d').getImageData(0, 0, b.width, b.height).data; let gold = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i + 1] > 190 && d[i + 1] < 225 && d[i + 2] < 90) gold++;
    return { open: !document.getElementById('mapview').classList.contains('hidden'), side: b.getBoundingClientRect().width, mini: m.width,
      t: g.stats.time, firing: !!L.input.mouse.down, aim: !!L.input.sticks.aim, gold }; });
  { // desktop
    const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    pg.on('pageerror', e => errors.push('mapview: ' + e.message));
    await pg.goto(url); await pg.waitForTimeout(200);
    await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
    await pg.reload(); await pg.waitForTimeout(200);
    await require('./spire.cjs').pinnedNewWorld(pg); await pg.waitForTimeout(300);
    await pg.click('#minimap'); await pg.waitForTimeout(100);
    const a = await st(pg); await pg.waitForTimeout(400); const a2 = await st(pg);
    if (shot) await pg.screenshot({ path: shot });
    await pg.mouse.click(20, 400); await pg.waitForTimeout(150);
    const b = await st(pg); await pg.waitForTimeout(300); const b2 = await st(pg);
    await pg.keyboard.press('KeyN'); await pg.waitForTimeout(150); const c = await st(pg);
    await pg.setViewportSize({ width: 900, height: 420 }); await pg.waitForTimeout(150); // audit 154: resized (or a phone turned) while open
    const fit = await pg.evaluate(() => ({ h: document.getElementById('bigmap').getBoundingClientRect().height, bottom: document.querySelector('#mapview small').getBoundingClientRect().bottom }));
    await pg.setViewportSize({ width: 1280, height: 800 }); await pg.waitForTimeout(100);
    check('Audit 154 map: resized while open, it re-fits (560 → ≤ 380 px at 900×420, the close line stays on screen)',
      c.open && fit.h <= 380 && fit.h >= 300 && fit.bottom <= 420, JSON.stringify(fit));
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(150); const e = await st(pg);
    check('D-191 map: a click on the minimap opens the map (≥ 3× its side, core drawn), no beam, world held; a click closes it; N opens, Escape closes',
      a.open && a.side >= 3 * a.mini && a.gold > 0 && !a.firing && a2.t === a.t && !b.open && b2.t > b.t && c.open && !e.open,
      JSON.stringify({ a, a2: a2.t, b, b2: b2.t, c: c.open, e: e.open }));
    await pg.close();
  }
  { // phone, landscape, touch
    const pg = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
    pg.on('pageerror', e => errors.push('mapview phone: ' + e.message));
    await pg.goto(url); await pg.waitForTimeout(200);
    await require('./spire.cjs').pinnedNewWorld(pg); await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => { const b = document.getElementById('minimap').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
    await pg.touchscreen.tap(r.x, r.y); await pg.waitForTimeout(150);
    const a = await st(pg);
    await pg.touchscreen.tap(30, 200); await pg.waitForTimeout(150);
    const b = await st(pg);
    check('D-191 map (phone): a tap on the minimap opens the map (≥ 3× its side) and starts no aim stick; a tap closes it',
      a.open && !a.aim && a.side >= 3 * a.mini && !b.open, JSON.stringify({ a, b: b.open }));
    await pg.close();
  }
  await legendChecks(browser, url, check, errors, shot);
}

// S-76: the legend lists exactly the kinds drawn (a Beacon placed adds it); all 13 kinds (S-77a: + Decoy) fit at 320 × 568 and 568 × 320,
// Large text on and off: on screen, clear of the map and of each other, no page scroll, portrait ≤ 4 lines.
async function legendChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true });
  pg.on('pageerror', e => errors.push('maplegend: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await require('./spire.cjs').pinnedNewWorld(pg); await pg.waitForTimeout(300);
  const listed = () => pg.evaluate(() => { const L = window.__lumen; L.mapView.close(); L.mapView.show();
    return { shown: [...document.querySelectorAll('.maplegend .lg')].map(e => e.dataset.kind), drawn: [...L.mapView.kinds.keys()] }; });
  const a = await listed();
  await pg.evaluate(() => { const g = window.__lumen.game; window.__lumen.mapView.close(); const w = g.world, cx = Math.floor(g.player.x / 32), cy = Math.floor(g.player.y / 32), i = cy * w.w + cx + 1; g.beacons.push({ i, x: (cx + 1.5) * 32, y: (cy + 0.5) * 32, r: 140 }); });
  const b = await listed();
  await pg.evaluate(() => window.__lumen.mapView.close());
  const closed = await pg.evaluate(() => [...document.querySelectorAll('.maplegend')].every(e => !e.offsetParent || !e.getClientRects().length));
  const same = x => x.shown.length === x.drawn.length && x.drawn.every(k => x.shown.includes(k));
  check('S-76 legend: lists exactly the kinds drawn (Nexus, no Beacon); a Beacon placed adds "Beacon"; hidden while the map is closed',
    same(a) && a.shown.includes('nexus') && !a.shown.includes('beacon') && same(b) && b.shown.includes('beacon') && closed, JSON.stringify({ a, b, closed }));
  const fit = [];
  for (const [w, h] of [[320, 568], [568, 320]]) for (const large of [false, true]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(100);
    const r = await pg.evaluate(async large => {
      const { allKinds } = await import('./src/maplegend.js'), L = window.__lumen;
      document.documentElement.classList.toggle('text-large', large);
      L.mapView.close(); L.mapView.show(); L.mapView.buildLegend(allKinds());
      const m = document.getElementById('bigmap').getBoundingClientRect(), es = [...document.querySelectorAll('.maplegend .lg')].map(e => e.getBoundingClientRect());
      const hit = (p, q) => p.left < q.right && p.right > q.left && p.top < q.bottom && p.bottom > q.top;
      const on = es.every(e => e.left >= 0 && e.top >= 0 && e.right <= innerWidth && e.bottom <= innerHeight);
      const clear = es.every(e => !hit(e, m)), apart = es.every((e, i) => es.every((f, j) => i === j || !hit(e, f)));
      const close = document.querySelector('#mapview small').getBoundingClientRect(), smallOk = close.bottom <= innerHeight && es.every(e => !hit(e, close));
      const lines = new Set(es.map(e => Math.round(e.top))).size, se = document.scrollingElement;
      return { n: es.length, on, clear, apart, smallOk, lines, scroll: se.scrollWidth > innerWidth || se.scrollHeight > innerHeight };
    }, large);
    const ok = r.n === 13 && r.on && r.clear && r.apart && r.smallOk && !r.scroll && (w > h || r.lines <= 4);
    fit.push(ok ? '' : `${w}x${h}${large ? 'L' : ''} ${JSON.stringify(r)}`);
    if (shot && !large) await pg.screenshot({ path: shot.replace(/(\.png)?$/, `-legend-${w}x${h}.png`) });
  }
  check('S-76 legend: all 13 kinds at 320×568 and 568×320, Large text on and off: on screen, clear of the map, the close line and each other, no scroll, portrait ≤ 4 lines',
    fit.every(f => !f), fit.filter(Boolean).join(' | '));
  await pg.close();
}

module.exports = { browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks: null, browserChecks, browser: true, shot: process.env.MAP_SHOT });
