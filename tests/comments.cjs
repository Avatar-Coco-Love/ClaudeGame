// Audit 64: an inline `//` comment inserted mid-line swallowed the code after it three times in sessions 59–60
// (`main.js` hint string, `main.js` endSkip reset, `wake.js` faint ring). A rule broken twice gets a check: flag any line
// with code before `//` whose comment text ends like code (`);`, `; }`, a call on ctx/game/g, or a string then another `//`).
// A comment that must quote code puts it in backticks without the trailing `;`. Usage: node tests/comments.cjs (smoke runs it).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CODEY = /\);\s*\}?\s*$|;\s*\}\s*(\/\/|$)|\b(ctx|game|g)\.[a-zA-Z]+\(.*\);|'[^']*'\s*\/\//;

function swallowed() {
  const hits = [];
  for (const d of ['src', 'tests', 'tools']) for (const f of fs.readdirSync(path.join(ROOT, d)).filter(f => /\.(c|m)?js$/.test(f))) {
    fs.readFileSync(path.join(ROOT, d, f), 'utf8').split('\n').forEach((l, i) => {
      const m = l.match(/^(\s*[^\s/].*?[;{,)\]?:=]\s*)\/\/ (.*)$/);
      if (m && CODEY.test(m[2]) && !m[2].includes('comment-ok')) hits.push(`${d}/${f}:${i + 1}`);
    });
  }
  return hits;
}

function run() {
  const hits = swallowed();
  return [{ name: 'no inline comment swallows code after it (audit 64)', ok: hits.length === 0, detail: hits.join(', ') }];
}

module.exports = { run, swallowed };
if (require.main === module) {
  const res = run();
  for (const r of res) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
  process.exit(res.some(r => !r.ok) ? 1 : 0);
}
