# 02 — Current Status & Next Step

_Last updated: 2026-11-26_ · **Session counter: 148** · **Version: v1.10.89** (148: Build, S-71a; next 149 Audit).
**Scope (D-119, `01`):** M1–M15 ✅ (v1.0 = M5, v1.5 = M10, v1.6 = M11, v1.7 = M12, v1.8 = M13, v1.9 = M14 two-form bosses, v1.10 = M15 Nexus reaches out: Lens ▲ sink + rings, D-175…D-179). Next (D-181, `04-…-5`): M16 Echo (`07-…-19`), M17 Hunters (`07-…-20`), M18 Feats (`07-…-18`). Patch = PRs since 1.0.0 (D-105).

## What's real right now
- Static web game (vanilla JS modules, no build), deployed from `main` via GitHub Pages. Share image `og.png` (D-044).
- 256×256-cell procedurally generated world (seeded). Size is saved data (S-45, D-120): `World(seed, skip, size)`, `WORLD_PROFILES[size]` = rings / vaults / Anomaly counts; `WORLD_SIZE_NEW` 256 (S-46b2), old saves `_OLD` 160; size is required everywhere (D-125). Rings (S-46a, D-122): Hearth / Veil / Deep; a 256 world adds Shoal (d 80, ×2.2) / Kiln (d 104, ×2.6), 4 outer vaults, Anomalies [3,5,8,6,6]. Perf budget: `bigworld.cjs`. Cell types: rock, dense rock, crystal (→ Shards ◆), prism (→ Prisms ▲, farther out), Lumen (●), Tide ≈ / Calx ⬟ (Shoal / Kiln, S-49, D-135; spent on Overdrive), vault shell + cache, Spire shell / core / facet, and a bedrock border.
- Core movement: analog intent → target velocity → acceleration → axis-separated collision → realized velocity, plus corner assist so the core slides into 1-cell tunnels.
- Mining beam: grid raycast from the core's centre, damage over time, crack overlay, particles, and pickups that the Attractor pulls in.
- Cargo limit, auto-deposit inside the Nexus ring, and a Core Matrix with 6 upgrades (beam, range, thrust, cargo, attractor, integrity).
  Overdrive (S-50, D-140): a 256 world adds 2 levels past each max (`over`, `OVERDRIVE_COST` ◆ + ≈ + ⬟, `Game.topLevel`).
- Nexus tab: Radiance (5 levels, ▲, D-009): +96 px light / level. Chart (S-52, D-143, `chart.js`, 256 only): L1 ≈24 ▲10 minimap current arrows (explored Shoal chunks), L2 ⬟24 ▲10 seen vents, bright in the tell.
  Lens (S-63, D-176, ▲ 40, all sizes): C / ❖ (D-177) calls a rift for ▲ 30 (150 s cooldown, unsaved; own site stream). Gate S-64 PASS (D-178, `eventrun --call`). `08-…-2`.
  Rings (S-65, D-179, `nexusview.js`): one unblurred hexagon per structure built, Lens dim on cooldown; a Nexus buy flashes at the Nexus.
- Modes: Drift (calm) and Surge (Glitches that chase you, contact damage, cargo scatters where you fall and can be recovered, the Nexus repels Glitches and heals you).
  A Glitch stuck 6 s fades out (D-017); kills drop a Prism half the time (D-018).
  Spitters (S-32, D-096, `spitter.js`): 1 in 4 natural spawns at tier ≥ 2; hold 200 px, bolt every 2.2 s with a clear line (8 dmg, rock stops it, beam pops it).
- Rift (S-57a, D-156, `rift.js`): every 240–360 s (waits out weather), 45 s, a 3 × 3 rock pocket 8–12 cells out in the core's ring turns to ore (×2 yield; Shoal / Kiln 3 + 6 ▲), reverts unmined; unsaved, both modes; shimmer, minimap dot, toast; S-57b (D-157): edge chevron while off screen, open / close chimes. Gate PASS (D-156). `08`.
- Locks (`lock.js`, `world.hitMul`): Flare (S-58, D-159, Kiln outer vault: shell × 0, × 2 in the last 3 s of 8 s) / Tide (S-59, D-162, Shoal: only against the flow).
- Crucible (S-60a, D-163, `boss.js`): seed-only Kiln lair stamped by the Game; only the lit plate of 8 cuts, then (i + 5) mod 8; core flares; saved `bosses` [{ ring, down }]. B-095 fixed (D-164).
  Surge (S-60b1, D-165): awake ≤ 10 cells: any plate, 4 s flare + 10 dmg, embers; death heals the core. Gate `bossrun.mjs` PASS (S-60b2, D-167). Q-033 closed (D-169).
- Gyre (S-61a, D-168, `gyre.js`): Shoal lair, whirlpool 45 px/s ≤ 6 cells (`flowAt`); mint key steps clockwise / 1.2 s.
  Surge (S-61b, D-171): any plate; tagged mote swarms / 15 s (≤ 2, `spawnSwarm`), rim 12 dmg / 4 s (≤ 8 px), pull 30; gate `--boss=gyre` PASS.
  Perf (D-174): `perf.cjs` run `gyre`; only the core ring is blurred, rim tell = strokes (1.33× → ~1.1× of shoal).
  Marks (S-62, D-173): Chart L2 shows unseen lairs faint; sting on wake / first Drift plate; ending "Bosses n / 2" (256). Q-034: no.
- Weather (S-33), Anomalies (S-35…37, saved), Echo (S-42/43, `echo.js`; S-69, D-184: Mine / Defend / Auto, new = Auto; S-70, D-185: upgrades, `echolevels.js`; probe D-186; S-71a `echobot --orders`, D-187): `08-…-2`.
- Shoal / Kiln (S-47a/b, S-48a/b): Undertow, brittle glass, Kiln heat, flare vents (tell tone: audit 109, D-144). Detail: `08`.
- Burrower (S-53a/b/c, D-145…148, `burrower.js`): Kiln creature, every 20–30 s, hunts the core; Surge lunge 22 / Drift bites 4 cargo; unsaved. Gate `biomefoe.mjs` PASS (`GATE_SEEDS` 8, D-155).
- Motes (S-54, D-150, `mote.js`): Shoal swarm of 6, 40–60 s, ride the current; Surge 4 dmg, a touch takes 1 item, Drift carries loose ore; gate PASS.
- PWA (S-38), Graphics Auto / High / Low (S-41), rebindable Keys (S-39), Large text + colour-blind pairs (S-40): `08`.
- Music (S-44, D-115, `music.js`): pad by ring + Drift bell / Surge pulse (equal RMS); slider `settings.music` 50.
- Settings (S-3): volume, mute, shake, reduced motion in `lumencore.settings.v1`, apart from the world save (D-016, D-020); short landscape phones: two columns (D-118).
- Feel (S-4, D-021): deposit arpeggio, upgrade flash, hitstop, beam sweep.
- Depth rings (S-8, D-028): Hearth < 24 / Veil 24–48 / Deep ≥ 48 cells; rock + dense ×1 / ×1.4 / ×2 hp, own palette, toast once per session, lower hum.
- Lumen ● (S-10) buys Research (S-11): Scanner ping (S-12), beam modes Wide / Pulse / Arc (S-13, S-14, S-21, S-55: `arc.js`, 0.8× ray + 2 jumps × 0.5 to the same kind ≤ 2 cells, D-151). Detail: `08`.
- Crafting (S-16, `craft.js`): Beacons (light), Relays (remote deposit, S-22/S-34), Heat Sinks (S-51, D-141, `heatsink.js`: Kiln heat gain × 0.4 within 5 cells),
  Wards (S-56, D-153/154, `ward.js`: ▲8 ◆30, 1.2 hp / 0.8 s at the nearest creature ≤ 4 cells; no loot). `08`.
- Vaults (S-9), Spires (S-19/S-27/S-20/S-28: found, fed, facet puzzle), Wake (S-23/S-31), Ending (S-24), New Cycle (S-29). Detail: `08`.
- Darkness/light, minimap (D-123), Nexus pointer, toasts, audio ceilings (`audio.cjs`). `08`.
- Desktop (WASD + mouse), touch (twin sticks; a lifted stick adopts another canvas finger). Phones: touch hints, no key badges, every button ≥ 44 px, landscape ◎⟂♪≡ top row (S-17, D-050, D-058), glyph-only ◎ ⟂ ≤ 700 px wide (D-064). With ≈ / ⬟ the phone bank wraps 3 + 2 (D-137).
- Autosave to localStorage (world, economy, placed things, progress; `save.js`) every 10 s, on deposit, and on page hide. Saves carry a format number (now 25); old formats are upgraded on load (`src/save.js`); malformed fields load empty (B-037); no seed / unreadable map = no save (B-066); tests never pin the number (`saveformat.cjs`).
- History: `05` changelog, `06` decisions (D-xxx, part 28 from D-187; last D-187), `03` questions (Q-xxx), `08` + `08-…-2` system detail, `09` log (tail: `09-…-21`), `08` per-system detail. Bare "continue" = 3 orchestrated PRs, `10` (D-136).
- Seeded per draw (`game.rng.*`, D-025). Dev tools (S-7) `window.__lumen.dev.*` (`?dev`); one test server `tests/serve.cjs` (D-133); M2 rules (D-022…D-024); bots in `tools/`. Detail: `08`.
- Specs (1 PR each, D-063): S-1…S-65, S-69, S-70, S-71a built (M15 done, `07-…-17`). Next: S-71b (M16 gate after Q-040, `07-…-19`), S-72…S-74 (M17), S-66…S-68 (M18). Code: Glitches `glitch.js`, HUD `hud.js`, grid `body.js` (D-053), light `light.js`, chunk paint `terrain.js` (pre-scaled to the screen, D-116); a blurred 'lighter' draw is clipped (`R.glowPad`, D-149); no file > 600 lines (`docs.cjs`).

## Verified / Health
- `node tests/smoke.cjs`: all passing, ~500 s (gates beside it, TIME lines; D-166; Lens gate `eventrun --call` ~95 s). Perf: `tools/perf.cjs` (`VP=phone`, D-160).
  Swallowed test waits: `node -r ./tools/waitprobe.cjs` (D-172).

## Next step (one thing)
Audit (149) per `CLAUDE.md` (B-103 check queued, `04-…-4`). Then S-71b: settle Q-040 (D-187), wire the gate.
