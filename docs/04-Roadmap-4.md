# 04 — Roadmap, part 4: Debt (continued)

Continues the Debt list of `04-Roadmap-2.md` (near the 8 KB cap at audit 104). Audits add here; fixes move to
`archive/2026-11-24-04-debt-done.md` word for word.

## Debt
- **Audit 104 leftovers** (sweeps in-session, no subagent tool; fixed: B-089 the five-kind phone bank, Large landscape
  bank font, D-137; `09` sessions 94–98 archived). Still open: vents have no sound (a tell tone needs `audio.cjs`
  ceilings); `08` has no lines for the Shoal / Kiln systems (Undertow, glass, heat, vents, biome ores: `02` holds them). Perf / bigworld not re-measured beyond the baseline smoke.
  Watch: Large 320 px portrait with Echo + 3 buff chips had 0 px to the minimap before the chip padding fix.
- **B-090** (watch, audit 104): `bigworld.cjs` d 100 / d 30 draw ratio read 2.08× once in a full smoke (far 10.4 ms vs
  usual ~5–6); alone 1.02× twice. Not vent phase (16 phases × 4 seeds flat); the ratio swings 0.45–1.05 by seed.
  Pin the seed if it recurs.
