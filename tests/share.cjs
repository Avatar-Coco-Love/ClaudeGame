// Share image (D-044): index.html's og:image points at og.png on the live site, and og.png is a 1200×630 PNG under 400 KB.
// Usage: node tests/share.cjs   (also run from tests/smoke.cjs)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://avatar-coco-love.github.io/ClaudeGame/';

function run() {
  const out = [];
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const meta = p => (html.match(new RegExp(`<meta property="${p}" content="([^"]+)"`)) || [])[1];
  const img = meta('og:image');
  out.push({ name: 'og:image is og.png on the live site', ok: img === SITE + 'og.png', detail: img || 'missing' });
  out.push({ name: 'og:title, og:description and og:url are set', ok: !!meta('og:title') && !!meta('og:description') && meta('og:url') === SITE });
  const file = path.join(ROOT, 'og.png');
  const buf = fs.existsSync(file) ? fs.readFileSync(file) : Buffer.alloc(0);
  const png = buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG';
  const w = png ? buf.readUInt32BE(16) : 0, h = png ? buf.readUInt32BE(20) : 0;
  out.push({ name: 'og.png is a 1200×630 PNG under 400 KB', ok: w === 1200 && h === 630 && buf.length < 400 * 1024, detail: `${w}×${h}, ${Math.round(buf.length / 1024)} KB` });
  // B-020: the deploy copies an explicit file list, so og.png 404'd on the live site. Everything the page or its share card
  // needs must be in that list: og.png plus every relative src/href in index.html (by its top-level path segment).
  const yml = fs.readFileSync(path.join(ROOT, '.github/workflows/pages.yml'), 'utf8');
  const cp = (yml.match(/cp -r ([^\n]+?) _site\//) || [])[1] || '';
  const shipped = new Set(cp.split(/\s+/).filter(Boolean));
  const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(m => m[1])
    .filter(u => !/^(https?:|data:|#|\/\/|mailto:)/.test(u)).map(u => u.replace(/^\.\//, '').split(/[/?#]/)[0]);
  const missing = [...new Set(['og.png', ...refs])].filter(f => !shipped.has(f));
  out.push({ name: 'the Pages deploy ships og.png and every file index.html links (B-020)', ok: !!cp && missing.length === 0,
    detail: missing.length ? 'missing: ' + missing.join(', ') : [...shipped].join(' ') });
  return out;
}

module.exports = { run };
if (require.main === module) {
  const res = run();
  for (const r of res) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
  process.exit(res.some(r => !r.ok) ? 1 : 0);
}
