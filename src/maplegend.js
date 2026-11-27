// S-76 map legend: beside the big map (D-191), the kinds of mark drawn on it this open, each as its own glyph in its
// colour + one word, in a fixed order. Only kinds present show (a full legend would list things not met yet). The kinds
// come from drawMinimap's `kinds` Map (kind → colours drawn), so there is no second scan of the world.
import { BEACON_RGB, RELAY_RGB, HEATSINK_RGB, WARD_RGB, DECOY_RGB, RIFT_RGB, UNDERTOW_RGB, VENT_RGB, SPIRE_MARK_COLOR, ANOMALY_KINDS, BOSS_RGB } from './config.js';

const rgb = s => `rgb(${s})`;
const poly = (m, x, y, r, n, a0) => { m.beginPath(); for (let k = 0; k < n; k++) { const t = a0 + k * Math.PI * 2 / n; m[k ? 'lineTo' : 'moveTo'](x + Math.cos(t) * r, y + Math.sin(t) * r); } m.closePath(); };
const disc = (m, x, y, r) => { m.beginPath(); m.arc(x, y, r, 0, Math.PI * 2); };
// Each draws one mark centred on (x, y) at the map's size (the glyph canvas scales it up); `c` = the colour to draw in.
const GLYPH = {
  nexus: (m, x, y) => { m.fillStyle = '#ffffff'; disc(m, x, y, 3); m.fill(); },
  ping: (m, x, y, c) => { m.fillStyle = c; m.fillRect(x - 2, y - 2, 4, 4); },
  current: (m, x, y) => { m.strokeStyle = rgb(UNDERTOW_RGB); m.lineWidth = 1.5; m.lineCap = m.lineJoin = 'round';
    m.beginPath(); m.moveTo(x - 4, y); m.lineTo(x + 4, y); m.moveTo(x + 1.5, y - 2.5); m.lineTo(x + 4, y); m.lineTo(x + 1.5, y + 2.5); m.stroke(); },
  vent: (m, x, y) => { m.fillStyle = rgb(VENT_RGB); m.fillRect(x - 1.75, y - 1.75, 3.5, 3.5); },
  beacon: (m, x, y) => { m.fillStyle = rgb(BEACON_RGB); disc(m, x, y, 2); m.fill(); },
  relay: (m, x, y) => { m.strokeStyle = rgb(RELAY_RGB); m.lineWidth = 1.5; disc(m, x, y, 3.5); m.stroke(); },
  sink: (m, x, y) => { m.fillStyle = rgb(HEATSINK_RGB); poly(m, x, y, 3, 5, -Math.PI / 2); m.fill(); },
  ward: (m, x, y) => { m.strokeStyle = m.fillStyle = rgb(WARD_RGB); m.lineWidth = 1; disc(m, x, y, 3); m.stroke(); m.fillRect(x - 0.75, y - 0.75, 1.5, 1.5); },
  decoy: (m, x, y) => { m.strokeStyle = rgb(DECOY_RGB); m.lineWidth = 1.25; m.beginPath(); m.moveTo(x, y - 3); m.lineTo(x + 3, y); m.lineTo(x, y + 3); m.lineTo(x - 3, y); m.closePath(); m.stroke(); },
  anomaly: (m, x, y, c) => { m.fillStyle = c; disc(m, x, y, 2.25); m.fill(); },
  rift: (m, x, y) => { m.fillStyle = rgb(RIFT_RGB); disc(m, x, y, 3); m.fill(); },
  lair: (m, x, y, c) => { m.strokeStyle = c; m.lineWidth = 1.25; poly(m, x, y, 4, 8, Math.PI / 8); m.stroke(); },
  spire: (m, x, y) => { m.strokeStyle = SPIRE_MARK_COLOR; m.lineWidth = 1.25; poly(m, x, y, 3.5, 6, Math.PI / 6); m.stroke(); },
};
/** The legend's kinds, in order, with their one word. */
export const LEGEND = [['nexus', 'Nexus'], ['ping', 'Ping'], ['current', 'Current'], ['vent', 'Vent'], ['beacon', 'Beacon'],
  ['relay', 'Relay'], ['sink', 'Heat Sink'], ['ward', 'Ward'], ['decoy', 'Decoy'], ['anomaly', 'Anomaly'], ['rift', 'Rift'], ['lair', 'Lair'], ['spire', 'Spire']];
const GLYPH_PX = 16, GLYPH_SCALE = 1.6, MAX_DOTS = 4, STEP = { lair: 15 }; // px between side-by-side colours (an octagon is wide)

/** Every kind with sample colours: what the legend shows in a world that has them all (tests). */
export function allKinds() {
  const k = new Map(LEGEND.map(([id]) => [id, new Set()]));
  ['#2ef2ff', '#ff4fd8', '#ffffff'].forEach(c => k.get('ping').add(c));
  Object.values(ANOMALY_KINDS).forEach(a => k.get('anomaly').add(rgb(a.rgb)));
  Object.values(BOSS_RGB).forEach(c => k.get('lair').add(rgb(c)));
  return k;
}

function glyph(id, cols) {
  const list = cols && cols.size ? [...cols].slice(0, MAX_DOTS) : [null], n = list.length, dpr = Math.min(2, devicePixelRatio || 1);
  const c = document.createElement('canvas'), step = STEP[id] || 10, w = GLYPH_PX + (n - 1) * step;
  c.width = Math.round(w * dpr); c.height = Math.round(GLYPH_PX * dpr);
  c.style.width = w + 'px'; c.style.height = GLYPH_PX + 'px';
  const m = c.getContext('2d');
  list.forEach((col, i) => { m.setTransform(dpr * GLYPH_SCALE, 0, 0, dpr * GLYPH_SCALE, (GLYPH_PX / 2 + i * step) * dpr, GLYPH_PX / 2 * dpr); GLYPH[id](m, 0, 0, col); });
  return c;
}

/** Fills `el` with one entry per kind present in `kinds`, in LEGEND order. */
export function fillLegend(el, kinds) {
  el.textContent = '';
  for (const [id, word] of LEGEND) {
    if (!kinds.has(id)) continue;
    const e = document.createElement('span');
    e.className = 'lg'; e.dataset.kind = id;
    e.append(glyph(id, kinds.get(id)), word);
    el.append(e);
  }
}
