// S-66a (D-180, D-216): Feats, a short fixed list of world goals that pay nothing. Everything is derived from saved state
// (bosses' `down`, the map, `stats`, the Matrix levels), so a feat can't desync; only two counters are new:
// `stats.kinds` (bitmask of Anomaly kinds ever taken, anomaly.js) and `stats.rifts` (pockets emptied, rift.js closeRift).
// A 160 world lists 4: `lairs` needs bosses, `over` needs Overdrive (profile.overdrive). Same in Drift and Surge.
import { FEATS, FEAT_CHART, FEAT_RIFTS, UPGRADES, ANOMALY_KINDS, BORDER, T } from './config.js';

const KIND_IDS = Object.keys(ANOMALY_KINDS);
/** The bit an Anomaly kind sets in `stats.kinds`. */
export const kindBit = kind => 1 << KIND_IDS.indexOf(kind);
const bits = n => { let c = 0; for (let i = 0; i < KIND_IDS.length; i++) if (n & (1 << i)) c++; return c; };

/** Share of the cells inside the bedrock border that were ever explored (0–1). */
export function exploredShare(game) {
  const w = game.world;
  let n = 0, all = 0;
  for (let y = BORDER; y < w.h - BORDER; y++) for (let x = BORDER, i = y * w.w + BORDER; x < w.w - BORDER; x++, i++) { all++; n += w.explored[i]; }
  return all ? n / all : 0;
}

const RULES = {
  lairs: g => { const l = g.bosses?.list || []; return l.length ? { have: l.filter(B => B.down).length, need: l.length } : null; },
  vaults: g => { const v = g.world.vaults; return v.length ? { have: v.filter(s => g.world.get(s.x, s.y) !== T.CACHE).length, need: v.length } : null; },
  kinds: g => ({ have: bits(g.stats.kinds || 0), need: KIND_IDS.length }),
  chart: g => ({ have: exploredShare(g), need: FEAT_CHART, pct: true }),
  over: g => g.world.profile.overdrive ? { have: Math.max(0, ...UPGRADES.map(u => Math.min(g.upgrades[u.id], g.topLevel(u)) - u.max)), need: Math.max(...UPGRADES.map(u => u.over)) } : null,
  rifts: g => ({ have: g.stats.rifts || 0, need: FEAT_RIFTS }),
};

/** This world's feats, in FEATS order: [{ id, name, rule, done, have, need, pct? }]. Pure. */
export function feats(game) {
  const out = [];
  for (const f of FEATS) {
    const r = RULES[f.id](game);
    if (r) out.push({ ...f, ...r, done: r.have >= r.need });
  }
  return out;
}

/** The progress text of one feat: "21 % / 35 %", "2 / 5". */
export const featProgress = f => f.pct ? `${Math.floor(f.have * 100)} % / ${Math.round(f.need * 100)} %` : `${Math.min(f.have, f.need)} / ${f.need}`;
