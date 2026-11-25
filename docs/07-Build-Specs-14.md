# 07 — Build Specs, part 14: M13 Events and puzzles

Continues `07-Build-Specs-13.md`. Same rules: one spec = one PR, numbers in `src/config.js`, each slice usable alone
(D-139). Plan: D-152. Build order: **S-56 (part 12) → S-57a → S-57b → S-58 → S-59** (M13 done = v1.8 with S-59).
**One face, both modes (D-152):** an M13 event or lock has the same rules in Drift and Surge. Surge's extra cost is the
Glitches on the way, Drift's is nothing more; the gate tool checks the two modes stay within 0.05 of each other.

## S-57a — Rift (world event) (M13)
**Save:** none (schedule from `stats.time` like weather, D-097; a reload mid-rift skips that rift: `k` starts past it).
- **When:** event k starts at the sum of k + 1 gaps `RIFT_EVERY_S` 240 + rand × 120 s (`rng['rift']`, own salt); it is
  open `RIFT_S` 45 s. A start that falls inside a weather event waits for the weather's end (still a pure function of
  seed and time). Never in a Wake or the ending (cancelled, as weather is); a 160 world has rifts too.
- **Where:** a 3 × 3 pocket centred on a ROCK / DENSE cell of the core's own ring, 8–12 cells from the core (draws from
  `rng['rift-site']`, up to 40 tries; no vault, Spire, Anomaly, bedrock, Nexus disc or open floor inside the 3 × 3).
  No site found = that rift is skipped quietly. The pocket's 9 cells become ore at open, keeping their old types in
  `rift.prev`.
- **Ore by ring (9 cells):** Hearth 6 Lumen ● + 3 crystal; Veil 6 crystal + 3 Lumen; Deep 6 prism + 3 Lumen;
  Shoal 6 Tide ≈ + 3 prism; Kiln 6 Calx ⬟ + 3 prism (absorbs the "Lumen bloom" candidate, D-152).
- **Close:** at 45 s every pocket cell still standing goes back to its `prev` type (`markDirty`), ore lost. A cell
  cracked but unbroken reverts whole. Same in both modes; a mode switch keeps the rift open.
- **Feel (this slice):** pocket cells shimmer violet-white (an alpha pulse on their edge, no blur), a toast "A rift
  opened nearby" each time, and a dot on the minimap while open. Pointer and tone come in S-57b.
- **Gate:** `tools/eventrun.mjs` (new): the mining bot of `biomefoe.mjs` (top build) runs 10 min per seed with rifts on
  and off, and detours to a rift within 12 cells. ◆-equivalent haul ratio on / off must be **1.04–1.12** in each mode,
  gap ≤ 0.05 (8 seeds, Deep and Kiln). If it misses, tune the pocket's ore count first, then the gap.
- Smoke (`rift.cjs`): schedule pure in seed + time and skips weather; site rules (ring, distance, no protected cells);
  ore by ring; close restores `prev` (cracked too); Drift = Surge; reload mid-rift skips it, nothing saved; a Wake
  cancels it; gate line in `09`. Screenshot of an open rift, viewed.

## S-57b — Rift pointer and tone (M13)
**Save:** none.
- An open rift off screen gets a small violet chevron at the screen edge (the Nexus pointer's code, its own colour),
  hidden once the pocket is on screen. The Scanner ping marks rift cells like ore (no new rule: they are ore).
- Open tone: a rising two-note glass chime; close tone: the same falling, softer. `audio.cjs` ceiling rows for both.
- Smoke: chevron only off screen, only while open; tones under ceiling; screenshot viewed.

## S-58 — Flare Lock (Kiln vault puzzle) (M13)
**Save:** none (seed-only: an outer vault whose centre is in the Kiln ring is a Flare Lock; an opened one stays open).
  Measured (Design 117, 30 seeds): the 4 outer vaults land in both rings on 27; 3 seeds get only one lock kind. Kept.
- Its shell is quenched: beam damage × 0 except in a **soft window**: the lock runs its own `VENT_PERIOD_S` 8 s cycle
  (phase from `rng['lock']` by vault index): 1 s tell (shell edge warms orange), then `LOCK_SOFT_S` 2 s where the shell
  takes × 1.5. At the window's start the lock flares like a vent: within `VENT_R` 2.5 cells it shoves the core and adds
  `VENT_HEAT` (no damage). So the puzzle: beam from 3+ cells out, in time with the cycle. Same in both modes.
- Outside the window a beam on the shell sparks (dull grey flecks), so the "× 0" reads as a rule, not a bug.
- Cache loot unchanged (`VAULT_LOOT`). A 160 world has no outer vaults, so no locks.
- Smoke: × 0 outside / × 1.5 inside the window; flare shove + heat only ≤ 2.5 cells; phase seeded; Drift = Surge; old
  save with an opened outer vault is untouched; screenshot of the warm tell, viewed. Probe: time to open with a top
  build ≤ 2× a plain vault's (log in `09`).

## S-59 — Tide Lock (Shoal vault puzzle) (M13 done → v1.8)
**Save:** none (seed-only: an outer vault whose centre is in the Shoal ring is a Tide Lock).
- The lock's chunk always has a current (a calm draw there becomes 40 px/s along a seeded heading, `LOCK_TIDE_MIN`;
  `UNDERTOW_SPEED` elsewhere unchanged). Its shell takes beam damage only when the beam points **against** the current
  (dot(beam, current) < −0.5): you cut it from downstream while the Undertow pushes you away. Other angles spark.
- The shell's upstream faces carry a faint mint chevron row showing the flow, so the rule is readable at a glance.
- **Close-out:** `VERSION` minor → 1.8, `04-Roadmap-3` M13 ✅, `02` scope line.
- Smoke: damage only against the current; the lock chunk is never calm; Drift = Surge; old save unchanged; screenshot
  viewed. Probe: time to open ≤ 2× a plain vault's. (Measured, Design 117: base thrust 190 px/s beats a 55 px/s
  current, so any build can hold station; the lock asks for reading the flow, not for a build.)
