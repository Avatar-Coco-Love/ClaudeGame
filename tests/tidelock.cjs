// S-59 Tide Lock checks (D-162, lock.js + undertow.js). smoke.cjs calls nodeChecks + browserChecks. Node: sites are the
// outer vaults centred in the Shoal (seeded, none in a 160 world); a lock's chunk always flows (a calm draw becomes
// LOCK_TIDE_MIN along the seeded heading); the shell takes a hit only against the flow (dot < -0.5: the core's own line,
// or the Echo's), other cells and plain vaults × 1; Drift = Surge; an opened lock is a plain vault; nothing saved, an old
// save loads the same flow; probe: time to open with a top build holding station downstream ≤ 2× a plain vault's.
// Browser: mint chevrons on the upstream shell. Usage: node tests/tidelock.cjs [--browser] (TIDE_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { vaultSites, World } = await import('../src/world.js');
  const { tideSites, tideFlow, lockMul } = await import('../src/lock.js');
  const { CELL, CHUNK, T, TIDE_RING, VAULT_HALF, LOCK_TIDE_MIN, WORLD_PROFILES, UPGRADES } = await import('../src/config.js');
  const make = (mode = 'drift', seed = 4242) => { const g = new Game({ seed, mode, audio: quiet }); g.vents.off = true; g.enemies.length = 0; g.spawnTimer = 1e9; return g; };
  const SEEDS = [4242, 7, 99, 31337, 5, 11, 2024, 8080];
  {
    const bad = []; let n = 0, calm = 0;
    for (const seed of SEEDS) {
      const g = make('drift', seed), w = g.world, f = g.undertow.flow, s = g.locks.tides;
      const want = vaultSites(seed, w.w, w.h).map((v, i) => ({ ...v, i })).filter(v => v.i >= WORLD_PROFILES[256].vaults && w.ring(v.x, v.y) === TIDE_RING);
      if (JSON.stringify(s.map(L => L.i)) !== JSON.stringify(want.map(v => v.i))) bad.push(`${seed}: ${s.map(L => L.i)} vs ${want.map(v => v.i)}`);
      if (JSON.stringify(s) !== JSON.stringify(make('surge', seed).locks.tides) || JSON.stringify(Array.from(f)) !== JSON.stringify(Array.from(make('surge', seed).undertow.flow))) bad.push(`${seed}: Drift ≠ Surge`);
      for (const L of s) {
        const sp = Math.hypot(f[L.chunk * 2], f[L.chunk * 2 + 1]);
        if (L.chunk !== Math.floor(L.y / CHUNK) * w.chunksW + Math.floor(L.x / CHUNK) || !(sp > 1)) bad.push(`${seed}/${L.i}: calm (${sp})`);
        if (Math.abs(sp - LOCK_TIDE_MIN) < 1e-3) { calm++; if (Math.abs(f[L.chunk * 2] - L.hx * LOCK_TIDE_MIN) > 1e-3) bad.push(`${seed}/${L.i}: heading`); }
      }
      n += s.length;
    }
    check('S-59 tide locks: the outer vaults centred in the Shoal, Drift = Surge; each lock chunk flows (a calm draw → 40 px/s on the seeded heading); none in a 160 world',
      bad.length === 0 && n > 0 && calm > 0 && tideSites(new World(4242, [], 160)).length === 0, bad.slice(0, 3).join('; ') + ` (${n} locks, ${calm} were calm / ${SEEDS.length} seeds)`);
  }
  /** Lock 0, the shell cell nearest its downstream side, and the flow; the core put `d` cells from that cell along `ang` (rad from downstream). */
  const setup = (mode = 'drift') => {
    const g = make(mode), w = g.world, L = g.locks.tides[0], [fx, fy] = tideFlow(g, L);
    let best = null;
    for (let y = L.y - VAULT_HALF; y <= L.y + VAULT_HALF; y++) for (let x = L.x - VAULT_HALF; x <= L.x + VAULT_HALF; x++)
      if (w.get(x, y) === T.VAULT) { const k = (x - L.x) * fx + (y - L.y) * fy; if (!best || k > best.k) best = { x, y, k }; }
    return { g, w, L, fx, fy, sx: best.x, sy: best.y };
  };
  {
    const r = {};
    for (const mode of ['drift', 'surge']) {
      const { g, w, fx, fy, sx, sy } = setup(mode), i = sy * w.w + sx, rows = [];
      for (const deg of [0, 30, 59, 90, 135, 180]) { // the core's place around the cell, from straight downstream
        const a = deg * Math.PI / 180, ux = fx * Math.cos(a) - fy * Math.sin(a), uy = fx * Math.sin(a) + fy * Math.cos(a);
        g.player.x = (sx + 0.5 + ux * 4) * CELL; g.player.y = (sy + 0.5 + uy * 4) * CELL; w.damage[i] = 0; w.hit(sx, sy, 1); rows.push(+w.damage[i].toFixed(3));
      }
      const echo = [[-fx, -fy], [fx, fy], [-fy, fx]].map(d => { w.damage[i] = 0; w.hit(sx, sy, 1, d); return w.damage[i]; }); // a given dir wins
      const plain = g.world.vaults.find(v => ![...g.locks.sites, ...g.locks.tides].some(q => q.x === v.x && q.y === v.y)), pk = plain.cells.find(c => w.cells[c] === T.VAULT);
      const rock = w.cells.findIndex((c, k) => c === T.ROCK && w.ring(k % w.w, Math.floor(k / w.w)) === TIDE_RING);
      r[mode] = { rows, echo, plain: lockMul(g, pk % w.w, Math.floor(pk / w.w), T.VAULT, [fx, fy]), rock: lockMul(g, rock % w.w, Math.floor(rock / w.w), T.ROCK, [fx, fy]) };
    }
    const d = r.drift;
    check('S-59 tide locks: the shell takes a hit only against the flow (core 0–59° off downstream: × 1; 90°+: × 0); the Echo\'s own aim counts; a plain vault and Shoal rock × 1; Drift = Surge',
      JSON.stringify(d) === JSON.stringify(r.surge) && JSON.stringify(d.rows) === JSON.stringify([1, 1, 1, 0, 0, 0]) && JSON.stringify(d.echo) === '[1,0,0]' && d.plain === 1 && d.rock === 1, JSON.stringify(r));
  }
  {
    const { g, w, L, fx, fy, sx, sy } = setup(), i = sy * w.w + sx;
    w.destroy(L.x, L.y); // the cache burst: an opened lock
    g.player.x = (sx + 0.5 - fx * 4) * CELL; g.player.y = (sy + 0.5 - fy * 4) * CELL; w.hit(sx, sy, 1); // from upstream: still × 1 now
    const save = JSON.parse(JSON.stringify(g.toSave())), back = new Game({ seed: 4242, mode: 'drift', audio: quiet, save });
    const fresh = make(), keys = x => JSON.stringify(Object.keys(x.toSave()));
    check('S-59 tide locks: an opened lock is a plain vault; nothing saved; a reload (old save) has the same locks and flow',
      w.damage[i] === 1 && keys(g) === keys(fresh) && !/tide|lock/i.test(JSON.stringify(Object.keys(g.toSave()))) && JSON.stringify(back.locks.tides) === JSON.stringify(fresh.locks.tides)
        && JSON.stringify(Array.from(back.undertow.flow)) === JSON.stringify(Array.from(fresh.undertow.flow)), JSON.stringify({ d: w.damage[i] }));
  }
  { // probe: a top build (Focus) holds station 6 cells downstream of the lock's centre, beaming at it, until the cache bursts
    const open = plain => {
      const { g, w, L, fx, fy } = setup(), H = VAULT_HALF; g.god = true;
      for (let y = L.y - H - 9; y <= L.y + H + 9; y++) for (let x = L.x - H - 9; x <= L.x + H + 9; x++)
        if (Math.max(Math.abs(x - L.x), Math.abs(y - L.y)) > H && w.get(x, y) !== T.BEDROCK) w.cells[y * w.w + x] = T.EMPTY;
      for (const up of UPGRADES) g.upgrades[up.id] = g.topLevel(up);
      if (plain) w.hitMul = null;
      const cx = (L.x + 0.5) * CELL, cy = (L.y + 0.5) * CELL, hx = cx + fx * 6 * CELL, hy = cy + fy * 6 * CELL, p = g.player;
      p.x = hx; p.y = hy; p.vx = p.vy = 0;
      let t = 0;
      for (; t < 60 && w.get(L.x, L.y) === T.CACHE; t += 1 / 60) {
        const mx = hx - p.x, my = hy - p.y, md = Math.hypot(mx, my), move = md > 0.3 * CELL ? { x: mx / md, y: my / md } : { x: 0, y: 0 };
        const ax = cx - p.x, ay = cy - p.y, ad = Math.hypot(ax, ay);
        g.enemies.length = 0; g.update(1 / 60, { move, fire: true, aim: { x: ax / ad, y: ay / ad } }); g.events.length = 0;
      }
      return t;
    };
    const lock = open(false), plain = open(true);
    check('S-59 probe: time to open a Tide Lock from downstream with a top build ≤ 2× a plain vault\'s (logged in 09)', lock < 60 && plain < 60 && lock <= 2 * plain,
      `lock ${lock.toFixed(2)} s, plain ${plain.toFixed(2)} s, ratio ${(lock / plain).toFixed(2)}`);
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('tidelock: ' + e.message));
  await pg.goto(url + (url.includes('?') ? '&' : '?') + 'seed=4242'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  const { CELL } = await import('../src/config.js');
  const has = await pg.evaluate(C => {
    const L = window.__lumen, g = L.game, w = g.world, K = g.locks && g.locks.tides && g.locks.tides[0];
    if (!K) return 'none: ' + g.world.seed + ' ' + JSON.stringify(g.locks && Object.keys(g.locks));
    for (let y = K.y - 8; y <= K.y + 8; y++) for (let x = K.x - 8; x <= K.x + 8; x++) if (Math.max(Math.abs(x - K.x), Math.abs(y - K.y)) > 3 && w.get(x, y) !== 5 && w.solid(x, y)) w.destroy(x, y);
    g.player.x = (K.x - 6) * C; g.player.y = (K.y + 0.5) * C; g.player.vx = g.player.vy = 0; g.undertow.off = true;
    L.renderer.cam.x = (K.x + 0.5) * C; L.renderer.cam.y = (K.y + 0.5) * C;
    w.reveal((K.x + 0.5) * C, (K.y + 0.5) * C, 12 * C); g.pickups.length = 0; g.god = true; g.vents.off = true;
    return true;
  }, CELL);
  await pg.waitForTimeout(150);
  const n = await pg.evaluate(() => window.__lumen.renderer.tideChevrons || 0);
  if (shot) await pg.screenshot({ path: shot });
  check('S-59 tide locks: a seen lock\'s upstream shell carries mint chevrons', has === true && n >= 2 && n <= 12, JSON.stringify({ has, n }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.TIDE_SHOT, shot: process.env.TIDE_SHOT });
