// S-50 Core Matrix Overdrive checks (D-134, D-140). smoke.cjs calls nodeChecks + browserChecks.
// Node: a maxed row in a 256 world buys two more levels at exactly OVERDRIVE_COST (◆ + ≈ + ⬟), no third; the stats at
// max + 2 match the spec's numbers; a 160 world stops at max even with a full bank; Drift = Surge; base prices unchanged;
// a saved level past the top is clamped on load. Browser: the sheet shows the hollow pips + all three prices once a row is
// maxed in a 256 world, and none of it in a 160 one (OVERDRIVE_SHOT=path.png saves the sheet).
// Usage: node tests/overdrive.cjs [--browser]
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { UPGRADES, OVERDRIVE_COST, matrixCost, upgradeCost, KINDS } = await import('../src/config.js');
  const rich = g => { for (const k of KINDS) g.bank[k] = 9999; };
  const maxed = g => { for (const u of UPGRADES) g.upgrades[u.id] = u.max; };
  const run = mode => {
    const g = new Game({ seed: 4242, mode, audio: quiet }), bad = [];
    maxed(g);
    for (const u of UPGRADES) {
      g.bank.shard = 9999; g.bank.prism = 9999; g.bank.tide = 0; g.bank.calx = 0;
      if (g.canAfford(u.id)) bad.push(`${u.id}: buyable with no ≈ / ⬟`);
      for (const step of OVERDRIVE_COST) {
        rich(g); const before = { ...g.bank };
        if (!g.buy(u.id)) { bad.push(`${u.id}: step refused`); continue; }
        for (const k of KINDS) if (before[k] - g.bank[k] !== (step[k] || 0)) bad.push(`${u.id}: ${k} charged ${before[k] - g.bank[k]}`);
      }
      rich(g);
      if (g.canAfford(u.id) || g.buy(u.id) || g.upgrades[u.id] !== u.max + 2) bad.push(`${u.id}: past max + 2`);
    }
    const stats = UPGRADES.map(u => Math.round(g.stat(u.id) * 100) / 100).join();
    return { bad, stats };
  };
  const drift = run('drift'), surge = run('surge');
  check('S-50 overdrive: a maxed row in a 256 world buys 2 more levels at exactly OVERDRIVE_COST, never a third',
    drift.bad.length === 0 && surge.bad.length === 0, drift.bad.concat(surge.bad).join('; '));
  check('S-50 overdrive: stats at max + 2 = beam 6.5 dps, range 288, thrust 398, cargo 170, attractor 288, integrity 340; Drift = Surge',
    drift.stats === '6.5,288,398,170,288,340' && surge.stats === drift.stats, `${drift.stats} / ${surge.stats}`);
  {
    const g = new Game({ seed: 4242, mode: 'drift', audio: quiet, size: 160 });
    maxed(g); rich(g);
    const any = UPGRADES.some(u => g.canAfford(u.id) || g.buy(u.id) || g.topLevel(u) !== u.max);
    const base = UPGRADES.every(u => Array.from({ length: u.max }, (_, l) => l).every(l => JSON.stringify(matrixCost(u, l)) === JSON.stringify(upgradeCost(l))));
    check('S-50 overdrive: a 160 world stops at max with a full bank; below max the price is the old curve',
      !any && base && g.bank.shard === 9999, JSON.stringify({ any, base }));
  }
  {
    const save = new Game({ seed: 4242, mode: 'drift', audio: quiet }).toSave();
    save.upgrades = { beam: 99, range: -3, thrust: 1.5, cargo: 9, magnet: 'x', hull: 7 };
    const big = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: JSON.parse(JSON.stringify(save)) }).upgrades;
    const s160 = new Game({ seed: 4242, mode: 'drift', audio: quiet, size: 160 }).toSave();
    s160.upgrades = { beam: 10, hull: 8 };
    const small = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: JSON.parse(JSON.stringify(s160)) }).upgrades;
    check('S-50 overdrive: a saved level loads clamped to the top (max + 2 in 256, max in 160); a bad one loads 0',
      [big.beam, big.range, big.thrust, big.cargo, big.magnet, big.hull].join() === '10,0,0,9,0,7' && small.beam === 8 && small.hull === 6,
      JSON.stringify({ big, small }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('overdrive: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(300);
  const sheet = () => pg.evaluate(() => {
    const L = window.__lumen, g = L.game;
    document.getElementById('matrix-close').click(); document.getElementById('matrix-btn').click();
    const row = id => document.querySelector(`#upgrade-list [data-id="${id}"]`);
    const r = row('beam'), t = row('thrust');
    return { open: !document.getElementById('matrix').classList.contains('hidden'), beamOd: r.querySelectorAll('.pips i.od').length,
      beamBtn: r.querySelector('.buy').textContent.replace(/\s+/g, ' ').trim(), beamOff: r.querySelector('.buy').disabled,
      thrustOd: t.querySelectorAll('.pips i.od').length, lvl: g.upgrades.beam };
  });
  await pg.evaluate(() => {
    const g = window.__lumen.game;
    g.upgrades.beam = 8; g.upgrades.range = 6; g.upgrades.cargo = 7; g.upgrades.magnet = 6;
    Object.assign(g.bank, { shard: 400, prism: 20, tide: 14, calx: 9 });
    g.player.x = g.nexus.x; g.player.y = g.nexus.y;
  });
  const a = await sheet();
  if (shot) await pg.screenshot({ path: shot });
  await pg.click('#upgrade-list [data-id="beam"] .buy'); await pg.waitForTimeout(50);
  const b = await sheet();
  const bank = await pg.evaluate(() => ({ ...window.__lumen.game.bank }));
  await pg.evaluate(() => { window.__lumen.game.world.profile = { ...window.__lumen.game.world.profile, overdrive: false }; });
  const c = await sheet();
  check('S-50 overdrive: the sheet shows 2 hollow pips + ◆ ≈ ⬟ prices on a maxed row (none on an unmaxed one); a buy charges them',
    a.open && a.beamOd === 2 && /◆120/.test(a.beamBtn) && /≈5/.test(a.beamBtn) && /⬟5/.test(a.beamBtn) && !a.beamOff && a.thrustOd === 0 &&
    b.lvl === 9 && /◆200/.test(b.beamBtn) && bank.shard === 280 && bank.tide === 9 && bank.calx === 4,
    JSON.stringify({ a, b, bank }));
  check('S-50 overdrive: without the 256 profile the row is MAX with no overdrive pips', c.beamBtn === 'MAX' && c.beamOd === 0 && c.beamOff, JSON.stringify(c));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, browser: process.argv.includes('--browser') || !!process.env.OVERDRIVE_SHOT, shot: process.env.OVERDRIVE_SHOT });
