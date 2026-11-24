// S-24 Ending (D-045, D-090): all Spires relit -> an ENDING_S sequence (the view pulls out over the whole world, each Spire
// draws a line to the Nexus in turn, the darkness eases DARK_ALPHA[0] -> [1]), skippable by any key or tap; reduced motion:
// an ENDING_FADE_S fade with no lines or pull-out. Then the summary card (main.js). `game.ended` is saved, so a reload
// skips the sequence and keeps the lifted dark; `game.endSeq` ({ t }) is not.
import { CELL, ENDING_S, ENDING_FADE_S, ENDING_LINE_SHARE, ENDING_MARGIN_CELLS, DARK_ALPHA, SPIRE_MARK_COLOR } from './config.js';


/** Called when a Spire relights: the last one ends the world (once). */
export function checkEnding(game) {
  if (game.ended || !game.spires.length || !game.spires.every(s => s.lit)) return;
  game.ended = true; game.endedAt = game.stats.time; game.endSeq = { t: 0 };
  recordCycle(game);
  game.notify('ending');
}

/** S-29 (D-062): this cycle's record, and the best time to light them all (records are clean: game.js cleanRecords). */
export function recordCycle(game) {
  const by = m => game.spires.filter(s => s.mode === m).length, r = game.records, t = Math.round(game.endedAt);
  r.cycles = { ...(r.cycles || {}), [game.cycle]: { time: t, drift: by('drift'), surge: by('surge') } };
  r.best = Number.isFinite(r.best) && r.best >= 0 ? Math.min(r.best, t) : t;
}

const reduced = game => !!(game.settings && game.settings.reducedMotion);
export const endingDur = game => (reduced(game) ? ENDING_FADE_S : ENDING_S);

/** Advance the sequence; true on the frame it finishes (or is skipped). */
export function tickEnding(game, dt, skip = false) {
  const q = game.endSeq;
  if (!q) return false;
  q.t = skip ? endingDur(game) : q.t + dt;
  if (q.t < endingDur(game)) return false;
  game.endSeq = null;
  return true;
}

/** The darkness's alpha: eased down during the sequence, held lifted after (D-045: the world stays lit). */
export function darkAlpha(game) {
  if (!game.ended) return DARK_ALPHA[0];
  if (!game.endSeq) return DARK_ALPHA[1];
  const f = Math.min(1, game.endSeq.t / endingDur(game)), e = f * f * (3 - 2 * f);
  return DARK_ALPHA[0] + (DARK_ALPHA[1] - DARK_ALPHA[0]) * e;
}

/** While the full sequence runs: a fixed overview (camera on the Nexus, zoom that fits every Spire). Else null. */
export function endingView(r) {
  const g = r.game;
  if (!g.endSeq || reduced(g)) return null;
  let R = 0;
  for (const s of g.spires) R = Math.max(R, Math.hypot((s.x + 0.5) * CELL - g.nexus.x, (s.y + 0.5) * CELL - g.nexus.y));
  return { x: g.nexus.x, y: g.nexus.y, zoom: Math.min(r.w, r.h) / (2 * (R + ENDING_MARGIN_CELLS * CELL)) };
}

/** The overview frame (replaces the world draw while the full sequence runs): the explored map (the minimap's pixels,
 *  scaled up: blitting 100 terrain chunks cost ~130 ms a frame in software), the darkness lifting over it, each relit
 *  Spire's light, the Nexus, and the lines. Screen space in, world transform inside. */
export function drawOverview(r, ctx, ov) {
  const g = r.game, w = g.world;
  ctx.setTransform(r.dpr, 0, 0, r.dpr, 0, 0);
  ctx.fillStyle = '#03040c'; ctx.fillRect(0, 0, r.w, r.h);
  ctx.save();
  ctx.translate(r.w / 2, r.h / 2); ctx.scale(ov.zoom, ov.zoom); ctx.translate(-ov.x, -ov.y);
  if (r.miniDirty) { r.miniCtx.putImageData(r.miniData, 0, 0); r.miniDirty = false; }
  ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.9;
  ctx.drawImage(r.mini, 0, 0, w.w * CELL, w.h * CELL);
  ctx.imageSmoothingEnabled = true; ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(2, 3, 10, ${darkAlpha(g)})`; ctx.fillRect(0, 0, w.w * CELL, w.h * CELL);
  ctx.globalCompositeOperation = 'lighter';
  for (const s of [...g.spireLights, { x: g.nexus.x, y: g.nexus.y, r: g.nexusLight() }]) {
    const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
    grd.addColorStop(0, 'rgba(214, 200, 255, 0.35)'); grd.addColorStop(1, 'rgba(214, 200, 255, 0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(g.nexus.x, g.nexus.y, 8 / ov.zoom, 0, Math.PI * 2); ctx.fill();
  drawEnding(ctx, r, ov.zoom);
  ctx.restore();
}

/** The lines, Spire -> Nexus, one after another (world transform, above the darkness). */
function drawEnding(ctx, r, zoom) {
  const g = r.game, q = g.endSeq;
  if (!q || reduced(g)) return;
  const n = g.spires.length, per = endingDur(g) * ENDING_LINE_SHARE / n, col = SPIRE_MARK_COLOR;
  ctx.save();
  ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.lineCap = 'round';
  ctx.lineWidth = 3 / zoom; // ~3 screen px at any zoom
  g.spires.forEach((s, i) => {
    const f = Math.max(0, Math.min(1, (q.t - i * per) / per));
    if (f <= 0) return;
    const sx = (s.x + 0.5) * CELL, sy = (s.y + 0.5) * CELL;
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (g.nexus.x - sx) * f, sy + (g.nexus.y - sy) * f); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy, 10 / zoom, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.restore();
}

/** '12m 05s'. */
export const fmtTime = t => `${Math.floor(t / 60)}m ${String(Math.floor(t % 60)).padStart(2, '0')}s`;

/** The summary card's numbers (all from saved state, so the card reads the same after a reload). */
export function endingSummary(game) {
  const by = m => game.spires.filter(s => s.lit && s.mode === m).length, t = game.endedAt ?? game.stats.time;
  return { time: fmtTime(t), cycle: game.cycle, best: game.records.best, mined: game.stats.mined,
    drift: by('drift'), surge: by('surge'), restored: by('broken'), glitches: game.stats.glitches, n: game.spires.length };
}
