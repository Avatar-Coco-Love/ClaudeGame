// S-40 colour check (node): every pair the player must tell apart by colour alone keeps CIE76 ΔE >= 25 with normal
// vision and under deuteranopia, protanopia and tritanopia (Machado, Oliveira & Fernandes 2009, severity 1.0, applied in
// linear sRGB). Colours are read from src/config.js, so a palette change re-runs the check. Usage: node tests/colours.cjs
const fs = require('fs');
const path = require('path');

const MIN_DE = 25;
const MACHADO = {
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};

const toLin = c => (c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const clamp01 = v => Math.max(0, Math.min(1, v));
const parse = s => s.startsWith('#') ? [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)) : s.split(',').map(Number);

// linear sRGB -> CIE Lab (D65)
function lab([r, g, b]) {
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b,
    Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
function sim(rgb, vision) {
  const l = parse(rgb).map(toLin), m = MACHADO[vision];
  return m ? m.map(row => clamp01(row[0] * l[0] + row[1] * l[1] + row[2] * l[2])) : l;
}
const deltaE = (a, b, vision) => { const A = lab(sim(a, vision)), B = lab(sim(b, vision)); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };

// The colour groups, pulled from config.js text (node can't import the ES module without a loader; this keeps it plain).
// Each item carries the shape it is drawn with; a pair whose shapes differ is told apart by shape, so it may sit below
// MIN_DE (S-40: "a pair that fails gets a shape difference, not a new colour"). Each shape is proved from the draw code.
function groups() {
  const read = f => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');
  const src = read('config.js'), render = read('render.js'), spit = read('spitter.js'), anom = read('anomaly.js'), terr = read('terrain.js');
  const list = name => JSON.parse(src.match(new RegExp(`${name} = (\\[[^\\]]*\\])`))[1].replace(/'/g, '"'));
  const shapes = {
    // world: every Anomaly site is the same hexagram (two triangles), so the kinds rest on colour alone
    hexagram: /for \(const off of \[0, Math\.PI\]\)/.test(anom),
    diamond: /kind === 'shard'\) \{ g\.moveTo\(0, -5\); g\.lineTo\(3, 0\); g\.lineTo\(0, 5\); g\.lineTo\(-3, 0\)/.test(render),
    triangle: /else \{ g\.moveTo\(0, -5\); g\.lineTo\(4\.5, 3\); g\.lineTo\(-4\.5, 3\); \}/.test(render),
    circle: /kind === 'lumen'\) g\.arc\(/.test(render),
    // S-49: Tide ≈ two wave strokes, Calx ⬟ a pentagon, both upright in the pickup sprite and the terrain glyph
    wave: /kind === 'tide'\) \{[^}]*waves\(g,/.test(render) && /t === T\.TIDE\) \{[^}]*waves\(g,/.test(terr),
    pentagon: /kind === 'calx'\) \{ pentagon\(g,/.test(render) && /else \{[^}]*pentagon\(g,/.test(terr),
    star: /const spikes = 3 \+ tier;/.test(render), // tier t: a (3 + t)-point star
    rhombus: /g\.moveTo\(r \* 1\.3, 0\); g\.lineTo\(0, r \* 0\.75\); g\.lineTo\(-r \* 1\.3, 0\)/.test(spit), // Spitter body
  };
  const anomaly = [];
  for (const m of src.matchAll(/(\w+): \{ name: '[^']+', glyph: '[^']+', fx: .*?rgb: '([^']+)' \}/g)) anomaly.push({ id: m[1], c: m[2], shape: 'hexagram' });
  const SHAPE = { shard: 'diamond', prism: 'triangle', lumen: 'circle', tide: 'wave', calx: 'pentagon' }, res = [];
  for (const m of src.matchAll(/(shard|prism|lumen|tide|calx): \{ color: '(#[0-9a-f]{6})'/g)) res.push({ id: m[1], c: m[2], shape: SHAPE[m[1]] });
  const glitch = list('GLITCH_COLORS').map((c, t) => ({ id: `glitch tier ${t}`, c, shape: `star${3 + t}` }));
  const spitter = { id: 'spitter', c: list('SPITTER_COLORS')[0], shape: 'rhombus' };
  const pairs = [];
  const all = g => { for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) pairs.push([g[i], g[j]]); };
  all(anomaly); all(res);
  for (const g of glitch) pairs.push([g, spitter]);
  // S-46a: Shoal / Kiln rock + dense edges (a cell outline, shape 'cell': no shape exemption, so colour alone must hold)
  // vs each pickup, Overclock amber, and the other new ring's edges.
  const ring = [];
  for (const m of src.matchAll(/name: '(Shoal|Kiln)',.*?rockEdge: '(#[0-9a-f]{6})'.*?denseEdge: '(#[0-9a-f]{6})'/g))
    ring.push({ id: `${m[1]} rock`, c: m[2], shape: 'cell', r: m[1] }, { id: `${m[1]} dense`, c: m[3], shape: 'cell', r: m[1] });
  const amber = anomaly.find(a => a.id === 'overclock');
  for (const e of ring) {
    for (const o of [...res, amber]) pairs.push([e, { ...o, shape: 'cell' }]);
    for (const o of ring) if (o.r > e.r) pairs.push([e, o]); // Kiln < Shoal alphabetically: each cross pair once
  }
  return { pairs, shapes, counts: { anomaly: anomaly.length, res: res.length, glitch: glitch.length, ring: ring.length } };
}

function run() {
  const out = [], { pairs, shapes, counts } = groups();
  out.push({ name: 'colours: read 3 Anomaly kinds, 5 pickups, 4 Glitch tiers + Spitter, Shoal + Kiln edges from config.js',
    ok: counts.anomaly === 3 && counts.res === 5 && counts.glitch === 4 && counts.ring === 4, detail: JSON.stringify(counts) });
  const missing = Object.keys(shapes).filter(k => !shapes[k]);
  out.push({ name: 'colours: each claimed shape is still in the draw code (hexagram, ◆ ▲ ● ≈ ⬟ pickups, Glitch star, Spitter rhombus)',
    ok: !missing.length, detail: missing.join(', ') });
  const byShape = (a, b) => a.shape !== b.shape && shapes[a.shape.replace(/\d+$/, '')] && shapes[b.shape.replace(/\d+$/, '')];
  for (const vision of ['normal', 'deuteranopia', 'protanopia', 'tritanopia']) {
    const de = pairs.map(([a, b]) => ({ pair: `${a.id}/${b.id}`, de: Math.round(deltaE(a.c, b.c, vision)), shape: byShape(a, b) }));
    const colourOnly = de.filter(x => !x.shape), low = colourOnly.reduce((m, x) => x.de < m.de ? x : m);
    const bad = colourOnly.filter(x => x.de < MIN_DE), shaped = de.filter(x => x.shape && x.de < MIN_DE);
    out.push({ name: `colours (S-40): ${pairs.length} must-tell-apart pairs under ${vision}: ΔE ≥ ${MIN_DE} or a shape difference (colour-only lowest ${low.pair} ${low.de})`,
      ok: !bad.length, detail: bad.map(x => `${x.pair} ${x.de}`).concat(shaped.map(x => `by shape: ${x.pair} ${x.de}`)).join(', ') });
  }
  // The simulation itself: pure red and green collapse for a deuteranope, stay apart for a tritanope.
  out.push({ name: 'colours: the Machado matrices behave (red/green close under deuteranopia, far under tritanopia)',
    ok: deltaE('#ff0000', '#00ff00', 'deuteranopia') < deltaE('#ff0000', '#00ff00', 'tritanopia') / 2 });
  return out;
}

module.exports = { run, deltaE };
if (require.main === module) {
  let failed = 0;
  for (const r of run()) { if (!r.ok) failed++; console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`); }
  process.exit(failed ? 1 : 0);
}
