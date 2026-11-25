# 09 — Implementation Log, part 15

Continues part 14 (sessions 104–108 archived word for word in audit 114: `archive/2026-11-25-09-sessions-104-108.md`, part 14 removed; 107–108 came from this part). Newest at the bottom; read the tail only.

## Session 109 — Audit: vent tell tone, Chart dev toggle, Shoal / Kiln in 08, 09 archive (v1.6.50, D-144)
- No subagent tool in this session: sweeps done in-session (correctness on S-50…S-52, phone sheets, docs drift).
- Fixed debt carried since audit 99: vents had no sound. A vent ≤ 5 cells away now plays `audio.ventTell` once per
  cycle at its tell, modes alike; `vent.cjs` check fails on the old code (proved: stash), `audio.cjs` measures it
  −33.7 dBFS peak, 0 % > 2 kHz, loud 0.1 s (ceiling −28).
- Chart: arrows ignored the dev `undertow.off` toggle (vents honour `vents.off`); now hidden too. No player impact.
- Phones (probe, 320×568, 360×640, 568×320, 640×360, touch): Nexus tab with the Chart row at L0 / L1 and the Craft
  tab with the Sink row: no row past the sheet, no page scroll. 320 Nexus shot viewed: `▲10 ⬟24` fits beside the text.
- **B-090** (fixed): full smoke read the d 100 / d 30 draw ratio 1.54× (alone 0.99, 1.03). New World's seed is random;
  6 pinned seeds read 0.72–0.99×. The test now pins 1073741824 (1.00–1.02× ×4); the 1.3× bound is unchanged.
- D-137…D-143 checked against the code: match (topLevel / matrixCost, `kiln` row clamp, `sinkMul` on gain only).
- Docs: Shoal / Kiln lines moved word for word from `02` (8185 B, at cap) to `08`; `09` sessions 99–103 archived
  word for word (part 13 removed). Workflow review (D-138): the last three audits had no subagent tool and the vent
  sound waited two audits, so `CLAUDE.md` says how to sweep in-session and to fix twice-carried debt first (D-144).
  Too much: the full smoke now runs > 10 min (logged as debt). Too little: perf re-measures (none since audit 94).
- Smoke 517/517 (+2: vent tell, its `audio.cjs` ceiling). A first full run read B-090; baseline on `main` 515 checks.

## Session 110 — Build: S-53a Burrower (v1.6.51, D-145)
- S-53 split (D-145): this slice is the creature in both modes; the rumble and `biomefoe.mjs` gate are S-53b.
- `src/burrower.js` (new): spawner in the Kiln (20 s, then 35–50 s), cell steps through rock / ore / floor clearing
  via `world.destroy` (tunnels persist as broken cells), tell, surface, lunge / eat, away 12, return; `beamFoes` adds it
  only surfaced; cleared on mode switch, death, Wake, Ending, > 24 cells. Wired in `game.js`, `render.js`.
- `tests/burrower.cjs` (7 checks, smoke): Kiln-only / 256-only / 20 s; Drift tunnels = rock or ore cleared, no
  pickups, no hurt, eats ore; Surge hit 22 at frame 47 after the tell; 2-cell dodge = 0; kill = drive-off loot;
  beam only surfaced; mode switch clears; nothing saved. Screenshots viewed: tell (lilac cell + cracks in the dark) and
  surfaced chevron (spacing widened after the first look, it read as one blob).
- Observed: a Drift core parked 90 s ate 39 ore cells (path ore counts) — S-53b's gate must measure this.
- Smoke 524/524 (+7 burrower).

## Session 111 — Build: S-53b Burrower rumble + Kiln gate (v1.6.52, D-146)
- Rumble: `Music.rumble(lv)` (a held drone on the bus) fed by `burrowerRumble(game)` from `main.js`. `audio.cjs` (alone,
  Music 50): 50 ms windows −56.4…−48.2 dBFS (bed RMS −47.4), peak −42.5, 0 % > 2 kHz, silent 1 s after it leaves;
  bed + rumble −46.1 RMS, max window −41.4 (bed ceiling −36). Wobble 0.45 dipped to −65.5: cut to 0.35.
- **B-091** (fixed): `music.cjs` 50 ms windows at 22050 Hz were 1102.5 samples, so every other one read NaN (−999) and
  hid itself from max / silence checks. Now rounded; every music check still passes. `burrower.cjs` +1: on within 4 cells, 0 beyond (fails on the
  old `music.js`: proved).
- `tools/biomefoe.mjs` (new; surgebot gains `setup` / `ore` options and beams a surfaced Burrower). 8 seeds × 10 min,
  with / without (◆-eq; Burrowers, kills, ore eaten in the with-run):
  | variant | Drift | Surge | note |
  |---|---|---|---|
  | as specced (gap 35–50, hp 6) | 1.010 | 1.003 | 67 / 73 spawned, kills 31 / 57, 0 deaths |
  | gap 20–30 | 1.034 | 0.936 | Surge in band |
  | gap 12–20 | 1.076 | 1.070 | more kills = more loot |
  | gap 20–30, hp 20 (no kills) | 1.007 | 0.878 | Drift ate 617 cells: costs nothing |
  | gap 20–30, Drift eats ore nearest the core | 1.154 | — | the bot kills it at its feet |
  | gap 20–30, tunnels clear ore only | 1.044 | 0.898 | free tunnels are not Drift's gift |
- Observed: the top-build bot is never ore-limited in the Kiln, so ore the Burrower eats is never missed; a drive-off
  (belly + Glitch loot) is pure gain. Surge's cost is heal time from lunges. Numbers left as specced (Q-030, Design 112).
- Smoke 526/526 (+2: rumble ceiling, rumble follows the Burrower); the first full run caught B-091.

