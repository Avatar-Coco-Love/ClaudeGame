# 09 — Implementation Log, part 2

Continues `09-Implementation-Log.md` (split at the 8 KB cap, session 36). Newest at the bottom; read the tail only.

## 2026-11-24 — Session 36 (v0.2.40): Build — S-18 code split
- Pure refactor (D-053). `game.js` 492 → 367 lines, `render.js` 591 → 514; new `glitch.js` 87, `hud.js` 88, `body.js` 52.
  Glitch numbers → `GLITCH_*` + `NEXUS_HEAL` in `config.js`; `ORE_KIND` shared by research/render/hud; Scanner desc and
  Research hint built from `SCAN_RADIUS`/`LUMEN_D`. Dead: `integrity: 100` (always overwritten), ROCK/DENSE `fill`/`edge`
  in `MATERIAL` and their `MINI_COLORS` (rings override both). The spec's "unused `mat`" is used; it moved into its branch.
- **Same behaviour, measured:** a 60 s scripted Surge run (Beam 4, aim at the nearest Glitch, else sweep; seed 77 at the Nexus
  and 35 cells out, seeds 4242 and 9001 35 out) gives byte-identical per-second digests. Stats before = after:
  77/nexus mined 110 glitches 0; 77/far 48 / 5; 4242 34 / 7 (1 Lumen); 9001 55 / 2.
  A seeded scene (core, 5 Glitches, pickups, beam, Scanner ping, Nexus pointer, minimap, touch sticks) screenshots
  byte-identical (`cmp`) before and after; viewed it.
- New check in `tests/docs.cjs`: no `src/*.js` / `tests/*.cjs` over 600 lines; failed with `render.js` padded to 604, passes now.
  Smoke 123/123 (122 before + the new one; no existing check changed), audio checks unchanged.

## 2026-11-24 — Session 37 (v0.2.41): Design — Pulse role, Spire relight, Relays
- **Play-test (page, 1280×800, viewed):** Surge, Pulse, Beam + Range 2, open arena 30 cells out. Holding fire at a tier-1
  Glitch from 400 px: the dotted reach line ends ~40 px short of it, the full charge fires by itself at 254 px (reach 216),
  hits nothing, and the Glitch closes during the 1.5 s cycle. A wave of 4 tier-2s cost 70 hp. That is why Pulse won no probe.
- **New `tools/standoff.mjs`** (20 angles per cell, mean hull lost / deaths): standing, Beam 2: single tier 2 Focus 26 hp,
  Wide 52, Pulse 0; wave3 tier 3 all three 96 hp / 20 deaths. Wide is worst in every fight. Kiting: all near 0 below tier 3.
- **Prototype (scratch copy of `src`, not shipped):** ready shot + `PULSE_GLITCH` 1.8 → wave3 Beam 2 tier 3 Pulse 32 hp, 0
  deaths; single tier 3 Beam 2 0 hp (Focus 32); wave5 Beam 2 tier 0 Pulse 45 (Focus 0). Ready shot alone (1.6) didn't
  fix tier 3 (Beam 2 burst 4.03 < 4.5 hp). → D-054, spec S-21. Q-011 closed.
- **Spire relight (Q-012 → D-055):** 80▲ fed from cargo; Drift = 8-facet Lights-Out ring (brute force: all 256 states
  reachable, each by exactly one tap set, so `SPIRE_TAPS` 3–5 is the true minimum); Surge = a 40 s Wake (S-23, bot-tuned).
  S-19's spec gains the 8 facet cells so S-20 needs no reshaping. Relays specced (S-22, D-056). New Q-013 (New Cycle carry-over).
- Docs only + one tool; no gameplay change. Smoke green.

## 2026-11-24 — Session 38 (v0.2.42): Build — S-15 perf check
- **`tools/perf.cjs`** (spec runs + `home`; `SKIP`, `FLUSH`, `RATE`, `ONLY`). ×4 throttle, 20 s each, mean / p95 ms, old → new:
  home 117 / 133 → 65 / 83; base (30 out, idle) 106 / 150 → 52 / 83; loot (Wide mining, 300 pickups) 171 / 250 → 125 / 167;
  holes (+20) 137 / 200. Far over 16.7 ms: software raster, so ratios only (D-057). A real phone run is still owed.
- **Finding:** audit 34's "drawLight 67 %" was deferred raster landing on its `drawImage`. Flushed per step (no throttle):
  Nexus glow 10.3 ms off screen, 13.6 on; `drawLight` 4.0 (upscale 3.6, holes ~0.3); a full frame 20 away / 24 home.
- **B-029 → fixed (D-057):** the Nexus glow's unclipped shadowBlur cost ~10 ms a frame even off screen. Cull + clip it; skip
  off-canvas light holes. Flushed frame 20 → 9.5 ms away, 24 → 11 at home.
  Fixed-frame pixel compare old vs new (camera, time, pulse pinned): away 0 bytes differ; home 62 (≤ 7/255); viewed.
- **`tests/drawcost.cjs`** (+5 smoke checks): off-screen Nexus 0 draws; off-canvas holes 0 fills; 300 pickups ≤ 4× an empty
  draw (2.1×); 20 holes ≤ 2× (1.3×); Nexus glow ≤ 35 % of a home frame (16 %). Proved failing: old shadowBlur pickups → 112×;
  old Nexus/holes code → 5/5 draws, 23/23 fills, 57 %. `R.extraLights` = world-space holes (perf tool now, beacons next).
- Smoke 128/128 (123 + 5).

## 2026-11-24 — Session 39 (v0.2.43): Audit — leaving cancels Pulse, touch handoff, 44 px sheets, Glitch sprites
- Sweeps (correctness, touch/mobile, perf, code health, docs drift) ran in parallel; each finding re-run here before acting.
- **B-030 → fixed:** the stick handoff adopted a finger resting on a HUD button (`e.touches` holds every touch); its touchend
  went to the button, so the aim stick stuck until blur. Now only touches whose target is the canvas are adopted.
- **B-031 → fixed:** Matrix tabs, buy buttons and Settings switches were 40 px tall on phones; ✕ shrank to 27 × 44 at 320 px
  with a big bank. All ≥ 44 on a coarse pointer; under 480 px the sheet header wraps (bank on row 2). Viewed at 320×568.
- **B-032 → fixed:** window blur / page hidden fired a Pulse charge (cleared keys read as a let-go; D-042 says cancel).
  `release()` now marks the input dropped and `read()` returns `cancel: true` once.
- **B-033 → fixed:** "Cargo full" fired while standing in the Nexus (pickups update before deposit). Not in the Nexus now.
- **Perf (T3):** Glitch bodies + eyes → glow sprites, culled off screen (D-058). New `surge` run in `tools/perf.cjs`, flushed ×4:
  draw 54.7 → 49.7 ms, enemies 6 → 4 %. Old vs new screenshot of all 4 tiers (+ hurt bar, fade) viewed: same look.
- Every new check failed on the old code first: B-033, B-031 ×3 (incl. ✕ 27 px, re-run with the old CSS), B-030, B-032 ×2,
  Glitch draws off-screen 27 → 0 and blurred 27 → 0. Smoke 137/137 (128 + 9).
- Code health: `BEAM_GLITCH_MUL`, `PICKUP_CAP` → `config.js` (tests import it); `tests/pulse.cjs` reads `PULSE_GLITCH` (ready
  for S-21's 1.8); hitstop comments + check name say yield cells; B-018 comment moved. Docs: `01` lists Pulse, README controls
  (arrows, Esc, ≡), D-050 note marked historical. Rest → `04-Roadmap-2` Debt (split `drawLight` before S-19, inline tuning).
- Chores: `09` sessions 31–33 archived word for word; changelog v0.1.22–26 archived; all D-001…D-057 checked against code:
  match, except D-051's "Glitches keep shadowBlur", superseded by D-058.
