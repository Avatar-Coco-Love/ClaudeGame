// S-66a Feats checks (D-180, D-216). smoke.cjs calls nodeChecks and browserChecks. Node: a 160 world lists 4 feats, a
// 256 world 6, in FEATS order; each rule on a stubbed game (both sizes); the counters (`stats.kinds` on an Anomaly take,
// `stats.rifts` on a close with all 9 cells mined, 8 of 9 not); Drift = Surge for every feat; an old save loads 0 / 0 and
// junk loads 0. Browser: the Nexus tab lists "Feats n / N" below the rows, ✓ on the done ones; it fits 320 wide at
// Large text with no sideways overflow. Usage: node tests/feats.cjs [--browser | --browser-only]  (FEATS_SHOT=path.png)
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { feats, featProgress, exploredShare } = await import('../src/feats.js');
  const { updateAnomalies } = await import('../src/anomaly.js');
  const { updateRift, openRift, closeRift } = await import('../src/rift.js');
  const { upgradeSave, STEPS } = await import('../src/save.js');
  const { FEATS, FEAT_RIFTS, WORLD_PROFILES, UPGRADES, CELL, T, BORDER } = await import('../src/config.js');
  const make = (size, mode = 'drift', seed = 4242) => new Game({ seed, mode, audio: quiet, size });
  const ids = g => feats(g).map(f => f.id).join(' ');
  const done = g => Object.fromEntries(feats(g).map(f => [f.id, f.done]));

  { // the list: 4 in a 160 world, 6 in a 256, in FEATS order; none done in a fresh world
    const a = make(160), b = make(256);
    check('S-66a Feats: a 160 world lists vaults kinds chart rifts, a 256 world all six in order, none done at start',
      ids(a) === 'vaults kinds chart rifts' && ids(b) === FEATS.map(f => f.id).join(' ') && feats(a).concat(feats(b)).every(f => !f.done), `${ids(a)} | ${ids(b)}`);
  }
  // every rule on a stubbed game, both sizes, both modes: one step short is not done, the last step is
  const stub = {
    lairs: (g, all) => { const l = g.bosses.list; l.forEach((B, i) => { B.down = all || i < l.length - 1; }); },
    vaults: (g, all) => { const v = g.world.vaults; v.forEach((s, i) => { if (all || i < v.length - 1) g.world.destroy(s.x, s.y); }); },
    kinds: (g, all) => { g.stats.kinds = all ? 7 : 5; },
    chart: (g, all) => { const w = g.world, inner = (w.w - 2 * BORDER) ** 2, n = Math.ceil(inner * w.profile.chart) - (all ? 0 : 1);
      w.explored.fill(0); // the Nexus start reveal counts too: start from none
      let k = 0; for (let y = BORDER; y < w.h - BORDER && k < n; y++) for (let x = BORDER; x < w.w - BORDER && k < n; x++, k++) w.explored[y * w.w + x] = 1; },
    over: (g, all) => { const u = UPGRADES[0]; g.upgrades[u.id] = g.topLevel(u) - (all ? 0 : 1); },
    rifts: (g, all) => { g.stats.rifts = FEAT_RIFTS - (all ? 0 : 1); },
  };
  { const bad = [], seen = {};
    for (const size of [160, 256]) for (const mode of ['drift', 'surge']) for (const f of FEATS) {
      const g0 = make(size, mode), g1 = make(size, mode);
      if (!feats(g0).some(x => x.id === f.id)) continue;
      stub[f.id](g0, false); stub[f.id](g1, true);
      const d0 = done(g0), d1 = done(g1), others = Object.entries(d1).filter(([k, v]) => k !== f.id && v);
      if (d0[f.id] || !d1[f.id] || others.length) bad.push(`${size} ${mode} ${f.id}: ${d0[f.id]} ${d1[f.id]} ${others}`);
      const key = `${size} ${f.id}`, p = featProgress(feats(g1).find(x => x.id === f.id));
      if (key in seen && seen[key] !== p) bad.push(`${key}: drift ${seen[key]} vs surge ${p}`); seen[key] = p;
    }
    check('S-66a Feats: each rule done on its last step, not one short, no other feat lit, Drift = Surge (both sizes)', !bad.length, bad.join('; ') || Object.keys(seen).length + ' rules');
    const g = make(160); stub.chart(g, true); stub.rifts(g, false);
    const pc = featProgress(feats(g).find(f => f.id === 'chart')), pr = featProgress(feats(g).find(f => f.id === 'rifts'));
    check('S-66a Feats: progress reads "40 % / 40 %" (a 160 world) and "4 / 5"', pc === '40 % / 40 %' && pr === `${FEAT_RIFTS - 1} / ${FEAT_RIFTS}` && exploredShare(g) >= g.world.profile.chart, `${pc} | ${pr}`);
    const h = make(256); h.world.explored.fill(0);
    check('S-67 Charted: the need is per size (160 = 40 %, 256 = 20 %, D-222)', WORLD_PROFILES[160].chart === 0.4 && WORLD_PROFILES[256].chart === 0.2 && featProgress(feats(h).find(f => f.id === 'chart')) === '0 % / 20 %', featProgress(feats(h).find(f => f.id === 'chart')));
  }
  { // kinds: a take sets its kind's bit, both modes alike
    const res = [];
    for (const mode of ['drift', 'surge']) {
      const g = make(256, mode), a = g.anomaly, kinds = [];
      for (const kind of ['overclock', 'lodestone', 'ballast']) {
        const i = a.sites.findIndex(s => s.kind === kind && !s.void); const s = a.sites[i];
        if (g.world.get(s.x, s.y) !== T.EMPTY) g.world.destroy(s.x, s.y);
        Object.assign(g.player, { x: (s.x + 0.5) * CELL, y: (s.y + 0.5) * CELL }); g.buffs = [];
        updateAnomalies(g, 0.016); kinds.push(g.stats.kinds);
      }
      res.push(kinds.join(','));
    }
    check('S-66a Feats: each Anomaly take sets its kind in stats.kinds (1, 3, 7), Drift = Surge', res[0] === res[1] && res[0].split(',').map(Number).pop() === 7 && done(make(256)).kinds === false, res.join(' | '));
  }
  { // rifts: a close counts only when every cell of that pocket was mined
    const g = make(256); updateRift(g);
    const pocket = mined => { g.stats.time += 1; if (!openRift(g)) return null; const cs = g.rift.open.cells; cs.slice(0, mined).forEach(c => g.world.destroy(c.x, c.y)); closeRift(g); return g.stats.rifts; };
    const r = [pocket(8), pocket(9), pocket(0), pocket(9)];
    check('S-66a Feats: a rift close with 9 of 9 mined counts, 8 of 9 or none does not', r.join() === '0,1,1,2', r.join());
  }
  { // saves: the format before the feats upgrades with 0 / 0; a counted one reloads; junk loads 0
    const step = STEPS.findIndex(f => { try { return 'rifts' in (f({ stats: {} }).stats || {}); } catch { return false; } });
    const s = make(256).toSave(); delete s.stats.kinds; delete s.stats.rifts; s.v = step + 1;
    const up = upgradeSave(JSON.parse(JSON.stringify(s))), g0 = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: up });
    const h = make(256); h.stats.kinds = 5; h.stats.rifts = 3;
    const b = h.toSave(), g1 = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: JSON.parse(JSON.stringify(b)) });
    b.stats.kinds = 'x'; b.stats.rifts = -2; const g2 = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: JSON.parse(JSON.stringify(b)) });
    check('S-66a Feats: an old save loads kinds 0 / rifts 0, a counted one reloads, junk loads 0',
      step >= 0 && up.stats.kinds === 0 && up.stats.rifts === 0 && g0.stats.kinds === 0 && g0.stats.rifts === 0 && g1.stats.kinds === 5 && g1.stats.rifts === 3 &&
      g2.stats.kinds === 0 && g2.stats.rifts === 0, JSON.stringify([step, up.stats.kinds, g0.stats.rifts, g1.stats.kinds, g1.stats.rifts, g2.stats.kinds, g2.stats.rifts]));
  }
  { // S-66b: a feat newly done toasts once (featNew + one note), not again, not after a reload, not after a mode switch
    const { checkFeats } = await import('../src/feats.js');
    let notes = 0; const audio = new Proxy({}, { get: (_, k) => k === 'feat' ? () => { notes++; } : () => {} });
    const idle = { move: { x: 0, y: 0 }, aim: null, fire: false };
    const g = new Game({ seed: 4242, mode: 'drift', audio, size: 160 });
    const quiet0 = checkFeats(g), ev0 = g.events.includes('feat');
    g.stats.rifts = FEAT_RIFTS; g.notify('rift-close'); g.update(1 / 60, idle); // the update path runs the check
    const t1 = g.featNew && `Feat: ${g.featNew.name} (${g.featNew.done} / ${g.featNew.total})`, ev1 = g.events.includes('feat'), n1 = notes;
    g.events.length = 0; g.featNew = null; const again = checkFeats(g); g.setMode('surge'); g.notify('deposited'); g.update(1 / 60, idle); const stale = g.featDue;
    const afterSwitch = g.events.includes('feat') || !!g.featNew;
    const h = new Game({ seed: 4242, mode: 'drift', audio, size: 160, save: JSON.parse(JSON.stringify(g.toSave())) });
    h.notify('deposited'); h.update(1 / 60, idle); const reload = h.events.includes('feat') || checkFeats(h);
    g.stats.kinds = 7; g.events.length = 0; g.notify('anomaly'); g.update(1 / 60, idle); const t2 = g.featNew && `${g.featNew.name} (${g.featNew.done} / ${g.featNew.total})`;
    const name = n => FEATS.find(f => f.id === n).name;
    check('S-66b Feats: a feat done toasts "Feat: <name> (1 / 4)" + one note once; none again, after a mode switch or a reload; one check per notify, not per frame (B-115); the next reads 2 / 4',
      quiet0 === 0 && !ev0 && t1 === `Feat: ${name('rifts')} (1 / 4)` && ev1 && n1 === 1 && again === 0 && !afterSwitch && stale === false && !reload && t2 === `${name('kinds')} (2 / 4)` && notes === 2,
      JSON.stringify({ quiet0, t1, ev1, n1, again, afterSwitch, stale, reload, t2, notes }));
    // an Overdrive level bought finishes `over` (256): the buy runs the check itself
    const b = new Game({ seed: 4242, mode: 'drift', audio, size: 256 }), u = UPGRADES[0], over = Math.max(...UPGRADES.map(x => x.over));
    b.upgrades[u.id] = u.max + over - 1; b.featsSeen = new Set(); b.canAfford = () => true; notes = 0; b.buy(u.id);
    check('S-66b Feats: buying the last Overdrive level toasts Overdrive at once', b.events.includes('feat') && b.featNew && b.featNew.name === name('over') && notes === 1, JSON.stringify(b.featNew));
    // the ending card's numbers: Feats n / N
    const { endingSummary } = await import('../src/ending.js'); const e = endingSummary(g), e2 = endingSummary(make(256));
    check('S-66b Feats: the ending summary carries feats 2 / 4 (160), 0 / 6 (fresh 256)', e.feats === 2 && e.featN === 4 && e2.feats === 0 && e2.featN === 6, JSON.stringify([e.feats, e.featN, e2.feats, e2.featN]));
  }
  { // S-67 (D-222): the Charted gate. featrun routes the core to every landmark (full) or the Spires only (bare), 8 seeds
    const out = await require('./gates.cjs').run('featrun.mjs');
    check('S-67 Charted gate passes (the Spires-only route never reaches chart; a 256 full route on every seed; 8 seeds, both sizes)',
      /: PASS/.test(out.trim().split('\n').pop()), out.trim().split('\n').filter(l => /^\d+:/.test(l)).map(l => l.split(' → ')[0]).join('; '));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 360, height: 640 } });
  pg.on('pageerror', e => errors.push('feats: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await require('./spire.cjs').pinnedNewWorld(pg); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const g = window.__lumen.game; g.stats.kinds = 7; g.stats.rifts = 5; });
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(200);
  await pg.click('#matrix .tabs button[data-tab="nexus"]'); await pg.waitForTimeout(200);
  const read = () => pg.evaluate(() => {
    const box = document.getElementById('feats'), list = document.getElementById('upgrade-list');
    return box && { head: box.querySelector('h3').textContent, n: box.querySelectorAll('.feat').length, done: [...box.querySelectorAll('.feat.done')].map(e => e.dataset.feat).join(' '),
      marks: [...box.querySelectorAll('.mark')].map(e => e.textContent).join(''), last: list.lastElementChild === box,
      wide: box.scrollWidth <= box.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth };
  });
  const a = await read();
  if (shot) await pg.screenshot({ path: shot });
  check('S-66a Feats: the Nexus tab ends with "Feats 2 / 6", six lines, ✓ on the two done, · on the rest',
    !!a && a.head === 'Feats 2 / 6' && a.n === 6 && a.done === 'kinds rifts' && a.marks === '··✓··✓' && a.last && a.wide, JSON.stringify(a));
  await pg.setViewportSize({ width: 320, height: 568 });
  await pg.evaluate(() => document.documentElement.style.setProperty('--ts', '1.2')); await pg.waitForTimeout(150);
  const b = await read();
  check('S-66a Feats: 320 × 568 at Large text, no sideways overflow', !!b && b.n === 6 && b.wide, JSON.stringify(b));
  // S-66b: the toast in the page: forget Rift runner as seen, then a rift-close event (no toast of its own) finds it again
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(150);
  const t = await pg.evaluate(async () => { const g = window.__lumen.game, { checkFeats } = await import('/src/feats.js');
    const quiet = checkFeats(g) === 2; g.events.length = 0; g.featsSeen = new Set(['kinds']); g.notify('rift-close'); return quiet; });
  await pg.waitForTimeout(400);
  const tt = await pg.evaluate(() => document.getElementById('toast').textContent);
  check('S-66b Feats: the page toasts "Feat: Rift runner (2 / 6)"', /Feat: Rift runner \(2 \/ 6\)/.test(tt), JSON.stringify({ tt, t }));
  if (shot) await pg.screenshot({ path: shot.replace(/\.png$/, '-toast.png') });
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks: process.argv.includes('--browser-only') ? null : nodeChecks, browserChecks,
  browser: process.argv.includes('--browser') || process.argv.includes('--browser-only') || !!process.env.FEATS_SHOT, shot: process.env.FEATS_SHOT });
