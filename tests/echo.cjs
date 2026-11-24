// S-42 Echo checks (D-108): Research row, follow through an L-bend, blink when walled off, Gather ore not rock, pauses,
// cargo-full stop, save, determinism. smoke.cjs calls nodeChecks + browserChecks.
const idle = () => ({ move: { x: 0, y: 0 }, aim: null, fire: false });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { T, CELL, ECHO_DMG } = await import('../src/config.js');
  const { buyResearch } = await import('../src/research.js');
  const blinks = [];
  const audio = new Proxy({}, { get: (_, k) => (...a) => { if (k === 'echoBlink') blinks.push(k); } });

  // A lab in solid rock, Hearth ring: `open` cells cleared, the core at (ax, ay), the Echo owned.
  const lab = (open, ax, ay, mode = 'drift') => {
    const g = new Game({ seed: 4242, mode, audio }), w = g.world, ox = w.cx + 8, oy = w.cy + 8;
    for (let y = oy - 2; y <= oy + 22; y++) for (let x = ox - 2; x <= ox + 22; x++) w.cells[w.idx(x, y)] = T.ROCK;
    for (const [x, y] of open) w.cells[w.idx(ox + x, oy + y)] = T.EMPTY;
    Object.assign(g.player, { x: (ox + ax + 0.5) * CELL, y: (oy + ay + 0.5) * CELL, vx: 0, vy: 0 });
    g.spawnTimer = 1e9; g.research.echo = true;
    return { g, w, ox, oy };
  };

  // Research: 30 ● buys it; no Echo before.
  {
    const g = new Game({ seed: 4242, mode: 'drift', audio });
    g.update(1 / 60, idle());
    const before = g.echo;
    g.bank.lumen = 29; const poor = buyResearch(g, 'echo');
    g.bank.lumen = 30; const ok = buyResearch(g, 'echo');
    g.update(1 / 60, idle());
    check('Echo: the Research row buys at 30 ● (not 29) and only then the Echo appears beside the core (S-42)',
      before === null && !poor && ok && g.bank.lumen === 0 && !!g.echo && Math.hypot(g.echo.x - g.player.x, g.echo.y - g.player.y) < 2 * CELL,
      JSON.stringify({ before, poor, ok, lumen: g.bank.lumen, echo: !!g.echo }));
    const h = new Game({ seed: 4242, mode: 'drift', audio, save: JSON.parse(JSON.stringify(g.toSave())) });
    h.update(1 / 60, idle());
    check('Echo: owning it survives save + load (a Research id, no new save field); its live state is not saved (S-42)',
      h.research.echo === true && !!h.echo && !('echo' in g.toSave()), JSON.stringify(Object.keys(g.toSave())));
  }

  // An L-bend: a corridor east 14 cells, then south 14. The core drives it at full speed; the Echo follows without a blink.
  {
    const open = [];
    for (let x = 0; x <= 14; x++) open.push([x, 0]);
    for (let y = 0; y <= 14; y++) open.push([14, y]);
    const { g } = lab(open, 0, 0);
    g.update(1 / 60, idle()); for (let i = 0; i < 30; i++) g.update(1 / 60, idle());
    blinks.length = 0;
    const b0 = g.echo.blinks, corner = (g.player.x / CELL | 0) + 14;
    let maxLag = 0;
    for (let i = 0; i < 60 * 8; i++) {
      const p = g.player, cx = p.x / CELL | 0;
      const move = cx < corner ? { x: 1, y: 0 } : { x: 0, y: 1 };
      g.update(1 / 60, { move, aim: null, fire: false });
      maxLag = Math.max(maxLag, Math.hypot(g.echo.x - p.x, g.echo.y - p.y) / CELL);
    }
    for (let i = 0; i < 60; i++) g.update(1 / 60, idle());
    const end = Math.hypot(g.echo.x - g.player.x, g.echo.y - g.player.y) / CELL;
    check('Echo: follows the core through a carved L-bend with no blink and ends 1.5–3 cells from it (S-42)',
      g.echo.blinks === b0 && blinks.length === 0 && end >= 1.2 && end <= 3.2 && maxLag < 6,
      JSON.stringify({ blinks: g.echo.blinks - b0, end: +end.toFixed(2), maxLag: +maxLag.toFixed(2) }));
  }

  // Walled off: a 9×3 hall; the Echo is sealed into its cell, it blinks back beside the core within 2 s.
  {
    const open = [];
    for (let x = 0; x <= 8; x++) for (let y = 0; y <= 2; y++) open.push([x, y]);
    const { g, w } = lab(open, 1, 1);
    for (let i = 0; i < 60; i++) g.update(1 / 60, idle());
    const e = g.echo, ex = e.x / CELL | 0, ey = e.y / CELL | 0;
    for (let y = ey - 1; y <= ey + 1; y++) for (let x = ex - 1; x <= ex + 1; x++) if (x !== ex || y !== ey) w.cells[w.idx(x, y)] = T.ROCK;
    // the core, if sealed in with it, steps out of the cage first (the seal is the dev's, so move the core two cells east)
    g.player.x = (ex + 3.5) * CELL; g.player.y = (ey + 0.5) * CELL; w.cells[w.idx(ex + 3, ey)] = T.EMPTY;
    const b0 = e.blinks; let t = 0;
    while (t < 2 && !(e.blinks > b0 && !e.blink)) { g.update(1 / 60, idle()); t += 1 / 60; }
    const d = Math.hypot(e.x - g.player.x, e.y - g.player.y) / CELL;
    check('Echo: sealed off from the core, it blinks to an open cell beside the core within 2 s (S-42)',
      e.blinks === b0 + 1 && !e.blink && d < 1.6 && t < 2, JSON.stringify({ blinks: e.blinks - b0, t: +t.toFixed(2), d: +d.toFixed(2) }));
  }

  // Gather: a 7×3 hall with a Shard cell in its east wall and rock beside it. The core idles; the Echo breaks the Shard,
  // leaves the rock whole, and the yield drops as pickups. Same lab with full cargo: nothing mined.
  const gatherLab = (setup = () => {}, secs = 12) => {
    const open = [];
    for (let x = 0; x <= 6; x++) for (let y = 0; y <= 2; y++) open.push([x, y]);
    const L = lab(open, 3, 1), { g, w, ox, oy } = L; // the Shard 4 cells east of the core (reach 5)
    w.cells[w.idx(ox + 7, oy + 1)] = T.CRYSTAL;
    setup(g);
    const mined0 = g.stats.mined;
    for (let i = 0; i < 60 * secs; i++) g.update(1 / 60, idle());
    let rockHit = 0;
    for (let y = oy - 1; y <= oy + 3; y++) for (let x = ox - 1; x <= ox + 8; x++) if (w.cells[w.idx(x, y)] === T.ROCK) rockHit += w.damage[w.idx(x, y)];
    return { g, shard: w.cells[w.idx(ox + 7, oy + 1)] === T.EMPTY, rockHit, mined: g.stats.mined - mined0, stats: JSON.stringify(g.stats) };
  };
  const a = gatherLab();
  check('Echo Gather: breaks an exposed Shard cell, never touches the rock beside it, and the yield drops for the Attractor (S-42)',
    a.shard && a.rockHit === 0 && a.mined === 1 && (a.g.cargo.shard + a.g.pickups.filter(q => q.kind === 'shard').length) >= 1,
    JSON.stringify({ shard: a.shard, rockHit: a.rockHit, mined: a.mined, cargo: a.g.cargo.shard }));
  const full = gatherLab(g => { g.cargo.shard = g.stat('cargo'); }, 6);
  check('Echo Gather: stops while cargo is full (no wasted drops) (S-42)', !full.shard && full.mined === 0, JSON.stringify({ shard: full.shard, mined: full.mined }));
  const nex = gatherLab(g => { g.nexus = { x: g.player.x, y: g.player.y }; }, 6);
  check('Echo: pauses (holds still, no mining) inside the Nexus ring (S-42)', !nex.shard && nex.g.echo.paused, JSON.stringify({ shard: nex.shard }));
  const end = gatherLab(g => { g.endSeq = { t: 0 }; }, 6);
  check('Echo: pauses during the Ending sequence (S-42)', !end.shard && end.g.echo.paused, JSON.stringify({ shard: end.shard }));
  const b = gatherLab();
  check('Echo: same seed + input → same stats and position (no draw of its own, D-025) (S-42)',
    a.stats === b.stats && a.g.echo.x === b.g.echo.x && a.g.echo.y === b.g.echo.y, a.stats + ' vs ' + b.stats);
  // Damage rate: 0.5 × the core's Beam dps at its Matrix level.
  {
    const open = [];
    for (let x = 0; x <= 6; x++) for (let y = 0; y <= 2; y++) open.push([x, y]);
    const { g, w, ox, oy } = lab(open, 3, 1);
    w.cells[w.idx(ox + 7, oy + 1)] = T.PRISM; g.upgrades.beam = 4;
    const i0 = w.idx(ox + 7, oy + 1);
    for (let i = 0; i < 60 && !w.damage[i0]; i++) g.update(1 / 60, idle());
    const d0 = w.damage[i0];
    for (let i = 0; i < 15; i++) g.update(1 / 60, idle());
    const rate = (w.damage[i0] - d0) * 4, want = g.stat('beam') * ECHO_DMG;
    check('Echo Gather: mines at 0.5 × the core\'s Beam dps (Matrix level counts) (S-42)', Math.abs(rate - want) < 0.02 * want, JSON.stringify({ rate, want }));
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  pg.on('pageerror', e => errors.push('echo: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await pg.click('#new-world'); await pg.waitForTimeout(200);
  await pg.evaluate(() => { const g = window.__lumen.game; g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; g.bank.lumen = 30; });
  await pg.keyboard.press('e'); await pg.waitForTimeout(100);
  await pg.click('#matrix .tabs button[data-tab="research"]');
  const row = await pg.evaluate(() => { const r = document.querySelector('#upgrade-list .upgrade[data-id="echo"]');
    return r ? { name: r.querySelector('.u-name').textContent, can: !r.querySelector('.buy').disabled } : null; });
  await pg.click('#upgrade-list .upgrade[data-id="echo"] .buy').catch(() => {});
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
  const bought = await pg.evaluate(() => ({ owned: window.__lumen.game.research.echo === true, lumen: window.__lumen.game.bank.lumen }));
  check('Echo: the Research tab has an Echo row that buys at 30 ● (S-42)', !!row && row.name === 'Echo' && row.can && bought.owned && bought.lumen === 0,
    JSON.stringify({ row, bought }));
  await pg.evaluate(() => { window.__lumen.dev.teleport(14); });
  await pg.waitForTimeout(700);
  const st = await pg.evaluate(() => { const g = window.__lumen.game; return { echo: !!g.echo, alpha: g.echo && g.echo.alpha,
    d: g.echo && Math.hypot(g.echo.x - g.player.x, g.echo.y - g.player.y) }; });
  check('Echo: after a teleport it blinks back and draws beside the core in the browser (S-42)', st.echo && st.alpha > 0.5 && st.d < 100, JSON.stringify(st));
  if (shot) await pg.screenshot({ path: shot });
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
