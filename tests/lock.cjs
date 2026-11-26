// S-58 Flare Lock checks (D-159, lock.js). smoke.cjs calls nodeChecks + browserChecks. Node: sites are the outer vaults
// centred in the Kiln (seeded, none in a 160 world); a shell takes × 0 outside / × 2 inside its soft window, a plain vault
// and other cells × 1; the window's flare shoves + heats a core ≤ 2.5 cells from the footprint, once per cycle, nothing
// farther; Drift = Surge; an opened lock (cache gone, also from an old save) is a plain vault; nothing saved; probe: time to
// open with a top build ≤ 2× a plain vault's. Browser: the tell is drawn. Usage: node tests/lock.cjs [--browser] (LOCK_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { vaultSites, World } = await import('../src/world.js');
  const { lockSites, lockPhase, lockMul } = await import('../src/lock.js');
  const { CELL, T, KILN_RING, VAULT_HALF, HURT_KNOCKBACK, VENT_PERIOD_S, VENT_HEAT, VENT_R, LOCK_SOFT_S, LOCK_SOFT_MUL, WORLD_PROFILES, UPGRADES } = await import('../src/config.js');
  const make = (mode = 'drift', seed = 4242) => { const g = new Game({ seed, mode, audio: quiet }); g.undertow.off = true; g.vents.off = true; g.enemies.length = 0; g.spawnTimer = 1e9; return g; };
  const SEEDS = [4242, 7, 99, 31337, 5, 11, 2024, 8080];
  {
    const bad = []; let n = 0;
    for (const seed of SEEDS) {
      const g = make('drift', seed), w = g.world, all = vaultSites(seed, w.w, w.h), s = g.locks.sites;
      const want = all.map((v, i) => ({ ...v, i })).filter(v => v.i >= WORLD_PROFILES[256].vaults && w.ring(v.x, v.y) === KILN_RING);
      if (JSON.stringify(s.map(L => L.i)) !== JSON.stringify(want.map(v => v.i))) bad.push(`${seed}: ${s.map(L => L.i)} vs ${want.map(v => v.i)}`);
      if (JSON.stringify(s) !== JSON.stringify(make('surge', seed).locks.sites)) bad.push(`${seed}: not deterministic`);
      if (s.some(L => !(L.phase >= 0 && L.phase < VENT_PERIOD_S))) bad.push(`${seed}: phase`);
      n += s.length;
    }
    const phases = new Set(SEEDS.flatMap(seed => make('drift', seed).locks.sites.map(L => L.phase.toFixed(3))));
    check('S-58 locks: the outer vaults centred in the Kiln, seeded (phases differ), equal in Drift and Surge; none in a 160 world',
      bad.length === 0 && n > 0 && phases.size === n && lockSites(new World(4242, [], 160)).length === 0, bad.slice(0, 3).join('; ') + ` (${n} locks / ${SEEDS.length} seeds)`);
  }
  /** Game at the start of lock 0's cycle n + u seconds. */
  const at = (g, u, n = 20) => { const L = g.locks.sites[0]; g.stats.time = n * VENT_PERIOD_S - L.phase + u; return L; };
  const shellOf = (g, L) => { for (let x = L.x - VAULT_HALF; x <= L.x; x++) if (g.world.get(x, L.y) === T.VAULT) return [x, L.y]; return null; };
  {
    const r = {};
    for (const mode of ['drift', 'surge']) {
      const g = make(mode), w = g.world, L = g.locks.sites[0], [sx, sy] = shellOf(g, L), i = sy * w.w + sx, rows = [];
      const s0 = VENT_PERIOD_S - LOCK_SOFT_S;
      for (const u of [0.5, s0 - 1.1, s0 - 0.5, s0 + 0.05, 7.9]) { at(g, u); w.damage[i] = 0; w.hit(sx, sy, 1); rows.push(+w.damage[i].toFixed(3)); }
      const plain = g.world.vaults.find(v => !g.locks.sites.some(q => q.x === v.x && q.y === v.y));
      at(g, 0.5); const pk = plain.cells.find(c => w.cells[c] === T.VAULT), rock = w.cells.findIndex((c, k) => c === T.ROCK && w.ring(k % w.w, Math.floor(k / w.w)) === KILN_RING);
      r[mode] = { rows, plain: lockMul(g, pk % w.w, Math.floor(pk / w.w), T.VAULT), rock: lockMul(g, rock % w.w, Math.floor(rock / w.w), T.ROCK) };
    }
    const d = r.drift;
    check('S-58 locks: a shell takes × 0 outside the window (idle, tell) and × 2 in its last 3 s (D-159); a plain vault and Kiln rock × 1; Drift = Surge',
      JSON.stringify(d) === JSON.stringify(r.surge) && JSON.stringify(d.rows) === JSON.stringify([0, 0, 0, LOCK_SOFT_MUL, LOCK_SOFT_MUL]) && d.plain === 1 && d.rock === 1 && LOCK_SOFT_S === 3 && LOCK_SOFT_MUL === 2,
      JSON.stringify(r));
    const g = make(), L = g.locks.sites[0], s0 = VENT_PERIOD_S - LOCK_SOFT_S, ph = [s0 - 1.1, s0 - 0.5, s0 + 0.01].map(u => { at(g, u); return lockPhase(L, g.stats.time); });
    check('S-58 locks: the cycle is idle, a 1 s tell, then the soft window (lockPhase)', ph[0].tell === 0 && !ph[0].soft && ph[1].tell > 0 && !ph[1].soft && ph[2].soft && ph[2].tell === 0, JSON.stringify(ph));
  }
  /** Clears a ring round lock 0's footprint, puts the core `off` cells west of its edge on the centre row, just before the window. */
  const atFlare = (mode, off, heat = 0) => {
    const g = make(mode), w = g.world, L = g.locks.sites[0], H = VAULT_HALF;
    for (let y = L.y - H - 6; y <= L.y + H + 6; y++) for (let x = L.x - H - 6; x <= L.x + H + 6; x++)
      if (Math.max(Math.abs(x - L.x), Math.abs(y - L.y)) > H && w.get(x, y) !== T.BEDROCK) w.cells[y * w.w + x] = T.EMPTY;
    const p = g.player; p.x = (L.x + 0.5 - H - 0.5 - off) * CELL; p.y = (L.y + 0.5) * CELL; p.vx = p.vy = 0;
    g.cargo.shard = 3; g.heat = heat; at(g, VENT_PERIOD_S - LOCK_SOFT_S - 1 / 120);
    return g;
  };
  const step = (g, k = 1) => { const out = []; for (let i = 0; i < k; i++) { g.enemies.length = 0; g.update(1 / 60, { move: { x: 0, y: 0 }, fire: false, aim: null }); g.events.length = 0; out.push({ vx: +g.player.vx.toFixed(3), heat: +g.heat.toFixed(3) }); } return out; };
  {
    const r = {};
    for (const mode of ['drift', 'surge']) {
      const g = atFlare(mode, 1.5), hull = g.player.integrity, log = step(g, 30);
      r[mode] = { vx: log[0].vx, heat: log[0].heat, hull: g.player.integrity === hull, cargo: g.cargo.shard === 3, kicks: log.filter((e, i) => i && e.vx < log[i - 1].vx - 1).length, flares: g.locks.flares };
    }
    const far = atFlare('drift', VENT_R + 0.1), farLog = step(far, 40);
    check('S-58 locks: the window opens with a flare: a core 1.5 cells out is shoved straight out at HURT_KNOCKBACK (+0.4 heat), once; no damage or cargo loss; Drift = Surge; 2.6 cells out: untouched',
      JSON.stringify(r.drift) === JSON.stringify(r.surge) && Math.abs(r.drift.vx + HURT_KNOCKBACK) < 1 && Math.abs(r.drift.heat - VENT_HEAT) < 1e-9 && r.drift.hull && r.drift.cargo && r.drift.kicks === 0 && r.drift.flares === 1
        && farLog.every(e => e.vx === 0 && e.heat === 0) && far.locks.flares === 0, JSON.stringify({ ...r, far: farLog[0] }));
  }
  {
    const g = make(), w = g.world, L = g.locks.sites[0], [sx, sy] = shellOf(g, L), i = sy * w.w + sx;
    w.destroy(L.x, L.y); // the cache burst: an opened lock
    at(g, 0.5); w.hit(sx, sy, 1);
    const fl = atFlare('drift', 1); fl.world.destroy(fl.locks.sites[0].x, fl.locks.sites[0].y); step(fl, 20);
    const save = JSON.parse(JSON.stringify(g.toSave())), back = new Game({ seed: 4242, mode: 'drift', audio: quiet, save });
    const [bx, by] = shellOf(back, back.locks.sites[0]), bi = by * back.world.w + bx; at(back, 0.5); back.world.damage[bi] = 0; back.world.hit(bx, by, 1);
    const keys = x => JSON.stringify(Object.keys(x.toSave()));
    check('S-58 locks: an opened lock (cache gone) is a plain vault, also after a reload: shell × 1, no flare; nothing saved',
      w.damage[i] === 1 && fl.locks.flares === 0 && back.world.get(L.x, L.y) !== T.CACHE && back.world.damage[bi] === 1 && keys(g) === keys(make()) && !/lock/i.test(JSON.stringify(g.toSave())),
      JSON.stringify({ d: w.damage[i], flares: fl.locks.flares, back: back.world.damage[bi] }));
  }
  { // probe: a top build (Focus) beams the centre row from 3.5 cells west of the footprint until the cache bursts
    const open = (u, plain) => {
      const g = atFlare('drift', 3.5); g.god = true;
      for (const up of UPGRADES) g.upgrades[up.id] = g.topLevel(up);
      if (plain) g.world.hitMul = null;
      const L = at(g, u); let t = 0;
      for (; t < 60 && g.world.get(L.x, L.y) === T.CACHE; t += 1 / 60) { g.heat = 0; g.enemies.length = 0; g.update(1 / 60, { move: { x: 0, y: 0 }, fire: true, aim: { x: 1, y: 0 } }); g.events.length = 0; }
      return t;
    };
    const us = Array.from({ length: 32 }, (_, k) => k * VENT_PERIOD_S / 32), lock = us.map(u => open(u, false)), plain = open(0, true), mean = lock.reduce((a, b) => a + b, 0) / us.length;
    check('S-58 probe: mean time to open a Flare Lock with a top build ≤ 2× a plain vault\'s (logged in 09)', plain < 60 && mean <= 2 * plain,
      `lock ${mean.toFixed(2)} s over 32 phases, plain ${plain.toFixed(2)} s, ratio ${(mean / plain).toFixed(2)}`);
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('lock: ' + e.message));
  await pg.goto(url + (url.includes('?') ? '&' : '?') + 'seed=4242'); await pg.waitForTimeout(200);
  for (let k = 0; k < 8; k++) { // B-096: "New world" draws a random seed and ~1 in 25 has no Flare Lock: retry until one does
    await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
    await pg.reload(); await pg.waitForTimeout(200);
    await pg.click('#new-world'); await pg.waitForTimeout(200);
    if (await pg.evaluate(() => !!(window.__lumen.game.locks && window.__lumen.game.locks.sites[0]))) break;
  }
  const { CELL, VENT_PERIOD_S } = await import('../src/config.js');
  const has = await pg.evaluate(([C, P]) => {
    const L = window.__lumen, g = L.game, w = g.world, K = g.locks && g.locks.sites[0];
    if (!K) return false;
    for (let y = K.y - 8; y <= K.y + 8; y++) for (let x = K.x - 8; x <= K.x + 8; x++) if (Math.max(Math.abs(x - K.x), Math.abs(y - K.y)) > 3 && w.get(x, y) !== 5 && w.solid(x, y)) w.destroy(x, y);
    g.player.x = (K.x - 7) * C; g.player.y = (K.y + 0.5) * C; g.player.vx = g.player.vy = 0;
    L.renderer.cam.x = g.player.x + 3 * C; L.renderer.cam.y = g.player.y;
    w.reveal(g.player.x, g.player.y, 12 * C); g.pickups.length = 0; g.god = true; g.undertow.off = true; g.vents.off = true;
    const ctx = L.renderer.ctx, stroke = ctx.stroke.bind(ctx); window.__lockStroke = [];
    ctx.stroke = (...a) => { if (ctx.strokeStyle === '#ff963c') window.__lockStroke.push(ctx.globalAlpha); return stroke(...a); };
    window.__lockAt = u => { g.stats.time = 20 * P - K.phase + u; };
    return true;
  }, [CELL, VENT_PERIOD_S]);
  const alpha = async u => { await pg.evaluate(u => { window.__lockStroke.length = 0; window.__lockAt(u); }, u); await pg.waitForTimeout(50); return pg.evaluate(() => Math.max(0, ...window.__lockStroke)); };
  const idle = await alpha(2), tell = await alpha(4.95);
  if (shot) await pg.screenshot({ path: shot });
  check('S-58 locks: a seen lock\'s shell edge is drawn faint when idle and warms in the tell', has && idle > 0 && idle < 0.2 && tell > 0.6, JSON.stringify({ has, idle, tell }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.LOCK_SHOT, shot: process.env.LOCK_SHOT });
