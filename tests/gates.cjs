// Audit 129: the bot gates (tools/*.mjs) run as child processes. run(tool, args) starts one at most once per arg list and
// returns a promise of its stdout (rejects on a non-zero exit, as execFileSync threw). smoke.cjs calls prestart() first,
// so the gates run on spare cores beside the rest of the smoke (they were ~130 s of its node phase, back to back);
// a test file run alone just starts its own. The bots are seeded sims: running beside other work changes no result.
const { execFile } = require('child_process');
const path = require('path');
const started = new Map();

function run(tool, args = []) {
  const key = [tool, ...args].join(' ');
  if (!started.has(key)) started.set(key, new Promise((resolve, reject) =>
    execFile(process.execPath, [path.join(__dirname, '../tools', tool), ...args], { encoding: 'utf8', maxBuffer: 1 << 24 },
      (err, stdout) => (err ? reject(err) : resolve(stdout)))));
  return started.get(key);
}
// Every gate a smoke test awaits (same tool + args as the test, or it simply runs twice). Unawaited rejections are held.
const SMOKE = [['eventrun.mjs'], ['eventrun.mjs', '--call'], ['biomefoe.mjs', '--biome=kiln'], ['biomefoe.mjs', '--biome=shoal', '--seeds=8'], ['biomefoe.mjs', '--biome=kiln', '--wards=2'], ['bossrun.mjs'], ['bossrun.mjs', '--boss=gyre'], ['echobot.mjs', '--orders'], ['huntrun.mjs', '--rings=deep', '--no-echo']];
function prestart() { for (const [t, ...a] of SMOKE) run(t, a).catch(() => {}); }

/** Smoke check: every run(...) in a test file is in SMOKE (else prestart misses it and it runs back to back again), and no
 *  test file still runs a tool with execFileSync. */
function nodeChecks(check) {
  const fs = require('fs'), dir = __dirname, calls = [], sync = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.cjs') && f !== 'gates.cjs')) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of src.matchAll(/gates\.cjs'\)\.run\('([^']+)'(?:, \[([^\]]*)\])?\)/g))
      calls.push([m[1], ...(m[2] ? m[2].split(',').map(a => a.trim().replace(/^'|'$/g, '')) : [])].join(' '));
    if (/execFileSync\([^\n]*tools\//.test(src)) sync.push(f);
  }
  const known = new Set(SMOKE.map(a => a.join(' '))), missing = calls.filter(c => !known.has(c));
  check('audit 129: every bot gate a test awaits is prestarted by smoke.cjs (gates.cjs SMOKE), none runs with execFileSync',
    calls.length >= SMOKE.length && !missing.length && !sync.length, `calls ${calls.length}, missing ${missing.join('; ') || '—'}, sync ${sync.join(', ') || '—'}`);
}

module.exports = { run, prestart, SMOKE, nodeChecks };
