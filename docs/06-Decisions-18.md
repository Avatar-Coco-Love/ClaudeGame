# 06 — Decisions log, part 18

Continues `06-Decisions-17.md` (same rules: supersede, never edit; list rejected alternatives). D-124 on.

### D-124 — M10's last three specs refined from measurements (session 92, Design; amends S-46b2, S-47, S-48)
- Measured with the flip simulated (the served `config.js` rewritten to `WORLD_SIZE_NEW = 256`): `new Game` 256 = 67 ms
  median at 4× CPU (budget 150); the save is 22.8 KB and fixed-length, so "≤ 32 KB after explore all" holds by
  construction and is checked on a fully set save; at graphics High with Auto off, a frame at d 100 costs the same as
  at d 30 (0.94–0.99×). With Auto on, the probe swung ±40 %, so every perf check fixes the level and interleaves runs.
  Result: the flip needs no perf work; S-46b2 is checks + the flip + the audit 89 site-helper Debt (no `w` default, a
  missing size throws) + Ring 90 / 110 dev buttons. Specs in `07-Build-Specs-9.md`.
- **Undertow 30–55 px/s** (was 40–70): at 70 a level-0 core (190 px/s) lost 37 % heading upstream. The current eases
  over 0.5 s at chunk borders; the Echo ignores it. A new `tools/haulrun.mjs` measures the ≤ 15 % haul cost (the old
  spec named `deeprun`, which times a dig to Lumen, not a round trip).
- **Kiln heat 8 s, vent 1.2 s, restart 0.25** (was 6 / 1.5 / 0.4): the old numbers vent 1.5 / (3.6 + 1.5) = 29 % of
  steady fire, over the spec's own 20 % cap; the new ones vent 17 %. Flare vents keep ≥ 6 cells apart and off sites.
- Brittle: the crack deals 60 % of the neighbour's hp; if that breaks it, it yields normally and cracks nothing.
- Play-test (d 100 / d 115, 256 live): travel Nexus → d 110 is ~10 s straight at max thrust (~19 s at level 0); with
  3 Relays no fast travel is needed. Glitch tier caps at 3 (d ≥ 84), so Shoal / Kiln add no Surge-only difficulty.
- Rejected: lazy chunk generation now (Q-025 stays: 67 ms is under half the budget); an absolute frame-time check in
  smoke (software raster, vsync-quantised 33 / 50 ms frames: only ratios hold); a current that scales with thrust
  level (an upgrade that makes the hazard stronger reads as a punishment); keeping 6 s heat with a shorter vent (0.8 s
  is too short to read as a vent).
