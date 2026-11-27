// S-75 thumb arc checks (D-207). smoke.cjs calls nodeChecks and browserChecks. Node: `arcSlots` on six phone / tablet
// viewports with the keep rects measured in the browser (Design 167 rule): every centre within reach of the bottom-right
// corner (≤ 275 px, ≤ 300 on the third arc), ≥ 8 px from each edge, ≥ 52 px apart, right of w / 2 + 24, ≥ 8 px clear of
// each keep rect and of the 140 px grip disc. Browser (touch, all five buttons + ⊕): the real buttons obey the same, and
// overlap no HUD box or each other; on a desktop the five keep their old place. Usage: node tests/thumbarc.cjs [--browser]
// (ARC_SHOT=dir for one screenshot per orientation)
const VPS = [[390, 844], [320, 568], [844, 390], [568, 320], [375, 667], [768, 1024], [640, 360]];
// Keep rects measured with Max all + Echo + Lens + a Beacon, in the Nexus (session 168, Pixel 7 touch): ⊕, minimap, ♪ ≡,
// bank panel; arcSlots' caller adds the reserved hint box.
const KEEP = {
  '390x844': [[123, 728, 267, 774], [282, 12, 378, 108], [282, 114, 378, 158], [12, 12, 176, 94]],
  '320x568': [[88, 438, 232, 484], [212, 12, 308, 108], [212, 114, 308, 158], [12, 12, 176, 94]],
  '844x390': [[350, 274, 494, 320], [720, 12, 832, 124], [616, 12, 712, 56], [12, 12, 222, 100]],
  '568x320': [[212, 204, 356, 250], [456, 12, 556, 112], [352, 12, 448, 56], [12, 12, 180, 98]],
  '375x667': [[116, 537, 259, 583], [267, 12, 363, 108], [267, 114, 363, 158], [12, 12, 176, 94]],
  '768x1024': [[312, 908, 456, 954], [616, 12, 756, 152], [660, 158, 756, 202], [12, 12, 222, 100]],
  '640x360': [[248, 244, 392, 290], [528, 12, 628, 112], [424, 12, 520, 56], [12, 12, 233, 117]],
};
const rect = ([l, t, r, b]) => ({ l, t, r, b });
const hintBox = (w, h) => ({ l: w / 2 - 150, r: w / 2 + 150, t: h - 76, b: h - 22 });
const gap = (c, k) => Math.max(k.l - (c.x + 22), (c.x - 22) - k.r, k.t - (c.y + 22), (c.y - 22) - k.b); // < 0: overlapping
const corner = (c, w, h) => Math.hypot(w - c.x, h - c.y);
const gripClear = (c, w, h) => Math.hypot(Math.max(0, w - (c.x + 22)), Math.max(0, h - (c.y + 22))) > 140; // the box's nearest point

// Every rule S-75 sets for one set of centres; returns the reasons it fails ([] = pass).
function judge(cs, w, h, keep, n) {
  const bad = [];
  if (cs.length !== n) bad.push(`${cs.length}/${n} placed`);
  cs.forEach((c, i) => {
    const d = corner(c, w, h);
    if (d > 300) bad.push(`#${i} ${Math.round(d)} px from the corner`);
    if (c.x - 22 < 8 || c.y - 22 < 8 || c.x + 22 > w - 8 || c.y + 22 > h - 8) bad.push(`#${i} off the edge`);
    if (c.x < w / 2 + 24) bad.push(`#${i} left of w/2 + 24`);
    if (!gripClear(c, w, h)) bad.push(`#${i} on the grip disc`);
    keep.forEach((k, j) => { if (gap(c, k) < 8) bad.push(`#${i} within 8 px of keep ${j}`); });
    cs.slice(0, i).forEach((o, j) => { if (Math.hypot(o.x - c.x, o.y - c.y) < 52) bad.push(`#${i} < 52 px from #${j}`);
      if (Math.max(Math.abs(o.x - c.x), Math.abs(o.y - c.y)) < 50) bad.push(`#${i} box within 6 px of #${j} (B-111)`); });
  });
  return bad;
}

async function nodeChecks(check) {
  const { arcSlots, ARC } = await import('../src/thumbarc.js');
  const out = [], far = {};
  for (const [w, h] of VPS) {
    const keep = [...KEEP[`${w}x${h}`].map(rect), hintBox(w, h)];
    const R = Math.min(215, Math.max(180, Math.min(w, h) / 2));
    for (let n = 1; n <= 5; n++) {
      const cs = arcSlots(w, h, n, keep), bad = judge(cs, w, h, keep, n);
      // reach: the inner two arcs ≤ 275 px; only a slot on the third arc may reach 300
      cs.forEach((c, i) => { const d = corner(c, w, h); if (d > 275 && d < R + 112 - 2) bad.push(`#${i} ${Math.round(d)} px off the third arc`); });
      if (bad.length) out.push(`${w}×${h} n${n}: ${bad.join(', ')}`);
      if (n === 5) far[`${w}x${h}`] = Math.round(Math.max(...cs.map(c => corner(c, w, h))));
    }
  }
  check('S-75 thumb arc: 1–5 slots on six viewports within reach (≤ 275, third arc ≤ 300), on screen, ≥ 52 apart, clear of keep rects + grip',
    out.length === 0, out.join(' | ') || JSON.stringify(far));
  const a = arcSlots(390, 844, 5), b = arcSlots(390, 844, 5);
  check('S-75 arcSlots is pure (same input, same slots; 54 px chord ≥ 52)', JSON.stringify(a) === JSON.stringify(b) && a.length === 5 &&
    Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) >= 52 && ARC.chord === 54, JSON.stringify(a));
}

const ARC_IDS = ['mode-btn', 'scan-btn', 'beacon-btn', 'echo-btn', 'call-btn'];
async function setup(pg, touch = true) {
  const { newWorld } = require('./pinworld.cjs');
  await pg.evaluate(() => { try { localStorage.clear(); } catch {} });
  await pg.reload(); await pg.waitForTimeout(300);
  await newWorld(pg, touch); await pg.waitForTimeout(200);
  await pg.evaluate(() => { const g = window.__lumen.game; Object.assign(g.research, { scanner: true, wide: true, echo: true });
    g.nexusLevels.lens = 1; g.craft.beacon = 1; g.demo = true; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; });
  await pg.waitForTimeout(400);
}
const measure = pg => pg.evaluate(ids => {
  const r = el => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  const keep = { matrix: '#matrix-btn', mini: '#minimap', btns: '.top-right .buttons', bank: '.top-left', hint: '#hint' };
  return { btns: ids.map(id => r(document.getElementById(id))), hidden: ids.filter(id => document.getElementById(id).classList.contains('hidden')),
    keep: Object.fromEntries(Object.entries(keep).map(([k, s]) => { const e = document.querySelector(s); return [k, e.offsetParent || e.getClientRects().length ? r(e) : null]; })),
    w: innerWidth, h: innerHeight };
}, ARC_IDS);

async function browserChecks(browser, url, check, errors, shots) {
  const { devices } = require('playwright');
  const P7 = devices['Pixel 7'], { isMobile, hasTouch, deviceScaleFactor, userAgent } = P7;
  const ctx = await browser.newContext({ isMobile, hasTouch, deviceScaleFactor, userAgent, viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errors.push('thumbarc: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(300);
  await setup(pg);
  const out = [], seen = {};
  for (const [w, h] of VPS) {
    await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(250);
    const m = await measure(pg);
    seen[`${w}x${h}`] = Object.fromEntries(Object.entries(m.keep).map(([k, r]) => [k, r && [r.l, r.t, r.r, r.b].map(Math.round)]));
    const cs = m.btns.map(b => ({ x: (b.l + b.r) / 2, y: (b.t + b.b) / 2, w: b.r - b.l, h: b.b - b.t }));
    const keep = Object.values(m.keep).filter(Boolean);
    const bad = [...(m.hidden.length ? [`hidden ${m.hidden}`] : []), ...judge(cs, w, h, keep, 5),
      ...cs.filter(c => c.w < 44 || c.h < 44).map(() => 'a button < 44 px')];
    if (bad.length) out.push(`${w}×${h}: ${bad.join(', ')}`);
    if (shots && (w === 390 || w === 844)) await pg.screenshot({ path: `${shots}/arc-${w}x${h}.png` });
  }
  check('S-75 browser (touch, all five + ⊕ shown): the real buttons on the arc, ≥ 44 px, in reach, clear of ⊕ / minimap / ♪ ≡ / bank / hint / grip / each other',
    out.length === 0, out.join(' | ') || '');
  if (process.env.ARC_KEEP) console.log(JSON.stringify(seen));
  // ⟂ names the new mode above itself for 1 s on a switch (touch: the button is glyph-only)
  await pg.setViewportSize({ width: 390, height: 844 }); await pg.waitForTimeout(200);
  const nm = () => pg.evaluate(() => { const n = document.getElementById('mode-name'), b = n.getBoundingClientRect(), m = document.getElementById('mode-btn').getBoundingClientRect();
    return { text: n.textContent, op: +getComputedStyle(n).opacity, above: b.bottom <= m.top, onScreen: b.left >= 0 && b.right <= innerWidth }; });
  await pg.tap('#mode-btn'); await pg.waitForTimeout(350); const on = await nm();
  await pg.waitForTimeout(1100); const off = await nm();
  check('S-75 ⟂ shows the new mode name above it after a tap, gone ~1 s later', on.text === 'Wide' && on.op > 0.9 && on.above && on.onScreen && off.op < 0.1,
    JSON.stringify({ on, off }));
  await ctx.close();
  // desktop: no touch class, the buttons keep their old places (no inline placement)
  const dp = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  dp.on('pageerror', e => errors.push('thumbarc desktop: ' + e.message));
  await dp.goto(url); await dp.waitForTimeout(300); await setup(dp, false);
  const d = await dp.evaluate(ids => ({ touch: document.body.classList.contains('touch'), inline: ids.filter(id => document.getElementById(id).style.left),
    pos: ids.map(id => getComputedStyle(document.getElementById(id)).position), right: ids.map(id => Math.round(document.getElementById(id).getBoundingClientRect().right)) }), ARC_IDS);
  check('S-75 desktop: no thumb arc (no touch class, no inline placement, buttons in the top-right column)',
    !d.touch && d.inline.length === 0 && d.pos.every(p => p !== 'fixed') && d.right.every(r => r > 1000), JSON.stringify(d));
  await dp.close();
}

module.exports = { nodeChecks, browserChecks, arcJudge: judge };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks,
  browser: process.argv.includes('--browser') || !!process.env.ARC_SHOT, shot: process.env.ARC_SHOT });
