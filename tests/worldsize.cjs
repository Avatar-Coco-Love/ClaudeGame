// S-45 (D-120): world size is saved data. Node-side; smoke.cjs calls nodeChecks.
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

async function nodeChecks(c) {
  check = c;
  await sizeChecks().catch(e => check('S-45 world-size checks ran', false, e.message));
}

module.exports = { nodeChecks };
