// S-48a Kiln beam heat checks (D-129, heat.js). smoke.cjs calls nodeChecks + browserChecks. Node: 8 s ± 0.2 of steady
// Focus on Kiln rock overheats; heat cools at 2× when the beam is off or on Deep rock; during the 1.2 s the intent is on
// but no cell takes damage; heat restarts at 0.25; 60 s of steady fire is overheated 17 % ± 2; Wide and Overclock heat no
// faster; Drift = Surge; the Echo / other world.hit callers add none; nothing saved; the Kiln leg haul ≤ 1.20×.
// Browser: the arc is drawn round the core in the Kiln. Usage: node tests/heat.cjs [--browser]   (HEAT_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { haulProbe } = await import('../tools/haulrun.mjs');
  const { CELL, T, KILN_RING, KILN_HEAT_S, KILN_OVERHEAT_S, KILN_HEAT_RESTART } = await import('../src/config.js');
  const make = (mode = 'drift') => { const g = new Game({ seed: 4242, mode, audio: quiet }); g.undertow.off = true; g.god = true; return g; };
  /** Opens a 7×7 room round the first cell of `ring` with a 3-cell DENSE wall 2 cells east of the core; aims east. */
  const park = (g, ring) => {
    const w = g.world;
    let c = null;
    for (let y = 8; y < w.h - 8 && !c; y++) for (let x = 8; x < w.w - 8 && !c; x++) {
      let ok = true;
      for (let dy = -4; dy <= 4 && ok; dy++) for (let dx = -4; dx <= 4 && ok; dx++) if (w.ring(x + dx, y + dy) !== ring) ok = false;
      if (ok && (x * 31 + y * 17) % 97 === 0) c = { x, y };
    }
    for (let y = c.y - 3; y <= c.y + 3; y++) for (let x = c.x - 3; x <= c.x + 3; x++) w.cells[y * w.w + x] = T.EMPTY;
    const wall = [-1, 0, 1].map(d => (c.y + d) * w.w + c.x + 2);
    for (const i of wall) w.cells[i] = T.DENSE;
    const p = g.player; p.x = (c.x + 0.5) * CELL; p.y = (c.y + 0.5) * CELL; p.vx = p.vy = 0; p.angle = 0;
    g.pickups.length = 0;
    return { wall, c };
  };
  const fire = { move: { x: 0, y: 0 }, fire: true, aim: { x: 1, y: 0 } }, still = { move: { x: 0, y: 0 }, fire: false, aim: null };
  /** Steps `s` seconds; `heal` keeps the wall standing (its damage reset each frame). Returns the frames' heat states. */
  const run = (g, room, s, intent = fire, heal = true) => {
    const log = [];
    for (let t = 0; t < s - 1e-9; t += 1 / 60) {
      if (heal) for (const i of room.wall) g.world.damage[i] = 0;
      g.enemies.length = 0; g.spawnTimer = 99;
      g.update(1 / 60, intent); g.events.length = 0;
      log.push({ t: t + 1 / 60, heat: g.heat, over: g.heatState.over > 0, on: g.beam.on });
    }
    return log;
  };
  const firstOver = log => { const e = log.find(x => x.over); return e ? e.t : Infinity; };

  const a = make(), ra = park(a, KILN_RING), la = run(a, ra, 10), t0 = firstOver(la);
  check('S-48a heat: 8 s ± 0.2 of steady Focus on Kiln rock reaches an overheat', Math.abs(t0 - KILN_HEAT_S) <= 0.2, `${t0.toFixed(2)} s`);
  {
    const g = make(), room = park(g, KILN_RING);
    run(g, room, t0 + 1 / 120);
    const before = room.wall.map(i => g.world.damage[i]), log = run(g, room, KILN_OVERHEAT_S - 0.05, fire, false);
    const after = room.wall.map(i => g.world.damage[i]);
    check('S-48a heat: while overheated the intent is on but the beam is off and no cell takes damage',
      log.every(x => x.over && !x.on) && after.every((v, i) => v === before[i]), JSON.stringify({ frames: log.length, before, after }));
  }
  {
    const i0 = la.findIndex(x => x.over); let n = 0; while (!la[i0 + 1 + n].on) n++;
    const back = la[i0 + 1 + n]; // the first frame the beam is realized again (it has added one frame of heat)
    check('S-48a heat: an overheat holds the beam off 1.2 s, then heat restarts at 0.25', Math.abs(n / 60 - KILN_OVERHEAT_S) < 1.5 / 60 && Math.abs(back.heat - KILN_HEAT_RESTART) < 0.01,
      `${n} frames off, then heat ${back.heat.toFixed(3)}`);
  }
  {
    const g = make(), room = park(g, KILN_RING);
    g.heat = 0.5; run(g, room, 1, still);
    const off = g.heat;
    const d = make(), dr = park(d, 2); d.heat = 0.5; run(d, dr, 1);
    check('S-48a heat: cools at 2× (0.25 per s) with the beam off and on Deep rock (non-Kiln adds nothing)',
      Math.abs(off - 0.25) < 0.01 && Math.abs(d.heat - 0.25) < 0.01 && d.beam.on, `off ${off.toFixed(3)}, Deep ${d.heat.toFixed(3)}`);
  }
  {
    const g = make(), room = park(g, KILN_RING), log = run(g, room, 60), share = log.filter(x => x.over).length / log.length;
    check('S-48a heat: 60 s of steady fire is overheated 17 % ± 2 of the time', Math.abs(share - 0.17) <= 0.02, `${(share * 100).toFixed(1)} %`);
  }
  {
    const w = make(); w.research.wide = true; w.beamMode = 'wide';
    const tw = firstOver(run(w, park(w, KILN_RING), 12));
    const o = make(); o.buffs = ['overclock'];
    const to = firstOver(run(o, park(o, KILN_RING), 12));
    const s = make('surge'), ts = firstOver(run(s, park(s, KILN_RING), 12));
    check('S-48a heat: Wide and Overclock heat no faster than Focus; Drift = Surge',
      tw >= t0 - 1e-9 && Math.abs(to - t0) < 1e-6 && o.stat('beam') > a.stat('beam') && ts === t0, JSON.stringify({ focus: t0, wide: tw, overclock: to, surge: ts }));
  }
  {
    const g = make(), room = park(g, KILN_RING);
    for (let k = 0; k < 600; k++) { g.world.hit(room.c.x + 2, room.c.y, 0.01); run(g, room, 1 / 60, still); }
    const e = make(); e.research.echo = true; const er = park(e, KILN_RING); run(e, er, 5, still);
    check('S-48a heat: the Echo and other world.hit callers add none (only the core\'s beam heats)', g.heat === 0 && e.heat === 0 && !!e.echo,
      JSON.stringify({ direct: g.heat, echo: e.heat }));
  }
  {
    const hot = make(), room = park(hot, KILN_RING); run(hot, room, 5);
    const keys = g => JSON.stringify(Object.keys(g.toSave()));
    check('S-48a heat: nothing saved (toSave keys unchanged, no heat field)', hot.heat > 0.3 && keys(hot) === keys(make()) && !/heat/i.test(JSON.stringify(hot.toSave())),
      `heat ${hot.heat.toFixed(2)}`);
  }
  {
    const r = haulProbe(20, 3, 116);
    check('S-48a heat: tools/haulrun.mjs 20 3 116 median round trip heat on ÷ off ≤ 1.20 (Kiln leg)',
      r.key === 'heat' && r.kept >= 15 && r.median <= 1.2, `median ×${r.median.toFixed(3)}, max ×${r.max.toFixed(3)}, mean ×${r.mean.toFixed(3)}, ${r.kept}/20 pairs`);
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('heat: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  const r = await pg.evaluate(() => {
    const L = window.__lumen, g = L.game, w = g.world;
    L.dev.teleport(112, 0.6);
    const cx = Math.floor(g.player.x / 16), cy = Math.floor(g.player.y / 16);
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) if (w.solid(x, y) && w.get(x, y) !== 0) w.destroy(x, y);
    g.pickups.length = 0; g.god = true; g.heat = 0.7;
    let arcs = 0; const ctx = L.renderer.ctx, arc = ctx.arc.bind(ctx);
    ctx.arc = (x, y, rad, ...rest) => { if (rad === 22) arcs++; return arc(x, y, rad, ...rest); }; // r 22 is the heat arc's alone
    window.__heatArcs = () => arcs;
    return { ring: w.ring(cx, cy) };
  });
  await pg.waitForTimeout(300);
  const arcs = await pg.evaluate(() => { window.__lumen.game.heat = 0.7; return window.__heatArcs(); });
  if (shot) await pg.screenshot({ path: shot });
  check('S-48a heat: the heat arc is drawn round the core in the Kiln', r.ring === 4 && arcs > 0, JSON.stringify({ ...r, arcs }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) {
  let fail = 0;
  const report = (name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
  (async () => {
    await nodeChecks(report);
    if (process.argv.includes('--browser') || process.env.HEAT_SHOT) {
      const http = require('http'), fs = require('fs'), path = require('path'), { chromium } = require('playwright');
      const root = path.join(__dirname, '..'), types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
      const server = http.createServer((req, res) => { const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
        fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); res.end(); } else { res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); } }); });
      await new Promise(r => server.listen(0, r));
      const browser = await chromium.launch(), errors = [];
      await browserChecks(browser, `http://localhost:${server.address().port}/`, report, errors, process.env.HEAT_SHOT);
      report('no page errors', errors.length === 0, errors.join('; '));
      await browser.close(); server.close();
    }
    process.exit(fail ? 1 : 0);
  })();
}
