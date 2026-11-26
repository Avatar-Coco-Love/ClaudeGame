// S-61a Gyre checks (D-168, gyre.js). smoke.cjs calls nodeChecks + browserChecks. Node: the lair site rules on 30 seeds (all in
// the Shoal, clear of vaults / vents + Anomalies / Spires, seed-only); the key steps one standing plate clockwise every 1.2 s,
// keeps every plate's damage, and only it cuts; the whirlpool runs clockwise at 45 px/s within 6 cells only and is gone once
// the Gyre is down; Drift = Surge (no Surge form yet); loot ≈; an old save with only the Crucible gets the Gyre stamped.
// Probe: a mid build riding the whirlpool takes it apart in ≤ 90 s. Browser: a seen Gyre draws (core, key, whirlpool dashes).
// Usage: node tests/gyre.cjs [--browser] (GYRE_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { World, vaultSites } = await import('../src/world.js');
  const { chooseSpires, SPIRE_HALF } = await import('../src/spire.js');
  const { anomalySites } = await import('../src/anomaly.js');
  const { ventSites } = await import('../src/vent.js');
  const { lairSite, PLATES, platesLeft, bossAwake } = await import('../src/boss.js');
  const { flowAt } = await import('../src/undertow.js');
  const { upgradeSave } = await import('../src/save.js');
  const C = await import('../src/config.js');
  const { CELL, T, GYRE_RING, GYRE_R, GYRE_SPEED, GYRE_STEP_S, VAULT_HALF, LAIR_HALF, LAIR_CLEAR } = C;
  const make = (mode = 'drift', seed = 4242, save) => { const g = new Game({ seed, mode, audio: quiet, save }); g.vents.off = true; g.enemies.length = 0; g.spawnTimer = 1e9; g.burrow.off = true; g.swarm && (g.swarm.off = true); return g; };
  const gyre = g => g.bosses.list.find(B => B.ring === GYRE_RING);
  const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  const idle = (g, n, at) => { for (let k = 0; k < n; k++) { if (at) at(); g.enemies.length = 0; g.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null }); g.events.length = 0; } };
  {
    const bad = []; let maxT = 0;
    for (let k = 1; k <= 30; k++) {
      const seed = k * 7919, g = make('drift', seed), w = g.world, B = gyre(g), H = LAIR_HALF;
      if (!B) { bad.push(`${seed}: no lair`); continue; }
      maxT = Math.max(maxT, B.t);
      const plain = new World(seed, [], 256), an = anomalySites(plain), vs = ventSites(plain, an);
      for (let j = -H; j <= H; j++) for (let i = -H; i <= H; i++) if (w.ring(B.x + i, B.y + j) !== GYRE_RING || w.get(B.x + i, B.y + j) === T.BEDROCK) bad.push(`${seed}: footprint off the Shoal`);
      if (vaultSites(seed, 256).some(v => cheb(v, B) - H - VAULT_HALF - 1 < LAIR_CLEAR.vault)) bad.push(`${seed}: vault`);
      if ([...an, ...vs].some(s => cheb(s, B) - H - 1 < LAIR_CLEAR.site)) bad.push(`${seed}: vent / Anomaly`);
      if (chooseSpires(seed, null, null, 256).some(s => cheb(s, B) - H - SPIRE_HALF - 1 < LAIR_CLEAR.spire)) bad.push(`${seed}: Spire`);
      if (JSON.stringify(lairSite(plain, GYRE_RING, an, vs)) !== JSON.stringify({ x: B.x, y: B.y, ring: B.ring, t: B.t })) bad.push(`${seed}: not seed-only`);
      const d = Math.hypot(B.x - 128, B.y - 128); if (d < C.LAIR_D[3][0] - 1 || d > C.LAIR_D[3][1] + 1) bad.push(`${seed}: d ${d.toFixed(1)}`);
    }
    const g160 = new Game({ seed: 4242, mode: 'drift', audio: quiet, size: 160 });
    check('S-61a lair: a seed-only 9 × 9 Gyre site in the Shoal (d 88–100) on 30 / 30 seeds, clear of vaults / vents + Anomalies / Spires; none in a 160 world',
      bad.length === 0 && !gyre(g160), bad.slice(0, 4).join('; ') + ` (last draw ${maxT})`);
  }
  { // the key: steps clockwise every 1.2 s over standing plates; keeps damage; only it cuts; Drift = Surge (even close in)
    const run = mode => {
      const g = make(mode), w = g.world, B = gyre(g), p = g.player, order = [B.lit], leaks = [];
      const at = () => { p.x = (B.x + 0.5 - 3) * CELL; p.y = (B.y + 0.5) * CELL; p.vx = p.vy = 0; p.invuln = 9; };
      for (let s = 0; s < 8; s++) { idle(g, Math.round(GYRE_STEP_S * 60), at); order.push(B.lit); }
      const cell = k => (B.y + PLATES[k][1]) * w.w + B.x + PLATES[k][0];
      const k0 = B.lit; w.hit(B.x + PLATES[k0][0], B.y + PLATES[k0][1], 5);
      for (let k = 0; k < 8; k++) if (k !== k0) { w.hit(B.x + PLATES[k][0], B.y + PLATES[k][1], 3); if (w.damage[cell(k)] > 0) leaks.push(k); }
      w.hit(B.x, B.y, 9); const core = w.damage[B.y * w.w + B.x];
      idle(g, Math.round(GYRE_STEP_S * 60) * 8, at); const kept = w.damage[cell(k0)];
      const [ni, nj] = PLATES[(k0 + 1) % 8]; w.destroy(B.x + ni, B.y + nj); // a broken plate is skipped
      const was = B.lit = k0; B.step = GYRE_STEP_S; idle(g, Math.round(GYRE_STEP_S * 60) + 1, at);
      const before = B.lit; const [bi, bj] = PLATES[before]; w.destroy(B.x + bi, B.y + bj); // the key breaks: passes on at once
      return { order, leaks, core, kept, skip: before === (was + 2) % 8, passed: B.lit === (before + 1) % 8, awake: bossAwake(g, B) };
    };
    const d = run('drift'), s = run('surge'), steps = d.order.slice(1).every((k, i) => k === (d.order[i] + 1) % 8);
    check('S-61a key: steps one plate clockwise every 1.2 s (all 8 in turn), skips broken plates, passes on at once when it breaks; only the key cuts, the core waits; damage is kept',
      steps && d.leaks.length === 0 && d.core === 0 && d.kept === 5 && d.skip && d.passed, JSON.stringify(d));
    check('S-61a interim: Surge (3 cells out) = Drift: never awake, the same key rule', JSON.stringify(d) === JSON.stringify(s) && !s.awake, JSON.stringify(s));
    const seeds = new Set([4242, 7, 99, 31337, 5, 11, 2024, 8080].map(n => gyre(make('drift', n)).lit));
    check('S-61a: the first key is seeded (varies by seed; its own stream, the Crucible\'s start unchanged)', seeds.size > 1, [...seeds].join(','));
  }
  { // whirlpool: clockwise tangential 45 px/s within 6 cells; the chunk draw outside; gone when down; the core rides it
    const g = make(), B = gyre(g), ox = (B.x + 0.5) * CELL, oy = (B.y + 0.5) * CELL;
    const n = flowAt(g, ox, oy - 3 * CELL), e = flowAt(g, ox + 5.9 * CELL, oy), out = flowAt(g, ox, oy - 6.5 * CELL);
    const chunk = (px, py) => { const i = Math.floor(py / CELL / C.CHUNK) * g.world.chunksW + Math.floor(px / CELL / C.CHUNK); return [g.undertow.flow[i * 2], g.undertow.flow[i * 2 + 1]]; };
    const p = g.player; p.x = ox; p.y = oy - 3 * CELL; p.vx = p.vy = 0;
    idle(g, 60); const rode = { dx: p.x - ox, dy: p.y - (oy - 3 * CELL), u: [g.undertow.vx, g.undertow.vy].map(v => +v.toFixed(1)) };
    for (const [i, j] of PLATES) g.world.destroy(B.x + i, B.y + j);
    const before = g.pickups.length; g.world.destroy(B.x, B.y);
    const loot = {}; for (const q of g.pickups.slice(before)) loot[q.kind] = (loot[q.kind] || 0) + 1;
    const after = flowAt(g, ox, oy - 3 * CELL), ch = chunk(ox, oy - 3 * CELL);
    const r = { n, e, out, outChunk: chunk(ox, oy - 6.5 * CELL), rode, after, ch, loot, down: B.down, ev: g.events.includes('boss'), name: g.bossDown };
    check('S-61a whirlpool: clockwise at 45 px/s within 6 cells (north runs east, east runs south), the chunk\'s draw at 6.5; the core rides it east',
      Math.abs(n[0] - GYRE_SPEED) < 1e-6 && Math.abs(n[1]) < 1e-6 && Math.abs(e[0]) < 1e-6 && Math.abs(e[1] - GYRE_SPEED) < 1e-6 && GYRE_R === 6
        && out[0] === r.outChunk[0] && out[1] === r.outChunk[1] && rode.dx > 20 && rode.u[0] > 40, JSON.stringify(r));
    check('S-61a down: BOSS_LOOT with ≈ (80 ◆, 20 ▲, 24 ≈), toast "Gyre"; the whirlpool stops (the chunk\'s own draw returns)',
      r.down && r.ev && r.name === 'Gyre' && loot.shard === 80 && loot.prism === 20 && loot.tide === 24 && after[0] === ch[0] && after[1] === ch[1], JSON.stringify(r));
  }
  { // an old save that only knows the Crucible (format 23 from S-60a) gets the Gyre stamped; a reload keeps the Gyre's down flag
    const g = make(), s = JSON.parse(JSON.stringify(g.toSave()));
    s.bosses = s.bosses.filter(b => b.ring === 4);
    const o = make('drift', 4242, upgradeSave(s)), OB = gyre(o);
    for (const [i, j] of PLATES) g.world.destroy(gyre(g).x + i, gyre(g).y + j); g.world.destroy(gyre(g).x, gyre(g).y);
    const back = make('drift', 4242, upgradeSave(JSON.parse(JSON.stringify(g.toSave()))));
    check('S-61a save: a save with only the Crucible\'s record gets the Gyre (8 plates, live); a downed Gyre stays down',
      OB && platesLeft(o, OB) === 8 && !OB.down && gyre(back).down && back.world.get(gyre(back).x, gyre(back).y) === T.EMPTY, JSON.stringify({ plates: OB && platesLeft(o, OB) }));
  }
  { // probe: a mid build (beam 5, range 3) rides the whirlpool round the body 3.2 cells out with the beam on the key, then the core
    const res = [];
    for (const seed of [4242, 7, 99, 31337]) {
      const g = make('drift', seed), B = gyre(g), p = g.player; g.god = true;
      g.upgrades.beam = 5; g.upgrades.range = 3;
      const ox = (B.x + 0.5) * CELL, oy = (B.y + 0.5) * CELL;
      p.x = ox - 3.2 * CELL; p.y = oy; p.vx = p.vy = 0;
      let t = 0;
      for (; t < 180 && !B.down; t += 1 / 60) {
        const tgt = platesLeft(g, B) ? PLATES[B.lit] : [0, 0], tx = (B.x + tgt[0] + 0.5) * CELL, ty = (B.y + tgt[1] + 0.5) * CELL;
        const goal = tgt[0] || tgt[1] ? Math.atan2(tgt[1], tgt[0]) : Math.atan2(p.y - oy, p.x - ox);
        const at = Math.atan2(p.y - oy, p.x - ox), da = Math.atan2(Math.sin(goal - at), Math.cos(goal - at));
        const via = at + Math.max(-0.5, Math.min(0.5, da)); // round the ring toward the key's bearing, never through the body
        const sx = ox + Math.cos(via) * 3.2 * CELL, sy = oy + Math.sin(via) * 3.2 * CELL, mx = sx - p.x, my = sy - p.y, md = Math.hypot(mx, my);
        const ax = tx - p.x, ay = ty - p.y, ad = Math.hypot(ax, ay);
        g.enemies.length = 0;
        g.update(1 / 60, { move: md > 6 ? { x: mx / md, y: my / md } : { x: 0, y: 0 }, fire: Math.abs(da) < 0.3, aim: { x: ax / ad, y: ay / ad } });
        g.events.length = 0;
      }
      res.push(+t.toFixed(1));
    }
    check('S-61a probe: a mid build (beam 5, range 3) riding the whirlpool takes the Gyre apart in ≤ 90 s (logged in 09)', res.every(t => t <= 90), `seconds: ${res.join(', ')}`);
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('gyre: ' + e.message));
  await pg.goto(url + (url.includes('?') ? '&' : '?') + 'seed=4242'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  const { CELL } = await import('../src/config.js');
  const has = await pg.evaluate(C => {
    const g = window.__lumen.game, B = g.bosses && g.bosses.list.find(b => b.name === 'Gyre');
    if (!B) return false;
    g.player.x = (B.x - 3) * C; g.player.y = (B.y + 0.5) * C; g.player.vx = g.player.vy = 0;
    g.world.reveal(g.player.x, g.player.y, 10 * C); g.god = true; g.spawnTimer = 1e9; g.enemies.length = 0;
    return true;
  }, CELL);
  await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => ({ drawn: window.__lumen.renderer.bossDrawn, dashes: window.__lumen.renderer.gyreDashes }));
  if (shot) await pg.screenshot({ path: shot });
  check('S-61a: a seen Gyre draws its core, key and whirlpool dashes', has && r.drawn === 1 && r.dashes > 0, JSON.stringify({ has, ...r }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.GYRE_SHOT, shot: process.env.GYRE_SHOT });
