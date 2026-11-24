// Audit 44 (H1, flagged by audits 34, 39 and 44): gameplay tuning numbers live in src/config.js, not inline in src/game.js.
// A rule broken twice gets a check: any number in game.js's code (comments and strings stripped) that is not on the list below
// fails. The list is the cosmetic / structural numbers game.js keeps on purpose (particle counts and speeds, shake, fades,
// unit fractions). A new gameplay number goes to config.js; only a new purely cosmetic one may be added here, with a reason.
// Usage: node tests/tuning.cjs   (also run by tests/smoke.cjs)
const fs = require('fs');
const path = require('path');

const ALLOWED = new Set([
  0, 1, 2, 0.5,                 // identities, halves, × 2 (vault-cache hitstop)
  0.3, 0.35, 0.6, 0.7, 0.92,    // particle life / spread / drag, hurt flash
  8, 16, 18, 20, 30, 40, 50, 60, 70, 90, 150, 260, 300, 420, // burst counts + speeds, turn rates, trail, shake decay
  1.4, 1.5, 3, 4, 6,            // Nexus pulse fade, particle size, shake, pickup radius, collect margin
  0.9, 0.04, 0.4,               // pickup drag + bounce, streak life
]);

/** Numbers in `src` once comments, strings and identifiers like `x2` are taken out. */
function literals(src) {
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, "''");
  return [...code.matchAll(/(?<![\w$.])(\d+(?:\.\d+)?(?:e-?\d+)?)(?![\w$])/g)].map(m => Number(m[1]));
}

function run() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'game.js'), 'utf8');
  const stray = [...new Set(literals(src).filter(n => !ALLOWED.has(n)))];
  return [{ name: 'game.js has no bare tuning numbers (they live in config.js; audit 44)', ok: stray.length === 0,
    detail: stray.length ? `not in config.js: ${stray.join(', ')}` : '' }];
}

module.exports = { run, literals };
if (require.main === module) {
  const res = run();
  for (const r of res) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
  process.exit(res.some(r => !r.ok) ? 1 : 0);
}
