// S-73a / S-73b Pincer pair checks (M17, D-194; pincer.js, hunter.js, flow.js aStar). smoke.cjs calls nodeChecks + browserChecks.
// Node: on a stub cross of tunnels joined by an outer ring, the flank (spawned behind the lead) arrives from a different
// tunnel than the lead on ≥ 8 of 10 seeds (a flank that only walks the field: the lead's tunnel); A* stops at its node
// cap; no frame runs two searches and the pair costs one field build a frame; spawns (50 Deep seeds: ≥ PINCER_SPLIT apart,
// 16–24 steps, off screen); Deep only, never while one lives; Surge 6 + tier step each, Drift 1 item each; one killed,
// the other flees and fades; nothing saved. Browser: the pair closing in, joined by its dotted line; each dot's
// white pip (S-73b); the Echo shares the hunters' field (S-73b).
// Usage: node tests/pincer.cjs [--browser] (PINCER_SHOT=path.png)
const { newWorld } = require('./pinworld.cjs');
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { makeTracer, spawnPincer } = await import('../src/hunter.js');
  const { coreField, fieldAt, aStar } = await import('../src/flow.js');
  const C = await import('../src/config.js');
  const { CELL, T, GLITCH_TIER, PINCER_DMG, PINCER_SPLIT, PINCER_NODES, PINCER_PART_S, TRACER_SPAWN } = C;
  const still = { move: { x: 0, y: 0 }, fire: false, aim: null };
  const off = g => { g.undertow.off = true; g.vents.off = true; g.burrow.off = true; g.swarm.off = true; g.spawnTimer = 1e9; g.hunt.timer = 1e9; g.hunt.pincer = 1e9; };
  /** A 3 × 3 room 60 cells east of the Nexus (the Deep), four 1-cell arms 2–12 out, joined by a square ring at ± 12. */
  const cross = (mode = 'surge', seed = 4242) => {
    const g = new Game({ seed, mode, audio: quiet, size: 256 }), w = g.world, ox = w.cx + 60, oy = w.cy;
    off(g); g.upgrades.hull = 6; g.player.integrity = g.stat('hull');
    const open = (x, y) => { w.cells[w.idx(ox + x, oy + y)] = T.EMPTY; };
    for (let y = -15; y <= 15; y++) for (let x = -15; x <= 15; x++) w.cells[w.idx(ox + x, oy + y)] = T.DENSE;
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) open(x, y);
    for (let i = 2; i <= 12; i++) { open(i, 0); open(-i, 0); open(0, i); open(0, -i); }
    for (let i = -12; i <= 12; i++) { open(i, -12); open(i, 12); open(-12, i); open(12, i); }
    w.breaks++;
    const L = { g, w, ox, oy };
    pin(L); g.update(1 / 60, still); g.events.length = 0;
    return L;
  };
  const pin = L => Object.assign(L.g.player, { x: (L.ox + 0.5) * CELL, y: (L.oy + 0.5) * CELL, vx: 0, vy: 0 });
  const frame = (L, n = 1) => { for (let i = 0; i < n; i++) { pin(L); L.g.update(1 / 60, still); L.g.events.length = 0; } };
  const pair = (L, lead, flank, flankKind = 'flank') => {
    const a = makeTracer(L.g, L.ox + lead[0], L.oy + lead[1], 'lead'), b = makeTracer(L.g, L.ox + flank[0], L.oy + flank[1], flankKind);
    a.mate = b; b.mate = a; b.searchT = 0; b.path = null; b.pi = 0;
    L.g.hunters.push(a, b); return [a, b];
  };
  const arm = (L, e) => { // which arm a hunter is in (null: the room or the ring)
    const x = Math.floor(e.x / CELL) - L.ox, y = Math.floor(e.y / CELL) - L.oy;
    if (Math.abs(x) <= 1 && Math.abs(y) <= 1) return 'room';
    if (y === 0 && x > 1 && x < 12) return 'E'; if (y === 0 && x < -1 && x > -12) return 'W';
    if (x === 0 && y > 1 && y < 12) return 'S'; if (x === 0 && y < -1 && y > -12) return 'N';
    return null;
  };
  const arrive = (L, list) => { // the arm each hunter last crossed before it entered the room
    const last = list.map(() => null), got = list.map(() => null);
    for (let i = 0; i < 25 * 60 && got.some(v => v === null); i++) {
      frame(L);
      list.forEach((e, k) => { const a = arm(L, e); if (got[k] !== null) return; if (a === 'room' || e.met) got[k] = last[k] || 'room'; else if (a) last[k] = a; });
    }
    return got;
  };
  { // the cross: the flank, spawned on the ring behind the lead, comes in by another arm; a field-walking flank does not
    let apart = 0, control = 0; const rows = [];
    for (let s = 1; s <= 10; s++) {
      const lead = [8 + (s % 4), 0], fl = [12, (s % 2 ? 1 : -1) * (1 + (s % 3))];
      const L = cross('surge', s); L.g.player.invuln = 1e9;
      const [a, b] = pair(L, lead, fl), got = arrive(L, [a, b]);
      const K = cross('surge', s); K.g.player.invuln = 1e9;
      const [c, d] = pair(K, lead, fl, 'lead'), ctl = arrive(K, [c, d]);
      if (got[0] && got[1] && got[0] !== got[1]) apart++;
      if (ctl[0] && ctl[0] === ctl[1]) control++;
      rows.push(`${s}:${got.join('/')}|${ctl.join('/')}`);
    }
    check('S-73a pincer: on a ring-joined cross the flank arrives by another arm than the lead on ≥ 8 of 10 seeds (a field-walking flank: the lead\'s arm on ≥ 8)',
      apart >= 8 && control >= 8, JSON.stringify({ apart, control, rows }));
  }
  { // A*: a path within the cap; a tiny cap stops it (capped, nodes = cap)
    const L = cross(), f = coreField(L.g), x0 = L.ox + 12, y0 = L.oy + 3, x1 = L.ox - 5, y1 = L.oy;
    const ok = aStar(f, x0, y0, x1, y1, PINCER_NODES), cut = aStar(f, x0, y0, x1, y1, 20);
    const steps = ok.path ? ok.path.length / 2 : 0, adj = ok.path && ok.path.every((v, i) => i < 2 || Math.abs(v - ok.path[i - 2]) <= 1);
    check(`S-73a pincer: A* finds an 8-way path (≤ ${PINCER_NODES} nodes) and stops at its node cap`,
      steps >= 19 && adj && ok.nodes <= PINCER_NODES && !ok.capped && cut.capped && cut.nodes === 20 && !cut.path,
      JSON.stringify({ steps, nodes: ok.nodes, cut: { capped: cut.capped, nodes: cut.nodes } }));
  }
  { // stagger: two pairs (two flanks due at once) never search in the same frame; one field build a frame at most
    const L = cross(), g = L.g, h = g.hunt;
    pair(L, [10, 0], [12, 3]); pair(L, [-10, 0], [-12, -3]);
    let two = 0, builds = 0; const f = coreField(g), s0 = h.searches;
    for (let i = 0; i < 120; i++) { const s = h.searches, b = f.builds; frame(L); if (h.searches - s > 1) two++; builds = Math.max(builds, f.builds - b); }
    check('S-73a pincer: never two A* searches in one frame (two flanks), ≤ 1 field build a frame',
      two === 0 && h.searches - s0 >= 6 && builds <= 1, JSON.stringify({ two, searches: h.searches - s0, builds }));
  }
  { // S-73b (D-198): the Echo reads the same coreField object; with a pair and the Echo alive, still ≤ 1 build a frame
    const L = cross(), g = L.g; g.research.echo = true;
    pair(L, [10, 0], [12, 3]);
    let builds = 0, same = true; const f = coreField(g);
    for (let i = 0; i < 90; i++) { const b = f.builds; frame(L); same = same && g.flow === f && !!g.echo && !('field' in g.echo); builds = Math.max(builds, f.builds - b); }
    check('S-73b pincer: the Echo and the hunters share one field (no Echo field of its own), ≤ 1 build a frame',
      same && builds <= 1, JSON.stringify({ same, builds, echo: !!g.echo }));
  }
  { // spawns on 50 Deep seeds: both 16–24 steps out, off screen, ≥ PINCER_SPLIT apart
    let made = 0; const bad = [];
    for (let s = 1; s <= 50; s++) {
      const g = new Game({ seed: s, mode: 'surge', audio: quiet, size: 256 }), w = g.world;
      const nx = Math.floor(g.nexus.x / CELL), ny = Math.floor(g.nexus.y / CELL);
      let at = null;
      for (let r = 52; r < 64 && !at; r++) for (let a = 0; a < 64 && !at; a++) { const x = nx + Math.round(Math.cos(a / 10) * r), y = ny + Math.round(Math.sin(a / 10) * r); if (!w.solid(x, y)) at = [x, y]; }
      if (!at) continue;
      Object.assign(g.player, { x: (at[0] + 0.5) * CELL, y: (at[1] + 0.5) * CELL });
      const p = spawnPincer(g);
      if (!p) continue;
      made++;
      const c = p.map(e => [Math.floor(e.x / CELL), Math.floor(e.y / CELL)]), d = c.map(q => fieldAt(g.flow, q[0], q[1]));
      const offs = p.every(e => Math.abs(e.x - g.player.x) > 576 + CELL || Math.abs(e.y - g.player.y) > 360 + CELL);
      const sep = Math.hypot(c[0][0] - c[1][0], c[0][1] - c[1][1]);
      if (!(d.every(v => v >= TRACER_SPAWN[0] && v <= TRACER_SPAWN[1]) && offs && sep >= PINCER_SPLIT && p[0].hunter === 'lead' && p[1].hunter === 'flank' && p[0].mate === p[1])) bad.push(`${s}: d ${d} sep ${sep.toFixed(1)} off ${offs}`);
    }
    check(`S-73a pincer: pair spawns are 16–24 steps out, off screen, ≥ ${PINCER_SPLIT} cells apart (50 Deep seeds, ≥ 35 spawned)`, made >= 35 && !bad.length, JSON.stringify({ made, bad }));
  }
  { // the timer: Deep only (none in the Veil), never a second pair while one lives (natural seed-1 caves)
    const at = (g, r0) => { const nx = Math.floor(g.nexus.x / CELL), ny = Math.floor(g.nexus.y / CELL);
      for (let r = r0; r < r0 + 10; r++) for (let a = 0; a < 64; a++) { const x = nx + Math.round(Math.cos(a / 10) * r), y = ny + Math.round(Math.sin(a / 10) * r); if (!g.world.solid(x, y)) return [x, y]; } };
    const run = (r0, n = 2) => {
      const g = new Game({ seed: 1, mode: 'surge', audio: quiet, size: 256 }); off(g); g.god = true;
      const c = at(g, r0), hold = () => Object.assign(g.player, { x: (c[0] + 0.5) * CELL, y: (c[1] + 0.5) * CELL, vx: 0, vy: 0 });
      const seen = [];
      for (let k = 0; k < n; k++) { g.hunt.pincer = 0.01; for (let i = 0; i < 5; i++) { hold(); g.update(1 / 60, still); } seen.push(g.hunters.filter(e => e.hunter === 'lead' || e.hunter === 'flank').length); }
      return { ring: g.ringNow, seen, pairs: g.hunt.pairs };
    };
    const deep = run(54), veil = run(30);
    check('S-73a pincer: a pair spawns in the Deep (none in the Veil), never a second while one lives',
      deep.ring >= 2 && deep.seen.join() === '2,2' && deep.pairs === 1 && veil.ring === 1 && veil.seen.join() === '0,0', JSON.stringify({ deep, veil }));
  }
  const near = (L, kind, dx) => { const e = makeTracer(L.g, L.ox, L.oy, kind); Object.assign(e, { x: L.g.player.x + dx, y: L.g.player.y, hitCd: 0 }); L.g.hunters.push(e); return e; };
  { // Surge: 6 + the tier step each
    const L = cross('surge'), g = L.g; g.player.invuln = 0;
    const e = near(L, 'lead', 14), hp = g.player.integrity; frame(L, 2);
    const dmg = hp - g.player.integrity, want = PINCER_DMG + e.tier * GLITCH_TIER.dmg[1];
    g.player.invuln = 0; const f = near(L, 'flank', -14); f.searchT = 0; f.pi = 0; const hp2 = g.player.integrity; frame(L, 2);
    const dmg2 = hp2 - g.player.integrity;
    check(`S-73a pincer: Surge contact ${want} each (6 + tier step)`, Math.abs(dmg - want) < 1e-6 && Math.abs(dmg2 - want) < 1e-6, JSON.stringify({ dmg, dmg2, want }));
  }
  { // Drift: a touch takes TRACER_TAKE worth each (S-74b); one killed, the other flees, then fades and is gone
    const L = cross('drift'), g = L.g; g.cargo.shard = 5 + 2 * C.TRACER_TAKE; const each = Array(C.TRACER_TAKE).fill('shard').join();
    const a = near(L, 'lead', 14), b = near(L, 'flank', -14); a.mate = b; b.mate = a; b.searchT = 0; b.pi = 0;
    const hp = g.player.integrity; frame(L, 3);
    const took = { a: a.carry.join(), b: b.carry.join(), left: g.cargo.shard, hp: g.player.integrity === hp };
    b.flee = 0; frame(L); a.hp = 0; frame(L);
    const fled = b.flee > 0 && b.part === true && b.flee <= PINCER_PART_S;
    let gone = -1; for (let i = 0; i < 8 * 60; i++) { frame(L); if (!g.hunters.includes(b)) { gone = i / 60; break; } }
    const saved = JSON.stringify(g.toSave());
    check(`S-73a pincer: Drift takes ${C.TRACER_TAKE} ◆ worth each, no damage; the lead killed, the flank flees then fades (gone in ≤ 3 s + fade); nothing saved`,
      took.a === each && took.b === each && took.left === 5 && took.hp && fled && gone > 0 && gone <= PINCER_PART_S + C.GLITCH_FADE_S + 0.1 && !/hunter|pincer|flank/i.test(saved),
      JSON.stringify({ took: { ...took, a: took.a.length, b: took.b.length }, fled, gone }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('pincer: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(200);
  await pg.evaluate(() => {
    const L = window.__lumen, g = L.game, w = g.world, C = 32, ox = w.cx + 60, oy = w.cy;
    for (let y = -8; y <= 8; y++) for (let x = -10; x <= 10; x++) { w.cells[w.idx(ox + x, oy + y)] = 2; w.markDirty(ox + x, oy + y); }
    const open = (x, y) => { w.cells[w.idx(ox + x, oy + y)] = 0; w.markDirty(ox + x, oy + y); };
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) open(x, y);
    for (let i = 2; i <= 8; i++) { open(i, 0); open(0, -i); }
    w.breaks++;
    g.player.x = (ox + 0.5) * C; g.player.y = (oy + 0.5) * C; g.player.vx = g.player.vy = 0;
    L.renderer.cam.x = g.player.x + 2 * C; L.renderer.cam.y = g.player.y - 2 * C;
    g.god = true; g.hunt.timer = g.hunt.pincer = 1e9; g.spawnTimer = 1e9;
    const mk = (hunter, x, y) => ({ hunter, x: (ox + x + 0.5) * C, y: (oy + y + 0.5) * C, r: 11, vx: 0, vy: 0, tier: 2, hp: 2, maxHp: 3, speed: 0, dmg: 0, flash: 0, hitCd: 9, spin: 0, best: 0, stall: 0, flee: 0, carry: [], trail: [], met: false });
    const a = mk('lead', 5, 0), b = mk('flank', 0, -5); a.mate = b; b.mate = a;
    g.hunters.push(a, b); g.hunt.off = true; // hold them still for the frame
    const ctx = L.renderer.ctx, stroke = ctx.stroke.bind(ctx);
    window.__pcLines = 0;
    ctx.stroke = (...q) => { if (String(ctx.strokeStyle).startsWith('rgba(255, 110, 200')) window.__pcLines++; return stroke(...q); };
  });
  await pg.waitForTimeout(150);
  if (shot) await pg.screenshot({ path: shot });
  const n = await pg.evaluate(() => window.__pcLines);
  check('S-73a pincer: the pair is drawn, joined by its dotted line', n >= 1, JSON.stringify({ n }));
  const pip = await pg.evaluate(() => { // S-73b (D-197): the white pip, read from the cached sprites
    const S = window.__lumen.renderer.sprites, px = (k, f) => { const c = S[k] && S[k].canvas; if (!c) return null;
      const g = c.getContext('2d'), m = c.width / 2, d = g.getImageData(Math.round(m + f * m), Math.round(m), 1, 1).data; return Math.min(d[1], d[2]); };
    const s = S['pc-flank-0'], ring = s ? 0.5 * 11 * 0.8 / s.half : 0;
    return { lead: px('pc-lead-0', 0), flankRing: px('pc-flank-0', ring), flankCore: px('pc-flank-0', 0) };
  });
  check('S-73b pincer: each dot carries a white pip (lead: a filled centre, flank: a ring inside its hollow)',
    pip.lead >= 230 && pip.flankRing >= 200 && pip.flankCore < pip.flankRing, JSON.stringify(pip));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.PINCER_SHOT, shot: process.env.PINCER_SHOT });
