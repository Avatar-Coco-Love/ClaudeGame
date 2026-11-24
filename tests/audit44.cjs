// Audit 44 checks (node-side). smoke.cjs calls nodeChecks.
// B-036: a full Pulse charge held at bedrock (the map edge) waited for "something in reach" and the raycast counted bedrock, so it
//        thumped every ~1.5 s with no effect. B-037: a malformed save (`beacons: {}` / `3`, `pickups: {}`, `vaultSkip: {}`) threw
//        inside new Game and stranded the player on a crash. B-038: the carried beacon count loaded unclamped ('x' -> NaN, 1e9 -> endless).
const audio = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave } = await import('../src/save.js');
  const { CELL, T, BEACON_STOCK } = await import('../src/config.js');

  // B-036: carve a corridor along the west bedrock border and hold a full charge facing it for 10 s.
  const g = new Game({ seed: 5, mode: 'drift', audio }), w = g.world, y = Math.floor(w.h / 2);
  g.research.pulse = true; g.beamMode = 'pulse';
  for (let x = 2; x < 12; x++) w.destroy(x, y);
  Object.assign(g.player, { x: 2.5 * CELL, y: (y + 0.5) * CELL, angle: Math.PI, vx: 0, vy: 0 });
  let fires = 0;
  for (let i = 0; i < 600; i++) { g.player.angle = Math.PI; const r = g.beam.recover; g.update(1 / 60, { move: { x: 0, y: 0 }, aim: { x: -1, y: 0 }, fire: true }); if (g.beam.recover > r + 0.1) fires++; }
  const waiting = g.beam.charge;
  // Same spot, a rock cell put back in front: the ready shot still fires (S-21 unchanged).
  const edge = w.cells[y * w.w + 1] === T.BEDROCK;
  w.cells[y * w.w + 2] = T.ROCK; g.player.x = 4.5 * CELL;
  for (let i = 0; i < 60 && !fires; i++) { g.player.angle = Math.PI; const r = g.beam.recover; g.update(1 / 60, { move: { x: 0, y: 0 }, aim: { x: -1, y: 0 }, fire: true }); if (g.beam.recover > r + 0.1) fires = -1; }
  check('a full Pulse held at bedrock waits (no burst in 10 s); rock in front still fires it (B-036)', edge && fires === -1 && waiting >= 1 - 1e-9,
    JSON.stringify({ edge, fires, waiting }));

  // B-037 + B-038: malformed saves load as a playable world instead of throwing.
  const base = new Game({ seed: 5, mode: 'drift', audio }).toSave(), out = {};
  const cases = { beaconsObj: { beacons: {} }, beaconsNum: { beacons: 3 }, pickupsObj: { pickups: {} }, pickupsBad: { pickups: [5, null] },
    vaultSkipObj: { vaultSkip: {} }, stockHuge: { craft: { beacon: 1e9 } }, stockText: { craft: { beacon: 'x' } }, stockNeg: { craft: { beacon: -4 } }, noCraft: { craft: null } };
  for (const [k, bad] of Object.entries(cases)) {
    try { const h = new Game({ seed: 5, mode: 'drift', audio, save: upgradeSave({ ...JSON.parse(JSON.stringify(base)), ...bad }) }); out[k] = h.craft.beacon; }
    catch (e) { out[k] = 'THROWS ' + e.message; }
  }
  check('malformed beacons / pickups / vaultSkip in a save load as empty, never a crash (B-037)',
    ['beaconsObj', 'beaconsNum', 'pickupsObj', 'pickupsBad', 'vaultSkipObj', 'noCraft'].every(k => out[k] === 0), JSON.stringify(out));
  check('carried beacons load as an integer 0..3 (B-038)', out.stockHuge === BEACON_STOCK && out.stockText === 0 && out.stockNeg === 0, JSON.stringify(out));
}

module.exports = { nodeChecks };
