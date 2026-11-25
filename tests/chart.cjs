// S-52 Nexus Chart checks (D-143, chart.js). smoke.cjs calls nodeChecks + browserChecks. Node: level 1 costs exactly
// ≈24 ▲10, level 2 ⬟24 ▲10, no third, not without the ore; a 160 world can't buy it with a full bank; level 1 draws one
// arrow per explored flowing Shoal chunk in the window, along its flow, longer when faster, none for unexplored or calm
// chunks; vents only at level 2 and only once their cell is explored, brighter in the tell; ≤ 3 draw calls a frame;
// format 20 → 21 (chart 0); a saved level loads clamped (0 in a 160 world). Browser: the Nexus tab shows the row in a 256
// world, none in a 160 one; the charted minimap draws; screenshot (CHART_SHOT=path.png).
// Usage: node tests/chart.cjs [--browser]
const quiet = new Proxy({}, { get: () => () => {} });

/** A stub 2D context that records path segments and counts draw calls. */
function stubCtx() {
  const c = { calls: 0, segs: [], rects: [], alpha: [], at: null };
  return new Proxy(c, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'stroke' || k === 'fill') return () => { t.calls++; t.alpha.push(t.globalAlpha ?? 1); };
      if (k === 'moveTo') return (x, y) => { t.at = [x, y]; };
      if (k === 'lineTo') return (x, y) => { t.segs.push([t.at, [x, y]]); t.at = [x, y]; };
      if (k === 'rect') return (x, y, w, h) => t.rects.push([x, y, w, h, t.globalAlpha ?? 1]);
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { drawChartMarks, chartOn } = await import('../src/chart.js');
  const { miniWindow } = await import('../src/hud.js');
  const { KINDS, CELL, CHUNK } = await import('../src/config.js');
  const { ventPhase } = await import('../src/vent.js');
  const make = (size, seed = 4242) => new Game({ seed, mode: 'drift', audio: quiet, size });
  {
    const g = make(), bad = [];
    for (const k of KINDS) g.bank[k] = 9999;
    g.bank.tide = 0;
    if (g.canAffordNexus('chart') || g.buyNexus('chart')) bad.push('bought with no ≈');
    const steps = [{ tide: 24, prism: 10 }, { calx: 24, prism: 10 }];
    for (const step of steps) {
      for (const k of KINDS) g.bank[k] = 9999;
      const before = { ...g.bank }, light = g.nexusLight();
      if (!g.buyNexus('chart')) { bad.push('step refused'); continue; }
      for (const k of KINDS) if (before[k] - g.bank[k] !== (step[k] || 0)) bad.push(`${k} charged ${before[k] - g.bank[k]}`);
      if (g.nexusLight() !== light) bad.push('light changed');
    }
    for (const k of KINDS) g.bank[k] = 9999;
    if (g.canAffordNexus('chart') || g.buyNexus('chart') || g.nexusLevels.chart !== 2) bad.push('past 2');
    const s = make(160); for (const k of KINDS) s.bank[k] = 9999;
    if (chartOn(s) || s.canAffordNexus('chart') || s.buyNexus('chart')) bad.push('160 world bought');
    check('S-52 chart: level 1 = ≈24 ▲10, level 2 = ⬟24 ▲10 exactly, never a third, not without the ore, no light change; a 160 world never buys it',
      bad.length === 0, bad.join('; '));
  }
  {
    const g = make(), w = g.world, u = g.undertow, bad = [];
    // the core in the Shoal: the first flowing chunk whose centre is open enough
    let i0 = -1; for (let i = 0; i < w.chunksW * w.chunksH && i0 < 0; i++) if (u.flow[i * 2] || u.flow[i * 2 + 1]) i0 = i;
    const ccx = (i0 % w.chunksW) * CHUNK + 8, ccy = Math.floor(i0 / w.chunksW) * CHUNK + 8;
    g.player.x = ccx * CELL; g.player.y = ccy * CELL;
    const win = miniWindow(w, g.player.x, g.player.y, 140), sc = 140 / win.win;
    const x0 = win.ox / CELL, y0 = win.oy / CELL, x1 = x0 + win.win / CELL, y1 = y0 + win.win / CELL;
    const inWin = i => { const cx = (i % w.chunksW) * CHUNK, cy = Math.floor(i / w.chunksW) * CHUNK; return cx + CHUNK > x0 && cx < x1 && cy + CHUNK > y0 && cy < y1; };
    const flowing = [], calm = [];
    for (let i = 0; i < w.chunksW * w.chunksH; i++) if (inWin(i)) {
      const cx = (i % w.chunksW) * CHUNK, cy = Math.floor(i / w.chunksW) * CHUNK;
      if (w.ring(cx + 8, cy + 8) !== 3) continue;
      (u.flow[i * 2] || u.flow[i * 2 + 1] ? flowing : calm).push(i);
    }
    w.explored.fill(0);
    const want = flowing.filter((_, k) => k % 2 === 0); // explore one cell (a corner) of every other flowing chunk + every calm one
    for (const i of [...want, ...calm]) w.explored[(Math.floor(i / w.chunksW) * CHUNK + 15) * w.w + (i % w.chunksW) * CHUNK + 15] = 1;
    g.nexusLevels.chart = 0; g.chart = null;
    let m = stubCtx(); drawChartMarks(m, g, sc, win);
    if (m.calls) bad.push('level 0 drew');
    g.nexusLevels.chart = 1; g.stats.time = 100;
    m = stubCtx(); drawChartMarks(m, g, sc, win);
    if (g.chartArrows !== want.length) bad.push(`arrows ${g.chartArrows} want ${want.length}`);
    if (g.chartVents !== 0 || m.rects.length) bad.push('vents at level 1');
    // shafts: segs[3k] is chunk k's shaft; it points along the flow, and its length ∝ speed
    const listed = want.slice().sort((a, b) => a - b), ratio = [];
    listed.forEach((i, k) => {
      const [[ax, ay], [bx, by]] = m.segs[k * 3] || [[0, 0], [0, 0]], fx = u.flow[i * 2], fy = u.flow[i * 2 + 1];
      const len = Math.hypot(bx - ax, by - ay), sp = Math.hypot(fx, fy);
      if (((bx - ax) * fx + (by - ay) * fy) / (len * sp) < 0.999) bad.push(`chunk ${i} arrow off the flow`);
      ratio.push(len / sp);
    });
    if (Math.max(...ratio) - Math.min(...ratio) > 1e-6) bad.push('length not ∝ speed');
    if (m.calls > 3) bad.push(`${m.calls} draw calls`);
    // a newly explored chunk appears after the re-check interval, not before
    const late = flowing[1];
    if (late != null) {
      w.explored[(Math.floor(late / w.chunksW) * CHUNK) * w.w + (late % w.chunksW) * CHUNK] = 1;
      g.stats.time += 0.1; m = stubCtx(); drawChartMarks(m, g, sc, win); const early = g.chartArrows;
      g.stats.time += 0.5; m = stubCtx(); drawChartMarks(m, g, sc, win);
      if (early !== want.length || g.chartArrows !== want.length + 1) bad.push(`re-check ${early} → ${g.chartArrows}`);
    }
    check('S-52 chart: level 1 draws one arrow per explored flowing Shoal chunk in the window (none calm / unexplored), along the flow, length ∝ speed, ≤ 3 draw calls',
      bad.length === 0 && want.length > 0 && calm.length > 0, `${bad.join('; ')} (flowing ${flowing.length}, calm ${calm.length})`);
  }
  {
    const g = make(), w = g.world, v = g.vents, bad = [];
    const s0 = v.sites[0];
    g.player.x = (s0.x + 0.5) * CELL; g.player.y = (s0.y + 0.5) * CELL;
    const win = miniWindow(w, g.player.x, g.player.y, 140), sc = 140 / win.win;
    const x0 = win.ox / CELL, y0 = win.oy / CELL, x1 = x0 + win.win / CELL, y1 = y0 + win.win / CELL;
    const near = v.sites.filter(s => s.x >= x0 && s.x < x1 && s.y >= y0 && s.y < y1);
    w.explored.fill(0);
    const seen = near.filter((_, k) => k % 2 === 0);
    for (const s of seen) w.explored[s.y * w.w + s.x] = 1;
    g.nexusLevels.chart = 2; g.chart = null;
    let m = stubCtx(); drawChartMarks(m, g, sc, win);
    if (g.chartVents !== seen.length) bad.push(`vents ${g.chartVents} want ${seen.length}`);
    // find a time where s0 is in its tell: its dot is drawn bright and larger
    let t = 0; while (!(ventPhase(s0, t).tell > 0.5) && t < 20) t += 0.05;
    g.stats.time = t; m = stubCtx(); drawChartMarks(m, g, sc, win);
    const big = m.rects.filter(r => r[2] > 3).length, dim = m.rects.filter(r => r[2] <= 2).length;
    if (!(g.chartHot >= 1 && big === g.chartHot && big + dim === seen.length)) bad.push(`tell big ${big} dim ${dim} hot ${g.chartHot}`);
    if (m.calls > 3) bad.push(`${m.calls} draw calls`);
    check('S-52 chart: level 2 draws only seen vents (explored cells) in the window, a vent in its tell brighter and larger; ≤ 3 draw calls',
      bad.length === 0 && near.length > 1, bad.join('; ') + ` (near ${near.length})`);
  }
  {
    const old = make().toSave(); old.v = 20; delete old.nexus.chart;
    const up = upgradeSave(JSON.parse(JSON.stringify(old)));
    const s = make().toSave(); s.nexus.chart = 7;
    const big = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: JSON.parse(JSON.stringify(s)) }).nexusLevels.chart;
    s.nexus.chart = 'x';
    const bad = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: JSON.parse(JSON.stringify(s)) }).nexusLevels.chart;
    const s160 = make(160).toSave(); s160.nexus.chart = 2;
    const small = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: JSON.parse(JSON.stringify(s160)) }).nexusLevels.chart;
    check('S-52 chart: a format-20 save loads with chart 0 (radiance kept); a saved level loads clamped to 0–2, 0 in a 160 world',
      SAVE_FORMAT >= 21 && up.nexus.chart === 0 && up.nexus.radiance === old.nexus.radiance && big === 2 && bad === 0 && small === 0,
      JSON.stringify({ up: up.nexus, big, bad, small }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('chart: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(300);
  const row = await pg.evaluate(() => {
    const g = window.__lumen.game;
    Object.assign(g.bank, { tide: 30, prism: 12 });
    g.player.x = g.nexus.x; g.player.y = g.nexus.y;
    document.getElementById('matrix-btn').click();
    document.querySelector('#matrix .tabs button[data-tab="nexus"]').click();
    const r = document.querySelector('#upgrade-list [data-id="chart"]');
    const out = r ? { btn: r.querySelector('.buy').textContent.replace(/\s+/g, ' ').trim(), off: r.querySelector('.buy').disabled } : null;
    if (r) r.querySelector('.buy').click();
    const after = { lvl: g.nexusLevels.chart, tide: g.bank.tide, prism: g.bank.prism };
    document.getElementById('matrix-close').click();
    return { out, after };
  });
  check('S-52 chart: the Nexus tab shows the Chart row in a 256 world with both prices; buying it charges ≈24 ▲10',
    row.out && !row.out.off && /24/.test(row.out.btn) && /10/.test(row.out.btn) && row.after.lvl === 1 && row.after.tide === 6 && row.after.prism === 2,
    JSON.stringify(row));
  const drawn = await pg.evaluate(() => {
    const L = window.__lumen, g = L.game, w = g.world;
    g.nexusLevels.chart = 2; g.god = true;
    L.dev.teleport(102, 0.6);
    const cx = Math.floor(g.player.x / 32), cy = Math.floor(g.player.y / 32);
    for (let y = Math.max(0, cy - 80); y < Math.min(w.h, cy + 80); y++) for (let x = Math.max(0, cx - 80); x < Math.min(w.w, cx + 80); x++)
      if (Math.hypot(x - cx, y - cy) < 60 && !w.explored[y * w.w + x]) { w.explored[y * w.w + x] = 1; g.revealQueue.push(y * w.w + x); }
    return true;
  });
  await pg.waitForTimeout(900);
  const r = await pg.evaluate(() => ({ arrows: window.__lumen.game.chartArrows, vents: window.__lumen.game.chartVents }));
  if (shot) await pg.screenshot({ path: shot });
  check('S-52 chart: in play the charted minimap draws current arrows and seen vents', drawn && r.arrows > 0 && r.vents > 0, JSON.stringify(r));
  const small = await pg.evaluate(async () => {
    const { Game } = await import('/src/game.js'), L = window.__lumen;
    const au = new Proxy({}, { get: () => () => {} });
    const g = new Game({ seed: 77, mode: 'drift', size: 160, audio: au }), save = g.toSave();
    window.__lumen.game.demo = true;
    localStorage.setItem('lumencore.save.v1', JSON.stringify(save));
    return true;
  });
  await pg.reload(); await pg.waitForTimeout(300);
  const hidden = await pg.evaluate(() => {
    document.getElementById('continue')?.click();
    return new Promise(res => setTimeout(() => {
      const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y;
      document.getElementById('matrix-btn').click();
      document.querySelector('#matrix .tabs button[data-tab="nexus"]').click();
      res({ size: g.world.w, chart: !!document.querySelector('#upgrade-list [data-id="chart"]'), radiance: !!document.querySelector('#upgrade-list [data-id="radiance"]') });
    }, 300));
  });
  check('S-52 chart: a 160 world\'s Nexus tab has Radiance and no Chart row', small && hidden.size === 160 && !hidden.chart && hidden.radiance, JSON.stringify(hidden));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.CHART_SHOT, shot: process.env.CHART_SHOT });
