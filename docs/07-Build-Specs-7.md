# 07 — Build Specs, part 7

Continues `07-Build-Specs-6.md` (same rules; build order in `07-Build-Specs.md`'s header, D-063). Written in Design 77
for **M9 Echo** (D-108), built after M8's S-41. Build order: S-42 → S-43 (built) → S-44 (ambient music, Design 82, M8).
**Sink:** 30 ● (Research). Supply ~141 ● per world; Research before this costs 75 ●, after it 105 ● (36 left).
**Layer:** Research only. **Save:** S-42 none (owning it is a Research id, already saved); S-43 adds `echoOrder`.

## S-42 — Echo v1: follow, keep up, Gather (M9) (D-108) — ✅ built (#87, D-112)
- `src/echo.js`. Research row `echo` (30 ●, after Pulse): "Echo: a lesser core that follows you and mines exposed ore".
- Body: radius 6 px, same axis-separated collision as the core (`body.js`); spawns on an open cell beside the core when
  researched and on load. Drawn as a hollow diamond (core colour, 0.8 alpha) + a 1 px tether line at 0.25 alpha.
- **Follow:** a distance field (BFS over open cells, 4-neighbour) from the core's cell, bounded to 24 cells, rebuilt
  every 0.5 s and when a cell within 24 cells breaks. The Echo steers down the field to a spot 1.5–3 cells from the core
  (its own speed = core max speed × 1.15, accel like the core; intent vs realized, pillar 5).
- **Blink:** field distance > 10 cells, outside the field, or < 4 px of progress toward the core in 1.5 s → fade out and
  reappear on the nearest open cell beside the core (0.25 s each way, no damage, a soft tone under `tests/audio.cjs`).
- **Gather (only order in S-42):** when the core has no beam target or is moving, pick the nearest ore cell (crystal,
  prism, Lumen) that is explored, touches an open cell and is within 5 cells of the core and in the Echo's line of sight;
  mine it at `ECHO_DMG` = 0.5 × the core's current beam dps (Matrix level counts), with a thin beam. Yield drops as normal
  pickups. Never targets rock, dense rock, vault shell or a Spire. Stops while cargo is full (no wasted drops).
- Pauses (holds still, no mining) during the Ending and inside the Nexus ring; works in a Wake and in both modes.
- Config: every number above in `src/config.js` (`ECHO_*`). Dev: `dev.echo()` grants it.
- **Smoke (`tests/echo.cjs`):** the row buys at 30 ● and only then shows the Echo; it follows through a carved L-bend
  without blinking; walling it off (dev seal) blinks it to the core within 2 s; it mines an exposed Shard but not rock
  next to it; same seed + input → same `stats` (its draws use their own salt, D-025). **Bot `tools/echobot.mjs`:**
  12 seeds × 10 min of `surgebot mine` routes: strand rate (> 10 cells for > 3 s) 0, median lag ≤ 3 cells, blinks per
  min recorded in `09`, ◆/min with vs without Echo in both modes (Drift ÷ Surge gain within 10 %).

## S-43 — Echo orders: Guard + the order button (M9) (D-108) — ✅ built (#88, D-113)
- Orders: **Gather** (S-42) and **Guard**. Guard: hold 1.5–3 cells from the core and fire a short bolt every 0.8 s at the
  nearest Glitch or Spitter bolt within 140 px of the core with a clear line (`clearShot`), 6 dmg (a tier-1 Glitch in
  3 hits); bolts are popped like the beam pops them. In Drift, Guard has nothing to shoot; the chip says "Guard (idle)".
- Control: one action `echoOrder` in the S-39 key list (default `KeyR`, free as of S-39; E is the Matrix); phone: one
  ≥ 44 px button ◇ in the ◎⟂♪≡ row that cycles the order (D-058 row fit at 320×568 and 568×320, glyph-only ≤ 700 px).
  The current order shows as a chip (`#buffs` row) and a toast on change. Hidden until researched.
- Save: `echoOrder` ('gather' | 'guard') in the world save → `SAVE_FORMAT` 16, upgrade step defaults to 'gather', bad
  value loads 'gather' (B-037). Old saves load (smoke check, D-005).
- Wake check: run `tools/wakeprobe.mjs` with Guard on; if the 40 s defence gets easier than the Drift facet puzzle's
  median time by more than 20 %, Guard's dmg drops inside a Wake (not off: the owner asked for defend).
- **Smoke:** cycling by key and by button; Guard kills a held Glitch, Gather ignores it; Guard pops a Spitter bolt;
  touch row fits with ◇ at both phone sizes; old save (format 15) loads with 'gather'.

## S-44 — Ambient music: a quiet generative bed by depth and mode (M8) (D-114)
**Sink:** none. **Layer:** none (a setting). **Save:** settings only (`music`, D-016 store); no `SAVE_FORMAT` change.
- `src/music.js`, Web Audio synthesis only (no files, no dependency). One `Music` object fed by `audio.js`'s context
  and its own gain node under `master` (so Volume and Mute apply); `update(dt, state)` from the frame loop with
  `state = { ring, mode, wake, ending }`. Nothing plays before the first gesture (the context unlocks there).
- **Pad (both modes):** 3 voices (sine + triangle, lowpass ≤ 900 Hz), one chord every 10–14 s, 3 s attack / 4 s
  release, from a short progression per ring: Hearth bright (major pentatonic), Veil modal (dorian), Deep dark (aeolian).
  The root drops `RING_PITCH_STEP` semitones per ring, like the beam hum (S-8).
- **Mode layer (equal weight, pillar 3):** Drift adds a soft sine bell (one note of the chord's scale every 3–7 s,
  0.8 s decay); Surge adds a low sine pulse on the chord root (~70 bpm, 0.2 s notes). Same level budget each.
- **Changes:** ring or mode change → crossfade the layers over 4 s at the next chord. Wake: bells stop, the pulse plays
  in both modes at ×1.5 rate, pad holds the root. Ending card: fade to silence over 3 s; back to play → fade in.
  Page hidden: the existing context handling covers it (no extra timers run while hidden).
- **Draws:** its own small PRNG seeded from the world seed + salt `'music'`; never `game.rng` (D-025: gameplay draws
  must not shift). Same seed + same state sequence → same note list.
- **Budget:** ≤ 6 live voices; every node stopped and disconnected after its release (count them in a test).
- **Settings:** a "Music" slider (0–100, default 50) under Volume, saved as `settings.music`; old settings without it
  load 50; 0 builds no nodes. Config: every number in `src/config.js` (`MUSIC_*`).
- **Smoke (`tests/music.cjs` + `audio.cjs` ceilings, D-037 measured not heard):** render 30 s offline for each of
  Hearth / Veil / Deep × Drift / Surge and a Wake at default Volume + Music: sustained RMS between −58 and −44 dBFS
  (a bed under one-shots, which peak ≤ −20), peak ≤ −30 dBFS, < 1 % energy > 2 kHz, no 50 ms window above
  −36 dBFS; Drift and Surge RMS within 3 dB of each other per ring; Music 0 → silent; voices ≤ 6 at every step;
  same seed → same first 20 notes; a ring change reaches the new chord set within 14 s; Ending → silent within 3.5 s;
  old settings load 50. The new test must fail with `music.js` stubbed out (prove once).
