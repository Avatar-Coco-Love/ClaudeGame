// S-29 New Cycle checks (D-062, D-091). smoke.cjs calls nodeChecks and browserChecks.
// Node: the ending writes this cycle's record + the best time; cycle and records survive a save; a format-13 save loads as
// cycle 0 with no records; the Nexus hue follows NEXUS_HUES[cycle % 5]. Browser (1280×800): card -> New Cycle -> confirm:
// a new seed, cycle 1, empty bank + Matrix, no Spire lit, records kept, the Nexus drawn in cycle 1's hue; dismissing the
// confirm keeps the world; a reload shows "Cycle 1 · best …" on the title. Screenshots (env SPIRE_SHOT): cycle-title, cycle-nexus.
const { newWorld } = require('./pinworld.cjs');
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js'), sp = await import('../src/spire.js');
  const { upgradeSave } = await import('../src/save.js');
  const { NEXUS_HUES } = await import('../src/config.js');
  const g = new Game({ seed: 77, mode: 'surge', audio: quiet, size: 160 }); g.stats.time = 600.4; // its v13 copy (audit 64) is a 160 world
  g.spires.forEach((s, i) => { s.fed = 80; sp.relightSpire(g, s, i < 3 ? 'surge' : 'drift'); });
  const rec = JSON.parse(JSON.stringify(g.records));
  const h = new Game({ seed: 77, mode: 'surge', audio: quiet, save: JSON.parse(JSON.stringify({ ...g.toSave(), cycle: 3 })) });
  const old = JSON.parse(JSON.stringify(new Game({ seed: 5, mode: 'drift', audio: quiet, size: 160 }).toSave())); old.v = 13; delete old.cycle; delete old.records; // pin-ok: an old save
  const up = new Game({ seed: 5, mode: 'drift', audio: quiet, save: upgradeSave(old) });
  check('S-29: the ending records this cycle (time, Drift / Surge relights) and the best time; cycle + records survive a save; an old save is cycle 0',
    rec.best === 600 && rec.cycles[0].time === 600 && rec.cycles[0].surge === 3 && rec.cycles[0].drift === 2 && h.cycle === 3 && h.records.best === 600
    && up.cycle === 0 && JSON.stringify(up.records) === '{}', JSON.stringify({ rec, h: [h.cycle, h.records.best], up: [up.cycle, up.records] }));
  // Audit 64: B-057 junk records are cleaned (no crash at the ending, no negative / text best); B-058 a world that ended
  // before records existed gets its cycle-0 record; B-059 a Spire never relights twice.
  {
    const bad = [];
    for (const junk of ['junk', 7, [1], { best: -30 }, { best: 'abc', cycles: 'x' }]) {
      const s = JSON.parse(JSON.stringify(new Game({ seed: 9, mode: 'drift', audio: quiet }).toSave())); s.records = junk;
      const k = new Game({ seed: 9, mode: 'drift', audio: quiet, save: s }); k.stats.time = 90;
      try { k.spires.forEach(q => { q.fed = 80; sp.relightSpire(k, q, 'drift'); }); } catch (e) { bad.push(String(junk) + ': ' + e.message); continue; }
      if (k.records.best !== 90 || !k.records.cycles[0]) bad.push(JSON.stringify(junk) + ' -> ' + JSON.stringify(k.records));
    }
    const v13 = JSON.parse(JSON.stringify(g.toSave())); v13.v = 13; v13.records = undefined; delete v13.cycle; // pin-ok: an old save
    const old13 = new Game({ seed: 77, mode: 'surge', audio: quiet, save: upgradeSave(v13) });
    const twice = new Game({ seed: 77, mode: 'drift', audio: quiet }), q0 = twice.spires[0];
    sp.relightSpire(twice, q0, 'drift'); sp.relightSpire(twice, q0, 'surge');
    check('audit 64: junk records never crash the ending or show a bad best (B-057); an ended v13 world keeps its record (B-058); no double relight (B-059)',
      bad.length === 0 && old13.records.best === 600 && old13.records.cycles[0].surge === 3 && twice.spireLights.length === 1 && q0.mode === 'drift',
      JSON.stringify({ bad, old13: old13.records, lights: twice.spireLights.length }));
  }
  check('S-29: the Nexus hue is NEXUS_HUES[cycle % 5] (cycle 0 = the original cyan)', g.nexusHue() === NEXUS_HUES[0] && h.nexusHue() === NEXUS_HUES[3]
    && (() => { h.cycle = 6; return h.nexusHue() === NEXUS_HUES[1]; })(), '');
}

async function browserChecks(browser, url, check, errors, shots) {
  const { VERSION } = await import('../src/config.js');
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push('cycle: ' + e.message));
  let answer = false; page.on('dialog', d => (answer ? d.accept() : d.dismiss()));
  await page.goto(url); await page.waitForTimeout(200);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload(); await page.waitForTimeout(200);
  await newWorld(page); await page.waitForTimeout(300);
  await page.evaluate(() => { const g = window.__lumen.game; g.bank.shard = 500; g.upgrades.beam = 3; window.__lumen.dev.relightAll(); });
  await page.waitForTimeout(200); await page.keyboard.press(' '); await page.waitForTimeout(300);
  const seed0 = await page.evaluate(() => window.__lumen.game.world.seed);
  await page.click('#ending-cycle'); await page.waitForTimeout(300); // dismissed: nothing changes
  const kept = await page.evaluate(s => ({ same: window.__lumen.game.world.seed === s, open: !document.getElementById('ending').classList.contains('hidden') }), seed0);
  answer = true;
  await page.click('#ending-cycle'); await page.waitForTimeout(800);
  const c = await page.evaluate(async () => {
    const L = window.__lumen, g = L.game, R = L.renderer, cfg = await import('/src/config.js'), q = R.worldToScreen(g.nexus.x + 16, g.nexus.y);
    const d = R.ctx.getImageData(Math.round(q.x * R.dpr), Math.round(q.y * R.dpr), 1, 1).data;
    return { seed: g.world.seed, size: g.world.w, cycle: g.cycle, bank: g.bank.shard + g.bank.prism, beam: g.upgrades.beam, lit: g.spires.filter(s => s.lit).length, ended: g.ended,
      best: g.records.best, hue: g.nexusHue(), want: cfg.NEXUS_HUES[1], px: [d[0], d[1], d[2]], card: !document.getElementById('ending').classList.contains('hidden') };
  });
  if (shots) await page.screenshot({ path: `${shots}/cycle-nexus-1280x800.png` });
  check('S-29: New Cycle (confirmed) gives a new 256 seed (S-46b2), cycle 1, empty bank + Matrix, no Spire lit, records kept, the Nexus in cycle 1\'s hue; dismissed keeps the world',
    kept.same && kept.open && c.seed !== seed0 && c.size === 256 && c.cycle === 1 && c.bank === 0 && c.beam === 0 && c.lit === 0 && !c.ended && Number.isFinite(c.best)
    && c.hue === c.want && !c.card && c.px[1] > c.px[2] + 10, JSON.stringify({ kept, c }));
  await page.evaluate(() => dispatchEvent(new Event('pagehide')));
  await page.reload(); await page.waitForTimeout(300);
  const title = await page.evaluate(() => ({ line: document.getElementById('cycle-line').textContent, shown: !document.getElementById('cycle-line').classList.contains('hidden'),
    nc: document.getElementById('new-cycle').classList.contains('hidden'), ver: document.getElementById('version').textContent }));
  if (shots) await page.screenshot({ path: `${shots}/cycle-title-1280x800.png` });
  check('S-29: after a reload the title names the cycle and the best time; New Cycle stays hidden until this world ends; version ≥ 1.0 (D-046)',
    title.shown && /^Cycle 1 · best \d+m \d\ds to light every Spire$/.test(title.line) && title.nc && title.ver === 'v' + VERSION && VERSION.split('.')[0] >= 1, JSON.stringify(title));
  await page.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
