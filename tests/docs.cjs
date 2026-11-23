// Docs health: keeps the handoff cheap to read and the version history consistent.
// Usage: node tests/docs.cjs   (also run at the start of tests/smoke.cjs)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOC_CAP = 8192; // bytes. A doc near the cap gets split word for word into a "-2" file; docs/archive is exempt.

function run() {
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok, detail });

  const docs = fs.readdirSync(path.join(ROOT, 'docs')).filter(f => f.endsWith('.md')).map(f => 'docs/' + f);
  const over = ['CLAUDE.md', ...docs].map(f => [f, fs.statSync(path.join(ROOT, f)).size]).filter(([, n]) => n > DOC_CAP);
  check(`docs under ${DOC_CAP} bytes`, over.length === 0, over.map(([f, n]) => `${f}=${n}`).join(', '));

  const status = fs.readFileSync(path.join(ROOT, 'docs/02-Current-Status-and-Next-Step.md'), 'utf8');
  check('handoff (02) under 60 lines', status.split('\n').length <= 60, `${status.split('\n').length} lines`);
  check('handoff (02) has exactly one Next step', (status.match(/^## Next step/gm) || []).length === 1);

  const version = (fs.readFileSync(path.join(ROOT, 'src/config.js'), 'utf8').match(/VERSION = '([^']+)'/) || [])[1];
  const log = fs.readFileSync(path.join(ROOT, 'docs/05-Changelog.md'), 'utf8');
  const entries = [...log.matchAll(/^## v(\S+)/gm)].map(m => m[1]);
  check('VERSION matches the top changelog entry', !!version && entries[0] === version, `config ${version}, changelog ${entries[0]}`);
  check('changelog versions are unique', new Set(entries).size === entries.length);

  const dec = fs.readFileSync(path.join(ROOT, 'docs/06-Decisions.md'), 'utf8');
  const ids = [...dec.matchAll(/^### (D-\d{3})/gm)].map(m => m[1]);
  check('decision IDs are unique', new Set(ids).size === ids.length && ids.length > 0, `${ids.length} decisions`);

  const inbox = fs.readdirSync(path.join(ROOT, 'docs/inbox')).filter(f => f !== 'README.md');
  check('inbox processed (only README left)', inbox.length === 0, inbox.join(', '));
  return out;
}

module.exports = { run };
if (require.main === module) {
  const res = run();
  for (const r of res) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
  process.exit(res.some(r => !r.ok) ? 1 : 0);
}
