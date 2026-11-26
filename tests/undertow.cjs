// S-47 Undertow checks (D-124, undertow.js). smoke.cjs calls nodeChecks + browserChecks. Node: the field is the seed's
// (same seed, same currents; only Shoal chunks flow, about half calm, 30–55 px/s, 8 directions; none in a 160 world); in
// a current the realized velocity differs from the intended while the intent stays zero; a calm chunk adds nothing; the
// ease takes 0.5 s; Drift and Surge push the same; pickups drift at half; nothing is saved; tools/haulrun.mjs median
// round trip ≤ 1.15× with it off. Browser: dashes on screen ≤ 30 at High, ≤ 15 at Low, inside a flowing chunk.
// Usage: node tests/undertow.cjs   (UNDERTOW_SHOT=path.png to keep the screenshot)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { undertowField, updateUndertow } = await import('../src/undertow.js');
  const { haulProbe } = await import('../tools/haulrun.mjs');
  const { CELL, CHUNK, T, UNDERTOW_SPEED, UNDERTOW_EASE_S } = await import('../src/config.js');
  const make = (mode = 'drift', seed = 4242, size) => new Game({ seed, mode, audio: quiet, ...(size ? { size } : {}) });
  const flowing = g => { const f = g.undertow.flow, out = []; for (let i = 0; i < f.length / 2; i++) if (f[2 * i] || f[2 * i + 1]) out.push(i); return out; };
  const centre = (g, i) => ({ x: (i % g.world.chunksW) * CHUNK + CHUNK / 2, y: Math.floor(i / g.world.chunksW) * CHUNK + CHUNK / 2 });
  /** Opens a (2r+1)² room round a chunk's centre and parks the core there at rest; drops all pickups. */
  const park = (g, i, r = 5) => {
    const c = centre(g, i), w = g.world;
    for (let y = c.y - r; y <= c.y + r; y++) for (let x = c.x - r; x <= c.x + r; x++) if (w.solid(x, y)) w.cells[y * w.w + x] = T.EMPTY;
    const p = g.player; p.x = (c.x + 0.5) * CELL; p.y = (c.y + 0.5) * CELL; p.vx = p.vy = 0; g.pickups.length = 0; g.god = true;
    return p;
  };
  const still = { move: { x: 0, y: 0 }, fire: false, aim: null };
  const step = (g, s) => { for (let t = 0; t < s - 1e-9; t += 1 / 60) { g.update(1 / 60, still); g.events.length = 0; } };

  // The field: seed data only; Shoal chunks only; calm about half; speeds and 8 directions in band; none at 160.
  {
    const a = make(), b = make(), c = make('drift', 777);
    const same = a.undertow.flow.every((v, i) => v === b.undertow.flow[i]), differs = a.undertow.flow.some((v, i) => v !== c.undertow.flow[i]);
    let shoal = 0, flow = 0, bad = 0;
    for (let s = 1; s <= 8; s++) {
      const g = make('drift', s * 7919), f = g.undertow.flow, w = g.world, locks = new Set(g.locks.tides.map(L => L.chunk)); // S-59 (D-162): a Tide Lock's chunk flows too
      for (let i = 0; i < f.length / 2; i++) {
        const { x, y } = centre(g, i), sp = Math.hypot(f[2 * i], f[2 * i + 1]), inShoal = w.ring(x, y) === 3;
        if (inShoal) shoal++;
        if (!sp) continue;
        flow++;
        const dir = Math.atan2(f[2 * i + 1], f[2 * i]) / (Math.PI / 4);
        if ((!inShoal && !locks.has(i)) || sp < UNDERTOW_SPEED[0] - 1e-3 || sp > UNDERTOW_SPEED[0] + UNDERTOW_SPEED[1] + 1e-3 || Math.abs(dir - Math.round(dir)) > 1e-4) bad++;
      }
    }
    const share = flow / shoal, old = flowing(make('drift', 4242, 160)).length;
    check('S-47 undertow: same seed → same currents (another seed differs); only Shoal chunks (and Tide Lock chunks, D-162) flow, 30–55 px/s on 8 bearings, ~half calm; none at 160',
      same && differs && bad === 0 && share > 0.35 && share < 0.65 && old === 0, `flowing ${flow}/${shoal} Shoal chunks over 8 seeds (${share.toFixed(2)}), bad ${bad}, 160-world flowing ${old}`);
  }
  // In a current: realized ≠ intended while the intent and target stay zero; a calm chunk adds nothing.
  {
    const g = make(), i = flowing(g)[0], p = park(g, i);
    step(g, 1);
    const f = [g.undertow.flow[2 * i], g.undertow.flow[2 * i + 1]], rv = [p.realizedVx, p.realizedVy];
    const pushed = Math.hypot(rv[0] - f[0], rv[1] - f[1]) < 0.5 && p.targetVx === 0 && p.targetVy === 0 && Math.hypot(p.vx, p.vy) < 1e-6 && still.move.x === 0;
    const h = make(), calm = [...Array(h.world.chunksW * h.world.chunksH).keys()].find(k => { const c = centre(h, k); return h.world.ring(c.x, c.y) === 3 && !h.undertow.flow[2 * k] && !h.undertow.flow[2 * k + 1]; });
    const q = park(h, calm), x0 = q.x, y0 = q.y;
    step(h, 1);
    check('S-47 undertow: in a current the realized velocity is the flow while intent, target and own velocity stay 0; a calm Shoal chunk adds nothing',
      pushed && q.x === x0 && q.y === y0 && q.realizedVx === 0 && q.realizedVy === 0,
      `flow ${f.map(v => v.toFixed(1))}, realized ${rv.map(v => v.toFixed(1))}, own ${p.vx.toFixed(3)},${p.vy.toFixed(3)}; calm moved ${(q.x - x0).toFixed(2)},${(q.y - y0).toFixed(2)}`);
  }
  // The ease: 0 → the chunk's flow linearly over UNDERTOW_EASE_S (half at half time, all at the end, never before).
  {
    const g = make(), i = flowing(g)[0];
    park(g, i);
    const sp = Math.hypot(g.undertow.flow[2 * i], g.undertow.flow[2 * i + 1]), at = [];
    for (const dt of [UNDERTOW_EASE_S / 2, UNDERTOW_EASE_S * 0.4, UNDERTOW_EASE_S * 0.1]) { const u = updateUndertow(g, dt); at.push(Math.hypot(u.vx, u.vy) / sp); }
    check('S-47 undertow: the core\'s current eases in over 0.5 s (½ at 0.25 s, 0.9 at 0.45 s, 1 at 0.5 s)',
      Math.abs(at[0] - 0.5) < 1e-6 && Math.abs(at[1] - 0.9) < 1e-6 && Math.abs(at[2] - 1) < 1e-6, at.map(v => v.toFixed(3)).join(' → '));
  }
  // Drift = Surge: the same push; pickups drift at half the flow (and not in calm water).
  {
    const pos = mode => { const g = make(mode), p = park(g, flowing(g)[0]), x = p.x, y = p.y; step(g, 1.5); return [p.x - x, p.y - y]; };
    const d = pos('drift'), s = pos('surge');
    const g = make(), i = flowing(g)[0], p = park(g, i), c = centre(g, i);
    p.x -= 4 * CELL; // the core off to one side, beyond the Attractor
    g.pickups.push({ x: (c.x + 0.5) * CELL, y: (c.y + 0.5) * CELL, vx: 0, vy: 0, kind: 'shard', age: 0, r: 4, kept: false });
    const it = g.pickups[0], x0 = it.x, y0 = it.y, dt = 0.25;
    g.player.x = -1e6; g.updatePickups(dt); g.player.x = p.x;
    const f = [g.undertow.flow[2 * i] * 0.5 * dt, g.undertow.flow[2 * i + 1] * 0.5 * dt], moved = [it.x - x0, it.y - y0];
    check('S-47 undertow: Drift and Surge push the core the same; a loose pickup drifts at half the flow',
      Math.hypot(d[0] - s[0], d[1] - s[1]) < 1e-6 && Math.hypot(d[0], d[1]) > 10 && Math.hypot(moved[0] - f[0], moved[1] - f[1]) < 1e-6,
      `drift ${d.map(v => v.toFixed(1))}, surge ${s.map(v => v.toFixed(1))}; pickup ${moved.map(v => v.toFixed(2))} vs ${f.map(v => v.toFixed(2))}`);
  }
  // Nothing saved: the save's keys and values ignore the current (on vs off, after drifting).
  {
    const on = make(), off = make(); off.undertow.off = true;
    const strip = g => { const s = g.toSave(); delete s.stats; return JSON.stringify(Object.keys(s)) + JSON.stringify(s.size); };
    const fresh = JSON.stringify(Object.keys(make().toSave()));
    park(on, flowing(on)[0]); step(on, 1);
    check('S-47 undertow: nothing saved (toSave keys unchanged, no undertow field)',
      strip(on) === strip(off) && JSON.stringify(Object.keys(on.toSave())) === fresh && !/undertow/i.test(JSON.stringify(on.toSave())), fresh.slice(0, 80));
  }
  // The haul probe (D-124): median round trip Nexus → d 90 → home with full cargo grows ≤ 15 % with the Undertow.
  {
    const r = haulProbe(20, 3);
    check('S-47 undertow: tools/haulrun.mjs median round trip with ÷ without the Undertow ≤ 1.15 (20 seeds)',
      r.kept >= 15 && r.median <= 1.15, `median ×${r.median.toFixed(3)}, max ×${r.max.toFixed(3)}, mean ×${r.mean.toFixed(3)}, ${r.kept}/20 pairs`);
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const dashes = async graphics => {
    const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    pg.on('pageerror', e => errors.push('undertow: ' + e.message));
    await pg.goto(url); await pg.waitForTimeout(200);
    await pg.evaluate(gr => { try { localStorage.removeItem('lumencore.save.v1'); localStorage.setItem('lumencore.settings.v1', JSON.stringify({ graphics: gr })); } catch {} }, graphics);
    await pg.reload(); await pg.waitForTimeout(200);
    await pg.click('#new-world'); await pg.waitForTimeout(200);
    await pg.evaluate(() => {
      const L = window.__lumen, g = L.game, w = g.world, f = g.undertow.flow;
      let i = -1; for (let k = 0; k < f.length / 2 && i < 0; k++) if (f[2 * k] || f[2 * k + 1]) i = k;
      const cx = (i % w.chunksW) * 16 + 8, cy = Math.floor(i / w.chunksW) * 16 + 8;
      L.dev.teleport(Math.round(Math.hypot(cx + 0.5 - w.cx, cy + 0.5 - w.cy)), Math.atan2(cy + 0.5 - w.cy, cx + 0.5 - w.cx));
      for (let y = cy - 6; y <= cy + 6; y++) for (let x = cx - 6; x <= cx + 6; x++) if (w.solid(x, y) && w.get(x, y) !== 0) w.destroy(x, y);
      g.pickups.length = 0; g.god = true;
    });
    await pg.waitForTimeout(900);
    const n = await pg.evaluate(() => window.__lumen.renderer.undertowDashes);
    if (shot && graphics === 'high') await pg.screenshot({ path: shot });
    await pg.close();
    return n;
  };
  const hi = await dashes('high'), lo = await dashes('low');
  check('S-47 undertow: dashes drawn in a flowing Shoal chunk, ≤ 30 on screen at High and ≤ 15 at Low', hi > 0 && hi <= 30 && lo > 0 && lo <= 15, `high ${hi}, low ${lo}`);
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.UNDERTOW_SHOT, shot: process.env.UNDERTOW_SHOT });
