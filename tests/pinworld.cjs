// Audit 150 (D-188): random New World seeds broke tests twice (B-101 Spire tests, B-103 `lens.cjs` rift site), so a
// rule broken twice gets a check. Every test clicks New World through `newWorld`, which pins the seed (B-012 / D-100's
// way: Math.random is fixed for the click only, so visual randomness stays free). A raw `#new-world` click needs a pin on
// that line or the 3 above (`Math.random = `), or an `any-seed:` note saying why the world does not matter.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PIN_R = 0.42; // seed (0.42 * 2 ** 31) | 0: the Spire tests' world (`spire.cjs` foundChecks prove its gaps)

async function newWorld(page, tap = false, r = PIN_R) {
  await page.evaluate(r => { window.__rnd = Math.random; Math.random = () => r; }, r);
  try { await (tap ? page.tap('#new-world') : page.click('#new-world')); }
  finally { await page.evaluate(() => { Math.random = window.__rnd; }); }
}

/** Raw New World clicks in tests/ and tools/ with no pin nearby and no `any-seed:` note. */
function unpinned(dirs = ['tests', 'tools']) {
  const hits = [];
  for (const d of dirs) for (const f of fs.readdirSync(path.join(ROOT, d)).filter(f => /\.(c|m)?js$/.test(f))) {
    const lines = fs.readFileSync(path.join(ROOT, d, f), 'utf8').split('\n');
    lines.forEach((l, i) => {
      if (!/['"]#?new-world['"]/.test(l) || l.includes('any-seed:')) return;
      if (lines.slice(Math.max(0, i - 3), i + 1).some(p => /Math\.random = /.test(p))) return;
      hits.push(`${d}/${f}:${i + 1}`);
    });
  }
  return hits;
}

function run() {
  const hits = unpinned();
  return [{ name: 'audit 150: every New World click in tests / tools pins its seed (B-101, B-103)', ok: hits.length === 0,
    detail: hits.slice(0, 12).join(', ') + (hits.length > 12 ? ` … ${hits.length} in all` : '') }];
}

module.exports = { run, unpinned, newWorld, PIN_R };
if (require.main === module) {
  const res = run();
  for (const r of res) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : ': ' + r.detail}`);
  process.exit(res.every(r => r.ok) ? 0 : 1);
}
