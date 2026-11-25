# 07 — Build Specs, part 10

Continues `07-Build-Specs-9.md` (same rules). Design 97 (D-129) split S-48 in two and refined it from a Shoal / Kiln
play-test; **this text wins** over part 9 where they differ. Build order: S-48a (session 98) → S-48b (100; M10 done =
v1.5). Terms: the beam **overheats** (was "vents" in part 9); a **flare vent** is the Kiln floor site.
Measured basis (session 97, 8 seeds): a 256 world has ~13.9k Shoal cells (40.8 % under a current) and ~31.5k Kiln
cells (most in the corners past d 128; 2.1 % of them sit in a chunk whose centre is Shoal, so they flow too).

## S-48a — Kiln beam heat + phrygian music + the deep haul probe (M10) (D-129)
**Save:** none (heat is transient, like `damage`).
- **Heat** `game.heat` 0…1. Each frame the core's beam lands damage on cells, take `share` = (damage on Kiln-ring
  cells, by the hit cell's own `world.ring`) / (`stat('beam')` × dt), **capped at 1**. Heat += share × dt / `KILN_HEAT_S`
  (8 s); with no Kiln damage that frame it cools at 2 / `KILN_HEAT_S` per s. Focus, Wide and Pulse all go through this
  one rule (hook: the `world.hit` calls in `beam.js`), so Wide's extra cells and an Overclock Anomaly don't heat faster.
  The Echo's beam and Shoal cracks add no heat (they aren't the core's beam).
- **Overheat** at 1: intent stays on, the realized beam is off for `KILN_OVERHEAT_S` **1.2 s** (no damage, no Pulse
  charge, beam hum muted), a hiss, a ring flash on the core (off in reduced motion); then heat restarts at **0.25**.
  Steady Focus fire on Kiln rock overheats 1.2 / (6 + 1.2) = 17 % of the time. Same in Drift and Surge.
- **Arc:** past heat 0.3 a thin arc round the core, length ∝ heat, `HEAT_RGB` (warm white; an arc, so the shape tells it
  from Glitch orange and Anomaly amber); the hint line once per session: "Kiln rock heats your beam: let it cool".
- **Music:** `MUSIC_RING_MAX` 4; `MUSIC_SCALES[4]` phrygian `[0, 1, 3, 5, 7, 8, 10]`, progression `[0, 1, 0, 6]`, root a
  step below the Shoal's. `music.cjs`: Kiln × Drift / Surge within 3 dB; the clamp check moves to 4.
- **Probe:** `tools/haulrun.mjs` gains a third arg `D` (default 90, unchanged for `undertow.cjs`) and a `heat` toggle
  (`game.heat.off`-style dev flag, unsaved). `node tools/haulrun.mjs 20 3 116` runs the Kiln leg heat on vs off: median
  round trip ≤ **1.20×**, else lengthen `KILN_HEAT_S`. Log the number in `09`.
- **Audio:** the hiss in `tests/audio.cjs`: peak and > 2 kHz share under the existing one-shot ceilings.
- Smoke: 8 s ± 0.2 of steady Focus on Kiln rock reaches an overheat; heat cools at 2× when the beam is off or on
  non-Kiln rock (Deep rock adds nothing); during the 1.2 s the intent is on but no cell takes damage; heat restarts at
  0.25; a simulated 60 s of steady fire overheats 17 % ± 2 of the time; Wide and Overclock heat no faster than Focus;
  Drift = Surge; the Echo adds none; `toSave` keys unchanged. Screenshot of the arc in the Kiln, viewed.

## S-48b — Kiln flare vents (M10 done → v1.5) (D-129)
**Save:** none (seed-only sites, timing from `stats.time`, like Anomalies' placement).
- **Sites:** `ventSites(seed, w)`, salt `'vent'`, on Kiln-ring cells only: one per ~250 Kiln cells (~126 in a 256
  world), ≥ 6 cells apart, off vault / Spire / Anomaly footprints and off the bedrock border. Terrain is **not**
  changed (no new empties: a 256 save's layout stays as it was); a flare only matters where the core can be.
- **Cycle:** period 8 s, a seeded phase per site from the same stream. A 1 s tell (the hexagon outline brightens and
  pulses), then a flare of radius 2.5 cells for 0.6 s. A core inside when it fires is shoved straight out at
  `HURT_KNOCKBACK` and gains +0.4 heat (clamped; it can trigger an overheat). Once per flare. No damage, no cargo loss,
  no invulnerability window, either mode; Glitches, the Echo and pickups ignore flares.
- **Cost:** sites bucketed by chunk at world build; only sites within the view + 3 cells are updated or drawn
  (`bigworld.cjs` `new Game` budget unchanged at ≤ 150 ms). Drawn only on explored cells. Hidden during the Ending.
- **Look:** a small hexagon outline, `VENT_RGB` warm white; minimap: none (it's a hazard you read in place).
- **Close-out:** M10 done: `VERSION` minor → 1.5 (D-108), `04-Roadmap-3` M10 ✅, `02` scope line.
- Smoke: same seed → same sites, gaps ≥ 6, all in Kiln, none on a footprint; terrain hash of a 256 world unchanged by
  the feature; a flare shoves equally in Drift and Surge and never changes integrity or cargo; +0.4 heat; a core
  outside 2.5 cells is untouched; off-screen sites aren't stepped; nothing saved. Screenshot of a tell + flare, viewed.
