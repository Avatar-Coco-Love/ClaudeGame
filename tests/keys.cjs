// S-39 keys checks (D-106). smoke.cjs calls nodeChecks + browserChecks. Keys are read by physical position
// (`e.code`), rebound in Settings (tap a row, press a key; a clash swaps; Esc cancels; Reset), saved in settings.keys.
// Usage: node tests/keys.cjs   (SHOTS=1 writes keys-view.png)
const { newWorld } = require('./pinworld.cjs');
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

async function nodeChecks(check) {
  const { defaultKeys, cleanKeys, bindKey, eventCode, keyLabel, moveLabel } = await import('../src/keys.js');
  const d = defaultKeys();
  const k = defaultKeys(); bindKey(k, 'scan', 'KeyG');
  const s = defaultKeys(); bindKey(s, 'scan', 'KeyE'); // E is the Core Matrix: the two swap
  const fixed = defaultKeys(), refused = !bindKey(fixed, 'mine', 'Escape') && !bindKey(fixed, 'up', 'ArrowUp') && fixed.mine === 'Space';
  check('S-39 bindKey: rebinds; a clash swaps (never two actions on one key); fixed keys refused',
    k.scan === 'KeyG' && s.scan === 'KeyE' && s.matrix === 'KeyF' && new Set(Object.values(s)).size === Object.keys(d).length && refused, JSON.stringify(s));
  const c = cleanKeys({ scan: 42, mine: 'Escape', up: 'KeyZ', left: 'KeyQ', bogus: 'KeyX', place: '<img>' });
  const clash = cleanKeys({ scan: 'KeyE' }); // would share E with the Core Matrix
  check('S-39 cleanKeys: bad entries fall back to defaults, good ones stay, unknown actions dropped, a clash resets',
    c.scan === 'KeyF' && c.mine === 'Space' && c.up === 'KeyZ' && c.left === 'KeyA' && c.beamMode === 'KeyQ' && c.place === 'KeyB'
      && !('bogus' in c) && JSON.stringify(cleanKeys('junk')) === JSON.stringify(d) && clash.scan === 'KeyF' && clash.matrix === 'KeyE',
    JSON.stringify({ c, clash }));
  check('S-39 eventCode prefers e.code; key-only events map to codes; labels',
    eventCode({ code: 'KeyW', key: 'z' }) === 'KeyW' && eventCode({ key: 'Enter' }) === 'Enter' && eventCode({ key: 'g' }) === 'KeyG'
      && eventCode({ key: ' ' }) === 'Space' && keyLabel('KeyG') === 'G' && keyLabel('ShiftLeft') === 'Shift' && moveLabel(d) === 'WASD');
  // Audit 79 (B-068): three texts still said "Press B" / "press Q" / "press F" after S-39. No player-facing string in src
  // may name a bindable key by letter; it goes through keys.K(action) so it follows the binding (and AZERTY).
  const hard = [];
  for (const f of fs.readdirSync(path.join(ROOT, 'src')).filter(f => f.endsWith('.js'))) fs.readFileSync(path.join(ROOT, 'src', f), 'utf8').split('\n')
    .forEach((l, i) => { if (/[Pp]ress (Space|[A-Z])\b(?![a-z])/.test(l.replace(/\/\/.*$/, ''))) hard.push(`${f}:${i + 1}`); });
  check('no player-facing text names a bindable key by letter; it uses keys.K (B-068)', hard.length === 0, hard.join(', '));
}

async function browserChecks(browser, url, check, errors, shots) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', e => errors.push(`keys: ${e.message}`));
  await page.goto(url); await page.waitForTimeout(200);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload(); await page.waitForTimeout(300);

  // Move by position: an AZERTY Z sends key 'z' with code KeyW and must move up; key 'w' on code KeyZ must not.
  await newWorld(page); await page.waitForTimeout(300);
  const hold = (key, code) => page.evaluate(async ([key, code]) => {
    const g = window.__lumen.game; g.demo = true; g.player.x = g.nexus.x; g.player.y = g.nexus.y; g.player.vx = g.player.vy = 0;
    const y0 = g.player.y;
    dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
    dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
    return Math.round(g.player.y - y0);
  }, [key, code]);
  const up = await hold('z', 'KeyW'), notUp = await hold('w', 'KeyZ');
  check('S-39 keys by position: code KeyW (AZERTY "z") moves up, key "w" on code KeyZ does not', up < -20 && notUp === 0, JSON.stringify({ up, notUp }));
  await page.evaluate(() => { document.getElementById('menu-btn').click(); });
  await page.waitForTimeout(200);

  // Rebind through the Settings sheet.
  if (!(await page.isVisible('#settings-btn'))) await page.evaluate(() => document.getElementById('settings-btn').click());
  else await page.click('#settings-btn');
  await page.waitForTimeout(100);
  await page.click('#keys-open'); await page.waitForTimeout(50);
  await page.click('[data-bind="scan"]'); await page.keyboard.press('g'); await page.waitForTimeout(50);
  const afterG = await page.evaluate(() => ({ ...window.__lumen.settings.keys }));
  const short = await page.evaluate(() => [...document.querySelectorAll('#keys-view button')].filter(e => e.getBoundingClientRect().height < 40).map(e => e.dataset.bind || e.id));
  check('S-39 Keys view: every control ≥ 40 px tall (S-3 rule)', short.length === 0, short.join(','));
  await page.click('[data-bind="scan"]'); await page.keyboard.press('Escape'); await page.waitForTimeout(50);
  const afterEsc = await page.evaluate(() => ({ k: window.__lumen.settings.keys.scan, open: !document.getElementById('settings').classList.contains('hidden'),
    label: document.querySelector('[data-bind="scan"]').textContent }));
  check('S-39 Settings: tap Scanner, press G → bound to KeyG; Esc cancels and leaves Settings open',
    afterG.scan === 'KeyG' && afterEsc.k === 'KeyG' && afterEsc.open && afterEsc.label === 'G', JSON.stringify({ scan: afterG.scan, ...afterEsc }));
  await page.click('[data-bind="matrix"]'); await page.keyboard.press('g'); await page.waitForTimeout(50);
  const sw = await page.evaluate(() => ({ ...window.__lumen.settings.keys }));
  check('S-39 Settings: binding a key another action holds swaps the two', sw.matrix === 'KeyG' && sw.scan === 'KeyE', JSON.stringify(sw));
  await page.click('#keys-reset'); await page.waitForTimeout(50);
  const reset = await page.evaluate(() => JSON.stringify(window.__lumen.settings.keys));
  check('S-39 Reset keys restores every default', reset === JSON.stringify({ up: 'KeyW', left: 'KeyA', down: 'KeyS', right: 'KeyD', mine: 'Space', matrix: 'KeyE', scan: 'KeyF', beamMode: 'KeyQ', place: 'KeyB', mute: 'KeyM', echoOrder: 'KeyR', call: 'KeyC', map: 'KeyN' }), reset); // S-43 added R, S-63 C, D-191 N
  await page.click('[data-bind="scan"]'); await page.keyboard.press('g'); await page.waitForTimeout(50);
  if (shots) await page.screenshot({ path: path.join(ROOT, 'keys-view.png') });
  await page.keyboard.press('Escape'); await page.waitForTimeout(100); // not capturing now: closes Settings
  const closed = await page.evaluate(() => document.getElementById('settings').classList.contains('hidden'));

  // Survives a reload; the game hears G, not F; the badge and title line name the bound key.
  await page.evaluate(() => { window.__lumen.game.demo = true; localStorage.removeItem('lumencore.save.v1'); }); // New World asks before replacing a save
  await page.reload(); await page.waitForTimeout(300);
  await newWorld(page); await page.waitForTimeout(300);
  const pre = await page.evaluate(() => { const g = window.__lumen.game; g.demo = true; g.research.scanner = true; g.scan.cooldown = 0; g.hitstop = 0;
    return { k: window.__lumen.settings.keys.scan, stored: JSON.parse(localStorage.getItem('lumencore.settings.v1')).keys.scan }; });
  await page.keyboard.press('f'); await page.waitForTimeout(150);
  const fCd = await page.evaluate(() => window.__lumen.game.scan.cooldown);
  await page.keyboard.press('g'); await page.waitForTimeout(150);
  const gCd = await page.evaluate(() => window.__lumen.game.scan.cooldown);
  const badge = await page.evaluate(() => ({ kbd: document.querySelector('#scan-btn kbd').textContent, title: document.getElementById('scan-btn').title }));
  check('S-39 rebound Scanner: saved, G pings and F does not after a reload; the badge shows G',
    closed && pre.k === 'KeyG' && pre.stored === 'KeyG' && fCd === 0 && gCd > 0 && badge.kbd === 'G' && /\(G\)/.test(badge.title),
    JSON.stringify({ closed, ...pre, fCd, gCd, ...badge }));

  // A damaged keys entry loads defaults for the damaged actions only.
  await page.evaluate(() => { window.__lumen.game.demo = true; localStorage.setItem('lumencore.settings.v1', JSON.stringify({ volume: 50, keys: { scan: 7, mine: 'Escape', up: 'KeyZ', matrix: null } })); });
  await page.reload(); await page.waitForTimeout(300);
  const dmg = await page.evaluate(() => ({ ...window.__lumen.settings.keys, line: document.querySelector('.controls [data-key="move"]').textContent }));
  check('S-39 a damaged keys entry: bad actions load their defaults, a good one stays, the title line follows',
    dmg.scan === 'KeyF' && dmg.mine === 'Space' && dmg.matrix === 'KeyE' && dmg.up === 'KeyZ' && /^[A-Z]ASD$/.test(dmg.line), JSON.stringify(dmg));
  await page.evaluate(() => { localStorage.clear(); });
  await page.close();
}

module.exports = { nodeChecks, browserChecks };

if (require.main === module) require('./serve.cjs').runStandalone({ nodeChecks, browserChecks, shot: process.env.SHOTS });
