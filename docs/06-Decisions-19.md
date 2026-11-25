# 06 — Decisions log, part 19

Continues `06-Decisions-18.md` (same rules: supersede, never edit; list rejected alternatives). D-130 on.

### D-130 — Kiln heat as built (session 98, S-48a)
- `src/heat.js` owns it: `heatHit` counts the core's beam damage on Kiln cells (called only from `castBeam` and
  `releasePulse`, so the Echo, Shoal cracks and Wake lanes add none); `updateHeat` runs once a frame after the beam,
  in every mode, so heat cools with the beam off. State `game.heat` + `game.heatState` (never saved); dev flag
  `heatState.off` for `haulrun`.
- An overheat skips the beam step entirely (the intent stays held): no rays, no facet aim, no Pulse charge.
- A Pulse burst counts by the same capped share, so one burst adds at most one frame's heat (dt / 8 s): Pulse
  effectively never overheats. Accepted: it already pays with its charge + recovery gaps (spec: one rule for all).
- The hint shows while heat > 0.3 until the first overheat ends, once per session (`heatState.taught`).
- Measured: `haulrun 20 3 116` median ×1.000 (mean ×1.016, max ×1.063, 18/20 pairs): straight-line legs dig few
  Kiln cells and cool between them. `KILN_HEAT_S` stays 8.
- Rejected: a heat field in the save (spec: transient); heat in `world.hit` (would make the Echo and cracks heat);
  an extra Pulse rule (heat per burst) — a second rule the spec chose not to have.

### D-131 — Audit 99: heat resets on a destabilize; B-086 closed with a guard (session 99, audit)
- `destabilize()` zeroes `game.heat` and any overheat / flash, like `beam.charge`: a respawn at the Nexus fires at once
  (B-087: it kept the Kiln's heat, so a core that died overheated came back with its beam held off). Check in `heat.cjs`.
- B-086 not reproduced: 12 seeded d 110 teleport runs (beam, moving), every cached chunk matched a fresh `paintChunk`
  (0 stale of ~360). Likely a measurement slip (`CELL` is 32 px; this audit's first probe divided by 16 and "found"
  ore that wasn't there). `tests/audit99.cjs` keeps the cache-vs-world comparison (it fails with the dirty repaint removed).
- The toast gets the panel's backing plate everywhere (it read poorly over lit terrain on phones).
- Rejected: heat kept through death (no reason to punish a respawn twice); keeping B-086 open without a repro.
