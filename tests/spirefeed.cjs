// S-20 Spire feed checks (D-055, D-069, D-070). smoke.cjs calls both functions.
const { nearSpire } = require('./spire.cjs');
const idle = { move: { x: 0, y: 0 }, aim: null, fire: false };

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { upgradeSave } = await import('../src/save.js');
  const { startMask, toggleMask, FACET_RING, spireTypeAt } = await import('../src/spire.js');
  const { T, SPIRE_PRISMS, SPIRE_TAPS } = await import('../src/config.js');
  const run = (g, s) => { for (let i = 0; i < s * 60; i++) g.update(1 / 60, idle); };
  // A world with the core standing in Spire k's interior, 3 cells below its centre (open floor), no Glitches.
  const make = (mode = 'drift', k = 0, save = null, seed = 77) => {
    const g = new Game({ seed, mode, audio: new Proxy({}, { get: () => () => {} }), save });
    const s = g.spires[k];
    g.god = true; g.spawnTimer = 1e9;
    g.player.x = (s.x + 0.5) * 32; g.player.y = (s.y + 3.5) * 32;
    return { g, s };
  };

  // Order: cargo ▲ first, then bank ▲; ◆ and ● never move; caps at 80; about 8/s.
  for (const mode of ['drift', 'surge']) {
    const { g, s } = make(mode);
    Object.assign(g.cargo, { shard: 5, prism: 10, lumen: 2 }); Object.assign(g.bank, { shard: 50, prism: 100, lumen: 7 });
    let t = 0, bankAt10 = null, cargoAt10 = null;
    while (s.fed < SPIRE_PRISMS && t < 30) { g.update(1 / 60, idle); t += 1 / 60; if (s.fed === 10 && bankAt10 === null) { bankAt10 = g.bank.prism; cargoAt10 = g.cargo.prism; } }
    const tAt80 = t; run(g, 2);
    const got = { mode, fed: s.fed, bankAt10, cargoAt10, cargo: { ...g.cargo }, bank: { ...g.bank }, t: +tAt80.toFixed(2), enemies: g.enemies.length };
    check(`${mode}: the feed takes cargo ▲ before bank ▲, never ◆ ●, caps at 80, ~8/s (S-20, D-070)`, s.fed === 80 && bankAt10 === 100
      && cargoAt10 === 0 && g.cargo.prism === 0 && g.bank.prism === 30 && g.cargo.shard === 5 && g.cargo.lumen === 2
      && g.bank.shard === 50 && g.bank.lumen === 7 && tAt80 > 9.5 && tAt80 < 10.6, JSON.stringify(got));
  }

  // 0 ▲ anywhere: nothing happens (◆ ● stay, fed stays 0).
  {
    const { g, s } = make();
    Object.assign(g.cargo, { shard: 5, prism: 0, lumen: 2 }); Object.assign(g.bank, { shard: 50, prism: 0, lumen: 7 });
    run(g, 2);
    check('with 0 ▲ in cargo and bank nothing is fed and ◆ ● stay (S-20)', s.fed === 0 && g.cargo.shard === 5 && g.bank.lumen === 7
      && !g.events.includes('spire-primed'), JSON.stringify({ fed: s.fed, cargo: g.cargo, bank: g.bank }));
  }

  // Feeding stops when the core leaves the interior (one cell past its edge), and a fed count survives a reload.
  {
    const { g, s } = make();
    g.bank.prism = 200; run(g, 2);
    const mid = s.fed;
    g.player.y = (s.y + 4.5) * 32; // the gap in the shell below the interior: outside the 7×7
    run(g, 2);
    const after = s.fed, again = new Game({ seed: 77, mode: 'drift', audio: new Proxy({}, { get: () => () => {} }), save: upgradeSave(JSON.parse(JSON.stringify(g.toSave()))) });
    check('feeding stops when the core leaves the interior; fed survives a reload (S-20)', mid >= 14 && mid <= 17 && after === mid
      && g.bank.prism === 200 - mid && again.spires[0].fed === mid && again.spires[0].mask === null, JSON.stringify({ mid, after, reload: again.spires[0].fed }));
  }

  // At 80: primed. mask = the seeded start pattern (not all lit), lit stays false, toast event; survives a reload.
  {
    const { g, s } = make('drift', 2);
    g.bank.prism = 80; run(g, 11);
    const sv = upgradeSave(JSON.parse(JSON.stringify(g.toSave()))), r = new Game({ seed: 77, mode: 'drift', audio: new Proxy({}, { get: () => () => {} }), save: sv });
    check('at 80 a Spire is primed: start-pattern mask, not lit, "spire-primed"; mask survives a reload (S-20)', s.fed === 80
      && s.mask === startMask(77, 2) && s.mask !== 255 && !s.lit && g.events.includes('spire-primed') && !g.events.includes('spire-relit')
      && r.spires[2].mask === s.mask && r.spires[2].fed === 80, JSON.stringify({ fed: s.fed, mask: s.mask, lit: s.lit, events: g.events }));
  }

  // D-069: a planted broken Spire (keep over its core centre) relights at 80 instead; the stats count it.
  {
    const base = new Game({ seed: 77, mode: 'drift', audio: new Proxy({}, { get: () => () => {} }) }).toSave(), sv = JSON.parse(JSON.stringify(base));
    const s0 = sv.spires[1], W = 160; s0.keep = [s0.y * W + s0.x, (s0.y - 4) * W + s0.x + 2]; // core centre + one facet
    const { g, s } = make('surge', 1, upgradeSave(sv));
    g.bank.prism = 90; run(g, 11);
    check('a broken Spire (keep over its core) relights at 80 in either mode: lit, "spire-relit" (S-20, D-069)', s.fed === 80 && s.lit
      && s.mask === 255 && g.spireLitCount === 1 && g.events.includes('spire-relit') && !g.events.includes('spire-primed')
      && g.world.get(s.x, s.y) !== T.SPIRE, JSON.stringify({ fed: s.fed, lit: s.lit, events: g.events, bank: g.bank.prism }));
  }

  // A save cut off at 80 without a mask (or fed past the cap) heals on entering: primed, fed clamped to 80.
  {
    const sv = JSON.parse(JSON.stringify(new Game({ seed: 77, mode: 'drift', audio: new Proxy({}, { get: () => () => {} }) }).toSave()));
    sv.spires[0].fed = 95;
    const { g, s } = make('drift', 0, upgradeSave(sv));
    g.bank.prism = 10; run(g, 0.2);
    check('a save with fed past 80 and no mask loads at 80 and primes on entry, taking nothing (S-20, B-037)', s.fed === 80
      && s.mask === startMask(77, 0) && g.bank.prism === 10, JSON.stringify({ fed: s.fed, mask: s.mask, bank: g.bank.prism }));
  }

  // Start patterns, 40 seeds × 5 Spires: the minimum tap count (brute force over all 256 tap sets) is exactly SPIRE_TAPS[i].
  const minTaps = mask => { let best = 9; for (let set = 0; set < 256; set++) { let m = mask, n = 0;
    for (let k = 0; k < 8; k++) if (set >> k & 1) { m = toggleMask(m, k); n++; } if (m === 255 && n < best) best = n; } return best; };
  const bad = [];
  for (let seed = 1; seed <= 40; seed++) for (let i = 0; i < 5; i++) if (minTaps(startMask(seed, i)) !== SPIRE_TAPS[i]) bad.push(`${seed}:${i}`);
  const ring = FACET_RING.every(([i, j]) => spireTypeAt(i, j) === T.FACET) && new Set(FACET_RING.map(String)).size === 8;
  check('every start pattern needs exactly SPIRE_TAPS[i] taps (40 seeds × 5, brute force); FACET_RING = the 8 facets (S-20/S-28)',
    bad.length === 0 && ring && startMask(5, 3) === startMask(5, 3), `bad ${bad.slice(0, 8).join()}`);
}

/** A Spire being fed and then primed, at 1280×800 Drift and 320×568 Surge (DSF 1): the arc, the toast, the facets.
 *  `shots` (env SPIRE_SHOT, a directory) saves feed-*.png and primed-*.png (viewed in session 51). */
async function browserChecks(browser, url, check, errors, shots) {
  for (const [vw, vh, mode] of [[1280, 800, 'drift'], [320, 568, 'surge']]) {
    const touch = vw < 400;
    const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, ...(touch ? { isMobile: true, hasTouch: true } : {}) });
    page.on('pageerror', e => errors.push(`spirefeed ${vw}: ` + e.message));
    await page.goto(url + '?dev'); await page.waitForTimeout(200);
    if (touch) await page.tap('#new-world'); else await page.click('#new-world');
    await page.waitForTimeout(300);
    await page.evaluate(m => window.__lumen.game.setMode(m), mode);
    await nearSpire(page, 0);
    // Step into the interior on the same side (3 cells out from the core), give 200 ▲ banked + 6 in cargo, start at 34 fed.
    await page.evaluate(() => {
      const L = window.__lumen, g = L.game, s = g.spires[0], cx = g.world.w / 2, cy = g.world.h / 2;
      const side = Math.abs(s.x + 0.5 - cx) > Math.abs(s.y + 0.5 - cy) ? [Math.sign(cx - s.x - 0.5) * 3, 0] : [0, Math.sign(cy - s.y - 0.5) * 3];
      g.player.x = (s.x + side[0] + 0.5) * 32; g.player.y = (s.y + side[1] + 0.5) * 32; g.player.vx = g.player.vy = 0;
      g.bank.prism = 200; g.cargo.prism = 6; s.fed = 34;
    });
    await page.waitForFunction(() => { const L = window.__lumen, p = L.game.player; return Math.hypot(L.renderer.cam.x - p.x, L.renderer.cam.y - p.y) < 40; }, null, { timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => window.__lumen.game.spires[0].fed >= 44, null, { timeout: 3000 }).catch(() => {});
    // The arc's brightest pixel at its start (24 px above the core) vs the track at its far side (just left of the top).
    const arc = await page.evaluate(() => {
      const L = window.__lumen, g = L.game, R = L.renderer, p = g.player, s = g.spires[0];
      const at = (x, y) => { const q = R.worldToScreen(x, y), d = R.ctx.getImageData(Math.round(q.x * R.dpr) - 2, Math.round(q.y * R.dpr) - 2, 5, 5).data;
        let m = 0; for (let i = 0; i < d.length; i += 4) m = Math.max(m, d[i] + d[i + 1] + d[i + 2]); return m; };
      const a = -Math.PI / 2 + Math.PI * 2 * 0.95, r = 24;
      return { fed: s.fed, cargo: g.cargo.prism, bank: g.bank.prism, start: at(p.x + Math.cos(-Math.PI / 2 + 0.3) * r, p.y + Math.sin(-Math.PI / 2 + 0.3) * r), track: at(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r) };
    });
    if (shots) await page.screenshot({ path: `${shots}/feed-${vw}x${vh}.png` });
    check(`${vw}×${vh} ${mode}: the Spire feeds (cargo first) and draws a fed / 80 arc round the core (S-20, DSF 1)`, arc.fed > 34 && arc.fed < 80
      && arc.cargo === 0 && arc.bank === 200 - (arc.fed - 40) && arc.start > 1.5 * arc.track && arc.start > 400, JSON.stringify(arc));
    // Facet brightness before and after priming, at each facet's centre.
    const facets = () => page.evaluate(() => {
      const L = window.__lumen, g = L.game, R = L.renderer, s = g.spires[0];
      const ring = [[2, -4], [4, -2], [4, 2], [2, 4], [-2, 4], [-4, 2], [-4, -2], [-2, -4]];
      return ring.map(([i, j]) => { const q = R.worldToScreen((s.x + i + 0.5) * 32, (s.y + j + 0.5) * 32);
        if (q.x < 6 || q.y < 6 || q.x > R.w - 6 || q.y > R.h - 6) return null;
        const d = R.ctx.getImageData(Math.round(q.x * R.dpr) - 4, Math.round(q.y * R.dpr) - 4, 9, 9).data;
        let m = 0; for (let k = 0; k < d.length; k += 4) m += d[k] + d[k + 1] + d[k + 2]; return Math.round(m / 81); });
    });
    const before = await facets();
    await page.evaluate(() => { window.__lumen.game.spires[0].fed = 78; });
    await page.waitForFunction(() => { const t = document.getElementById('toast'); return t.classList.contains('show') && /Spire primed/.test(t.textContent); }, null, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(150);
    const after = await facets();
    const st = await page.evaluate(() => { const g = window.__lumen.game, s = g.spires[0], e = document.getElementById('toast'), r = e.getBoundingClientRect();
      return { fed: s.fed, mask: s.mask, drawn: g.wake && g.wake.s === s ? (1 << g.wake.lit) - 1 : s.mask, lit: s.lit, toast: e.classList.contains('show') ? e.textContent : 'hidden', l: Math.round(r.left), r: Math.round(r.right) }; });
    if (shots) await page.screenshot({ path: `${shots}/primed-${vw}x${vh}.png` });
    // Light falls off across the Spire, so compare each facet with itself: every on-screen lit facet gains more (after /
    // before, measured 2.4–2.7×) than any unlit one (its sharper outline: 1.2–1.3×).
    const gain = after.map((v, k) => v === null || !before[k] ? null : v / before[k]);
    // S-23: in Surge the Wake starts at once and the facets show its clock (0 lit), not the puzzle: none brightens.
    const on = gain.filter((v, k) => v !== null && (st.drawn >> k & 1)), off = gain.filter((v, k) => v !== null && !(st.drawn >> k & 1));
    const brighter = st.drawn === 0 ? off.every(v => v < 1.6) : on.length > 0 && on.every(v => v > 1.6) && (off.length === 0 || Math.min(...on) > Math.max(...off));
    check(`${vw}×${vh} ${mode}: at 80 the toast "Spire primed" fits the screen and the drawn lit facets brighten (S-20, DSF 1; Surge: the Wake clock, S-23)`, st.fed === 80
      && st.mask !== null && !st.lit && /Spire primed/.test(st.toast) && st.l >= 0 && st.r <= vw && brighter, JSON.stringify({ st, before, after }));
    await page.close();
  }
}

module.exports = { nodeChecks, browserChecks };
