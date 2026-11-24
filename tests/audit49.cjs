// Audit 49 checks (node-side). smoke.cjs calls nodeChecks.
// B-041 (C1): dev.teleport aimed at a Spire carved the 3×3 room around the unbreakable core and landed the core inside it.
// B-042 (C2): beam sparks on a Spire core or facet used the ring's rock colour (world.hit is null for unbreakable cells).
const audio = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { createDev } = await import('../src/dev.js');
  const { UNBREAKABLE } = await import('../src/world.js');
  const { CELL, T, MATERIAL, RINGS } = await import('../src/config.js');

  // B-041: teleport straight at each Spire's centre; the core lands in a clear 3×3 room nearby.
  const stub = !globalThis.addEventListener; // createDev wires the backtick key + ?dev; node has neither
  if (stub) Object.assign(globalThis, { addEventListener() {}, location: { search: '' } });
  const g = new Game({ seed: 77, mode: 'drift', audio }), w = g.world, dev = createDev({ game: () => g, persist() {}, modeChanged() {} });
  if (stub) { delete globalThis.addEventListener; delete globalThis.location; }
  const nx = Math.floor(g.nexus.x / CELL), ny = Math.floor(g.nexus.y / CELL), out = [];
  for (const s of g.spires) {
    const d = Math.hypot(s.x - nx, s.y - ny), a = Math.atan2(s.y - ny, s.x - nx), at = dev.teleport(Math.round(d), a);
    const px = Math.floor(g.player.x / CELL), py = Math.floor(g.player.y / CELL);
    let stuck = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (w.solid(px + i, py + j)) stuck++;
    out.push({ off: Math.hypot(at.x - s.x, at.y - s.y).toFixed(1), stuck });
  }
  check('dev.teleport aimed at a Spire core lands in an open 3×3 room beside it (B-041)', out.every(o => o.stuck === 0 && o.off <= 8), JSON.stringify(out));

  // B-042: beam a facet from 3 cells above it; the sparks take the facet's edge colour.
  const h = new Game({ seed: 77, mode: 'drift', audio }), hw = h.world, s = h.spires[0], fx = s.x + 2, fy = s.y - 4;
  for (let y = fy - 4; y < fy; y++) for (let x = fx - 1; x <= fx + 1; x++) if (hw.solid(x, y) && !UNBREAKABLE.has(hw.get(x, y))) hw.destroy(x, y);
  Object.assign(h.player, { x: (fx + 0.5) * CELL, y: (fy - 2.5) * CELL, vx: 0, vy: 0, angle: Math.PI / 2 });
  const cols = new Set();
  for (let i = 0; i < 120; i++) {
    h.player.x = (fx + 0.5) * CELL; h.player.y = (fy - 2.5) * CELL; h.particles.length = 0;
    h.update(1 / 60, { move: { x: 0, y: 0 }, aim: { x: 0, y: 1 }, fire: true });
    for (const q of h.particles) cols.add(q.color);
  }
  const rock = RINGS.map(r => r.rockEdge);
  check('beam sparks on a Spire facet take the facet colour, not rock (B-042)', hw.get(fx, fy) === T.FACET && cols.has(MATERIAL[T.FACET].edge)
    && ![...cols].some(c => rock.includes(c)), [...cols].join(','));
}

module.exports = { nodeChecks };
