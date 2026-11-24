// S-34 Relay reclaim checks (D-092, Q-018: a player's request). smoke.cjs calls nodeChecks and browserChecks.
// Node: B / ✦ in a Relay's ring picks it up (relays − 1, stock + 1, the light set shrinks the same frame); carrying one
// already refuses and changes nothing; it can go back on the same cell or 30 cells on; a reload keeps the moved Relay;
// cargo banking at that ring the frame it is picked up doesn't crash or lose cargo; outside every ring B still places.
// Browser (320×568 touch): the hint "✦: pick up this Relay" in an empty-cargo ring, a ✦ tap picks it up with its toast.
const audio = new Proxy({}, { get: () => () => {} });
const idle = (place = false) => ({ move: { x: 0, y: 0 }, aim: null, fire: false, place });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { CELL, RELAY_GAP } = await import('../src/config.js');
  const g = new Game({ seed: 77, mode: 'drift', audio }), w = g.world;
  // A carved strip along the axis farthest from vaults and Spires (relay.cjs's method), Relays placed at d 28 and 28 + gap.
  const cx = Math.floor(g.nexus.x / CELL), cy = Math.floor(g.nexus.y / CELL);
  let best = 0, bestD = -1;
  for (let k = 0; k < 4; k++) { const an = k / 4 * Math.PI * 2, d = Math.min(...[...w.vaults, ...g.spires].map(v => {
    let m = Infinity; for (let r = 20; r <= 64; r++) m = Math.min(m, Math.hypot(v.x - (cx + Math.cos(an) * r), v.y - (cy + Math.sin(an) * r))); return m; }));
    if (d > bestD) { bestD = d; best = an; } }
  const cell = r => [cx + Math.round(Math.cos(best) * r), cy + Math.round(Math.sin(best) * r)];
  for (let r = 0; r <= 62; r++) { const [x, y] = cell(r); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) w.destroy(x + dx, y + dy); }
  const at = ([x, y], ox = 0) => Object.assign(g.player, { x: (x + 0.5) * CELL + ox, y: (y + 0.5) * CELL, vx: 0, vy: 0 });
  const press = () => { g.update(1 / 60, idle(true)); return g.placeResult; };
  const lights = () => g.spireLights.length + g.beacons.length + g.relays.length;
  g.craft.relay = 1; at(cell(28)); const p1 = press();
  g.craft.relay = 1; at(cell(28 + RELAY_GAP)); const p2 = press();
  check('S-34: placing two Relays still works as before (outside every ring)', p1 === 'placed' && p2 === 'placed' && g.relays.length === 2,
    JSON.stringify({ p1, p2 }));
  const i0 = g.relays[0].i, n0 = lights(), sh0 = g.bank.shard;
  g.cargo.shard = 5; at(cell(28), 20); // inside the first one's ring, off its cell, carrying nothing placeable... and 5◆ to bank
  const picked = press();
  const took = picked === 'picked' && g.relays.length === 1 && g.craft.relay === 1 && g.craft.last === 'relay' && lights() === n0 - 1
    && !g.relays.some(r => r.i === i0) && g.cargo.shard + g.bank.shard - sh0 === 5;
  at(cell(28 + RELAY_GAP), 20); const carrying = press(); // one carried already
  const refused = carrying === 'carrying' && g.relays.length === 1 && g.craft.relay === 1;
  check('S-34: B in a Relay\'s ring picks it up (stock 1, light gone the same frame, cargo kept); carrying one refuses, nothing changes',
    took && refused, JSON.stringify({ picked, carrying, relays: g.relays.length, stock: g.craft.relay, cargo: g.cargo.shard, bank: g.bank.shard - sh0 }));
  at(cell(28)); const back = press();
  const h = new Game({ seed: 77, mode: 'drift', audio, save: JSON.parse(JSON.stringify(g.toSave())) });
  at(cell(28), 20); press(); const h2 = new Game({ seed: 77, mode: 'drift', audio, save: JSON.parse(JSON.stringify(g.toSave())) });
  check('S-34: a picked-up Relay goes back on its own cell; a reload keeps where Relays are (and the carried one)',
    back === 'placed' && h.relays.length === 2 && h.relays.some(r => r.i === i0) && h2.relays.length === 1 && h2.craft.relay === 1,
    JSON.stringify({ back, h: h.relays.map(r => r.i), h2: [h2.relays.length, h2.craft.relay] }));
}

async function browserChecks(browser, url, check, errors, shots) {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 568 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('reclaim: ' + e.message));
  await page.goto(url); await page.waitForTimeout(200);
  await page.tap('#new-world'); await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const g = window.__lumen.game, cr = await import('/src/craft.js'), p = g.player; g.stats.mined = 20; g.stats.upgrades = 1;
    const x = Math.floor(g.nexus.x / 32) + 30, y = Math.floor(g.nexus.y / 32);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) g.world.destroy(x + dx, y + dy);
    g.relays.push(cr.makeRelay(g.world, y * g.world.w + x)); p.x = (x + 0.5) * 32 + 16; p.y = (y + 0.5) * 32; p.vx = p.vy = 0;
  });
  await page.waitForTimeout(400);
  const hint = await page.evaluate(() => { const h = document.getElementById('hint'); return h.classList.contains('hidden') ? '' : h.textContent; });
  if (shots) await page.screenshot({ path: `${shots}/reclaim-320x568.png` });
  await page.tap('#beacon-btn'); await page.waitForTimeout(250);
  const st = await page.evaluate(() => ({ relays: window.__lumen.game.relays.length, stock: window.__lumen.game.craft.relay, toast: document.getElementById('toast').textContent }));
  check('320×568 touch: in a Relay\'s ring the button turns ⊕↑ and the hint says "Tap ⊕↑ to pick up this Relay"; a tap picks it up with its toast (S-34)',
    hint === 'Tap ⊕↑ to pick up this Relay' && st.relays === 0 && st.stock === 1 && /Relay picked up/.test(st.toast), JSON.stringify({ hint, st }));
  await ctx.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
