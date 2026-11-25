// Audit 119 checks (Node). smoke.cjs calls nodeChecks.
// B-092: `tools/biomefoe.mjs` gates were defined on 8 seeds, but the tool defaulted to 4, where both biome gates FAIL by
// noise (Kiln 0.800 / 0.916). The default must be the gate's seed count, and a smaller sample must give no verdict.
const fs = require('fs'), path = require('path');

async function nodeChecks(check) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'tools', 'biomefoe.mjs'), 'utf8');
  const n = Number((src.match(/export const GATE_SEEDS = (\d+)/) || [])[1]);
  check('audit 119: biomefoe gates are defined on ≥ 8 seeds and the tool defaults to that count (B-092)',
    n >= 8 && /arg\('seeds', GATE_SEEDS\)/.test(src), `GATE_SEEDS ${n}`);
  check('audit 119: biomefoe gives no gate verdict below GATE_SEEDS (B-092)',
    /if \(seeds < GATE_SEEDS\)[^\n]*no verdict/.test(src));
}
module.exports = { nodeChecks };
