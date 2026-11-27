// Docs health: keeps the handoff cheap to read and the version history consistent.
// Usage: node tests/docs.cjs   (also run at the start of tests/smoke.cjs)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOC_CAP = 8192; // bytes. A doc near the cap gets split word for word into a "-2" file; docs/archive is exempt.
const CODE_CAP = 600;  // lines per src/*.js and tests/*.cjs file (CLAUDE.md: split a file as it passes ~600; S-18)

function run() {
  const out = [];
  const check = (name, ok, detail = '') => out.push({ name, ok, detail });

  const docs = fs.readdirSync(path.join(ROOT, 'docs')).filter(f => f.endsWith('.md')).map(f => 'docs/' + f);
  const over = ['CLAUDE.md', ...docs].map(f => [f, fs.statSync(path.join(ROOT, f)).size]).filter(([, n]) => n > DOC_CAP);
  check(`docs under ${DOC_CAP} bytes`, over.length === 0, over.map(([f, n]) => `${f}=${n}`).join(', '));

  const status = fs.readFileSync(path.join(ROOT, 'docs/02-Current-Status-and-Next-Step.md'), 'utf8');
  check('handoff (02) under 60 lines', status.split('\n').length <= 60, `${status.split('\n').length} lines`);
  // Audit 159 (D-199): 02 hit 8 KB three times (Design 132, session 155, audit 159); a 7 KB cap leaves a build's growth room.
  const STATUS_CAP = 7168, sBytes = Buffer.byteLength(status);
  check(`handoff (02) under ${STATUS_CAP} bytes`, sBytes <= STATUS_CAP, `${sBytes} bytes`);
  check('handoff (02) has exactly one Next step', (status.match(/^## Next step/gm) || []).length === 1);

  const version = (fs.readFileSync(path.join(ROOT, 'src/config.js'), 'utf8').match(/VERSION = '([^']+)'/) || [])[1];
  const log = fs.readFileSync(path.join(ROOT, 'docs/05-Changelog.md'), 'utf8');
  const entries = [...log.matchAll(/^## v(\S+)/gm)].map(m => m[1]);
  check('VERSION matches the top changelog entry', !!version && entries[0] === version, `config ${version}, changelog ${entries[0]}`);
  check('changelog versions are unique', new Set(entries).size === entries.length);

  const dec = docs.filter(f => /^docs\/06-Decisions(-\d+)?\.md$/.test(f)).map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const ids = [...dec.matchAll(/^### (D-\d{3})/gm)].map(m => m[1]);
  check('decision IDs are unique', new Set(ids).size === ids.length && ids.length > 0, `${ids.length} decisions`);

  const code = ['src', 'tests'].flatMap(d => fs.readdirSync(path.join(ROOT, d)).filter(f => /\.c?js$/.test(f)).map(f => d + '/' + f));
  const long = code.map(f => [f, fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').length]).filter(([, n]) => n > CODE_CAP);
  check(`code files under ${CODE_CAP} lines`, long.length === 0 && code.length > 10, long.map(([f, n]) => `${f}=${n}`).join(', ') || `${code.length} files`);

  const pasted = fs.readdirSync(path.join(ROOT, 'tests')).filter(f => f.endsWith('.cjs') && f !== 'serve.cjs')
    .filter(f => /http\.createServer\s*\(/.test(fs.readFileSync(path.join(ROOT, 'tests', f), 'utf8')));
  check('tests serve through tests/serve.cjs (no pasted http servers)', pasted.length === 0, pasted.join(', '));

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
