// Dev tools (S-7, D-027). Every action is a plain function on `window.__lumen.dev`; the panel only calls them, so bots,
// smoke checks and the panel share one entry point. The panel exists only with `?dev` in the URL or after the backtick key.
// Nothing here enters the save except what the actions themselves change (bank, upgrades, mode, carved cells).
import { UPGRADES, NEXUS_UPGRADES, CELL, RESEARCH } from './config.js';
import { UNBREAKABLE } from './world.js';

const ROOM = 1; // carve (2*ROOM+1)² cells: a 3×3 room around the teleport target

/** `ui` is main.js glue: { game(), persist(), modeChanged() }. Returns the dev API. */
export function createDev(ui) {
  const g = () => ui.game();
  const dev = {
    addShards(n = 100) { g().bank.shard += n; ui.persist(); },
    addPrisms(n = 50) { g().bank.prism += n; ui.persist(); },
    addLumen(n = 20) { g().bank.lumen += n; ui.persist(); },
    /** Teleport `cells` out from the Nexus (straight down by default), carving a 3×3 room with no yield. */
    teleport(cells, angle = Math.PI / 2) {
      const game = g(), w = game.world;
      const cx = Math.floor(game.nexus.x / CELL) + Math.round(Math.cos(angle) * cells);
      const cy = Math.floor(game.nexus.y / CELL) + Math.round(Math.sin(angle) * cells);
      // The room stays off the 2-cell bedrock border (B-013: the old clamp let it carve the inner bedrock ring).
      const tx = Math.max(2 + ROOM, Math.min(w.w - 3 - ROOM, cx)), ty = Math.max(2 + ROOM, Math.min(w.h - 3 - ROOM, cy));
      // C1 (audit 49): the room never overlaps an unbreakable cell (a Spire core or facet); else the core landed inside one.
      const clear = (x, y) => x >= 2 + ROOM && x <= w.w - 3 - ROOM && y >= 2 + ROOM && y <= w.h - 3 - ROOM
        && [...Array((2 * ROOM + 1) ** 2).keys()].every(k => !UNBREAKABLE.has(w.get(x - ROOM + k % (2 * ROOM + 1), y - ROOM + Math.floor(k / (2 * ROOM + 1)))));
      let x = tx, y = ty, best = clear(tx, ty) ? 0 : Infinity;
      for (let dy = -12; dy <= 12 && best; dy++) for (let dx = -12; dx <= 12; dx++) {
        const d = dx * dx + dy * dy; if (d < best && clear(tx + dx, ty + dy)) { best = d; x = tx + dx; y = ty + dy; }
      }
      for (let yy = y - ROOM; yy <= y + ROOM; yy++) for (let xx = x - ROOM; xx <= x + ROOM; xx++) if (w.solid(xx, yy) && !UNBREAKABLE.has(w.get(xx, yy))) w.destroy(xx, yy);
      const p = game.player;
      p.x = (x + 0.5) * CELL; p.y = (y + 0.5) * CELL; p.vx = p.vy = 0;
      game.pickups.length = 0; // pickups chasing the old position would fly across the map
      ui.persist();
      return { x, y };
    },
    god(on = !g().god) { g().god = on; return on; },
    setMode(mode = g().mode === 'surge' ? 'drift' : 'surge') { g().setMode(mode); ui.modeChanged(); ui.persist(); return mode; },
    maxAll() {
      const game = g();
      for (const u of UPGRADES) game.upgrades[u.id] = u.max;
      for (const u of NEXUS_UPGRADES) game.nexusLevels[u.id] = u.max;
      for (const r of RESEARCH) game.research[r.id] = true; // S-11
      game.player.integrity = game.stat('hull');
      game.revealQueue.push(...game.world.reveal(game.nexus.x, game.nexus.y, game.nexusLight()));
      ui.persist();
    },
  };

  let panel = null;
  const buttons = [
    ['+100◆', () => dev.addShards()], ['+50▲', () => dev.addPrisms()], ['+20●', () => dev.addLumen()],
    ['Ring 0', () => dev.teleport(0)], ['Ring 30', () => dev.teleport(30)], ['Ring 60', () => dev.teleport(60)],
    ['God', () => dev.god()], ['Drift/Surge', () => dev.setMode()], ['Max all', () => dev.maxAll()],
  ];
  function refresh() { if (panel) panel.querySelector('[data-dev="God"]').classList.toggle('on', !!g().god); }
  dev.showPanel = (show = !panel || panel.classList.contains('hidden')) => {
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'dev-panel';
      panel.className = 'panel';
      for (const [label, fn] of buttons) {
        const b = document.createElement('button');
        b.textContent = label; b.dataset.dev = label;
        b.addEventListener('click', () => { fn(); refresh(); b.blur(); });
        panel.appendChild(b);
      }
      document.body.appendChild(panel);
    }
    panel.classList.toggle('hidden', !show);
    refresh();
  };
  addEventListener('keydown', e => { if (e.key === '`' && !(e.target instanceof HTMLInputElement)) dev.showPanel(); });
  if (new URLSearchParams(location.search).has('dev')) dev.showPanel(true);
  return dev;
}
