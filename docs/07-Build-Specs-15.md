# 07 — Build Specs, part 15: M14 Bosses (two forms)

Continues `07-Build-Specs-14.md` (M13: S-58, S-59 still to build first). Same rules: one spec = one PR, numbers in
`src/config.js`, each slice usable alone (D-139). Plan: D-158. Build order after S-59: **S-60a → S-60b → S-61a →
S-61b → S-62** (M14 done = v1.9 with S-62).
**Two forms, one body (D-158):** a boss has one lair, one body (a core cell ringed by 8 plates) and one reward. Drift
takes it apart by a rule (which plate cuts now); Surge fights it (any plate cuts, it hits back). The gate holds the
two forms' time to defeat within 0.8–1.25 of each other. A 160 world has no Shoal / Kiln, so no bosses.

## S-60a — Crucible: lair, body, take-apart (Kiln boss) (M14)
**Save:** `bosses` = [{ ring, down }] (format 23). Fight state is never saved: a reload restores every plate.
- **Lair (seed-only, drawn last):** `lairSite(world, ring)` with its own salt `'lair-4'`, up to `LAIR_TRIES` 60 draws
  at d `LAIR_D[4]` [108, 118]: a 9 × 9 footprint all in the Kiln ring, inside the border, ≥ 2 cells clear of every
  vault footprint, ≥ 3 cells from every vent and Anomaly, ≥ 6 from a Spire. It moves nothing else (vents, Anomalies,
  the old-save hash stay as they are). Measured (Design 122, 30 seeds): a site on 30 / 30, first found by draw 11.
- **Stamp:** the 9 × 9 becomes floor; its centre is `T.BOSS_CORE` (unmineable while a plate stands, then hp
  `BOSS_CORE_HP` 40), the 8 around it `T.BOSS_PLATE` (hp `BOSS_PLATE_HP` 16 each, no ring multiplier, no yield).
  Old 256 saves: the upgrade step stamps the lair into the saved map; a placed Beacon / Relay / Sink / Ward inside it
  is refunded to the bank; a core inside it moves to the Nexus. `down` bosses stamp as plain floor.
- **Take-apart rule (Crucible):** one plate glows ember (`BOSS_KEY_RGB`); only it takes beam damage. The others spark
  grey (Flare Lock's "× 0 reads as a rule" flecks). When the lit plate breaks, the glow passes to the plate opposite
  it plus one step clockwise (next = (i + 5) mod 8, which visits all 8 once; seeded start from `rng['crucible']`), so
  you cross the body each time.
- **Heat:** the core flares like a vent every `VENT_PERIOD_S` (1 s warm tell, then shove + `VENT_HEAT` within
  `BOSS_FLARE_R` 3 cells, no damage). Beam heat runs as anywhere in the Kiln, so a Heat Sink helps; beam from 3+ cells.
- **Interim (this slice only):** Surge uses the take-apart rule too, until S-60b. Same reward in both.
- **Down:** the core breaks → burst `BOSS_LOOT` { shard 80, prism 20, biome 24 (⬟ here) } as pickups, toast
  "The Crucible is down", `down = true`, the lair stays floor. A mode switch keeps plate damage and the lit plate.
- **Look:** core = ember octagon with a slow pulse (static under reduced motion); plates = dark rose with a bright
  edge; lit plate pulses. Minimap: a hollow octagon once seen, filled when down.
- Smoke (`boss.cjs`): site rules on 30 seeds, nothing else moves; only the lit plate takes damage, order = (i + 5) mod 8; core immune until the 8th plate; loot once; Drift = Surge (interim); old 256 save gets the lair (refund,
  core moved), a 160 save gets none; reload mid-fight restores plates. Probe: mid build (beam 5, range 3) takes it
  apart in ≤ 90 s (log in `09`). Screenshot viewed.

## S-60b — Crucible awake (Surge form) + `tools/bossrun.mjs` gate (M14)
**Save:** none new.
- **Surge:** the Crucible wakes when the core is within `BOSS_WAKE_R` 10 cells: every plate takes beam damage, in any
  order. It hits back: the core's flare every `BOSS_SURGE_FLARE_S` 4 s deals `BOSS_FLARE_DMG` 10 within 3 cells (on
  top of the shove), and every `BOSS_EMBER_S` 2 s it lobs an ember (the Spitter bolt: 8 dmg, rock stops it, the beam
  pops it) at the core when in line of sight within 10 cells. No Glitch spawns from it; weather / rifts never start
  while it is awake. A death in Surge: plates stay broken, the core heals to full (no grind, no free kill).
- **Drift** is unchanged (S-60a's rule). Mode switch: the awake state follows the mode at once.
- **Gate (`tools/bossrun.mjs`, `GATE_SEEDS` 8, D-155):** a bot with the top base build, a Heat Sink and 2 Wards
  starts 12 cells out and plays to "down" in each mode. Time ratio Surge / Drift **0.8–1.25**, Surge deaths median
  ≤ 1. If it misses: tune ember cadence first, then flare damage. Fewer seeds = no verdict. Gate line in `09`.
- Smoke: plates any order only in Surge; flare damage only in Surge and only ≤ 3 cells; ember hits and is blocked by
  rock; death heals the core and keeps broken plates; gate PASS. `audio.cjs` rows for the flare thump and ember.

## S-61a, S-61b, S-62
In `07-Build-Specs-16.md` (Gyre, the Shoal boss, and the M14 close-out).
