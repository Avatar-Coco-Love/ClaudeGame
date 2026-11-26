// S-55 Arc beam mode checks (D-151, arc.js). smoke.cjs calls nodeChecks + browserChecks. Node: research 35 ●, cycle order
// focus → wide → pulse → arc, the ray at × 0.8 and each jump at × ARC_MUL × the ray's dps, jumps only to the same kind
// within 2 cells (a creature never to a bolt; ore only to its own type, never rock), an aim bot clears 3–9 cell crystal
// clusters 1.3–1.5× faster than Focus and rock at 0.8×, Drift = Surge. Browser: buy, Q to Arc, the ↯ glyph, a screenshot (ARC_SHOT).
const { newWorld } = require('./pinworld.cjs');
const audio = new Proxy({}, { get: () => () => {} });
const fire = () => ({ move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fire: true });
const idle = (extra = {}) => ({ move: { x: 0, y: 0 }, aim: null, fire: false, ...extra });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { T, CELL, BEAM_GLITCH_MUL, ARC_MUL } = await import('../src/config.js');
  const { buyResearch } = await import('../src/research.js');
  const { castBeam, unlockedModes } = await import('../src/beam.js');
  const { arcCells } = await import('../src/arc.js');

  // Research + cycle.
  const g = new Game({ seed: 77, mode: 'drift', audio });
  g.research.wide = true; g.research.pulse = true;
  g.bank.lumen = 34; const poor = buyResearch(g, 'arc');
  g.bank.lumen = 35; const bought = buyResearch(g, 'arc');
  const seq = [];
  for (let i = 0; i < 4; i++) { g.update(1 / 60, idle({ beamMode: true })); seq.push(g.beamMode); }
  check('S-55 arc: research 35 ●; Q cycles focus → wide → pulse → arc → focus', !poor && bought && g.bank.lumen === 0
    && unlockedModes(g).join() === 'focus,wide,pulse,arc' && seq.join() === 'wide,pulse,arc,focus', JSON.stringify({ poor, bought, seq }));

  // A lab near the Nexus: an open box, the core facing east, `fill(w, gx, gy)` lays the cells; `secs` of fire.
  const lab = (mode, fill, secs, m = 'drift') => {
    const h = new Game({ seed: 77, mode: m, audio }), w = h.world, gx = w.cx + 2, gy = w.cy + 6;
    h.spawnTimer = 1e9; h.enemies = [];
    for (let y = gy - 4; y <= gy + 4; y++) for (let x = gx - 4; x <= gx + 16; x++) w.cells[w.idx(x, y)] = T.EMPTY;
    fill(w, gx, gy);
    Object.assign(h.player, { x: (gx + 0.5) * CELL, y: (gy + 0.5) * CELL, vx: 0, vy: 0, angle: 0 });
    if (mode === 'arc') { h.research.arc = true; h.beamMode = 'arc'; }
    let broken = 0; const ob = h.onCellBroken.bind(h); h.onCellBroken = (x, y, t) => { broken++; return ob(x, y, t); };
    for (let i = 0; i < 60 * secs; i++) { h.update(1 / 60, fire()); h.player.x = (gx + 0.5) * CELL; h.player.y = (gy + 0.5) * CELL; h.player.vx = h.player.vy = 0; }
    return { h, w, gx, gy, broken };
  };
  // ×0.8 / ×0.35: one frame on a lone dense rock, and on a crystal with two crystal neighbours (one rock beside it too).
  const one = (mode, fill) => { const r = lab(mode, fill, 0); r.h.beam.on = true; castBeam(r.h, 1); return r; };
  const rockF = one('focus', (w, x, y) => { w.cells[w.idx(x + 3, y)] = T.DENSE; }), rockA = one('arc', (w, x, y) => { w.cells[w.idx(x + 3, y)] = T.DENSE; w.cells[w.idx(x + 3, y + 1)] = T.DENSE; });
  const dF = rockF.w.damage[rockF.w.idx(rockF.gx + 3, rockF.gy)], dA = rockA.w.damage[rockA.w.idx(rockA.gx + 3, rockA.gy)];
  const vein = (w, x, y) => { w.cells[w.idx(x + 3, y)] = T.CRYSTAL; w.cells[w.idx(x + 3, y - 1)] = T.CRYSTAL; w.cells[w.idx(x + 4, y + 1)] = T.CRYSTAL; w.cells[w.idx(x + 3, y + 1)] = T.ROCK; w.cells[w.idx(x + 4, y)] = T.PRISM; };
  const v = one('arc', vein), vw = v.w, dps = v.h.stat('beam');
  const dmg = (dx, dy) => +vw.damage[vw.idx(v.gx + dx, v.gy + dy)].toFixed(4);
  const rDmg = +(rockA.w.damage[rockA.w.idx(rockA.gx + 3, rockA.gy + 1)]).toFixed(4);
  check('S-55 arc: the ray deals 0.8× Focus; each jump ARC_MUL (0.5)×; rock and another ore type get no jump',
    Math.abs(dA / dF - 0.8) < 1e-6 && Math.abs(dmg(3, 0) - dps * 0.8) < 1e-4 && Math.abs(dmg(3, -1) - dps * 0.8 * ARC_MUL) < 1e-4
    && Math.abs(dmg(4, 1) - dps * 0.8 * ARC_MUL) < 1e-4 && dmg(3, 1) === 0 && dmg(4, 0) === 0 && rDmg === 0 && v.h.beam.arcs.length === 2,
    JSON.stringify({ ratio: dA / dF, hit: dmg(3, 0), up: dmg(3, -1), diag: dmg(4, 1), rock: dmg(3, 1), prism: dmg(4, 0), rDmg, dps }));

  // Jumps only to its own type within 2 cells: a crystal 3 rows off and a prism next door get none; a gap is fine.
  const far = lab('arc', (w, x, y) => { for (const [a, b] of [[3, 0], [3, 1], [3, 3], [5, -2], [6, 0]]) w.cells[w.idx(x + a, y + b)] = T.CRYSTAL; w.cells[w.idx(x + 4, y)] = T.PRISM; }, 0);
  const cs = arcCells(far.w, far.gx + 3, far.gy).map(c => `${c.x - far.gx},${c.y - far.gy}`).join(' ');
  check('S-55 arc: an ore cell jumps only to its own type within 2 cells, nearest first (not 3 off, never another ore)', cs === '3,1 5,-2', cs);

  // Creatures: a Glitch hit jumps to the 2 nearest other creatures within 2 cells, never to a bolt or one 3 cells off.
  const s = lab('arc', () => {}, 0, 'surge'), px = s.h.player.x, py = s.h.player.y;
  const mk = (dx, dy) => ({ x: px + dx, y: py + dy, r: 11, hp: 10, maxHp: 10 });
  const hitE = mk(80, 0), n1 = mk(80, 40), n2 = mk(110, 0), n3 = mk(80, -50), off = mk(80 + 3 * CELL, 0);
  s.h.enemies = [hitE, n1, n2, n3, off]; s.h.bolts = [{ bolt: true, x: px + 80, y: py + 20, r: 4, hp: 1, maxHp: 1, vx: 0, vy: 0, life: 9 }];
  s.h.beam.on = true; castBeam(s.h, 0.1);
  const lost = [hitE, n1, n2, n3, off].map(e => +(10 - e.hp).toFixed(4)), base = dps * 0.1 * BEAM_GLITCH_MUL * 0.8;
  check('S-55 arc: a creature hit jumps to the 2 nearest other creatures within 2 cells (× ARC_MUL), never a bolt',
    Math.abs(lost[0] - base) < 1e-4 && Math.abs(lost[2] - base * ARC_MUL) < 1e-4 && Math.abs(lost[1] - base * ARC_MUL) < 1e-4
    && lost[3] === 0 && lost[4] === 0 && s.h.bolts[0].hp === 1 && s.h.beam.arcs.every(a => a.foe), JSON.stringify({ lost, base }));

  // Rates: an aim bot (nearest remaining cell, from one spot) clears a cluster; Arc vs Focus time. Drift = Surge.
  const clear = (mode, cells, type, m = 'drift') => {
    const r = lab(mode, (w, x, y) => { for (const [a, b] of cells) w.cells[w.idx(x + 3 + a, y + b)] = type; }, 0, m), { h, w, gx, gy } = r;
    const st = h.stat.bind(h); h.stat = k => k === 'range' ? 20 * CELL : st(k);
    const P = { x: h.player.x, y: h.player.y };
    let i = 0;
    for (; i < 60 * 30; i++) {
      let best = null;
      for (const [a, b] of cells) { const x = gx + 3 + a, y = gy + b, d = Math.hypot((x + 0.5) * CELL - P.x, (y + 0.5) * CELL - P.y); if (w.get(x, y) === type && (!best || d < best.d)) best = { x, y, d }; }
      if (!best) break;
      h.update(1 / 60, { move: { x: 0, y: 0 }, aim: { x: ((best.x + 0.5) * CELL - P.x) / best.d, y: ((best.y + 0.5) * CELL - P.y) / best.d }, fire: true });
      Object.assign(h.player, { x: P.x, y: P.y, vx: 0, vy: 0 });
    }
    return i;
  };
  const shapes = { col3: [[0, -1], [0, 0], [0, 1]], L4: [[0, 0], [1, 0], [1, 1], [2, 1]], plus5: [[1, -1], [0, 0], [1, 0], [2, 0], [1, 1]], sq9: [[0, -1], [0, 0], [0, 1], [1, -1], [1, 0], [1, 1], [2, -1], [2, 0], [2, 1]] };
  const rates = {};
  for (const [k, c] of Object.entries(shapes)) rates[k] = +(clear('focus', c, T.CRYSTAL) / clear('arc', c, T.CRYSTAL)).toFixed(3);
  const surgeSame = clear('arc', shapes.sq9, T.CRYSTAL, 'surge') === clear('arc', shapes.sq9, T.CRYSTAL);
  const rock = +(clear('focus', shapes.sq9, T.ROCK) / clear('arc', shapes.sq9, T.ROCK)).toFixed(3);
  check('S-55 arc: 3–9 cell crystal clusters clear 1.3–1.5× faster than Focus; rock 0.8× (Focus stays the digger); Drift = Surge',
    Object.values(rates).every(r => r >= 1.3 && r <= 1.5) && rock >= 0.75 && rock <= 0.85 && surgeSame, JSON.stringify({ rates, rock, surgeSame }));
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('arc: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await newWorld(pg); await pg.waitForTimeout(200);
  await pg.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; g.bank.lumen = 35; g.demo = true; });
  await pg.keyboard.press('e'); await pg.waitForTimeout(100);
  await pg.click('#matrix .tabs button[data-tab="research"]');
  await pg.click('#upgrade-list [data-id="arc"] .buy:not([disabled])');
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  await pg.keyboard.press('q'); await pg.waitForTimeout(150);
  const r = await pg.evaluate(async () => {
    const g = window.__lumen.game, { T, CELL } = await import('/src/config.js'), w = g.world;
    const gx = Math.floor(g.nexus.x / CELL) + 12, gy = Math.floor(g.nexus.y / CELL);
    for (let y = gy - 5; y <= gy + 5; y++) for (let x = gx - 5; x <= gx + 10; x++) w.cells[w.idx(x, y)] = Math.abs(y - gy) > 3 ? T.ROCK : T.EMPTY;
    for (let a = 3; a <= 7; a++) for (let b = -1; b <= 1; b++) if ((a + b) % 3) w.cells[w.idx(gx + a, gy + b)] = T.CRYSTAL;
    w.cells[w.idx(gx + 3, gy)] = T.CRYSTAL;
    for (let y = gy - 5; y <= gy + 5; y++) for (let x = gx - 5; x <= gx + 10; x++) w.markDirty(x, y);
    Object.assign(g.player, { x: (gx + 0.5) * CELL, y: (gy + 0.5) * CELL, vx: 0, vy: 0, angle: 0 });
    return { mode: g.beamMode, glyph: document.getElementById('mode-glyph').textContent, name: document.getElementById('mode-name').textContent };
  });
  await pg.mouse.move(1000, 400); await pg.mouse.down(); await pg.waitForTimeout(500);
  const arcs = await pg.evaluate(() => (window.__lumen.game.beam.arcs || []).length);
  if (shot) await pg.screenshot({ path: shot });
  await pg.mouse.up();
  check('S-55 arc: bought in the Research tab, Q → Arc, the ⟂ button shows ↯ Arc, a vein shows jumps in play',
    r.mode === 'arc' && r.glyph === '↯' && r.name === 'Arc' && arcs > 0, JSON.stringify({ ...r, arcs }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.ARC_SHOT, shot: process.env.ARC_SHOT });
