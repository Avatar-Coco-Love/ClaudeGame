// S-37 Anomalies found (D-098). smoke.cjs calls nodeChecks + browserChecks. Node: minimap dot states (unseen / charged /
// recharging / void); a Scanner ping marks a charged site in range and not a taken one (and a mark fades once its site is
// taken); the "touch it" hint line shows near a charged site until the first take. Browser: the minimap dot is drawn in the kind's
// colour; the chips sit under the bank panel, clear of the ◎ ⟂ ♪ ≡ row and the minimap, at 568×320 and 320×568 (touch).
// Usage: node tests/anomalyfound.cjs (node checks only)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { siteMapState, updateAnomalies } = await import('../src/anomaly.js');
  const { tryScan, markAlpha } = await import('../src/research.js');
  const { CELL, LIGHT_RADIUS } = await import('../src/config.js');
  const make = (seed = 4242) => new Game({ seed, mode: 'drift', audio: quiet });
  const at = (g, s) => s.y * g.world.w + s.x;

  // Dot states: unseen -> null; its cell lit once -> charged; taken -> recharging; a void site never shows.
  {
    const g = make(), s = g.anomaly.sites[0], st = [siteMapState(g, 0)];
    g.world.explored[at(g, s)] = 1; st.push(siteMapState(g, 0));
    g.anomaly.taken[0] = 999; st.push(siteMapState(g, 0));
    const v = g.anomaly.sites[1]; v.void = true; g.world.explored[at(g, v)] = 1; st.push(siteMapState(g, 1));
    check('S-37 minimap: a site shows once its cell was lit, filled while charged, hollow while recharging; a void one never',
      st.join() === ',charged,recharging,', JSON.stringify(st));
  }
  // Ping: the core 5 cells from site 0 (charged); site 1 moved into range and taken -> only site 0 is marked.
  {
    const g = make(); g.research.scanner = true;
    const s = g.anomaly.sites[0], other = g.anomaly.sites[1], p = g.player;
    p.x = (s.x + 5.5) * CELL; p.y = (s.y + 0.5) * CELL;
    other.x = s.x + 3; other.y = s.y + 3; g.anomaly.taken[1] = 999; // sites are ≥ 12 cells apart: put a taken one in range
    tryScan(g);
    const marks = g.scan.marks.filter(m => m.type === 'anomaly').map(m => m.site), m0 = g.scan.marks.find(m => m.site === 0);
    g.scan.age = (m0 ? m0.at : 0) + 0.01; const a0 = m0 ? markAlpha(g, m0) : 0;
    g.anomaly.taken[0] = 999; const a1 = m0 ? markAlpha(g, m0) : 0;
    check('S-37 ping: marks a charged site within 12 cells, not a taken one; the mark goes once its site is taken',
      marks.includes(0) && !marks.includes(1) && a0 > 0 && a1 === 0, JSON.stringify({ marks, a0: +a0.toFixed(2), a1 }));
  }
  // Hint: shown while a charged site is inside the core's light, until the first take this session.
  {
    const g = make(), [s, t] = g.anomaly.sites, p = g.player, seen = [];
    const go = (q, dx) => { p.x = (q.x + 0.5) * CELL + dx; p.y = (q.y + 0.5) * CELL; p.vx = p.vy = 0; updateAnomalies(g, 0.016); seen.push(g.anomaly.near ? 1 : 0); };
    go(s, LIGHT_RADIUS + 40); go(s, LIGHT_RADIUS - 8); g.world.cells[s.y * g.world.w + s.x] = 0; go(s, 0); go(t, LIGHT_RADIUS - 8);
    check('S-37 hint: "touch it" while a charged site is in the light, gone for the session after the first take',
      seen.join() === '0,1,0,0' && g.buffs.length === 1, `${seen.join()} buffs ${g.buffs}`);
  }
}

async function browserChecks(browser, url, check, errors) {
  // Minimap: a seen, charged site is a dot in its kind's colour (desktop). Seed pinned (B-060, D-100).
  {
    const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    pg.on('pageerror', e => errors.push('anomalyfound: ' + e.message));
    await pg.goto(url); await pg.waitForTimeout(200);
    await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} window.__rnd = Math.random; Math.random = () => 0.42; });
    await pg.click('#new-world'); await pg.evaluate(() => { Math.random = window.__rnd; }); await pg.waitForTimeout(200);
    const px = await pg.evaluate(async () => {
      const g = window.__lumen.game, s = g.anomaly.sites[0], w = g.world;
      s.kind = 'lodestone'; w.explored[s.y * w.w + s.x] = 1;
      for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r));
      const c = document.getElementById('minimap'), sc = c.width / (w.w * 32);
      return [...c.getContext('2d').getImageData(Math.floor((s.x + 0.5) * 32 * sc), Math.floor((s.y + 0.5) * 32 * sc), 1, 1).data].slice(0, 3);
    });
    check('S-37 minimap: a seen charged site draws a dot in its kind\'s colour (Lodestone violet)', px[2] > 200 && px[0] > 150 && px[1] < 180, px.join());
    await pg.close();
  }
  for (const [w, h] of [[568, 320], [320, 568]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const ph = await ctx.newPage();
    ph.on('pageerror', e => errors.push(`anomalyfound ${w}: ` + e.message));
    await ph.goto(url); await ph.waitForTimeout(200);
    await ph.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} window.__rnd = Math.random; Math.random = () => 0.42; });
    await ph.tap('#new-world'); await ph.evaluate(() => { Math.random = window.__rnd; }); await ph.waitForTimeout(200);
    const lay = await ph.evaluate(async () => {
      const g = window.__lumen.game; g.research.scanner = true; g.research.wide = true; g.buffs = ['overclock', 'lodestone', 'ballast'];
      g.player.y = g.nexus.y + 400; // out of the Nexus: no Matrix button
      for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r));
      const r = e => e.getBoundingClientRect(), hit = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
      const chips = [...document.querySelectorAll('#buffs .chip')].map(r), bank = r(document.querySelector('.top-left .bank'));
      const row = ['scan-btn', 'mode-btn', 'mute-btn', 'menu-btn', 'minimap'].map(id => [id, r(document.getElementById(id))]).filter(([, b]) => b.width > 0);
      return { n: chips.length, under: chips.every(c => c.top >= bank.bottom), inView: chips.every(c => c.right <= innerWidth && c.bottom <= innerHeight),
        hits: row.filter(([, b]) => chips.some(c => hit(c, b))).map(([id]) => id), row: row.length,
        names: getComputedStyle(document.querySelector('#buffs .chip .chip-name')).display };
    });
    check(`S-37 phone ${w}×${h}: 3 buff chips (glyph only) under the bank panel, clear of ◎ ⟂ ♪ ≡ and the minimap`,
      lay.n === 3 && lay.under && lay.inView && lay.hits.length === 0 && lay.row === 5 && lay.names === 'none', JSON.stringify(lay));
    await ctx.close();
  }
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
