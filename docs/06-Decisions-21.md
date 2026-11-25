# 06 — Decisions log, part 21

Continues `06-Decisions-20.md` (part 20 neared the 8 KB cap at D-144; same rules: supersede, never edit; list rejected
alternatives). D-145 on.

### D-145 — S-53 split; how the Burrower reads the spec (session 110, build)
- S-53a = the creature (both modes, tell, loot, tunnels); S-53b = its rumble (`audio.cjs` row) and the `biomefoe.mjs`
  Kiln gate with any tuning it asks for. Each slice plays end to end (D-139).
- It surfaces in its own cell (≤ 2 cells from the core, Chebyshev), not teleported beside the core; the lunge is the
  hit at that moment if the core moved < 1.5 cells since the tell began. Contact re-hits use `GLITCH_HIT_CD_S`.
- It may cross open floor (drawn there, not hittable) so a cavern does not strand it; a trip > 25 s gives up, > 24
  cells from the core it leaves. Tunnel cells go through `world.destroy`, so they are saved as broken cells.
- Loot "what it ate this trip" applies to a Surge kill too, so a kill and a drive-off pay the same (Drift = Surge).
- Rejected: a pathfinder (BFS per step; greedy + a seeded random step is enough in rock); tunnelling without the broken
  bit (tunnels would refill on load); a Drift-only belly (Surge kills would pay less).

### D-146 — S-53b: the rumble and how `biomefoe.mjs` measures (session 111, build)
- Rumble = one held drone on the music bus (Music slider applies), built on first use: sine 52 Hz + triangle ×1.5,
  lowpass 240, 6 Hz wobble (depth 0.35); level 0.5…1 by closeness within 4 cells, 0.5 s ramps (`MUSIC_RUMBLE`). Ceiling in `audio.cjs`.
- Gate bot = surgebot mine route at base max, anomalies + weather off, 10 min from a cleared pad mid-ring with a Relay
  on it, mining only that ring's ore; a surfaced Burrower is a foe in both modes. Haul = ◆-eq banked + carried
  (◆ 1, ▲ ● 4, ≈ ⬟ 12: Overdrive L1 prices 120 ◆ ≈ 5 + 5 of them). Ratio = sum with / sum without over seeds.
- The gate fails as specced (Drift 1.01, Surge 1.00, 8 seeds): no retune here; Q-030 goes to Design 112 with the table
  in `09` (D-139: this slice still plays end to end). Rejected: retuning by build-session guess (each knob moved the
  two modes apart); banking instantly (Relay is what a top-build player uses); a rumble as an Audio one-shot (it is held).

