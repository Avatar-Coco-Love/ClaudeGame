// Audit 54 checks. smoke.cjs calls nodeChecks and browserChecks; tests/touch.cjs holds T1's toast-overlap check (B-047).
// B-043 (C1): a full Pulse held on a primed facet re-fired every recovery and flipped the same facet back and forth (D-083: one toggle per aim).
// B-044 (C2): a Glitch crossing the centre ray reset the Focus facet latch, so the same facet flipped twice with the aim unchanged.
// B-045 (C3): a malformed save with lit: true and a bad mask loaded mask null, so the relit Spire's facets drew unlit.
// B-046 (T2): a tap's answer toast (`now`, e.g. a placement refusal) waited up to 3.8 s behind a milestone toast (`keep`).
const quiet = new Proxy({}, { get: () => () => {} });
const DT = 1 / 60;

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js'), sp = await import('../src/spire.js');
  const { upgradeSave } = await import('../src/save.js');
  const { aims } = require('./facet.cjs');
  const make = (mode = 'drift') => { const g = new Game({ seed: 77, mode, audio: quiet }); g.__spire = sp; g.god = true; g.spawnTimer = 1e9; return g; };
  const prime = g => { const s = g.spires[0]; s.fed = 80; g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 3.5) * 32;
    g.update(DT, { move: { x: 0, y: 0 }, aim: null, fire: false }); return s; };
  const A = aims(make(), make().spires[0]);
  const stand = (g, s, a) => { g.player.x = (s.x + a.i + 0.5) * 32; g.player.y = (s.y + a.j + 0.5) * 32; g.player.vx = g.player.vy = 0; g.player.angle = a.angle; };
  const intent = a => ({ move: { x: 0, y: 0 }, aim: { x: Math.cos(a.angle), y: Math.sin(a.angle) }, fire: true });

  // B-043: hold a full Pulse on a primed facet (not the solving one) for 10 s: one toggle; let go and press again: one more.
  {
    const g = make(), s = prime(g), k = [0, 1, 2, 3, 4, 5, 6, 7].find(k => sp.toggleMask(s.mask, k) !== 255 && s.mask !== 255), a = A[k];
    g.research.pulse = true; g.beamMode = 'pulse'; stand(g, s, a);
    const m0 = s.mask; let flips = 0, prev = s.mask;
    for (let t = 0; t < 10; t += DT) { g.update(DT, intent(a)); if (s.mask !== prev) { flips++; prev = s.mask; } }
    const held = flips;
    g.update(DT, { move: { x: 0, y: 0 }, aim: null, fire: false });
    for (let t = 0; t < 3; t += DT) { g.update(DT, intent(a)); if (s.mask !== prev) { flips++; prev = s.mask; } }
    check('a full Pulse held on a primed facet toggles it once per aim; pressing again toggles once more (B-043, D-083)',
      held === 1 && flips === 2 && s.mask === m0, JSON.stringify({ held, flips, m0, mask: s.mask }));
  }

  // B-044: Focus latched on a facet; a Glitch crosses the centre ray for 2 frames; the aim never moves: still one toggle.
  {
    const g = make('drift'), s = prime(g), a = A[[0, 1, 2, 3, 4, 5, 6, 7].find(k => sp.toggleMask(s.mask, k) !== 255)]; // S-23: Drift (Surge facets don't toggle)
    stand(g, s, a);
    let flips = 0, prev = s.mask;
    const step = () => { g.update(DT, intent(a)); if (s.mask !== prev) { flips++; prev = s.mask; } };
    for (let t = 0; t < 0.6; t += DT) step();
    const cross = () => { g.enemies = [{ x: g.player.x + Math.cos(a.angle) * 15, y: g.player.y + Math.sin(a.angle) * 15, r: 10, hp: 1e9, vx: 0, vy: 0, kind: 'drifter' }]; step(); };
    cross(); cross(); // Drift clears Glitches after the beam each frame, so it is placed again for the second frame
    g.enemies = [];
    for (let t = 0; t < 0.6; t += DT) step();
    check('a Glitch crossing the centre ray keeps the facet latch: one toggle while the aim is unchanged (B-044, D-080)',
      flips === 1, JSON.stringify({ flips }));
  }

  // B-045: lit: true with a junk mask loads as all 8 facets lit (mask 255).
  {
    const sv = JSON.parse(JSON.stringify(make().toSave())); Object.assign(sv.spires[1], { fed: 80, lit: true, mask: 'x', mode: 'drift' });
    const g = new Game({ seed: 77, mode: 'drift', audio: quiet, save: upgradeSave(sv) });
    check('a save with lit: true and a malformed mask loads all facets lit (B-045, B-037)', g.spires[1].lit && g.spires[1].mask === 255,
      JSON.stringify(g.spires[1]));
  }
}

/** B-046: a milestone toast is up; a ✦ tap's refusal shows at once, then the milestone comes back. */
async function browserChecks(browser, url, check, errors) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } }), page = await ctx.newPage();
  page.on('pageerror', e => errors.push('audit54 toast: ' + e.message));
  await page.goto(url); await page.waitForTimeout(200);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload(); await page.waitForTimeout(200);
  await page.click('#new-world'); await page.waitForTimeout(300);
  await page.evaluate(() => { const g = window.__lumen.game; g.demo = true; g.notify('spire-primed'); });
  await page.waitForTimeout(300);
  const text = () => page.evaluate(() => { const t = document.getElementById('toast'); return t.classList.contains('show') ? t.textContent : ''; });
  const first = await text();
  await page.evaluate(() => { const g = window.__lumen.game; g.placeKind = 'beacon'; g.placeResult = 'none'; g.notify('beacon'); });
  await page.waitForTimeout(120);
  const answer = await text();
  await page.waitForTimeout(1600);
  const back = await text();
  check('a tap\'s refusal toast shows at once over a milestone toast, then the milestone comes back (B-046, audit 54 T2)',
    first === 'Spire primed' && /^No Beacons/.test(answer) && back === 'Spire primed', JSON.stringify({ first, answer, back }));
  await ctx.close();
}

module.exports = { nodeChecks, browserChecks };
