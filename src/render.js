// All canvas drawing. Terrain is cached per chunk and only redrawn when mined.
import { CELL, CHUNK, T, MATERIAL, RINGS, NEXUS_RADIUS, LIGHT_RADIUS, GLITCH_FADE_S } from './config.js';

const CHUNK_PX = CHUNK * CELL;
const MAX_CACHED_CHUNKS = 48;
const MINI_COLORS = {
  [T.EMPTY]: [10, 16, 44], [T.ROCK]: [34, 51, 122], [T.DENSE]: [74, 47, 138],
  [T.CRYSTAL]: [46, 242, 255], [T.PRISM]: [255, 79, 216], [T.BEDROCK]: [16, 18, 30],
  [T.VAULT]: [235, 252, 255], [T.CACHE]: [255, 255, 255], // S-9: vault shells read white on the minimap
};
// S-8: the minimap tints ROCK/DENSE by ring, a dimmed mix of the ring's fill and edge so rings read at a glance.
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const MINI_RING = RINGS.map(r => ({
  [T.ROCK]: mix(rgb(r.rockFill), rgb(r.rockEdge), 0.22), [T.DENSE]: mix(rgb(r.denseFill), rgb(r.denseEdge), 0.3),
}));

export class Renderer {
  constructor(canvas, minimap) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.light = document.createElement('canvas');
    this.lctx = this.light.getContext('2d');
    this.chunks = new Map(); // key -> {canvas, used}
    this.minimap = minimap;
    this.mctx = minimap.getContext('2d');
    this.mini = document.createElement('canvas');
    this.cam = { x: 0, y: 0 };
    this.time = 0;
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = innerWidth; this.h = innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.light.width = Math.round(this.w / 2); this.light.height = Math.round(this.h / 2);
    this.zoom = Math.max(0.62, Math.min(1.25, Math.min(this.w, this.h) / 720));
  }

  attach(game) {
    this.game = game;
    this.chunks.clear();
    const w = game.world;
    this.mini.width = w.w; this.mini.height = w.h;
    this.miniCtx = this.mini.getContext('2d');
    this.miniData = this.miniCtx.createImageData(w.w, w.h);
    for (let i = 0; i < w.w * w.h; i++) if (w.explored[i]) this.setMini(i);
    this.miniCtx.putImageData(this.miniData, 0, 0);
    w.listeners = [(x, y) => { const i = w.idx(x, y); if (w.explored[i]) this.setMini(i); this.miniDirty = true; }];
    const p = game.player;
    this.cam.x = p.x; this.cam.y = p.y;
  }

  setMini(i) {
    const w = this.game.world, t = w.cells[i];
    const c = (t === T.ROCK || t === T.DENSE) ? MINI_RING[w.rings[i]][t] : MINI_COLORS[t];
    const d = this.miniData.data, o = i * 4;
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
  revealed(indices) {
    if (!indices.length) return;
    for (const i of indices) this.setMini(i);
    this.miniDirty = true;
  }

  worldToScreen(x, y) {
    const s = this.zoom;
    return { x: (x - this.cam.x) * s + this.w / 2, y: (y - this.cam.y) * s + this.h / 2 };
  }

  // ---------- chunk cache ----------
  getChunk(cx, cy) {
    const w = this.game.world;
    const key = cy * w.chunksW + cx;
    let ch = this.chunks.get(key);
    if (ch && w.dirtyChunks.has(key)) { this.paintChunk(ch.canvas, cx, cy); w.dirtyChunks.delete(key); }
    if (!ch) {
      if (this.chunks.size >= MAX_CACHED_CHUNKS) {
        let oldest = null;
        for (const [k, v] of this.chunks) if (!oldest || v.used < oldest[1].used) oldest = [k, v];
        this.chunks.delete(oldest[0]);
        ch = { canvas: oldest[1].canvas };
      } else {
        const c = document.createElement('canvas');
        c.width = c.height = CHUNK_PX;
        ch = { canvas: c };
      }
      this.paintChunk(ch.canvas, cx, cy);
      w.dirtyChunks.delete(key);
      this.chunks.set(key, ch);
    }
    ch.used = this.time;
    return ch.canvas;
  }

  paintChunk(c, cx, cy) {
    const g = c.getContext('2d'), w = this.game.world;
    g.clearRect(0, 0, CHUNK_PX, CHUNK_PX);
    const x0 = cx * CHUNK, y0 = cy * CHUNK;
    // Pass 1: fills + subtle bevel.
    for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
      const t = w.get(x0 + x, y0 + y);
      if (t === T.EMPTY) continue;
      const m = w.look(x0 + x, y0 + y, t);
      g.fillStyle = m.fill;
      g.fillRect(x * CELL, y * CELL, CELL, CELL);
      if (t !== T.BEDROCK) {
        g.strokeStyle = m.edge; g.globalAlpha = 0.09; g.lineWidth = 1;
        g.strokeRect(x * CELL + 4.5, y * CELL + 4.5, CELL - 9, CELL - 9);
        g.globalAlpha = 1;
      }
    }
    // Pass 2: ore gems (glowing).
    g.shadowBlur = 10;
    for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
      const t = w.get(x0 + x, y0 + y);
      if (t !== T.CRYSTAL && t !== T.PRISM && t !== T.CACHE) continue;
      const m = MATERIAL[t], px = x * CELL + CELL / 2, py = y * CELL + CELL / 2;
      if (t === T.CACHE) { // S-9: a square-in-square glyph, upright, so it never reads as ore
        g.shadowColor = m.edge; g.strokeStyle = m.edge; g.lineWidth = 2;
        g.strokeRect(px - 9, py - 9, 18, 18); g.fillStyle = m.edge; g.fillRect(px - 4, py - 4, 8, 8);
        continue;
      }
      const h = (((x0 + x) * 73856093) ^ ((y0 + y) * 19349663)) >>> 0;
      const rot = (h % 628) / 100, sz = 5 + (h % 4);
      g.shadowColor = m.edge; g.fillStyle = m.edge; g.strokeStyle = m.edge;
      g.save(); g.translate(px, py); g.rotate(rot);
      g.beginPath();
      if (t === T.CRYSTAL) { g.moveTo(0, -sz); g.lineTo(sz * 0.6, 0); g.lineTo(0, sz); g.lineTo(-sz * 0.6, 0); }
      else { g.moveTo(0, -sz); g.lineTo(sz * 0.87, sz * 0.5); g.lineTo(-sz * 0.87, sz * 0.5); }
      g.closePath();
      g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
      g.restore();
    }
    // Pass 3: neon edges wherever solid meets open space.
    g.lineWidth = 2; g.lineCap = 'round'; g.shadowBlur = 8;
    for (let y = 0; y < CHUNK; y++) for (let x = 0; x < CHUNK; x++) {
      const gx = x0 + x, gy = y0 + y, t = w.get(gx, gy);
      if (t === T.EMPTY) continue;
      const m = w.look(gx, gy, t);
      g.strokeStyle = m.edge; g.shadowColor = m.edge;
      const px = x * CELL, py = y * CELL;
      g.beginPath();
      if (!w.solid(gx, gy - 1)) { g.moveTo(px + 1, py + 1); g.lineTo(px + CELL - 1, py + 1); }
      if (!w.solid(gx, gy + 1)) { g.moveTo(px + 1, py + CELL - 1); g.lineTo(px + CELL - 1, py + CELL - 1); }
      if (!w.solid(gx - 1, gy)) { g.moveTo(px + 1, py + 1); g.lineTo(px + 1, py + CELL - 1); }
      if (!w.solid(gx + 1, gy)) { g.moveTo(px + CELL - 1, py + 1); g.lineTo(px + CELL - 1, py + CELL - 1); }
      g.stroke();
    }
    g.shadowBlur = 0;
  }

  // ---------- frame ----------
  draw(dt, input) {
    const game = this.game, ctx = this.ctx, p = game.player;
    this.time += dt;
    // Camera: follow with slight look-ahead in the aim direction.
    const lookX = Math.cos(p.angle) * 36, lookY = Math.sin(p.angle) * 36;
    const k = Math.min(1, dt * 6);
    this.cam.x += (p.x + lookX - this.cam.x) * k;
    this.cam.y += (p.y + lookY - this.cam.y) * k;
    const shx = (Math.random() - 0.5) * game.shake, shy = (Math.random() - 0.5) * game.shake;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#03040c';
    ctx.fillRect(0, 0, this.w, this.h);

    const s = this.zoom;
    ctx.save();
    ctx.translate(this.w / 2 + shx, this.h / 2 + shy);
    ctx.scale(s, s);
    ctx.translate(-this.cam.x, -this.cam.y);

    const vw = this.w / s, vh = this.h / s;
    const left = this.cam.x - vw / 2, top = this.cam.y - vh / 2;
    this.drawGrid(ctx, left, top, vw, vh);

    const w = game.world;
    const cx0 = Math.max(0, Math.floor(left / CHUNK_PX)), cy0 = Math.max(0, Math.floor(top / CHUNK_PX));
    const cx1 = Math.min(w.chunksW - 1, Math.floor((left + vw) / CHUNK_PX));
    const cy1 = Math.min(w.chunksH - 1, Math.floor((top + vh) / CHUNK_PX));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      ctx.drawImage(this.getChunk(cx, cy), cx * CHUNK_PX, cy * CHUNK_PX);
    }

    this.drawNexus(ctx);
    this.drawCrack(ctx);
    this.drawPickups(ctx);
    this.drawEnemies(ctx, false);
    this.drawBeam(ctx);
    this.drawPlayer(ctx);
    this.drawParticles(ctx);
    ctx.restore();

    this.drawLight(ctx);

    // Glitch "eyes" read through the dark so Surge is fair.
    ctx.save();
    ctx.translate(this.w / 2 + shx, this.h / 2 + shy); ctx.scale(s, s); ctx.translate(-this.cam.x, -this.cam.y);
    this.drawEnemies(ctx, true);
    ctx.restore();

    this.drawNexusPointer(ctx);
    this.drawSticks(ctx, input);
    this.drawMinimap();
  }

  drawGrid(ctx, left, top, vw, vh) {
    const step = CELL * 2;
    ctx.strokeStyle = 'rgba(70, 90, 200, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.floor(left / step) * step; x < left + vw; x += step) { ctx.moveTo(x, top); ctx.lineTo(x, top + vh); }
    for (let y = Math.floor(top / step) * step; y < top + vh; y += step) { ctx.moveTo(left, y); ctx.lineTo(left + vw, y); }
    ctx.stroke();
  }

  drawNexus(ctx) {
    const n = this.game.nexus, t = this.time;
    ctx.save();
    ctx.translate(n.x, n.y);
    // Deposit ring
    ctx.setLineDash([6, 10]); ctx.lineDashOffset = -t * 20;
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.22)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, NEXUS_RADIUS, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 1 + Math.sin(t * 2) * 0.05;
    const rings = [
      { r: 46, rot: t * 0.3, col: '#2ef2ff', a: 0.9, wdt: 2.5 },
      { r: 32, rot: -t * 0.5, col: '#8a5cff', a: 0.9, wdt: 2 },
      { r: 62, rot: t * 0.12, col: '#ff4fd8', a: 0.35, wdt: 1.5 },
    ];
    ctx.shadowBlur = 16;
    for (const rg of rings) {
      ctx.save(); ctx.rotate(rg.rot); ctx.globalAlpha = rg.a;
      ctx.strokeStyle = rg.col; ctx.shadowColor = rg.col; ctx.lineWidth = rg.wdt;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = i / 6 * Math.PI * 2, r = rg.r * pulse;
        i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke(); ctx.restore();
    }
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)'); grd.addColorStop(0.4, 'rgba(46,242,255,0.6)'); grd.addColorStop(1, 'rgba(46,242,255,0)');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
    if (this.game.nexusPulse > 0) { // Radiance bought: a white ring sweeps out to the new light edge
      const k = 1 - this.game.nexusPulse;
      ctx.globalAlpha = this.game.nexusPulse; ctx.strokeStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 30 + k * (this.game.nexusLight() - 30), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  drawCrack(ctx) {
    const b = this.game.beam;
    if (!b.target || b.target.frac <= 0) return;
    const { x, y, frac } = b.target;
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + frac * 0.6})`;
    ctx.lineWidth = 1.5;
    const px = x * CELL, py = y * CELL, m = CELL / 2;
    ctx.beginPath();
    const n = 1 + Math.floor(frac * 4);
    for (let i = 0; i < n; i++) {
      const a = i * 2.4 + x * 0.7;
      ctx.moveTo(px + m, py + m);
      ctx.lineTo(px + m + Math.cos(a) * m * frac, py + m + Math.sin(a) * m * frac);
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${frac * 0.18})`;
    ctx.fillRect(px, py, CELL, CELL);
    ctx.restore();
  }

  drawPickups(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const it of this.game.pickups) {
      const col = it.kind === 'shard' ? '#2ef2ff' : '#ff4fd8';
      const bob = Math.sin(this.time * 5 + it.x) * 0.3 + 1;
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
      ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(this.time * 2 + it.y); ctx.scale(bob, bob);
      ctx.beginPath();
      if (it.kind === 'shard') { ctx.moveTo(0, -5); ctx.lineTo(3, 0); ctx.lineTo(0, 5); ctx.lineTo(-3, 0); }
      else { ctx.moveTo(0, -5); ctx.lineTo(4.5, 3); ctx.lineTo(-4.5, 3); }
      ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }

  drawEnemies(ctx, eyesOnly) {
    const p = this.game.player;
    for (const e of this.game.enemies) {
      const fade = e.fade !== undefined ? Math.max(0, e.fade / GLITCH_FADE_S) : 1; // S-6 give-up: fade and shrink
      ctx.save();
      ctx.translate(e.x, e.y);
      if (eyesOnly) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        const a = Math.max(0, Math.min(0.9, (d - LIGHT_RADIUS * 0.6) / 200));
        if (a <= 0) { ctx.restore(); continue; }
        ctx.globalAlpha = fade * a * (0.6 + Math.sin(this.time * 6 + e.wander) * 0.3);
        ctx.fillStyle = '#ff5a2e'; ctx.shadowColor = '#ff5a2e'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(0, 0, 2.5 + e.tier * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore(); continue;
      }
      const col = e.flash > 0 ? '#ffffff' : ['#ff7a3d', '#ff4a4a', '#ff2e7a', '#ffd23d'][e.tier];
      ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14; ctx.lineWidth = 2;
      ctx.rotate(e.spin);
      if (fade < 1) { ctx.globalAlpha = fade; ctx.scale(0.4 + 0.6 * fade, 0.4 + 0.6 * fade); }
      const spikes = 3 + e.tier;
      ctx.beginPath();
      for (let i = 0; i <= spikes * 2; i++) {
        const a = i / (spikes * 2) * Math.PI * 2, r = i % 2 ? e.r * 0.45 : e.r * 1.15;
        i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
      ctx.fillStyle = col; ctx.globalAlpha = 0.25 * fade; ctx.fill();
      ctx.restore();
      if (e.hp < e.maxHp && fade === 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(e.x - 12, e.y - 20, 24, 3);
        ctx.fillStyle = '#ff7a3d'; ctx.fillRect(e.x - 12, e.y - 20, 24 * Math.max(0, e.hp / e.maxHp), 3);
      }
    }
  }

  drawBeam(ctx) {
    const b = this.game.beam, p = this.game.player;
    if (!b.on) return;
    const ox = p.x + Math.cos(p.angle) * 12, oy = p.y + Math.sin(p.angle) * 12;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const flick = 0.75 + Math.random() * 0.25;
    const col = b.enemy ? '255,122,61' : '46,242,255';
    ctx.strokeStyle = `rgba(${col},${0.25 * flick})`; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(b.ex, b.ey); ctx.stroke();
    ctx.strokeStyle = `rgba(${col},${0.7 * flick})`; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(b.ex, b.ey); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.9 * flick})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(b.ex, b.ey); ctx.stroke();
    const g = ctx.createRadialGradient(b.ex, b.ey, 0, b.ex, b.ey, 14);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.ex, b.ey, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawPlayer(ctx) {
    const p = this.game.player, g = this.game;
    if (p.invuln > 0 && Math.floor(this.time * 20) % 2 && p.hurtFlash <= 0 && g.mode === 'surge') return;
    ctx.save();
    ctx.translate(p.x, p.y);
    // Cargo ring: fills as you carry more.
    const frac = g.cargoTotal() / g.stat('cargo');
    if (frac > 0) {
      ctx.strokeStyle = frac >= 1 ? '#ffd23d' : 'rgba(46,242,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
    }
    if (g.coreRing > 0) { // S-4: Core Matrix purchase, a white ring expands off the core
      const k = 1 - g.coreRing;
      ctx.globalAlpha = g.coreRing; ctx.strokeStyle = '#ffffff'; ctx.shadowColor = '#2ef2ff'; ctx.shadowBlur = 14; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, 20 + k * 70, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
    ctx.rotate(p.angle);
    const col = p.hurtFlash > 0 ? '#ff5a2e' : '#d8fbff';
    ctx.shadowColor = p.hurtFlash > 0 ? '#ff5a2e' : '#2ef2ff'; ctx.shadowBlur = 18;
    ctx.strokeStyle = col; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-7, -8); ctx.lineTo(-3, 0); ctx.lineTo(-7, 8); ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = col; ctx.globalAlpha = 0.3; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(1, 0, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const q of this.game.particles) {
      const a = q.life / q.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = q.color;
      if (q.type === 'streak') {
        const t = 1 - a, e = t * t;
        const x = this.game.player.x + (q.tx - this.game.player.x) * e;
        const y = this.game.player.y + (q.ty - this.game.player.y) * e;
        ctx.beginPath(); ctx.arc(x, y, q.size, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
      }
    }
    ctx.restore();
  }

  drawLight(ctx) {
    const l = this.lctx, g = this.game, s = this.zoom / 2; // light canvas is half-res
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, this.light.width, this.light.height);
    l.fillStyle = 'rgba(2, 3, 10, 0.93)';
    l.fillRect(0, 0, this.light.width, this.light.height);
    l.globalCompositeOperation = 'destination-out';
    const hole = (wx, wy, r, strength = 1) => {
      const p = this.worldToScreen(wx, wy);
      const x = p.x / 2, y = p.y / 2, rr = r * s;
      const grd = l.createRadialGradient(x, y, 0, x, y, rr);
      grd.addColorStop(0, `rgba(0,0,0,${strength})`);
      grd.addColorStop(0.55, `rgba(0,0,0,${strength * 0.85})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      l.fillStyle = grd; l.beginPath(); l.arc(x, y, rr, 0, Math.PI * 2); l.fill();
    };
    hole(g.player.x, g.player.y, LIGHT_RADIUS);
    hole(g.nexus.x, g.nexus.y, g.nexusLight());
    if (g.beam.on) hole(g.beam.ex, g.beam.ey, 80, 0.7);
    ctx.drawImage(this.light, 0, 0, this.w, this.h);
  }

  drawNexusPointer(ctx) {
    const g = this.game, n = this.worldToScreen(g.nexus.x, g.nexus.y);
    const m = 40;
    if (n.x > m && n.x < this.w - m && n.y > m && n.y < this.h - m) return;
    const cx = this.w / 2, cy = this.h / 2;
    const a = Math.atan2(n.y - cy, n.x - cx);
    const rx = this.w / 2 - m, ry = this.h / 2 - m;
    const t = Math.min(rx / Math.abs(Math.cos(a) || 1e-6), ry / Math.abs(Math.sin(a) || 1e-6));
    const x = cx + Math.cos(a) * t, y = cy + Math.sin(a) * t;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(a);
    ctx.strokeStyle = '#2ef2ff'; ctx.shadowColor = '#2ef2ff'; ctx.shadowBlur = 10; ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + Math.sin(this.time * 4) * 0.25;
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.stroke();
    ctx.restore();
    const full = g.cargoRoom() <= 0;
    if (full) {
      ctx.save();
      ctx.fillStyle = '#ffd23d'; ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('NEXUS', x - Math.cos(a) * 22, y - Math.sin(a) * 22 + 4);
      ctx.restore();
    }
  }

  drawSticks(ctx, input) {
    if (!input.usingTouch) return;
    const R = 56;
    ctx.save();
    for (const [name, s] of Object.entries(input.sticks)) {
      if (!s) continue;
      const col = name === 'move' ? '46,242,255' : '255,79,216';
      ctx.strokeStyle = `rgba(${col},0.35)`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.ox, s.oy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(${col},0.35)`;
      ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  drawMinimap() {
    const m = this.mctx, g = this.game, w = g.world;
    if (this.miniDirty) { this.miniCtx.putImageData(this.miniData, 0, 0); this.miniDirty = false; }
    const size = this.minimap.width;
    m.clearRect(0, 0, size, size);
    m.fillStyle = 'rgba(3,4,12,0.85)'; m.fillRect(0, 0, size, size);
    m.imageSmoothingEnabled = false;
    m.drawImage(this.mini, 0, 0, size, size);
    const sc = size / (w.w * CELL);
    m.fillStyle = '#ffffff';
    m.beginPath(); m.arc(g.nexus.x * sc, g.nexus.y * sc, 3, 0, Math.PI * 2); m.fill();
    m.fillStyle = '#ffd23d';
    m.beginPath(); m.arc(g.player.x * sc, g.player.y * sc, 2.5, 0, Math.PI * 2); m.fill();
  }
}
