// Shared by the probes (S-17): MODE env picks the beam mode; an unknown name exits 1 instead of silently running Focus stats.
import { BEAM_MODES } from '../src/config.js';

export function beamModeFromEnv() {
  const m = process.env.MODE || 'focus';
  if (!BEAM_MODES[m]) { console.error(`unknown MODE "${m}"; use one of: ${Object.keys(BEAM_MODES).join(', ')}`); process.exit(1); }
  return m;
}
