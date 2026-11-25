// S-53 Burrower checks (D-142, D-145, burrower.js). smoke.cjs calls nodeChecks + browserChecks. Node: spawns only in the
// Kiln of a 256 world (none in the Deep, none in a 160 world), first after 20 s; its tunnels are cleared cells of rock /
// ore only (no pickups); Surge: the 0.8 s tell, then a 22 lunge; moving 2 cells in the tell = no hit; Drift never hurts the
// core and eats only ore; kill (Surge) and drive-off (Drift) pay the same; the beam reaches it only surfaced; a mode
// switch clears it; nothing saved. Browser: the tell is drawn over the dark. Usage: node tests/burrower.cjs [--browser]
// (BURROW_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { beamFoes } = await import('../src/spitter.js');
  const { CELL, T, KILN_RING, BURROW_DMG, BURROW_TELL_S, BURROW_FIRST_S, GLITCH_LOOT_SHARDS } = await import('../src/config.js');
  const still = { move: { x: 0, y: 0 }, fire: false, aim: null };
  /** A game with the core in a 5×5 room on a Kiln cell (ring `ring`), Glitches / vents / currents off. */
  const make = (mode, ring = KILN_RING, size = 256, seed = 4242) => {
    const g = new Game({ seed, mode, audio: quiet, size }), w = g.world;
    g.undertow.off = true; g.vents.off = true; g.upgrades.hull = 6; g.player.integrity = g.stat('hull');
    let at = -1;
    for (let i = 0; i < w.w * w.h && at < 0; i++) {
      const x = i % w.w, y = (i / w.w) | 0;
      if (w.rings[i] !== ring || x < 20 || y < 20 || x > w.w - 20 || y > w.h - 20) continue;
      let ok = true;
      for (let v = -14; v <= 14 && ok; v++) for (let u = -14; u <= 14 && ok; u++) if (w.ring(x + u, y + v) !== ring) ok = false;
      if (ok && (x + y) % 7 === 0) at = i;
    }
    if (at < 0) return null;
    const x = at % w.w, y = (at / w.w) | 0;
    for (let v = -2; v <= 2; v++) for (let u = -2; u <= 2; u++) w.cells[(y + v) * w.w + x + u] = T.EMPTY;
    g.player.x = (x + 0.5) * CELL; g.player.y = (y + 0.5) * CELL; g.player.vx = g.player.vy = 0;
    g.room = { x, y };
    return g;
  };
  const frame = (g, input = still) => { g.enemies.length = 0; g.spawnTimer = 1e9; g.update(1 / 60, input); g.events.length = 0; };
  const pin = g => { g.player.vx = g.player.vy = 0; g.player.x = (g.room.x + 0.5) * CELL; g.player.y = (g.room.y + 0.5) * CELL; };

  { // where it spawns
    const kiln = make('drift'), first = [];
    for (let i = 0; i < 25 * 60; i++) { pin(kiln); frame(kiln); if (kiln.burrow.spawned && !first.length) first.push(kiln.stats.time); }
    const deep = make('surge', 2), small = make('surge', 2, 160);
    for (const g of [deep, small]) for (let i = 0; i < 60 * 60; i++) { pin(g); frame(g); }
    const b = kiln.burrow.b, t = b && kiln.world.get(b.cx, b.cy), d = b && Math.hypot(b.cx - kiln.room.x, b.cy - kiln.room.y);
    check('S-53 burrower: spawns only in the Kiln of a 256 world (none in 60 s in the Deep or in a 160 world), first after 20 s, in rock 10–14 cells out',
      kiln.burrow.spawned === 1 && first[0] >= BURROW_FIRST_S - 0.02 && first[0] < BURROW_FIRST_S + 0.1 && deep.burrow.spawned === 0 && small.burrow.spawned === 0,
      JSON.stringify({ first, kiln: kiln.burrow.spawned, deep: deep.burrow.spawned, small: small.burrow.spawned, t, d }));
  }
  { // Drift: 90 s near ore — tunnels are cleared rock / ore cells, no pickups unless beaten, the core never hurt
    const g = make('drift'), w = g.world, before = Uint8Array.from(w.cells);
    for (let k = 0; k < 6; k++) w.cells[(g.room.y - 6) * w.w + g.room.x - 3 + k] = T.CRYSTAL; // ore 6 cells north
    const ore0 = Uint8Array.from(w.cells);
    let hurts = 0; const hp = g.hurtPlayer.bind(g); g.hurtPlayer = (...a) => { hurts++; hp(...a); };
    g.burrow.timer = 0.01;
    for (let i = 0; i < 90 * 60; i++) { pin(g); frame(g); }
    const bad = [];
    for (let i = 0; i < w.cells.length; i++) if (w.cells[i] !== ore0[i] && (w.cells[i] !== T.EMPTY || ![T.ROCK, T.DENSE, T.CRYSTAL, T.PRISM, T.LUMEN, T.TIDE, T.CALX].includes(ore0[i]))) bad.push(i);
    let cleared = 0; for (let i = 0; i < w.cells.length; i++) if (w.cells[i] !== before[i] && w.cells[i] === T.EMPTY) cleared++;
    const crystals = [...ore0].filter(t => t === T.CRYSTAL).length - [...w.cells].filter(t => t === T.CRYSTAL).length;
    check('S-53 burrower: Drift tunnels are cleared rock / ore cells only, no pickups dropped, the core never hurt; it eats the ore near the core',
      bad.length === 0 && cleared > 5 && g.pickups.length === 0 && hurts === 0 && g.burrow.lunges === 0 && g.burrow.eaten > 0,
      JSON.stringify({ bad: bad.length, cleared, pickups: g.pickups.length, hurts, eaten: g.burrow.eaten, crystals }));
  }
  /** Surge: run until the first tell starts (core pinned); returns the game, or null. */
  const toTell = () => {
    const g = make('surge'); g.burrow.timer = 0.01;
    for (let i = 0; i < 40 * 60; i++) { pin(g); frame(g); if (g.burrow.b && g.burrow.b.state === 'tell') return g; }
    return null;
  };
  {
    const g = toTell(), hull = g && g.player.integrity, log = [];
    if (g) for (let i = 0; i < 70; i++) { pin(g); frame(g); log.push({ hp: g.player.integrity, st: g.burrow.b && g.burrow.b.state }); }
    const hit = log.findIndex(e => e.hp < hull);
    check('S-53 burrower: Surge shows the 0.8 s tell, then lunges for 22 (one hit as it surfaces)',
      !!g && hit >= Math.floor(BURROW_TELL_S * 60) - 2 && hit <= Math.ceil(BURROW_TELL_S * 60) + 1 && hull - log[hit].hp === BURROW_DMG && log.slice(0, hit).every(e => e.st === 'tell') && g.burrow.lunges === 1,
      JSON.stringify({ hit, dmg: g && hit >= 0 ? hull - log[hit].hp : null, lunges: g && g.burrow.lunges }));
  }
  {
    const g = toTell(), hull = g && g.player.integrity;
    if (g) { g.room.x += g.burrow.b.cx > g.room.x ? -2 : 2; for (let i = 0; i < 60; i++) { pin(g); frame(g); } }
    check('S-53 burrower: moving 2 cells during the tell = it surfaces into air, no hit',
      !!g && g.player.integrity === hull && g.burrow.dodged === 1 && g.burrow.lunges === 0, JSON.stringify(g && { hp: g.player.integrity, hull, dodged: g.burrow.dodged }));
  }
  { // loot: a Surge kill and a Drift drive-off pay the same (ate + 2 + tier ◆, ▲ by the same draw)
    const loot = mode => {
      const g = make(mode); g.burrow.timer = 0.01;
      for (let i = 0; i < 3; i++) frame(g);
      const b = g.burrow.b; if (!b) return null;
      const foeBefore = beamFoes(g).includes(b);
      b.state = 'up'; b.t = 2; b.ate = { shard: 2, calx: 1 }; b.x = g.player.x + 3 * CELL; b.y = g.player.y;
      const foeUp = beamFoes(g).includes(b);
      b.hp = 0; pin(g); frame(g);
      const n = {}; for (const q of g.pickups) n[q.kind] = (n[q.kind] || 0) + 1;
      return { n, tier: b.tier, gone: !g.burrow.b, kills: g.burrow.kills, foeBefore, foeUp };
    };
    const s = loot('surge'), d = loot('drift');
    check('S-53 burrower: a Surge kill and a Drift drive-off pay the same (what it ate + 2 + tier ◆, ▲ 50 %); the beam reaches it only surfaced',
      !!s && JSON.stringify(s) === JSON.stringify(d) && s.n.shard === 2 + GLITCH_LOOT_SHARDS + s.tier && s.n.calx === 1 && s.gone && !s.foeBefore && s.foeUp,
      JSON.stringify({ s, d }));
  }
  {
    const g = make('surge'); g.burrow.timer = 0.01; for (let i = 0; i < 3; i++) frame(g);
    const had = !!g.burrow.b, keys = x => JSON.stringify(Object.keys(x.toSave()));
    const save = JSON.stringify(g.toSave());
    g.setMode('drift');
    check('S-53 burrower: a mode switch clears it; nothing saved (no burrow field, toSave keys unchanged)',
      had && !g.burrow.b && !/burrow/i.test(save) && keys(g) === keys(make('surge')));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('burrower: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  const ok = await pg.evaluate(() => {
    const L = window.__lumen, g = L.game, w = g.world, C = 32;
    let at = -1;
    for (let i = 0; i < w.w * w.h && at < 0; i++) if (w.rings[i] === 4 && w.ring((i % w.w) + 12, (i / w.w | 0) + 12) === 4 && w.ring((i % w.w) - 12, (i / w.w | 0) - 12) === 4 && i % 5 === 0) at = i;
    if (at < 0) return false;
    const x = at % w.w, y = at / w.w | 0;
    for (let v = -2; v <= 2; v++) for (let u = -2; u <= 2; u++) w.cells[(y + v) * w.w + x + u] = 0;
    w.cells[y * w.w + x + 3] = 1; w.markDirty(x + 3, y);
    g.player.x = (x + 0.5) * C; g.player.y = (y + 0.5) * C; g.player.vx = g.player.vy = 0;
    L.renderer.cam.x = g.player.x; L.renderer.cam.y = g.player.y;
    for (let v = -3; v <= 3; v++) for (let u = -3; u <= 3; u++) w.markDirty(x + u, y + v);
    g.god = true; g.undertow.off = true; g.vents.off = true; g.pickups.length = 0;
    g.burrow.b = { burrower: true, cx: x + 3, cy: y, fx: x + 3, fy: y, prog: 1, x: (x + 3.5) * C, y: (y + 0.5) * C, r: 11, tier: 3, state: 'tell', t: 0.3,
      step: 0.5, trip: 0, hp: 6, maxHp: 6, flash: 0, hitCd: 0, ate: {}, heading: Math.PI, ore: null, aimX: g.player.x, aimY: g.player.y };
    g.burrow.off = true; // hold the tell still for the frame
    const ctx = L.renderer.ctx, fr = ctx.fillRect.bind(ctx);
    window.__tellRects = 0;
    ctx.fillRect = (a, b, c, d) => { if (a === (x + 3) * C + 2 && b === y * C + 2) window.__tellRects++; return fr(a, b, c, d); };
    return true;
  });
  await pg.waitForTimeout(120);
  if (shot) await pg.screenshot({ path: shot });
  const n = await pg.evaluate(() => window.__tellRects);
  check('S-53 burrower: the tell glow is drawn on its rock cell', ok && n > 0, JSON.stringify({ ok, n }));
  // S-53b: the music rumble follows it: on (level 0.5…1) within 4 cells, back to 0 once it is farther.
  const near = await pg.evaluate(() => { const m = window.__lumen.music; return { built: !!m.drone, to: m.drone ? m.drone.to : null }; });
  await pg.evaluate(() => { const b = window.__lumen.game.burrow.b; b.x += 32 * 8; });
  await pg.waitForTimeout(150);
  const far = await pg.evaluate(() => { const m = window.__lumen.music; return m.drone ? m.drone.to : null; });
  const { MUSIC_RUMBLE: R } = await import('../src/config.js');
  check('S-53b burrower: the music rumble is on while it is within 4 cells (3 cells: level ≥ 0.5) and off beyond',
    near.built && near.to >= R.gain * 0.5 - 1e-9 && near.to <= R.gain + 1e-9 && far === 0, JSON.stringify({ near, far }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.BURROW_SHOT, shot: process.env.BURROW_SHOT });
