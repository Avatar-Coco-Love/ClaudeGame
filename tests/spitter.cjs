// S-32 Spitter checks (D-087, D-096). smoke.cjs calls nodeChecks. Node only: spawn share over 400 Deep spawns (none
// shallower), a bolt hits a core in the open, never through rock (and a Spitter behind rock holds fire), the beam pops a
// bolt, Wake Glitches stay plain, Drift clears bolts.
// Usage: node tests/spitter.cjs
const quiet = new Proxy({}, { get: () => () => {} });
const DT = 1 / 60, idle = { move: { x: 0, y: 0 }, aim: null, fire: false };

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { trySpawnGlitch, makeGlitch } = await import('../src/glitch.js');
  const { makeSpitter } = await import('../src/spitter.js');
  const { T, CELL, BOLT_DMG, SPITTER_SHOT_S, UPGRADES } = await import('../src/config.js');
  const make = (seed = 77, mode = 'surge') => {
    const g = new Game({ seed, mode, audio: quiet });
    for (const u of UPGRADES) g.upgrades[u.id] = { beam: 4, range: 3, thrust: 3, cargo: 4, magnet: 2, hull: 2 }[u.id] || 0;
    g.player.integrity = g.stat('hull'); return g;
  };
  /** Move the core `cells` east of the Nexus and clear a disc of `r` cells around it (rock only; bedrock stays). */
  const park = (g, cells, r = 22) => {
    const w = g.world, px = Math.floor(g.nexus.x / CELL) + cells, py = Math.floor(g.nexus.y / CELL);
    for (let y = py - r; y <= py + r; y++) for (let x = px - r; x <= px + r; x++)
      if ((x - px) ** 2 + (y - py) ** 2 <= r * r && x > 0 && y > 0 && x < w.w - 1 && y < w.h - 1) w.cells[y * w.w + x] = T.EMPTY;
    g.player.x = (px + 0.5) * CELL; g.player.y = (py + 0.5) * CELL; g.player.vx = g.player.vy = 0; g.spawnTimer = 99;
    return { px, py };
  };

  // Spawn share: 400 natural spawns in the Deep (tier >= 2) -> 20-30 % Spitters; 400 at tier 1 -> none.
  {
    const share = (cells, seed) => { const g = make(seed); park(g, cells); let n = 0, sp = 0;
      const dist = Math.hypot(g.player.x - g.nexus.x, g.player.y - g.nexus.y);
      for (let k = 0; k < 400; k++) { g.enemies = []; trySpawnGlitch(g, dist); if (g.enemies[0]) { n++; if (g.enemies[0].spitter) sp++; } }
      return { n, sp, frac: sp / Math.max(n, 1) }; };
    const deep = [77, 5, 9].map(s => share(60, s)), mid = share(32, 77);
    const tot = deep.reduce((a, r) => a + r.sp, 0) / deep.reduce((a, r) => a + r.n, 0);
    check('S-32: Deep natural spawns are 20-30 % Spitters (400 per seed, 3 seeds); none at tier 1',
      deep.every(r => r.n >= 380 && r.frac >= 0.2 && r.frac <= 0.3) && mid.sp === 0 && mid.n >= 380,
      `deep ${deep.map(r => `${r.sp}/${r.n}`).join(' ')} (${(tot * 100).toFixed(1)} %), tier 1 ${mid.sp}/${mid.n}`);
  }
  /** A Spitter `dx` px east of the core (tier 2), already alert. */
  const spitterAt = (g, dx) => { const p = g.player, e = makeSpitter(makeGlitch(p.x + dx, p.y, 2, 0)); g.enemies.push(e); return e; };

  // In the open: it closes to the hold distance, stops, fires within one shot period, and the bolt takes BOLT_DMG.
  {
    const g = make(); park(g, 60); const e = spitterAt(g, 300), p = g.player, hp0 = p.integrity;
    let t = 0, fired = -1, hit = -1, minD = Infinity;
    for (; t < 8 && hit < 0; t += DT) {
      g.update(DT, idle); g.spawnTimer = 99; p.x = p.x; // the core stays put (no input)
      minD = Math.min(minD, Math.hypot(e.x - p.x, e.y - p.y));
      if (fired < 0 && g.bolts.length) fired = t;
      if (p.integrity < hp0) hit = t;
    }
    check('S-32: a Spitter holds ~200 px out and its bolt hits a core in the open for BOLT_DMG',
      fired >= 0 && fired <= SPITTER_SHOT_S + 0.1 && hit > fired && Math.abs(hp0 - p.integrity - BOLT_DMG) < 1e-6 && minD > 180,
      JSON.stringify({ fired: +fired.toFixed(2), hit: +hit.toFixed(2), dmg: hp0 - p.integrity, minD: Math.round(minD) }));
  }
  // Never through rock: a bolt fired at the core with a rock column between stops on it; a Spitter behind rock holds fire.
  {
    const g = make(); const { px, py } = park(g, 60), p = g.player, w = g.world, hp0 = p.integrity;
    for (let y = py - 3; y <= py + 3; y++) w.cells[y * w.w + px + 3] = T.ROCK;
    g.bolts.push({ bolt: true, x: p.x + 6 * CELL, y: p.y, vx: -150, vy: 0, r: 5, hp: 0.5, flash: 0, life: 4 });
    const e = spitterAt(g, 6 * CELL);
    let shots = 0;
    for (let t = 0; t < 6; t += DT) { const n = g.bolts.length; g.update(DT, idle); g.spawnTimer = 99; if (g.bolts.length > n) shots++; }
    check('S-32: a bolt stops at the first solid cell, and a Spitter with rock in the way never fires',
      p.integrity === hp0 && g.bolts.length === 0 && shots === 0 && g.enemies.includes(e),
      JSON.stringify({ dmg: hp0 - p.integrity, bolts: g.bolts.length, shots, alive: g.enemies.includes(e) }));
  }
  // The beam pops a bolt: aimed at it, the bolt is gone before it reaches the core.
  {
    const g = make(); park(g, 60); const p = g.player, hp0 = p.integrity;
    g.bolts.push({ bolt: true, x: p.x + 150, y: p.y, vx: -150, vy: 0, r: 5, hp: 0.5, flash: 0, life: 4 });
    let t = 0; for (; t < 2 && g.bolts.length; t += DT) { g.update(DT, { move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fire: true }); g.spawnTimer = 99; }
    check('S-32: the beam pops a bolt before it lands', g.bolts.length === 0 && p.integrity === hp0 && t < 0.9,
      JSON.stringify({ t: +t.toFixed(2), dmg: hp0 - p.integrity }));
  }
  // Wake Glitches stay plain (a Deep Spire, 12 s of a god-mode Wake); Drift clears bolts.
  {
    const g = make(); g.god = true; const s = g.spires[0]; s.fed = 80;
    g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 3.5) * 32;
    let seen = 0, spit = 0;
    for (let t = 0; t < 12; t += DT) { g.update(DT, idle); for (const e of g.enemies) { seen++; if (e.spitter) spit++; } }
    const d = make(); park(d, 60); spitterAt(d, 200); d.bolts.push({ bolt: true, x: 0, y: 0, vx: 0, vy: 0, r: 5, hp: 0.5, flash: 0, life: 4 });
    d.setMode('drift'); d.update(DT, idle);
    check('S-32: Wake Glitches are never Spitters; Drift clears Glitches and bolts',
      !!g.wake && seen > 0 && spit === 0 && d.bolts.length === 0 && d.enemies.length === 0, JSON.stringify({ wake: !!g.wake, seen, spit, bolts: d.bolts.length }));
  }
}
module.exports = { nodeChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
