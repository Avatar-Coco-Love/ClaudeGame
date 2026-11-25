# 02 — Current Status & Next Step

_Last updated: 2026-11-25_ · **Session counter: 109** · **Version: v1.6.50** (session 109: Audit; rotation: 110 Build, 111 Build, 112 Design).
**Scope (D-119, `01`):** M1–M11 ✅ (v1.0 = M5, v1.5 = M10 world + biomes, v1.6 = M11 economy). The game keeps growing: M12 enemies + tools, M13 events + puzzles, M14 two-form bosses (1.9); `04-Roadmap-3.md`. Patch = PRs since 1.0.0 (D-105).

## What's real right now
- Static web game (vanilla JS modules, no build), deployed from `main` via GitHub Pages. Share image `og.png` (D-044).
- 256×256-cell procedurally generated world (seeded). Size is saved data (S-45, D-120): `World(seed, skip, size)`, `WORLD_PROFILES[size]` = rings / vaults / Anomaly counts; `WORLD_SIZE_NEW` 256 (S-46b2), old saves `_OLD` 160; size is required everywhere (D-125). Rings (S-46a, D-122): Hearth / Veil / Deep; a 256 world adds Shoal (d 80, ×2.2) / Kiln (d 104, ×2.6), 4 outer vaults, Anomalies [3,5,8,6,6]. Perf budget: `bigworld.cjs`. Cell types: rock, dense rock, crystal (→ Shards ◆), prism (→ Prisms ▲, farther out), Lumen (●), Tide ≈ / Calx ⬟ (Shoal / Kiln, S-49, D-135; spent on Overdrive), vault shell + cache, Spire shell / core / facet, and a bedrock border.
- Core movement: analog intent → target velocity → acceleration → axis-separated collision → realized velocity, plus corner assist so the core slides into 1-cell tunnels.
- Mining beam: grid raycast from the core's centre, damage over time, crack overlay, particles, and pickups that the Attractor pulls in.
- Cargo limit, auto-deposit inside the Nexus ring, and a Core Matrix with 6 upgrades (beam, range, thrust, cargo, attractor, integrity).
  Overdrive (S-50, D-140): a 256 world adds 2 levels past each max (`over`, `OVERDRIVE_COST` ◆ + ≈ + ⬟, `Game.topLevel`).
- Nexus tab: Radiance (5 levels, ▲, D-009): +96 px light / level. Chart (S-52, D-143, `chart.js`, 256 only): L1 ≈24 ▲10 minimap current arrows (explored Shoal chunks), L2 ⬟24 ▲10 seen vents, bright in the tell.
- Modes: Drift (calm) and Surge (Glitches that chase you, contact damage, cargo scatters where you fall and can be recovered, the Nexus repels Glitches and heals you).
  A Glitch stuck 6 s fades out (D-017); kills drop a Prism half the time (D-018).
  Spitters (S-32, D-096, `spitter.js`): 1 in 4 natural spawns at tier ≥ 2; hold 200 px, bolt every 2.2 s with a clear line (8 dmg, rock stops it, beam pops it).
- Weather (S-33, D-097, `weather.js`): every 300–420 s (seeded, unsaved), 40 s: Surge storm (spawns ×0.75, cap +2, violet dark),
  Drift aurora (Shard / Prism breaks in the core's light +1 at 40 %, teal dark, shimmer). Never in a Wake / the ending (the cut event is saved, D-117).
- Anomalies (S-35/36, D-099, D-101, `anomaly.js`): seed-only sites (3/5/8 by ring; a 256 world 28) in rock, kind 1/3 each: Overclock
  (beam ×1.5), Lodestone (reach ×2, pull ×1.5), Ballast (cargo ×1.5) via `stat()`; kinds stack; end when a deposit banks
  all cargo; recharge 300 s. Saved `anomalies` + `buffs` (format 15). Chip `#buffs`. Bot: `surgebot --anomaly`.
  S-37 (D-102): seen sites on the minimap (hollow while recharging), Scanner marks charged ones, end tone, hint line.
- Shoal / Kiln (S-47a/b, S-48a/b): Undertow, brittle glass, Kiln heat, flare vents (tell tone: audit 109, D-144). Detail: `08`.
- PWA (S-38, D-104): `manifest.webmanifest` + `icons/`, network-first `sw.js?v=VERSION` (cache `lumen-<VERSION>`, warmed
  from the first visit's loaded files), registered by `src/pwa.js` (not on `file:`/`?dev`); offline navigations ignore the query (D-105). Test `pwa.cjs`.
- Music (S-44, D-115, `music.js`): pad by ring + Drift bell / Surge pulse (equal RMS), Wake = root + pulse ×1.5,
  Ending fades out; Music slider (`settings.music`, default 50).
- Settings (S-3): volume, mute, shake, reduced motion in `lumencore.settings.v1`, apart from the world save (D-016, D-020); short landscape phones: two columns (D-118).
- Feel (S-4): deposit arpeggio, upgrade ring on the core + pip flash, 35 ms hitstop on yield-cell breaks (D-048 note), beam start sweep (D-021).
- Depth rings (S-8, D-028): Hearth < 24 / Veil 24–48 / Deep ≥ 48 cells; rock + dense ×1 / ×1.4 / ×2 hp, own palette, toast once per session, lower hum.
- Lumen ● (S-10) buys Research (S-11): Scanner ping (S-12), beam modes Wide / Pulse (S-13, S-14, S-21). Detail: `08`.
- Echo (S-42, D-112, `echo.js`, Research 30 ●): follows down a BFS field, blinks back when stranded, Gathers exposed ore
  at 0.5× beam dps; never saved beyond `research.echo`. `tests/echo.cjs`, bot `tools/echobot.mjs` (strands 0, ◆/min ×1.4 mid).
  Orders (S-43, D-113): R / ◇ cycles Gather ↔ Guard (0.8 hp / 0.8 s at the foe nearest the core ≤ 140 px); chip in the
  `#buffs` row; saved `echoOrder` (format 16). `tests/echoorder.cjs`; `ECHO=guard tools/wakeprobe.mjs` (no Wake cut).
- Crafting (S-16, `craft.js`): Beacons (light), Relays (remote deposit, S-22/S-34), Heat Sinks (S-51, D-141, `heatsink.js`: Kiln heat gain × 0.4 within 5 cells). Detail: `08`.
- Vaults (S-9), Spires (S-19/S-27/S-20/S-28: found, fed, facet puzzle), Wake (S-23/S-31), Ending (S-24), New Cycle (S-29). Detail: `08`.
- Darkness/light, minimap (160-cell window, D-123), Nexus pointer, toasts, audio held to `audio.cjs` ceilings. Detail: `08`.
- Graphics (S-41, D-109, `quality.js`): Settings → Auto / High / Low; Auto samples the frame gap (p90 over 3 s): > 24 ms
  steps down, < 18 ms for 10 s up. L1 DPR 1; L2 + half the particles drawn, no pickup glow, unsmoothed light. Sim unchanged.
  D-110: a step down that doesn't beat 0.85 × its p90 is undone and Auto stops stepping down (30 Hz caps); DPR ≤ 1 skips L1.
- Keys (S-39, D-106, `keys.js`/`keysui.js`): read by position (`e.code`, AZERTY-safe); Settings → Keys rebinds eleven
  actions (clash swaps, Esc cancels, Reset) into `settings.keys`; arrows/Esc/Enter/Tab fixed; labels follow the bindings.
- Text (S-40, D-107): every font size × `--ts` (Settings → Large text = 1.2); 12 px floor in play (title footer 11).
  `tests/colours.cjs`: must-tell-apart pairs ΔE ≥ 25 under 3 colour-blind sims, or a shape difference (Shard/Prism).
- Desktop (WASD + mouse), touch (twin sticks; a lifted stick adopts another canvas finger). Phones: touch hints, no key badges, every button ≥ 44 px, landscape ◎⟂♪≡ top row (S-17, D-050, D-058), glyph-only ◎ ⟂ ≤ 700 px wide (D-064). With ≈ / ⬟ the phone bank wraps 3 + 2 (D-137).
- Autosave to localStorage (world, economy, placed things, progress; `save.js`) every 10 s, on deposit, and on page hide. Saves carry a format number (now 21); old formats are upgraded on load (`src/save.js`); malformed fields load empty (B-037); no seed / unreadable map = no save (B-066); tests never pin the number (`saveformat.cjs`).
- History: `05` changelog, `06` decisions (D-xxx, part 20 from D-137), `03` questions (Q-xxx), `09` log (tail: `09-…-15`), `08` per-system detail. Bare "continue" = 3 orchestrated PRs, `10` (D-136).
- Seeded per draw (`game.rng.*`, D-025). Dev tools (S-7) `window.__lumen.dev.*` (`?dev`); one test server `tests/serve.cjs` (D-133); M2 rules (D-022…D-024); bots in `tools/`. Detail: `08`.
- Specs (1 PR each, D-063): S-1…S-52 built (M11 done). M12: S-53…S-56 (`07-…-12`, D-142). Code: Glitches `glitch.js`, HUD `hud.js`, grid `body.js` (D-053), light `light.js`, chunk paint `terrain.js` (pre-scaled to the screen, D-116); no file > 600 lines (`docs.cjs`).

## Verified / Health
- `node tests/smoke.cjs`: all passing (incl. `docs.cjs`, `audio.cjs`, `chart.cjs`).

## Next step (one thing)
Session 110 (Build): S-53 Burrower (`07-Build-Specs-12.md`, D-142); then S-54.
