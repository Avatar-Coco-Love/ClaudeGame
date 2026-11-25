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


### D-147 — Q-030: the Burrower bites the hold in Drift; S-53c (session 112, design)
- Play-test (`biomefoe.mjs` with temporary, unshipped switches, 8 seeds × 10 min, top build): the gate is only moved by
  a cost taken *unrefunded at the strike*. The bot is never ore-limited (eaten ore is never missed) and kills a surfaced
  Burrower fast (a refunded loss comes back; Glitch loot is pure gain). Surge already has such a cost: the lunge.
- So Drift mirrors it: the Burrower heads for the core in both modes (same tell, same dodge); undodged, Surge takes 22
  hull, Drift loses 4 cargo items, most valuable first. Tunnel ore no longer fills the belly; gap 20–30 s. Result: Drift
  0.885 / Surge 0.906 (8 seeds), 0.928 / 0.889 (16): PASS. Spec S-53c (`07-Build-Specs-13.md`).
- Supersedes D-142's "in Drift it hunts ore (never touches the core)" for the Burrower: it still never damages or pushes
  the core in Drift; its appetite is the ore the core carries. Drift stays free of hostiles in the sense of D-002: no hull loss.
- Rejected (measured): gap only (Drift 1.03); no Glitch loot (Drift 1.00, breaks D-142's equal loot); bite refunded on
  drive-off (1.03, the bot always drives it off); bite near its ore target (0.99, the core is rarely within reach);
  ongoing bite while up (×0.81 with 3 + drip, harsher than Surge); heat on surfacing (a second vent, D-129's job).

### D-148 — S-53c build details (session 113, build)
- The bite crunch is the first non-oscillator sound: a 0.14 s lowpassed (260 Hz) noise buffer from a fixed LCG seed, so
  `audio.cjs` renders the same numbers each run. Rejected: a low triangle tone (reads as `hurt()`, the Surge hull hit).
- The gate result is recorded as the tool's line in `09` (spec allowed either), not a smoke check: 8 seeds × 2 modes ×
  2 runs add ~25 s to a 10+ min smoke and the bot route is noisier (±0.03) than a smoke check should be.
- Bite order is a fixed list `BITE_ORDER` (≈ ⬟ ▲ ● ◆) exported from `burrower.js`; the bite never touches the belly.

### D-149 — Blurred 'lighter' draws run under a clip; perf scenes per biome (session 114, audit)
- Any shadowBlur draw in a non-source-over composite is clipped to its shape's box padded by `R.glowPad(blur)` (2 × blur
  in canvas px, as world px at zoom × DPR < 1, + 2). Measured: 3.9 ms a draw unclipped vs 0.09 (B-091). Extends S-15's
  Nexus clip and B-027's glow sprites (D-051); `drawcost.cjs` checks it on real frames, so a new system with such a glow
  adds its scene there. Plain source-over blurs (core, Echo body, Spires) are cheap (0.15 ms) and stay as they are.
- `tools/perf.cjs` has a run per biome scene with its creatures (`kiln`); a new biome or foe adds one in its build PR.
- Rejected: glow sprites for vents / sites (their alpha and radius animate every frame: many sprite sizes); dropping
  the blur in 'lighter' (changes the look); a source check by regex (misses blur state set elsewhere, e.g. the Scanner).
