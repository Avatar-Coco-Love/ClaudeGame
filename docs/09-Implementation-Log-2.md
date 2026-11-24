# 09 — Implementation Log, part 2

Continues `09-Implementation-Log.md` (split at the 8 KB cap, session 36). Newest at the bottom; read the tail only.

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

## 2026-11-24 — Session 40 (v0.2.44): Build — S-21 Pulse ready shot, `PULSE_GLITCH` 1.8
- A held full charge waits until a Glitch on the ray or a solid cell is within reach (`pulseInReach`, same foe test as the
  burst); let-go still fires into air; B-032's blur/hidden cancel unchanged (its audit 39 checks pass). The waiting reach line
  is solid at 60 % (viewed at 1280×800: dotted while charging, solid when full, no target, 2 s held).
- Probes before → after (all in D-059): standoff wave3 Beam 2 tier 3 Pulse 96 hp d20 → 32 hp d0 (Focus 96 d20); single
  tier 3 64 → 0; wave5 tier 0 Pulse 64 → 45 (Focus 0). KITE=1: Pulse within 2 hp of Focus or better at Beam 2–4. deeprun MODE=pulse median 43 →
  41 s; parity MODE=pulse Drift ▲ 13.5 → 13.1/min; Focus and Wide rows unchanged. D-054's prediction holds.
- 2 new checks in `tests/pulse.cjs`, both failed on the old code first (open-floor charge fired at 1.2 s; tier 3 left 0.47 hp).
  Smoke 139/139 (137 + 2). No bugs found.
