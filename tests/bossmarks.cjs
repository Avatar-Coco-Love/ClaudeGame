// S-62 boss marks checks (boss.js drawBossMarks / bossSting, ending.js). smoke.cjs calls nodeChecks + browserChecks. Node:
// the Chart's level 2 draws each unseen lair as a faint octagon (none at levels 0 / 1, none in a 160 world, a seen lair at
// full alpha); the sting plays once per wake (Surge) and once on the first plate (Drift), never on later plates; the ending
// summary counts bosses down on a 256 world only. Browser: Chart L2 minimap screenshot (BOSSMARK_SHOT=path.png).
// Usage: node tests/bossmarks.cjs [--browser]
const quiet = new Proxy({}, { get: () => () => {} });

function stubCtx() {
  const c = { strokes: [], fills: [] };
  return new Proxy(c, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'stroke') return () => t.strokes.push(t.globalAlpha ?? 1);
      if (k === 'fill') return () => t.fills.push(t.globalAlpha ?? 1);
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { drawBossMarks, PLATES, updateBosses } = await import('../src/boss.js');
  const { endingSummary } = await import('../src/ending.js');
  const { CELL, BOSS_CHART_ALPHA } = await import('../src/config.js');
  const make = (opts = {}) => { const g = new Game({ seed: 4242, mode: 'drift', audio: quiet, ...opts }); g.undertow.off = true; g.vents.off = true; g.enemies.length = 0; g.spawnTimer = 1e9; g.burrow.off = true; return g; };
  {
    const g = make(), res = {}, w = g.world;
    for (const lvl of [0, 1, 2]) { g.nexusLevels.chart = lvl; const m = stubCtx(); drawBossMarks(m, g, 0.1); res[lvl] = { n: g.chartLairs, s: m.strokes.length }; }
    const B = g.bosses.list[0]; w.explored[B.y * w.w + B.x] = 1;
    let m = stubCtx(); drawBossMarks(m, g, 0.1); res.seen = { n: g.chartLairs, alpha: m.strokes };
    g.nexusLevels.chart = 0; m = stubCtx(); drawBossMarks(m, g, 0.1); res.seen0 = m.strokes.length;
    const small = make({ size: 160 }); small.nexusLevels.chart = 2; m = stubCtx(); drawBossMarks(m, small, 0.1); res.small = { n: small.chartLairs, s: m.strokes.length };
    check('S-62: Chart level 2 marks each unseen lair as a faint octagon (none at 0 / 1, none in a 160 world); a seen lair stays full alpha at any level',
      g.bosses.list.length === 2 && res[0].n === 0 && res[0].s === 0 && res[1].n === 0 && res[1].s === 0 && res[2].n === 2 && res[2].s === 2
      && res.seen.n === 1 && res.seen.alpha.includes(1) && res.seen.alpha.includes(BOSS_CHART_ALPHA) && res.seen0 === 1 && res.small.n === 0 && res.small.s === 0,
      JSON.stringify(res));
  }
  {
    const stings = () => { const out = { n: 0 }; return { out, audio: new Proxy({}, { get: (_, k) => k === 'bossSting' ? () => out.n++ : () => {} }) }; };
    const s = stings(), g = make({ mode: 'surge', audio: s.audio }), B = g.bosses.list.find(b => b.ring === 4), res = {};
    const at = off => { g.player.x = (B.x + 0.5 - off) * CELL; g.player.y = (B.y + 0.5) * CELL; g.god = true; updateBosses(g, 0.016); };
    at(14); res.far = s.out.n; at(5); res.wake = s.out.n; at(5); at(4); res.stay = s.out.n; at(14); at(5); res.again = s.out.n;
    g.setMode('drift'); at(5); res.drift = s.out.n;
    const d = stings(), h = make({ audio: d.audio }), C = h.bosses.list.find(b => b.ring === 4);
    for (let n = 0; n < 3; n++) { const [i, j] = PLATES[C.lit]; h.world.destroy(C.x + i, C.y + j); res['plate' + n] = d.out.n; }
    check('S-62 sting: once each time a boss wakes (Surge; not while it stays awake, not in Drift); in Drift once on the first plate, never on later ones',
      res.far === 0 && res.wake === 1 && res.stay === 1 && res.again === 2 && res.drift === 2 && res.plate0 === 1 && res.plate1 === 1 && res.plate2 === 1, JSON.stringify(res));
  }
  {
    const g = make(), a = endingSummary(g); g.bosses.list[0].down = true; const b = endingSummary(g), c = endingSummary(make({ size: 160 }));
    check('S-62 ending: the summary counts bosses down "n / 2" on a 256 world, no line on a 160 world',
      a.bosses === 0 && a.bossN === 2 && b.bosses === 1 && c.bosses === null, JSON.stringify({ a: [a.bosses, a.bossN], b: b.bosses, c: c.bosses }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('bossmarks: ' + e.message));
  await pg.goto(url + (url.includes('?') ? '&' : '?') + 'seed=4242'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  const { CELL } = await import('../src/config.js');
  await pg.evaluate(C => { // stand 30 cells from the Crucible (Nexus side) so its lair falls in the minimap window, unseen
    const g = window.__lumen.game, B = g.bosses.list.find(b => b.ring === 4), w = g.world, d = Math.hypot(w.cx - B.x, w.cy - B.y);
    g.player.x = (B.x + (w.cx - B.x) / d * 30 + 0.5) * C; g.player.y = (B.y + (w.cy - B.y) / d * 30 + 0.5) * C;
    g.god = true; g.spawnTimer = 1e9; g.enemies.length = 0; g.nexusLevels.chart = 2;
  }, CELL);
  await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => ({ lairs: window.__lumen.game.chartLairs }));
  if (shot) await pg.screenshot({ path: shot });
  check('S-62: in the page, Chart level 2 draws an unseen lair on the minimap', r.lairs >= 1, JSON.stringify(r));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };

if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.BOSSMARK_SHOT, shot: process.env.BOSSMARK_SHOT });
