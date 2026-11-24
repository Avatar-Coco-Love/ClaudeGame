// S-17 touch pass checks (Pixel 7 emulation): landscape title, ◎/⟂ row out of the aim thumb, 44 px targets, hint wrap at 320 px,
// the ⟂ label, and the second-finger stick handoff. smoke.cjs calls browserChecks.
const { devices } = require('playwright');

const rect = (page, sel) => page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect();
  return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; }, sel);

// Start a world with Scanner + Wide unlocked so ◎ and ⟂ are on screen, the core parked in the Nexus.
async function intoGame(page) {
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload(); await page.waitForTimeout(300);
  await page.tap('#new-world'); await page.waitForTimeout(200);
  await page.evaluate(() => { const g = window.__lumen.game; g.research.scanner = true; g.research.wide = true; g.demo = true;
    g.player.x = g.nexus.x; g.player.y = g.nexus.y + 40; });
  await page.waitForTimeout(200);
}

async function browserChecks(browser, url, check, errors, shots) {
  const P7 = devices['Pixel 7'], { isMobile, hasTouch, deviceScaleFactor, userAgent } = P7;
  const phone = vp => browser.newContext({ isMobile, hasTouch, deviceScaleFactor, userAgent, viewport: vp });

  // ---- Landscape title at 844×390 and 667×375: h1 starts on screen; scrolling #title to its end shows the version line.
  for (const vp of [{ width: 844, height: 390 }, { width: 667, height: 375 }]) {
    const ctx = await phone(vp), pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push('touch title: ' + e.message));
    await pg.goto(url); await pg.waitForTimeout(300);
    if (shots && vp.width === 844) await pg.screenshot({ path: `${shots}/title-844x390.png` });
    const h1 = await rect(pg, '#title h1');
    await pg.evaluate(() => { const t = document.getElementById('title'); t.scrollTop = t.scrollHeight; });
    await pg.waitForTimeout(50);
    const foot = await rect(pg, '.foot'), ver = await pg.textContent('#version');
    check(`landscape title ${vp.width}×${vp.height}: logo on screen, version line reachable (S-17)`,
      h1.t >= 0 && foot.t >= 0 && foot.b <= vp.height && /v\d/.test(ver), JSON.stringify({ h1Top: h1.t, h1H: h1.h, foot, ver }));
    await ctx.close();
  }

  // ---- Landscape HUD at 844×390: ◎ ⟂ ♪ ≡ in a row left of the minimap, all above y 90; targets ≥ 44 px; ♪/≡ ≥ 8 px apart.
  {
    const ctx = await phone({ width: 844, height: 390 }), pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push('touch hud: ' + e.message));
    await pg.goto(url); await pg.waitForTimeout(300);
    await intoGame(pg);
    if (shots) await pg.screenshot({ path: `${shots}/hud-844x390.png` });
    const r = {};
    for (const s of ['#scan-btn', '#mode-btn', '#mute-btn', '#menu-btn', '#minimap', '.top-left']) r[s] = await rect(pg, s);
    const btns = ['#scan-btn', '#mode-btn', '#mute-btn', '#menu-btn'];
    const row = btns.every((s, i) => r[s].b <= 90 && r[s].r <= r['#minimap'].l && (i === 0 || r[btns[i - 1]].r <= r[s].l) && r[s].l >= r['.top-left'].r);
    const big = btns.every(s => r[s].w >= 44 && r[s].h >= 44), gap = r['#menu-btn'].l - r['#mute-btn'].r;
    check('landscape phone: ◎ ⟂ ♪ ≡ row left of the minimap, bottoms ≤ 90 px, ≥ 44 px, ♪/≡ gap ≥ 8 (S-17)', row && big && gap >= 8,
      JSON.stringify({ ...Object.fromEntries(btns.map(s => [s, r[s]])), mini: r['#minimap'].l, panel: r['.top-left'].r, gap }));
    // ⟂ names the mode and follows a tap; the Matrix close and mode toggles are 44 px tall on a coarse pointer.
    const before = await pg.textContent('#mode-name');
    await pg.tap('#mode-btn'); await pg.waitForTimeout(150);
    const after = await pg.textContent('#mode-name');
    await pg.evaluate(() => window.__lumen.input.pressed.add('matrix')); await pg.waitForTimeout(150);
    const sizes = await pg.evaluate(() => [...document.querySelectorAll('#matrix-close, .mode-toggle button')]
      .map(e => { const b = e.getBoundingClientRect(); return [e.id || e.dataset.mode, Math.round(b.width), Math.round(b.height)]; }));
    check('⟂ reads Focus, then Wide after a tap (S-17)', before === 'Focus' && after === 'Wide', `${before} → ${after}`);
    check('coarse pointer: Matrix ✕ and mode toggles ≥ 44 px (S-17)', sizes.length === 3 && sizes.every(([, w, h]) => h >= 44 && w >= 44), JSON.stringify(sizes));
    await ctx.close();
  }

  // ---- Portrait 320×568: the first touch hint wraps (≤ 2 lines, nothing cut); the column stays on the right.
  {
    const ctx = await phone({ width: 320, height: 568 }), pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push('touch portrait: ' + e.message));
    await pg.goto(url); await pg.waitForTimeout(300);
    await pg.evaluate(() => { try { localStorage.clear(); } catch {} });
    await pg.reload(); await pg.waitForTimeout(300);
    if (shots) await pg.screenshot({ path: `${shots}/title-320x568.png` });
    await pg.tap('#new-world'); await pg.waitForTimeout(300);
    await pg.evaluate(() => { const g = window.__lumen.game; g.research.scanner = true; g.research.wide = true; });
    await pg.waitForTimeout(200);
    if (shots) await pg.screenshot({ path: `${shots}/hud-320x568.png` });
    const h = await pg.evaluate(() => { const e = document.getElementById('hint'), r = e.getBoundingClientRect(), lh = parseFloat(getComputedStyle(e).lineHeight);
      return { text: e.textContent, sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight, l: Math.round(r.left), r: Math.round(r.right),
        lines: Math.round((e.clientHeight - 16) / lh) }; });
    check('320 px: first touch hint wraps to ≤ 2 lines, nothing cut (S-17)', /thumb/i.test(h.text) && h.sw <= h.cw && h.sh <= h.ch + 1
      && h.lines <= 2 && h.l >= 0 && h.r <= 320, JSON.stringify(h));
    const col = {};
    for (const s of ['#minimap', '#scan-btn', '#mode-btn', '#mute-btn', '#menu-btn']) col[s] = await rect(pg, s);
    const mb = await rect(pg, '#matrix-btn'), hb = await rect(pg, '#hint');
    check('320 px: a 2-line hint never sits under Core Matrix (S-17)', mb.b <= hb.t, JSON.stringify({ matrixBottom: mb.b, hintTop: hb.t }));
    check('portrait keeps the column: ◎ and ⟂ under ♪ ≡, all ≥ 44 px (S-17)', col['#scan-btn'].t >= col['#mute-btn'].b && col['#mode-btn'].t >= col['#scan-btn'].b
      && ['#scan-btn', '#mode-btn', '#mute-btn', '#menu-btn'].every(s => col[s].h >= 44 && col[s].w >= 44 && col[s].r <= 320), JSON.stringify(col));
    await ctx.close();
  }

  // ---- Second finger: two touches on the right half; lift the first, the second steers the aim from where it is.
  {
    const ctx = await phone({ width: 412, height: 839 }), pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push('touch fingers: ' + e.message));
    await pg.goto(url); await pg.waitForTimeout(300);
    await intoGame(pg);
    const cdp = await ctx.newCDPSession(pg);
    const A = { x: 300, y: 600, id: 1 }, B = { x: 340, y: 500, id: 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [A] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [A, B] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [A] }); // CDP: the listed point lifts (A); B stays down
    await pg.waitForTimeout(50);
    const mid = await pg.evaluate(() => { const s = window.__lumen.input.sticks.aim; return s && { ox: s.ox, oy: s.oy }; });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...B, y: B.y - 50 }] }); // B drags straight up
    await pg.waitForTimeout(50);
    const aim = await pg.evaluate(() => window.__lumen.input.read({ x: 0, y: 0 }));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    check('second finger: lift the first aim touch, the second one steers from its own spot (S-17)',
      !!mid && Math.round(mid.ox) === B.x && Math.round(mid.oy) === B.y && aim.aim && aim.aim.y < -0.99 && aim.fire, JSON.stringify({ mid, aim }));
    await ctx.close();
  }
}

module.exports = { browserChecks };
