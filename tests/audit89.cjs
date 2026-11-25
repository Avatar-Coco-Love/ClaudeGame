// Audit 89 checks (Node). smoke.cjs calls nodeChecks.
// H3: one `insideBorder` replaced four inline "inside the bedrock border" tests (world, spire ×2, anomaly, dev); S-46
// draws new sites in a 256 world, so every site footprint there must stay inside the border too.
let check = () => {};

async function borderChecks() {
  const { insideBorder } = await import('../src/world.js');
  const { BORDER } = await import('../src/config.js');
  // The rules as they were written inline before audit 89 (BORDER = 2).
  const old = {
    site: (x, y, H, w, h) => !(x - H < BORDER || y - H < BORDER || x + H > w - BORDER - 1 || y + H > h - BORDER - 1),
    load: (x, y, H, w, h) => x - H >= 2 && y - H >= 2 && x + H <= w - 3 && y + H <= h - 3,
    anomaly: (x, y, H, w, h) => !(x <= BORDER || y <= BORDER || x >= w - BORDER - 1 || y >= h - BORDER - 1),
  };
  const bad = [];
  for (const size of [160, 256]) for (const [name, H] of [['site', 3], ['site', 4], ['load', 4], ['anomaly', 1]])
    for (let y = -2; y < size + 2; y++) for (let x = -2; x < size + 2; x++)
      if (insideBorder(x, y, H, size, size) !== old[name](x, y, H, size, size)) { bad.push(`${name} ${size} (${x},${y})`); break; }
  check('audit 89: insideBorder matches the four inline border rules it replaced, every cell at 160 and 256 (H3)',
    bad.length === 0, bad.slice(0, 3).join(', ') || '2 sizes × 4 rules');

  const { Game } = await import('../src/game.js');
  const { SPIRE_HALF } = await import('../src/spire.js');
  const { VAULT_HALF } = await import('../src/config.js');
  const audio = new Proxy({}, { get: () => () => {} }), out = [];
  for (const seed of [3, 77, 4242]) {
    const g = new Game({ seed, mode: 'drift', audio, size: 256 }), W = g.world.w;
    const all = [...g.world.vaults.map(v => ['vault', v, VAULT_HALF]), ...g.spires.map(s => ['spire', s, SPIRE_HALF]),
      ...g.anomaly.sites.map(s => ['anomaly', s, 1])];
    for (const [k, s, H] of all) if (!insideBorder(s.x, s.y, H, W, W)) out.push(`${seed} ${k} (${s.x},${s.y})`);
  }
  check('audit 89: every vault, Spire and Anomaly site of a 256 world sits inside the bedrock border (3 seeds)',
    out.length === 0, out.slice(0, 3).join(', ') || 'all inside');
}

async function nodeChecks(c) {
  check = c;
  await borderChecks().catch(e => check('audit 89 border checks ran', false, e.message));
}

module.exports = { nodeChecks };
