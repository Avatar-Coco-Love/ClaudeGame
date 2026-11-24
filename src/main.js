// Boot, title screen, HUD, Core Matrix panel, save/load, main loop.
import { UPGRADES, NEXUS_UPGRADES, RESEARCH, RESEARCH_HINT, upgradeCost, MODES, BEAM_MODES, RESOURCE, VERSION, BEACON_COST, BEACON_STOCK, BEACON_MAX, BEACON_LIGHT } from './config.js';
import { canResearch, buyResearch } from './research.js';
import { unlockedModes } from './beam.js';
import { canCraft, craftBeacon } from './craft.js';
import { spiresSeen, spiresLit } from './spire.js';
import { upgradeSave } from './save.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { loadSettings, saveSettings } from './settings.js';
import { createDev } from './dev.js';

const SAVE_KEY = 'lumencore.save.v1';
const $ = id => document.getElementById(id);

const store = {
  read() { try { const s = localStorage.getItem(SAVE_KEY); return s ? upgradeSave(JSON.parse(s)) : null; } catch { return null; } },
  write(data) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* storage unavailable */ } },
  // True when anything is stored, even a save this build can't read (newer format or corrupt): D-005 says never drop it unasked.
  exists() { try { return localStorage.getItem(SAVE_KEY) != null; } catch { return false; } },
  clear() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } },
};

const canvas = $('game');
const audio = new Audio();
const input = new Input(canvas);
const renderer = new Renderer(canvas, $('minimap'));
let game = null;
let paused = true;
let panelOpen = false;
let saveTimer = 0;
let toastTimer = 0;
let selectedMode = 'drift';

const settings = loadSettings(); // shared live object: Game reads shake/reducedMotion from it (S-3)
$('version').textContent = 'v' + VERSION;
applySettings();

// ---------- title screen ----------
function showTitle() {
  paused = true;
  $('title').classList.remove('hidden');
  $('hud').classList.add('hidden');
  const save = store.read();
  $('continue').classList.toggle('hidden', !save);
  if (save) {
    $('continue').querySelector('small').textContent =
      `${MODES[save.mode]?.name ?? 'Drift'} · ${save.bank.shard}${RESOURCE.shard.glyph} ${save.bank.prism}${RESOURCE.prism.glyph}${save.bank.lumen ? ` ${save.bank.lumen}${RESOURCE.lumen.glyph}` : ''} banked`;
  }
  selectMode(save?.mode || 'drift');
}

function selectMode(mode) {
  selectedMode = mode;
  document.querySelectorAll('.mode-card').forEach(el => el.classList.toggle('selected', el.dataset.mode === mode));
}
document.querySelectorAll('.mode-card').forEach(el => el.addEventListener('click', () => selectMode(el.dataset.mode)));

function start(save) {
  audio.unlock();
  const seed = save ? save.seed : (Math.random() * 2 ** 31) | 0;
  game = new Game({ seed, mode: save ? save.mode : selectedMode, save, audio, settings });
  renderer.attach(game);
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('integrity-row').classList.toggle('hidden', game.mode !== 'surge');
  paused = false;
  persist();
}

$('continue').addEventListener('click', () => start(store.read()));
$('new-world').addEventListener('click', () => {
  if (store.exists()) {
    const msg = store.read() ? 'Start a new world? Your current world and upgrades will be replaced.'
      : 'A save this version of the game cannot read (from a newer version, or damaged) is stored. Replace it with a new world?';
    if (!confirm(msg)) return;
  }
  store.clear();
  start(null);
});

// ---------- HUD ----------
function persist() { if (game && !game.demo) store.write(game.toSave()); }

function toast(msg, ms = 2600) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  toastTimer = ms / 1000;
}

function hint() {
  const g = game, touch = input.usingTouch;
  if (g.stats.mined === 0) return touch ? 'Left thumb: move · Right thumb: aim + mine' : 'WASD to move · Aim with mouse · Hold click or Space to mine';
  if (g.cargoRoom() <= 0) return 'Cargo full — follow the arrow back to the Nexus';
  if (g.inNexus()) return touch ? 'Tap Core Matrix to upgrade' : 'Press E for the Core Matrix';
  if (g.stats.upgrades === 0 && g.bank.shard >= upgradeCost(0).shard) return touch ? 'Upgrade ready — back to the Nexus' : 'Upgrade ready — press E at the Nexus'; // B-010
  if (g.stats.upgrades === 0 && g.bank.shard + g.cargo.shard >= upgradeCost(0).shard) return 'Bring shards home to the Nexus to upgrade';
  if (g.stats.mined < 12) return 'Cyan crystal veins drop Shards ◆';
  return '';
}

let lastHud = '';
function updateHud() {
  const g = game;
  const cap = g.stat('cargo'), total = g.cargoTotal();
  const lumenSeen = g.stats.lumen > 0 || g.bank.lumen > 0; // S-10: ● appears once you have held one
  const scanReady = g.scan.cooldown <= 0;
  const key = [g.bank.shard, g.bank.prism, g.bank.lumen, lumenSeen, total, cap, Math.ceil(g.player.integrity), g.inNexus(), input.usingTouch, g.stats.mined > 0, g.stats.upgrades, panelOpen, !!g.research.scanner, scanReady, unlockedModes(g).length, g.beamMode, g.craft.beacon].join('|');
  if (key !== lastHud) {
    lastHud = key;
    $('bank-shard').textContent = g.bank.shard;
    $('bank-prism').textContent = g.bank.prism;
    $('bank-lumen').textContent = g.bank.lumen;
    if (panelOpen) renderBank(); // B-025: a deposit streams for up to ~5 s while the sheet is open
    $('bank-lumen').parentElement.classList.toggle('hidden', !lumenSeen);
    $('cargo-text').textContent = `${total}/${cap}`;
    $('cargo-fill').style.width = `${Math.min(100, total / cap * 100)}%`;
    $('cargo-fill').classList.toggle('full', total >= cap);
    const hull = g.stat('hull');
    $('integrity-fill').style.width = `${Math.max(0, g.player.integrity / hull * 100)}%`;
    $('integrity-text').textContent = `${Math.max(0, Math.ceil(g.player.integrity))}/${hull}`;
    $('matrix-btn').classList.toggle('hidden', !g.inNexus());
    $('scan-btn').classList.toggle('hidden', !g.research.scanner); // S-11: shown once unlocked, dim while cooling down
    $('scan-btn').classList.toggle('cooling', !scanReady);
    $('mode-btn').classList.toggle('hidden', unlockedModes(g).length < 2); // S-13: only once there is a second mode
    $('mode-btn').title = `Beam: ${BEAM_MODES[g.beamMode].name} (Q to switch)`;
    $('mode-name').textContent = BEAM_MODES[g.beamMode].name; // S-17: the button names the current mode
    $('beacon-btn').classList.toggle('hidden', g.craft.beacon < 1); // S-16: shown while a Beacon is carried, with the count
    $('beacon-count').textContent = g.craft.beacon;
    document.body.classList.toggle('touch', input.usingTouch); // hides keyboard badges (S-2)
    const h = hint();
    $('hint').textContent = h;
    $('hint').classList.toggle('hidden', !h || panelOpen); // never under the open Matrix (B-008)
  }
  for (const ev of g.events) {
    if (ev === 'cargo-full') toast('Cargo full — return to the Nexus');
    if (ev === 'deposited') { toast('Deposited'); persist(); if (panelOpen) renderPanel(); } // B-025: buy buttons follow the new bank
    if (ev === 'ring') toast(`Entering the ${g.ringName()}`);
    if (ev === 'cache') toast('Vault cache opened');
    if (ev === 'spire') { toast(`A dormant Spire (${g.spireCount}/${g.spires.length})`, 3200); persist(); } // S-27
    if (ev === 'beam-mode') toast(BEAM_MODES[g.beamMode].name, 1200);
    if (ev === 'beacon') { toast(BEACON_TOAST[g.placeResult] || '', 1400); if (g.placeResult === 'placed') persist(); } // S-16
    if (ev === 'destabilized') toast('Core destabilized — your cargo scattered where you fell', 3800);
  }
  g.events.length = 0;
}

// ---------- Core Matrix panel ----------
function openPanel() {
  if (!game || paused || !game.inNexus()) return; // never over the title screen (B-003)
  panelOpen = true;
  renderPanel();
  $('matrix').classList.remove('hidden');
}
function closePanel() {
  panelOpen = false;
  $('matrix').classList.add('hidden');
  persist();
}
let panelTab = 'core'; // last Matrix tab, remembered for this page session (S-1)
const costHtml = c => ['shard', 'prism', 'lumen'].filter(k => c[k]).map(k => `<span class="${k}">${RESOURCE[k].glyph}${c[k]}</span>`).join(' ');
// S-16: placement outcomes, short so they read mid-run (Relays will reuse them, D-048).
const BEACON_TOAST = { placed: 'Beacon placed', none: 'No Beacons — craft at the Nexus', blocked: 'Blocked', nexus: 'Too near the Nexus',
  near: 'Too near a Beacon', max: `Beacon limit (${BEACON_MAX})` };
// S-16: the Craft tab's one row. Stock, not levels: the value line says what is carried and placed.
function craftRow() {
  const g = game, row = document.createElement('div');
  row.className = 'upgrade'; row.dataset.id = 'beacon';
  row.innerHTML = `
    <div class="u-main"><div class="u-name">Beacon</div><div class="u-desc">Placed light: brightens ${BEACON_LIGHT} px for good and marks the map. ${input.usingTouch ? 'Tap ✦' : 'Press B'} out in the caves</div>
      <div class="u-val">Carried <b>${g.craft.beacon}/${BEACON_STOCK}</b> · Placed ${g.beacons.length}/${BEACON_MAX}</div></div>
    <button class="buy" ${canCraft(g) ? '' : 'disabled'}>${costHtml({ prism: BEACON_COST })}</button>`;
  row.querySelector('.buy').addEventListener('click', () => {
    if (!craftBeacon(g)) return;
    renderPanel(); persist();
    $('upgrade-list').querySelector('[data-id="beacon"]')?.classList.add('flash');
  });
  return row;
}
// S-11: a Research node is a one-time unlock, so its row has no levels or pips.
function researchRow(r) {
  const g = game, owned = !!g.research[r.id];
  const row = document.createElement('div');
  row.className = 'upgrade'; row.dataset.id = r.id;
  row.innerHTML = `
    <div class="u-main"><div class="u-name">${r.name}</div><div class="u-desc">${r.desc}</div>
      <div class="u-val">${owned ? 'Unlocked' : 'One-time unlock'}</div></div>
    <button class="buy" ${canResearch(g, r.id) ? '' : 'disabled'}>${owned ? 'OWNED' : costHtml({ lumen: r.cost })}</button>`;
  row.querySelector('.buy').addEventListener('click', () => {
    if (!buyResearch(g, r.id)) return;
    renderPanel(); persist();
    $('upgrade-list').querySelector(`[data-id="${r.id}"]`)?.classList.add('flash');
    if (r.id === 'wide') toast(input.usingTouch ? 'Wide Beam online — tap ⟂ to switch' : 'Wide Beam online — press Q to switch', 3200);
    if (r.id === 'scanner') toast(input.usingTouch ? 'Scanner online — tap ◎ to ping' : 'Scanner online — press F to ping', 3200);
  });
  return row;
}
function upgradeRow(u, lvl, cost, affordable, onBuy) {
  const maxed = lvl >= u.max;
  const row = document.createElement('div');
  row.className = 'upgrade';
  const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
  const now = u.fmt(u.value(lvl)), next = maxed ? '' : ` → <b>${u.fmt(u.value(lvl + 1))}</b>`;
  row.innerHTML = `
    <div class="u-main"><div class="u-name">${u.name}</div><div class="u-desc">${u.desc}</div>
      <div class="u-val">${now}${next}</div><div class="pips">${pips}</div></div>
    <button class="buy" ${affordable ? '' : 'disabled'}>${maxed ? 'MAX' : costHtml(cost)}</button>`;
  row.dataset.id = u.id;
  row.querySelector('.buy').addEventListener('click', () => {
    if (!onBuy()) return;
    renderPanel(); persist();
    $('upgrade-list').querySelector(`[data-id="${u.id}"]`)?.classList.add('flash'); // S-4: the bought pip row brightens
  });
  return row;
}
// The sheet's bank line alone: cheap enough to redo on every deposit tick without rebuilding the rows under the pointer (B-025).
function renderBank() {
  const g = game;
  $('matrix-bank').innerHTML = `<span class="shard">${RESOURCE.shard.glyph} ${g.bank.shard}</span><span class="prism">${RESOURCE.prism.glyph} ${g.bank.prism}</span>` +
    (g.stats.lumen > 0 || g.bank.lumen > 0 ? `<span class="lumen">${RESOURCE.lumen.glyph} ${g.bank.lumen}</span>` : '');
}
function renderPanel() {
  const g = game;
  $('matrix-title').textContent = { nexus: 'Nexus', research: 'Research', craft: 'Craft' }[panelTab] || 'Core Matrix';
  document.querySelectorAll('#matrix .tabs button').forEach(b => {
    const on = b.dataset.tab === panelTab;
    b.classList.toggle('selected', on); b.setAttribute('aria-selected', on);
  });
  renderBank();
  const list = $('upgrade-list');
  list.innerHTML = '';
  if (panelTab === 'craft') {
    list.appendChild(craftRow());
  } else if (panelTab === 'research') {
    for (const r of RESEARCH) list.appendChild(researchRow(r));
    if (RESEARCH.every(r => g.research[r.id] || !canResearch(g, r.id)) && !RESEARCH.every(r => g.research[r.id])) {
      const tip = document.createElement('div');
      tip.className = 'research-hint'; tip.textContent = RESEARCH_HINT;
      list.appendChild(tip);
    }
  } else if (panelTab === 'nexus') {
    for (const u of NEXUS_UPGRADES) {
      const lvl = g.nexusLevels[u.id];
      list.appendChild(upgradeRow(u, lvl, lvl < u.max ? u.cost(lvl) : null, g.canAffordNexus(u.id), () => g.buyNexus(u.id)));
    }
  } else {
    for (const u of UPGRADES) {
      if (u.id === 'hull' && g.mode !== 'surge' && g.upgrades.hull === 0) continue;
      const lvl = g.upgrades[u.id];
      list.appendChild(upgradeRow(u, lvl, upgradeCost(lvl), g.canAfford(u.id), () => g.buy(u.id)));
    }
  }
  document.querySelectorAll('#matrix .mode-toggle button').forEach(b => b.classList.toggle('selected', b.dataset.mode === g.mode));
  const spires = spiresSeen(g) ? ` · Spires ${spiresLit(g)}/${g.spires.length} lit` : ''; // S-27: once one is found
  $('stats').textContent = `Cells mined ${g.stats.mined} · Glitches cleared ${g.stats.glitches} · Time ${Math.floor(g.stats.time / 60)}m${spires}`;
}
$('matrix-btn').addEventListener('click', openPanel);
$('scan-btn').addEventListener('click', () => input.pressed.add('scan'));
$('mode-btn').addEventListener('click', () => input.pressed.add('beamMode'));
$('beacon-btn').addEventListener('click', () => input.pressed.add('place'));
document.querySelectorAll('#matrix .tabs button').forEach(b => b.addEventListener('click', () => { panelTab = b.dataset.tab; renderPanel(); }));
$('matrix-close').addEventListener('click', closePanel);
document.querySelectorAll('#matrix .mode-toggle button').forEach(b => b.addEventListener('click', () => {
  game.setMode(b.dataset.mode);
  $('integrity-row').classList.toggle('hidden', game.mode !== 'surge');
  renderPanel(); persist();
  toast(`${MODES[game.mode].name} mode — ${MODES[game.mode].blurb}`, 3200);
}));
$('menu-btn').addEventListener('click', () => { persist(); closePanel(); showTitle(); });

// ---------- Settings (S-3) ----------
function applySettings() {
  audio.setVolume(settings.volume / 100);
  audio.setMuted(settings.muted);
  if (settings.reducedMotion || !settings.shake) { if (game) game.shake = 0; }
  document.body.classList.toggle('reduce-motion', settings.reducedMotion);
  $('mute-btn').textContent = settings.muted ? '♪̸' : '♪';
  $('set-volume').value = settings.volume;
  $('set-volume-val').textContent = settings.volume;
  for (const k of ['muted', 'shake', 'reducedMotion']) {
    const b = document.querySelector(`#settings [data-setting="${k}"]`);
    b.setAttribute('aria-checked', settings[k]); b.textContent = settings[k] ? 'On' : 'Off';
  }
}
function setSetting(k, v) { settings[k] = v; saveSettings(settings); applySettings(); }
let settingsOpen = false;
function openSettings() { settingsOpen = true; applySettings(); $('settings').classList.remove('hidden'); $('settings-close').focus(); }
function closeSettings() { settingsOpen = false; $('settings').classList.add('hidden'); $('settings-btn').focus(); }
$('settings-btn').addEventListener('click', openSettings);
$('settings-close').addEventListener('click', closeSettings);
$('settings').addEventListener('click', e => { if (e.target.id === 'settings') closeSettings(); });
$('set-volume').addEventListener('input', e => { audio.unlock(); setSetting('volume', Number(e.target.value)); });
document.querySelectorAll('#settings [data-setting]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.setting === 'muted') audio.unlock();
  setSetting(b.dataset.setting, !settings[b.dataset.setting]);
}));
$('mute-btn').addEventListener('click', () => { audio.unlock(); setSetting('muted', !settings.muted); });

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game) {
    if (input.consume('mute')) $('mute-btn').click();
    if (input.consume('matrix')) panelOpen ? closePanel() : openPanel();
    if (input.consume('escape')) { if (settingsOpen) closeSettings(); else if (panelOpen) closePanel(); }
    if (panelOpen && !game.inNexus()) closePanel();
    const sp = renderer.worldToScreen(game.player.x, game.player.y);
    // S-11/S-13: F or Q pressed while paused or under the Matrix is dropped, never queued; during a hitstop it waits (B-024).
    const take = k => (paused || panelOpen || game.hitstop <= 0) && input.consume(k);
    const scan = take('scan'), beamMode = take('beamMode'), place = take('place'); // S-16: B / ✦ follows the same rule
    const intent = (paused || panelOpen) ? { move: { x: 0, y: 0 }, aim: null, fire: false, cancel: true } : { ...input.read(sp), scan, beamMode, place };
    if (!paused) {
      if (game.hitstop > 0) game.hitstop -= dt; // S-4: a yield-cell break (or a cache, D-048) freezes the sim for a few frames
      else renderer.revealed(game.update(dt, intent));
      updateHud();
      saveTimer += dt;
      if (saveTimer > 10) { saveTimer = 0; persist(); }
    } else {
      audio.beam(false); game.beam.charge = 0; // S-14: pausing drops a Pulse charge unfired
    }
    renderer.draw(dt, input);
  }
  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('show'); }
  requestAnimationFrame(frame);
}

addEventListener('visibilitychange', () => { if (document.hidden) { persist(); audio.beam(false); } });
addEventListener('pagehide', persist);

// Render a live world behind the title screen so it isn't a blank page.
game = new Game({ seed: 1337, mode: 'drift', save: null, settings, audio: new Proxy({}, { get: () => () => {} }) }); // silent
game.demo = true; // background world for the title screen — never saved
renderer.attach(game);
showTitle();
requestAnimationFrame(frame);

const dev = createDev({ game: () => game, persist, modeChanged() {
  $('integrity-row').classList.toggle('hidden', game.mode !== 'surge');
  if (panelOpen) renderPanel();
} });
window.__lumen = { get game() { return game; }, renderer, input, settings, audio, dev }; // debug handle for tests + bots
