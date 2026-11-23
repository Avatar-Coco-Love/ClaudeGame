# 07 — Build Specs

Specs ready to build, in roadmap order. Written by Design sessions. A Build session takes the top spec, builds it, deletes it here,
and marks the item ✅ in `04`. Numbers here are starting values; they go in `src/config.js`, never inline.
Measured basis (session 3, 40 seeds, see `09`): Shards in a world ≈ 2750◆ (1376 crystal cells × 2), maxing the Core Matrix costs 2482◆.
Prisms in a world ≈ 1470▲, the Core Matrix only takes 246▲. The first Prism is 32 cells out (it never spawns closer).

## S-1 — Nexus Development v1: Radiance (next Build)
- **Data:** `NEXUS_UPGRADES` in `config.js`, the same shape as `UPGRADES`. One entry: `radiance`, max 5,
  `value: l => 320 + 96 * l` (px of Nexus light; 320 today, 800 at max), cost **Prisms only** (D-009): `[6, 12, 20, 30, 45]` (113▲ total).
- **State:** `game.nexusLevels = { radiance: 0 }`, a `game.nexusLight()` getter. `render.js` light hole uses it instead of the hard-coded 320.
- **On purchase:** `world.reveal(nexus, nexusLight())` so the minimap visibly grows, a white ring burst from the Nexus, the upgrade sound.
- **What it does *not* do:** no change to the deposit radius or the Glitch repel radius (that would make it a Surge-only safety buff, D-002).
- **UI:** the Core Matrix sheet gets two tabs, **Core** and **Nexus**. Tabs are buttons (≥ 40 px tall, touch-safe), and the last tab is remembered per session.
  Prism cost shows with the ▲ glyph only (no ◆0). At 320 px wide both tabs and the buy button must fit without clipping.
- **Save:** `SAVE_FORMAT` 1 → 2. Step: `save.nexus = { radiance: 0 }`. Never strand a format-1 save (D-005).
- **Smoke checks:** buying Radiance spends Prisms and not Shards. `nexusLight()` grows by 96. A format-1 save (no `nexus`) loads with radiance 0.
  Reload keeps the level.
- **Done =** before/after screenshots at the Nexus (deviceScaleFactor 1) show a visibly larger lit area and a larger explored disc on the minimap.

## S-2 — Touch-first hints + narrow screens (B-001, B-002)
- `input.usingTouch` starts as `matchMedia('(pointer: coarse)').matches`, so a phone shows touch hints before the first touch.
- Hide the `E` key badge on the Core Matrix button while `usingTouch` is true.
- Title wordmark: shrink the clamp minimum / letter-spacing so "LUMEN CORE" fits at 320 px.
- **Smoke:** a 320×568 page where no element in `#hud`, `#title`, `#matrix` has `scrollWidth > clientWidth` (excluding the deliberate ellipsis hint),
  and the Pixel 7 first hint mentions "thumb". Prove both fail on the old code first.

## S-3 — Settings panel
- Opened from the ≡ button. Toggles: volume slider (0–100, default 70), screen shake on/off, reduced motion (off by default, follows
  `prefers-reduced-motion` on first run), and "Reset world" behind a confirm step that names what is lost.
- Settings are stored under their own key (`lumencore.settings.v1`), not in the world save, so resetting a world keeps them.
- **Smoke:** shake off → `game.shake` stays 0 after a Glitch kill. Reset world → new seed, bank 0, settings kept.

## S-4 — Feel pass (after S-3, so every effect ships with its off switch)
- Deposit: a rising 3-note arpeggio (one note per resource kind deposited, max 3) and the bank number counts up over 0.4 s.
- Upgrade bought: a 0.4 s expanding ring on the core plus a brief brightening of the matching pip row.
- Cell break: 35 ms hitstop on crystal/prism breaks only, at most once per 150 ms (rock breaks are too frequent for it).
- Beam start: a 0.12 s rising sine sweep, not repeated while the beam stays on.
- Reduced motion turns off hitstop, rings and shake; sounds stay.

## S-5 — Deterministic gameplay RNG (tooling, before the Surge bot runner)
- Replace `mulberry32(seed ^ Date.now())` with per-system streams: `rng('pickup')`, `rng('glitch-spawn')`, `rng('glitch-wander')`,
  each `mulberry32(hash(worldSeed, salt))`. Visual-only randomness (particles) may stay on `Math.random`.
- **Smoke:** two games on the same seed with the same scripted input produce the same pickups and Glitch spawns.
