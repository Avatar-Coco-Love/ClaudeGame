// Audit 39 checks: leaving the page never fires a Pulse charge (B-032, D-042); no "cargo full" toast inside the Nexus (B-033).
// smoke.cjs calls both functions.

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const audio = new Proxy({}, { get: () => () => {} });
  // B-033: cargo full, standing in the Nexus with a Shard on the core: the frame deposits instead of telling you to go home.
  const g = new Game({ seed: 77, mode: 'drift', audio });
  Object.assign(g.player, { x: g.nexus.x, y: g.nexus.y + 40, vx: 0, vy: 0 });
  g.cargo.shard = g.stat('cargo');
  g.pickups.push({ x: g.player.x, y: g.player.y, vx: 0, vy: 0, kind: 'shard', age: 1, r: 4, kept: false });
  g.events = [];
  const seen = new Set();
  for (let i = 0; i < 30; i++) { g.update(1 / 60, { move: { x: 0, y: 0 }, aim: null, fire: false }); g.events.forEach(e => seen.add(e)); g.events = []; }
  check('inside the Nexus with full cargo: no "cargo full" toast, the Shard is collected once room frees (B-033)',
    g.inNexus() && !seen.has('cargo-full') && g.pickups.length === 0, JSON.stringify({ events: [...seen], left: g.pickups.length }));
}

async function browserChecks(browser, url, check, errors) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push('audit39: ' + e.message));
  await page.goto(url); await page.waitForTimeout(300);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload(); await page.waitForTimeout(300);
  await page.click('#new-world'); await page.waitForTimeout(300);
  await page.evaluate(() => { const g = window.__lumen.game; g.demo = true; g.research.pulse = true; g.beamMode = 'pulse'; });
  await page.mouse.move(900, 300);
  // Hold Space ~0.5 s (charge ≈ 0.4), then the page loses focus (blur) or is hidden: the charge drops, no burst, no recovery.
  for (const how of ['blur', 'hidden']) {
    await page.keyboard.down(' '); await page.waitForTimeout(500);
    const before = await page.evaluate(() => window.__lumen.game.beam.charge);
    await page.evaluate(h => {
      if (h === 'blur') dispatchEvent(new Event('blur'));
      else { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }
    }, how);
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => { const b = window.__lumen.game.beam; return { charge: b.charge, recover: b.recover, flash: b.flash }; });
    await page.evaluate(() => { delete document.hidden; });
    await page.keyboard.up(' '); await page.waitForTimeout(400);
    check(`Pulse: ${how === 'blur' ? 'window blur' : 'page hidden'} mid-charge drops the charge unfired (B-032, D-042)`,
      before > 0.2 && after.charge === 0 && after.recover === 0 && !(after.flash > 0), JSON.stringify({ before: +before.toFixed(2), after }));
  }
  await page.close();
}

module.exports = { nodeChecks, browserChecks };
