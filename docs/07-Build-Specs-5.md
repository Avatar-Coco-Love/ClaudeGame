# 07 — Build Specs, part 5

Continues `07-Build-Specs-4.md` (same rules; build order in `07-Build-Specs.md`'s header, D-063). Written in Design 67
for **M7 Temporary upgrades** (D-098). Build order: S-35 → S-36 → S-37; S-37 ships M7 → v1.2 (D-046).
**Sinks:** none. An Anomaly costs nothing and gives no currency; it scales a Core Matrix stat until the next deposit.
**Layers (`01`):** a buff never unlocks a kind of thing (no beam mode, no Research node, no placed item): it only
multiplies an existing Matrix stat for a while, so it can't duplicate another layer.

## S-35 — Anomalies v1: sites, Overclock, ends at a deposit (M7) (D-098)
- **Sites:** seed-only (`rng['anomaly']`, like `vaultSites`): 16 per world, Hearth 3 / Veil 5 / Deep 8 (D-028 rings),
  each on a rock or dense cell, ≥ 12 cells from each other, outside the Nexus ring, vault footprints and Spire
  footprints. An Anomaly is an **entity, not a cell**: the world layout is unchanged (D-024), and it sits embedded in
  its cell until that cell is mined open. Drawn as a slow-turning hollow hexagram (Overclock: hot white-orange), faint
  through rock when inside the core's light, full once open. Never a literal object.
- **Take:** the core's centre within 0.6 cells of an open site's centre. Toast "Overclock — beam ×1.5 until you
  deposit", a rising tone, a ring burst. Effect: `game.stat('beam')` × `ANOMALY_BEAM_MUL` (1.5) — one hook in `stat()`
  (`buffMul(id)`), so mining and combat dps both follow; the beam core line draws warmer while it lasts.
- **Ends:** at the next deposit that banks ≥ 1 item (Nexus or Relay, `atDeposit()`), after the cargo is banked. Not on
  death (Drift can't die: parity, D-002), not on a mode switch, not on a timer. A second Overclock while one is active
  can't be taken (the site stays charged).
- **Recharge:** a taken site comes back `ANOMALY_RECHARGE_S` (300) of `stats.time` later. Saved: `anomalies` (site
  index → recharge time, only taken ones) and `buffs` (active ids). `SAVE_FORMAT` 15; 14 → 15 adds both empty.
- HUD: one chip per active buff under the cargo bar (glyph + name; glyph only ≤ 700 px wide), gone with a short flash
  at the deposit that ends it. Config: every number above in `src/config.js`.
- **Smoke (`tests/anomaly.cjs`):** same seed → same 16 sites; ring counts, spacing and exclusions over 20 seeds; can't
  take while its cell is solid; take → beam dps ×1.5; Nexus and Relay deposits end it, a deposit of 0 items and a death
  don't; recharge at 300 s; a v14 save loads with none taken; reload keeps buff + taken sites. One screenshot.

## S-36 — Lodestone and Ballast; bot-tuned (M7) (D-098)
- Each site's kind is drawn once from `rng['anomaly-kind']` (1/3 each, seed-only, not saved): **Overclock** (beam ×1.5),
  **Lodestone** (magnet reach ×2, pull ×1.5; violet), **Ballast** (cargo +50 %, rounded down; teal). Different kinds
  stack; the same kind can't be taken twice. Ballast ends after its deposit banks everything (never strands cargo
  over the base limit); on a death the cargo scatters as now and the limit stays raised until the next deposit.
- `surgebot`: `--anomaly=on|off` (default on): detours to a charged, open or 1-dig site within 20 path-seconds.
- **Tune** (mid, 12 seeds × 10 min, `mine` and `deep`, both modes): haul/min with ÷ without anomalies, each kind
  alone ≤ +20 %, all three ≤ +30 %, Drift ÷ Surge boost 0.8–1.25. Retune the multipliers, not the site count.
- **Smoke:** the three effects; stacking; Ballast deposit banks over-limit cargo; the bot ratio (6 seeds).

## S-37 — Anomalies found: map, ping, sound, touch (M7 → v1.2) (D-098)
- Minimap: a seen site (its cell was ever lit) shows as a small dot in its kind's colour; a recharging one is hollow.
- Scanner (S-11) ping marks charged sites within its 12 cells like vault caches (it reveals, unlocks nothing; Q-009
  stays ore-only for Glitches). Take / end tones bounded in `tests/audio.cjs` like every one-shot (D-039).
- Phones: the chips sit under the bank panel without touching the ◎ ⟂ ♪ ≡ row at 568×320 and 320×568; reduced motion
  stops the hexagram turning. Hint once: "Anomaly — touch it; it lasts until you deposit".
- **Smoke:** minimap dot states; ping includes a charged site, not a taken one; chip layout at 2 phone sizes (rect
  overlap check); audio bounds. Marks M7 ✅ → VERSION 1.2.
