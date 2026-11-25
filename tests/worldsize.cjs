// S-45 (D-120): world size is saved data. S-46b: the minimap's 160-cell window and the ending's explored-area frame.
// smoke.cjs calls nodeChecks + browserChecks.
let check = () => {};

/** FNV-1a over the cells and the site lists (vaults, Spires, Anomaly sites) of a Game's world. */
function worldHash(g) {
  let h = 0x811c9dc5;
  const mix = v => { h ^= v & 0xff; h = Math.imul(h, 0x01000193) >>> 0; };
  for (const c of g.world.cells) mix(c);
  const sites = JSON.stringify([g.world.w, g.world.vaults.map(v => [v.x, v.y, v.kind]), g.spires.map(s => [s.x, s.y]),
    g.anomaly.sites.map(s => [s.x, s.y, s.ring, s.kind])]);
  for (let i = 0; i < sites.length; i++) mix(sites.charCodeAt(i));
  return h.toString(16);
}

/** A format-17 save of seed `seed` (the shape every pre-S-45 build wrote): a few cells mined round the Nexus. */
function oldSave(Game, audio, seed) {
  const g = new Game({ seed, mode: 'drift', audio }), w = g.world;
  for (let i = 0; i < 12; i++) { const x = Math.floor(w.cx) + 3 + i, y = Math.floor(w.cy); w.hit(x, y, 99); }
  const s = JSON.parse(JSON.stringify(g.toSave()));
  s.v = 17; delete s.size;
  return s;
}

// Pinned from the pre-S-45 code (v1.4.27): a format-17 save of each seed, loaded.
const PINNED = { 77: '3417ffc9', 4242: '24b44836', 909: '299f80a0' };

async function sizeChecks() {
  const { Game } = await import('../src/game.js');
  const { upgradeSave, SAVE_FORMAT } = await import('../src/save.js');
  const { packBits } = await import('../src/world.js');
  const audio = new Proxy({}, { get: () => () => {} });
  const got = {}, ups = {};
  for (const seed of Object.keys(PINNED).map(Number)) {
    const up = ups[seed] = upgradeSave(oldSave(Game, audio, seed));
    got[seed] = up ? worldHash(new Game({ seed, mode: 'drift', audio, save: up })) : 'no save';
  }
  const bad = Object.keys(PINNED).filter(k => got[k] !== PINNED[k]);
  check('a format-17 save loads at 160 with the same cells, vaults, Spires and Anomaly sites (S-45, pinned)',
    bad.length === 0 && Object.values(ups).every(u => u.v === SAVE_FORMAT && u.size === 160), bad.map(k => `${k}: ${got[k]}`).join(', ') || 'all 3 seeds match');

  const g = new Game({ seed: 77, mode: 'drift', audio, size: 256 }), s = JSON.parse(JSON.stringify(g.toSave()));
  const h = new Game({ seed: 77, mode: 'drift', audio, save: upgradeSave(s) });
  check('a 256 world builds, saves its size and reloads with the same hash (S-45)', g.world.w === 256 && g.world.cells.length === 256 * 256
    && s.size === 256 && h.world.w === 256 && worldHash(h) === worldHash(g), `w ${g.world.w} → save ${s.size} → ${h.world.w}`);
  const fresh = new Game({ seed: 77, mode: 'drift', audio });
  check('a new world is still 160 and saves size 160 (S-45)', fresh.world.w === 160 && fresh.toSave().size === 160, `w ${fresh.world.w}`);

  const base = JSON.parse(JSON.stringify(fresh.toSave())), bits = packBits(new Uint8Array(256 * 256));
  const cases = { 'size 256, 160 bitsets': { size: 256 }, 'size 200 (no profile)': { size: 200 }, 'size "160"': { size: '160' },
    'explored too short': { explored: packBits(new Uint8Array(100)) }, 'broken too long': { broken: bits } };
  const wrong = Object.entries(cases).filter(([, p]) => upgradeSave({ ...JSON.parse(JSON.stringify(base)), ...p }) !== null).map(([k]) => k);
  check('a save whose size is unknown or whose bitsets don\'t hold size² bits is no save (S-45, B-066 rule)',
    wrong.length === 0 && upgradeSave(JSON.parse(JSON.stringify(base))) !== null, wrong.join(', ') || `${Object.keys(cases).length} rejected`);
}

// S-46a (D-122): the 256 profile's two new rings and appended sites.
async function ringChecks() {
  const { Game } = await import('../src/game.js');
  const { RINGS, VAULT_D_OUTER, ANOMALY_D, WORLD_PROFILES } = await import('../src/config.js');
  const audio = new Proxy({}, { get: () => () => {} });
  const big = new Game({ seed: 77, mode: 'drift', audio, size: 256 }), w = big.world, small = new Game({ seed: 77, mode: 'drift', audio, size: 160 });
  const ringAt = (wo, d) => wo.ring(Math.floor(wo.cx + d), Math.floor(wo.cy)); // d cells east of the centre
  const want = [[10, 0], [30, 1], [60, 2], [90, 3], [110, 4], [125, 4]], got = want.map(([d]) => ringAt(w, d));
  check('a 256 world has 5 rings: Shoal from d 80, Kiln from d 104, each tougher than the last (S-46a)',
    RINGS[3].name === 'Shoal' && RINGS[4].name === 'Kiln' && RINGS[3].r0 === 80 && RINGS[4].r0 === 104
    && want.every(([, r], i) => got[i] === r) && RINGS.every((r, i) => !i || r.hpMul > RINGS[i - 1].hpMul), `rings at ${want.map(x => x[0])}: ${got}`);
  const smallMax = Math.max(...small.world.rings);
  check('a 160 world keeps 3 rings (its corners are Deep) (S-46a)', smallMax === 2 && ringAt(small.world, 79) === 2, `max ring ${smallMax}`);
  const prof = WORLD_PROFILES[256], first = big.world.vaults.slice(0, prof.vaults), outer = big.world.vaults.slice(prof.vaults);
  const dist = v => Math.hypot(v.x - w.cx, v.y - w.cy);
  check('a 256 world adds 4 outer vaults at d 86–118 after the first 6 (S-46a)', first.length === 6 && outer.length === prof.outerVaults
    && outer.every(v => dist(v) >= VAULT_D_OUTER[0] - 1 && dist(v) <= VAULT_D_OUTER[1] + 1) && first.every(v => dist(v) < 74),
    `outer at ${outer.map(v => Math.round(dist(v)))}`);
  const { SPIRE_D, SPIRE_VAULT_GAP } = await import('../src/config.js');
  check('outer vaults start a full Spire gap past the Spire band, so they never move a Spire (S-46a, D-122)', VAULT_D_OUTER[0] >= SPIRE_D[1] + SPIRE_VAULT_GAP);
  const per = [0, 1, 2, 3, 4].map(r => big.anomaly.sites.filter(s => s.ring === r));
  const inBand = per.every((l, r) => l.every(s => { const d = Math.hypot(s.x + 0.5 - w.cx, s.y + 0.5 - w.cy); return d >= ANOMALY_D[r][0] && d <= ANOMALY_D[r][1]; }));
  check('a 256 world has Anomalies [3, 5, 8, 6, 6], each in its ring\'s band (S-46a)',
    per.map(l => l.length).join() === prof.anomalies.join() && inBand, per.map(l => l.length).join());
  // the new rings draw from their own salts: dropping them leaves the inner sites exactly as they were
  const saved = prof.anomalies, savedV = prof.outerVaults;
  prof.anomalies = [3, 5, 8]; prof.outerVaults = 0;
  const inner = new Game({ seed: 77, mode: 'drift', audio, size: 256 });
  prof.anomalies = saved; prof.outerVaults = savedV;
  const key = l => JSON.stringify(l.map(s => [s.x, s.y, s.kind]));
  check('the Shoal / Kiln sites are appended: vaults, Spires and inner Anomalies match a 256 world without them (S-46a)',
    key(inner.world.vaults) === key(first) && key(inner.spires) === key(big.spires) && key(inner.anomaly.sites) === key(big.anomaly.sites.filter(s => s.ring < 3)));
}

async function windowChecks() {
  const { Game } = await import('../src/game.js');
  const { miniWindow } = await import('../src/hud.js');
  const { exploredBox } = await import('../src/ending.js');
  const audio = new Proxy({}, { get: () => () => {} }), C = 32, S = 180;
  const small = new Game({ seed: 77, mode: 'drift', audio }), big = new Game({ seed: 77, mode: 'drift', audio, size: 256 });
  const a = miniWindow(small.world, 10, 4000, S);
  check('a 160 world\'s minimap window is the whole map, wherever the core is (S-46b)',
    a.ox === 0 && a.oy === 0 && a.win === 160 * C && a.sc === S / (160 * C), JSON.stringify(a));
  // Every core position on a 2-cell grid: the core and the Nexus are inside the window, which stays inside the world.
  let bad = 0, n = 0;
  for (let y = 1; y < 256; y += 2) for (let x = 1; x < 256; x += 2) {
    const px = x * C, py = y * C, q = miniWindow(big.world, px, py, S), inside = (u, v) => u >= q.ox && u <= q.ox + q.win && v >= q.oy && v <= q.oy + q.win;
    n++; if (!inside(px, py) || !inside(big.nexus.x, big.nexus.y) || q.ox < 0 || q.oy < 0 || q.ox + q.win > 256 * C || q.oy + q.win > 256 * C) bad++;
  }
  const mid = miniWindow(big.world, 128 * C, 128 * C, S);
  check('a 256 world\'s minimap is a 160-cell window: centred on the core mid-world, clamped at the edge, and the core and the Nexus are always inside it (S-46b, D-123)',
    bad === 0 && mid.win === 160 * C && mid.ox === 48 * C && miniWindow(big.world, 250 * C, 3 * C, S).ox === 96 * C, `${bad}/${n} bad`);
  const w = big.world;
  w.explored.fill(0);
  for (const [x, y] of [[40, 128], [210, 30]]) w.explored[y * w.w + x] = 1;
  const b = exploredBox(big), sp = big.spires;
  const holds = (x, y) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
  check('the ending frames the explored area: its box holds every explored cell, every Spire and the Nexus, and no more (S-46b)',
    b.x0 === Math.min(40, ...sp.map(s => s.x)) * C && b.x1 === Math.max(211, ...sp.map(s => s.x + 1)) * C && b.y0 === Math.min(30, ...sp.map(s => s.y)) * C
      && holds(big.nexus.x, big.nexus.y) && sp.every(s => holds(s.x * C, s.y * C)), JSON.stringify(b));
}

/** Browser: a 256 world attached to the live renderer, the core far out: the minimap draws the core and the Nexus where
 *  miniWindow puts them (one synchronous evaluate, so no frame of the 160 game runs in between). */
async function browserChecks(browser, url, c, errors) {
  check = c;
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('worldsize: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  const r = await pg.evaluate(async () => {
    const L = window.__lumen, { Game } = await import('/src/game.js'), hud = await import('/src/hud.js');
    const old = L.renderer.game, g = new Game({ seed: 77, mode: 'drift', size: 256, audio: new Proxy({}, { get: () => () => {} }) });
    g.player.x = 230 * 32; g.player.y = 60 * 32;
    L.renderer.attach(g); hud.drawMinimap(L.renderer);
    const c = L.renderer.minimap, m = c.getContext('2d'), q = L.renderer.miniWin;
    const at = (x, y) => [...m.getImageData(Math.floor((x - q.ox) * q.sc), Math.floor((y - q.oy) * q.sc), 1, 1).data].slice(0, 3);
    const out = { core: at(g.player.x, g.player.y), nexus: at(g.nexus.x, g.nexus.y), ox: q.ox / 32, oy: q.oy / 32 };
    L.renderer.attach(old);
    return out;
  });
  check('a 256 world\'s minimap draws the core (gold) and the Nexus (white) inside its window when the core is far out (S-46b)',
    r.ox === 96 && r.oy === 0 && r.core[0] > 200 && r.core[1] > 160 && r.core[2] < 120 && r.nexus.every(v => v > 200), JSON.stringify(r));
  await pg.close();
}

async function nodeChecks(c) {
  check = c;
  await sizeChecks().catch(e => check('S-45 world-size checks ran', false, e.message));
  await ringChecks().catch(e => check('S-46a ring checks ran', false, e.message));
  await windowChecks().catch(e => check('S-46b window checks ran', false, e.message));
}

module.exports = { nodeChecks, browserChecks };
