// Player settings (S-3, D-016). One object under its own key, never in the world save.
import { DEFAULT_VOLUME } from './config.js';
import { defaultKeys, cleanKeys } from './keys.js';
import { GRAPHICS } from './quality.js';

const KEY = 'lumencore.settings.v1';
const LEGACY_MUTED = 'lumencore.muted'; // pre-S-3 mute pref, folded in on first run


function defaults() {
  let reduced = false;
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* no matchMedia */ }
  return { volume: DEFAULT_VOLUME, muted: false, shake: true, reducedMotion: reduced, largeText: false, graphics: 'auto', keys: defaultKeys() };
}

// Keep only known keys with the right types, so a damaged or hand-edited entry can't break the game.
function clean(s) {
  const d = defaults();
  if (!s || typeof s !== 'object') return d;
  const vol = Number(s.volume);
  return {
    volume: Number.isFinite(vol) ? Math.max(0, Math.min(100, Math.round(vol))) : d.volume,
    muted: typeof s.muted === 'boolean' ? s.muted : d.muted,
    shake: typeof s.shake === 'boolean' ? s.shake : d.shake,
    reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : d.reducedMotion,
    largeText: typeof s.largeText === 'boolean' ? s.largeText : d.largeText, // S-40: text ×1.2 (style.css --ts)
    graphics: GRAPHICS.includes(s.graphics) ? s.graphics : d.graphics, // S-41: Auto / High / Low
    keys: cleanKeys(s.keys), // S-39: action -> KeyboardEvent.code; a bad entry falls back to its default
  };
}

export function loadSettings() {
  let raw = null, legacy = null;
  try { raw = localStorage.getItem(KEY); legacy = localStorage.getItem(LEGACY_MUTED); } catch { /* storage unavailable */ }
  if (raw != null) { try { return clean(JSON.parse(raw)); } catch { return defaults(); } }
  const s = defaults();
  if (legacy === '1') s.muted = true;
  saveSettings(s);
  try { localStorage.removeItem(LEGACY_MUTED); } catch { /* ignore */ }
  return s;
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(clean(s))); } catch { /* storage unavailable */ }
}
