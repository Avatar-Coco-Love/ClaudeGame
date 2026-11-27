// S-73a (M17, D-194): the Pincer pair — two hunters that close from two sides. The lead walks the core's flow field like a
// Tracer (hunter.js moves both); the flank, every PINCER_SEARCH_S, runs a bounded A* (flow.js `aStar`) to the open cell
// nearest where the core will be in PINCER_AHEAD_S that is PINCER_APART cells clear of the lead's next PINCER_LEAD_CELLS
// field cells, costing PINCER_AVOID_COST more within PINCER_AVOID_R cells of them (so it goes round the lead), and follows that path (no target or over budget: the field, like the lead). One search a frame at most
// (`hunt.frame`), so pairs never stack searches. Spawn, faces, flee and loot live in hunter.js; this file chooses the
// flank's way and draws the pair. Seeded (`rng.pincer`); never saved.
import { CELL, RESOURCE, GLITCH_R, GLITCH_FADE_S, PINCER_SEARCH_S, PINCER_NODES, PINCER_AHEAD_S, PINCER_APART, PINCER_LEAD_CELLS, PINCER_LOOK, PINCER_AVOID_R, PINCER_AVOID_COST, PINCER_RGB } from './config.js';
import { fieldAt, downhill, aStar } from './flow.js';

/** The lead's next `n` field cells from (x, y), downhill (flat [x, y, …]; stops at the core's cell or a dead end). */
export function leadCells(f, x, y, n = PINCER_LEAD_CELLS) {
  const out = [];
  for (let i = 0; i < n; i++) { const s = downhill(f, x, y); if (!s) break; [x, y] = s; out.push(x, y); }
  if (!out.length && fieldAt(f, x, y) >= 0) out.push(x, y);
  return out;
}

/** Where the flank aims: the field cell nearest the core + its velocity × PINCER_AHEAD_S (≤ PINCER_LOOK cells around it)
 *  that is ≥ PINCER_APART cells from every cell in `avoid`. Ties go to the first in row order. null = none. */
export function flankTarget(game, f, avoid) {
  const p = game.player, px = (p.x + p.vx * PINCER_AHEAD_S) / CELL, py = (p.y + p.vy * PINCER_AHEAD_S) / CELL;
  const ox = Math.floor(px), oy = Math.floor(py), A2 = PINCER_APART * PINCER_APART;
  let best = null, bd = Infinity;
  for (let y = oy - PINCER_LOOK; y <= oy + PINCER_LOOK; y++) for (let x = ox - PINCER_LOOK; x <= ox + PINCER_LOOK; x++) {
    if (fieldAt(f, x, y) < 0) continue;
    const d = (x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2;
    if (d >= bd) continue;
    let clear = true;
    for (let i = 0; i < avoid.length && clear; i += 2) if ((x - avoid[i]) ** 2 + (y - avoid[i + 1]) ** 2 < A2) clear = false;
    if (clear) { bd = d; best = [x, y]; }
  }
  return best;
}

/** The flank's next waypoint cell from cell (cx, cy), searching again when due (one search a frame across all flanks).
 *  null = follow the field (no path yet, none found, over budget, or the path is done). */
export function flankStep(game, e, f, cx, cy, dt) {
  const h = game.hunt;
  e.searchT -= dt;
  if (e.searchT <= 0 && h.searchFrame !== h.frame) {
    h.searchFrame = h.frame; h.searches++; e.searchT = PINCER_SEARCH_S;
    const m = e.mate, lead = m && m.hp > 0 && m.fade === undefined ? leadCells(f, Math.floor(m.x / CELL), Math.floor(m.y / CELL)) : [];
    const t = flankTarget(game, f, lead), r = t ? aStar(f, cx, cy, t[0], t[1], PINCER_NODES, lead, PINCER_AVOID_R, PINCER_AVOID_COST) : null;
    if (r && r.capped) h.capped++;
    h.nodesMax = Math.max(h.nodesMax, r ? r.nodes : 0);
    e.path = r && r.path && r.path.length ? r.path : null; e.pi = 0; e.target = t;
  }
  const P = e.path;
  if (!P) return null;
  for (let i = e.pi; i < P.length; i += 2) if (P[i] === cx && P[i + 1] === cy) { e.pi = i + 2; break; } // passed it: next one
  if (e.pi >= P.length) { e.path = null; return null; }
  e.togo = (P.length - e.pi) / 2 + Math.max(0, fieldAt(f, P[P.length - 2], P[P.length - 1]));
  return [P[e.pi], P[e.pi + 1]];
}

// ---------- drawing (render.js via drawHunters) ----------
/** A pincer: a rose-violet dot (Glitch size, cached glow sprite, D-051), the flank with a hollow core so the two read
 *  apart; a dotted line joins the pair while both live. No limbs (D-002). */
function dotSprite(R, kind, white) {
  const r = GLITCH_R * 0.8;
  return R.glowSprite(`pc-${kind}-${white ? 1 : 0}`, r + 2 + 18 / (R.zoom * R.dpr), g => {
    g.shadowBlur = 14; g.lineWidth = 2.5;
    g.strokeStyle = g.fillStyle = g.shadowColor = white ? '#ffffff' : `rgb(${PINCER_RGB})`;
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = kind === 'lead' ? 0.85 : 0.25; g.fill();
  });
}

export function drawPincers(R, ctx, list) {
  ctx.save(); ctx.setLineDash([3, 6]); ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(${PINCER_RGB}, 0.45)`;
  for (const e of list) {
    const m = e.mate;
    if (e.hunter !== 'lead' || !m || e.fade !== undefined || m.fade !== undefined || !list.includes(m)) continue;
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(m.x, m.y); ctx.stroke();
  }
  ctx.restore();
  for (const e of list) {
    if (e.hunter !== 'lead' && e.hunter !== 'flank') continue;
    const fade = e.fade !== undefined ? Math.max(0, e.fade / GLITCH_FADE_S) : 1, sp = dotSprite(R, e.hunter, e.flash > 0);
    ctx.save(); ctx.globalAlpha = fade; ctx.drawImage(sp.canvas, e.x - sp.half, e.y - sp.half, sp.half * 2, sp.half * 2); ctx.restore();
    if (e.carry.length) { ctx.fillStyle = RESOURCE[e.carry[0]].color; ctx.beginPath(); ctx.arc(e.x, e.y + e.r * 1.5, 2.5, 0, Math.PI * 2); ctx.fill(); }
    if (e.hp < e.maxHp && fade === 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(e.x - 12, e.y - 20, 24, 3);
      ctx.fillStyle = `rgb(${PINCER_RGB})`; ctx.fillRect(e.x - 12, e.y - 20, 24 * Math.max(0, e.hp / e.maxHp), 3);
    }
  }
}
