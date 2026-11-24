# 09 — Implementation Log, part 6

Continues `09-Implementation-Log.md` (sessions 49–53 archived in audit 59: `archive/2026-11-24-09-sessions-49-53.md`). Newest at the bottom; read the tail only.

## Session 54 — Audit: one toggle per aim, phone toast band, tap answers first (v0.4.58, #59)
- Sweeps (correctness, mobile/touch + perf, code health, docs drift) ran in parallel; each finding re-run here first.
- **B-043 → fixed:** a full Pulse held on a primed facet re-fired each recovery: 6 flips in 10 s (seed 77). Now a burst
  latches its facet (`beam.facetLatch`); a held full charge waits there and a let-go charge is dropped (D-084).
- **B-044 → fixed:** a Glitch crossing the centre ray cleared Focus's facet latch: 2 flips, aim unchanged. A Glitch on
  the centre ray (`beam.midEnemy`) now pauses the latch.
- **B-045 → fixed:** a save with `lit: true` and a junk mask loaded mask null (facets drawn unlit); lit → 255.
- **B-046 → fixed:** a tap's answer toast waited behind a milestone (up to 3.8 s); now it shows at once, the milestone returns.
- **B-047 → fixed:** phone toasts covered ◎ ⟂ (320×568), ✦ (412×915) and the minimap + ✦ (568×320, new). Portrait: below
  the core; landscape: under the bank panel (Surge height). `touch.cjs` checks 5 sizes vs every HUD box + the core's
  look-ahead square; it failed on all four phone sizes before (and caught the Surge panel on the first try). Viewed.
- Each new check failed on the old code first (C1–C3 node, T2 with `main.js` stashed, T1 before the CSS).
- Docs: README controls (⊕, facets), `01` Crafting, built S-20/S-22/S-28 text deleted from `07-…-3`, Debt refreshed
  (H1, H2, H4, T3 logged), stale comments (`light.js`, `RELAY_GAP`, B-033). `09` parts 3–4 (sessions 44–48) archived
  word for word. All D-001…D-083 re-checked: match. Smoke 244/244 (9 new checks).

Continued in `09-Implementation-Log-7.md` (session 55 on).
