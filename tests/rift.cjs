// S-57a Rift checks (D-152, D-156). smoke.cjs calls nodeChecks. Node only: the schedule is pure in seed + time and waits
// out weather; the site rules (own ring, 8–12 cells, rock only, no Anomaly / vent / Nexus); ore by ring; the close restores
// `prev` (cracked too) and keeps mined cells open; Drift = Surge and a mode switch keeps it open; a reload mid-rift skips it
// and nothing is saved; a Wake cancels it; the tools/eventrun.mjs gate passes on its 16 seeds.
// Browser: an open pocket is drawn and its toast shows. Usage: node tests/rift.cjs [--browser | --browser-only] (RIFT_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { riftStarts, updateRift, openRift, closeRift } = await import('../src/rift.js');
  const { weatherStarts } = await import('../src/weather.js');
  const C = await import('../src/config.js');
  const { RIFT_S, RIFT_EVERY_S, RIFT_R, RIFT_ORE, RIFT_MAJOR, WEATHER_S, NEXUS_RADIUS, CELL, T } = C;
  const make = (mode, seed = 4242) => { const g = new Game({ seed, mode, audio: quiet }); updateRift(g); return g; };
  /** Step play time in 1 s ticks to t1 (`each(g, t)` first); returns [{ t, open }] for every open / close. */
  const run = (g, t1, each = () => {}) => { const log = []; let last = null;
    for (let t = Math.ceil(g.stats.time); t <= t1; t++) { g.stats.time = t; each(g, t); updateRift(g);
      const o = g.rift.open ? `${g.rift.open.x},${g.rift.open.y}` : null; if (o !== last) { log.push({ t, open: o }); last = o; } }
    return log; };
  const at = (g, x, y) => { Object.assign(g.player, { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL }); };

  { // schedule: pure in the seed; gaps 240–360 s unless a weather event pushed the start to its end; none starts inside weather
    let ok = true, pushed = 0, info = '';
    for (let s = 1; s <= 40; s++) {
      const st = riftStarts(s * 31, 8), again = riftStarts(s * 31, 8), ws = weatherStarts(s * 31, 12);
      if (JSON.stringify(st) !== JSON.stringify(again)) ok = false;
      for (const t of st) { if (ws.some(w => t >= w && t < w + WEATHER_S)) { ok = false; info = `seed ${s * 31} start ${t} in weather`; }
        if (ws.some(w => Math.abs(t - (w + WEATHER_S)) < 1e-9)) pushed++; }
      st.forEach((t, i) => { const d = t - (st[i - 1] || 0); if (d < RIFT_EVERY_S[0] - WEATHER_S || d > RIFT_EVERY_S[0] + RIFT_EVERY_S[1] + WEATHER_S) ok = false; });
    }
    check('S-57a rift: the schedule is pure in the seed, never starts inside weather (a start there waits for its end)', ok && pushed > 0, info || `${pushed} of 320 starts waited for weather`);
  }
  { // Drift = Surge: the same times and the same pocket; 45 s open; a mode switch keeps it open
    const st = riftStarts(4242, 2), d = run(make('drift'), st[1] + 60), s = run(make('surge'), st[1] + 60);
    const g = make('drift'); run(g, Math.ceil(st[0]) + 5); g.setMode('surge'); updateRift(g);
    const len = d.length >= 2 && d[1].open === null && d[1].t - d[0].t === RIFT_S;
    check('S-57a rift: Drift and Surge open the same pocket at the same seeded times for 45 s; a mode switch keeps it open',
      JSON.stringify(d) === JSON.stringify(s) && d.length === 4 && d[0].t === Math.ceil(st[0]) && len && !!g.rift.open, `drift ${JSON.stringify(d)}`);
  }
  { // site rules and ore by ring, over many seeds and core spots in all five rings
    let n = 0, bad = '', byRing = [0, 0, 0, 0, 0];
    for (let s = 1; s <= 30; s++) {
      const g = make('drift', s * 7919), w = g.world;
      for (let ring = 0; ring < 5; ring++) {
        const d = [0, 36, 64, 92, 116][ring] + (s % 5), a = s * 1.7 + ring, x = Math.floor(w.cx + Math.cos(a) * d), y = Math.floor(w.cy + Math.sin(a) * d);
        if (w.ring(x, y) !== ring) continue;
        at(g, x, y); if (!openRift(g)) continue;
        const o = g.rift.open, dist = Math.hypot(o.x + 0.5 - g.player.x / CELL, o.y + 0.5 - g.player.y / CELL);
        const types = o.cells.map(c => w.get(c.x, c.y)), [maj, min] = RIFT_ORE[ring];
        const near = q => Math.max(Math.abs(q.x - o.x), Math.abs(q.y - o.y)) <= 1;
        if (o.ring !== ring || w.ring(o.x, o.y) !== ring) bad = `ring ${o.ring} ≠ ${ring}`;
        else if (dist < RIFT_R[0] || dist > RIFT_R[1]) bad = `distance ${dist.toFixed(2)}`;
        else if (!o.cells.every(c => c.prev === T.ROCK || c.prev === T.DENSE)) bad = `prev ${o.cells.map(c => c.prev)}`;
        else if (g.anomaly.sites.some(near) || g.vents.sites.some(near)) bad = 'an Anomaly / vent inside';
        else if (Math.hypot(o.x + 0.5 - w.cx, o.y + 0.5 - w.cy) < NEXUS_RADIUS / CELL + 2) bad = 'inside the Nexus';
        else if (types.filter(t => t === maj).length !== RIFT_MAJOR[ring] || types.filter(t => t === min).length !== 9 - RIFT_MAJOR[ring]) bad = `ore ${types} in ring ${ring}`;
        closeRift(g); n++; byRing[ring]++;
        if (bad) break;
      }
      if (bad) break;
    }
    check('S-57a rift: a pocket sits in the core\'s ring, 8–12 cells out, on rock only (no Anomaly, vent or Nexus), ore by ring',
      !bad && byRing.every(k => k >= 10), bad || `${n} pockets, by ring ${byRing}`);
  }
  { // close: a cracked cell reverts whole, a mined cell stays open, the rest go back to `prev`; ore lost
    const g = make('surge'), st = riftStarts(4242, 1)[0]; run(g, Math.ceil(st) + 1);
    const o = g.rift.open, w = g.world, [a, b] = o.cells;
    w.hit(a.x, a.y, w.hpAt(a.x, a.y, a.type) * 0.5); w.hit(b.x, b.y, 1e9);
    run(g, Math.ceil(st) + RIFT_S + 1);
    const rest = o.cells.slice(1).filter(c => c !== b);
    const ok = !g.rift.open && w.get(a.x, a.y) === a.prev && w.damageFrac(a.x, a.y) === 0 && w.get(b.x, b.y) === T.EMPTY &&
      o.cells.filter(c => c !== b).every(c => w.get(c.x, c.y) === c.prev) && rest.length === 7;
    check('S-57a rift: the close reverts standing cells to their old type (a cracked one whole); a mined cell stays open', ok,
      `cracked ${w.get(a.x, a.y)}/${a.prev} dmg ${w.damageFrac(a.x, a.y)}, mined ${w.get(b.x, b.y)}`);
  }
  { // a rift cell rolls its yield twice (D-156); a plain ore cell once
    const g = make('drift'), st = riftStarts(4242, 1)[0]; run(g, Math.ceil(st) + 1);
    const c = g.rift.open.cells[0], n0 = g.pickups.length; g.world.hit(c.x, c.y, 1e9); g.onCellBroken(c.x, c.y, c.type);
    const y = C.MATERIAL[c.type].yield, got = g.pickups.length - n0;
    check('S-57a rift: a rift ore cell drops two yield rolls', got >= 2 * y.min && got <= 2 * y.max, `${got} pickups (${y.min}–${y.max} a roll)`);
  }
  { // reload mid-rift: nothing saved, the pocket regenerates as rock, that rift is skipped; the next one opens
    const st = riftStarts(4242, 2), g = make('drift'); run(g, Math.ceil(st[0]) + 10);
    const o = g.rift.open, save = JSON.parse(JSON.stringify(g.toSave()));
    const h = new Game({ seed: 4242, mode: 'drift', audio: quiet, save }); updateRift(h);
    const rock = o.cells.every(c => h.world.get(c.x, c.y) === c.prev), skipped = !h.rift.open;
    h.stats.time = Math.ceil(st[1]) + 1; updateRift(h);
    check('S-57a rift: a reload mid-rift skips it (the pocket is rock again, no rift key saved); the next one still opens',
      o && rock && skipped && !!h.rift.open && !Object.keys(save).some(k => /rift/i.test(k)), `rock ${rock}, skipped ${skipped}, next ${!!h.rift.open}`);
  }
  { // a Wake (or the ending) closes the open rift; one due inside a Wake never opens
    const st = riftStarts(4242, 2).map(Math.ceil), wake = { core: { x: 0, y: 0 } };
    const g = make('surge'), log = run(g, st[0] + 20, (g, t) => { g.wake = t >= st[0] + 10 && t < st[0] + 12 ? wake : null; });
    const h = make('surge'), log2 = run(h, st[0] + 60, (g, t) => { g.wake = t >= st[0] - 5 && t < st[0] + 5 ? wake : null; });
    const e = make('drift'), log3 = run(e, st[0] + 5, (g, t) => { g.endSeq = t >= st[0] - 1 ? { t: 0 } : null; });
    check('S-57a rift: a Wake closes the open rift for good; none opens inside a Wake or the ending',
      log.length === 2 && log[1].t === st[0] + 10 && log[1].open === null && log2.length === 0 && log3.length === 0,
      `cut ${JSON.stringify(log)}; in wake ${JSON.stringify(log2)}; ending ${log3.length}`);
  }
  { // S-57b: the open chime plays at the open, the close chime at the close; the Scanner ping marks the pocket like ore
    const calls = [], spy = new Proxy({}, { get: (_, k) => () => calls.push(k) }), st = riftStarts(4242, 1).map(Math.ceil);
    const { tryScan } = await import('../src/research.js');
    const g = new Game({ seed: 4242, mode: 'surge', audio: spy }); updateRift(g); run(g, st[0]);
    const o = g.rift.open, opened = calls.filter(k => /^rift/.test(k)).join(',');
    let marked = 0;
    if (o) { at(g, o.x + 4, o.y); g.research.scanner = true; g.scan.cooldown = 0; tryScan(g);
      marked = o.cells.filter(c => g.scan && g.scan.marks.some(m => m.x === c.x && m.y === c.y)).length; }
    run(g, st[0] + RIFT_S + 1);
    const both = calls.filter(k => /^rift/.test(k)).join(',');
    check('S-57b rift: the open chime plays once at the open and the close chime once at the close; a Scanner ping marks all 9 pocket cells',
      !!o && opened === 'riftOpen' && both === 'riftOpen,riftClose' && marked === 9, `calls ${both}, marked ${marked}`);
  }
  { // the gate (D-156): tools/eventrun.mjs, Deep + Kiln, at its default 16 seeds × 10 min
    const out = require('child_process').execFileSync(process.execPath, [require('path').join(__dirname, '../tools/eventrun.mjs')], { encoding: 'utf8' });
    const line = out.trim().split('\n').pop();
    check('S-57a rift: the eventrun.mjs gate passes (haul on / off 1.04–1.12 each mode, modes within 0.05; Deep + Kiln, 16 seeds)',
      /: PASS/.test(line), out.trim().split('\n').filter(l => / on\/off /.test(l)).map(l => l.split(' (')[0]).join('; '));
  }
}
async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('rift: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const g = window.__lumen.game, ctx = window.__lumen.renderer.ctx, sr = ctx.strokeRect.bind(ctx);
    g.stats.time = g.rift.start + 0.1; window.__riftRects = 0;
    ctx.strokeRect = (...a) => { if (ctx.strokeStyle === '#e2d0ff') window.__riftRects++; return sr(...a); }; });
  await pg.waitForTimeout(400);
  if (shot) await pg.screenshot({ path: shot });
  const r = await pg.evaluate(() => ({ open: !!window.__lumen.game.rift.open, rects: window.__riftRects, toast: document.body.innerText.includes('A rift opened nearby') }));
  check('S-57a rift: an open pocket shimmers on screen and its toast shows', r.open && r.rects >= 9 && r.toast, JSON.stringify(r));
  // S-57b: the chevron shows only while the pocket is wholly off screen, only while open, and points at the pocket
  const ptr = await pg.evaluate(async () => { const L = window.__lumen, g = L.game, R = L.renderer, o = g.rift.open, wait = () => new Promise(f => setTimeout(f, 120));
    const out = { onScreen: !!R.riftPointer }, p = g.player, home = { x: p.x, y: p.y }, C = 32;
    Object.assign(p, { x: (o.x + 0.5) * C + 2 * R.w, y: (o.y + 0.5) * C }); p.vx = p.vy = 0; await wait(); await wait(); await wait(); await wait(); await wait(); // pocket two screen widths left of the core
    const q = R.riftPointer; out.off = !!q; out.left = !!q && q.x < R.w / 2 && Math.abs(Math.cos(q.a) + 1) < 0.2;
    g.stats.time = g.rift.start + 46; await wait(); out.closed = !!R.riftPointer || !!g.rift.open;
    Object.assign(p, home); return out; });
  check('S-57b rift: an edge chevron points to an open rift only while its pocket is off screen; none once it closes',
    !ptr.onScreen && ptr.off && ptr.left && !ptr.closed, JSON.stringify(ptr));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks: process.argv.includes('--browser-only') ? null : nodeChecks, browserChecks,
  browser: process.argv.includes('--browser') || process.argv.includes('--browser-only') || !!process.env.RIFT_SHOT, shot: process.env.RIFT_SHOT });
