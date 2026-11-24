// S-39 (D-106): the Settings "Keys" view and every on-screen key name (badges, titles, hints, the title's controls line).
import { KEY_ACTIONS, bindKey, defaultKeys, keyLabel, moveLabel, loadLayout } from './keys.js';

const $ = id => document.getElementById(id);

export function setupKeys({ settings, saveSettings, input, changed }) {
  input.bindings = settings.keys; // one live object: a rebind reaches the game at once
  const list = $('keys-list'), sheet = $('settings').querySelector('.sheet');
  const rows = KEY_ACTIONS.map(([action, name]) => {
    const row = document.createElement('div'); row.className = 'set-row key-row';
    const label = document.createElement('span'); label.textContent = name;
    const b = document.createElement('button'); b.dataset.bind = action;
    b.addEventListener('click', () => listen(action, b));
    row.append(label, b); list.append(row);
    return [action, name, b];
  });

  const K = a => keyLabel(settings.keys[a]);
  function refresh() {
    for (const [action, name, b] of rows) {
      b.textContent = K(action); b.classList.remove('listening'); b.setAttribute('aria-label', `${name}: ${K(action)}`);
    }
    document.querySelectorAll('[data-key]').forEach(el => { el.textContent = el.dataset.key === 'move' ? moveLabel(settings.keys) : K(el.dataset.key); });
    $('scan-btn').title = `Scanner ping (${K('scan')})`; $('mute-btn').title = `Mute (${K('mute')})`;
    changed();
  }
  // Tap a row, press a key: Esc (or any fixed key) cancels; a key another action holds swaps the two (keys.js).
  function listen(action, b) {
    refresh();
    b.textContent = 'Press a key…'; b.classList.add('listening');
    b.blur(); // a Space or Enter press must not click the row again
    input.capture = code => {
      if (code !== 'Escape' && bindKey(settings.keys, action, code)) saveSettings(settings);
      refresh(); b.focus();
    };
  }
  function show(keysView) {
    input.capture = null;
    sheet.classList.toggle('keys-view', keysView); $('keys-view').classList.toggle('hidden', !keysView);
    refresh();
    (keysView ? rows[0][2] : $('keys-open')).focus();
  }
  $('keys-open').addEventListener('click', () => show(true));
  $('keys-back').addEventListener('click', () => show(false));
  $('keys-reset').addEventListener('click', () => { input.capture = null; Object.assign(settings.keys, defaultKeys()); saveSettings(settings); refresh(); });

  loadLayout().then(ok => { if (ok) refresh(); }); // the printed key, when the browser can tell (Chromium)
  refresh();
  return {
    K, move: () => moveLabel(settings.keys),
    // Opening Settings starts on the main view; touch players don't see the Keys row (D-050: touch is unchanged).
    opened() { input.capture = null; sheet.classList.remove('keys-view'); $('keys-view').classList.add('hidden'); $('keys-row').classList.toggle('hidden', input.usingTouch); refresh(); },
    closed() { input.capture = null; refresh(); },
    inKeysView: () => sheet.classList.contains('keys-view'),
  };
}
