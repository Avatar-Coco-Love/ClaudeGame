# 09 — Implementation Log, part 16

Continues part 15 (sessions 109–113 archived word for word in audit 119: `archive/2026-11-25-09-sessions-109-113.md`, part 15 removed; 112–113 came from this part). Newest at the bottom; read the tail only. Continued in `09-Implementation-Log-17.md` (118 on).

## Session 114 — Audit: glow clips (B-091), Kiln perf run, biome ores in 08, 09 archive (v1.6.55, D-149)
- No subagent tool again: sweeps in-session, newest code first (Burrower S-53a…c, then the debt two audits carried: perf).
- Perf re-measured (debt since audit 104): `tools/perf.cjs` gains `kiln` (d 110, a Burrower kept alive, vents on).
  At CPU ×4: kiln 39–41 ms mean, p95 83 vs base 32–34, p95 50 (1.32×); Burrower off still 37–39.
- **B-091** (fixed): a shadowBlur draw in 'lighter' blurs a layer as big as the clip: 3.9 ms per draw unclipped vs
  0.09 clipped (bare canvas). Unclipped: flaring vents (S-48b), Anomaly sites + take ring (S-36), Scanner ring, the
  Burrower tell (6.4 ms a frame → 0.01). Each is now clipped to its box + `R.glowPad(blur)` (reach in world px at any
  zoom × DPR). After: kiln 33–34 ms, p95 50 (≈ 1.05× base). Pixels: clip vs no clip diff 0 for the tell (zoom 1 and
  0.62); full frames ≤ 5 / 255 at the site, matching frame-to-frame noise elsewhere. Tell screenshot viewed.
- Checks: `drawcost.cjs` instruments real frames (vents, anomaly, scan, tell) and fails any blurred non-source-over draw
  outside a clip; `burrower.cjs` pixel-compares the clipped tell. Both fail on the old code (proved: stash).
- D-145…D-148 checked against the code: match (belly = break-out cell, rumble 52 Hz / 240 lowpass, seeded crunch,
  `BITE_ORDER`). Burrower logic swept (leash, mode switch, death, Wake, kill on the last up frame): no bug found.
- Docs: biome ore lines in `08` (audit 109 debt); `09` sessions 104–108 archived word for word (part 14 removed).
- Workflow review (D-138): too little: perf scenes for new biomes (the vents' glow shipped unmeasured in
  S-48b); a rule broken three times (S-15, B-027, B-091) is now a check (D-149). Too much: full smoke > 10 min still.
- Smoke 533/533 (+2: drawcost glow clips, burrower tell clip pixels).

## Session 115 — Build: S-54 Mote swarm (v1.6.56, D-150)
- `mote.js`: one swarm of 6 in the Shoal (256 only), 40–60 s gap, 10–12 cells out on reachable floor; boids-lite pull,
  full Undertow flow on the velocity, BFS way in; Surge contact 4 + 1 item, Drift 1 item / carries loose pickups the
  Attractor isn't pulling; beamed 1 ◆ each, Glitch loot per whole swarm. Mint diamonds + trail over the dark, no blur.
- Gate (`biomefoe.mjs --biome=shoal`, now generic over biomes): as specced FAIL 1.08 / 1.04; shipped PASS 0.907 / 0.896
  (8), 0.910 / 0.899 (16). Kiln gate unchanged: PASS. Perf `shoal` run: 1.04× base mean (CPU ×4, 8 s).
- Screenshot of a swarm viewed: six mint diamonds with short trails, readable in the dark Shoal.
- Smoke 541/541 (+8, `mote.cjs`: spawn, current, contact, carry, loot, mode switch / save, gate, drawn).

## Session 116 — Build: S-55 Arc beam mode (v1.6.57, D-151)
- `arc.js` (`arcFoes`, `arcCells`, `drawArcs`); `castBeam` adds jumps to its cell / foe sets at `ARC_MUL`, heat counts
  them (`heatHit`). Research row 35 ●, 4th in the Q cycle; the ⟂ button's glyph is now per mode (`#mode-glyph`, ↯).
- As specced (× 0.35, joined vein) clusters ran 1.06–1.25× Focus; retuned (D-151) to 1.36–1.45×, rock 0.79×.
- Screenshot viewed: jagged cyan-white jumps from the hit to two crystals of a 3×5 vein; button reads "↯ Arc".
- Smoke 547/547 (+6, `arc.cjs`: research + cycle, × 0.8 / × 0.5, own-type ≤ 2 cells, creatures not bolts, rates, UI).

## Session 117 — Design: M13 specced (v1.6.58, D-152, D-153)
- Play-test (Playwright, `?dev`, Max all, god, still core): Kiln Surge 23 s: a Burrower up 181 frames, 0 damage taken
  (god); Shoal Drift 48 s: a swarm round the core 1681 frames (~28 s) with an empty hold: motes cling but take nothing.
  Arc shot (`ARC_SHOT`): jagged jumps from the hit to two crystals, readable. Screenshots viewed; 0 page errors.
- Seen: after a fast teleport the ring toast lagged ("Entering the Kiln" shown in the Shoal): an artefact of
  simulating many frames in one evaluate (toasts run on real time), not a bug in play.
- Measured: outer vault rings over 30 seeds (both rings on 27, one ring on 3); base thrust 190 px/s vs top current 55.
- Specs: S-57a/b Rift, S-58 Flare Lock, S-59 Tide Lock (`07-Build-Specs-14.md`); S-56 note (Ward guards the core in
  both modes, ≤ 1.00 gate). Cut: cave-in, Lumen bloom (folded in), elites / wandering lode, new Spire puzzles. Q-031.
- `05` v1.4.38–v1.5.42 archived word for word (`archive/changelog-v1.4.38-v1.5.42.md`); `06` part 22 started.
- Smoke 547/547 (docs only; no new checks: no code changed).
