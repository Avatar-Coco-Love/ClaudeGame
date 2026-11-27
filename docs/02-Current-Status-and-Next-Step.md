# 02 — Current Status & Next Step

_Last updated: 2026-11-27_ · **Session counter: 162** · **Version: v1.11.103**
**Scope (D-119, `01`):** M1–M15 ✅ (v1.0 = M5 … v1.9 = M14 bosses, v1.10 = M15 Lens + rings, D-175…D-179; v1.11 = M16 Echo minds, D-184…D-189). Next (D-181, `04-…-5`): M17 Hunters (`07-…-20`; S-72, S-73a/b, S-74a, S-74b1 built; S-74b2 specced, D-202: pooled cost gate), S-75 / S-76 (`07-…-21`), M18 Feats (`07-…-18`). Patch = PRs since 1.0.0 (D-105). Audit 159: 02 capped at 7 KB (D-199); move detail to `08-…-2` before it grows.

## What's real right now
- Static web game (vanilla JS modules, no build), deployed from `main` via GitHub Pages. Share image `og.png` (D-044).
- 256×256-cell procedurally generated world (seeded). Size is saved data (S-45, D-120): `World(seed, skip, size)`, `WORLD_PROFILES[size]` = rings / vaults / Anomaly counts; `WORLD_SIZE_NEW` 256 (S-46b2), old saves `_OLD` 160; size is required everywhere (D-125). Rings (S-46a, D-122): Hearth / Veil / Deep; a 256 world adds Shoal (d 80, ×2.2) / Kiln (d 104, ×2.6), 4 outer vaults, Anomalies [3,5,8,6,6]. Perf budget: `bigworld.cjs`. Cell types: `08-…-2`.
- Core movement: analog intent → target velocity → acceleration → axis-separated collision → realized velocity, plus corner assist so the core slides into 1-cell tunnels.
- Mining beam: grid raycast from the core's centre, damage over time, crack overlay, particles, and pickups that the Attractor pulls in.
- Cargo limit, auto-deposit inside the Nexus ring, and a Core Matrix with 6 upgrades (beam, range, thrust, cargo, attractor, integrity).
  Overdrive (S-50, D-140): a 256 world adds 2 levels past each max (`over`, `OVERDRIVE_COST` ◆ + ≈ + ⬟, `Game.topLevel`).
- Nexus tab: Radiance (5 levels, ▲, D-009): +96 px light / level. Chart (S-52, D-143, `chart.js`, 256 only): L1 ≈24 ▲10 minimap current arrows (explored Shoal chunks), L2 ⬟24 ▲10 seen vents, bright in the tell.
  Lens (S-63, D-176, ▲ 40, all sizes): C / ❖ (D-177) calls a rift for ▲ 30 (150 s cooldown, unsaved; own site stream). Gate S-64 PASS (D-178, `eventrun --call`). `08-…-2`.
  Rings (S-65, D-179, `nexusview.js`): one unblurred hexagon per structure built, Lens dim on cooldown; a Nexus buy flashes at the Nexus.
- Modes: Drift (calm) and Surge (Glitches that chase you, contact damage, cargo scatters where you fall and can be recovered, the Nexus repels Glitches and heals you).
  A Glitch stuck 6 s fades out (D-017); kills drop a Prism half the time (D-018).
- Ring foes, events and bosses (detail moved word for word to `08-…-2` in audit 159): Spitters (S-32), Rift (S-57), Locks (S-58/59), Crucible (S-60), Gyre (S-61), Burrower (S-53), Motes (S-54); M17 hunters in `game.hunters`: Tracer (S-72, `hunter.js`, `flow.js`), Pincer pair (S-73a/b, `pincer.js`); Drift touch takes 24 ◆-worth, Surge kills pay no loot (S-74b1, D-201); the Echo reads the same `coreField` (D-198).
- Weather (S-33), Anomalies (S-35…37, saved), Echo (S-42/43, `echo.js`; S-69, D-184: Mine / Defend / Auto, new = Auto; S-70, D-185: upgrades, `echolevels.js`; S-71 gate `echobot --orders` in smoke, D-187 / D-189): `08-…-2`.
- Shoal / Kiln (S-47a/b, S-48a/b): Undertow, brittle glass, Kiln heat, flare vents (D-144). `08`.
- PWA (S-38), Graphics Auto / High / Low (S-41), rebindable Keys (S-39), Large text + colour-blind pairs (S-40): `08`.
- Music (S-44, D-115, `music.js`): pad by ring + Drift bell / Surge pulse (equal RMS); slider `settings.music` 50.
- Settings (S-3): volume, mute, shake, reduced motion (`lumencore.settings.v1`, D-016, D-020); short landscape: 2 columns (D-118).
- Feel (S-4, D-021): deposit arpeggio, upgrade flash, hitstop, beam sweep. Depth rings (S-8, D-028): Hearth < 24 / Veil 24–48 / Deep ≥ 48 cells; rock + dense ×1 / ×1.4 / ×2 hp, own palette, toast, lower hum.
- Lumen ● (S-10) buys Research (S-11): Scanner ping (S-12), beam modes Wide / Pulse / Arc (S-13, S-14, S-21, S-55: `arc.js`, 0.8× ray + 2 jumps × 0.5 to the same kind ≤ 2 cells, D-151). Detail: `08`.
- Crafting (S-16, `craft.js`): Beacons (light), Relays (remote deposit, S-22/S-34), Heat Sinks (S-51, D-141, `heatsink.js`: Kiln heat gain × 0.4 within 5 cells),
  Wards (S-56, D-153/154, `ward.js`: ▲8 ◆30, 1.2 hp / 0.8 s at the nearest creature ≤ 4 cells; no loot). `08`.
- Vaults (S-9), Spires (S-19/S-27/S-20/S-28: found, fed, facet puzzle), Wake (S-23/S-31), Ending (S-24), New Cycle (S-29). Detail: `08`.
- Darkness/light, minimap (D-123; tap / N: map, D-191), Nexus pointer, toasts, audio ceilings. `08`.
- Desktop (WASD + mouse), touch (twin sticks; a lifted stick adopts another finger). Phones: no key badges, buttons ≥ 44 px, landscape ◎⟂♪≡ top row, glyph-only ◎ ⟂ ≤ 700 px (D-050, D-058, D-064); bank wraps 3 + 2 (D-137).
- Autosave to localStorage (world, economy, placed things, progress; `save.js`) every 10 s, on deposit, and on page hide. Format number (now 25), old formats upgraded on load; malformed fields load empty (B-037); no seed / unreadable map = no save (B-066); tests never pin the number (`saveformat.cjs`).
- History: `05` changelog, `06` decisions (D-xxx, part 30 from D-200; last D-202), `03` questions (Q-xxx), `08` + `08-…-2` system detail, `09` log (tail: `09-…-22`), `08` per-system detail. Bare "continue" = 3 orchestrated PRs, `10` (D-136).
- Seeded per draw (`game.rng.*`, D-025). Dev tools (S-7) `window.__lumen.dev.*` (`?dev`); one test server `tests/serve.cjs` (D-133); M2 rules (D-022…D-024); bots in `tools/`. Detail: `08`.
- Specs (1 PR each, D-063): S-1…S-65, S-69…S-74b1 built. Next: S-74b2 (M17, `07-…-20`), S-75, S-76 (`07-…-21`), S-66…S-68 (M18). Code: Glitches `glitch.js`, HUD `hud.js`, grid `body.js` (D-053), light `light.js`, chunk paint `terrain.js` (pre-scaled to the screen, D-116); a blurred 'lighter' draw is clipped (`R.glowPad`, D-149); no file > 600 lines (`docs.cjs`).

## Verified / Health
- `node tests/smoke.cjs`: all passing, ~500 s (gates beside it, TIME lines; D-166). Perf: `tools/perf.cjs` (`VP=phone`, D-160; `pack` = hunters + a Pincer pair, 1.00× of `deep`, audit 159).
  Test New World: `newWorld` (`pinworld.cjs`, pinned, D-188).
  Swallowed test waits: `node -r ./tools/waitprobe.cjs`.

## Next step (one thing)
Build 163: S-74b2 (`07-…-20`, D-202) in its order: B-108 (Deep Surge hauls more with hunters), hull debt + pooled
gate + floor in `huntrun.mjs`, tune (damage tier cap, then the take), B-109 (a thief that never gets away). M17 → 1.12.0.
