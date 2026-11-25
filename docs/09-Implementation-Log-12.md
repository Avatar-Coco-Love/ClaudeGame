# 09 — Implementation Log, part 12

Continues `09-Implementation-Log-11.md` (part 11 neared the 8 KB cap at session 89). Newest at the bottom; read the tail only.

## Session 89 — Audit: one `insideBorder`, 256-world probe, 09 archive (v1.4.29, D-121)
- Sweeps done in-session (no subagent tool in this run): bugs on sessions 85–88's code, a 256-world probe, code
  health from audit 84's leftovers, docs drift on D-116…D-120 (all match the code). Older D-xxx not re-read this time.
- **256 probe** (dev-only size): Node, 2 min of scripted play per mode at 160 and 256, no throw; browser, a planted
  size-256 save → Continue → walk + teleport near the far corner, no page error. Screenshot viewed: terrain, HUD, ring
  toast fine; the minimap shows the whole 256 world (S-46's window).
- **H3 fixed:** `insideBorder(x, y, half, w, h)` in `world.js` replaces the inline border tests in `vaultSites`,
  `spireCandidates`, `loadSpires`, `anomalySites` and the dev teleport. `worldsize.cjs` pinned hashes unchanged.
- Code nits: `makeEcho`/`fieldAt` no longer exported; `spitter.js` uses `GLITCH_R` by name. D-121 records the title
  wordmark as D-107's second unscaled font size.
- `tests/audit89.cjs` (2 Node checks): `insideBorder` = each of the 4 old inline rules on every cell at 160 and 256
  (fails on old code: no export); every vault / Spire / Anomaly site of a 256 world inside the border (3 seeds).
- Watch for S-46 (Debt): site helpers default `w` to 160. `09` sessions 79–83 archived word for word
  (`archive/2026-11-25-09-sessions-79-83.md`); `09-Implementation-Log-10.md` removed (all of it archived).
- Smoke: 425/425 (was 423; +2 `audit89.cjs`).

## Session 90 — Build: S-46a Shoal / Kiln rings + appended sites (v1.4.30, D-122)
- S-46 split (D-122): this slice adds the rings and sites; minimap window, ending map, perf budget and the flip to 256
  are S-46b. New worlds are still 160 (unchanged pinned hashes).
- `RINGS` + Shoal / Kiln; profile 256 = rings 5, `outerVaults` 4 (`VAULT_D_OUTER` 86–118, salt `vault-outer`),
  Anomalies `[3, 5, 8, 6, 6]` (`ANOMALY_D` + 82–102 / 106–124, salts `anomaly-outer(-kind)`). Music clamps ring ≤ 2
  until S-47/48. Palette from a seeded search: edges ΔE ≥ 25 (lowest 26, Shoal dense / Prism, deuteranopia).
- Observed: at the spec's d 82, one seed in 40 had an outer vault move its Spires (and so inner Anomalies); 86 fixes it.
- Checks: `worldsize.cjs` +6 (5 rings at the right d, 160 keeps 3, outer vaults, Anomaly counts / bands, gap rule,
  appended = inner lists unchanged); `colours.cjs` reads 4 new edges, 30 pairs. Fail on old code (no Shoal in RINGS).
- Smoke 431/431 (was 425; +6 worldsize). B-082: first run failed `comments.cjs` (a `;` comment line); fixed.
- Screenshots at d 90 / 110 of a dev 256 world viewed: "Entering the Shoal" / "Kiln" toasts, mint / rose rock reads.

## Session 91 — Build: S-46b1 minimap window + ending frame (v1.4.31, D-123)
- S-46b split again (D-123): this slice = minimap window + ending frame; perf budget + the flip to 256 are S-46b2.
- `hud.js miniWindow`: `MINIMAP_WINDOW_CELLS` 160 square round the core, clamped; the minimap blits that source rect
  and translates, so every mark helper keeps `x * sc`. A 160 world: whole map, pixel-identical.
- Observed: in a 256 world the clamped window always holds the Nexus (≥ 32 cells in), so the spec's edge arrow was cut.
- `ending.js exploredBox`: the overview frames explored cells + Spires + Nexus, once per sequence (cached on the renderer).
- Checks: `worldsize.cjs` +3 node (160 = whole map; every 256 core position keeps core + Nexus inside; box) +1 browser
  (256 minimap pixels: core gold, Nexus white). New checks fail on old code (no `miniWindow` / `exploredBox`).
- Smoke 435/435 (was 431; +4 worldsize). Screenshots viewed: ending overview 1280×800, 256 minimap far out.

