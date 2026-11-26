// S-53 Burrower checks (D-142, D-145, burrower.js). smoke.cjs calls nodeChecks + browserChecks. Node: spawns only in the
// Kiln of a 256 world (none in the Deep, none in a 160 world), first after 20 s; its tunnels are cleared cells of rock /
// ore only (no pickups); Surge: the 0.8 s tell, then a 22 lunge; moving 2 cells in the tell = no hit; S-53c: gap 20–30 s,
// tunnel ore pays nothing, Drift tells then bites 4 cargo items (most valuable first), dodged / empty hold = 0, never
// damage; kill (Surge) and drive-off (Drift) pay the same; the beam reaches it only surfaced; a mode
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
  /** Surge: run until the first tell starts (core pinned); returns the game, or null. */
  const toTell = (mode = 'surge', prep = null) => {
    const g = make(mode); if (prep) prep(g); g.burrow.timer = 0.01;
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
  { // S-53c: the gap after one ends is 20–30 s (seeded)
    const { clearBurrower } = await import('../src/burrower.js');
    const g = make('drift'), gaps = [];
    for (let i = 0; i < 200; i++) { g.burrow.b = {}; clearBurrower(g); gaps.push(g.burrow.timer); }
    check('S-53c burrower: the gap after one ends is 20–30 s', Math.min(...gaps) >= 20 && Math.max(...gaps) <= 30 && Math.max(...gaps) - Math.min(...gaps) > 8,
      JSON.stringify({ min: Math.min(...gaps), max: Math.max(...gaps) }));
  }
  { // S-53c Drift: same tell, then bites 4 cargo items, most valuable first, gone; never damage; no re-bite while up
    let hurts = 0;
    const g = toTell('drift', x => { const hp = x.hurtPlayer.bind(x); x.hurtPlayer = (...a) => { hurts++; hp(...a); }; });
    const log = [];
    if (g) {
      Object.assign(g.cargo, { shard: 5, prism: 2, lumen: 1, tide: 1, calx: 0 });
      for (let i = 0; i < 60 * 3; i++) { pin(g); g.enemies.length = 0; g.spawnTimer = 1e9; g.update(1 / 60, still); log.push(g.events.includes('burrow-bite')); g.events.length = 0; }
    }
    const at = log.indexOf(true), c = g && g.cargo;
    check('S-53c burrower: Drift shows the 0.8 s tell, then bites 4 cargo items most valuable first (≈ ▲ ▲ ●), gone, once, never damage',
      !!g && at >= Math.floor(BURROW_TELL_S * 60) - 2 && at <= Math.ceil(BURROW_TELL_S * 60) + 1 && c.tide === 0 && c.prism === 0 && c.lumen === 0 && c.shard === 5 &&
      g.burrow.bitten === 4 && g.burrow.bites === 1 && log.filter(Boolean).length === 1 && hurts === 0 && g.burrow.lunges === 0 && g.pickups.length === 0,
      JSON.stringify({ at, cargo: c, bitten: g && g.burrow.bitten, bites: g && g.burrow.bites, hurts }));
  }
  { // S-53c Drift: dodged (moved 2 cells in the tell) = nothing taken; an empty hold = nothing taken, no bite event
    const g = toTell('drift');
    if (g) { Object.assign(g.cargo, { shard: 3, prism: 3 }); g.room.x += g.burrow.b.cx > g.room.x ? -2 : 2; for (let i = 0; i < 60; i++) { pin(g); frame(g); } }
    const e = toTell('drift'); let ev = 0;
    if (e) for (let i = 0; i < 90; i++) { pin(e); e.enemies.length = 0; e.update(1 / 60, still); if (e.events.includes('burrow-bite')) ev++; e.events.length = 0; }
    check('S-53c burrower: Drift dodged = no bite; empty hold = it bites nothing (no event)',
      !!g && !!e && g.cargo.shard === 3 && g.cargo.prism === 3 && g.burrow.dodged === 1 && g.burrow.bitten === 0 && e.burrow.bitten === 0 && e.burrow.bites === 0 && ev === 0 && e.burrow.b && e.burrow.b.state === 'up',
      JSON.stringify({ g: g && { cargo: g.cargo, dodged: g.burrow.dodged }, e: e && { bitten: e.burrow.bitten, ev } }));
  }
  { // S-53c: tunnel ore pays nothing (yield lost, no pickups); a kill then pays only the Glitch loot (its belly cell was floor)
    for (const mode of ['drift', 'surge']) {
      const g = toTell(mode, x => { const w = x.world; for (let v = -9; v <= 9; v++) for (let u = -9; u <= 9; u++) if (Math.max(Math.abs(u), Math.abs(v)) >= 3) w.cells[(x.room.y + v) * w.w + x.room.x + u] = T.CRYSTAL; });
      const b = g && g.burrow.b, lost = g && g.burrow.lost, ate = b && JSON.stringify(b.ate), pick0 = g && g.pickups.length;
      if (b) { b.state = 'up'; b.t = 2; b.hp = 0; pin(g); frame(g); }
      const n = {}; if (g) for (const q of g.pickups) n[q.kind] = (n[q.kind] || 0) + 1;
      check(`S-53c burrower (${mode}): tunnel ore pays nothing (yield lost, no pickups, empty belly); the kill pays only the Glitch loot`,
        !!b && lost > 0 && ate === '{}' && pick0 === 0 && n.shard === GLITCH_LOOT_SHARDS + b.tier && Object.keys(n).every(k => k === 'shard' || k === 'prism'),
        JSON.stringify({ lost, ate, pick0, n }));
    }
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
  { // the weight gate (D-146, D-148): tools/biomefoe.mjs Kiln, no Wards, at its default GATE_SEEDS (8) seeds (B-092, audit 119)
    const out = await require('./gates.cjs').run('biomefoe.mjs', ['--biome=kiln']);
    const line = out.split('\n').find(l => l.startsWith('gate')) || '';
    check('S-53 burrower: the biomefoe.mjs Kiln gate passes on 8 seeds (haul with / without 0.85–0.95 each mode, modes within 0.05; B-092)',
      /PASS/.test(line), out.trim().split('\n').map(l => l.slice(0, 50)).join(' | '));
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
  // Audit 114 (B-091): the tell's shadowBlur in 'lighter' blurred a full-canvas layer (~6 ms a frame, software canvas). It is
  // clipped to a box round its cell now; the clip must cut no lit pixel (same image with the clip disabled, 3 tell phases, zoom 1 and 0.62).
  const tc = await pg.evaluate(async () => {
    const mod = await import('./src/burrower.js');
    const pad = window.__lumen.renderer.glowPad; // zoom × DPR 1 and the narrowest zoom (0.62) at DPR 1
    const draw = (noclip, t, z) => { const c = document.createElement('canvas'); c.width = c.height = 320; const ctx = c.getContext('2d');
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 320, 320); let clips = 0; const clip = ctx.clip.bind(ctx);
      ctx.clip = (...a) => { clips++; if (!noclip) clip(...a); }; ctx.scale(z, z);
      mod.drawBurrowerTell({ game: { burrow: { b: { cx: 4, cy: 4, state: 'tell', t } }, settings: null }, zoom: z, dpr: 1, glowPad: pad }, ctx);
      return { px: ctx.getImageData(0, 0, 320, 320).data, clips }; };
    let diff = 0, lit = 0, clips = 0;
    for (const [t, z] of [[0.8, 1], [0.4, 1], [0.01, 1], [0.01, 0.62]]) { const a = draw(false, t, z), o = draw(true, t, z); clips += a.clips;
      for (let i = 0; i < a.px.length; i++) { diff = Math.max(diff, Math.abs(a.px[i] - o.px[i])); if (i % 4 === 0 && o.px[i] > 0) lit++; } }
    return { diff, lit, clips };
  });
  check('burrower: the tell glow is clipped to its cell box and the clip cuts no lit pixel (B-091, audit 114)',
    tc.clips >= 4 && tc.diff === 0 && tc.lit > 1000, JSON.stringify(tc));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.BURROW_SHOT, shot: process.env.BURROW_SHOT });
