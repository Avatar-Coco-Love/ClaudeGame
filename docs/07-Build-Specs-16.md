# 07 — Build Specs, part 16: M14 Bosses, continued

Continues `07-Build-Specs-15.md` (plan D-158, rules there: one body, two forms, same reward, gate 0.8–1.25).

## S-61a — Gyre: lair, body, take-apart (Shoal boss) (M14)
**Save:** reuses `bosses` (format 23 from S-60a; add the Shoal entry, no bump).
- **Lair:** `lairSite(world, 3)`, salt `'lair-3'`, d `LAIR_D[3]` [88, 100], all in the Shoal ring, same clearances and
  stamp as the Crucible (core + 8 plates, same hp). Measured (Design 122, 30 seeds): a site on 30 / 30, by draw 2.
- **Whirlpool:** within `GYRE_R` 6 cells of the core the Undertow is replaced by a current of `GYRE_SPEED` 45 px/s,
  tangential, clockwise (calm draws don't apply here). Base thrust 190 px/s holds station; riding it carries you round.
- **Take-apart rule (Gyre):** one plate is the mint key (`BOSS_KEY_RGB` mint); only it takes beam damage. The key
  steps one plate clockwise every `GYRE_STEP_S` 1.2 s and keeps the damage each plate took. So you follow the key by
  riding the whirlpool round the body with the beam on it; standing still, a plate takes 3–4 laps (16 hp at 3.8–5.4 dps, 1.2 s of it per lap). The others spark.
- **Down:** as the Crucible, `BOSS_LOOT` with ≈ as the biome ore; toast "The Gyre is down"; the whirlpool stops
  (the chunk's own Undertow draw returns).
- **Interim:** Surge uses the take-apart rule until S-61b. Old 256 saves get the lair stamped (S-60a's upgrade rule).
- **Look:** core = mint ring with a turning inner hexagon; whirlpool dashes (the Undertow's, curved) within `GYRE_R`.
- Smoke: site rules; the key steps and keeps damage; only the key cuts; whirlpool only ≤ 6 cells and gone when down;
  Drift = Surge (interim). Probe: mid build takes it apart in ≤ 90 s (log in `09`). Screenshot viewed.

## S-61b — Gyre awake (Surge form) (M14)
**Save:** none new.
- **Surge:** awake within `BOSS_WAKE_R`: every plate cuts in any order and the key mark is hidden. It hits back: the
  whirlpool pulls inward too (radial `GYRE_PULL` 30 px/s on top of the 45 tangential), body contact deals
  `BOSS_TOUCH_DMG` 12 (knockback, as a Glitch hit), and every `GYRE_SWARM_S` 15 s it releases a mote swarm (S-54
  rules, at most 2 swarms alive). Death: as the Crucible (plates stay broken, the core heals).
- **Gate:** `bossrun.mjs --boss gyre`, same band and seed count. If it misses: tune the swarm gap first, then the pull.
- Smoke: any order only in Surge; pull and touch damage only in Surge; swarm cap; gate PASS.

## S-62 — Boss marks and the M14 close-out (→ v1.9)
**Save:** none new.
- The Chart (S-52) L2 also shows unseen lairs as a faint octagon (a reason to buy it, no new layer); a down boss is a
  filled octagon on the minimap. A low two-note sting when a boss wakes (Surge) or its first plate breaks (Drift),
  `audio.cjs` row. The ending's stats list "Bosses n / 2" on a 256 world (no line on 160; D-158: the ending does not
  require them).
- **Close-out:** `VERSION` minor → 1.9, `04-Roadmap-3` M14 ✅, `02` scope line; next milestone needs a design D-xxx.
- Smoke: Chart shows lairs only at L2; ending line only on 256; sting under ceiling. Screenshot viewed.
