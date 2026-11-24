// S-39 (D-106): key bindings by physical position (`KeyboardEvent.code`), remappable in Settings.
// A binding is action -> code. Arrows (second move keys), Escape and Enter are fixed and can't be bound.

export const KEY_ACTIONS = [
  ['up', 'Move up', 'KeyW'], ['left', 'Move left', 'KeyA'], ['down', 'Move down', 'KeyS'], ['right', 'Move right', 'KeyD'],
  ['mine', 'Mine', 'Space'], ['matrix', 'Core Matrix', 'KeyE'], ['scan', 'Scanner ping', 'KeyF'],
  ['beamMode', 'Beam mode', 'KeyQ'], ['place', 'Place / pick up', 'KeyB'], ['mute', 'Mute', 'KeyM'],
];
export const FIXED_CODES = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Enter', 'NumpadEnter', 'Tab']; // Tab keeps moving focus
const CODE_RE = /^[A-Za-z][A-Za-z0-9]{1,23}$/;

export function defaultKeys() { return Object.fromEntries(KEY_ACTIONS.map(([a, , c]) => [a, c])); }

/** Keep only known actions bound to a usable code; a missing, bad or clashing entry falls back to its default. */
export function cleanKeys(k) {
  const d = defaultKeys(), out = { ...d };
  if (!k || typeof k !== 'object') return out;
  for (const a of Object.keys(d)) {
    const c = k[a];
    if (typeof c === 'string' && CODE_RE.test(c) && !FIXED_CODES.includes(c)) out[a] = c;
  }
  // Never two actions on one key: if cleaning left a clash, the clashing entries go back to their defaults.
  const codes = Object.values(out);
  if (new Set(codes).size === codes.length) return out;
  for (const a of Object.keys(out)) if (codes.filter(c => c === out[a]).length > 1) out[a] = d[a];
  return new Set(Object.values(out)).size === codes.length ? out : d;
}

/** Bind `code` to `action` in place; an action already on that code takes this action's old code (a swap). */
export function bindKey(keys, action, code) {
  if (!(action in keys) || !CODE_RE.test(code) || FIXED_CODES.includes(code)) return false;
  const other = Object.keys(keys).find(a => a !== action && keys[a] === code);
  if (other) keys[other] = keys[action];
  keys[action] = code;
  return true;
}

/** The code an event stands for. Synthetic events (tests, some IMEs) may carry only `key`. */
export function eventCode(e) {
  if (e.code) return e.code;
  const k = e.key || '';
  if (/^[a-z]$/i.test(k)) return 'Key' + k.toUpperCase();
  if (/^[0-9]$/.test(k)) return 'Digit' + k;
  if (k === ' ') return 'Space';
  return k;
}

let layout = null; // navigator.keyboard layout map, when the browser offers one
export async function loadLayout() {
  try { layout = await navigator.keyboard?.getLayoutMap?.() || null; } catch { layout = null; }
  return !!layout;
}

/** What the player's keyboard prints on the key at `code`. */
export function keyLabel(code) {
  const printed = layout && layout.get(code);
  if (printed && printed.trim()) return printed.toUpperCase();
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^Numpad\d$/.test(code)) return 'Num ' + code.slice(6);
  return code.replace(/(.)(Left|Right)$/, '$1'); // ShiftLeft -> Shift; Space, Tab, Semicolon stay as named
}

/** The four move keys as one label: "WASD" (or "ZQSD") when each is one character, else "W/A/S/D". */
export function moveLabel(keys) {
  const l = ['up', 'left', 'down', 'right'].map(a => keyLabel(keys[a]));
  return l.every(s => s.length === 1) ? l.join('') : l.join('/');
}
