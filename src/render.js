// World drawing (terrain chunk cache, entities, beam, Scanner). Screen-space HUD drawing (minimap, Nexus pointer, touch
// sticks) is in hud.js; darkness, light holes and floor glow in light.js; painting one terrain chunk in terrain.js (S-26).
// Terrain is cached per chunk and only redrawn when mined.
import { CELL, CHUNK, T, RESOURCE, ORE_KIND, NEXUS_RADIUS, LIGHT_RADIUS, GLITCH_FADE_S, GLITCH_R, GLITCH_COLORS, SCAN_RADIUS, SCAN_SPEED, PULSE_RANGE, BEACON_GLOW, WAKE_FRAME_PX, ANOMALY_KINDS, PICKUP_FRAMES } from './config.js';
import { markAlpha } from './research.js';
import { paintMiniCell, drawMinimap, drawNexusPointer, drawSticks } from './hud.js';
import { drawBeacons, drawRelays } from './craft.js';
import { drawSpireBreath, drawSpireFeed } from './spire.js';
import { drawLight, drawLightGlow } from './light.js';
import { endingView, drawOverview } from './ending.js';
import { paintChunk } from './terrain.js';
import { spitterSprite, drawSpitterTells } from './spitter.js';
import { drawAurora } from './weather.js';
import { drawAnomalies } from './anomaly.js';

const CHUNK_PX = CHUNK * CELL;
const MAX_CACHED_CHUNKS = 48;
const NEXUS_GLOW_BOX = 112; // px half-size: outer ring 62 × 1.05 pulse + 1 line + 32 (4σ of shadowBlur 16) + margin

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
    this.beaconGlow = BEACON_GLOW; // S-25 floor-glow centre alpha (tests set 0 to compare)
    this.lightSets = [[]]; // S-26: lists of world-space lights {x, y, r} beyond the core, Nexus and beam (light.js)
    this.quality = 0; // S-41 (D-109): 0 DPR ≤ 2; 1 DPR 1; 2 DPR 1 + half the particles + pickups without glow
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  /** The beacon light set (S-16 name, kept for tests and tools): `lightSets[0]`. */
  get extraLights() { return this.lightSets[0]; }
  set extraLights(v) { this.lightSets[0] = v; }

  /** S-41: drawing level from quality.js. Changes only how frames are drawn, never the game. */
  setQuality(level) {
    if (level === this.quality) return;
    this.quality = level; this.resize();
  }

  resize() {
    this.dpr = this.quality > 0 ? 1 : Math.min(2, window.devicePixelRatio || 1);
    this.w = innerWidth; this.h = innerHeight; this.hudRects = null; // T1: re-read the HUD boxes
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.light.width = Math.round(this.w / 2); this.light.height = Math.round(this.h / 2);
    this.zoom = Math.max(0.62, Math.min(1.25, Math.min(this.w, this.h) / 720));
  }

  attach(game) {
    this.game = game;
    this.lightSets = [game.beacons, game.relays, game.spireLights]; // S-16, S-22, S-28: the same arrays, so a new light shows at once
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

  setMini(i) { paintMiniCell(this, i); }
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
    if (ch && w.dirtyChunks.has(key)) { paintChunk(w, ch.canvas, cx, cy); w.dirtyChunks.delete(key); }
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
      paintChunk(w, ch.canvas, cx, cy);
      w.dirtyChunks.delete(key);
      this.chunks.set(key, ch);
    }
    ch.used = this.time;
    return ch.canvas;
  }

  // ---------- frame ----------
  draw(dt, input) {
    const game = this.game, ctx = this.ctx, p = game.player;
    this.time += dt;
    // Camera: follow with slight look-ahead in the aim direction.
    // S-23 (audit 59 T1/T2): during a Wake, with the core near the Spire, frame the Spire's core so all four lanes show.
    const wk = game.wake, onSpire = wk && Math.hypot(p.x - wk.core.x, p.y - wk.core.y) < WAKE_FRAME_PX;
    const lookX = onSpire ? wk.core.x - p.x : Math.cos(p.angle) * 36, lookY = onSpire ? wk.core.y - p.y : Math.sin(p.angle) * 36;
    const k = Math.min(1, dt * 6);
    this.cam.x += (p.x + lookX - this.cam.x) * k;
    this.cam.y += (p.y + lookY - this.cam.y) * k;
    const ov = endingView(this); // S-24: the ending's overview (camera on the Nexus, zoomed out to every Spire) replaces the world
    if (ov) { drawOverview(this, this.ctx, ov); return; }
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
    drawLightGlow(this, ctx, left, top, vw, vh); // S-25: under the walls, dimmed by the light layer like the floor

    const w = game.world;
    const cx0 = Math.max(0, Math.floor(left / CHUNK_PX)), cy0 = Math.max(0, Math.floor(top / CHUNK_PX));
    const cx1 = Math.min(w.chunksW - 1, Math.floor((left + vw) / CHUNK_PX));
    const cy1 = Math.min(w.chunksH - 1, Math.floor((top + vh) / CHUNK_PX));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
      ctx.drawImage(this.getChunk(cx, cy), cx * CHUNK_PX, cy * CHUNK_PX);
    }

    drawAurora(this, ctx); // S-33: ore in the core's light shimmers during an aurora
    drawAnomalies(this, ctx, left, top, vw, vh); // S-35: hexagrams, faint in rock, full once open
    drawSpireBreath(this, ctx, left, top, vw, vh); // S-27: the core hexagon breathes (was painted into the chunk)
    this.drawNexus(ctx, left, top, vw, vh);
    drawBeacons(this, ctx, left, top, vw, vh); // S-16
    drawRelays(this, ctx, left, top, vw, vh); // S-22
    this.drawCrack(ctx);
    this.drawPickups(ctx, left, top, vw, vh);
    this.drawEnemies(ctx, false);
    this.drawBeam(ctx);
    drawSpireFeed(this, ctx, left, top, vw, vh); // S-20: primed facets + the fed / 80 arc
    this.drawPlayer(ctx);
    this.drawParticles(ctx);
    ctx.restore();

    this.drawLight(ctx);

    // Glitch "eyes" read through the dark so Surge is fair.
    ctx.save();
    ctx.translate(this.w / 2 + shx, this.h / 2 + shy); ctx.scale(s, s); ctx.translate(-this.cam.x, -this.cam.y);
    this.drawEnemies(ctx, true);
    drawSpitterTells(this, ctx); // S-32: the shot tell and bolts read through the dark
    this.drawScan(ctx);
    ctx.restore();

    drawNexusPointer(this, ctx);
    drawSticks(ctx, input);
    drawMinimap(this);
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

  drawNexus(ctx, left, top, vw, vh) {
    const n = this.game.nexus, t = this.time;
    // S-15: a shadowBlur stroke blurs a layer as big as the clip, on or off screen: unclipped, the three rings cost ~10 ms a
    // frame on a software canvas (headless Chromium, no throttle) even with the Nexus off screen. So: skip it off screen, and
    // clip each glow to the box it can reach (same pixels). m = widest ring (deposit, or the Radiance sweep) + shadow + shake.
    const m = Math.max(NEXUS_RADIUS, this.game.nexusPulse > 0 ? this.game.nexusLight() : 0) + 48;
    if (n.x + m < left || n.x - m > left + vw || n.y + m < top || n.y - m > top + vh) return;
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.beginPath(); ctx.rect(-m, -m, m * 2, m * 2); ctx.clip();
    // Deposit ring
    ctx.setLineDash([6, 10]); ctx.lineDashOffset = -t * 20;
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.22)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, NEXUS_RADIUS, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 1 + Math.sin(t * 2) * 0.05, hue = this.game.nexusHue();
    const rings = [
      { r: 46, rot: t * 0.3, col: `rgb(${hue})`, a: 0.9, wdt: 2.5 }, // S-29: the cycle's hue
      { r: 32, rot: -t * 0.5, col: '#8a5cff', a: 0.9, wdt: 2 },
      { r: 62, rot: t * 0.12, col: '#ff4fd8', a: 0.35, wdt: 1.5 },
    ];
    ctx.shadowBlur = 16;
    ctx.save(); ctx.beginPath(); ctx.rect(-NEXUS_GLOW_BOX, -NEXUS_GLOW_BOX, NEXUS_GLOW_BOX * 2, NEXUS_GLOW_BOX * 2); ctx.clip();
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
    ctx.restore();
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 26);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)'); grd.addColorStop(0.4, `rgba(${hue},0.6)`); grd.addColorStop(1, `rgba(${hue},0)`);
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
    if (this.game.nexusPulse > 0) { // Radiance bought: a white ring sweeps out to the new light edge
      const k = 1 - this.game.nexusPulse;
      ctx.globalAlpha = this.game.nexusPulse; ctx.strokeStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 30 + k * (this.game.nexusLight() - 30), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  drawCrack(ctx) {
    const b = this.game.beam, seen = new Set();
    for (const r of b.rays.length ? b.rays : [b]) { // S-13: one crack per cell the beam is cutting
      if (!r.target || r.target.frac <= 0 || seen.has(r.target)) continue;
      seen.add(r.target); this.drawCrackAt(ctx, r.target);
    }
  }
  drawCrackAt(ctx, { x, y, frac }) {
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

  // B-027 (D-051): a shape drawn with shadowBlur costs ~3 ms per draw on a software canvas, so every repeated glowing shape
  // (pickups, Scanner glyphs) is baked once into a sprite at the current device scale and drawn with one drawImage.
  // `half` is the sprite's half-size in world px; `paint(g)` draws the shape around (0, 0). Rebuilt only when zoom or DPR changes.
  glowSprite(key, half, paint) {
    const res = this.zoom * this.dpr;
    if (this.spriteRes !== res) { this.sprites = {}; this.spriteRes = res; }
    let sp = this.sprites[key];
    if (sp) return sp;
    const px = Math.ceil(half * 2 * res), c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    g.translate(px / 2, px / 2); g.scale(res, res);
    paint(g); // shadowBlur is in canvas pixels here, as on the main canvas
    return (this.sprites[key] = { canvas: c, half });
  }
  // Audit 74: the spin is baked into PICKUP_FRAMES sprites (one turn), so drawing one is an axis-aligned drawImage with
  // no save / rotate / restore (300 on screen: 137 → 94 ms at a 4× CPU throttle). Lumen ● looks the same at any angle.
  pickupSprite(kind, frame = 0) {
    if (kind === 'lumen') frame = 0;
    const glow = this.quality < 2; // S-41: L2 draws the bare shape in a small sprite (far fewer pixels per pickup)
    return this.glowSprite((glow ? 'p-' : 'pn-') + kind + '-' + frame, glow ? 5 + 16 / (this.zoom * this.dpr) : 6, g => {
      const col = RESOURCE[kind].color;
      g.rotate(frame * Math.PI * 2 / PICKUP_FRAMES);
      g.fillStyle = col; if (glow) { g.shadowColor = col; g.shadowBlur = 10; }
      g.beginPath();
      if (kind === 'shard') { g.moveTo(0, -5); g.lineTo(3, 0); g.lineTo(0, 5); g.lineTo(-3, 0); }
      else if (kind === 'lumen') g.arc(0, 0, 3.5, 0, Math.PI * 2);
      else { g.moveTo(0, -5); g.lineTo(4.5, 3); g.lineTo(-4.5, 3); }
      g.fill();
    });
  }
  scanSprite(type) {
    return this.glowSprite('s-' + type, 14 + 16 / (this.zoom * this.dpr), g => {
      g.shadowBlur = 10;
      if (typeof type === 'string') { // S-37: 'a-<kind>', an Anomaly site: its hexagram, upright, in its kind's colour
        g.strokeStyle = g.shadowColor = `rgb(${ANOMALY_KINDS[type.slice(2)].rgb})`; g.lineWidth = 2.5; g.lineJoin = 'round';
        for (const off of [0, Math.PI]) {
          g.beginPath();
          for (let j = 0; j < 3; j++) { const a = off - Math.PI / 2 + j * Math.PI * 2 / 3; g[j ? 'lineTo' : 'moveTo'](Math.cos(a) * 12, Math.sin(a) * 12); }
          g.closePath(); g.stroke();
        }
        return;
      }
      if (type === T.CACHE) { // S-12: the cache glyph (square in square, upright), white, 1.3x the ore glyph
        g.strokeStyle = g.fillStyle = g.shadowColor = '#ffffff'; g.lineWidth = 2.5;
        g.strokeRect(-12, -12, 24, 24); g.fillRect(-5, -5, 10, 10);
        return;
      }
      const k = RESOURCE[ORE_KIND[type]];
      g.font = '600 18px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = g.shadowColor = k.color;
      g.fillText(k.glyph, 0, 0);
    });
  }

  // Only pickups in view (plus their glow) are drawn: the floor keeps loot across the whole map (saved since B-011), so an
  // uncull'd floor of 400 made every frame pay for loot far off screen (B-014, audit 19).
  drawPickups(ctx, left, top, vw, vh) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const m = 16, x0 = left - m, y0 = top - m, x1 = left + vw + m, y1 = top + vh + m, turn = Math.PI * 2;
    for (const it of this.game.pickups) {
      if (it.x < x0 || it.x > x1 || it.y < y0 || it.y > y1) continue;
      const a = ((this.time * 2 + it.y) % turn + turn) % turn, f = Math.floor(a / turn * PICKUP_FRAMES) % PICKUP_FRAMES;
      const sp = this.pickupSprite(it.kind, f), h = sp.half * (Math.sin(this.time * 5 + it.x) * 0.3 + 1);
      ctx.drawImage(sp.canvas, it.x - h, it.y - h, h * 2, h * 2);
    }
    ctx.restore();
  }

  // T3 (audit 39, D-051): a Glitch body or eye is a glow sprite (one drawImage, no per-frame shadowBlur), and Glitches off
  // screen are skipped. Called twice a frame (bodies under the light, eyes over it), so the cull pays double.
  glitchSprite(tier, white) {
    const col = white ? '#ffffff' : GLITCH_COLORS[tier];
    return this.glowSprite(`g-${tier}-${white ? 1 : 0}`, GLITCH_R * 1.15 + 2 + 18 / (this.zoom * this.dpr), g => {
      const spikes = 3 + tier;
      g.strokeStyle = g.fillStyle = g.shadowColor = col; g.shadowBlur = 14; g.lineWidth = 2;
      g.beginPath();
      for (let i = 0; i <= spikes * 2; i++) {
        const a = i / (spikes * 2) * Math.PI * 2, r = i % 2 ? GLITCH_R * 0.45 : GLITCH_R * 1.15;
        i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.stroke();
      g.globalAlpha = 0.25; g.fill();
    });
  }
  eyeSprite(tier) {
    return this.glowSprite('e-' + tier, 2.5 + tier * 0.6 + 12 / (this.zoom * this.dpr), g => {
      g.fillStyle = g.shadowColor = '#ff5a2e'; g.shadowBlur = 12;
      g.beginPath(); g.arc(0, 0, 2.5 + tier * 0.6, 0, Math.PI * 2); g.fill();
    });
  }

  drawEnemies(ctx, eyesOnly) {
    const p = this.game.player, vw = this.w / this.zoom, vh = this.h / this.zoom, m = GLITCH_R * 2 + 24;
    const x0 = this.cam.x - vw / 2 - m, x1 = this.cam.x + vw / 2 + m, y0 = this.cam.y - vh / 2 - m, y1 = this.cam.y + vh / 2 + m;
    for (const e of this.game.enemies) {
      if (e.x < x0 || e.x > x1 || e.y < y0 || e.y > y1) continue;
      const fade = e.fade !== undefined ? Math.max(0, e.fade / GLITCH_FADE_S) : 1; // S-6 give-up: fade and shrink
      if (eyesOnly) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        const a = Math.max(0, Math.min(0.9, (d - LIGHT_RADIUS * 0.6) / 200));
        if (a <= 0) continue;
        const sp = this.eyeSprite(e.tier);
        ctx.globalAlpha = fade * a * (0.6 + Math.sin(this.time * 6 + e.wander) * 0.3);
        ctx.drawImage(sp.canvas, e.x - sp.half, e.y - sp.half, sp.half * 2, sp.half * 2);
        ctx.globalAlpha = 1; continue;
      }
      const sp = e.spitter ? spitterSprite(this, e.flash > 0) : this.glitchSprite(e.tier, e.flash > 0), k = (fade < 1 ? 0.4 + 0.6 * fade : 1) * e.r / GLITCH_R;
      ctx.save();
      ctx.translate(e.x, e.y); ctx.rotate(e.spin); ctx.scale(k, k); ctx.globalAlpha = fade;
      ctx.drawImage(sp.canvas, -sp.half, -sp.half, sp.half * 2, sp.half * 2);
      ctx.restore();
      if (e.hp < e.maxHp && fade === 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(e.x - 12, e.y - 20, 24, 3);
        ctx.fillStyle = '#ff7a3d'; ctx.fillRect(e.x - 12, e.y - 20, 24 * Math.max(0, e.hp / e.maxHp), 3);
      }
    }
  }

  drawBeam(ctx) {
    const b = this.game.beam, p = this.game.player;
    if (b.charge > 0 || b.flash > 0) this.drawPulse(ctx, b, p);
    if (!b.on) return;
    // S-13: Wide draws each of its parallel rays at 0.6× width, joined by a thin emitter bar across the nose.
    const rays = b.rays.length ? b.rays : [{ ox: p.x + Math.cos(p.angle) * 12, oy: p.y + Math.sin(p.angle) * 12, ex: b.ex, ey: b.ey, enemy: b.enemy }];
    const w = rays.length > 1 ? 0.6 : 1, flick = 0.75 + Math.random() * 0.25;
    const hot = this.game.buffs.includes('overclock') ? '255,226,190' : '255,255,255'; // S-35: Overclock warms the core line
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    if (rays.length > 1) {
      ctx.strokeStyle = `rgba(46,242,255,${0.5 * flick})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(rays[0].ox, rays[0].oy); ctx.lineTo(rays[rays.length - 1].ox, rays[rays.length - 1].oy); ctx.stroke();
    }
    for (const r of rays) {
      const col = r.enemy ? '255,122,61' : '46,242,255';
      for (const [a, lw] of [[0.25, 9], [0.7, 3.5], [0, 1.2]]) {
        ctx.strokeStyle = a ? `rgba(${col},${a * flick})` : `rgba(${hot},${0.9 * flick})`; ctx.lineWidth = lw * w;
        ctx.beginPath(); ctx.moveTo(r.ox, r.oy); ctx.lineTo(r.ex, r.ey); ctx.stroke();
      }
      const R = 14 * w, g = ctx.createRadialGradient(r.ex, r.ey, 0, r.ex, r.ey, R);
      g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(r.ex, r.ey, R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // S-14 Pulse: while charging, a dotted aim line to the full reach (brighter with charge); on release, a bright line for b.flash s.
  drawPulse(ctx, b, p) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    if (b.charge > 0) {
      const dx = Math.cos(p.angle), dy = Math.sin(p.angle), reach = this.game.stat('range') * PULSE_RANGE;
      const full = b.charge >= 1 - 1e-9; // S-21: a full charge waiting for a target draws its reach solid at 60 % (static line)
      ctx.setLineDash(full ? [] : [3, 7]); ctx.lineWidth = 1.5 + b.charge; ctx.strokeStyle = `rgba(46,242,255,${full ? 0.6 : 0.2 + 0.5 * b.charge})`;
      ctx.beginPath(); ctx.moveTo(p.x + dx * 14, p.y + dy * 14); ctx.lineTo(p.x + dx * (12 + reach), p.y + dy * (12 + reach)); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (b.flash > 0 && b.flashLine) {
      const r = b.flashLine, a = b.flash / b.flashMax, col = r.enemy ? '255,122,61' : '46,242,255';
      for (const [c, lw] of [[`rgba(${col},${0.35 * a})`, 12], [`rgba(${col},${0.9 * a})`, 4], [`rgba(255,255,255,${a})`, 1.6]]) {
        ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(r.ox, r.oy); ctx.lineTo(r.ex, r.ey); ctx.stroke();
      }
    }
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
    ctx.shadowColor = p.hurtFlash > 0 ? '#ff5a2e' : '#2ef2ff';
    ctx.shadowBlur = 18 + (g.motionOn() ? 22 * g.beam.charge : 0); // S-14: the glow brightens with a Pulse charge (not under reduced motion)
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
    const half = this.quality >= 2; // S-41: L2 draws every other particle; the sim keeps all of them
    for (const q of this.game.particles) {
      if (half) { if (q.rq === undefined) q.rq = (this.rqn = (this.rqn | 0) + 1) & 1; if (q.rq) continue; } // fixed per particle: no flicker
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

  drawLight(ctx) { drawLight(this, ctx); } // S-26: light.js; a method so tools/perf.cjs can time it

  // S-11: the Scanner ring and the ore glyphs it reveals, drawn above the darkness (world transform).
  drawScan(ctx) {
    const sc = this.game.scan;
    if (sc.age >= sc.end) return; // B-026: an empty ping still draws its ring
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const r = sc.age * SCAN_SPEED, R = SCAN_RADIUS * CELL;
    if (sc.ring && r < R + 40) {
      ctx.strokeStyle = '#ffc94f'; ctx.lineWidth = 3; ctx.shadowColor = '#ffc94f'; ctx.shadowBlur = 14;
      ctx.globalAlpha = Math.max(0, 1 - r / (R + 40)) * 0.8;
      ctx.beginPath(); ctx.arc(sc.x, sc.y, Math.min(r, R + 40), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    for (const m of sc.marks) { // B-027: glyphs are glow sprites (scanSprite), not shadowBlur text
      const a = markAlpha(this.game, m);
      if (a <= 0) continue;
      const sp = this.scanSprite(m.kind ? 'a-' + m.kind : m.type), cx = (m.x + 0.5) * CELL, cy = (m.y + 0.5) * CELL;
      ctx.globalAlpha = a;
      ctx.drawImage(sp.canvas, cx - sp.half, cy - sp.half, sp.half * 2, sp.half * 2);
    }
    ctx.restore();
  }
}
