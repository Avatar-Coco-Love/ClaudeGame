// S-72 Tracer + flow field checks (M17, D-190, D-193; flow.js, hunter.js). smoke.cjs calls nodeChecks + browserChecks.
// Node: in a stub maze (a 1-cell tunnel around a wall) a beelining Glitch gives up while a Tracer from the same spot
// reaches the core within 1.3 × path / speed; spawn cells are reachable (16–24 steps), open and off screen on 50 seeds;
// Veil and out only; Drift theft + the item back on a kill; Surge damage and Glitch loot; the field rebuilds on a break;
// a mode switch keeps it; core death clears it (B-107: one from a touch does not throw); the Echo in Auto turns to
// Defend at a Drift Tracer; nothing saved; S-74a: the huntrun.mjs reach gate.
// Browser: a Tracer rounding a corner, trail drawn. Usage: node tests/tracer.cjs [--browser] (TRACER_SHOT=path.png)
const { newWorld } = require('./pinworld.cjs');
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { makeTracer, spawnTracer } = await import('../src/hunter.js');
  const { coreField, fieldAt } = await import('../src/flow.js');
  const { makeGlitch } = await import('../src/glitch.js');
  const { beamFoes } = await import('../src/spitter.js');
  const C = await import('../src/config.js');
  const { CELL, T, GLITCH_TIER, TRACER_DMG, TRACER_SPEED, TRACER_SPAWN, HUNTER_LOOT_SHARDS, HUNTER_PRISM_CHANCE, TRACER_TAKE, TRACER_FLEE_MUL, ORE_WORTH } = C;
  const still = { move: { x: 0, y: 0 }, fire: false, aim: null };
  /** A stub 40 × 30 maze 30 cells east of the Nexus: the core's room (3 × 3) at the top left, a 1-cell tunnel east, south
   *  and back west to a cell 10 rows under the room, with rock between (a Glitch there sees the core through it). */
  const lab = (mode = 'surge', seed = 4242) => {
    const g = new Game({ seed, mode, audio: quiet, size: 256 }), w = g.world, ox = w.cx + 30, oy = w.cy;
    g.undertow.off = true; g.vents.off = true; g.burrow.off = true; g.swarm.off = true; g.spawnTimer = 1e9; g.hunt.timer = 1e9;
    g.upgrades.hull = 6; g.player.integrity = g.stat('hull');
    const open = (x, y) => { w.cells[w.idx(ox + x, oy + y)] = T.EMPTY; };
    for (let y = -2; y <= 30; y++) for (let x = -2; x <= 40; x++) w.cells[w.idx(ox + x, oy + y)] = T.DENSE;
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) open(x, y);
    for (let x = 4; x <= 20; x++) open(x, 2);
    for (let y = 2; y <= 14; y++) open(20, y);
    for (let x = 2; x <= 20; x++) open(x, 14);
    w.breaks++;
    Object.assign(g.player, { x: (ox + 2.5) * CELL, y: (oy + 2.5) * CELL, vx: 0, vy: 0 });
    g.update(1 / 60, still); g.events.length = 0;
    return { g, w, ox, oy, start: [ox + 2, oy + 14] };
  };
  const pin = (L) => Object.assign(L.g.player, { x: (L.ox + 2.5) * CELL, y: (L.oy + 2.5) * CELL, vx: 0, vy: 0 });
  const frame = (L, n = 1) => { for (let i = 0; i < n; i++) { pin(L); L.g.update(1 / 60, still); L.g.events.length = 0; } };

  { // the maze: a Glitch gives up; a Tracer arrives within 1.3 × path / speed
    const G = lab(), gl = makeGlitch((G.start[0] + 0.5) * CELL, (G.start[1] + 0.5) * CELL, 1, 0);
    G.g.enemies.push(gl); G.g.player.invuln = 0;
    const hp0 = G.g.player.integrity;
    let gaveUp = false;
    for (let i = 0; i < 12 * 60 && G.g.enemies.length; i++) { frame(G); if (gl.fade !== undefined) gaveUp = true; }
    const L = lab(), f = coreField(L.g), path = fieldAt(f, L.start[0], L.start[1]), tr = makeTracer(L.g, L.start[0], L.start[1]);
    L.g.hunters.push(tr); L.g.player.invuln = 1e9;
    let t = 0;
    for (; t < 40 && !L.g.hunt.reached; t += 1 / 60) frame(L);
    const bound = 1.3 * path * CELL / tr.speed;
    check(`S-72 tracer: in a tunnel maze a beelining Glitch gives up, a Tracer reaches the core in ≤ 1.3 × path / speed (path ${path} cells)`,
      gaveUp && G.g.player.integrity === hp0 && L.g.hunt.reached === 1 && t <= bound && path > 30,
      JSON.stringify({ gaveUp, hp: [hp0, G.g.player.integrity], path, t: +t.toFixed(2), bound: +bound.toFixed(2), speed: tr.speed }));
    check(`S-72 tracer: speed ${TRACER_SPEED} × the tier's Glitch speed, hp a Glitch's; a foe of the beam (beamFoes)`,
      tr.speed === TRACER_SPEED * (GLITCH_TIER.speed[0] + GLITCH_TIER.speed[1]) && tr.maxHp === GLITCH_TIER.hp[0] + GLITCH_TIER.hp[1] && beamFoes(L.g).includes(tr), JSON.stringify({ speed: tr.speed, hp: tr.maxHp }));
  }
  { // spawn rule on 50 seeds: 16–24 field steps, open, off screen (1280 × 800 desktop default), at a cell the field reaches
    let made = 0, bad = [];
    for (let s = 1; s <= 50; s++) {
      const g = new Game({ seed: s, mode: 'surge', audio: quiet, size: 256 }), w = g.world;
      const nx = Math.floor(g.nexus.x / CELL), ny = Math.floor(g.nexus.y / CELL);
      let at = null;
      for (let r = 30; r < 40 && !at; r++) for (let a = 0; a < 64 && !at; a++) { const x = nx + Math.round(Math.cos(a / 10) * r), y = ny + Math.round(Math.sin(a / 10) * r); if (!w.solid(x, y)) at = [x, y]; }
      if (!at) { bad.push(`${s}: no floor`); continue; }
      Object.assign(g.player, { x: (at[0] + 0.5) * CELL, y: (at[1] + 0.5) * CELL });
      const t = spawnTracer(g);
      if (!t) continue;
      made++;
      const cx = Math.floor(t.x / CELL), cy = Math.floor(t.y / CELL), d = fieldAt(g.flow, cx, cy);
      const off = Math.abs(t.x - g.player.x) > 576 + CELL || Math.abs(t.y - g.player.y) > 360 + CELL;
      if (!(d >= TRACER_SPAWN[0] && d <= TRACER_SPAWN[1] && off && !w.solid(cx, cy))) bad.push(`${s}: d ${d} off ${off}`);
    }
    check('S-72 tracer: spawn cells are 16–24 field steps out, open and off screen (50 seeds, ≥ 45 spawned)', made >= 45 && !bad.length, JSON.stringify({ made, bad }));
  }
  { // Veil and out: none in the Hearth; the timer spawns one in the Veil (a natural seed-1 cave, 30 cells out); one at a time there
    const g = new Game({ seed: 1, mode: 'drift', audio: quiet, size: 256 }), w = g.world;
    g.undertow.off = true; g.burrow.off = true; g.swarm.off = true;
    const h = new Game({ seed: 1, mode: 'drift', audio: quiet, size: 256 });
    h.hunt.timer = 0.01; for (let i = 0; i < 10; i++) h.update(1 / 60, still);
    const nx = Math.floor(g.nexus.x / CELL), ny = Math.floor(g.nexus.y / CELL);
    let at = null;
    for (let r = 30; r < 40 && !at; r++) for (let a = 0; a < 64 && !at; a++) { const x = nx + Math.round(Math.cos(a / 10) * r), y = ny + Math.round(Math.sin(a / 10) * r); if (!w.solid(x, y)) at = [x, y]; }
    const hold = () => Object.assign(g.player, { x: (at[0] + 0.5) * CELL, y: (at[1] + 0.5) * CELL, vx: 0, vy: 0 });
    hold(); g.hunt.timer = 0.01;
    for (let i = 0; i < 5; i++) { hold(); g.update(1 / 60, still); }
    const veil = g.hunters.length;
    g.hunt.timer = 0.01;
    for (let i = 0; i < 5; i++) { hold(); g.update(1 / 60, still); }
    check('S-72 tracer: Veil and out (none at the Hearth), one at a time in the Veil', g.ringNow === 1 && veil === 1 && g.hunters.length === 1 && h.ringNow === 0 && !h.hunters.length,
      JSON.stringify({ ring: g.ringNow, veil, after: g.hunters.length, hearth: h.hunters.length }));
  }
  const near = (L, mode) => { // a Tracer touching the core from the east
    const tr = makeTracer(L.g, L.ox + 3, L.oy + 2); Object.assign(tr, { x: L.g.player.x + 14, y: L.g.player.y, hitCd: 0 });
    L.g.hunters.push(tr); return tr;
  };
  { // Drift: a touch takes TRACER_TAKE worth (most valuable first; S-74b, D-201), no damage; it flees faster; killed, it drops what it took
    const L = lab('drift'), g = L.g; g.cargo.shard = 40; g.cargo.tide = 1;
    const want = ['tide', ...Array(Math.max(0, TRACER_TAKE - ORE_WORTH.tide)).fill('shard')].join();
    const tr = near(L), hp = g.player.integrity;
    let ev = false;
    for (let i = 0; i < 3 && !g.hunt.taken; i++) { pin(L); g.update(1 / 60, still); ev = ev || g.events.includes('tracer-take'); g.events.length = 0; }
    const took = { tide: g.cargo.tide, shard: g.cargo.shard, carry: [...tr.carry], hp: g.player.integrity === hp, flee: tr.flee > 0 };
    frame(L, 20); const fast = Math.hypot(tr.vx, tr.vy) > tr.speed * (1 + TRACER_FLEE_MUL) / 2;
    const away = Math.hypot(tr.x - g.player.x, tr.y - g.player.y);
    tr.hp = 0; const n0 = g.pickups.length; frame(L);
    const drop = g.pickups.slice(n0).map(p => p.kind);
    check(`S-74b tracer: Drift touch takes ${TRACER_TAKE} worth (Tide first, then ◆), no damage, flees at × ${TRACER_FLEE_MUL}; killed, it drops what it took (only)`,
      ev && took.tide === 0 && took.carry.join() === want && took.shard === 40 - took.carry.length + 1 && took.hp && took.flee && fast && away > 20 && drop.join() === want && !g.hunters.length,
      JSON.stringify({ ev, took: { ...took, carry: took.carry.length }, fast, away, drop: drop.length }));
  }
  { // B-109: touched from the room's west side (no way out there), it flees round the core and down the tunnel, not
    // into the room's corner (a local high of the field, where uphill stops: 1–2 cells from the core on the old code)
    const L = lab('drift'), g = L.g; g.cargo.shard = 40;
    const tr = makeTracer(g, L.ox + 1, L.oy + 2); Object.assign(tr, { x: g.player.x - 14, y: g.player.y, hitCd: 0 }); g.hunters.push(tr);
    let far = 0, end = 0, t = 0;
    for (; t < 10 && g.hunters.includes(tr) && (tr.fade === undefined || !g.hunt.taken); t += 1 / 60) {
      frame(L); if (tr.flee > 0) { end = Math.hypot(tr.x - g.player.x, tr.y - g.player.y) / CELL; far = Math.max(far, end); }
    }
    check('B-109 tracer: a Drift thief gets away (≥ 8 cells from a still core when its flee ends), not stuck in a nook by the core',
      g.hunt.taken > 0 && end >= 8 && g.hunt.runs === 1, JSON.stringify({ taken: g.hunt.taken, end: +end.toFixed(1), far: +far.toFixed(1), runs: g.hunt.runs }));
  }
  { // Surge: contact = 8 + the Glitch tier step, knockback; kill drops the hunter loot (S-74b, D-201: HUNTER_LOOT_SHARDS ◆, ▲ at HUNTER_PRISM_CHANCE)
    const L = lab('surge'), g = L.g; g.player.invuln = 0;
    const tr = near(L), hp = g.player.integrity;
    frame(L, 2);
    const dmg = hp - g.player.integrity, want = TRACER_DMG + Math.min(tr.tier, C.HUNTER_TIER_MAX) * GLITCH_TIER.dmg[1];
    tr.hp = 0; const n0 = g.pickups.length; frame(L);
    const drop = g.pickups.slice(n0).map(p => p.kind), shards = drop.filter(k => k === 'shard').length;
    check(`S-74b tracer: Surge contact ${want} damage (8 + tier step), kill drops ${HUNTER_LOOT_SHARDS} ◆${HUNTER_PRISM_CHANCE ? ' (and maybe a ▲)' : ', no ▲'}`,
      Math.abs(dmg - want) < 1e-6 && shards === HUNTER_LOOT_SHARDS && drop.length - shards <= (HUNTER_PRISM_CHANCE ? 1 : 0) && g.hunt.kills === 1, JSON.stringify({ dmg, want, drop }));
  }
  { // S-74b2b (D-205): a hunter's damage tier step stops at HUNTER_TIER_MAX; hp and speed keep the core's full tier (Kiln = 3)
    const L = lab('surge'), g = L.g, nx = g.nexus.x; g.nexus.x = g.player.x - 3.5 * C.GLITCH_TIER_PX;
    const e = makeTracer(g, L.ox, L.oy); g.nexus.x = nx;
    const want = TRACER_DMG + C.HUNTER_TIER_MAX * GLITCH_TIER.dmg[1], hp = GLITCH_TIER.hp[0] + 3 * GLITCH_TIER.hp[1];
    check(`S-74b2b hunters: a tier-3 Tracer hits for ${want} (tier step capped at ${C.HUNTER_TIER_MAX}), hp ${hp.toFixed(1)} (full tier)`,
      e.tier === 3 && Math.abs(e.dmg - want) < 1e-6 && Math.abs(e.hp - hp) < 1e-6, JSON.stringify({ tier: e.tier, dmg: e.dmg, hp: e.hp }));
  }
  { // the field: rebuilt on a break; a mode switch keeps the Tracer; core death clears it; never saved
    const L = lab('surge'), g = L.g, f = coreField(g), b0 = f.builds, wall = [L.ox + 2, L.oy + 4];
    coreField(g); const same = f.builds === b0, before = fieldAt(f, wall[0], wall[1]);
    g.world.destroy(wall[0], wall[1]); coreField(g);
    const rebuilt = f.builds === b0 + 1 && before === -1 && fieldAt(f, wall[0], wall[1]) > 0;
    const tr = makeTracer(g, L.start[0], L.start[1]); g.hunters.push(tr);
    g.setMode('drift'); frame(L, 3);
    const kept = g.hunters.includes(tr);
    const saved = JSON.stringify(g.toSave());
    g.destabilize();
    check('S-72 tracer: the field rebuilds on a break (not otherwise); a mode switch keeps the Tracer; core death clears it; nothing saved',
      same && rebuilt && kept && !g.hunters.length && !/hunter|tracer/i.test(saved), JSON.stringify({ same, rebuilt, kept, left: g.hunters.length }));
  }
  { // B-107 (S-74a): a Surge death from a hunter's touch cleared the list mid-loop; the next index read undefined and threw
    // (in the browser that skipped requestAnimationFrame: the game froze). Two Tracers on a 1-hp core, the later one touches first.
    const L = lab('surge'), g = L.g, p = g.player;
    const a = makeTracer(g, L.start[0], L.start[1]), b = makeTracer(g, L.start[0], L.start[1]);
    for (const e of [a, b]) Object.assign(e, { x: p.x, y: p.y, hitCd: 0 });
    g.hunters.push(a, b); p.integrity = 0.5; p.invuln = 0;
    let err = null; try { g.update(1 / 60, still); } catch (e) { err = e.message; }
    check('B-107 tracer: a Surge core death from a hunter touch with another hunter in the list does not throw; the list is cleared',
      !err && !g.hunters.length, JSON.stringify({ err, left: g.hunters.length }));
  }
  { // S-74a (D-200): the reach half of the Hunters gate, tools/huntrun.mjs in the Deep on GATE_SEEDS (8) seeds; the cost half is reported (S-74b)
    const out = await require('./gates.cjs').run('huntrun.mjs', ['--rings=deep', '--no-echo']);
    const line = out.split('\n').find(l => l.startsWith('reach')) || '', gate = out.split('\n').find(l => l.startsWith('gate')) || '';
    check('S-74a hunters: where a ghost Glitch from the spawn gives up, Tracers still reach the core on ≥ 80 % (huntrun.mjs, Deep, 8 seeds)',
      / ok$/.test(line) && /reach PASS/.test(gate), line.slice(0, 220));
    // S-74b2a (D-202): the cost half is pooled with a per-ring floor, and a Surge run below full hull pays hull debt
    const pool = out.split('\n').find(l => l.startsWith('pooled (deep)')) || '', sl = out.split('\n').find(l => l.startsWith('deep surge:')) || '';
    check('S-74b2a hunters: huntrun.mjs prints the pooled cost line (ratio + per-ring floor) and Surge hull debt (trip s, owed s)',
      /Drift \/ Surge .*\(0\.8–1\.25\) (ok|FAIL); floor \(every face > 0 in every ring\) (ok|FAIL)/.test(pool) && /hull debt: end hull with [\d.]+ \/ without [\d.]+, trip \d+ s/.test(sl),
      `${pool.slice(0, 160)} | ${(sl.match(/hull debt.*/) || [''])[0].slice(0, 120)}`);
  }
  { // the Echo in Auto turns to Defend at a Drift Tracer it can see
    const L = lab('drift'), g = L.g;
    for (let y = 1; y <= 3; y++) for (let x = 4; x <= 9; x++) g.world.cells[g.world.idx(L.ox + x, L.oy + y)] = T.EMPTY;
    g.world.breaks++;
    g.research.echo = true; g.echoOrder = 'auto'; frame(L, 60);
    const tr = makeTracer(g, L.ox + 6, L.oy + 2); g.hunters.push(tr);
    let defend = false;
    for (let i = 0; i < 30 && !defend; i++) { Object.assign(tr, { x: g.player.x + 100, y: g.player.y, vx: 0, vy: 0, stall: 0 }); frame(L); defend = g.echo && g.echo.auto === 'defend'; }
    check('S-72 tracer: the Echo in Auto turns to Defend at a Drift Tracer', defend, JSON.stringify({ echo: !!g.echo, auto: g.echo && g.echo.auto }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('tracer: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(200);
  await pg.evaluate(() => {
    const L = window.__lumen, g = L.game, w = g.world, C = 32, ox = w.cx + 30, oy = w.cy;
    for (let y = -3; y <= 10; y++) for (let x = -3; x <= 14; x++) { w.cells[w.idx(ox + x, oy + y)] = 2; w.markDirty(ox + x, oy + y); }
    const open = (x, y) => { w.cells[w.idx(ox + x, oy + y)] = 0; w.markDirty(ox + x, oy + y); };
    for (let y = 0; y <= 2; y++) for (let x = 0; x <= 2; x++) open(x, y);
    for (let x = 3; x <= 10; x++) open(x, 1);
    for (let y = 1; y <= 8; y++) open(10, y);
    w.breaks++;
    g.player.x = (ox + 1.5) * C; g.player.y = (oy + 1.5) * C; g.player.vx = g.player.vy = 0;
    L.renderer.cam.x = g.player.x + 4 * C; L.renderer.cam.y = g.player.y + 2 * C;
    g.god = true; g.hunt.timer = 1e9; g.spawnTimer = 1e9;
    const tr = { hunter: 'tracer', x: (ox + 10.5) * C, y: (oy + 1.9) * C, r: 11, vx: -80, vy: -60, tier: 1, hp: 1, maxHp: 2.3, speed: 0, dmg: 0, flash: 0, hitCd: 9, spin: -2.5, best: 0, stall: 0, flee: 0, carry: [], met: false,
      trail: [ox + 10, oy + 7, ox + 10, oy + 6, ox + 10, oy + 5, ox + 10, oy + 4, ox + 10, oy + 3, ox + 10, oy + 2] };
    g.hunters.push(tr); g.hunt.off = true; // hold it still for the frame
    const ctx = L.renderer.ctx, fill = ctx.fill.bind(ctx);
    window.__trFills = 0;
    ctx.fill = (...a) => { if (String(ctx.fillStyle).startsWith('rgba(150, 140, 255')) window.__trFills++; return fill(...a); };
  });
  await pg.waitForTimeout(150);
  if (shot) await pg.screenshot({ path: shot });
  const n = await pg.evaluate(() => window.__trFills);
  check('S-72 tracer: a Tracer and its trail are drawn (over the dark)', n >= 5, JSON.stringify({ n }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.TRACER_SHOT, shot: process.env.TRACER_SHOT });
