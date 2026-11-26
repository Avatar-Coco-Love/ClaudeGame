// S-24 Ending checks (D-045, D-090). smoke.cjs calls nodeChecks and browserChecks.
// Node: the last relight ends the world once (sequence state, darkness eases 0.93 -> 0.5), the summary counts Drift / Surge /
// restored Spires, `ended` + `endedAt` survive a save (no sequence on reload, dark stays lifted), an old save upgrades to
// ended false, and a save that already lit every Spire gets its ending on load. Browser (1280×800, 320×568): dev "Relight
// all" -> the overview sequence (zoomed out, lines), a key/tap skips it, the card fits and matches the stats, Continue
// resumes, a reload keeps the lifted dark with no sequence and the card is reachable from the Matrix; reduced motion: a
// short fade, no pull-out. Screenshots (env SPIRE_SHOT): ending-seq-*.png, ending-card-*.png.
const quiet = new Proxy({}, { get: () => () => {} });
const DT = 1 / 60, idle = { move: { x: 0, y: 0 }, aim: null, fire: false };

async function nodeChecks(check) {
  const { Game } = await import('../src/game.js'), sp = await import('../src/spire.js'), en = await import('../src/ending.js');
  const { upgradeSave } = await import('../src/save.js');
  const { DARK_ALPHA, ENDING_S } = await import('../src/config.js');
  const make = (save = null, settings = null, size) => { const g = new Game({ seed: 77, mode: 'drift', audio: quiet, save, settings, size });
    const ev = []; const n = g.notify.bind(g); g.notify = e => { ev.push(e); n(e); }; g.ev = ev; return g; };
  const relight = (g, modes) => g.spires.forEach((s, i) => { if (!s.lit) { s.fed = 80; sp.relightSpire(g, s, modes[i]); } });

  {
    const g = make(); g.stats.time = 1234; g.stats.mined = 321; g.stats.glitches = 7;
    relight(g, ['drift', 'surge', 'drift', 'surge', 'broken']);
    const once = g.ev.filter(e => e === 'ending').length, d0 = en.darkAlpha(g);
    en.tickEnding(g, ENDING_S / 2); const dMid = en.darkAlpha(g);
    const done = en.tickEnding(g, ENDING_S), d1 = en.darkAlpha(g), sum = en.endingSummary(g);
    check('S-24: the last relight ends the world once; the darkness eases 0.93 → 0.5 over the sequence; the summary counts each path',
      g.ended && g.endedAt === 1234 && once === 1 && d0 === DARK_ALPHA[0] && dMid < d0 && dMid > DARK_ALPHA[1] && done && !g.endSeq
      && d1 === DARK_ALPHA[1] && sum.drift === 2 && sum.surge === 2 && sum.restored === 1 && sum.mined === 321 && sum.glitches === 7 && sum.time === '20m 34s',
      JSON.stringify({ once, d0, dMid: +dMid.toFixed(3), d1, sum }));
    const h = make(JSON.parse(JSON.stringify(g.toSave()))); h.update(DT, idle);
    check('S-24: ended + endedAt survive a reload: no sequence, the dark stays lifted, the card reads the same',
      h.ended && h.endedAt === 1234 && !h.endSeq && en.darkAlpha(h) === DARK_ALPHA[1] && !h.ev.includes('ending')
      && JSON.stringify(en.endingSummary(h)) === JSON.stringify({ ...sum, mined: h.stats.mined, glitches: h.stats.glitches }),
      JSON.stringify({ ended: h.ended, at: h.endedAt, seq: !!h.endSeq }));
  }
  {
    const g = make(null, null, 160); relight(g, ['drift', 'drift', 'drift', 'drift', 'drift']); // v12 saves are 160
    const old = JSON.parse(JSON.stringify(g.toSave())); old.v = 12; delete old.ended; delete old.endedAt;
    const up = upgradeSave(JSON.parse(JSON.stringify(old)));
    const h = make(up);
    const part = JSON.parse(JSON.stringify(make(null, null, 160).toSave())); part.v = 12; delete part.ended; delete part.endedAt;
    const k = make(upgradeSave(part));
    check('S-24: a format-12 save loads ended false; one that already lit every Spire gets its ending on load',
      up.ended === false && h.ended && !!h.endSeq && h.events.includes('ending') && !k.ended && !k.endSeq,
      JSON.stringify({ up: up.ended, h: [h.ended, !!h.endSeq], k: [k.ended, !!k.endSeq] }));
  }
  {
    const g = make(null, { reducedMotion: true }); relight(g, ['drift', 'drift', 'drift', 'drift', 'drift']);
    check('S-24: reduced motion: the sequence is a 1 s fade', en.endingDur(g) === 1 && !en.tickEnding(g, 0.9) && en.tickEnding(g, 0.2), '');
  }
}

async function browserChecks(browser, url, check, errors, shots) {
  for (const [vw, vh] of [[1280, 800], [320, 568], [568, 320]]) {
    const touch = vw < 400;
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, ...(touch ? { isMobile: true, hasTouch: true } : {}) });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`ending ${vw}: ` + e.message));
    await page.goto(url); await page.waitForTimeout(200);
    await page.evaluate(() => { try { localStorage.clear(); } catch {} });
    await page.reload(); await page.waitForTimeout(200);
    if (touch) await page.tap('#new-world'); else await page.click('#new-world');
    await page.waitForTimeout(300);
    await page.evaluate(() => { const g = window.__lumen.game; g.stats.mined = 50; g.stats.glitches = 3; window.__lumen.dev.relightAll(); });
    await page.waitForTimeout(3000);
    const mid = await page.evaluate(async () => { const L = window.__lumen, g = L.game, en = await import('/src/ending.js'), ov = en.endingView(L.renderer);
      return { seq: !!g.endSeq, t: g.endSeq && +g.endSeq.t.toFixed(1), zoom: ov && ov.zoom, base: L.renderer.zoom, hud: getComputedStyle(document.getElementById('hud')).pointerEvents, dark: en.darkAlpha(g) * 255,
        card: !document.getElementById('ending').classList.contains('hidden') }; });
    if (shots) await page.screenshot({ path: `${shots}/ending-seq-${vw}x${vh}.png` });
    check(`${vw}×${vh}: relighting all 5 runs the ending: the view pulls out over the world, the HUD steps aside, the dark lifts, no card yet (S-24)`,
      mid.seq && mid.t > 2 && mid.zoom < mid.base / 2 && mid.dark < 0.9 * 255 && mid.dark > 0.5 * 255 && !mid.card && mid.hud === 'none', JSON.stringify(mid));
    if (touch) await page.touchscreen.tap(vw / 2, vh / 2); else await page.keyboard.press('e'); // E would open the Matrix: it must only skip
    await page.waitForTimeout(400);
    const card = await page.evaluate(() => { const L = window.__lumen, g = L.game, c = document.querySelector('#ending .sheet').getBoundingClientRect();
      return { seq: !!g.endSeq, open: !document.getElementById('ending').classList.contains('hidden'), matrix: !document.getElementById('matrix').classList.contains('hidden'),
        text: document.getElementById('ending-stats').textContent, l: c.left, r: c.right, t: c.top, b: c.bottom, ov: !!L.renderer.game.endSeq,
        cycle: document.getElementById('ending-cycle').disabled, time0: g.stats.time,
        hint: !document.getElementById('hint').classList.contains('hidden'), scroll: document.querySelector('#ending .sheet').scrollHeight - document.querySelector('#ending .sheet').clientHeight }; });
    if (shots) await page.screenshot({ path: `${shots}/ending-card-${vw}x${vh}.png` });
    check(`${vw}×${vh}: a ${touch ? 'tap' : 'key'} skips to the card: it fits, shows the stats (5 Drift, 50 mined, 3 Glitches, Bosses 0 / 2), New Cycle is live, no hint under it, no scroll (S-24, S-29, B-054)`,
      !card.seq && card.open && !card.matrix && card.l >= 0 && card.r <= vw && card.t >= 0 && card.b <= vh && !card.ov && !card.cycle && !card.hint /* B-054 */ && card.scroll <= 0
      && /Spires relit in Drift5/.test(card.text) && /Cells mined50/.test(card.text) && /Glitches cleared3/.test(card.text) && /Bosses0 \/ 2/.test(card.text) /* S-62: a 256 world */, JSON.stringify(card));
    if (touch) await page.tap('#ending-continue'); else await page.click('#ending-continue');
    await page.waitForTimeout(500);
    const after = await page.evaluate(t0 => { const g = window.__lumen.game; return { open: !document.getElementById('ending').classList.contains('hidden'), moved: g.stats.time > t0 }; }, card.time0);
    await page.evaluate(() => dispatchEvent(new Event('pagehide')));
    await page.reload(); await page.waitForTimeout(200);
    if (touch) await page.tap('#continue'); else await page.click('#continue');
    await page.waitForTimeout(600);
    const back = await page.evaluate(() => { const L = window.__lumen, g = L.game, p = g.player; p.x = g.nexus.x; p.y = g.nexus.y + 40;
      return { ended: g.ended, seq: !!g.endSeq, dark: L.renderer.lctx.getImageData(2, 2, 1, 1).data[3] }; });
    await page.waitForTimeout(100);
    if (touch) await page.tap('#matrix-btn'); else await page.keyboard.press('e');
    await page.waitForTimeout(200);
    const btn = await page.evaluate(() => !document.getElementById('ending-open').classList.contains('hidden'));
    if (btn) { if (touch) await page.tap('#ending-open'); else await page.click('#ending-open'); await page.waitForTimeout(150); }
    const reopened = await page.evaluate(() => !document.getElementById('ending').classList.contains('hidden'));
    check(`${vw}×${vh}: Continue resumes play; a reload keeps the ending (no sequence, dark lifted) and the Matrix reopens the card (S-24)`,
      !after.open && after.moved && back.ended && !back.seq && Math.abs(back.dark - 0.5 * 255) < 8 && btn && reopened, JSON.stringify({ after, back, btn, reopened }));
    await ctx.close();
  }
  // Audit 64: B-056 the skip key never presses a focused HUD button (♪ clicked first); B-055 a held Enter keeps the card open.
  {
    const pg = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    pg.on('pageerror', e => errors.push('ending keys: ' + e.message));
    await pg.goto(url + '?dev'); await pg.waitForTimeout(200);
    await pg.evaluate(() => { try { localStorage.clear(); } catch {} });
    await pg.reload(); await pg.waitForTimeout(200);
    await pg.click('#new-world'); await pg.waitForTimeout(300);
    await pg.click('#mute-btn'); const m0 = await pg.evaluate(() => window.__lumen.settings.muted);
    await pg.evaluate(() => { window.__lumen.dev.relightAll(); document.getElementById('mute-btn').focus(); });
    await pg.waitForTimeout(300);
    await pg.keyboard.down('Enter'); await pg.waitForTimeout(250);
    await pg.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true })));
    await pg.evaluate(() => document.activeElement && document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true })));
    await pg.keyboard.up('Enter'); await pg.waitForTimeout(200);
    const k = await pg.evaluate(() => ({ muted: window.__lumen.settings.muted, card: !document.getElementById('ending').classList.contains('hidden') }));
    await pg.evaluate(m => { window.__lumen.settings.muted = m; }, false);
    check('a skip key presses no focused button (B-056) and a held Enter leaves the card open (B-055)', k.muted === m0 && k.card, JSON.stringify({ m0, k }));
    await pg.close();
  }
  // Reduced motion: no pull-out, a 1 s fade, then the card.
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push('ending rm: ' + e.message));
  await page.goto(url); await page.waitForTimeout(200);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload(); await page.waitForTimeout(200);
  await page.click('#new-world'); await page.waitForTimeout(300);
  await page.evaluate(() => { window.__lumen.settings.reducedMotion = true; window.__lumen.dev.relightAll(); });
  await page.waitForTimeout(300);
  const rm = await page.evaluate(async () => ({ seq: !!window.__lumen.game.endSeq, ov: (await import('/src/ending.js')).endingView(window.__lumen.renderer) }));
  await page.waitForTimeout(1200);
  const rmCard = await page.evaluate(() => !document.getElementById('ending').classList.contains('hidden'));
  await page.evaluate(() => { window.__lumen.settings.reducedMotion = false; });
  check('reduced motion: the ending is a 1 s fade with no pull-out or lines, then the card (S-24)', rm.seq && rm.ov === null && rmCard, JSON.stringify({ rm, rmCard }));
  await page.close();
}

module.exports = { nodeChecks, browserChecks };
if (require.main === module) {
  let fail = 0;
  nodeChecks((name, ok, detail) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); })
    .then(() => process.exit(fail ? 1 : 0));
}
