// Boot, title screen, HUD, Core Matrix panel, save/load, main loop.
import { UPGRADES, NEXUS_UPGRADES, RESEARCH, RESEARCH_HINT, upgradeCost, matrixCost, KINDS, MODES, BEAM_MODES, RESOURCE, VERSION, BEACON_COST, BEACON_STOCK, BEACON_MAX, BEACON_LIGHT, RELAY_COST, RELAY_STOCK, RELAY_MAX, HEATSINK_COST, HEATSINK_STOCK, HEATSINK_MAX, WARD_COST, WARD_STOCK, WARD_MAX, DECOY_COST, DECOY_STOCK, DECOY_MAX, DECOY_R, DECOY_HOLD_S, WARD_R, SPIRE_WAKE_S, RIFT_CALL_COST, AURORA_BONUS, WEATHER_S, ANOMALY_KINDS } from './config.js';
import { weatherLeft } from './weather.js';
import { callBlock, callCooldown } from './rift.js';
import { orderLabel } from './echo.js';
import { burrowerRumble } from './burrower.js';
import { canResearch, buyResearch } from './research.js';
import { ECHO_ROWS, echoRowDef, echoLevelCost, canBuyEchoLevel, buyEchoLevel } from './echolevels.js';
import { unlockedModes } from './beam.js';
import { canCraft, craftBeacon, canCraftRelay, craftRelay, placeKind, placeRefusal, relayAt, PLACE_GLYPH } from './craft.js';
import { sinksOn, canCraftSink, craftSink, sinkAt } from './heatsink.js';
import { canCraftWard, craftWard, wardAt } from './ward.js';
import { canCraftDecoy, craftDecoy, decoyAt } from './decoy.js';
import { chartOn } from './chart.js';
import { feats, featProgress } from './feats.js';
import { spiresSeen, spiresLit, primedHere, spireHere } from './spire.js';
import { tickEnding, endingSummary, fmtTime } from './ending.js';
import { upgradeSave } from './save.js';
import { Game, cleanRecords } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { Audio } from './audio.js';
import { Music } from './music.js';
import { loadSettings, saveSettings } from './settings.js';
import { createDev } from './dev.js';
import { registerOffline } from './pwa.js';
import { setupKeys } from './keysui.js';
import { Quality, GRAPHICS } from './quality.js';
import { MapView } from './mapview.js';
import { layoutArc, ARC_ORDER } from './thumbarc.js';

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
const audio = new Audio(), music = new Music(audio); // S-44: the bed plays under audio.master
const input = new Input(canvas);
const renderer = new Renderer(canvas, $('minimap'));
const mapView = new MapView(renderer, $('mapview'), $('bigmap')); // D-191
let game = null;
let paused = true;
let panelOpen = false;
let saveTimer = 0;
let toastTimer = 0, bitToasted = false, moteToasted = false, tracerToasted = false; // S-53c / S-54: the bite and snatch toasts show once per session
let selectedMode = 'drift';
let lastHud = '', lastArc = ''; // lastArc: S-75 thumb-arc layout key. updateHud's change key (S-39: cleared when a key is rebound)

const quality = new Quality(); // S-41 (D-109): Settings → Graphics; Auto steps the renderer's level from frame time
quality.skip1 = (window.devicePixelRatio || 1) <= 1; // audit 79: L1 is L0 on such a screen
const settings = loadSettings(); // shared live object: Game reads shake/reducedMotion from it (S-3)
$('version').textContent = 'v' + VERSION;
applySettings();
const keys = setupKeys({ settings, saveSettings, input, changed() { lastHud = ''; } }); // S-39: rebinding redraws the hint

// ---------- title screen ----------
function showTitle() {
  paused = true; mapView.close();
  $('title').classList.remove('hidden');
  $('hud').classList.add('hidden');
  const save = store.read();
  $('continue').classList.toggle('hidden', !save);
  if (save) {
    $('continue').querySelector('small').textContent =
      `${MODES[save.mode]?.name ?? 'Drift'} · ${save.bank.shard}${RESOURCE.shard.glyph} ${save.bank.prism}${RESOURCE.prism.glyph}${['lumen', 'tide', 'calx'].map(k => save.bank[k] ? ` ${save.bank[k]}${RESOURCE[k].glyph}` : '').join('')} banked`;
  }
  selectMode(save?.mode || 'drift');
  // S-29: once a world has ended its New Cycle waits on the title too; from cycle 1 the title names the cycle and the best time.
  $('new-cycle').classList.toggle('hidden', !(save && save.ended));
  const cyc = save && Number.isInteger(save.cycle) ? save.cycle : 0, best = save && save.records && save.records.best;
  $('cycle-line').classList.toggle('hidden', cyc < 1);
  $('cycle-line').textContent = cyc >= 1 ? `Cycle ${cyc}${Number.isFinite(best) ? ` · best ${fmtTime(best)} to light every Spire` : ''}` : '';
}

function selectMode(mode) {
  selectedMode = mode;
  document.querySelectorAll('.mode-card').forEach(el => el.classList.toggle('selected', el.dataset.mode === mode));
}
document.querySelectorAll('.mode-card').forEach(el => el.addEventListener('click', () => selectMode(el.dataset.mode)));

function start(save, carry = null) {
  audio.unlock();
  const seed = save ? save.seed : (Math.random() * 2 ** 31) | 0;
  game = new Game({ seed, mode: save ? save.mode : carry ? carry.mode : selectedMode, save, audio, settings });
  music.setSeed(seed); // S-44: its own draws (seed + 'music'), never game.rng
  if (carry) { game.cycle = carry.cycle; game.records = carry.records; } // S-29: all that crosses into a new cycle (+ settings, apart)
  renderer.attach(game);
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('integrity-row').classList.toggle('hidden', game.mode !== 'surge');
  toastQ.length = 0; toastTimer = 0; $('toast').classList.remove('show'); // a world's toasts never carry into the next
  paused = false;
  persist();
}

$('continue').addEventListener('click', () => start(store.read()));
/** S-29 (D-062): confirm, then a fresh random world one cycle on. Carries cycle, records, mode; resets everything else. */
function newCycle(save) {
  const next = (Number.isInteger(save.cycle) ? save.cycle : 0) + 1;
  if (!confirm(`Begin cycle ${next}? A fresh world: bank, upgrades, Spires, Beacons and Relays start over. Your records and settings carry on.`)) return false;
  store.clear();
  start(null, { cycle: next, records: cleanRecords(save.records), mode: save.mode === 'surge' ? 'surge' : 'drift' });
  return true;
}
$('new-cycle').addEventListener('click', () => { const s = store.read(); if (s && s.ended) newCycle(s); });
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

// C3 (audit 49): one toast slot, but nothing is lost. A toast shows for at least TOAST_MIN unless the new one answers a key
// or tap (`now`); a milestone (`keep`) holds its whole time. Anything arriving meanwhile waits in a short queue.
// T2 (audit 54): a `now` answer shows at once even over a milestone, which goes back to the queue's front for its rest (≥ 1.5 s).
const TOAST_MIN = 0.8, toastQ = [], KEEP = 'keep', NOW = 'now';
let toastShown = 0, toastKeep = false;
function toast(msg, ms = 2600, tier = '') {
  const keep = tier === KEEP;
  if (!msg) return;
  const t = $('toast');
  if (toastTimer > 0 && t.textContent === msg) { toastTimer = Math.max(toastTimer, ms / 1000); return; }
  if (toastTimer > 0 && toastKeep && tier === NOW) {
    toastQ.unshift({ msg: t.textContent, ms: Math.max(1500, toastTimer * 1000), tier: KEEP });
    if (toastQ.length > 3) toastQ.pop();
  } else if (toastTimer > 0 && (toastKeep || (toastShown < TOAST_MIN && tier !== NOW))) {
    if (!toastQ.some(q => q.msg === msg) && toastQ.length < 3) toastQ.push({ msg, ms, tier });
    return;
  }
  t.textContent = msg; t.classList.add('show');
  toastTimer = ms / 1000; toastShown = 0; toastKeep = keep;
}
function tickToast(dt) {
  if (toastTimer <= 0) return;
  toastTimer -= dt; toastShown += dt;
  if (toastTimer > 0) return;
  const next = toastQ.shift();
  if (next) toast(next.msg, next.ms, next.tier); else $('toast').classList.remove('show');
}

function hint() {
  const g = game, touch = input.usingTouch;
  if (g.stats.mined === 0) return touch ? 'Left thumb: move · Right thumb: aim + mine' : `${keys.move()} to move · Aim with mouse · Hold click or ${keys.K('mine')} to mine`;
  if (g.cargoRoom() <= 0) return 'Cargo full — follow the arrow back to the Nexus';
  if (primedHere(g) && g.mode === 'surge') return g.wake && g.wake.s === spireHere(g) ? 'Circle the core: beam the Glitches before they reach it' // S-23; B-051: this Spire's Wake
    : g.wake ? 'Another Spire is waking — go back and guard it' : g.wakeBlock ? 'Step out and back in to wake the Spire again' : '';
  if (primedHere(g)) return 'Beam a facet: it flips with its two neighbours. Light all 8.'; // S-28 (D-080), both input kinds
  if (relayAt(g) && g.cargoTotal() === 0 && g.craft.relay < RELAY_STOCK) return touch ? `Tap ${PLACE_GLYPH.relay}↑ to pick up this Relay` : `${keys.K('place')}: pick up this Relay`; // S-34: the button shows ⊕↑ here
  if (sinkAt(g) && g.craft.sink < HEATSINK_STOCK) return touch ? `Tap ${PLACE_GLYPH.sink}↑ to pick up this Heat Sink` : `${keys.K('place')}: pick up this Heat Sink`; // S-51
  if (wardAt(g) && g.craft.ward < WARD_STOCK) return touch ? `Tap ${PLACE_GLYPH.ward}↑ to pick up this Ward` : `${keys.K('place')}: pick up this Ward`; // S-56
  if (decoyAt(g) && g.craft.decoy < DECOY_STOCK) return touch ? `Tap ${PLACE_GLYPH.decoy}↑ to pick up this Decoy` : `${keys.K('place')}: pick up this Decoy`; // S-77a
  if (g.inNexus()) return touch ? 'Tap Core Matrix to upgrade' : `Press ${keys.K('matrix')} for the Core Matrix`;
  if (g.stats.upgrades === 0 && g.bank.shard >= upgradeCost(0).shard) return touch ? 'Upgrade ready — back to the Nexus' : `Upgrade ready — press ${keys.K('matrix')} at the Nexus`; // B-010
  if (g.stats.upgrades === 0 && g.bank.shard + g.cargo.shard >= upgradeCost(0).shard) return 'Bring shards home to the Nexus to upgrade';
  if (g.heat > 0.3 && !g.heatState.taught) return 'Kiln rock heats your beam: let it cool'; // S-48a: until the first overheat ends
  if (g.anomaly.near) return 'Anomaly — fly into it; it lasts until you deposit'; // S-37: until the first take this session
  if (g.stats.mined < 12) return 'Cyan crystal veins drop Shards ◆';
  return '';
}

// S-75: re-lay the touch thumb arc only when what it depends on changes (touch, shown buttons, viewport, text size).
function placeArc() {
  const k = [input.usingTouch, innerWidth, innerHeight, settings.largeText, ...ARC_ORDER.map(id => $(id).classList.contains('hidden'))].join('|');
  if (k !== lastArc) { lastArc = k; layoutArc(document, input.usingTouch); }
}
addEventListener('resize', () => { if (lastArc) placeArc(); });
let nameTimer = 0; // S-75: on touch the beam mode's name shows 1 s above ⟂ on a switch
function flashModeName() { const b = $('mode-btn'); b.classList.add('named'); clearTimeout(nameTimer); nameTimer = setTimeout(() => b.classList.remove('named'), 1000); }
function updateHud() {
  const g = game;
  const cap = g.stat('cargo'), total = g.cargoTotal();
  const lumenSeen = seen(g, 'lumen'); // S-10: ● appears once you have held one
  const oreSeen = [seen(g, 'tide'), seen(g, 'calx')]; // S-49: ≈ / ⬟ the same way (never in a 160 world: none there)
  const scanReady = g.scan.cooldown <= 0;
  const key = [g.buffs.join(), g.bank.shard, g.bank.prism, g.bank.lumen, lumenSeen, g.bank.tide, g.bank.calx, oreSeen.join(), total, cap, Math.ceil(g.player.integrity), g.inNexus(), input.usingTouch, g.stats.mined > 0, g.stats.upgrades, panelOpen, !!g.research.scanner, scanReady, unlockedModes(g).length, g.beamMode, g.craft.beacon, g.craft.relay, g.craft.sink, g.craft.ward, g.craft.decoy, g.craft.last, !!sinkAt(g), !!wardAt(g), !!decoyAt(g), g.ringNow, primedHere(g), g.mode, !!g.wake, !!g.wakeBlock, !!relayAt(g), endingOpen, g.anomaly.near, !!g.research.echo, orderLabel(g), g.heat > 0.3 && !g.heatState.taught, g.nexusLevels.lens && callBlock(g)].join('|'); // S-28: the primed hint
  if (key !== lastHud) {
    lastHud = key;
    $('bank-shard').textContent = g.bank.shard;
    $('bank-prism').textContent = g.bank.prism;
    $('bank-lumen').textContent = g.bank.lumen;
    if (panelOpen) renderBank(); // B-025: a deposit streams for up to ~5 s while the sheet is open
    $('bank-lumen').parentElement.classList.toggle('hidden', !lumenSeen);
    ['tide', 'calx'].forEach((k, i) => { $('bank-' + k).textContent = g.bank[k]; $('bank-' + k).parentElement.classList.toggle('hidden', !oreSeen[i]); });
    document.documentElement.classList.toggle('ores', oreSeen[0] || oreSeen[1]); // B-089 (audit 104): phones wrap the bank 3 + 2 (style.css)
    $('cargo-text').textContent = `${total}/${cap}`;
    $('cargo-fill').style.width = `${Math.min(100, total / cap * 100)}%`;
    $('cargo-fill').classList.toggle('full', total >= cap);
    renderBuffs(g); // S-35
    const echo = !!g.research.echo, ol = orderLabel(g); // S-43: the order chip and ◇ show once the Echo is researched
    $('echo-chip').classList.toggle('hidden', !echo); $('echo-btn').classList.toggle('hidden', !echo);
    $('echo-name').textContent = ' ' + ol; $('echo-chip').title = `Echo order: ${ol} (${keys.K('echoOrder')} to switch)`;
    $('echo-btn').title = `Echo order: ${ol} (${keys.K('echoOrder')})`;
    const hull = g.stat('hull');
    $('integrity-fill').style.width = `${Math.max(0, g.player.integrity / hull * 100)}%`;
    $('integrity-text').textContent = `${Math.max(0, Math.ceil(g.player.integrity))}/${hull}`;
    $('matrix-btn').classList.toggle('hidden', !g.inNexus());
    $('scan-btn').classList.toggle('hidden', !g.research.scanner); // S-11: shown once unlocked, dim while cooling down
    $('scan-btn').classList.toggle('cooling', !scanReady);
    const lens = !!g.nexusLevels.lens, cb = lens ? callBlock(g) : 'lens'; // S-63: ❖ once the Lens is built, dim while it can't call
    $('call-btn').classList.toggle('hidden', !lens); $('call-btn').classList.toggle('cooling', !!cb);
    $('call-btn').title = `Call a rift: ${RIFT_CALL_COST} ▲ (${keys.K('call')})`;
    $('mode-btn').classList.toggle('hidden', unlockedModes(g).length < 2); // S-13: only once there is a second mode
    $('mode-btn').title = `Beam: ${BEAM_MODES[g.beamMode].name} (${keys.K('beamMode')} to switch)`;
    $('mode-name').textContent = BEAM_MODES[g.beamMode].name; // S-17: the button names the current mode
    $('mode-glyph').textContent = BEAM_MODES[g.beamMode].glyph || '⟂'; // S-55: Arc shows a zigzag
    const pk = placeKind(g), pn = PLACE_NAME[pk]; // S-16, S-22: shown while anything is carried: the item B / ✦ places, and its count
    const lift = relayAt(g) ? 'relay' : sinkAt(g) ? 'sink' : wardAt(g) ? 'ward' : decoyAt(g) ? 'decoy' : null; // S-34, S-51: on a Relay / Heat Sink the same button picks it up (touch players have no B key)
    $('beacon-btn').classList.toggle('hidden', g.craft.beacon + g.craft.relay + g.craft.sink + g.craft.ward + g.craft.decoy < 1 && !lift);
    $('place-glyph').textContent = PLACE_GLYPH[lift || pk];
    $('beacon-count').textContent = lift ? '↑' : g.craft[pk];
    const why = !lift && pk === 'sink' ? placeRefusal(g, 'sink') : null, off = why === 'kiln'; // S-51: greyed out off Kiln floor, with the reason
    $('beacon-btn').classList.toggle('off', off);
    const lbl = lift ? `Pick up this ${PLACE_NAME[lift]}` : off ? `${pn}: ${placeToast('sink', 'kiln')}` : `Place a ${pn}`;
    $('beacon-btn').title = `${lbl} (${keys.K('place')})`; $('beacon-btn').setAttribute('aria-label', lbl);
    document.body.classList.toggle('touch', input.usingTouch); // hides keyboard badges (S-2)
    placeArc();
    const h = hint();
    $('hint').textContent = h;
    $('hint').classList.toggle('hidden', !h || panelOpen || endingOpen); // never under the open Matrix (B-008)
  }
  for (const ev of g.events) {
    if (ev === 'cargo-full') toast('Cargo full — return to the Nexus');
    if (ev === 'deposited') { toast('Deposited'); persist(); if (panelOpen) renderPanel(); } // B-025: buy buttons follow the new bank
    if (ev === 'ring') toast(`Entering the ${g.ringName()}`, 2600, KEEP);
    if (ev === 'cache') toast('Vault cache opened', 2600, KEEP);
    if (ev === 'feat' && g.featNew) toast(`Feat: ${g.featNew.name} (${g.featNew.done} / ${g.featNew.total})`, 3200, KEEP); // S-66b
    if (ev === 'boss') { toast(`The ${g.bossDown} is down`, 3200, KEEP); persist(); } // S-60a
    if (ev === 'spire') { toast(`A dormant Spire (${g.spireCount}/${g.spires.length})`, 3200, KEEP); persist(); } // S-27
    if (ev === 'spire-primed') { if (!g.wake) toast('Spire primed', 3200, KEEP); persist(); } // S-20; B-052: a Wake's own toast says it
    if (ev === 'ending') { persist(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } // S-24; B-056
    if (ev === 'spire-relit') { toast(`Spire relit (${g.spireLitCount}/${g.spires.length})`, 3200, KEEP); persist(); } // S-20, D-069
    if (ev === 'wake-start') toast(`Spire waking — hold ${SPIRE_WAKE_S} s`, 3200, NOW); // S-23; audit 59: at once, one line on phones
    if (ev === 'wake-failed') { toast('Wake failed — step out and back in', 3800, KEEP); persist(); }
    if (ev === 'beam-mode') { toast(BEAM_MODES[g.beamMode].name, 1200, NOW); flashModeName(); }
    if (ev === 'echo-order') { toast(`Echo: ${orderLabel(g)}`, 1400, NOW); persist(); } // S-43
    if (ev === 'beacon') { toast(placeToast(g.placeKind, g.placeResult), 1400, NOW); if (g.placeResult === 'placed' || g.placeResult === 'picked') persist(); } // S-16, S-22, S-34
    if (ev === 'weather-start') toast(g.weather.kind === 'storm' ? `Static storm — more Glitches for ${weatherLeft(g) || WEATHER_S} s` : `Aurora — ore in your light yields +${AURORA_BONUS}`, 3200, KEEP); // S-33
    if (ev === 'rift-open') toast(g.rift.open && g.rift.open.called ? `Rift called — ${RIFT_CALL_COST} ▲` : 'A rift opened nearby', 3200, KEEP); // S-57a, S-63
    if (ev === 'rift-call') toast(CALL_REFUSAL[g.callResult] ? CALL_REFUSAL[g.callResult](g) : 'No rift can open here', 1800, NOW); // S-63: nothing was spent
    if (ev === 'weather-end') toast(g.weather.was === 'storm' ? 'The storm passes' : 'The aurora fades', 2600, KEEP);
    if (ev === 'anomaly') { const k = ANOMALY_KINDS[g.lastBuff]; toast(`${k.name} — ${k.text} until you deposit`, 3200, KEEP); persist(); } // S-35
    if (ev === 'buffs-end') { buffFlash(g.endedBuffs); persist(); }
    if (ev === 'burrow-bite') { // S-53c: the cargo bar flashes lilac; the first bite of a session also says why
      const bar = $('cargo-fill'); bar.classList.remove('bit'); void bar.offsetWidth; bar.classList.add('bit');
      if (!bitToasted) { bitToasted = true; toast('A Burrower bit your hold', 2600, KEEP); }
    }
    if (ev === 'mote-take') { // S-54: a mint flash; the first of a session says why
      const bar = $('cargo-fill'); bar.classList.remove('mote'); void bar.offsetWidth; bar.classList.add('mote');
      if (!moteToasted) { moteToasted = true; toast('A mote snatched from your hold', 2600, KEEP); }
    }
    if (ev === 'tracer-take') { // S-72: the mote's flash; the first of a session says why
      const bar = $('cargo-fill'); bar.classList.remove('mote'); void bar.offsetWidth; bar.classList.add('mote');
      if (!tracerToasted) { tracerToasted = true; toast('A Tracer snatched from your hold — beam it to win most of it back', 3000, KEEP); }
    }
    if (ev === 'destabilized') toast('Core destabilized — your cargo scattered where you fell', 3800, KEEP);
  }
  g.events.length = 0;
}

// S-35: one chip per active buff; at the deposit that ends them, the chips flash and fade (`.gone`, 0.6 s).
const chipHtml = (id, cls = '') => { const k = ANOMALY_KINDS[id]; return `<span class="chip${cls}" style="--c:${k.rgb}" title="${k.name} until you deposit"><span class="chip-glyph">${k.glyph}</span><span class="chip-name"> ${k.name}</span></span>`; };
function renderBuffs(g) { $('buffs').innerHTML = g.buffs.map(id => chipHtml(id)).join(''); }
function buffFlash(ids) {
  const el = $('buffs');
  // B-080 (audit 84): a buff taken on the deposit's last frame keeps its chip beside the fading ones, and the redraw after
  // the fade shows what is active now (it used to leave the fading chips' frame, or nothing, until the HUD key changed).
  el.innerHTML = (game ? game.buffs : []).map(id => chipHtml(id)).join('') + (ids || []).map(id => chipHtml(id, ' gone')).join('');
  setTimeout(() => { if (game) renderBuffs(game); }, 600);
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
function seen(g, k) { return g.stats[k] > 0 || g.bank[k] > 0; } // a later ore's chip shows once it was ever held (Lumen's rule, S-10)
const costHtml = c => KINDS.filter(k => c[k]).map(k => `<span class="${k}">${RESOURCE[k].glyph}${c[k]}</span>`).join(' ');
// S-16, S-22: placement outcomes, short so they read mid-run (D-060).
const PLACE_NAME = { beacon: 'Beacon', relay: 'Relay', sink: 'Heat Sink', ward: 'Ward', decoy: 'Decoy' };
const PLACE_MAX = { beacon: BEACON_MAX, relay: RELAY_MAX, sink: HEATSINK_MAX, ward: WARD_MAX, decoy: DECOY_MAX };
function placeToast(kind = 'beacon', why) {
  const n = PLACE_NAME[kind];
  return { placed: `${n} placed`, none: `No ${n}s — craft at the Nexus`, blocked: 'Blocked', nexus: 'Too near the Nexus',
    near: `Too near a ${n}`, vault: 'Too near a vault', spire: 'Too near a Spire', max: `${n} limit (${PLACE_MAX[kind]})`,
    kiln: 'Only on Kiln floor', // S-51
    picked: kind === 'relay' ? 'Relay picked up — place it further out' : `${n} picked up`,
    carrying: kind === 'relay' ? 'Already carrying a Relay' : `Already carrying ${{ ward: WARD_STOCK, decoy: DECOY_STOCK }[kind] || HEATSINK_STOCK} ${n}s` }[why] || ''; // S-34
}
// S-16, S-22: the Craft tab's rows. Stock, not levels: the value line says what is carried and placed.
function craftRow(id, desc, stock, cost, can, craftIt) {
  const g = game, row = document.createElement('div'), list = { beacon: g.beacons, relay: g.relays, sink: g.sinks, ward: g.wards, decoy: g.decoys }[id];
  row.className = 'upgrade'; row.dataset.id = id;
  row.innerHTML = `
    <div class="u-main"><div class="u-name">${PLACE_NAME[id]}</div><div class="u-desc">${desc} ${input.usingTouch ? `Tap ${PLACE_GLYPH[id]}` : `Press ${keys.K('place')}`} out in the caves</div>
      <div class="u-val">Carried <b>${g.craft[id]}/${stock}</b> · Placed ${list.length}/${PLACE_MAX[id]}</div></div>
    <button class="buy" ${can(g) ? '' : 'disabled'}>${costHtml(cost)}</button>`;
  row.querySelector('.buy').addEventListener('click', () => {
    if (!craftIt(g)) return;
    renderPanel(); persist();
    $('upgrade-list').querySelector(`[data-id="${id}"]`)?.classList.add('flash');
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
    if (r.id === 'wide') toast(input.usingTouch ? 'Wide Beam online — tap ⟂ to switch' : `Wide Beam online — press ${keys.K('beamMode')} to switch`, 3200);
    if (r.id === 'echo') toast(input.usingTouch ? 'Echo online (Auto) — tap ◇ for Mine / Defend / Auto' : `Echo online (Auto) — press ${keys.K('echoOrder')} for Mine / Defend / Auto`, 3200); // S-43
    if (r.id === 'scanner') toast(input.usingTouch ? 'Scanner online — tap ◎ to ping' : `Scanner online — press ${keys.K('scan')} to ping`, 3200);
  });
  return row;
}
// S-63: why a Lens call was refused (nothing is spent)
const CALL_REFUSAL = { nexus: () => 'No rift can open inside the Nexus', open: () => 'A rift is already open', busy: () => 'The caves are too restless to call a rift',
  cooldown: g => `The Lens recharges — ${callCooldown(g)} s`, prisms: () => `A call needs ${RIFT_CALL_COST} ▲`, site: () => 'No rock here to open a rift in' };
function upgradeRow(u, lvl, cost, affordable, onBuy, top = u.max) {
  const maxed = lvl >= top;
  const row = document.createElement('div');
  row.className = 'upgrade';
  // S-50: Overdrive pips (hollow, a thin inner line) join the row only once its base max is reached
  const pips = Array.from({ length: lvl >= u.max ? top : u.max }, (_, i) => `<i class="${[i >= u.max ? 'od' : '', i < lvl ? 'on' : ''].join(' ').trim()}"></i>`).join('');
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
    ['lumen', 'tide', 'calx'].filter(k => seen(g, k)).map(k => `<span class="${k}">${RESOURCE[k].glyph} ${g.bank[k]}</span>`).join('');
}
// S-66a (D-216): text only, ✓ done else ·, all of this world's feats from the start.
function featsBlock(g) {
  const fs = feats(g), box = document.createElement('div'), esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  box.className = 'feats'; box.id = 'feats';
  box.innerHTML = `<h3>Feats ${fs.filter(f => f.done).length} / ${fs.length}</h3>` + fs.map(f =>
    `<div class="feat${f.done ? ' done' : ''}" data-feat="${f.id}"><span class="mark">${f.done ? '✓' : '·'}</span><span><b>${esc(f.name)}</b> ${featProgress(f)}<small>${esc(f.rule)}</small></span></div>`).join('');
  return box;
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
    list.appendChild(craftRow('beacon', `Placed light: brightens ${BEACON_LIGHT} px for good and marks the map.`, BEACON_STOCK, { prism: BEACON_COST }, canCraft, craftBeacon));
    list.appendChild(craftRow('relay', 'Banks your cargo where it stands, like the Nexus ring. No healing.', RELAY_STOCK, RELAY_COST, canCraftRelay, craftRelay));
    if (sinksOn(g)) list.appendChild(craftRow('sink', 'Kiln floor only: within 5 cells your beam heats 60 % slower.', HEATSINK_STOCK, HEATSINK_COST, canCraftSink, craftSink)); // S-51
    list.appendChild(craftRow('ward', `Guards: bolts the nearest creature within ${WARD_R} cells it can see.`, WARD_STOCK, WARD_COST, canCraftWard, craftWard)); // S-56
    list.appendChild(craftRow('decoy', `Lures: a hunter that sees it within ${DECOY_R} cells circles it ${DECOY_HOLD_S} s, then it is spent.`, DECOY_STOCK, DECOY_COST, canCraftDecoy, craftDecoy)); // S-77a
  } else if (panelTab === 'research') {
    for (const r of RESEARCH) {
      list.appendChild(researchRow(r));
      if (r.id === 'echo' && g.research.echo) for (const k of ECHO_ROWS) // S-70: Focus / Volley / Tether under the Echo row
        list.appendChild(upgradeRow(echoRowDef(k), g.echoLevels[k], { lumen: echoLevelCost(g, k) }, canBuyEchoLevel(g, k), () => buyEchoLevel(g, k)));
    }
    if (RESEARCH.every(r => g.research[r.id] || !canResearch(g, r.id)) && !RESEARCH.every(r => g.research[r.id])) {
      const tip = document.createElement('div');
      tip.className = 'research-hint'; tip.textContent = RESEARCH_HINT;
      list.appendChild(tip);
    }
  } else if (panelTab === 'nexus') {
    for (const u of NEXUS_UPGRADES) {
      if (u.kiln && !chartOn(g)) continue; // S-52: no Chart row in a 160 world
      const lvl = g.nexusLevels[u.id];
      list.appendChild(upgradeRow(u, lvl, lvl < u.max ? u.cost(lvl) : null, g.canAffordNexus(u.id), () => {
        const ok = g.buyNexus(u.id); // S-63: the Lens says how to call
        if (ok && u.id === 'lens') toast(`Lens built — ${input.usingTouch ? 'tap ❖' : 'press ' + keys.K('call')} to call a rift (${RIFT_CALL_COST} ▲)`, 3200);
        return ok; }));
    }
    list.appendChild(featsBlock(g)); // S-66a: Feats n / N below the rows
  } else {
    for (const u of UPGRADES) {
      if (u.id === 'hull' && g.mode !== 'surge' && g.upgrades.hull === 0) continue;
      const lvl = g.upgrades[u.id];
      const top = g.topLevel(u);
      list.appendChild(upgradeRow(u, lvl, lvl < top ? matrixCost(u, lvl) : null, g.canAfford(u.id), () => g.buy(u.id), top));
    }
  }
  document.querySelectorAll('#matrix .mode-toggle button').forEach(b => b.classList.toggle('selected', b.dataset.mode === g.mode));
  const spires = spiresSeen(g) ? ` · Spires ${spiresLit(g)}/${g.spires.length} lit` : ''; // S-27: once one is found
  $('stats').textContent = `Cells mined ${g.stats.mined} · Glitches cleared ${g.stats.glitches} · Time ${Math.floor(g.stats.time / 60)}m${spires}`; // minutes only: the line redraws with the sheet, not per second
  $('ending-open').classList.toggle('hidden', !g.ended); // S-24: the card stays reachable
}
$('matrix-btn').addEventListener('click', openPanel);
$('scan-btn').addEventListener('click', () => input.pressed.add('scan'));
$('mode-btn').addEventListener('click', () => input.pressed.add('beamMode'));
$('beacon-btn').addEventListener('click', () => input.pressed.add('place'));
$('echo-btn').addEventListener('click', () => input.pressed.add('echoOrder')); // S-43
$('call-btn').addEventListener('click', () => input.pressed.add('call')); // S-63
$('minimap').addEventListener('click', () => input.pressed.add('map')); // D-191: the minimap catches its taps (never the beam)
document.querySelectorAll('#matrix .tabs button').forEach(b => b.addEventListener('click', () => { panelTab = b.dataset.tab; renderPanel(); }));
$('matrix-close').addEventListener('click', closePanel);
document.querySelectorAll('#matrix .mode-toggle button').forEach(b => b.addEventListener('click', () => {
  game.setMode(b.dataset.mode);
  $('integrity-row').classList.toggle('hidden', game.mode !== 'surge');
  renderPanel(); persist();
  toast(`${MODES[game.mode].name} mode — ${MODES[game.mode].blurb}`, 3200, NOW);
}));
$('menu-btn').addEventListener('click', () => { persist(); closePanel(); showTitle(); });

// ---------- Ending (S-24, D-090) ----------
let endingOpen = false, endSkip = false;
function openEnding() {
  const e = endingSummary(game), row = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
  $('ending-stats').innerHTML = row('Time to light them all', e.time) + row('Cells mined', e.mined) +
    row('Spires relit in Drift', e.drift) + row('Spires relit in Surge', e.surge) + (e.restored ? row('Spires restored', e.restored) : '') +
    row('Glitches cleared', e.glitches) + (e.bosses !== null ? row('Bosses', `${e.bosses} / ${e.bossN}`) : '') + row('Feats', `${e.feats} / ${e.featN}`) + (e.cycle >= 1 && Number.isFinite(e.best) ? row(`Best of ${e.cycle + 1} cycles`, fmtTime(e.best)) : '');
  closePanel(); endingOpen = true; $('hint').classList.add('hidden'); $('ending').classList.remove('hidden'); $('ending-continue').focus(); // B-054: no hint under the card (B-008)
}
function closeEnding() { endingOpen = false; $('ending').classList.add('hidden'); input.pressed.clear(); }
$('ending-continue').addEventListener('click', closeEnding);
$('ending-cycle').addEventListener('click', () => { persist(); const s = game.toSave(); if (newCycle(s)) { closeEnding(); toast(`Cycle ${game.cycle}`, 3200, KEEP); } });
$('ending-open').addEventListener('click', openEnding);
// Any key or tap skips the sequence (and does nothing else: the press is swallowed).
for (const ev of ['keydown', 'pointerdown']) addEventListener(ev, e => {
  if (game && game.endSeq && !paused) { endSkip = true; if (ev === 'keydown') e.preventDefault(); } // B-056: no focused button fires
  else if (ev === 'keydown' && endingOpen && e.repeat) e.preventDefault(); // B-055: a held skip key doesn't click Continue
}, true);

// ---------- Settings (S-3) ----------
function applySettings() {
  audio.setVolume(settings.volume / 100);
  audio.setMuted(settings.muted);
  music.setLevel(settings.music / 100); // S-44
  if (settings.reducedMotion || !settings.shake) { if (game) game.shake = 0; }
  document.body.classList.toggle('reduce-motion', settings.reducedMotion);
  document.documentElement.classList.toggle('text-large', settings.largeText); // S-40: --ts 1.2 in style.css
  if (lastArc) placeArc(); // S-75: Large text moves ⊕
  quality.setMode(settings.graphics); renderer.setQuality(quality.level); // S-41
  $('set-graphics').textContent = { auto: 'Auto', high: 'High', low: 'Low' }[settings.graphics];
  $('mute-btn').textContent = settings.muted ? '♪̸' : '♪';
  $('set-volume').value = settings.volume;
  $('set-volume-val').textContent = settings.volume;
  $('set-music').value = settings.music; $('set-music-val').textContent = settings.music;
  for (const k of ['muted', 'shake', 'reducedMotion', 'largeText']) {
    const b = document.querySelector(`#settings [data-setting="${k}"]`);
    b.setAttribute('aria-checked', settings[k]); b.textContent = settings[k] ? 'On' : 'Off';
  }
}
function setSetting(k, v) { settings[k] = v; saveSettings(settings); applySettings(); }
let settingsOpen = false;
function openSettings() { settingsOpen = true; applySettings(); keys.opened(); $('settings').classList.remove('hidden'); $('settings-close').focus(); }
function closeSettings() { settingsOpen = false; keys.closed(); $('settings').classList.add('hidden'); $('settings-btn').focus(); }
$('settings-btn').addEventListener('click', openSettings);
$('settings-close').addEventListener('click', closeSettings);
$('settings').addEventListener('click', e => { if (e.target.id === 'settings') closeSettings(); });
$('set-volume').addEventListener('input', e => { audio.unlock(); setSetting('volume', Number(e.target.value)); });
$('set-music').addEventListener('input', e => { audio.unlock(); setSetting('music', Number(e.target.value)); });
document.querySelectorAll('#settings [data-setting]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.setting === 'muted') audio.unlock();
  setSetting(b.dataset.setting, !settings[b.dataset.setting]);
}));
$('mute-btn').addEventListener('click', () => { audio.unlock(); setSetting('muted', !settings.muted); });
$('set-graphics').addEventListener('click', () => setSetting('graphics', GRAPHICS[(GRAPHICS.indexOf(settings.graphics) + 1) % GRAPHICS.length]));

// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const gap = now - last, dt = Math.min(0.05, gap / 1000);
  last = now;
  if (game) {
    document.body.classList.toggle('ending-seq', !!game.endSeq && !paused); // S-24: the HUD steps aside for the overview
    if (game.endSeq && !paused) { // S-24: keys and taps during the sequence only skip it
      if (tickEnding(game, dt, endSkip)) openEnding();
      if (game.endSeq || endSkip) input.pressed.clear();
      endSkip = false;
    }
    if (input.consume('mute')) $('mute-btn').click();
    if (input.consume('map')) { if (mapView.open) mapView.close(); else if (!paused && !panelOpen && !endingOpen && !game.endSeq) mapView.show(); } // D-191
    if (input.consume('matrix')) { mapView.close(); panelOpen ? closePanel() : openPanel(); }
    if (input.consume('escape')) { if (mapView.open) mapView.close(); else if (settingsOpen) closeSettings(); else if (endingOpen) closeEnding(); else if (panelOpen) closePanel(); }
    if (panelOpen && !game.inNexus()) closePanel();
    const sp = renderer.worldToScreen(game.player.x, game.player.y);
    // S-11/S-13: F or Q pressed while paused or under the Matrix is dropped, never queued; during a hitstop it waits (B-024).
    const take = k => (paused || panelOpen || game.hitstop <= 0) && input.consume(k);
    const scan = take('scan'), beamMode = take('beamMode'), place = take('place'), echoOrder = take('echoOrder'), call = take('call'); // S-16: B / ✦ (and S-43 R / ◇) follow the same rule
    const intent = (paused || panelOpen) ? { move: { x: 0, y: 0 }, aim: null, fire: false, cancel: true } : { ...input.read(sp), scan, beamMode, place, echoOrder, call };
    if (!paused && !game.endSeq && !endingOpen && !mapView.open) { // S-24: the world holds still under the sequence and the card (D-191: and the map)
      if (game.hitstop > 0) game.hitstop -= dt; // S-4: a yield-cell break (or a cache, D-048) freezes the sim for a few frames
      else renderer.revealed(game.update(dt, intent));
      updateHud();
      saveTimer += dt;
      if (saveTimer > 10) { saveTimer = 0; persist(); }
    } else {
      quality.reset(); // S-41: paused frames never count
      audio.beam(false); game.beam.charge = 0; // S-14: pausing drops a Pulse charge unfired
    }
    renderer.draw(dt, input);
    mapView.draw(); // D-191
    // S-41 (D-109): the real (unclamped) gap between played frames, which includes the browser's canvas raster
    if (!paused && !game.endSeq && !endingOpen && !mapView.open && quality.sample(gap)) renderer.setQuality(quality.level);
  }
  // S-44: the music bed follows the world (silent on the title and under the Ending sequence / card).
  music.update(dt, game && !game.demo && !paused ? { ring: game.ringNow, mode: game.mode, wake: !!game.wake, ending: endingOpen || !!game.endSeq, rumble: burrowerRumble(game) } : null);
  tickToast(dt);
  requestAnimationFrame(frame);
}

addEventListener('visibilitychange', () => { quality.reset(); if (document.hidden) { persist(); audio.beam(false); } });
addEventListener('pagehide', persist);

// Render a live world behind the title screen so it isn't a blank page.
game = new Game({ seed: 1337, mode: 'drift', save: null, settings, audio: new Proxy({}, { get: () => () => {} }) }); // silent
game.demo = true; // background world for the title screen — never saved
renderer.attach(game);
showTitle();
requestAnimationFrame(frame);
requestAnimationFrame(() => requestAnimationFrame(registerOffline)); // S-38: after the first frame is drawn

const dev = createDev({ game: () => game, persist, modeChanged() {
  $('integrity-row').classList.toggle('hidden', game.mode !== 'surge');
  if (panelOpen) renderPanel();
} });
window.__lumen = { get game() { return game; }, renderer, input, settings, audio, music, dev, quality, mapView }; // debug handle for tests + bots
