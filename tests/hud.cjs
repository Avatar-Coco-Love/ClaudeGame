// HUD layout checks (audit 49). smoke.cjs calls browserChecks.
// T1: the Nexus pointer sat on the 40 px inset edge whatever was there, so for 20–39% of headings (by viewport) it drew
//     under the minimap, the buttons or the bank panel, and hid the cargo-full "NEXUS" label. It now slides inward along its ray.
const { devices } = require('playwright');

const SIZES = [['568x320', 568, 320, true], ['320x568', 320, 568, true], ['412x839', 412, 839, true], ['863x360', 863, 360, true], ['1280x800', 1280, 800, false]];

async function browserChecks(browser, url, check, errors) {
  const bad = [], seen = [];
  for (const [name, w, h, touch] of SIZES) {
    const ctx = await browser.newContext(touch ? { ...devices['Pixel 7'], viewport: { width: w, height: h } } : { viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`hud ${name}: ${e.message}`));
    await page.goto(url); await page.waitForTimeout(200);
    await page.click('#new-world'); await page.waitForTimeout(300);
    const r = await page.evaluate(async () => {
      // Every optional HUD box shown, as late in a run; the Matrix button only shows at the Nexus, where there's no pointer.
      const g = window.__lumen.game; Object.assign(g.research, { scanner: true, wide: true, echo: true }); g.craft.beacon = 3; g.bank.lumen = 9;
      document.getElementById('matrix-btn').classList.add('hidden'); g.player.x += 3000;
      for (const id of ['scan-btn', 'mode-btn', 'echo-btn', 'call-btn', 'beacon-btn', 'integrity-row']) document.getElementById(id).classList.remove('hidden');
      document.querySelector('#hud .lumen').classList.remove('hidden');
      await new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f)));
      const boxes = [...document.querySelectorAll('#hud > *:not(#toast):not(.top-right), #hud .top-right > *:not(.pair), #hud .top-right .pair > *')] // S-43: ◎ and ◇ live in .pair
        .map(e => e.getBoundingClientRect()).filter(b => b.width > 0 && b.height > 0);
      const { drawNexusPointer } = await import('./src/hud.js');
      const c = document.createElement('canvas').getContext('2d'), W = innerWidth, H = innerHeight, out = { n: 0, hit: [] };
      for (let k = 0; k < 360; k += 2) {
        const a = k * Math.PI / 180, R = { w: W, h: H, time: 0, worldToScreen: (x, y) => ({ x, y }),
          game: { nexus: { x: W / 2 + Math.cos(a) * 4000, y: H / 2 + Math.sin(a) * 4000 }, cargoRoom: () => 0 } };
        drawNexusPointer(R, c); const p = R.pointer;
        const over = (x, y, hw, hh) => boxes.some(b => x + hw > b.left && x - hw < b.right && y + hh > b.top && y - hh < b.bottom);
        // The pointer still points at the Nexus, and stays on screen.
        const onRay = Math.abs(Math.atan2(Math.sin(p.a - a), Math.cos(p.a - a))) < 1e-6, inside = p.x > 0 && p.x < W && p.y > 0 && p.y < H;
        out.n++;
        if (over(p.x, p.y, 12, 12) || over(p.lx, p.ly, 22, 8) || !onRay || !inside) out.hit.push(k);
      }
      return { ...out, boxes: boxes.length };
    });
    seen.push(`${name}: ${r.hit.length}/${r.n} under (${r.boxes} boxes)`);
    if (r.hit.length || r.boxes < 7) bad.push(`${name} headings ${r.hit.join(',')}`);
    await ctx.close();
  }
  check('the Nexus pointer and its NEXUS label never sit under a HUD box, 180 headings × 5 viewports (T1)', bad.length === 0, [...seen, ...bad].join('; '));
}

// C3: one toast slot. Placing a beacon that reveals a Spire raised 'beacon' then 'spire' in one frame (the beacon toast was lost)
//     and a 'cargo-full' a frame later overwrote the 3.2 s Spire toast. T3: the toast was capped at half the screen by
//     left: 50%, so "A dormant Spire (1/5)" wrapped at 320 px.
async function toastChecks(browser, url, check, errors) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], viewport: { width: 320, height: 568 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`toast: ${e.message}`));
  await page.goto(url); await page.waitForTimeout(200);
  await page.click('#new-world'); await page.waitForTimeout(1200); // past the start toasts
  await page.evaluate(() => {
    const el = document.getElementById('toast'), t0 = performance.now(), log = window.__toastLog = [];
    const note = () => log.push({ text: el.classList.contains('show') ? el.textContent : '', t: performance.now() - t0,
      h: el.getBoundingClientRect().height, cx: el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2 });
    new MutationObserver(note).observe(el, { attributes: true, childList: true, characterData: true, subtree: true });
    const g = window.__lumen.game; g.placeResult = 'placed'; g.spireCount = 1; g.events.push('beacon', 'spire');
    requestAnimationFrame(() => requestAnimationFrame(() => g.events.push('cargo-full')));
  });
  await page.waitForTimeout(5200);
  const log = await page.evaluate(() => window.__toastLog);
  const order = log.map(e => e.text).filter((s, i, a) => s && s !== a[i - 1]);
  const sp = log.findIndex(e => /Spire/.test(e.text)), after = log.slice(sp + 1).find(e => e.text !== log[sp].text);
  const held = sp >= 0 && after ? after.t - log[sp].t : 0;
  check('beacon + Spire + cargo-full toasts all show, in order; the Spire toast holds its 3.2 s (C3)',
    order.join('|') === 'Beacon placed|A dormant Spire (1/5)|Cargo full — return to the Nexus' && held > 3000, `${order.join(' | ')}; Spire held ${Math.round(held)} ms`);
  const s = log[sp] || {};
  check('the Spire toast is one centred line at 320 px (T3)', s.h > 0 && s.h < 40 && Math.abs(s.cx - 160) < 2, JSON.stringify({ h: s.h, cx: s.cx }));
  await ctx.close();
}

module.exports = { browserChecks, toastChecks };
