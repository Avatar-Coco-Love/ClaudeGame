// S-63 Lens checks (D-175). smoke.cjs calls nodeChecks and browserChecks. Node: the Nexus row (both sizes) and its price;
// a call charges RIFT_CALL_COST and opens a pocket in the core's ring from its own stream; every refusal charges nothing;
// the natural schedule's sites are the same with and without calls; a called rift closes at 45 s and a natural one due
// meanwhile is skipped; Drift = Surge; an old save loads the Lens unbuilt. Browser: ❖ and its key hidden before the Lens,
// shown after; C and ❖ call (▲ spent, toast), a second press is refused with nothing spent.
// Usage: node tests/lens.cjs [--browser | --browser-only]
const quiet = new Proxy({}, { get: () => () => {} });

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js');
  const { riftStarts, updateRift, callRift } = await import('../src/rift.js');
  const { upgradeSave, STEPS } = await import('../src/save.js');
  const C = await import('../src/config.js');
  const { NEXUS_UPGRADES, RIFT_CALL_COST, RIFT_CALL_CD, RIFT_S, RIFT_ORE, RIFT_MAJOR, CELL, T } = C;
  const make = (mode = 'drift', seed = 4242, size) => { const g = new Game({ seed, mode, audio: quiet, size }); updateRift(g); return g; };
  const at = (g, x, y) => { Object.assign(g.player, { x: (x + 0.5) * CELL, y: (y + 0.5) * CELL }); };
  const out = g => at(g, Math.floor(g.world.cx) + 14, Math.floor(g.world.cy)); // Hearth, outside the Nexus ring
  const ready = (g, prism = 100) => { g.nexusLevels.lens = 1; g.bank.prism = prism; out(g); return g; };

  { // the row: every world size, 40 ▲, one level, the only unlock
    const u = NEXUS_UPGRADES.find(u => u.id === 'lens'), res = [];
    for (const size of [160, 256]) {
      const g = make('drift', 4242, size); g.bank.prism = 40;
      res.push(g.canAffordNexus('lens') && g.buyNexus('lens') && g.nexusLevels.lens === 1 && g.bank.prism === 0 && !g.canAffordNexus('lens'));
    }
    check('S-63 Lens: a Nexus row in 160 and 256 worlds, 40 ▲, one level', !!u && u.max === 1 && u.cost(0).prism === 40 && res.every(Boolean), JSON.stringify(res));
  }
  { // a call: charges 30, opens a called pocket in the core's ring (its ore), at the core's spot; in every ring, many seeds
    let n = 0, bad = '';
    for (let s = 1; s <= 12 && !bad; s++) for (let ring = 0; ring < 5 && !bad; ring++) {
      const g = make('surge', s * 7919), w = g.world, d = [14, 36, 64, 92, 116][ring] + (s % 4), a = s * 1.3 + ring;
      const x = Math.floor(w.cx + Math.cos(a) * d), y = Math.floor(w.cy + Math.sin(a) * d);
      if (w.ring(x, y) !== ring) continue;
      g.nexusLevels.lens = 1; g.bank.prism = 50; at(g, x, y); g.stats.time = 5;
      const why = callRift(g), o = g.rift.open;
      if (why === 'site') { if (g.bank.prism !== 50) bad = 'site refusal charged'; continue; }
      const types = o ? o.cells.map(c => w.get(c.x, c.y)) : [], [maj] = RIFT_ORE[ring];
      if (why || !o || !o.called) bad = `seed ${s} ring ${ring}: ${why}`;
      else if (g.bank.prism !== 50 - RIFT_CALL_COST) bad = `bank ${g.bank.prism}`;
      else if (o.ring !== ring || types.filter(t => t === maj).length !== RIFT_MAJOR[ring]) bad = `ring ${o.ring} / ore ${types}`;
      n++;
    }
    check('S-63 Lens: a call charges 30 ▲ and opens a pocket of the core\'s ring ore', !bad && n >= 40, bad || `${n} calls`);
  }
  { // refusals: nothing spent, nothing opened
    const cases = {
      lens: g => { g.nexusLevels.lens = 0; }, nexus: g => at(g, Math.floor(g.world.cx), Math.floor(g.world.cy)),
      busy: g => { g.weather.kind = 'aurora'; }, wake: g => { g.wake = { core: { x: 0, y: 0 } }; }, ending: g => { g.endSeq = { t: 0 }; },
      boss: g => { g.bossAwake = true; }, cooldown: g => { g.rift.lastCall = g.stats.time - RIFT_CALL_CD + 1; }, prisms: g => { g.bank.prism = RIFT_CALL_COST - 1; },
      site: g => { const px = Math.floor(g.player.x / CELL), py = Math.floor(g.player.y / CELL);
        for (let y = py - 13; y <= py + 13; y++) for (let x = px - 13; x <= px + 13; x++) g.world.retype(x, y, T.EMPTY); },
    }, bad = [];
    for (const [k, f] of Object.entries(cases)) {
      const g = ready(make()); g.stats.time = 200; f(g); const b = g.bank.prism, why = callRift(g);
      if (!why || g.rift.open || g.bank.prism !== b) bad.push(`${k}: ${why || 'opened'} ${b}→${g.bank.prism}`);
    }
    const g = ready(make()); g.stats.time = 200; callRift(g); const b = g.bank.prism, why = callRift(g);
    if (why !== 'open' || g.bank.prism !== b) bad.push(`open: ${why}`);
    check('S-63 Lens: each refusal (no Lens, Nexus, weather, Wake, ending, boss, cooldown, < 30 ▲, no site, one open) spends nothing',
      !bad.length, bad.join('; ') || `${Object.keys(cases).length + 1} refusals`);
  }
  { // a called rift closes at t0 + 45; a natural one due meanwhile is skipped; the cooldown then allows the next call
    const st = riftStarts(4242, 2).map(Math.ceil), g = ready(make());
    g.stats.time = st[0] - 10; updateRift(g); const why = callRift(g), o = g.rift.open;
    const log = [];
    for (let t = st[0] - 9; t <= st[0] + RIFT_S + 5; t++) { g.stats.time = t; updateRift(g); if (g.rift.open !== (log.length ? log[log.length - 1].o : o)) log.push({ t, o: g.rift.open }); }
    g.stats.time = st[0] - 10 + RIFT_CALL_CD; const again = callRift(g);
    check('S-63 Lens: a called rift closes at 45 s; a natural rift due while it is open is skipped; the next call waits RIFT_CALL_CD',
      !why && o && log.length === 1 && log[0].t === st[0] - 10 + RIFT_S && log[0].o === null && again === '', `${why} ${JSON.stringify(log.map(l => [l.t, !!l.o]))} again '${again}'`);
  }
  { // the natural schedule and its sites are identical with and without calls between natural rifts (own stream)
    const st = riftStarts(4242, 4).map(Math.ceil), trace = calls => {
      const g = ready(make(), 1000), opens = []; let n = 0;
      for (let t = 1; t <= st[3] + 60; t++) {
        g.stats.time = t;
        if (calls && st.some(s => t === s + RIFT_S + 5) && !callRift(g)) n++;
        updateRift(g);
        const o = g.rift.open; if (o && !o.called && !opens.some(q => q.k === o.k)) opens.push({ k: o.k, x: o.x, y: o.y, t });
      }
      return { opens, n };
    };
    const a = trace(false), b = trace(true);
    check('S-63 Lens: calls draw their own sites; the natural rifts open at the same times and spots with or without them',
      a.opens.length === 4 && b.n >= 3 && JSON.stringify(a.opens) === JSON.stringify(b.opens), `${b.n} calls; ${JSON.stringify(a.opens)} vs ${JSON.stringify(b.opens)}`);
  }
  { // Drift = Surge: the same call opens the same pocket
    const p = mode => { const g = ready(make(mode)); g.stats.time = 30; callRift(g); const o = g.rift.open; return o && JSON.stringify(o.cells.map(c => [c.x, c.y, c.type])); };
    check('S-63 Lens: Drift and Surge open the same called pocket', !!p('drift') && p('drift') === p('surge'));
  }
  { // saves: the format before the Lens upgrades with it unbuilt; a built one reloads; junk loads 0; no rift state saved
    // (S-70: found by the step that adds `nexus.lens`, not SAVE_FORMAT - 1, so later formats don't break it)
    const lensStep = STEPS.findIndex(f => { try { return 'lens' in (f({ nexus: {} }).nexus || {}); } catch { return false; } });
    const s = make().toSave(); delete s.nexus.lens; s.v = lensStep + 1;
    const up = upgradeSave(JSON.parse(JSON.stringify(s))), g0 = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: up });
    const b = ready(make()).toSave(), g1 = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: JSON.parse(JSON.stringify(b)) });
    b.nexus.lens = 'x'; const g2 = new Game({ seed: 4242, mode: 'drift', audio: quiet, save: JSON.parse(JSON.stringify(b)) });
    check('S-63 Lens: an old save loads the Lens unbuilt, a built one reloads, a bad value loads 0',
      up.nexus.lens === 0 && g0.nexusLevels.lens === 0 && g1.nexusLevels.lens === 1 && g2.nexusLevels.lens === 0, `${up.nexus.lens} ${g0.nexusLevels.lens} ${g1.nexusLevels.lens} ${g2.nexusLevels.lens}`);
  }
  { // audit 139 (B-099, D-177): a HUD button's glyph never doubles as an Anomaly chip's (✧ was both the Lens button and Lodestone)
    const html = require('fs').readFileSync(require('path').join(__dirname, '../index.html'), 'utf8'), btn = {};
    for (const id of ['scan-btn', 'echo-btn', 'call-btn', 'mode-glyph', 'place-glyph', 'mute-btn', 'menu-btn']) {
      const m = html.match(new RegExp(`id="${id}"[^>]*>(?:<span[^>]*>)?\\s*(\\S)`, 'u')); btn[id] = m ? m[1] : '?';
    }
    const chips = Object.values(C.ANOMALY_KINDS).map(k => k.glyph), clash = Object.entries(btn).filter(([, g]) => g === '?' || chips.includes(g));
    check('Audit 139: no HUD button glyph (◎ ◇ ❖ ⟂ ✦ ♪ ≡) is also an Anomaly chip glyph (B-099)', !clash.length, JSON.stringify({ btn, chips }));
  }
  { // S-64: the gate tool's force 'calls' opens no natural rift, yet a Lens call still opens and keeps its 45 s clock
    const st = riftStarts(4242, 1).map(Math.ceil), g = ready(make()); g.rift.force = 'calls';
    let natural = 0; for (let t = 1; t <= st[0] + 5; t++) { g.stats.time = t; updateRift(g); if (g.rift.open) natural++; }
    const why = callRift(g); g.stats.time += RIFT_S - 1; updateRift(g); const mid = !!g.rift.open; g.stats.time += 2; updateRift(g);
    check("S-64 Lens gate: force 'calls' opens no natural rift; a call still opens and closes at 45 s",
      natural === 0 && why === '' && mid && !g.rift.open, `natural ${natural}, call '${why}', open at 44 s ${mid}, after ${!!g.rift.open}`);
  }
  { // S-64 gate (D-178): tools/eventrun.mjs --call, Deep / Shoal / Kiln, 16 seeds × 10 min, mine vs call-on-cooldown
    const out = await require('./gates.cjs').run('eventrun.mjs', ['--call']);
    check('S-64 Lens gate passes (call / mine value ≤ 1.25, ▲ call − mine < 0, Drift / Surge 0.8–1.25; Deep + Shoal + Kiln, 16 seeds)',
      /: PASS/.test(out.trim().split('\n').pop()), out.trim().split('\n').filter(l => /call\/mine|drift\/surge/.test(l)).map(l => l.split(' ▲ spent')[0]).join('; '));
  }
  { // S-67 (D-219): Rift runner from the same run: pockets emptied a run, pooled over the rings, Drift / Surge 0.8–1.25,
    // and every ring and mode empties ≥ 1 a run (FEAT_RIFTS 5 stays reachable everywhere, no mode ahead)
    const out = await require('./gates.cjs').run('eventrun.mjs', ['--call']), sum = {}, low = [];
    for (const m of out.matchAll(/^(\w+) (drift|surge): .*?([\d.]+) pockets emptied/gm)) {
      sum[m[2]] = (sum[m[2]] || 0) + Number(m[3]); if (Number(m[3]) < 1) low.push(`${m[1]} ${m[2]} ${m[3]}`);
    }
    const q = sum.drift / sum.surge;
    check('S-67 Rift runner: pockets emptied a run pooled Drift / Surge 0.8–1.25, every ring and mode ≥ 1 (eventrun --call, 16 seeds)',
      q >= 0.8 && q <= 1.25 && !low.length && Object.keys(sum).length === 2, `drift ${sum.drift} / surge ${sum.surge} = ${q.toFixed(2)}; low ${low.join(', ') || '—'}`);
  }
}

async function browserChecks(browser, url, check, errors, shot) {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  pg.on('pageerror', e => errors.push('lens: ' + e.message));
  await pg.goto(url); await pg.waitForTimeout(200);
  await pg.evaluate(() => { try { localStorage.removeItem('lumencore.save.v1'); } catch {} });
  await pg.reload(); await pg.waitForTimeout(200);
  await require('./spire.cjs').pinnedNewWorld(pg); await pg.waitForTimeout(300); // B-103: a random seed had no rock 14 cells east 1.7 % of the time (D-100: pin)
  const st = () => pg.evaluate(() => { const g = window.__lumen.game; return { hidden: document.getElementById('call-btn').classList.contains('hidden'),
    open: !!(g.rift.open && g.rift.open.called), prism: g.bank.prism, toast: document.getElementById('toast').textContent }; });
  await pg.evaluate(() => { const g = window.__lumen.game; g.bank.prism = 100; g.player.x += 14 * 32; g.stats.time = 30; });
  await pg.keyboard.press('KeyC'); await pg.waitForTimeout(250);
  const before = await st();
  await pg.evaluate(() => { window.__lumen.game.nexusLevels.lens = 1; }); await pg.waitForTimeout(500);
  const shown = await st();
  await pg.keyboard.press('KeyC'); await pg.waitForTimeout(300);
  const called = await st();
  await pg.click('#call-btn'); await pg.waitForTimeout(300);
  const refused = await st();
  if (shot) await pg.screenshot({ path: shot });
  check('S-63 Lens: ❖ and C do nothing before the Lens; after it ❖ shows, C calls a rift (30 ▲, toast), a second press via ❖ is refused (nothing spent)',
    before.hidden && !before.open && before.prism === 100 && !shown.hidden && called.open && called.prism === 70 && /Rift called/.test(called.toast) &&
    refused.prism === 70 && /already open/.test(refused.toast), JSON.stringify({ before, shown, called, refused }));
  await pg.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks: process.argv.includes('--browser-only') ? null : nodeChecks, browserChecks,
  browser: process.argv.includes('--browser') || process.argv.includes('--browser-only') || !!process.env.LENS_SHOT, shot: process.env.LENS_SHOT });
