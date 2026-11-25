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
