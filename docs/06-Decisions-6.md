# 06 — Decisions log, part 6

Continues `06-Decisions-5.md` (same rules: supersede, never edit; list rejected alternatives). D-052 on.

### D-052 — Pulse charge rules the spec left open (2026-11-24, session 35, S-14; builds on D-042)
- **Held fire auto-fires at full charge** (charge 1), then recovers 0.3 s and charges again; that is how "held fire waits, then
  charges again" and the spec's 10 s sustained check can work. Measured: a 10 s hold on rock = 0.72× Focus (the first 1.2 s
  charge counts against it); steady state 1.2 dps·s per 1.5 s = 0.8×.
- **A charge is dropped unfired** (no burst, no tick) by a mode switch (Q / ⟂), an open Matrix sheet, pause, and death. Only
  letting go of fire (mouse, Space, aim stick) releases it. The intent carries `cancel: true` for the sheet; `beam.charge` resets.
- **No continuous hum in Pulse:** `beam.on` stays false; the release thump (sine 150 → 70 Hz, peak −30 dBFS) and a fizzle
  tick (−42 dBFS) are measured in `tests/audio.cjs`. Charge is never saved; the mode is (no `SAVE_FORMAT` change: `research` and
  `beamMode` already take any id).
- **Pierce detail:** the burst stops on the face of a cell it cracks but can't break, on unmineable cells, and inside the third
  cell it breaks (`PULSE_PIERCE`); a Glitch past broken cells takes the rest × 1.6 (`src/beam.js` `releasePulse`).
- Rejected: holding at full charge until release (a held button would never fire, so held-fire bots and Space players get 0);
  firing on sheet open (opening the Matrix would shoot); a rising charge tone (one more continuous sound to bound, D-039).

### D-053 — Code split layout (2026-11-24, session 36, S-18; builds on D-048)
- `src/glitch.js` (`updateGlitches`; `game.updateEnemies` stays as a one-line delegate so tests and tools keep their call),
  `src/hud.js` (minimap, Nexus pointer, touch sticks; `renderer.setMini` delegates), and `src/body.js` (`collides`/`moveBody`,
  so glitch.js doesn't import game.js back). All Glitch numbers are `GLITCH_*` in `config.js`, plus `NEXUS_HEAL`.
- `ORE_KIND` (config) is the one ore → resource map: Scanner types, chunk ore glyphs, ping glyphs and minimap blips read it.
  Scanner text and the Research hint are built from `SCAN_RADIUS` / `LUMEN_D`.
- `tests/docs.cjs` fails any `src/*.js` or `tests/*.cjs` file over 600 lines (the CLAUDE.md split rule, now a check).
- Proof of no behaviour change: a 60 s scripted Surge run on 4 starts gives identical stats/digests, and a seeded scene
  screenshot is byte-identical before and after.
- Rejected: Glitch methods mixed into `Game.prototype` (hides where code lives); moving `drawLight` too (no need yet: 514 lines);
  keeping the spec's "unused `mat`" removal literal (`mat` is used; it now lives only in the yield branch).

### D-054 — Pulse is the standoff beam: ready shot + 1.8× on Glitches (2026-11-24, session 37, Design; settles Q-011; refines D-052)
- **Measured why it lost:** in the page, a held full charge auto-fired at a tier-1 Glitch 254 px away, outside its 216 px
  reach (Beam/Range 2), and it then reached the core during the 1.5 s cycle. `tools/standoff.mjs` (new; 20 angles per cell):
  standing vs waves of 3, Beam 2 tier 3, Focus and Pulse both die 20/20; Wide is worst in every fight (its job is harvest).
- **Retune (S-21):** full charge waits for something in reach (a Glitch on the ray or a solid cell) instead of firing into
  air; `PULSE_GLITCH` 1.6 → 1.8. Prototype (scratch copy of `src`): wave3 Beam 2 tier 3 → Pulse 32 hp lost, 0 deaths (Focus
  96 hp, 20); single tier 3 Beam 2 → 0 hp (Focus 32). Focus still wins swarms (wave5 Beam 2 tier 0: 0 vs 45 hp) and ties
  when kiting. Mining is unchanged (a wall is always in reach), so D-042's routes stand.
- **Q-011 answer:** no mode wins every route. Focus = travel, Prism hunts, swarms; Wide = crystal harvest; Pulse = standoff
  fights vs tough Glitches (and S-23's Spire lanes). Probes must include the standoff route from now on.
- Rejected: `PULSE_RANGE` 2.0 (reach wasn't the limit; the shot fired before the Glitch was in it); `PULSE_MUL` up (pushes
  mining past 0.9× Focus); an unlimited hold with no target check (D-052's reason: held-fire mining would never fire);
  a hold timer (one more number; a shot with nothing to hit is wasted anyway).

### D-055 — Relighting a Spire: feed 80▲, then a facet puzzle (Drift) or a Wake (Surge) (2026-11-24, session 37; settles Q-012)
- **Delivery:** 80▲ per Spire carried in cargo and fed inside its shell (400▲ for all 5; the Deep alone holds ~970▲). From
  cargo, not the bank, so the Prisms come from digging near the Spire. 100▲ (the old lean) left only ~475▲ spare after Relays.
- **Drift: facets.** 8 unmineable facet cells in the shell (added to S-19's shape); a beam tap toggles a facet and its two
  neighbours; all lit relights. 3–5 taps minimum, provably exact (8-ring Lights-Out is invertible). Beam-only, so every beam
  mode works, and no twitch skill.
- **Surge: the Wake.** Hold the primed Spire 40 s while Glitches come down 4 cleared lanes (S-23, tuned by the Surge bot).
  Same reward either way; the mode you are in at the Spire picks the path (D-045). Until S-23 ships, facets work in Surge too.
- **Reward:** a 260 px light, the minimap mark, the count toward the ending. No deposit or heal (Relays and the Nexus own those).
- Rejected: routing light through the gaps with mirror cells (needs beam reflection, a new system for one puzzle); a timing
  puzzle on the core's breath (twitch, not puzzle); Lumen delivery (~66● spare per world); feeding from the bank (no reason
  to mine near the Spire; a long empty trip).

### D-056 — Relays v1 and the build order to 1.0 (2026-11-24, session 37; supersedes D-048's order)
- Relay = crafted remote deposit (12▲ + 40◆, ≤ 3, d ≥ 24, 16 cells apart): banks like the Nexus ring but never heals,
  repels or sells, so the Nexus stays the one safe zone and Surge gets no perk. Placement reuses S-16's B / ✦ (`craft.last`).
- Order: S-15, S-21, S-16, S-19, S-22 (M4 done, v0.3), S-20, Surge bot runner, S-23, S-24 (v1.0). Design 42 settles Q-013.
- Rejected: Relays that heal (a second Nexus, a Surge perk); a Relay cost in Lumen (too scarce); a separate key per item.
